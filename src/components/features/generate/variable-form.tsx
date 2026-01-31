'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrandSelector } from './brand-selector';
import { TypeSelector } from './type-selector';

interface VariableFormProps {
  variables: string[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

// Human-readable labels for common variables
const VARIABLE_LABELS: Record<string, string> = {
  topic: 'Topic',
  segment: 'Target Audience/Segment',
  brand: 'Brand',
  type: 'Communication Type',
  language: 'Language',
  context: 'Context',
  goal: 'Goal',
  subject_line: 'Subject Line',
};

const VARIABLE_PLACEHOLDERS: Record<string, string> = {
  topic: 'e.g., Champions League final, Election results',
  segment: 'e.g., Football fans, Young professionals',
  brand: 'e.g., Aftonbladet, VG, Svenska Dagbladet',
  type: 'e.g., Winback, Onboarding, Engagement',
  language: 'e.g., Swedish, Norwegian, English',
  context: 'e.g., Newsletter signup, Product page',
  goal: 'e.g., Increase clicks, Drive purchases',
  subject_line: 'Enter the subject line to complement',
};

export function VariableForm({
  variables,
  values,
  onChange,
}: VariableFormProps) {
  const handleChange = (variable: string, value: string) => {
    onChange({ ...values, [variable]: value });
  };

  return (
    <div className="space-y-4">
      {variables.map((variable) => (
        <div key={variable} className="space-y-2">
          <Label htmlFor={variable}>
            {VARIABLE_LABELS[variable] || formatVariableName(variable)}
          </Label>
          {variable === 'brand' ? (
            <BrandSelector
              value={values[variable] || ''}
              onChange={(value) => handleChange(variable, value)}
            />
          ) : variable === 'type' ? (
            <TypeSelector
              value={values[variable] || ''}
              onChange={(value) => handleChange(variable, value)}
            />
          ) : (
            <Input
              id={variable}
              value={values[variable] || ''}
              onChange={(e) => handleChange(variable, e.target.value)}
              placeholder={VARIABLE_PLACEHOLDERS[variable] || `Enter ${variable}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function formatVariableName(name: string): string {
  return name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
