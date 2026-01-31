'use client';

import { COMMUNICATION_TYPES } from '@/lib/config/communication-types';

interface TypeSelectorProps {
  value: string;
  onChange: (type: string) => void;
  disabled?: boolean;
}

export function TypeSelector({ value, onChange, disabled }: TypeSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-white"
    >
      <option value="">Select a type...</option>
      {COMMUNICATION_TYPES.map((type) => (
        <option key={type.id} value={type.name}>
          {type.name}
        </option>
      ))}
    </select>
  );
}
