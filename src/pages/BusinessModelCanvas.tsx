import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Lightbulb, CheckCircle, ChevronDown, ChevronUp, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

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
  sources: string[];
}

const BusinessModelCanvas = () => {
  const [businessIdea, setBusinessIdea] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canvas, setCanvas] = useState<BusinessModelCanvas | null>(null);
  const [thinkingProcess, setThinkingProcess] = useState<string>('');
  const [sources, setSources] = useState<string[]>([]);
  const [isThinkingOpen, setIsThinkingOpen] = useState(false);
  const { toast } = useToast();

  const extractThinkingAndContent = (rawContent: string): GenerationResult => {
    try {
      // Check if there's a <think> section
      const thinkMatch = rawContent.match(/<think>([\s\S]*?)<\/think>/);
      const thinking = thinkMatch ? thinkMatch[1].trim() : '';
      
      // Extract content after the thinking section
      let content = rawContent;
      if (thinkMatch) {
        content = rawContent.replace(/<think>[\s\S]*?<\/think>/, '').trim();
      }
      
      // Parse sections from markdown content
      const sections = {
        executiveSummary: extractSection(content, 'Executive Summary'),
        valuePropositions: extractSection(content, 'Value Propositions'),
        customerSegments: extractSection(content, 'Customer Segments'),
        customerRelationships: extractSection(content, 'Customer Relationships'),
        channels: extractSection(content, 'Channels'),
        keyPartners: extractSection(content, 'Key Partners'),
        keyActivities: extractSection(content, 'Key Activities'),
        keyResources: extractSection(content, 'Key Resources'),
        costStructure: extractSection(content, 'Cost Structure'),
        revenueStreams: extractSection(content, 'Revenue Streams')
      };
      
      return {
        canvas: sections,
        thinkingProcess: thinking,
        sources: extractSources(content)
      };
    } catch (error) {
      console.error('Error parsing response:', error);
      throw new Error('Failed to parse AI response');
    }
  };

  const extractSection = (content: string, sectionName: string): string => {
    // Look for section header (## Section Name)
    const regex = new RegExp(`##\\s*${sectionName}\\s*\\n([\\s\\S]*?)(?=##|$)`, 'i');
    const match = content.match(regex);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // Fallback: if no section found, return empty string
    return `No ${sectionName} section found in the response.`;
  };

  const extractSources = (content: string): string[] => {
    const sources: string[] = [];
    
    // Method 1: Look for explicit sources section
    const sourcesMatch = content.match(/##\s*(?:Sources?|References?)\s*\n([\s\S]*?)(?=##|$)/i);
    if (sourcesMatch && sourcesMatch[1]) {
      const sourceLines = sourcesMatch[1]
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim())
        .filter(line => line.length > 0);
      sources.push(...sourceLines);
    }
    
    // Method 2: Extract URLs from the entire content
    const urlRegex = /https?:\/\/[^\s\)\]]+/g;
    const urls = content.match(urlRegex) || [];
    sources.push(...urls);
    
    // Method 3: Look for citation patterns like [1] followed by source info
    const citationPattern = /\[(\d+)\]\s*([^\[\n]+)/g;
    let match;
    while ((match = citationPattern.exec(content)) !== null) {
      const sourceText = match[2].trim();
      if (sourceText && sourceText.length > 10) { // Only meaningful sources
        sources.push(`Citation [${match[1]}]: ${sourceText}`);
      }
    }
    
    // Method 4: Look for "Source:" or "Sources:" patterns
    const sourcePattern = /(?:Source|Sources?):\s*([^\n]+)/gi;
    let sourceMatch;
    while ((sourceMatch = sourcePattern.exec(content)) !== null) {
      sources.push(sourceMatch[1].trim());
    }
    
    // Method 5: Look for numbered list patterns with detailed source info
    const numberedSourcePattern = /^\s*(\d+)\.\s*\[(\d+)\]\s*(.+?)(?=^\s*\d+\.|$)/gm;
    let numberedMatch;
    while ((numberedMatch = numberedSourcePattern.exec(content)) !== null) {
      const sourceText = numberedMatch[3].trim();
      if (sourceText && sourceText.length > 10) {
        sources.push(`Citation [${numberedMatch[2]}]: ${sourceText}`);
      }
    }
    
    // Method 6: Extract citation numbers and create placeholders for later matching with URLs
    const citationNumbers = content.match(/\[(\d+)\]/g) || [];
    const uniqueCitationNumbers = [...new Set(citationNumbers)];
    
    // Remove duplicates and filter out very short entries
    const uniqueSources = [...new Set(sources)]
      .filter(source => source.length > 5)
      .slice(0, 30); // Increased limit for more sources
    
    // Debug logging
    console.log('Extracted sources from content:', uniqueSources);
    console.log('Found citation numbers:', uniqueCitationNumbers);
    console.log('Raw content preview:', content.substring(0, 500));
    
    return uniqueSources;
  };



  const cleanTextForPDF = (text: string): string => {
    // Remove markdown formatting for PDF
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/^\s*[-*+]\s/gm, '• ') // Convert bullet points
      .replace(/^\s*\d+\.\s/gm, '') // Remove numbered list formatting
      .trim();
  };

  const generatePDF = () => {
    if (!canvas) return;

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Helper function to add text with word wrapping
      const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
        pdf.setFontSize(fontSize);
        if (isBold) {
          pdf.setFont(undefined, 'bold');
        } else {
          pdf.setFont(undefined, 'normal');
        }

        const lines = pdf.splitTextToSize(text, maxWidth);
        
        // Check if we need a new page
        if (yPosition + (lines.length * fontSize * 0.5) > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.text(lines, margin, yPosition);
        yPosition += lines.length * fontSize * 0.5 + 5;
      };

      // Title
      addText('Business Model Canvas Report', 20, true);
      yPosition += 10;

      // Business Idea
      addText(`Business Idea: ${businessIdea}`, 12, true);
      if (targetMarket) {
        addText(`Target Market: ${targetMarket}`, 12, true);
      }
      yPosition += 10;

      // Generated date
      addText(`Generated on: ${new Date().toLocaleDateString()}`, 10);
      yPosition += 15;

      // Executive Summary
      addText('EXECUTIVE SUMMARY', 14, true);
      addText(cleanTextForPDF(canvas.executiveSummary), 10);
      yPosition += 10;

      // Value Propositions
      addText('VALUE PROPOSITIONS', 14, true);
      addText(cleanTextForPDF(canvas.valuePropositions), 10);
      yPosition += 10;

      // Customer Segments
      addText('CUSTOMER SEGMENTS', 14, true);
      addText(cleanTextForPDF(canvas.customerSegments), 10);
      yPosition += 10;

      // Customer Relationships
      addText('CUSTOMER RELATIONSHIPS', 14, true);
      addText(cleanTextForPDF(canvas.customerRelationships), 10);
      yPosition += 10;

      // Channels
      addText('CHANNELS', 14, true);
      addText(cleanTextForPDF(canvas.channels), 10);
      yPosition += 10;

      // Key Partners
      addText('KEY PARTNERS', 14, true);
      addText(cleanTextForPDF(canvas.keyPartners), 10);
      yPosition += 10;

      // Key Activities
      addText('KEY ACTIVITIES', 14, true);
      addText(cleanTextForPDF(canvas.keyActivities), 10);
      yPosition += 10;

      // Key Resources
      addText('KEY RESOURCES', 14, true);
      addText(cleanTextForPDF(canvas.keyResources), 10);
      yPosition += 10;

      // Cost Structure
      addText('COST STRUCTURE', 14, true);
      addText(cleanTextForPDF(canvas.costStructure), 10);
      yPosition += 10;

      // Revenue Streams
      addText('REVENUE STREAMS', 14, true);
      addText(cleanTextForPDF(canvas.revenueStreams), 10);

      // Add thinking process if available
      if (thinkingProcess) {
        yPosition += 15;
        addText('AI THINKING PROCESS', 14, true);
        addText(cleanTextForPDF(thinkingProcess), 9);
      }

      // Footer
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont(undefined, 'normal');
        pdf.text(
          `Generated by Startup Philosopher - Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Generate filename
      const businessName = businessIdea.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `business_model_canvas_${businessName}_${new Date().toISOString().slice(0, 10)}.pdf`;

      // Save the PDF
      pdf.save(filename);

      toast({
        title: "PDF Downloaded!",
        description: "Your Business Model Canvas has been saved as a PDF.",
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "PDF Generation Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
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

    // API key validation is now handled server-side

    setIsLoading(true);

    try {
      const prompt = `
        Analyze the business model and market opportunity for this startup concept: "${businessIdea}" ${targetMarket ? `targeting ${targetMarket}` : ''}. 

        Provide comprehensive business strategy analysis and market research covering startup validation, revenue models, competitive positioning, customer acquisition strategies, and operational requirements for early-stage founders.

        Structure your analysis using these specific business model framework sections:

        ## Executive Summary
        Provide strategic overview with key market insights, competitive advantages, and actionable recommendations for startup founders.

        ## Value Propositions  
        Analyze unique value delivery, problem-solution fit, competitive differentiation, and customer pain points addressed.

        ## Customer Segments
        Research target demographics, market size analysis, customer personas, behavioral patterns, and market segmentation strategies.

        ## Customer Relationships
        Examine customer acquisition strategies, retention models, community building, customer support approaches, and relationship management.

        ## Channels
        Evaluate distribution strategies, sales channels, marketing channels, partnership opportunities, and go-to-market approaches.

        ## Key Partners
        Identify strategic partnerships, supplier relationships, technology partners, distribution partners, and ecosystem collaborations.

        ## Key Activities
        Define core business operations, product development activities, marketing activities, platform management, and critical success factors.

        ## Key Resources
        Assess essential assets, intellectual property, human resources, technology infrastructure, and capital requirements.

        ## Cost Structure
        Analyze operational costs, customer acquisition costs, technology costs, personnel expenses, and cost optimization strategies.

        ## Revenue Streams
        Research monetization models, pricing strategies, revenue diversification, subscription models, and financial projections.

        For each section, provide:
        - **Bold formatting** for key business concepts
        - Numbered lists for strategic priorities  
        - Bullet points for detailed breakdowns
        - Specific market data and industry benchmarks
        - Real company examples and case studies
        - Clear actionable insights for founders

        Focus on current market trends, industry analysis, and practical startup guidance.
      `;

      const response = await fetch('/api/perplexity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      const rawContent = data.choices[0].message.content;
      const citations = data.citations || [];
      
      // Debug: Log the raw content and citations
      console.log('Raw Perplexity Response:', rawContent);
      console.log('Perplexity Citations:', citations);
      
      // Extract thinking process and content from the response
      const result = extractThinkingAndContent(rawContent);
      
      // Combine extracted sources with citations from Perplexity
      const allSources = [...new Set([...result.sources, ...citations])];
      
      setCanvas(result.canvas);
      setThinkingProcess(result.thinkingProcess);
      setSources(allSources);
      
      // Debug: Log final sources
      console.log('Final Combined Sources:', allSources);

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

        {/* Business Model Canvas Output */}
        {canvas && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <CardTitle className="text-xl">Your Business Model Canvas</CardTitle>
                </div>
                <Button 
                  onClick={generatePDF}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </Button>
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

        {/* AI Thinking Process - Collapsible at the end */}
        {thinkingProcess && (
          <Card className="mt-6">
            <Collapsible open={isThinkingOpen} onOpenChange={setIsThinkingOpen}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span>🧠</span>
                      <CardTitle className="text-lg">AI Thinking Process</CardTitle>
                    </div>
                    {isThinkingOpen ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <CardDescription>
                    {isThinkingOpen 
                      ? "Hide the AI's step-by-step analysis process" 
                      : "See how the AI analyzed your business idea step by step"
                    }
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="prose prose-gray max-w-none text-sm">
                      <ReactMarkdown>{thinkingProcess}</ReactMarkdown>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

        {/* Sources Section */}
        {sources.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <span>🔗</span>
                <CardTitle className="text-lg">Research Sources</CardTitle>
              </div>
              <CardDescription>
                Sources and references used in the business model analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sources.map((source, index) => {
                  // Check if source contains a URL
                  const urlMatch = source.match(/(https?:\/\/[^\s\)\]]+)/);
                  const hasUrl = urlMatch !== null;
                  const isDirectUrl = source.startsWith('http');
                  
                  return (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                      <span className="text-sm font-medium text-blue-600 mt-1 min-w-[24px]">{index + 1}.</span>
                      <div className="flex-1">
                        {hasUrl ? (
                          <div className="space-y-2">
                            <div className="text-sm text-gray-700 font-medium">
                              {source.replace(urlMatch[1], '').trim()}
                            </div>
                            <a 
                              href={urlMatch[1]} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-blue-600 hover:text-blue-800 underline text-sm break-all font-medium hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                            >
                              🔗 {urlMatch[1]}
                            </a>
                          </div>
                        ) : isDirectUrl ? (
                          <div className="space-y-1">
                            <div className="text-sm text-gray-600 font-medium">Research Source</div>
                            <a 
                              href={source} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-blue-600 hover:text-blue-800 underline text-sm break-all font-medium hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                            >
                              🔗 {source}
                            </a>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-700 leading-relaxed">{source}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
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