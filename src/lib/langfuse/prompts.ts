import { getLangfuse } from './client';

/**
 * Configuration stored in LangFuse prompt config field.
 * Admin sets this in LangFuse to control model selection.
 */
export interface PromptConfig {
  /** Single model to use for this prompt */
  model?: string;
  /** Multiple models for A/B testing - generates with each */
  models?: string[];
  /** Optional description for admin reference */
  description?: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  version: number;
  variables: string[];
  prompt: string;
  /** Admin-configured settings from LangFuse */
  config?: PromptConfig;
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
          const config = parsePromptConfig(prompt.config);

          templates.push({
            id: promptMeta.name,
            name: prompt.name,
            version: prompt.version,
            variables,
            prompt: prompt.prompt,
            config,
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
    const config = parsePromptConfig(prompt.config);

    return {
      id: promptId,
      name: prompt.name,
      version: prompt.version,
      variables,
      prompt: prompt.prompt,
      config,
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

/**
 * Parse and validate the config field from LangFuse prompt.
 */
function parsePromptConfig(config: unknown): PromptConfig | undefined {
  if (!config || typeof config !== 'object') {
    return undefined;
  }

  const cfg = config as Record<string, unknown>;
  const result: PromptConfig = {};

  if (typeof cfg.model === 'string') {
    result.model = cfg.model;
  }

  if (Array.isArray(cfg.models)) {
    result.models = cfg.models.filter((m): m is string => typeof m === 'string');
  }

  if (typeof cfg.description === 'string') {
    result.description = cfg.description;
  }

  // Return undefined if no config values were found
  if (Object.keys(result).length === 0) {
    return undefined;
  }

  return result;
}

/**
 * Get the model(s) configured for a prompt.
 * Returns array of models for multi-model testing, or single model, or null if not configured.
 */
export function getModelsFromConfig(config?: PromptConfig): string[] | null {
  if (!config) return null;

  // Multi-model testing takes priority
  if (config.models && config.models.length > 0) {
    return config.models;
  }

  // Single model
  if (config.model) {
    return [config.model];
  }

  return null;
}
