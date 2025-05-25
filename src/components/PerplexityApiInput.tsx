import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PerplexityApiInputProps {
  apiKey: string;
  setApiKey: (key: string) => void;
}

export const PerplexityApiInput = ({ apiKey, setApiKey }: PerplexityApiInputProps) => {
  return (
    <Card className="bg-gray-50 border border-gray-200 p-6">
      <div className="flex items-start space-x-4">
        <div className="text-gray-600 mt-1 text-xl">🔑</div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-3">Perplexity API Key Required</h3>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            To use the Startup Idea Validator, you need a Perplexity API key. You can get one from{' '}
            <a 
              href="https://www.perplexity.ai/settings/api" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-900 underline hover:text-gray-700 font-medium"
            >
              Perplexity's API settings
            </a>.
          </p>
          <div className="space-y-3">
            <Label htmlFor="api-key" className="text-sm font-medium text-gray-900">
              Enter your Perplexity API Key:
            </Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="pplx-..."
              className="bg-white border-gray-200 focus:border-gray-400 text-base"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
