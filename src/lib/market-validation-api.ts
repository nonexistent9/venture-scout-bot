// Market Validation API - Secure version using serverless endpoint
// This file handles all market research and validation functionality

export interface MarketMetrics {
  marketSize: number;
  growthRate: number;
  competitionLevel: 'Low' | 'Medium' | 'High';
  validationScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface SentimentData {
  category: string;
  value: number;
}

export interface MarketAnalysis {
  overview: string;
  keyTrends: string[];
  marketDrivers: string[];
  targetAudience: string[];
  competitiveLandscape: string;
  futureOutlook: string;
}

export interface InsightsData {
  opportunities: string[];
  challenges: string[];
  nextSteps: string[];
  sources?: string[];
}

class MarketValidationAPI {
  // Helper method to make secure API calls through our serverless endpoint
  private async callPerplexityAPI(messages: any[], maxTokens: number = 1000): Promise<any> {
    const response = await fetch('/api/perplexity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages,
        max_tokens: maxTokens
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // Helper method to extract JSON from AI responses
  private extractJsonArray(text: string): any[] | null {
    try {
      // Try multiple patterns to find JSON arrays
      const patterns = [
        /\[\s*{[\s\S]*?}\s*\]/g,
        /```json\s*(\[[\s\S]*?\])\s*```/g,
        /```\s*(\[[\s\S]*?\])\s*```/g
      ];

      for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
          for (const match of matches) {
            try {
              const cleanMatch = match.replace(/```json|```/g, '').trim();
              const parsed = JSON.parse(cleanMatch);
              if (Array.isArray(parsed)) {
                return parsed;
              }
            } catch (e) {
              continue;
            }
          }
        }
      }

      // Try to find JSON-like content without delimiters
      const jsonStart = text.indexOf('[');
      const jsonEnd = text.lastIndexOf(']');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const jsonStr = text.substring(jsonStart, jsonEnd + 1);
        return JSON.parse(jsonStr);
      }

      return null;
    } catch (error) {
      console.error('Failed to extract JSON array:', error);
      return null;
    }
  }

  // Helper method to extract JSON object from AI responses
  private extractJsonObject(text: string): any | null {
    try {
      // Try multiple patterns to find JSON objects
      const patterns = [
        /{[\s\S]*?}/g,
        /```json\s*({[\s\S]*?})\s*```/g,
        /```\s*({[\s\S]*?})\s*```/g
      ];

      for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
          for (const match of matches) {
            try {
              const cleanMatch = match.replace(/```json|```/g, '').trim();
              const parsed = JSON.parse(cleanMatch);
              if (typeof parsed === 'object' && parsed !== null) {
                return parsed;
              }
            } catch (e) {
              continue;
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to extract JSON object:', error);
      return null;
    }
  }

  // Market metrics calculation using Perplexity AI
  async getMarketMetrics(idea: string): Promise<MarketMetrics> {
    try {
      const marketPrompt = `Analyze the market for this startup idea: "${idea}"

Please provide a market analysis with these specific metrics:
1. Market Size (Total Addressable Market in billions USD)
2. Growth Rate (annual percentage growth)
3. Competition Level (Low/Medium/High)
4. Validation Score (0-100 based on market opportunity, demand, feasibility)
5. Risk Level (Low/Medium/High)

Respond in this exact JSON format:
{
  "marketSize": 2.4,
  "growthRate": 23.5,
  "competitionLevel": "Medium",
  "validationScore": 78,
  "riskLevel": "Medium"
}

Base your analysis on current market data, industry trends, and realistic assessments.`;

      const aiResponse = await this.callPerplexityAPI([
        { role: 'user', content: marketPrompt }
      ], 500);
      
      // Try to parse JSON from AI response with better extraction
      const metrics = this.extractJsonObject(aiResponse);
      if (metrics) {
        return {
          marketSize: Math.round(metrics.marketSize * 10) / 10,
          growthRate: Math.round(metrics.growthRate * 10) / 10,
          competitionLevel: metrics.competitionLevel,
          validationScore: Math.round(metrics.validationScore),
          riskLevel: metrics.riskLevel
        };
      }

      // Return default values if parsing fails
      return {
        marketSize: 0,
        growthRate: 0,
        competitionLevel: 'Medium' as const,
        validationScore: 0,
        riskLevel: 'High' as const
      };
    } catch (error) {
      console.error('Error fetching market metrics:', error);
      return {
        marketSize: 0,
        growthRate: 0,
        competitionLevel: 'Medium' as const,
        validationScore: 0,
        riskLevel: 'High' as const
      };
    }
  }

  // Sentiment analysis using Perplexity AI
  async getSentimentData(idea: string): Promise<SentimentData[]> {
    try {
      const sentimentPrompt = `Analyze the current market sentiment for this startup idea: "${idea}"

Please search for recent news, social media discussions, industry reports, and public opinion about this type of solution or similar products in the market.

Provide a sentiment breakdown as percentages that add up to 100, in this exact JSON format:
{
  "positive": 65,
  "neutral": 25,
  "negative": 10,
  "summary": "Brief explanation of the sentiment analysis"
}

Where:
- positive: Percentage of positive sentiment (excitement, optimism, support)
- neutral: Percentage of neutral sentiment (informational, factual)
- negative: Percentage of negative sentiment (skepticism, concerns, criticism)

Base your analysis on real market data, recent trends, and public perception of similar solutions.`;

      const aiResponse = await this.callPerplexityAPI([
        { role: 'user', content: sentimentPrompt }
      ], 600);
      
      // Try to parse JSON from AI response with better extraction
      const sentiment = this.extractJsonObject(aiResponse);
      if (sentiment) {
        return [
          { category: 'Positive', value: sentiment.positive || 0 },
          { category: 'Neutral', value: sentiment.neutral || 0 },
          { category: 'Negative', value: sentiment.negative || 0 }
        ];
      }

      // Return default values if parsing fails
      return [
        { category: 'Positive', value: 60 },
        { category: 'Neutral', value: 30 },
        { category: 'Negative', value: 10 }
      ];
    } catch (error) {
      console.error('Error fetching sentiment data:', error);
      return [
        { category: 'Positive', value: 60 },
        { category: 'Neutral', value: 30 },
        { category: 'Negative', value: 10 }
      ];
    }
  }

  // Comprehensive market analysis using Perplexity AI Sonar Pro
  async getMarketAnalysis(idea: string): Promise<MarketAnalysis> {
    try {
      const analysisPrompt = `Conduct a comprehensive market analysis for this startup idea: "${idea}"

Please provide an in-depth market analysis covering all aspects of the market landscape. Research current industry trends, market dynamics, competitive environment, and future projections.

Respond in this exact JSON format:
{
  "overview": "2-3 sentence market overview",
  "keyTrends": [
    "Key trend 1 affecting this market",
    "Key trend 2 affecting this market", 
    "Key trend 3 affecting this market",
    "Key trend 4 affecting this market"
  ],
  "marketDrivers": [
    "Primary driver 1",
    "Primary driver 2",
    "Primary driver 3",
    "Primary driver 4"
  ],
  "targetAudience": [
    "Primary audience segment",
    "Secondary audience segment",
    "Tertiary audience segment"
  ],
  "competitiveLandscape": "2-3 sentence analysis of competitive environment",
  "futureOutlook": "2-3 sentence future market projection"
}

Requirements:
- Base analysis on current market research and industry reports
- Include specific data points and statistics where possible
- Focus on actionable insights for startup planning
- Consider both opportunities and challenges
- Analyze market maturity and growth potential`;

      const aiResponse = await this.callPerplexityAPI([
        { role: 'user', content: analysisPrompt }
      ], 1500);
      
      // Try to parse JSON from AI response with better extraction
      const analysis = this.extractJsonObject(aiResponse);
      if (analysis) {
        return {
          overview: analysis.overview || '',
          keyTrends: analysis.keyTrends?.slice(0, 4) || [],
          marketDrivers: analysis.marketDrivers?.slice(0, 4) || [],
          targetAudience: analysis.targetAudience?.slice(0, 3) || [],
          competitiveLandscape: analysis.competitiveLandscape || '',
          futureOutlook: analysis.futureOutlook || ''
        };
      }

      // Return empty analysis if parsing fails
      return {
        overview: '',
        keyTrends: [],
        marketDrivers: [],
        targetAudience: [],
        competitiveLandscape: '',
        futureOutlook: ''
      };
    } catch (error) {
      console.error('Error fetching market analysis:', error);
      return {
        overview: '',
        keyTrends: [],
        marketDrivers: [],
        targetAudience: [],
        competitiveLandscape: '',
        futureOutlook: ''
      };
    }
  }

  // AI-powered insights generation
  async getInsights(idea: string, metrics: MarketMetrics): Promise<{
    opportunities: string[];
    challenges: string[];
    nextSteps: string[];
    sources?: string[];
  }> {
    try {
      const insightsPrompt = `Based on this startup idea: "${idea}" and market metrics (Market Size: ${metrics.marketSize}B, Growth: ${metrics.growthRate}%, Competition: ${metrics.competitionLevel}, Score: ${metrics.validationScore}/100, Risk: ${metrics.riskLevel}), provide strategic insights.

Generate actionable business intelligence covering market opportunities, key challenges, and concrete next steps for startup founders.

Respond in this exact JSON format:
{
  "opportunities": [
    "Market opportunity 1 with specific details",
    "Market opportunity 2 with specific details",
    "Market opportunity 3 with specific details"
  ],
  "challenges": [
    "Key challenge 1 with mitigation strategies",
    "Key challenge 2 with mitigation strategies", 
    "Key challenge 3 with mitigation strategies"
  ],
  "nextSteps": [
    "Immediate action step 1",
    "Immediate action step 2",
    "Immediate action step 3",
    "Immediate action step 4"
  ],
  "sources": [
    "Industry report or data source 1",
    "Market research source 2",
    "Expert analysis source 3",
    "Trend analysis source 4"
  ]
}

Requirements:
- Focus on actionable insights for early-stage startups
- Include specific data points and market intelligence
- Provide concrete next steps with clear priorities
- Base recommendations on current market conditions
- Include relevant industry sources and reports`;

      const aiResponse = await this.callPerplexityAPI([
        { role: 'user', content: insightsPrompt }
      ], 800);
      
      // Try to parse JSON from AI response with better extraction
      const insights = this.extractJsonObject(aiResponse);
      if (insights) {
        return {
          opportunities: insights.opportunities?.slice(0, 3) || [],
          challenges: insights.challenges?.slice(0, 3) || [],
          nextSteps: insights.nextSteps?.slice(0, 4) || [],
          sources: insights.sources?.slice(0, 4) || []
        };
      }

      // Return empty insights if parsing fails
      return {
        opportunities: [],
        challenges: [],
        nextSteps: [],
        sources: []
      };
    } catch (error) {
      console.error('Error generating insights:', error);
      return {
        opportunities: [],
        challenges: [],
        nextSteps: [],
        sources: []
      };
    }
  }

  // Complete market validation analysis
  async validateIdea(idea: string) {
    try {
      console.log('🚀 Starting market validation for:', idea);
      
      // Run all analyses in parallel for better performance
      const [metrics, sentimentData, marketAnalysis] = await Promise.all([
        this.getMarketMetrics(idea),
        this.getSentimentData(idea),
        this.getMarketAnalysis(idea)
      ]);

      console.log('📊 Market Metrics:', metrics);
      console.log('💭 Sentiment Data:', sentimentData);
      console.log('📈 Market Analysis:', marketAnalysis);

      // Generate insights based on the collected data
      const insights = await this.getInsights(idea, metrics);
      console.log('💡 Insights:', insights);

      return {
        metrics,
        sentimentData,
        marketAnalysis,
        insights,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error in market validation:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const marketValidationAPI = new MarketValidationAPI(); 