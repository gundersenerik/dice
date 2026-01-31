'use client';

import { MODELS_BY_PROVIDER, ModelConfig } from '@/lib/portkey/models';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  selected: string;
  onSelect: (modelId: string) => void;
}

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
};

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: 'border-orange-200 bg-orange-50',
  openai: 'border-green-200 bg-green-50',
  google: 'border-blue-200 bg-blue-50',
};

export function ModelSelector({ selected, onSelect }: ModelSelectorProps) {
  return (
    <div className="space-y-4">
      {Object.entries(MODELS_BY_PROVIDER).map(([provider, models]) => (
        <div key={provider}>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            {PROVIDER_LABELS[provider] || provider}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {models.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                provider={provider}
                isSelected={selected === model.id}
                onSelect={() => onSelect(model.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface ModelCardProps {
  model: ModelConfig;
  provider: string;
  isSelected: boolean;
  onSelect: () => void;
}

function ModelCard({ model, provider, isSelected, onSelect }: ModelCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'p-3 rounded-lg border-2 text-left transition-all',
        PROVIDER_COLORS[provider] || 'border-gray-200 bg-gray-50',
        isSelected
          ? 'ring-2 ring-blue-500 ring-offset-1 border-blue-500'
          : 'hover:border-gray-300'
      )}
    >
      <div className="font-medium text-gray-900">{model.name}</div>
      <div className="text-xs text-gray-500 mt-1">
        ${((model.inputCostPer1k + model.outputCostPer1k) / 2).toFixed(4)}/1k
        tokens avg
      </div>
    </button>
  );
}
