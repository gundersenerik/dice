import { GenerateForm } from '@/components/features/generate/generate-form';

export default function GeneratePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Generate Content</h1>
        <p className="mt-2 text-gray-600">
          Select a template, fill in the variables, and generate AI content
        </p>
      </div>
      <GenerateForm />
    </div>
  );
}
