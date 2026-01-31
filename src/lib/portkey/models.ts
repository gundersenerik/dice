export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  inputCostPer1k: number;
  outputCostPer1k: number;
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  // Anthropic Claude
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    maxTokens: 8192,
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015,
  },
  {
    id: 'claude-opus-4-0-20250514',
    name: 'Claude Opus 4',
    provider: 'anthropic',
    maxTokens: 4096,
    inputCostPer1k: 0.015,
    outputCostPer1k: 0.075,
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    maxTokens: 8192,
    inputCostPer1k: 0.001,
    outputCostPer1k: 0.005,
  },
  // OpenAI
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    maxTokens: 8192,
    inputCostPer1k: 0.03,
    outputCostPer1k: 0.06,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    maxTokens: 16384,
    inputCostPer1k: 0.005,
    outputCostPer1k: 0.015,
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    maxTokens: 4096,
    inputCostPer1k: 0.01,
    outputCostPer1k: 0.03,
  },
  // Google Gemini
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    maxTokens: 8192,
    inputCostPer1k: 0.00125,
    outputCostPer1k: 0.005,
  },
];

// Group models by provider for UI display
export const MODELS_BY_PROVIDER = AVAILABLE_MODELS.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  },
  {} as Record<string, ModelConfig[]>
);

export function getModelConfig(modelId: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find((m) => m.id === modelId);
}

export function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const model = getModelConfig(modelId);
  if (!model) return 0;

  return (
    (inputTokens / 1000) * model.inputCostPer1k +
    (outputTokens / 1000) * model.outputCostPer1k
  );
}
