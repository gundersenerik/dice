'use client';

import { Select } from '@/components/ui/select';

interface Template {
  id: string;
  name: string;
  version: number;
  variables: string[];
  models: string[] | null;
  tags: string[];
}

interface TemplateSelectorProps {
  templates: Template[];
  selected: Template | null;
  onSelect: (template: Template | null) => void;
}

export function TemplateSelector({
  templates,
  selected,
  onSelect,
}: TemplateSelectorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    if (!templateId) {
      onSelect(null);
      return;
    }
    const template = templates.find((t) => t.id === templateId);
    onSelect(template || null);
  };

  return (
    <div className="space-y-2">
      <Select value={selected?.id || ''} onChange={handleChange}>
        <option value="">Select a template...</option>
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name} (v{template.version})
          </option>
        ))}
      </Select>
      {selected && (
        <p className="text-sm text-gray-500">
          Variables: {selected.variables.join(', ')}
        </p>
      )}
    </div>
  );
}
