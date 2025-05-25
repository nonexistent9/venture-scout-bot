
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
  sources?: string[];
}

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your Startup Idea Validator. Share your startup idea (1-2 lines) and I'll help you validate it with AI-powered analysis and structured insights.",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedModel] = useState<'sonar-reasoning'>('sonar-reasoning');
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

  const createFallbackResult = (rawResponse: string): ValidationData | null => {
    try {
      // Extract key information from the raw response
      const lines = rawResponse.split('\n').filter(line => line.trim());
      
      // Look for structured information in the response
      const elevatorPitch = [];
      const competitors = [];
      let majorRisk = '';
      let reasoning = '';
      
      // Try to extract elevator pitch points
      const pitchMatches = rawResponse.match(/(?:elevator pitch|pitch)[\s\S]*?(?:\d+\.|\•|\-)\s*([^\n]+)/gi);
      if (pitchMatches) {
        pitchMatches.slice(0, 3).forEach(match => {
          const point = match.replace(/.*(?:\d+\.|\•|\-)\s*/, '').trim();
          if (point) elevatorPitch.push(point);
        });
      }
      
      // Try to extract competitors
      const competitorMatches = rawResponse.match(/(?:competitor|competition)[\s\S]*?(?:\d+\.|\•|\-)\s*([^\n]+)/gi);
      if (competitorMatches) {
        competitorMatches.slice(0, 2).forEach(match => {
          const competitor = match.replace(/.*(?:\d+\.|\•|\-)\s*/, '').trim();
          if (competitor) competitors.push(competitor);
        });
      }
      
      // Try to extract major risk
      const riskMatch = rawResponse.match(/(?:major risk|risk)[\s\S]*?:\s*([^\n]+)/i);
      if (riskMatch) {
        majorRisk = riskMatch[1].trim();
      }
      
      // Extract reasoning if available
      const reasoningMatch = rawResponse.match(/<think>([\s\S]*?)<\/think>/);
      if (reasoningMatch) {
        reasoning = reasoningMatch[1].trim();
      }
      
      // Only return if we have some meaningful data
      if (elevatorPitch.length > 0 || competitors.length > 0 || majorRisk) {
        return {
          elevatorPitch: elevatorPitch.length > 0 ? elevatorPitch : ['Analysis provided in raw format'],
          competitors: competitors.length > 0 ? competitors : ['See raw analysis for competitor information'],
          majorRisk: majorRisk || 'Risk analysis provided in raw format',
          reasoning: reasoning || 'Reasoning process included in analysis',
          sources: ['Analysis based on general knowledge and industry patterns']
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error creating fallback result:', error);
      return null;
    }
  };

  const validateIdea = async (idea: string) => {
    if (!apiKey.trim()) {
      addMessage("Please enter your Perplexity API key first to continue.", false);
      return;
    }

    setIsLoading(true);
    
    try {
      // Define JSON schema for structured output
      const reasoningSchema = {
        type: "object",
        properties: {
          elevatorPitch: {
            type: "array",
            items: { type: "string" },
            minItems: 3,
            maxItems: 3,
            description: "Three key points: value proposition, target market, unique advantage"
          },
          competitors: {
            type: "array",
            items: { type: "string" },
            minItems: 2,
            maxItems: 3,
            description: "Main competitors with brief descriptions"
          },
          majorRisk: {
            type: "string",
            description: "Primary risk or challenge for this startup"
          },
          reasoning: {
            type: "string",
            description: "Step-by-step analysis explanation"
          },
          sources: {
            type: "array",
            items: { type: "string" },
            minItems: 2,
            maxItems: 4,
            description: "Research sources with URLs"
          }
        },
        required: ["elevatorPitch", "competitors", "majorRisk", "reasoning", "sources"],
        additionalProperties: false
      };

      const systemPrompt = `You are a startup validation expert using Chain-of-Thought reasoning. Analyze the startup idea with structured reasoning and provide key insights.

IMPORTANT: You must provide actual website URLs in the sources array. Each source should be formatted as "Website Name: https://example.com" with real, working URLs from your research.

For the elevatorPitch array, provide exactly 3 distinct points:
1. Clear value proposition
2. Target market description  
3. Unique competitive advantage

For competitors, provide 2-3 specific company names with brief descriptions.

Ensure all arrays contain separate string elements, not concatenated text.`;

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
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
          max_tokens: 3000,
          return_images: false,
          return_related_questions: false,
          frequency_penalty: 1,
          presence_penalty: 0,
          response_format: {
            type: "json_schema",
            json_schema: {
              schema: reasoningSchema
            }
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      let aiResponse = data.choices[0].message.content;
      
      console.log('Raw AI Response:', aiResponse);
      
      // Handle reasoning with structured output
      if (aiResponse.includes('<think>')) {
        // Extract the JSON part after the thinking section
        const thinkEndIndex = aiResponse.lastIndexOf('</think>');
        if (thinkEndIndex !== -1) {
          aiResponse = aiResponse.substring(thinkEndIndex + 8).trim();
        }
      }
      
      // Clean up JSON formatting
      aiResponse = aiResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      console.log('Processed AI Response:', aiResponse);
      
      try {
        const parsedResult = JSON.parse(aiResponse);
        
        const cleanedResult: ValidationData = {
          elevatorPitch: Array.isArray(parsedResult.elevatorPitch) ? parsedResult.elevatorPitch : [],
          competitors: Array.isArray(parsedResult.competitors) ? parsedResult.competitors : [],
          majorRisk: typeof parsedResult.majorRisk === 'string' ? parsedResult.majorRisk : 'Risk analysis not available',
          reasoning: typeof parsedResult.reasoning === 'string' ? parsedResult.reasoning : 'Reasoning not available',
          sources: Array.isArray(parsedResult.sources) ? parsedResult.sources : []
        };
        
        console.log('Cleaned result:', cleanedResult);
        
        setValidationResult(cleanedResult);
        addMessage('Analysis complete! Here are your results:', false);
      } catch (parseError) {
        console.error('Failed to parse structured output:', parseError);
        console.error('Response that failed to parse:', aiResponse);
        
        const fallbackResult = createFallbackResult(data.choices[0].message.content);
        if (fallbackResult) {
          setValidationResult(fallbackResult);
          addMessage('Analysis complete! Here are your results:', false);
        } else {
          addMessage("I encountered an issue with the response format. Please try again.", false);
        }
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
    <div className="max-w-5xl mx-auto space-y-8">
      <PerplexityApiInput apiKey={apiKey} setApiKey={setApiKey} />
      
      <Card className="bg-white border border-gray-100 shadow-sm">
        <div className="p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">AI Analysis Settings</h3>
          <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Switch 
                  checked={showReasoning} 
                  onCheckedChange={setShowReasoning}
                  id="show-reasoning"
                />
                <div>
                  <label htmlFor="show-reasoning" className="font-medium text-gray-900">
                    Show AI Reasoning Process
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    See step-by-step analysis and transparent decision-making
                  </p>
                </div>
              </div>
              <div className="text-2xl">
                🧠
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="bg-white border border-gray-100 shadow-sm">
        <div className="p-8">
          <div className="h-96 overflow-y-auto mb-8 space-y-6">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-50 rounded-xl p-4 max-w-xs">
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
              selectedModel="sonar-reasoning"
            />
          )}

          <form onSubmit={handleSubmit} className="flex space-x-4">
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Describe your startup idea in 1-2 lines..."
              className="flex-1 min-h-[80px] text-base"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={isLoading || !inputText.trim()}
              className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 font-medium rounded-xl"
            >
              {isLoading ? 'Analyzing...' : 'Validate'}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};
