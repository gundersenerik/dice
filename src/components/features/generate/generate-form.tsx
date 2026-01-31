'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TemplateSelector } from './template-selector';
import { VariableForm } from './variable-form';
import { GenerationResult } from './generation-result';
import { Loader2 } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  version: number;
  variables: string[];
  /** Model(s) configured by admin in LangFuse - null means no config */
  models: string[] | null;
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
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [results, setResults] = useState<GenerationOutput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<string | null>(null);

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
      setResults([]);
      setError(null);
      setGenerationProgress(null);
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

    // Check if template has model config
    if (!selectedTemplate.models || selectedTemplate.models.length === 0) {
      setError('No model configured for this template. Please configure model(s) in LangFuse prompt config.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setGenerationProgress(null);

    const modelsToTest = selectedTemplate.models;
    const generatedResults: GenerationOutput[] = [];

    try {
      // Generate with each configured model
      for (let i = 0; i < modelsToTest.length; i++) {
        const model = modelsToTest[i];
        setGenerationProgress(`Generating with ${model} (${i + 1}/${modelsToTest.length})...`);

        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId: selectedTemplate.id,
            variables,
            model,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || data.message || `Generation failed for ${model}`);
        }

        generatedResults.push(data);
        // Update results incrementally so user sees progress
        setResults([...generatedResults]);
      }

      setGenerationProgress(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsLoading(false);
      setGenerationProgress(null);
    }
  };

  const canGenerate =
    selectedTemplate &&
    selectedTemplate.variables.every((v) => variables[v]?.trim()) &&
    selectedTemplate.models &&
    selectedTemplate.models.length > 0;

  // Get display text for configured models
  const getModelDisplayText = () => {
    if (!selectedTemplate?.models || selectedTemplate.models.length === 0) {
      return 'No model configured';
    }
    if (selectedTemplate.models.length === 1) {
      return selectedTemplate.models[0];
    }
    return `${selectedTemplate.models.length} models (A/B test)`;
  };

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

      {/* Model Info (Read-only, admin-controlled) */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-sm font-bold">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              Model Configuration
              <span className="text-xs font-normal text-gray-500 ml-2">(Admin-controlled)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
              <p className="text-sm text-gray-700 font-medium">{getModelDisplayText()}</p>
              {selectedTemplate.models && selectedTemplate.models.length > 1 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedTemplate.models.map((model) => (
                    <span
                      key={model}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {model}
                    </span>
                  ))}
                </div>
              )}
              {(!selectedTemplate.models || selectedTemplate.models.length === 0) && (
                <p className="text-xs text-amber-600 mt-1">
                  Configure model(s) in LangFuse prompt config: {`{ "model": "..." }`} or {`{ "models": [...] }`}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Generation Progress */}
      {generationProgress && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          {generationProgress}
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
        ) : selectedTemplate?.models && selectedTemplate.models.length > 1 ? (
          `Generate with ${selectedTemplate.models.length} Models`
        ) : (
          'Generate Content'
        )}
      </Button>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          {results.length > 1 && (
            <h3 className="text-lg font-semibold text-gray-900">
              Results ({results.length} model{results.length > 1 ? 's' : ''})
            </h3>
          )}
          {results.map((result) => (
            <GenerationResult key={result.id} result={result} />
          ))}
        </div>
      )}
    </div>
  );
}
