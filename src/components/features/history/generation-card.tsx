'use client';

import { useState } from 'react';
import { Generation } from '@/types/database';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/ui/star-rating';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Coins,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GenerationCardProps {
  generation: Generation;
}

export function GenerationCard({ generation }: GenerationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState<number>(generation.rating || 0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localRating, setLocalRating] = useState(generation.rating);

  const handleCopy = async () => {
    if (generation.generated_content) {
      await navigator.clipboard.writeText(generation.generated_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) return;

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationId: generation.id,
          rating,
          comment: comment || undefined,
        }),
      });

      if (res.ok) {
        setLocalRating(rating);
      }
    } catch {
      // Handle error silently
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedDate = new Date(generation.created_at).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  return (
    <Card
      className={cn(
        'transition-all',
        generation.status === 'failed' && 'border-red-200 bg-red-50/50'
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-medium text-gray-900">
                {generation.template_name}
              </span>
              <span className="text-sm px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                {generation.model}
              </span>
              {generation.status === 'failed' && (
                <span className="text-sm px-2 py-0.5 bg-red-100 rounded text-red-600">
                  Failed
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span>{formattedDate}</span>
              {generation.duration_ms && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {(generation.duration_ms / 1000).toFixed(2)}s
                </span>
              )}
              {generation.cost_usd && (
                <span className="flex items-center gap-1">
                  <Coins className="w-3 h-3" />${generation.cost_usd.toFixed(6)}
                </span>
              )}
              {localRating !== null && (
                <StarRating rating={localRating} readonly size="sm" />
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Variables */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Variables</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(generation.user_variables).map(([key, value]) => (
                <span
                  key={key}
                  className="px-2 py-1 bg-gray-100 rounded text-sm"
                >
                  <span className="text-gray-500">{key}:</span>{' '}
                  <span className="text-gray-900">{value}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Generated Content */}
          {generation.generated_content && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">
                  Generated Content
                </h4>
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-gray-900 whitespace-pre-wrap">
                {generation.generated_content}
              </div>
            </div>
          )}

          {/* Error Message */}
          {generation.error_message && (
            <div className="p-3 bg-red-50 rounded-lg text-red-700">
              {generation.error_message}
            </div>
          )}

          {/* Rating (if not already rated) */}
          {localRating === null && generation.status === 'completed' && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Rate this generation
              </h4>
              <div className="flex items-center gap-4">
                <StarRating rating={rating} onRate={setRating} />
                {rating > 0 && (
                  <div className="flex-1 flex items-center gap-2">
                    <Textarea
                      placeholder="Optional comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={1}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSubmitRating}
                      disabled={isSubmitting}
                      size="sm"
                    >
                      {isSubmitting ? 'Saving...' : 'Rate'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
