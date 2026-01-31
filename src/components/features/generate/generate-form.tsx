'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TemplateSelector } from './template-selector';
import { VariableForm } from './variable-form';
import { ModelSelector } from './model-selector';
import { GenerationResult } from './generation-result';
import { Loader2 } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  version: number;
  variables: string[];
}

interface GenerationOutput {
  id: string;
  content: string;
  model: string;
  provider: string;
  tokens: { input: number; output: number; total: number };
  cost: number;
  duration: number;
  traceId: string;
}

export function GenerateForm() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('claude-sonnet-4-20250514');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [result, setResult] = useState<GenerationOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch templates on mount
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch('/api/templates');
        const data = await res.json();
        if (data.templates) {
          setTemplates(data.templates);
        }
      } catch {
        setError('Failed to load templates');
      } finally {
        setIsLoadingTemplates(false);
      }
    }
    fetchTemplates();
  }, []);

  // Reset variables when template changes
  useEffect(() => {
    if (selectedTemplate) {
      const initialVariables: Record<string, string> = {};
      selectedTemplate.variables.forEach((v) => {
        initialVariables[v] = '';
      });
      setVariables(initialVariables);
      setResult(null);
      setError(null);
    }
  }, [selectedTemplate]);

  const handleGenerate = async () => {
    if (!selectedTemplate) return;

    // Validate all variables are filled
    const missingVars = selectedTemplate.variables.filter(
      (v) => !variables[v]?.trim()
    );
    if (missingVars.length > 0) {
      setError(`Please fill in: ${missingVars.join(', ')}`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          variables,
          model: selectedModel,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Generation failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const canGenerate =
    selectedTemplate &&
    selectedTemplate.variables.every((v) => variables[v]?.trim());

  return (
    <div className="space-y-6">
      {/* Step 1: Select Template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
              1
            </span>
            Select Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingTemplates ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading templates...
            </div>
          ) : templates.length === 0 ? (
            <div className="text-gray-500">
              No templates available. Create templates in LangFuse with the
              &quot;production&quot; label.
            </div>
          ) : (
            <TemplateSelector
              templates={templates}
              selected={selectedTemplate}
              onSelect={setSelectedTemplate}
            />
          )}
        </CardContent>
      </Card>

      {/* Step 2: Fill Variables */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                2
              </span>
              Fill Variables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VariableForm
              variables={selectedTemplate.variables}
              values={variables}
              onChange={setVariables}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 3: Select Model */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
              3
            </span>
            Select Model
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ModelSelector selected={selectedModel} onSelect={setSelectedModel} />
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={!canGenerate || isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          'Generate Content'
        )}
      </Button>

      {/* Result */}
      {result && <GenerationResult result={result} />}
    </div>
  );
}
