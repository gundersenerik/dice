'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/ui/star-rating';
import { Check, Copy, Clock, Coins, Zap } from 'lucide-react';

interface GenerationResultProps {
  result: {
    id: string;
    content: string;
    model: string;
    provider: string;
    tokens: { input: number; output: number; total: number };
    cost: number;
    duration: number;
    traceId: string;
  };
}

export function GenerationResult({ result }: GenerationResultProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRated, setIsRated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitRating = async () => {
    if (rating === 0) return;

    setIsSubmitting(true);
    setRatingError(null);

    try {
      const res = await fetch('/api/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationId: result.id,
          rating,
          comment: comment || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit rating');
      }

      setIsRated(true);
    } catch (err) {
      setRatingError(err instanceof Error ? err.message : 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-green-800">Generated Content</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Generated Content */}
        <div className="p-4 bg-white rounded-lg border border-green-200">
          <p className="text-gray-900 whitespace-pre-wrap">{result.content}</p>
        </div>

        {/* Metrics */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Zap className="w-4 h-4" />
            <span>{result.model}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{(result.duration / 1000).toFixed(2)}s</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Coins className="w-4 h-4" />
            <span>${result.cost.toFixed(6)}</span>
          </div>
          <div className="text-gray-500">
            {result.tokens.total} tokens ({result.tokens.input} in /{' '}
            {result.tokens.output} out)
          </div>
        </div>

        {/* Rating Section */}
        <div className="border-t border-green-200 pt-4">
          {isRated ? (
            <div className="flex items-center gap-2 text-green-700">
              <Check className="w-5 h-5" />
              <span>
                Thanks for your feedback! You rated this {rating}/5.
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Rate this generation
                </h4>
                <StarRating rating={rating} onRate={setRating} size="lg" />
              </div>

              {rating > 0 && (
                <>
                  <div>
                    <Textarea
                      placeholder="Optional: Add a comment about the quality..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={2}
                    />
                  </div>

                  {ratingError && (
                    <div className="text-red-600 text-sm">{ratingError}</div>
                  )}

                  <Button
                    onClick={handleSubmitRating}
                    disabled={isSubmitting}
                    size="sm"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
