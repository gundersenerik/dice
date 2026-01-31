'use client';

import { BRANDS } from '@/lib/config/brands';

interface BrandSelectorProps {
  value: string;
  onChange: (brand: string) => void;
  disabled?: boolean;
}

export function BrandSelector({ value, onChange, disabled }: BrandSelectorProps) {
  // Group brands by country
  const brandsByCountry = BRANDS.reduce(
    (acc, brand) => {
      if (!acc[brand.country]) {
        acc[brand.country] = [];
      }
      acc[brand.country].push(brand);
      return acc;
    },
    {} as Record<string, typeof BRANDS[number][]>
  );

  const countryNames: Record<string, string> = {
    SE: 'Sweden',
    NO: 'Norway',
    FI: 'Finland',
  };

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-white"
    >
      <option value="">Select a brand...</option>
      {Object.entries(brandsByCountry).map(([country, brands]) => (
        <optgroup key={country} label={countryNames[country] || country}>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.name}>
              {brand.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
