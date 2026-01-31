import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchPromptTemplates, getModelsFromConfig } from '@/lib/langfuse/prompts';

export async function GET() {
  try {
    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch templates from LangFuse
    const templates = await fetchPromptTemplates();

    return NextResponse.json({
      templates: templates.map((t) => ({
        id: t.id,
        name: t.name,
        version: t.version,
        variables: t.variables,
        // Model(s) configured by admin in LangFuse
        models: getModelsFromConfig(t.config),
        // Tags for filtering (e.g., 'brand:vg', 'brand:ab')
        tags: t.tags,
        // Don't expose the actual prompt to the client
      })),
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
