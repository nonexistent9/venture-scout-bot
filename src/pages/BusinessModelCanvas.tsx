import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Lightbulb, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface BusinessModelCanvas {
  keyPartners: string;
  keyActivities: string;
  keyResources: string;
  valuePropositions: string;
  customerRelationships: string;
  channels: string;
  customerSegments: string;
  costStructure: string;
  revenueStreams: string;
  executiveSummary: string;
}

interface GenerationResult {
  canvas: BusinessModelCanvas;
  thinkingProcess: string;
}

const BusinessModelCanvas = () => {
  const [businessIdea, setBusinessIdea] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canvas, setCanvas] = useState<BusinessModelCanvas | null>(null);
  const [thinkingProcess, setThinkingProcess] = useState<string>('');
  const { toast } = useToast();

  const extractThinkingAndJson = (rawContent: string): GenerationResult => {
    try {
      // Check if there's a <think> section
      const thinkMatch = rawContent.match(/<think>([\s\S]*?)<\/think>/);
      const thinking = thinkMatch ? thinkMatch[1].trim() : '';
      
      // Extract JSON after the thinking section
      let jsonContent = rawContent;
      if (thinkMatch) {
        jsonContent = rawContent.replace(/<think>[\s\S]*?<\/think>/, '').trim();
      }
      
      // Parse the JSON
      const canvas = JSON.parse(jsonContent);
      
      return {
        canvas,
        thinkingProcess: thinking
      };
    } catch (error) {
      console.error('Error parsing response:', error);
      throw new Error('Failed to parse AI response');
    }
  };

  const generateBusinessModelCanvas = async () => {
    if (!businessIdea.trim()) {
      toast({
        title: "Business idea required",
        description: "Please describe your business idea to generate a canvas.",
        variant: "destructive",
      });
      return;
    }

    const apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY;
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please set your Perplexity API key in the environment variables.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const prompt = `
        As an expert business strategist, create a comprehensive Business Model Canvas for this startup idea:

        Business Idea: ${businessIdea}
        Target Market: ${targetMarket || 'Not specified'}

        Provide detailed analysis for each section with specific, actionable insights based on current market research and successful startup examples. Use markdown formatting for better readability.

        Include an executive summary that ties everything together and provides key recommendations for the founder.
      `;

      // Define the JSON schema for structured output
      const jsonSchema = {
        type: "object",
        properties: {
          executiveSummary: {
            type: "string",
            description: "A comprehensive executive summary with key insights and recommendations"
          },
          valuePropositions: {
            type: "string", 
            description: "What value you deliver to customers and problems you solve"
          },
          customerSegments: {
            type: "string",
            description: "Target customer groups and market segments"
          },
          customerRelationships: {
            type: "string",
            description: "How you establish and maintain customer relationships"
          },
          channels: {
            type: "string",
            description: "How you reach and deliver value to customers"
          },
          keyPartners: {
            type: "string",
            description: "Strategic partnerships and supplier relationships"
          },
          keyActivities: {
            type: "string",
            description: "Core activities required to operate your business"
          },
          keyResources: {
            type: "string",
            description: "Essential resources needed for your business model"
          },
          costStructure: {
            type: "string",
            description: "Major costs and expenses in your business model"
          },
          revenueStreams: {
            type: "string",
            description: "How your business generates revenue from customers"
          }
        },
        required: [
          "executiveSummary",
          "valuePropositions", 
          "customerSegments",
          "customerRelationships",
          "channels",
          "keyPartners",
          "keyActivities", 
          "keyResources",
          "costStructure",
          "revenueStreams"
        ]
      };

      const response = await axios.post('https://api.perplexity.ai/chat/completions', {
        model: 'sonar-deep-research',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7,
        response_format: {
          type: "json_schema",
          json_schema: { schema: jsonSchema }
        }
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const rawContent = response.data.choices[0].message.content;
      
      // Extract thinking process and JSON from the response
      const result = extractThinkingAndJson(rawContent);
      
      setCanvas(result.canvas);
      setThinkingProcess(result.thinkingProcess);

      toast({
        title: "Business Model Canvas Generated!",
        description: "Your comprehensive business model canvas is ready.",
      });

    } catch (error) {
      console.error('Error generating business model canvas:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate business model canvas. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Model Canvas Generator</h1>
          <p className="text-gray-600 text-lg">
            Use AI-powered deep research to create a comprehensive business model canvas for your startup idea.
          </p>
        </div>

        {/* Input Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Describe Your Business Idea</CardTitle>
            <CardDescription>
              Provide details about your startup idea and target market to generate a comprehensive business model canvas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="business-idea">Business Idea *</Label>
              <Textarea
                id="business-idea"
                placeholder="Describe your business idea, what problem it solves, and how it works..."
                value={businessIdea}
                onChange={(e) => setBusinessIdea(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div>
              <Label htmlFor="target-market">Target Market (Optional)</Label>
              <Input
                id="target-market"
                placeholder="e.g., Small businesses, millennials, B2B SaaS companies..."
                value={targetMarket}
                onChange={(e) => setTargetMarket(e.target.value)}
              />
            </div>
            <Button 
              onClick={generateBusinessModelCanvas}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Business Model Canvas...
                </>
              ) : (
                'Generate Business Model Canvas'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* AI Thinking Process */}
        {thinkingProcess && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <span>🧠</span>
                <span>AI Thinking Process</span>
              </CardTitle>
              <CardDescription>
                See how the AI analyzed your business idea step by step.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="prose prose-gray max-w-none text-sm">
                  <ReactMarkdown>{thinkingProcess}</ReactMarkdown>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Business Model Canvas Output */}
        {canvas && (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <CardTitle className="text-xl">Your Business Model Canvas</CardTitle>
              </div>
              <CardDescription>
                A comprehensive analysis of your business model based on deep market research.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              
              {/* Executive Summary */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">📋 Executive Summary</h3>
                <div className="prose prose-blue max-w-none">
                  <ReactMarkdown>{canvas.executiveSummary}</ReactMarkdown>
                </div>
              </div>

              {/* Value Propositions */}
              <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3">💡 Value Propositions</h3>
                <div className="prose prose-yellow max-w-none">
                  <ReactMarkdown>{canvas.valuePropositions}</ReactMarkdown>
                </div>
              </div>

              {/* Customer Segments */}
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-3">👥 Customer Segments</h3>
                <div className="prose prose-green max-w-none">
                  <ReactMarkdown>{canvas.customerSegments}</ReactMarkdown>
                </div>
              </div>

              {/* Customer Relationships */}
              <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                <h3 className="text-lg font-semibold text-red-900 mb-3">❤️ Customer Relationships</h3>
                <div className="prose prose-red max-w-none">
                  <ReactMarkdown>{canvas.customerRelationships}</ReactMarkdown>
                </div>
              </div>

              {/* Channels */}
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-900 mb-3">🚚 Channels</h3>
                <div className="prose prose-purple max-w-none">
                  <ReactMarkdown>{canvas.channels}</ReactMarkdown>
                </div>
              </div>

              {/* Key Partners */}
              <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
                <h3 className="text-lg font-semibold text-indigo-900 mb-3">🤝 Key Partners</h3>
                <div className="prose prose-indigo max-w-none">
                  <ReactMarkdown>{canvas.keyPartners}</ReactMarkdown>
                </div>
              </div>

              {/* Key Activities */}
              <div className="bg-teal-50 p-6 rounded-lg border border-teal-200">
                <h3 className="text-lg font-semibold text-teal-900 mb-3">🔑 Key Activities</h3>
                <div className="prose prose-teal max-w-none">
                  <ReactMarkdown>{canvas.keyActivities}</ReactMarkdown>
                </div>
              </div>

              {/* Key Resources */}
              <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                <h3 className="text-lg font-semibold text-orange-900 mb-3">🏢 Key Resources</h3>
                <div className="prose prose-orange max-w-none">
                  <ReactMarkdown>{canvas.keyResources}</ReactMarkdown>
                </div>
              </div>

              {/* Cost Structure */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">💰 Cost Structure</h3>
                <div className="prose prose-gray max-w-none">
                  <ReactMarkdown>{canvas.costStructure}</ReactMarkdown>
                </div>
              </div>

              {/* Revenue Streams */}
              <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-200">
                <h3 className="text-lg font-semibold text-emerald-900 mb-3">💵 Revenue Streams</h3>
                <div className="prose prose-emerald max-w-none">
                  <ReactMarkdown>{canvas.revenueStreams}</ReactMarkdown>
                </div>
              </div>

            </CardContent>
          </Card>
        )}

        {!canvas && !isLoading && (
          <div className="text-center py-12">
            <Lightbulb className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Build Your Business Model?</h3>
            <p className="text-gray-600">
              Enter your business idea above to generate a comprehensive business model canvas powered by AI research.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessModelCanvas; 