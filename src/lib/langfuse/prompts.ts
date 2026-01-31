import { getLangfuse } from './client';

export interface PromptTemplate {
  id: string;
  name: string;
  version: number;
  variables: string[];
  prompt: string;
}

// Registry of available prompts - these should match your LangFuse prompt names
const PROMPT_REGISTRY = [
  'subject-line-sports',
  'subject-line-politics',
  'push-notification-breaking',
  'cta-button',
  'email-preheader',
  'subject_line_from_email_body',
];

export async function fetchPromptTemplates(): Promise<PromptTemplate[]> {
  const langfuse = getLangfuse();
  const templates: PromptTemplate[] = [];

  for (const name of PROMPT_REGISTRY) {
    try {
      const prompt = await langfuse.getPrompt(name, undefined, {
        label: 'production',
        type: 'text',
      });

      if (prompt) {
        const variables = extractVariables(prompt.prompt);

        templates.push({
          id: name,
          name: prompt.name,
          version: prompt.version,
          variables,
          prompt: prompt.prompt,
        });
      }
    } catch (error) {
      console.error(`Failed to fetch prompt ${name}:`, error);
    }
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

export function getPromptRegistry(): string[] {
  return PROMPT_REGISTRY;
}
