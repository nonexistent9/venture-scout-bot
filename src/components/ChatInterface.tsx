import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ChatMessage } from '@/components/ChatMessage';
import { ValidationResult } from '@/components/ValidationResult';
import { YCCompanyResults } from '@/components/YCCompanyResults';
import { YCVerificationResultComponent } from '@/components/YCVerificationResult';
import { ycApi, detectYCQuery, YCSearchResult, YCVerificationResult } from '@/lib/yc-api';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  ycSearchResult?: YCSearchResult;
  ycVerificationResult?: YCVerificationResult;
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
      text: "Hi! I'm your Startup Idea Validator. Share your startup idea (1-2 lines) and I'll help you validate it with AI-powered analysis and structured insights.\n\n💡 **Pro tip:** You can also search Y Combinator companies by saying things like:\n• \"Show me companies like Airbnb\"\n• \"Find YC companies doing AI\"\n• \"Companies in fintech\"",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedModel] = useState<'sonar'>('sonar');
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationData | null>(null);
  const [isSearchingYC, setIsSearchingYC] = useState(false);
  const [currentYCResult, setCurrentYCResult] = useState<YCSearchResult | null>(null);

  // Get API key from environment variable
  const apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY;

  const addMessage = (text: string, isUser: boolean, ycSearchResult?: YCSearchResult, ycVerificationResult?: YCVerificationResult) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date(),
      ycSearchResult,
      ycVerificationResult
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Set the current YC result for the right panel
    if (ycSearchResult) {
      setCurrentYCResult(ycSearchResult);
    }
  };

  const searchYCCompanies = async (query: string) => {
    setIsSearchingYC(true);
    try {
      const searchResult = await ycApi.searchCompanies(query, 8);
      addMessage(`Found ${searchResult.totalFound} Y Combinator companies related to "${query}"`, false, searchResult);
    } catch (error) {
      console.error('Error searching YC companies:', error);
      addMessage("Sorry, I couldn't search Y Combinator companies right now. Please try again later.", false);
    } finally {
      setIsSearchingYC(false);
    }
  };

  const verifyYCCompany = async (companyName: string) => {
    setIsSearchingYC(true);
    try {
      const verificationResult = await ycApi.verifyCompany(companyName);
      addMessage('', false, undefined, verificationResult);
    } catch (error) {
      console.error('Error verifying YC company:', error);
      addMessage("Sorry, I couldn't verify the company right now. Please try again later.", false);
    } finally {
      setIsSearchingYC(false);
    }
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
    if (!apiKey || !apiKey.trim()) {
      addMessage("API key not configured. Please check your environment variables.", false);
      return;
    }

    setIsLoading(true);
    addMessage("🔄 Starting analysis... (This may take up to 30 seconds for the first request)", false);
    
    try {
      // Attempt 1: JSON Schema approach
      const result = await validateWithJsonSchema(idea);
      if (result) {
        setValidationResult(result);
        addMessage('✅ Analysis complete! Check the results panel on the right.', false);
        return;
      }

      // Attempt 2: Fallback to simple text parsing
      addMessage("🔄 Retrying with alternative approach...", false);
      const fallbackResult = await validateWithTextParsing(idea);
      if (fallbackResult) {
        setValidationResult(fallbackResult);
        addMessage('✅ Analysis complete! Check the results panel on the right.', false);
        return;
      }

      // If both fail
      addMessage("❌ Analysis failed. Please try again with a simpler description.", false);

    } catch (error) {
      console.error('Validation error:', error);
      addMessage("❌ Sorry, I encountered an error. Please check your API key and try again.", false);
    } finally {
      setIsLoading(false);
    }
  };

  const validateWithJsonSchema = async (idea: string): Promise<ValidationData | null> => {
    try {
      // Simplified, flexible JSON schema
      const validationSchema = {
        type: "object",
        properties: {
          elevatorPitch: {
            type: "array",
            items: { type: "string" },
            description: "Key value propositions and benefits"
          },
          competitors: {
            type: "array", 
            items: { type: "string" },
            description: "Main competitors or alternatives"
          },
          majorRisk: {
            type: "string",
            description: "Primary challenge or risk"
          },
          reasoning: {
            type: "string",
            description: "Analysis methodology and key insights"
          },
          sources: {
            type: "array",
            items: { type: "string" },
            description: "Reference URLs"
          }
        },
        required: ["elevatorPitch", "competitors", "majorRisk"],
        additionalProperties: false
      };

      const systemPrompt = `Analyze this startup idea and return a JSON object with:
- elevatorPitch: Array of 2-3 key value propositions
- competitors: Array of 2-3 main competitors or alternatives  
- majorRisk: Single biggest challenge or risk
- reasoning: Explain your analysis methodology and key insights (2-3 sentences)
- sources: Array of 2-4 relevant URLs for research

Keep responses concise and factual. In the reasoning field, explain how you evaluated the idea, what factors you considered, and key insights from your analysis.`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: selectedModel, // Now using regular 'sonar' model
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Analyze: ${idea}` }
          ],
          temperature: 0.1,
          max_tokens: 2000,
          return_images: false,
          return_related_questions: false,
          response_format: {
            type: "json_schema",
            json_schema: { schema: validationSchema }
          }
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      console.log('JSON Schema Response:', aiResponse);
      
      // Parse JSON directly (no <think> blocks with regular sonar model)
      const parsedData = JSON.parse(aiResponse);
      
      return {
        elevatorPitch: Array.isArray(parsedData.elevatorPitch) ? parsedData.elevatorPitch : [],
        competitors: Array.isArray(parsedData.competitors) ? parsedData.competitors : [],
        majorRisk: parsedData.majorRisk || 'Risk analysis unavailable',
        reasoning: parsedData.reasoning || 'AI analysis completed using structured evaluation methodology, considering market factors, competitive landscape, and risk assessment.',
        sources: Array.isArray(parsedData.sources) ? parsedData.sources : []
      };

    } catch (error) {
      console.error('JSON Schema validation failed:', error);
      return null;
    }
  };

  const validateWithTextParsing = async (idea: string): Promise<ValidationData | null> => {
    try {
      const systemPrompt = `Analyze this startup idea and respond in this exact format:

ELEVATOR PITCH:
• [Value proposition 1]
• [Value proposition 2] 
• [Value proposition 3]

COMPETITORS:
• [Competitor 1]
• [Competitor 2]
• [Competitor 3]

MAJOR RISK:
[Primary risk description]

REASONING:
[Explain your analysis methodology and key insights in 2-3 sentences]

SOURCES:
• [URL 1]
• [URL 2]
• [URL 3]

Use exactly this format with bullet points. In the REASONING section, explain how you evaluated the idea and what factors you considered.`;

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Analyze: ${idea}` }
          ],
          temperature: 0.1,
          max_tokens: 2000,
          return_images: false,
          return_related_questions: false
        }),
      });

      if (!response.ok) {
        throw new Error(`Fallback API call failed: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      console.log('Text Parsing Response:', aiResponse);
      
      return parseTextResponse(aiResponse);

    } catch (error) {
      console.error('Text parsing validation failed:', error);
      return null;
    }
  };

  const parseTextResponse = (response: string): ValidationData | null => {
    try {
      const result: ValidationData = {
        elevatorPitch: [],
        competitors: [],
        majorRisk: '',
        reasoning: '',
        sources: []
      };

      // Extract elevator pitch
      const pitchMatch = response.match(/ELEVATOR PITCH:\s*([\s\S]*?)(?=COMPETITORS:|$)/i);
      if (pitchMatch) {
        const pitchItems = pitchMatch[1].match(/•\s*([^\n]+)/g);
        if (pitchItems) {
          result.elevatorPitch = pitchItems.map(item => item.replace(/•\s*/, '').trim()).slice(0, 3);
        }
      }

      // Extract competitors
      const competitorsMatch = response.match(/COMPETITORS:\s*([\s\S]*?)(?=MAJOR RISK:|$)/i);
      if (competitorsMatch) {
        const competitorItems = competitorsMatch[1].match(/•\s*([^\n]+)/g);
        if (competitorItems) {
          result.competitors = competitorItems.map(item => item.replace(/•\s*/, '').trim()).slice(0, 3);
        }
      }

      // Extract major risk
      const riskMatch = response.match(/MAJOR RISK:\s*([\s\S]*?)(?=REASONING:|SOURCES:|$)/i);
      if (riskMatch) {
        result.majorRisk = riskMatch[1].trim();
      }

      // Extract reasoning
      const reasoningMatch = response.match(/REASONING:\s*([\s\S]*?)(?=SOURCES:|$)/i);
      if (reasoningMatch) {
        result.reasoning = reasoningMatch[1].trim();
      }

      // Extract sources
      const sourcesMatch = response.match(/SOURCES:\s*([\s\S]*?)$/i);
      if (sourcesMatch) {
        const sourceItems = sourcesMatch[1].match(/•\s*([^\n]+)/g);
        if (sourceItems) {
          result.sources = sourceItems.map(item => item.replace(/•\s*/, '').trim()).slice(0, 4);
        }
      }

      // Fallback reasoning if not extracted
      if (!result.reasoning) {
        result.reasoning = 'Analysis completed using structured evaluation methodology, considering market dynamics, competitive positioning, and potential challenges for this startup concept.';
      }

      // Validate we have minimum required data
      if (result.elevatorPitch.length > 0 || result.competitors.length > 0 || result.majorRisk) {
        return result;
      }

      return null;
    } catch (error) {
      console.error('Error parsing text response:', error);
      return null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    addMessage(inputText, true);
    
    // Check if the message contains YC queries
    const { type, query } = detectYCQuery(inputText);
    
    if (type === 'search') {
      // Clear previous validation results when searching YC companies
      setValidationResult(null);
      // Search YC companies
      searchYCCompanies(query);
    } else if (type === 'verification') {
      // Clear previous validation results when verifying YC companies
      setValidationResult(null);
      // Verify if a company is in YC
      verifyYCCompany(query);
    } else {
      // Clear previous YC results when validating idea
      setCurrentYCResult(null);
      // Normal idea validation flow
      validateIdea(inputText);
    }
    
    setInputText('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column - Chat Interface */}
        <div className="space-y-4">
          <Card className="bg-white border border-gray-100 shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-xl mr-2">💬</span>
                Chat with AI Validator
              </h3>
              
              <div className="h-96 overflow-y-auto mb-6 space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                {messages.map((message) => (
                  <div key={message.id} className="space-y-4">
                    <ChatMessage message={message} />
                    {message.ycSearchResult && (
                      <YCCompanyResults searchResult={message.ycSearchResult} />
                    )}
                    {message.ycVerificationResult && (
                      <YCVerificationResultComponent verificationResult={message.ycVerificationResult} />
                    )}
                  </div>
                ))}
                {(isLoading || isSearchingYC) && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-xl p-4 max-w-xs border border-gray-200">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        {isSearchingYC ? 'Searching YC companies...' : 'Analyzing...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Describe your startup idea in 1-2 lines... or try 'show me companies like Airbnb' or 'is Stripe a YC company?'"
                  className="min-h-[80px] text-sm"
                  disabled={isLoading || isSearchingYC}
                />
                <Button 
                  type="submit" 
                  disabled={isLoading || isSearchingYC || !inputText.trim()}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 font-medium rounded-xl"
                >
                  {isLoading ? 'Analyzing...' : isSearchingYC ? 'Searching...' : 'Send Message'}
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* Right Column - Results Panel */}
        <div className="space-y-4">
          <Card className="bg-white border border-gray-100 shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-xl mr-2">📊</span>
                Analysis Results
              </h3>
              
              <div className="h-[500px] overflow-y-auto">
                {validationResult ? (
                  <div className="space-y-4 pr-2">
                    <ValidationResult 
                      data={validationResult} 
                      selectedModel="sonar"
                    />
                  </div>
                ) : currentYCResult ? (
                  <div className="space-y-4 pr-2">
                    <YCCompanyResults searchResult={currentYCResult} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="text-6xl mb-4">🚀</div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Ready for Analysis</h4>
                    <p className="text-gray-600 text-sm max-w-sm">
                      Share your startup idea or search for Y Combinator companies to see detailed results here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
