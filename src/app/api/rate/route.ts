import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { addUserRating } from '@/lib/langfuse/scoring';

const RateRequestSchema = z.object({
  generationId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export async function POST(request: NextRequest) {
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
    const validationResult = RateRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { generationId, rating, comment } = validationResult.data;

    // Fetch the generation to verify ownership and get trace ID
    const { data: generation, error: fetchError } = await supabase
      .from('generations')
      .select('id, user_id, langfuse_trace_id, rating')
      .eq('id', generationId)
      .single();

    if (fetchError || !generation) {
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (generation.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if already rated
    if (generation.rating !== null) {
      return NextResponse.json(
        { error: 'Generation already rated' },
        { status: 400 }
      );
    }

    // Update Supabase
    const { error: updateError } = await supabase
      .from('generations')
      .update({
        rating,
        rating_comment: comment || null,
        rated_at: new Date().toISOString(),
      })
      .eq('id', generationId);

    if (updateError) {
      throw new Error(`Failed to update rating: ${updateError.message}`);
    }

    // Add score to LangFuse if trace ID exists
    if (generation.langfuse_trace_id) {
      try {
        await addUserRating(generation.langfuse_trace_id, rating, comment);
      } catch (langfuseError) {
        console.error('Failed to add LangFuse score:', langfuseError);
        // Don't fail the request if LangFuse scoring fails
      }
    }

    return NextResponse.json({
      success: true,
      generationId,
      rating,
    });
  } catch (error) {
    console.error('Rating error:', error);
    return NextResponse.json(
      {
        error: 'Failed to save rating',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
