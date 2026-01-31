import { getLangfuse, flushLangfuse } from './client';

export interface ScoreInput {
  traceId: string;
  name: string;
  value: number;
  comment?: string;
  observationId?: string;
}

export async function addScore(input: ScoreInput): Promise<void> {
  const langfuse = getLangfuse();

  langfuse.score({
    traceId: input.traceId,
    observationId: input.observationId,
    name: input.name,
    value: input.value,
    comment: input.comment,
  });

  await flushLangfuse();
}

export async function addUserRating(
  traceId: string,
  rating: number,
  comment?: string
): Promise<void> {
  await addScore({
    traceId,
    name: 'user-rating',
    value: rating,
    comment,
  });
}
