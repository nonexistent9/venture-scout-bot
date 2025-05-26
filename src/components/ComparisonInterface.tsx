import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PerplexityApiInput } from '@/components/PerplexityApiInput';
import { Plus, X, Zap, TrendingUp } from 'lucide-react';

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

interface ScoreBreakdown {
  elevatorPitch: { points: number; maxPoints: number; reasoning: string };
  competitors: { points: number; maxPoints: number; reasoning: string };
  riskAssessment: { points: number; maxPoints: number; reasoning: string };
  deepResearch: { points: number; maxPoints: number; reasoning: string };
}

interface IdeaComparison {
  id: string;
  name: string;
  description: string;
  data?: ValidationData;
  isValidating: boolean;
  score?: number;
  scoreBreakdown?: ScoreBreakdown;
  weaknesses?: string[];
}

export const ComparisonInterface = () => {
  const [ideas, setIdeas] = useState<IdeaComparison[]>([
    { id: '1', name: '', description: '', isValidating: false }
  ]);
  const [selectedModel, setSelectedModel] = useState<'sonar-reasoning' | 'sonar-deep-research'>('sonar-reasoning');
  const [apiKey, setApiKey] = useState('');

  const addIdea = () => {
    if (ideas.length < 3) {
      const newIdea: IdeaComparison = {
        id: Date.now().toString(),
        name: '',
        description: '',
        isValidating: false
      };
      setIdeas([...ideas, newIdea]);
    }
  };

  const removeIdea = (id: string) => {
    if (ideas.length > 1) {
      setIdeas(ideas.filter(idea => idea.id !== id));
    }
  };

  const updateIdea = (id: string, field: 'name' | 'description', value: string) => {
    setIdeas(ideas.map(idea => 
      idea.id === id ? { ...idea, [field]: value } : idea
    ));
  };

  const createFallbackResult = (rawResponse: string): ValidationData | null => {
    try {
      const lines = rawResponse.split('\n').filter(line => line.trim());
      
      const elevatorPitch: string[] = [];
      const competitors: string[] = [];
      let majorRisk = '';
      let reasoning = '';
      
      let currentSection = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.toLowerCase().includes('elevator') || trimmedLine.toLowerCase().includes('pitch')) {
          currentSection = 'elevator';
          continue;
        } else if (trimmedLine.toLowerCase().includes('competitor')) {
          currentSection = 'competitors';
          continue;
        } else if (trimmedLine.toLowerCase().includes('risk')) {
          currentSection = 'risk';
          continue;
        } else if (trimmedLine.toLowerCase().includes('reasoning') || trimmedLine.toLowerCase().includes('analysis')) {
          currentSection = 'reasoning';
          continue;
        }
        
        if (trimmedLine.match(/^\d+\./) || trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
          const cleanedLine = trimmedLine.replace(/^\d+\.\s*/, '').replace(/^[•-]\s*/, '');
          
          if (currentSection === 'elevator' && elevatorPitch.length < 3) {
            elevatorPitch.push(cleanedLine);
          } else if (currentSection === 'competitors' && competitors.length < 3) {
            competitors.push(cleanedLine);
          }
        } else if (currentSection === 'risk' && !majorRisk && trimmedLine.length > 10) {
          majorRisk = trimmedLine;
        } else if (currentSection === 'reasoning' && trimmedLine.length > 20) {
          reasoning += trimmedLine + ' ';
        }
      }
      
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

  const validateIdea = async (id: string) => {
    const idea = ideas.find(i => i.id === id);
    if (!idea || !idea.description.trim()) return;

    if (!apiKey.trim()) {
      alert("Please enter your Perplexity API key first to continue.");
      return;
    }

    // Set validating state
    setIdeas(ideas.map(i => 
      i.id === id ? { ...i, isValidating: true } : i
    ));

    try {
      // Define JSON schema based on selected model
      const baseSchema: any = {
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

      // Add deep research fields for sonar-deep-research model
      if (selectedModel === 'sonar-deep-research') {
        baseSchema.properties = {
          ...baseSchema.properties,
          marketSize: {
            type: "string",
            description: "Total addressable market size and growth rate"
          },
          userPersonas: {
            type: "array",
            items: { type: "string" },
            minItems: 2,
            maxItems: 3,
            description: "Target user personas with demographics"
          },
          gtmChannels: {
            type: "array",
            items: { type: "string" },
            minItems: 2,
            maxItems: 4,
            description: "Go-to-market channels and strategies"
          },
          nextMilestones: {
            type: "array",
            items: { type: "string" },
            minItems: 3,
            maxItems: 5,
            description: "Key milestones for the next 6-12 months"
          }
        };
        baseSchema.required.push("marketSize", "userPersonas", "gtmChannels", "nextMilestones");
      }

      const systemPrompt = selectedModel === 'sonar-deep-research' 
        ? `You are a startup validation expert conducting deep market research. Analyze the startup idea comprehensively with real market data, user research, and strategic insights.

IMPORTANT: You must provide actual website URLs in the sources array. Each source should be formatted as "Website Name: https://example.com" with real, working URLs from your research.

For deep research, include:
- Market size with specific numbers and growth rates
- Detailed user personas with demographics
- Specific go-to-market channels with rationale
- Concrete milestones with timelines

Ensure all arrays contain separate string elements, not concatenated text.`
        : `You are a startup validation expert using Chain-of-Thought reasoning. Analyze the startup idea with structured reasoning and provide key insights.

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
              content: `Analyze this startup idea: ${idea.name ? `"${idea.name}" - ` : ''}${idea.description}`
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
              schema: baseSchema
            }
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      let aiResponse = data.choices[0].message.content;
      
      // Handle reasoning with structured output
      if (aiResponse.includes('<think>')) {
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
      
      try {
        const parsedResult = JSON.parse(aiResponse);
        
        const cleanedResult: ValidationData = {
          elevatorPitch: Array.isArray(parsedResult.elevatorPitch) ? parsedResult.elevatorPitch : [],
          competitors: Array.isArray(parsedResult.competitors) ? parsedResult.competitors : [],
          majorRisk: typeof parsedResult.majorRisk === 'string' ? parsedResult.majorRisk : 'Risk analysis not available',
          reasoning: typeof parsedResult.reasoning === 'string' ? parsedResult.reasoning : 'Reasoning not available',
          sources: Array.isArray(parsedResult.sources) ? parsedResult.sources : [],
          marketSize: parsedResult.marketSize,
          userPersonas: Array.isArray(parsedResult.userPersonas) ? parsedResult.userPersonas : undefined,
          gtmChannels: Array.isArray(parsedResult.gtmChannels) ? parsedResult.gtmChannels : undefined,
          nextMilestones: Array.isArray(parsedResult.nextMilestones) ? parsedResult.nextMilestones : undefined
        };
        
        const { score, breakdown, weaknesses } = calculateIdeaScore(cleanedResult);
        
        setIdeas(ideas.map(i => 
          i.id === id ? { ...i, data: cleanedResult, isValidating: false, score, scoreBreakdown: breakdown, weaknesses } : i
        ));
      } catch (parseError) {
        console.error('Failed to parse structured output:', parseError);
        
        const fallbackResult = createFallbackResult(data.choices[0].message.content);
        if (fallbackResult) {
          const { score, breakdown, weaknesses } = calculateIdeaScore(fallbackResult);
          setIdeas(ideas.map(i => 
            i.id === id ? { ...i, data: fallbackResult, isValidating: false, score, scoreBreakdown: breakdown, weaknesses } : i
          ));
        } else {
          setIdeas(ideas.map(i => 
            i.id === id ? { ...i, isValidating: false } : i
          ));
          alert("I encountered an issue with the response format. Please try again.");
        }
      }
    } catch (error) {
      console.error('Validation error:', error);
      setIdeas(ideas.map(i => 
        i.id === id ? { ...i, isValidating: false } : i
      ));
      alert("Sorry, I encountered an error while analyzing your idea. Please try again or check your API key.");
    }
  };

  const calculateIdeaScore = (data: ValidationData): { score: number; breakdown: any; weaknesses: string[] } => {
    let score = 0;
    const weaknesses: string[] = [];
    const breakdown = {
      elevatorPitch: { points: 0, maxPoints: 30, reasoning: '' },
      competitors: { points: 0, maxPoints: 20, reasoning: '' },
      riskAssessment: { points: 0, maxPoints: 20, reasoning: '' },
      deepResearch: { points: 0, maxPoints: 30, reasoning: '' }
    };
    
    // Score based on elevator pitch strength (0-30 points)
    const pitchPoints = Math.min(data.elevatorPitch.length * 10, 30);
    score += pitchPoints;
    breakdown.elevatorPitch.points = pitchPoints;
    breakdown.elevatorPitch.reasoning = `${data.elevatorPitch.length}/3 key points identified. ${
      data.elevatorPitch.length === 3 ? 'Excellent coverage of value proposition, target market, and competitive advantage.' :
      data.elevatorPitch.length === 2 ? 'Good foundation but missing one key element.' :
      'Limited pitch development - needs more comprehensive value proposition.'
    }`;
    
    // Add weaknesses for elevator pitch
    if (data.elevatorPitch.length < 3) {
      weaknesses.push(`Incomplete elevator pitch: Only ${data.elevatorPitch.length}/3 key elements identified. Need to clearly define ${data.elevatorPitch.length === 2 ? 'one more aspect' : 'value proposition, target market, and competitive advantage'}.`);
    }
    
    // Score based on competition analysis (0-20 points)
    const competitorPoints = Math.min(data.competitors.length * 10, 20);
    score += competitorPoints;
    breakdown.competitors.points = competitorPoints;
    breakdown.competitors.reasoning = `${data.competitors.length} competitors identified. ${
      data.competitors.length >= 2 ? 'Good competitive landscape understanding.' :
      'Limited competitive analysis - may indicate niche market or insufficient research.'
    }`;
    
    // Add weaknesses for competition analysis
    if (data.competitors.length < 2) {
      weaknesses.push(`Insufficient competitive analysis: Only ${data.competitors.length} competitor${data.competitors.length === 1 ? '' : 's'} identified. Research more direct and indirect competitors to understand market positioning.`);
    }
    
    // Score based on risk assessment (0-20 points)
    const riskPoints = data.majorRisk.length > 50 ? 20 : 10;
    score += riskPoints;
    breakdown.riskAssessment.points = riskPoints;
    breakdown.riskAssessment.reasoning = `Risk analysis is ${
      data.majorRisk.length > 50 ? 'comprehensive and detailed, showing thorough consideration of potential challenges.' :
      'basic but present - could benefit from more detailed risk evaluation.'
    }`;
    
    // Add weaknesses for risk assessment
    if (data.majorRisk.length <= 50) {
      weaknesses.push('Superficial risk analysis: Risk assessment lacks depth and detail. Conduct thorough analysis of market, technical, financial, and operational risks.');
    }
    
    // Bonus points for deep research data (0-30 points)
    let deepResearchPoints = 0;
    const deepResearchElements = [];
    const missingResearchElements = [];
    
    if (data.marketSize) {
      deepResearchPoints += 10;
      deepResearchElements.push('market size data');
    } else {
      missingResearchElements.push('market size analysis');
    }
    
    if (data.userPersonas?.length) {
      deepResearchPoints += 10;
      deepResearchElements.push('user personas');
    } else {
      missingResearchElements.push('user persona research');
    }
    
    if (data.gtmChannels?.length) {
      deepResearchPoints += 10;
      deepResearchElements.push('go-to-market strategy');
    } else {
      missingResearchElements.push('go-to-market strategy');
    }
    
    score += deepResearchPoints;
    breakdown.deepResearch.points = deepResearchPoints;
    breakdown.deepResearch.reasoning = deepResearchElements.length > 0 
      ? `Includes ${deepResearchElements.join(', ')}. Strong strategic foundation with ${deepResearchElements.length}/3 key research areas covered.`
      : 'No deep research data available. Consider using Deep Research mode for more comprehensive analysis.';
    
    // Add weaknesses for missing deep research
    if (missingResearchElements.length > 0) {
      weaknesses.push(`Missing strategic research: Lacks ${missingResearchElements.join(', ')}. Use Deep Research mode to get comprehensive market insights and strategic planning.`);
    }
    
    // Add overall score-based weaknesses
    const finalScore = Math.min(score, 100);
    if (finalScore < 60) {
      weaknesses.push('Overall weak foundation: Multiple critical areas need significant improvement before this idea is viable for development.');
    } else if (finalScore < 80) {
      weaknesses.push('Moderate concerns: Some key areas need strengthening to increase chances of success.');
    }
    
    return { score: finalScore, breakdown, weaknesses };
  };

  const validateAllIdeas = async () => {
    for (const idea of ideas) {
      if (idea.description.trim() && !idea.data) {
        await validateIdea(idea.id);
      }
    }
  };

  const getRecommendation = () => {
    const validatedIdeas = ideas.filter(idea => idea.data && idea.score);
    if (validatedIdeas.length === 0) return null;

    const topIdea = validatedIdeas.reduce((prev, current) => 
      (current.score || 0) > (prev.score || 0) ? current : prev
    );

    return topIdea;
  };

  const validatedIdeas = ideas.filter(idea => idea.data);
  const recommendation = getRecommendation();

  return (
    <div className="space-y-8">
      {/* API Key Input */}
      <PerplexityApiInput apiKey={apiKey} setApiKey={setApiKey} />

      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Compare Startup Ideas
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Add multiple startup ideas and get a side-by-side comparison to help you decide which one to pursue.
        </p>
      </div>

      {/* Model Selection */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg mb-2">Analysis Mode</h3>
            <p className="text-gray-600 text-sm">Choose your analysis depth</p>
          </div>
          <Tabs value={selectedModel} onValueChange={(value) => setSelectedModel(value as any)}>
            <TabsList>
              <TabsTrigger value="sonar-reasoning" className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Quick Analysis</span>
              </TabsTrigger>
              <TabsTrigger value="sonar-deep-research" className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Deep Research</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Card>

      {/* Ideas Input */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Your Startup Ideas</h3>
          <Button 
            onClick={addIdea} 
            disabled={ideas.length >= 3}
            variant="outline"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Idea ({ideas.length}/3)
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {ideas.map((idea, index) => (
            <Card key={idea.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline">Idea {index + 1}</Badge>
                {ideas.length > 1 && (
                  <Button
                    onClick={() => removeIdea(idea.id)}
                    variant="ghost"
                    size="sm"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Idea Name
                  </label>
                  <Input
                    placeholder="e.g., AI-powered design tool"
                    value={idea.name}
                    onChange={(e) => updateIdea(idea.id, 'name', e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Description
                  </label>
                  <Textarea
                    placeholder="Describe your startup idea in detail..."
                    value={idea.description}
                    onChange={(e) => updateIdea(idea.id, 'description', e.target.value)}
                    rows={4}
                  />
                </div>

                <Button
                  onClick={() => validateIdea(idea.id)}
                  disabled={!idea.description.trim() || idea.isValidating}
                  className="w-full"
                >
                  {idea.isValidating ? 'Analyzing...' : 'Validate Idea'}
                </Button>

                {idea.data && idea.score && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-800">
                        Analysis Complete
                      </span>
                      <Badge variant="secondary">
                        Score: {idea.score}/100
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {ideas.some(idea => idea.description.trim() && !idea.data) && (
          <div className="text-center">
            <Button onClick={validateAllIdeas} size="lg">
              Validate All Ideas
            </Button>
          </div>
        )}
      </div>

      {/* Recommendation */}
      {recommendation && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-blue-900 mb-2">
              🏆 Recommended Idea
            </h3>
            <p className="text-blue-800 mb-4">
              Based on our comprehensive analysis, <strong>{recommendation.name}</strong> shows the most promise
            </p>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Score: {recommendation.score}/100
            </Badge>
          </div>
          
          {recommendation.scoreBreakdown && (
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">Why This Idea Stands Out:</h4>
              <div className="grid gap-3 md:grid-cols-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Elevator Pitch: {recommendation.scoreBreakdown.elevatorPitch.points}/{recommendation.scoreBreakdown.elevatorPitch.maxPoints} points</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Competition: {recommendation.scoreBreakdown.competitors.points}/{recommendation.scoreBreakdown.competitors.maxPoints} points</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Risk Analysis: {recommendation.scoreBreakdown.riskAssessment.points}/{recommendation.scoreBreakdown.riskAssessment.maxPoints} points</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Research Depth: {recommendation.scoreBreakdown.deepResearch.points}/{recommendation.scoreBreakdown.deepResearch.maxPoints} points</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-blue-800 text-sm font-medium">
                  💡 Key Strength: {
                    recommendation.scoreBreakdown.elevatorPitch.points === 30 ? "Excellent value proposition clarity" :
                    recommendation.scoreBreakdown.deepResearch.points >= 20 ? "Strong strategic foundation with comprehensive research" :
                    recommendation.scoreBreakdown.competitors.points === 20 ? "Thorough competitive landscape understanding" :
                    "Well-balanced analysis across all criteria"
                  }
                </p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Detailed Analysis Results */}
      {validatedIdeas.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Complete Analysis Results</h3>
            <Button 
              onClick={() => {
                const detailedReport = validatedIdeas.map(idea => {
                  const ideaName = idea.name || `Idea ${ideas.findIndex(i => i.id === idea.id) + 1}`;
                  let report = `\n=== ${ideaName.toUpperCase()} (Score: ${idea.score}/100) ===\n\n`;
                  
                  if (idea.data) {
                    report += "🚀 ELEVATOR PITCH:\n";
                    idea.data.elevatorPitch.forEach((point, idx) => {
                      report += `${idx + 1}. ${point}\n`;
                    });
                    
                    report += "\n🏢 COMPETITIVE LANDSCAPE:\n";
                    idea.data.competitors.forEach((competitor, idx) => {
                      report += `• ${competitor}\n`;
                    });
                    
                    report += `\n⚠️ PRIMARY RISK:\n${idea.data.majorRisk}\n`;
                    
                    if (idea.data.marketSize || idea.data.userPersonas || idea.data.gtmChannels || idea.data.nextMilestones) {
                      report += "\n📊 DEEP RESEARCH INSIGHTS:\n";
                      if (idea.data.marketSize) report += `Market Size: ${idea.data.marketSize}\n`;
                      if (idea.data.userPersonas) {
                        report += "User Personas:\n";
                        idea.data.userPersonas.forEach(persona => report += `• ${persona}\n`);
                      }
                      if (idea.data.gtmChannels) {
                        report += "Go-to-Market Channels:\n";
                        idea.data.gtmChannels.forEach(channel => report += `• ${channel}\n`);
                      }
                      if (idea.data.nextMilestones) {
                        report += "Next Milestones:\n";
                        idea.data.nextMilestones.forEach((milestone, idx) => report += `${idx + 1}. ${milestone}\n`);
                      }
                    }
                    
                    if (idea.data.reasoning) {
                      report += `\n🧠 AI ANALYSIS REASONING:\n${idea.data.reasoning}\n`;
                    }
                    
                    if (idea.data.sources) {
                      report += "\n📚 RESEARCH SOURCES:\n";
                      idea.data.sources.forEach((source, idx) => {
                        report += `${idx + 1}. ${source}\n`;
                      });
                    }
                    
                    if (idea.scoreBreakdown) {
                      report += "\n📊 SCORING BREAKDOWN:\n";
                      report += `• Elevator Pitch: ${idea.scoreBreakdown.elevatorPitch.points}/${idea.scoreBreakdown.elevatorPitch.maxPoints} - ${idea.scoreBreakdown.elevatorPitch.reasoning}\n`;
                      report += `• Competition: ${idea.scoreBreakdown.competitors.points}/${idea.scoreBreakdown.competitors.maxPoints} - ${idea.scoreBreakdown.competitors.reasoning}\n`;
                      report += `• Risk Assessment: ${idea.scoreBreakdown.riskAssessment.points}/${idea.scoreBreakdown.riskAssessment.maxPoints} - ${idea.scoreBreakdown.riskAssessment.reasoning}\n`;
                      report += `• Deep Research: ${idea.scoreBreakdown.deepResearch.points}/${idea.scoreBreakdown.deepResearch.maxPoints} - ${idea.scoreBreakdown.deepResearch.reasoning}\n`;
                    }
                    
                    if (idea.weaknesses && idea.weaknesses.length > 0) {
                      report += "\n🚨 CRITICAL WEAKNESSES & IMPROVEMENT AREAS:\n";
                      idea.weaknesses.forEach((weakness, idx) => {
                        report += `${idx + 1}. ${weakness}\n`;
                      });
                    }
                  }
                  
                  return report;
                }).join('\n' + '='.repeat(80) + '\n');
                
                const fullReport = `VENTURE SCOUT - DETAILED ANALYSIS REPORT
Generated: ${new Date().toLocaleString()}
${validatedIdeas.length > 1 ? `\n🏆 RECOMMENDED IDEA: ${recommendation?.name || 'N/A'} (${recommendation?.score}/100)` : ''}

${detailedReport}

---
Report generated by Venture Scout Bot
`;
                
                const blob = new Blob([fullReport], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `venture-scout-detailed-analysis-${new Date().toISOString().slice(0, 10)}.txt`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}
              variant="outline"
              size="sm"
            >
              📄 Export Full Report
            </Button>
          </div>
          <div className="space-y-8">
            {validatedIdeas.map((idea, index) => (
              <div key={idea.id} className="border rounded-lg p-6 bg-gradient-to-br from-gray-50 to-white">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xl font-bold text-gray-900">
                    {idea.name || `Idea ${ideas.findIndex(i => i.id === idea.id) + 1}`}
                  </h4>
                  <Badge variant="outline" className="text-lg px-4 py-2 font-bold">
                    {idea.score}/100
                  </Badge>
                </div>

                {idea.data && (
                  <div className="space-y-6">
                    {/* Elevator Pitch */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h5 className="font-semibold text-blue-900 mb-3 flex items-center">
                        🚀 Elevator Pitch
                      </h5>
                      <div className="space-y-2">
                        {idea.data.elevatorPitch.map((point, idx) => (
                          <div key={idx} className="flex items-start space-x-2">
                            <span className="text-blue-600 font-bold">{idx + 1}.</span>
                            <span className="text-gray-700">{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Competitors */}
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h5 className="font-semibold text-green-900 mb-3 flex items-center">
                        🏢 Competitive Landscape
                      </h5>
                      <div className="space-y-2">
                        {idea.data.competitors.map((competitor, idx) => (
                          <div key={idx} className="flex items-start space-x-2">
                            <span className="text-green-600 font-bold">•</span>
                            <span className="text-gray-700">{competitor}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Major Risk */}
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <h5 className="font-semibold text-orange-900 mb-3 flex items-center">
                        ⚠️ Primary Risk Assessment
                      </h5>
                      <p className="text-gray-700">{idea.data.majorRisk}</p>
                    </div>

                    {/* Deep Research Data */}
                    {(idea.data.marketSize || idea.data.userPersonas || idea.data.gtmChannels || idea.data.nextMilestones) && (
                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <h5 className="font-semibold text-purple-900 mb-4 flex items-center">
                          📊 Deep Research Insights
                        </h5>
                        <div className="grid gap-4 md:grid-cols-2">
                          {idea.data.marketSize && (
                            <div>
                              <h6 className="font-medium text-purple-800 mb-2">Market Size</h6>
                              <p className="text-gray-700 text-sm">{idea.data.marketSize}</p>
                            </div>
                          )}
                          
                          {idea.data.userPersonas && idea.data.userPersonas.length > 0 && (
                            <div>
                              <h6 className="font-medium text-purple-800 mb-2">Target User Personas</h6>
                              <ul className="space-y-1">
                                {idea.data.userPersonas.map((persona, idx) => (
                                  <li key={idx} className="text-gray-700 text-sm flex items-start space-x-1">
                                    <span className="text-purple-600">•</span>
                                    <span>{persona}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {idea.data.gtmChannels && idea.data.gtmChannels.length > 0 && (
                            <div>
                              <h6 className="font-medium text-purple-800 mb-2">Go-to-Market Channels</h6>
                              <ul className="space-y-1">
                                {idea.data.gtmChannels.map((channel, idx) => (
                                  <li key={idx} className="text-gray-700 text-sm flex items-start space-x-1">
                                    <span className="text-purple-600">•</span>
                                    <span>{channel}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {idea.data.nextMilestones && idea.data.nextMilestones.length > 0 && (
                            <div>
                              <h6 className="font-medium text-purple-800 mb-2">Next Key Milestones</h6>
                              <ul className="space-y-1">
                                {idea.data.nextMilestones.map((milestone, idx) => (
                                  <li key={idx} className="text-gray-700 text-sm flex items-start space-x-1">
                                    <span className="text-purple-600">{idx + 1}.</span>
                                    <span>{milestone}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* AI Reasoning */}
                    {idea.data.reasoning && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                          🧠 AI Analysis Reasoning
                        </h5>
                        <p className="text-gray-700 leading-relaxed">{idea.data.reasoning}</p>
                      </div>
                    )}

                    {/* Sources */}
                    {idea.data.sources && idea.data.sources.length > 0 && (
                      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                        <h5 className="font-semibold text-indigo-900 mb-3 flex items-center">
                          📚 Research Sources
                        </h5>
                        <div className="space-y-2">
                          {idea.data.sources.map((source, idx) => (
                            <div key={idx} className="flex items-start space-x-2">
                              <span className="text-indigo-600 font-bold">{idx + 1}.</span>
                              <span className="text-gray-700 text-sm">{source}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Critical Weaknesses */}
                    {idea.weaknesses && idea.weaknesses.length > 0 && (
                      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <h5 className="font-semibold text-red-900 mb-3 flex items-center">
                          🚨 Critical Weaknesses & Improvement Areas
                        </h5>
                        <div className="space-y-3">
                          {idea.weaknesses.map((weakness, idx) => (
                            <div key={idx} className="flex items-start space-x-2">
                              <span className="text-red-600 font-bold">{idx + 1}.</span>
                              <span className="text-red-800 text-sm leading-relaxed">{weakness}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 p-3 bg-red-100 rounded border border-red-300">
                          <p className="text-red-900 text-sm font-medium">
                            📋 Action Required: These areas need immediate attention to strengthen your startup concept and improve market readiness.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Scoring Breakdown */}
      {validatedIdeas.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-6">Scoring Analysis & Reasoning</h3>
          <div className="space-y-6">
            {validatedIdeas.map((idea, index) => (
              <div key={idea.id} className="border rounded-lg p-6 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">
                    {idea.name || `Idea ${ideas.findIndex(i => i.id === idea.id) + 1}`}
                  </h4>
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {idea.score}/100
                  </Badge>
                </div>
                
                {idea.scoreBreakdown && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <div className="p-3 bg-white rounded border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-blue-700">Elevator Pitch</span>
                          <span className="text-sm font-semibold">
                            {idea.scoreBreakdown.elevatorPitch.points}/{idea.scoreBreakdown.elevatorPitch.maxPoints}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{idea.scoreBreakdown.elevatorPitch.reasoning}</p>
                      </div>
                      
                      <div className="p-3 bg-white rounded border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-green-700">Competition Analysis</span>
                          <span className="text-sm font-semibold">
                            {idea.scoreBreakdown.competitors.points}/{idea.scoreBreakdown.competitors.maxPoints}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{idea.scoreBreakdown.competitors.reasoning}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="p-3 bg-white rounded border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-orange-700">Risk Assessment</span>
                          <span className="text-sm font-semibold">
                            {idea.scoreBreakdown.riskAssessment.points}/{idea.scoreBreakdown.riskAssessment.maxPoints}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{idea.scoreBreakdown.riskAssessment.reasoning}</p>
                      </div>
                      
                      <div className="p-3 bg-white rounded border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-purple-700">Deep Research</span>
                          <span className="text-sm font-semibold">
                            {idea.scoreBreakdown.deepResearch.points}/{idea.scoreBreakdown.deepResearch.maxPoints}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{idea.scoreBreakdown.deepResearch.reasoning}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                  <h5 className="font-medium text-blue-900 mb-2">Critical Analysis Summary</h5>
                  <p className="text-sm text-blue-800">
                    {idea.score && idea.score >= 80 ? 
                      "🟢 Strong potential with comprehensive analysis and clear strategic direction." :
                    idea.score && idea.score >= 60 ?
                      "🟡 Moderate potential with some areas needing further development or research." :
                      "🔴 Requires significant improvement in key areas before proceeding."}
                  </p>
                </div>
                
                {/* Weaknesses & Areas for Improvement */}
                {idea.weaknesses && idea.weaknesses.length > 0 && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <h5 className="font-semibold text-red-900 mb-3 flex items-center">
                      🚨 Areas for Improvement
                    </h5>
                    <div className="space-y-3">
                      {idea.weaknesses.map((weakness, idx) => (
                        <div key={idx} className="flex items-start space-x-2">
                          <span className="text-red-600 font-bold mt-1">•</span>
                          <span className="text-red-800 text-sm leading-relaxed">{weakness}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-2 bg-red-100 rounded border border-red-300">
                      <p className="text-red-900 text-xs font-medium">
                        💡 Tip: Address these weaknesses to improve your idea's viability and scoring.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Comparison Results */}
      {validatedIdeas.length > 1 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Side-by-Side Comparison</h3>
            <Button 
              onClick={() => {
                const comparisonData = validatedIdeas.map(idea => ({
                  name: idea.name,
                  score: idea.score,
                  elevatorPitch: idea.data?.elevatorPitch.length || 0,
                  competitors: idea.data?.competitors.length || 0,
                  hasMarketSize: idea.data?.marketSize ? 'Yes' : 'No'
                }));
                
                const csvContent = [
                  ['Idea Name', 'Score', 'Elevator Pitch Points', 'Competitors', 'Market Size Data'],
                  ...comparisonData.map(idea => [
                    idea.name, 
                    `${idea.score}/100`, 
                    idea.elevatorPitch.toString(), 
                    idea.competitors.toString(), 
                    idea.hasMarketSize
                  ])
                ].map(row => row.join(',')).join('\n');
                
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `startup-ideas-comparison-${new Date().toISOString().slice(0, 10)}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}
              variant="outline"
              size="sm"
            >
              📊 Export CSV
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-semibold">Criteria</th>
                  {validatedIdeas.map(idea => (
                    <th key={idea.id} className="text-left p-4 font-semibold min-w-[150px]">
                      {idea.name || `Idea ${ideas.findIndex(i => i.id === idea.id) + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">Overall Score</td>
                  {validatedIdeas.map(idea => (
                    <td key={idea.id} className="p-4">
                      <Badge variant={idea.score === recommendation?.score ? "default" : "secondary"}>
                        {idea.score}/100
                      </Badge>
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">Elevator Pitch Points</td>
                  {validatedIdeas.map(idea => (
                    <td key={idea.id} className="p-4">
                      {idea.data?.elevatorPitch.length || 0}
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">Competitors Identified</td>
                  {validatedIdeas.map(idea => (
                    <td key={idea.id} className="p-4">
                      {idea.data?.competitors.length || 0}
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">Market Size Available</td>
                  {validatedIdeas.map(idea => (
                    <td key={idea.id} className="p-4">
                      {idea.data?.marketSize ? '✅' : '❌'}
                    </td>
                  ))}
                </tr>
                {selectedModel === 'sonar-deep-research' && (
                  <>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">User Personas</td>
                      {validatedIdeas.map(idea => (
                        <td key={idea.id} className="p-4">
                          {idea.data?.userPersonas?.length || 0}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">GTM Channels</td>
                      {validatedIdeas.map(idea => (
                        <td key={idea.id} className="p-4">
                          {idea.data?.gtmChannels?.length || 0}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">Next Milestones</td>
                      {validatedIdeas.map(idea => (
                        <td key={idea.id} className="p-4">
                          {idea.data?.nextMilestones?.length || 0}
                        </td>
                      ))}
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}; 