'use client';

import { useState } from 'react';
import { Generation } from '@/types/database';
import { GenerationCard } from './generation-card';
import { Select } from '@/components/ui/select';

interface GenerationListProps {
  generations: Generation[];
}

export function GenerationList({ generations }: GenerationListProps) {
  const [filterModel, setFilterModel] = useState<string>('all');
  const [filterRated, setFilterRated] = useState<string>('all');

  // Get unique models for filter
  const models = Array.from(new Set(generations.map((g) => g.model)));

  // Filter generations
  const filtered = generations.filter((g) => {
    if (filterModel !== 'all' && g.model !== filterModel) return false;
    if (filterRated === 'rated' && g.rating === null) return false;
    if (filterRated === 'unrated' && g.rating !== null) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Model:</label>
          <Select
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
            className="w-48"
          >
            <option value="all">All models</option>
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Rating:</label>
          <Select
            value={filterRated}
            onChange={(e) => setFilterRated(e.target.value)}
            className="w-36"
          >
            <option value="all">All</option>
            <option value="rated">Rated</option>
            <option value="unrated">Unrated</option>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-6 text-sm text-gray-600">
        <span>{filtered.length} generations</span>
        <span>
          {filtered.filter((g) => g.rating !== null).length} rated
        </span>
        <span>
          Avg rating:{' '}
          {calculateAverageRating(filtered.filter((g) => g.rating !== null))}
        </span>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No generations match your filters
          </div>
        ) : (
          filtered.map((generation) => (
            <GenerationCard key={generation.id} generation={generation} />
          ))
        )}
      </div>
    </div>
  );
}

function calculateAverageRating(generations: Generation[]): string {
  if (generations.length === 0) return 'N/A';
  const sum = generations.reduce((acc, g) => acc + (g.rating || 0), 0);
  return (sum / generations.length).toFixed(1);
}
