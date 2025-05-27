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
import { TextDotsLoader } from '@/components/ui/loader';
import { BorderBeam } from '@/components/ui/border-beam';
import { BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your Startup Philosopher. I have deep knowledge from Paul Graham and Naval Ravikant to help guide your entrepreneurial journey.\n\n💡 **Try:** \"/ask naval fundraising\" or \"/ask paul startup ideas\"\n\n📊 **For market research:** Use the Market Research button after discussing your idea!",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
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

  const handleOpenMarketDashboard = () => {
    navigate('/market-research');
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





  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    addMessage(inputText, true);
    
    // Check for knowledge queries first
    const { shouldSearch: shouldSearchKnowledge, query: knowledgeQuery, author } = detectKnowledgeQuery(inputText);
    
    if (shouldSearchKnowledge) {
      // Clear previous results when searching knowledge
      setCurrentKnowledgeLimit(8);
      setCurrentKnowledgeQuery('');
      setFullTextView(null); // Clear full text view
      // Search knowledge base with optional author filter
      searchKnowledge(knowledgeQuery, 8, author);
    } else {
      // For non-knowledge queries, suggest using knowledge commands
      addMessage("💡 Try asking for specific wisdom from our startup philosophers:\n\n• \"/ask naval [your question]\" - Get insights from Naval Ravikant\n• \"/ask paul [your question]\" - Get insights from Paul Graham\n\n📊 For market research and validation, use the Market Research Dashboard above!", false);
      
      // Clear previous results
      setCurrentKnowledgeResult(null);
      setCurrentKnowledgeQuery('');
      setFullTextView(null);
    }
    
    setInputText('');
  };

  // Market validation dashboard is now handled by navigation

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Market Research Button */}
      <div className="flex justify-center mb-6">
        <Button 
          onClick={() => navigate('/market-research')}
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
        >
          <BarChart3 className="w-6 h-6 mr-3" />
          Market Research Dashboard
        </Button>
      </div>
      
      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column - Chat Interface */}
        <div className="space-y-4">
          <Card className="relative bg-white border border-gray-100 shadow-sm">
            <BorderBeam size={250} duration={12} colorFrom="#9c40ff" colorTo="#ffaa40" />
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-xl mr-2">💬</span>
                Chat with Startup Philosopher
              </h3>
              
              <div className="h-[300px] overflow-y-auto mb-6 space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                {messages.map((message) => (
                  <div key={message.id}>
                    <ChatMessage message={message} />
                  </div>
                ))}
                {isSearchingKnowledge && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-xl p-4 max-w-xs border border-gray-200">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Searching knowledge base...
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask for wisdom from Paul Graham or Naval Ravikant... try '/ask naval fundraising' or '/ask paul growth'"
                  className="min-h-[80px] text-sm"
                  disabled={isSearchingKnowledge}
                />
                <Button 
                  type="submit" 
                  disabled={isSearchingKnowledge || !inputText.trim()}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 font-medium rounded-xl"
                >
                  {isSearchingKnowledge ? 'Searching Knowledge...' : 'Send Message'}
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* Right Column - Results Panel */}
        <div className="space-y-4">
          <Card className="relative bg-white border border-gray-100 shadow-sm">
            <BorderBeam size={250} duration={15} colorFrom="#ffaa40" colorTo="#9c40ff" delay={2} />
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-xl mr-2">📊</span>
                Analysis Results
              </h3>
              
              <div className="h-[440px] overflow-y-auto">
                {fullTextView ? (
                  <FullTextView
                    item={fullTextView.item}
                    fullText={fullTextView.fullText}
                    contextChunks={fullTextView.contextChunks}
                    onBack={handleBackToResults}
                  />
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
                    <div className="text-6xl mb-4">🧠</div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Knowledge Explorer</h4>
                    <p className="text-gray-600 text-sm max-w-sm">
                      Ask questions about startup wisdom from Paul Graham and Naval Ravikant to see insights here.
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
