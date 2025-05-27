import axios from 'axios';

export interface TrendData {
  date: string;
  interest: number;
}

export interface CompetitorData {
  name: string;
  similarity: number;
  funding: string;
  stage: string;
  description?: string;
  website?: string;
}

export interface MarketMetrics {
  marketSize: number; // in billions
  growthRate: number; // percentage
  competitionLevel: 'Low' | 'Medium' | 'High';
  validationScore: number; // 0-100
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface SentimentData {
  name: string;
  value: number;
  color: string;
}

export interface MarketAnalysis {
  overview: string;
  keyTrends: string[];
  marketDrivers: string[];
  targetAudience: string[];
  competitiveLandscape: string;
  futureOutlook: string;
}

export interface MarketValidationData {
  trends: TrendData[];
  competitors: CompetitorData[];
  metrics: MarketMetrics;
  sentiment: SentimentData[];
  marketAnalysis: MarketAnalysis;
  insights: {
    opportunities: string[];
    challenges: string[];
    nextSteps: string[];
    sources?: string[];
  };
}

class MarketValidationAPI {
  private perplexityApiKey = import.meta.env.VITE_PERPLEXITY_API_KEY;

  // Helper method to extract JSON from AI responses
  private extractJsonArray(text: string): any[] | null {
    try {
      // Try multiple patterns to find JSON arrays
      const patterns = [
        /\[[\s\S]*?\]/g,  // Standard array pattern
        /```json\s*(\[[\s\S]*?\])\s*```/g,  // Markdown code block
        /```\s*(\[[\s\S]*?\])\s*```/g,  // Code block without json
      ];

      for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
          for (const match of matches) {
            try {
              // Clean the match by removing markdown formatting
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

      // If no array found, try to find any JSON object and wrap it
      const objectPattern = /\{[\s\S]*?\}/g;
      const objectMatches = text.match(objectPattern);
      if (objectMatches) {
        for (const match of objectMatches) {
          try {
            const cleanMatch = match.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleanMatch);
            if (parsed && typeof parsed === 'object') {
              return [parsed]; // Wrap single object in array
            }
          } catch (e) {
            continue;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error extracting JSON:', error);
      return null;
    }
  }

  // Helper method to extract JSON objects from AI responses
  private extractJsonObject(text: string): any | null {
    try {
      // Try multiple patterns to find JSON objects
      const patterns = [
        /\{[\s\S]*?\}/g,  // Standard object pattern
        /```json\s*(\{[\s\S]*?\})\s*```/g,  // Markdown code block
        /```\s*(\{[\s\S]*?\})\s*```/g,  // Code block without json
      ];

      for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
          for (const match of matches) {
            try {
              // Clean the match by removing markdown formatting
              const cleanMatch = match.replace(/```json|```/g, '').trim();
              const parsed = JSON.parse(cleanMatch);
              if (parsed && typeof parsed === 'object') {
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
      console.error('Error extracting JSON object:', error);
      return null;
    }
  }

  // Google Trends analysis using Perplexity AI
  async getGoogleTrends(keyword: string): Promise<TrendData[]> {
    try {
      if (!this.perplexityApiKey) {
        console.warn('Perplexity API key not found, no trends data available');
        return [];
      }

      const trendsPrompt = `Analyze the search interest trends for "${keyword}" over the past 12 months.

Please provide monthly search interest data in this exact JSON format:
[
  {"date": "2024-01", "interest": 45},
  {"date": "2024-02", "interest": 52},
  {"date": "2024-03", "interest": 48},
  {"date": "2024-04", "interest": 65},
  {"date": "2024-05", "interest": 72},
  {"date": "2024-06", "interest": 68},
  {"date": "2024-07", "interest": 78},
  {"date": "2024-08", "interest": 85},
  {"date": "2024-09", "interest": 92},
  {"date": "2024-10", "interest": 88},
  {"date": "2024-11", "interest": 95},
  {"date": "2024-12", "interest": 100}
]

Where interest is a value from 0-100 representing relative search popularity. Base this on real market trends, seasonal patterns, and current interest in this topic.`;

      const response = await axios.post('https://api.perplexity.ai/chat/completions', {
        model: 'sonar-pro',
        messages: [
          { role: 'user', content: trendsPrompt }
        ],
        temperature: 0.1,
        max_tokens: 600
      }, {
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = response.data.choices[0].message.content;
      
      // Try to parse JSON from AI response with better extraction
      const trends = this.extractJsonArray(aiResponse);
      if (trends && Array.isArray(trends)) {
        return trends.slice(0, 12); // Ensure we have 12 months max
      }

      // Return empty array if parsing fails
      return [];
    } catch (error) {
      console.error('Error fetching Google Trends data:', error);
      return [];
    }
  }



  // Enhanced competitor analysis using Perplexity AI
  async getCompetitors(idea: string): Promise<CompetitorData[]> {
    try {
      if (!this.perplexityApiKey) {
        console.warn('Perplexity API key not found, no competitor data available');
        return [];
      }

      const competitorPrompt = `Research and identify real competitors for this startup idea: "${idea}"

Please search for current companies, startups, and market players in this space. Include their funding information, business models, and market positioning.

Respond with a JSON array of 4 competitors in this exact format:
[
  {
    "name": "Company Name",
    "similarity": 85,
    "funding": "$2.5M",
    "stage": "Seed",
    "description": "Brief description of what they do",
    "website": "https://example.com"
  }
]

Requirements:
- Focus on REAL companies when possible (search current databases and news)
- Include accurate funding information if available
- Similarity score (0-100) based on how similar their solution is
- Stage should be realistic (Pre-seed, Seed, Series A, Series B, etc.)
- Description should be specific and informative
- If real companies aren't found, create realistic examples for this market segment
- Search for both direct competitors and adjacent market players`;

      const response = await axios.post('https://api.perplexity.ai/chat/completions', {
        model: 'sonar-pro',
        messages: [
          { role: 'user', content: competitorPrompt }
        ],
        temperature: 0.1,
        max_tokens: 1200
      }, {
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = response.data.choices[0].message.content;
      
      // Try to parse JSON from AI response with better extraction
      const competitors = this.extractJsonArray(aiResponse);
      if (competitors && Array.isArray(competitors)) {
        // Validate and clean the competitor data
        const validCompetitors = competitors
          .filter((comp: any) => comp.name && comp.similarity && comp.funding)
          .map((comp: any) => ({
            name: comp.name,
            similarity: Math.min(100, Math.max(0, comp.similarity)),
            funding: comp.funding,
            stage: comp.stage || 'Unknown',
            description: comp.description || 'Competitor in the market',
            website: comp.website || '#'
          }))
          .slice(0, 4);

        if (validCompetitors.length > 0) {
          return validCompetitors;
        }
      }

      // Return empty array if parsing fails
      return [];
    } catch (error) {
      console.error('Error fetching competitor data:', error);
      return [];
    }
  }



  // Market metrics calculation using Perplexity AI
  async getMarketMetrics(idea: string): Promise<MarketMetrics> {
    try {
      if (!this.perplexityApiKey) {
        console.warn('Perplexity API key not found, no market metrics available');
        return {
          marketSize: 0,
          growthRate: 0,
          competitionLevel: 'Low' as const,
          validationScore: 0,
          riskLevel: 'High' as const
        };
      }

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

      const response = await axios.post('https://api.perplexity.ai/chat/completions', {
        model: 'sonar-pro',
        messages: [
          { role: 'user', content: marketPrompt }
        ],
        temperature: 0.1,
        max_tokens: 500
      }, {
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = response.data.choices[0].message.content;
      
      // Try to parse JSON from AI response with better extraction
      const metrics = this.extractJsonObject(aiResponse);
      if (metrics) {
        return {
          marketSize: Math.round(metrics.marketSize * 10) / 10,
          growthRate: Math.round(metrics.growthRate * 10) / 10,
          competitionLevel: metrics.competitionLevel,
          validationScore: Math.min(100, Math.max(0, Math.round(metrics.validationScore))),
          riskLevel: metrics.riskLevel
        };
      }

      // Return empty metrics if parsing fails
      return {
        marketSize: 0,
        growthRate: 0,
        competitionLevel: 'Low' as const,
        validationScore: 0,
        riskLevel: 'High' as const
      };
    } catch (error) {
      console.error('Error calculating market metrics:', error);
      return {
        marketSize: 0,
        growthRate: 0,
        competitionLevel: 'Low' as const,
        validationScore: 0,
        riskLevel: 'High' as const
      };
    }
  }



  // Sentiment analysis using Perplexity AI
  async getSentimentData(idea: string): Promise<SentimentData[]> {
    try {
      if (!this.perplexityApiKey) {
        console.warn('Perplexity API key not found, no sentiment data available');
        return [];
      }

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

      const response = await axios.post('https://api.perplexity.ai/chat/completions', {
        model: 'sonar-pro',
        messages: [
          { role: 'user', content: sentimentPrompt }
        ],
        temperature: 0.1,
        max_tokens: 600
      }, {
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = response.data.choices[0].message.content;
      
      // Try to parse JSON from AI response with better extraction
      const sentiment = this.extractJsonObject(aiResponse);
      if (sentiment) {
        // Ensure values add up to 100 and are valid
        const total = sentiment.positive + sentiment.neutral + sentiment.negative;
        if (total > 0) {
          const normalizedPositive = Math.round((sentiment.positive / total) * 100);
          const normalizedNeutral = Math.round((sentiment.neutral / total) * 100);
          const normalizedNegative = 100 - normalizedPositive - normalizedNeutral;

          return [
            { name: 'Positive', value: normalizedPositive, color: '#10B981' },
            { name: 'Neutral', value: normalizedNeutral, color: '#6B7280' },
            { name: 'Negative', value: Math.max(0, normalizedNegative), color: '#EF4444' },
          ];
        }
      }

      // Return empty array if parsing fails
      return [];
    } catch (error) {
      console.error('Error fetching sentiment data:', error);
      return [];
    }
  }



  // Comprehensive market analysis using Perplexity AI Sonar Pro
  async getMarketAnalysis(idea: string): Promise<MarketAnalysis> {
    try {
      if (!this.perplexityApiKey) {
        console.warn('Perplexity API key not found, no market analysis available');
        return {
          overview: '',
          keyTrends: [],
          marketDrivers: [],
          targetAudience: [],
          competitiveLandscape: '',
          futureOutlook: ''
        };
      }

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

      const response = await axios.post('https://api.perplexity.ai/chat/completions', {
        model: 'sonar-pro',
        messages: [
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.1,
        max_tokens: 1500
      }, {
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = response.data.choices[0].message.content;
      
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



  // Generate AI insights using Perplexity
  async getInsights(idea: string, metrics: MarketMetrics): Promise<{
    opportunities: string[];
    challenges: string[];
    nextSteps: string[];
    sources?: string[];
  }> {
    try {
      if (!this.perplexityApiKey) {
        console.warn('Perplexity API key not found, no insights available');
        return {
          opportunities: [],
          challenges: [],
          nextSteps: [],
          sources: []
        };
      }

      const insightsPrompt = `Provide strategic insights for this startup idea: "${idea}"

Market Context:
- Market Size: $${metrics.marketSize}B
- Growth Rate: ${metrics.growthRate}%
- Competition Level: ${metrics.competitionLevel}
- Validation Score: ${metrics.validationScore}/100
- Risk Level: ${metrics.riskLevel}

Please provide exactly 3 opportunities, 3 challenges, 4 next steps, and 3-4 relevant sources in this JSON format:
{
  "opportunities": [
    "Specific market opportunity 1",
    "Specific market opportunity 2", 
    "Specific market opportunity 3"
  ],
  "challenges": [
    "Key challenge 1",
    "Key challenge 2",
    "Key challenge 3"
  ],
  "nextSteps": [
    "Actionable next step 1",
    "Actionable next step 2",
    "Actionable next step 3",
    "Actionable next step 4"
  ],
  "sources": [
    "https://example.com/relevant-industry-report",
    "https://example.com/market-research-source",
    "https://example.com/startup-guide"
  ]
}

Focus on actionable, specific insights based on current market conditions and startup best practices. Include real, relevant URLs for industry reports, market research, and startup resources when possible.`;

      const response = await axios.post('https://api.perplexity.ai/chat/completions', {
        model: 'sonar-pro',
        messages: [
          { role: 'user', content: insightsPrompt }
        ],
        temperature: 0.2,
        max_tokens: 800
      }, {
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = response.data.choices[0].message.content;
      
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



  // Main method to get all market validation data
  async getMarketValidationData(idea: string): Promise<MarketValidationData> {
    try {
      const [trends, competitors, metrics, sentiment, marketAnalysis] = await Promise.all([
        this.getGoogleTrends(idea),
        this.getCompetitors(idea),
        this.getMarketMetrics(idea),
        this.getSentimentData(idea),
        this.getMarketAnalysis(idea)
      ]);

      const insights = await this.getInsights(idea, metrics);

      return {
        trends,
        competitors,
        metrics,
        sentiment,
        marketAnalysis,
        insights
      };
    } catch (error) {
      console.error('Error fetching market validation data:', error);
      throw new Error('Failed to fetch market validation data');
    }
  }
}

export const marketValidationAPI = new MarketValidationAPI(); 