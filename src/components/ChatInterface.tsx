
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ChatMessage } from '@/components/ChatMessage';
import { ValidationResult } from '@/components/ValidationResult';
import { PerplexityApiInput } from '@/components/PerplexityApiInput';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ValidationData {
  elevatorPitch: string[];
  competitors: string[];
  majorRisk: string;
  marketSize?: string;
  userPersonas?: string[];
  gtmChannels?: string[];
  nextMilestones?: string[];
  reasoning?: string;
}

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your Startup Idea Validator. Share your startup idea (1-2 lines) and I'll help you validate it. I can provide quick insights or deep analysis based on your needs.",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isDeepDive, setIsDeepDive] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationData | null>(null);
  const [apiKey, setApiKey] = useState('');

  const addMessage = (text: string, isUser: boolean) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const validateIdea = async (idea: string) => {
    if (!apiKey.trim()) {
      addMessage("Please enter your Perplexity API key first to continue.", false);
      return;
    }

    setIsLoading(true);
    
    try {
      const systemPrompt = isDeepDive 
        ? `You are a startup validation expert. Analyze the given startup idea and provide:
           1. Three-bullet elevator pitch summary
           2. Two top competitors with brief descriptions
           3. One major risk
           4. Market size estimate with reasoning
           5. Three user personas
           6. Three go-to-market channels
           7. Three next milestones
           8. Your reasoning process (chain-of-thought)
           
           Format your response as JSON with keys: elevatorPitch, competitors, majorRisk, marketSize, userPersonas, gtmChannels, nextMilestones, reasoning`
        : `You are a startup validation expert. Analyze the given startup idea and provide:
           1. Three-bullet elevator pitch summary
           2. Two top competitors with brief descriptions  
           3. One major risk
           4. Your reasoning process (chain-of-thought)
           
           Format your response as JSON with keys: elevatorPitch, competitors, majorRisk, reasoning`;

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: idea
            }
          ],
          temperature: 0.2,
          top_p: 0.9,
          max_tokens: 2000,
          return_images: false,
          return_related_questions: false,
          frequency_penalty: 1,
          presence_penalty: 0
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      try {
        const parsedResult = JSON.parse(aiResponse);
        setValidationResult(parsedResult);
        addMessage(`${isDeepDive ? 'Deep dive' : 'Quick scan'} analysis complete! Here are your results:`, false);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        addMessage("I've analyzed your idea, but had trouble formatting the results. Here's what I found: " + aiResponse, false);
      }
    } catch (error) {
      console.error('Validation error:', error);
      addMessage("Sorry, I encountered an error while analyzing your idea. Please try again or check your API key.", false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    addMessage(inputText, true);
    validateIdea(inputText);
    setInputText('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PerplexityApiInput apiKey={apiKey} setApiKey={setApiKey} />
      
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Analysis Settings</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={isDeepDive} 
                  onCheckedChange={setIsDeepDive}
                  id="deep-dive"
                />
                <label htmlFor="deep-dive" className="text-sm font-medium">
                  Deep Dive Mode
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={showReasoning} 
                  onCheckedChange={setShowReasoning}
                  id="show-reasoning"
                />
                <label htmlFor="show-reasoning" className="text-sm font-medium">
                  Show AI Reasoning
                </label>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
        <div className="p-6">
          <div className="h-96 overflow-y-auto mb-4 space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {validationResult && (
            <ValidationResult 
              data={validationResult} 
              showReasoning={showReasoning}
              isDeepDive={isDeepDive}
            />
          )}

          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Describe your startup idea in 1-2 lines..."
              className="flex-1 min-h-[60px]"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={isLoading || !inputText.trim()}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {isLoading ? 'Analyzing...' : 'Validate'}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};
