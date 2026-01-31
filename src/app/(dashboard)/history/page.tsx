import { createClient } from '@/lib/supabase/server';
import { GenerationList } from '@/components/features/history/generation-list';

export default async function HistoryPage() {
  const supabase = await createClient();

  // Fetch user's generations
  const { data: generations, error } = await supabase
    .from('generations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Generation History</h1>
        <p className="mt-2 text-gray-600">
          View and rate your past content generations
        </p>
      </div>

      {error ? (
        <div className="text-red-600">Failed to load history: {error.message}</div>
      ) : generations && generations.length > 0 ? (
        <GenerationList generations={generations} />
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No generations yet</p>
          <p className="mt-2">
            Go to the Generate page to create your first content
          </p>
        </div>
      )}
    </div>
  );
}
