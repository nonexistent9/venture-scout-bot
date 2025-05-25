
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
    <Card className="bg-amber-50 border-amber-200 p-4 mb-6">
      <div className="flex items-start space-x-3">
        <div className="text-amber-600 mt-1">⚠️</div>
        <div className="flex-1">
          <h3 className="font-semibold text-amber-800 mb-2">Perplexity API Key Required</h3>
          <p className="text-sm text-amber-700 mb-3">
            To use the Startup Idea Validator, you need a Perplexity API key. You can get one from{' '}
            <a 
              href="https://www.perplexity.ai/settings/api" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-amber-800"
            >
              Perplexity's API settings
            </a>.
          </p>
          <div className="space-y-2">
            <Label htmlFor="api-key" className="text-sm font-medium text-amber-800">
              Enter your Perplexity API Key:
            </Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="pplx-..."
              className="bg-white border-amber-300 focus:border-amber-500"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
