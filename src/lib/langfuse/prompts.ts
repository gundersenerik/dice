import { getLangfuse } from './client';

export interface PromptTemplate {
  id: string;
  name: string;
  version: number;
  variables: string[];
  prompt: string;
}

/**
 * Fetches all prompts from LangFuse with the 'production' label.
 * This is dynamic - no hardcoded list needed.
 */
export async function fetchPromptTemplates(): Promise<PromptTemplate[]> {
  const langfuse = getLangfuse();
  const templates: PromptTemplate[] = [];

  try {
    // Fetch all prompts with 'production' label from LangFuse
    const response = await langfuse.api.promptsList({
      label: 'production',
      limit: 100, // Max per request
    });

    // The list endpoint returns metadata, we need to fetch each prompt's content
    for (const promptMeta of response.data) {
      try {
        const prompt = await langfuse.getPrompt(promptMeta.name, undefined, {
          label: 'production',
          type: 'text',
        });

        if (prompt) {
          const variables = extractVariables(prompt.prompt);

          templates.push({
            id: promptMeta.name,
            name: prompt.name,
            version: prompt.version,
            variables,
            prompt: prompt.prompt,
          });
        }
      } catch (error) {
        console.error(`Failed to fetch prompt ${promptMeta.name}:`, error);
      }
    }
  } catch (error) {
    console.error('Failed to list prompts from LangFuse:', error);
  }

  return templates;
}

export async function getPromptById(
  promptId: string
): Promise<PromptTemplate | null> {
  const langfuse = getLangfuse();

  try {
    const prompt = await langfuse.getPrompt(promptId, undefined, {
      label: 'production',
      type: 'text',
    });

    if (!prompt) return null;

    const variables = extractVariables(prompt.prompt);

    return {
      id: promptId,
      name: prompt.name,
      version: prompt.version,
      variables,
      prompt: prompt.prompt,
    };
  } catch {
    return null;
  }
}

export function compilePrompt(
  template: string,
  variables: Record<string, string>
): string {
  let compiled = template;

  for (const [key, value] of Object.entries(variables)) {
    compiled = compiled.replaceAll(`{{${key}}}`, value);
  }

  return compiled;
}

function extractVariables(template: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const variables = new Set<string>();
  let match;

  while ((match = regex.exec(template)) !== null) {
    variables.add(match[1]);
  }

  return Array.from(variables);
}
