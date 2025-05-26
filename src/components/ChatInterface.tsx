import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ChatMessage } from '@/components/ChatMessage';
import { ValidationResult } from '@/components/ValidationResult';
import { KnowledgeResults } from '@/components/KnowledgeResults';
import { FullTextView } from '@/components/FullTextView';
import { vectorKnowledgeAPI, VectorSearchResult } from '@/lib/vector-knowledge';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  knowledgeSearchResult?: VectorSearchResult;
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

// Knowledge query detection function
const detectKnowledgeQuery = (message: string): { 
  shouldSearch: boolean; 
  query: string; 
  author?: string;
  skipPerplexity?: boolean;
} => {
  const lowerMessage = message.toLowerCase().trim();
  
  // Check for /ask naval command
  if (lowerMessage.startsWith('/ask naval ')) {
    return {
      shouldSearch: true,
      author: 'Naval Ravikant',
      query: message.substring(11).trim(), // Remove '/ask naval '
      skipPerplexity: true
    };
  }
  
  // Check for /ask paul command
  if (lowerMessage.startsWith('/ask paul ')) {
    return {
      shouldSearch: true,
      author: 'Paul Graham',
      query: message.substring(10).trim(), // Remove '/ask paul '
      skipPerplexity: true
    };
  }
  
  // Knowledge-specific triggers (existing behavior)
  const knowledgeTriggers = [
    '/knowledge',
    '/kb',
    'search knowledge',
    'find knowledge',
    'show me knowledge',
    'knowledge about',
    'what does paul graham say',
    'what does naval say',
    'paul graham on',
    'naval on',
    'pg says',
    'naval says',
    'startup advice',
    'founder advice',
    'entrepreneurship advice'
  ];

  // Check for explicit knowledge triggers
  const foundTrigger = knowledgeTriggers.find(trigger => lowerMessage.includes(trigger));
  
  if (foundTrigger) {
    // Extract query after the trigger
    const triggerIndex = lowerMessage.indexOf(foundTrigger);
    const afterTrigger = message.substring(triggerIndex + foundTrigger.length).trim();
    
    // Clean up the query
    const cleanedQuery = afterTrigger
      .replace(/^(about|on|for|regarding)\s+/i, '')
      .trim();
    
    // Determine author from legacy queries
    let author: string | undefined;
    if (lowerMessage.includes('paul graham') || lowerMessage.includes('pg says')) {
      author = 'Paul Graham';
    } else if (lowerMessage.includes('naval')) {
      author = 'Naval Ravikant';
    }
    
    return {
      shouldSearch: true,
      query: cleanedQuery || 'startup ideas',
      author
    };
  }

  return { shouldSearch: false, query: '' };
};

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your Startup Philosopher. Share your startup idea and I'll help you validate it with AI-powered analysis.\n\n💡 **Try:** \"/ask naval fundraising\" or \"/ask paul growth\"",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedModel] = useState<'sonar'>('sonar');
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationData | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSearchingKnowledge, setIsSearchingKnowledge] = useState(false);
  const [currentKnowledgeResult, setCurrentKnowledgeResult] = useState<VectorSearchResult | null>(null);
  const [currentKnowledgeQuery, setCurrentKnowledgeQuery] = useState<string>('');
  const [currentKnowledgeLimit, setCurrentKnowledgeLimit] = useState<number>(8);
  const [fullTextView, setFullTextView] = useState<{
    item: any;
    fullText: string;
    contextChunks: any[];
  } | null>(null);

  // Get API key from environment variable
  const apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY;

  // Load knowledge base on component mount
  useEffect(() => {
    vectorKnowledgeAPI.loadKnowledge().catch(console.error);
  }, []);

  const addMessage = (text: string, isUser: boolean, knowledgeSearchResult?: VectorSearchResult) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date(),
      knowledgeSearchResult
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Set the current results for the right panel
    if (knowledgeSearchResult) {
      setCurrentKnowledgeResult(knowledgeSearchResult);
    }
  };



  const searchKnowledge = async (query: string, limit: number = 8, authorFilter?: string) => {
    setIsSearchingKnowledge(true);
    try {
      const searchResult = await vectorKnowledgeAPI.searchKnowledge(query, limit, 0.1, authorFilter);
      setCurrentKnowledgeQuery(query);
      setCurrentKnowledgeLimit(limit);
      
      const authorText = authorFilter ? ` from ${authorFilter}` : '';
      addMessage(`Found ${searchResult.totalFound} knowledge items${authorText} related to "${query}"`, false, searchResult);
    } catch (error) {
      console.error('Error searching knowledge:', error);
      addMessage("Sorry, I couldn't search the knowledge base right now. Please try again later.", false);
    } finally {
      setIsSearchingKnowledge(false);
    }
  };



  const handleKnowledgeCardClick = async (itemId: string) => {
    try {
      const fullTextData = await vectorKnowledgeAPI.getFullTextWithContext(itemId);
      if (fullTextData) {
        setFullTextView(fullTextData);
      }
    } catch (error) {
      console.error('Error loading full text:', error);
    }
  };

  const handleBackToResults = () => {
    setFullTextView(null);
  };

  const loadMoreKnowledgeResults = async () => {
    if (!currentKnowledgeQuery || !currentKnowledgeResult) return;
    
    setIsLoadingMore(true);
    try {
      const newLimit = currentKnowledgeLimit + 10; // Load 10 more results
      const searchResult = await vectorKnowledgeAPI.searchKnowledge(currentKnowledgeQuery, newLimit);
      setCurrentKnowledgeLimit(newLimit);
      
      // Update the current result and the message
      setCurrentKnowledgeResult(searchResult);
      
      // Update the last message with knowledge search results
      setMessages(prev => {
        const newMessages = [...prev];
        // Find the last message with knowledge search results (reverse search)
        for (let i = newMessages.length - 1; i >= 0; i--) {
          if (newMessages[i].knowledgeSearchResult) {
            newMessages[i] = {
              ...newMessages[i],
              knowledgeSearchResult: searchResult
            };
            break;
          }
        }
        return newMessages;
      });
    } catch (error) {
      console.error('Error loading more knowledge items:', error);
      addMessage("Sorry, I couldn't load more knowledge items right now. Please try again later.", false);
    } finally {
      setIsLoadingMore(false);
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
    
    // Check for knowledge queries first
    const { shouldSearch: shouldSearchKnowledge, query: knowledgeQuery, author, skipPerplexity } = detectKnowledgeQuery(inputText);
    
    if (shouldSearchKnowledge) {
      // Clear previous results when searching knowledge
      setValidationResult(null);
      setCurrentKnowledgeLimit(8);
      setCurrentKnowledgeQuery('');
      setFullTextView(null); // Clear full text view
      // Search knowledge base with optional author filter
      searchKnowledge(knowledgeQuery, 8, author);
      
      // If it's not a /ask command, also do idea validation
      if (!skipPerplexity) {
        validateIdea(inputText);
      }
    } else {
      // Clear previous results when validating idea
      setCurrentKnowledgeResult(null);
      setCurrentKnowledgeQuery('');
      setFullTextView(null); // Clear full text view
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
                Chat with Startup Philosopher
              </h3>
              
              <div className="h-96 overflow-y-auto mb-6 space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                {messages.map((message) => (
                  <div key={message.id}>
                    <ChatMessage message={message} />
                  </div>
                ))}
                {(isLoading || isSearchingKnowledge) && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-xl p-4 max-w-xs border border-gray-200">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        {isSearchingKnowledge ? 'Searching knowledge base...' : 'Analyzing...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Describe your startup idea... or try '/ask naval fundraising' or '/ask paul startup ideas'"
                  className="min-h-[80px] text-sm"
                  disabled={isLoading || isSearchingKnowledge}
                />
                <Button 
                  type="submit" 
                  disabled={isLoading || isSearchingKnowledge || !inputText.trim()}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 font-medium rounded-xl"
                >
                  {isLoading ? 'Analyzing...' : isSearchingKnowledge ? 'Searching Knowledge...' : 'Send Message'}
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
                {fullTextView ? (
                  <FullTextView
                    item={fullTextView.item}
                    fullText={fullTextView.fullText}
                    contextChunks={fullTextView.contextChunks}
                    onBack={handleBackToResults}
                  />
                ) : validationResult ? (
                  <div className="space-y-4 pr-2">
                    <ValidationResult 
                      data={validationResult} 
                      selectedModel="sonar"
                    />
                  </div>
                ) : currentKnowledgeResult ? (
                  <div className="space-y-4 pr-2">
                    <KnowledgeResults 
                      searchResult={currentKnowledgeResult} 
                      onLoadMore={loadMoreKnowledgeResults}
                      isLoadingMore={isLoadingMore}
                      onCardClick={handleKnowledgeCardClick}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="text-6xl mb-4">🚀</div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Ready for Analysis</h4>
                    <p className="text-gray-600 text-sm max-w-sm">
                      Share your startup idea or explore the knowledge base to see detailed results here.
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
