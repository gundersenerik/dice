import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/server';
import { createPortkeyClient } from '@/lib/portkey/client';
import { getModelConfig, calculateCost } from '@/lib/portkey/models';
import { getPromptById, compilePrompt, getModelsFromConfig } from '@/lib/langfuse/prompts';
import { getLangfuse, flushLangfuse } from '@/lib/langfuse/client';

const GenerateRequestSchema = z.object({
  templateId: z.string().min(1),
  variables: z.record(z.string(), z.string()),
  // Model is now optional - will use prompt config if not provided
  model: z.string().min(1).optional(),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const traceId = uuidv4();
  let generationId: string | null = null;

  try {
    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const validationResult = GenerateRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { templateId, variables, model: requestedModel } = validationResult.data;

    // Fetch template from LangFuse
    const template = await getPromptById(templateId);
    if (!template) {
      return NextResponse.json(
        { error: `Template not found: ${templateId}` },
        { status: 404 }
      );
    }

    // Determine model: use requested model, or first model from prompt config
    const configModels = getModelsFromConfig(template.config);
    const model = requestedModel || configModels?.[0];

    if (!model) {
      return NextResponse.json(
        { error: 'No model specified in request or prompt config' },
        { status: 400 }
      );
    }

    // Validate model
    const modelConfig = getModelConfig(model);
    if (!modelConfig) {
      return NextResponse.json(
        { error: `Unknown model: ${model}` },
        { status: 400 }
      );
    }

    // Validate all required variables are provided
    const missingVariables = template.variables.filter(
      (v) => !variables[v]?.trim()
    );
    if (missingVariables.length > 0) {
      return NextResponse.json(
        { error: `Missing variables: ${missingVariables.join(', ')}` },
        { status: 400 }
      );
    }

    // Compile the prompt
    const compiledPrompt = compilePrompt(template.prompt, variables);

    // Create initial generation record
    const { data: generation, error: insertError } = await supabase
      .from('generations')
      .insert({
        user_id: user.id,
        user_email: user.email!,
        template_id: templateId,
        template_name: template.name,
        template_version: template.version,
        user_variables: variables,
        compiled_prompt: compiledPrompt,
        model: model,
        provider: modelConfig.provider,
        status: 'pending',
        langfuse_trace_id: traceId,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(
        `Failed to create generation record: ${insertError.message}`
      );
    }

    generationId = generation.id;

    // Initialize LangFuse trace
    const langfuse = getLangfuse();
    const trace = langfuse.trace({
      id: traceId,
      name: 'content-generation',
      userId: user.id,
      sessionId: user.email,
      metadata: {
        templateId,
        templateVersion: template.version,
        model,
        provider: modelConfig.provider,
        generationId: generation.id,
      },
      tags: ['dice', 'generation', modelConfig.provider],
    });

    // Create LangFuse generation span
    const generationSpan = trace.generation({
      name: 'llm-generation',
      model: model,
      modelParameters: {
        max_tokens: modelConfig.maxTokens,
      },
      input: compiledPrompt,
    });

    // Create Portkey client and generate
    const portkey = createPortkeyClient({
      model,
      userId: user.id,
      sessionId: user.email,
      traceId,
      metadata: {
        template_id: templateId,
        template_version: String(template.version),
        generation_id: generation.id,
      },
    });

    const completion = await portkey.chat.completions.create({
      model,
      messages: [{ role: 'user', content: compiledPrompt }],
      max_tokens: modelConfig.maxTokens,
    });

    const generatedContent = completion.choices[0]?.message?.content || '';
    const inputTokens = completion.usage?.prompt_tokens || 0;
    const outputTokens = completion.usage?.completion_tokens || 0;
    const totalTokens = completion.usage?.total_tokens || 0;
    const costUsd = calculateCost(model, inputTokens, outputTokens);
    const durationMs = Date.now() - startTime;

    // Update LangFuse generation with output
    generationSpan.end({
      output: generatedContent,
      usage: {
        input: inputTokens,
        output: outputTokens,
        total: totalTokens,
      },
      level: 'DEFAULT',
      statusMessage: 'Success',
    });

    // Flush LangFuse
    await flushLangfuse();

    // Update generation record
    const { error: updateError } = await supabase
      .from('generations')
      .update({
        generated_content: generatedContent,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: totalTokens,
        cost_usd: costUsd,
        duration_ms: durationMs,
        status: 'completed',
        portkey_request_id: completion.id,
      })
      .eq('id', generation.id);

    if (updateError) {
      console.error('Failed to update generation:', updateError);
    }

    return NextResponse.json({
      id: generation.id,
      content: generatedContent,
      model,
      provider: modelConfig.provider,
      tokens: {
        input: inputTokens,
        output: outputTokens,
        total: totalTokens,
      },
      cost: costUsd,
      duration: durationMs,
      traceId,
    });
  } catch (error) {
    console.error('Generation error:', error);

    // Try to update the generation record with error status
    if (generationId) {
      try {
        const supabase = await createClient();
        await supabase
          .from('generations')
          .update({
            status: 'failed',
            error_message:
              error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', generationId);
      } catch {
        // Ignore update errors
      }
    }

    return NextResponse.json(
      {
        error: 'Generation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
