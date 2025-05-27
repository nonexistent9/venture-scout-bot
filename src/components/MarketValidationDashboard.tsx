import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Removed chart imports as we no longer use charts
import { TrendingUp, TrendingDown, Search, Users, DollarSign, AlertTriangle, CheckCircle, Clock, Globe } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { marketValidationAPI, MarketValidationData } from '@/lib/market-validation-api';

interface MarketValidationProps {
  idea: string;
  onClose?: () => void;
}

const MarketValidationDashboard: React.FC<MarketValidationProps> = ({ idea, onClose }) => {
  const [searchTerm, setSearchTerm] = useState(idea || '');
  const [currentAnalysisIdea, setCurrentAnalysisIdea] = useState(idea || '');

  // Use React Query to fetch market validation data
  const { data: marketData, isLoading, error, refetch } = useQuery<MarketValidationData>({
    queryKey: ['marketValidation', currentAnalysisIdea],
    queryFn: () => marketValidationAPI.getMarketValidationData(currentAnalysisIdea),
    enabled: !!currentAnalysisIdea,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleAnalyze = async () => {
    if (!searchTerm.trim()) return;
    setCurrentAnalysisIdea(searchTerm);
    refetch();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Market Validation Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time market intelligence for your startup idea</p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close Dashboard
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-4">
            <Input
              placeholder="Enter your startup idea or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAnalyze} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Analyze Market
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validation Score</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(marketData?.metrics.validationScore || 0)}`}>
              {marketData?.metrics.validationScore || 0}/100
            </div>
            <Progress value={marketData?.metrics.validationScore || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Size</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${marketData?.metrics.marketSize || 0}B</div>
            <p className="text-xs text-muted-foreground">Total Addressable Market</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{marketData?.metrics.growthRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Year over year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={getRiskBadgeColor(marketData?.metrics.riskLevel || 'Medium')}>
              {marketData?.metrics.riskLevel || 'Medium'}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">Investment risk</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">Market Trends</TabsTrigger>
          <TabsTrigger value="competition">Competition</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          {/* Single Market Analysis Card - Full Width */}
          <Card>
            <CardHeader>
              <CardTitle>Market Analysis</CardTitle>
              <CardDescription>Comprehensive market intelligence powered by Sonar Pro</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!marketData?.marketAnalysis.overview ? (
                <div className="text-center py-12 text-gray-500">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No market analysis available</p>
                  <p className="text-sm">Configure your API key to see comprehensive market insights</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Market Overview */}
                  <div className="lg:col-span-3">
                    <h4 className="font-semibold text-lg text-gray-800 mb-3">Market Overview</h4>
                    <p className="text-gray-700 leading-relaxed">{marketData.marketAnalysis.overview}</p>
                  </div>

                  {/* Key Trends */}
                  {marketData.marketAnalysis.keyTrends.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-base text-gray-800 mb-3 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                        Key Market Trends
                      </h4>
                      <ul className="space-y-2">
                        {marketData.marketAnalysis.keyTrends.map((trend, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            {trend}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Target Audience */}
                  {marketData.marketAnalysis.targetAudience.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-base text-gray-800 mb-3 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-blue-500" />
                        Target Audience
                      </h4>
                      <ul className="space-y-2">
                        {marketData.marketAnalysis.targetAudience.map((audience, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            {audience}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Market Drivers */}
                  {marketData.marketAnalysis.marketDrivers.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-base text-gray-800 mb-3 flex items-center">
                        <DollarSign className="w-5 h-5 mr-2 text-green-500" />
                        Market Drivers
                      </h4>
                      <ul className="space-y-2">
                        {marketData.marketAnalysis.marketDrivers.map((driver, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            {driver}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Future Outlook Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Competitive Landscape</CardTitle>
                <CardDescription>Analysis of the competitive environment</CardDescription>
              </CardHeader>
              <CardContent>
                {marketData?.marketAnalysis.competitiveLandscape ? (
                  <p className="text-gray-700 leading-relaxed">{marketData.marketAnalysis.competitiveLandscape}</p>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No competitive landscape data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Future Outlook</CardTitle>
                <CardDescription>Market projections and future trends</CardDescription>
              </CardHeader>
              <CardContent>
                {marketData?.marketAnalysis.futureOutlook ? (
                  <p className="text-gray-700 leading-relaxed">{marketData.marketAnalysis.futureOutlook}</p>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No future outlook data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="competition" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Landscape</CardTitle>
              <CardDescription>Similar companies and their funding status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(marketData?.competitors || []).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No competitor data available</p>
                    <p className="text-sm">Configure your API key to see real competitor analysis</p>
                  </div>
                ) : (
                  (marketData?.competitors || []).map((competitor, index) => (
                    <div key={index} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Globe className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{competitor.name}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline">{competitor.stage}</Badge>
                              <span className="text-sm text-gray-600">•</span>
                              <span className="text-sm font-medium text-green-600">{competitor.funding}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium mb-1">{competitor.similarity}% similar</div>
                          <Progress value={competitor.similarity} className="w-24" />
                        </div>
                      </div>
                      
                      {competitor.description && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-700 leading-relaxed">{competitor.description}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        {competitor.website && competitor.website !== '#' ? (
                          <a 
                            href={competitor.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                          >
                            <Globe className="w-4 h-4" />
                            <span>Visit Website</span>
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">Website not available</span>
                        )}
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Funding Stage: {competitor.stage}</span>
                          <span>•</span>
                          <span>Similarity: {competitor.similarity}%</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Recommendations</CardTitle>
              <CardDescription>Strategic insights based on market analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(marketData?.insights.opportunities || []).length === 0 && 
               (marketData?.insights.challenges || []).length === 0 && 
               (marketData?.insights.nextSteps || []).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No insights available</p>
                  <p className="text-sm">Configure your API key to see AI-powered recommendations</p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">✅ Opportunities</h3>
                    {(marketData?.insights.opportunities || []).length === 0 ? (
                      <p className="text-sm text-green-600 italic">No opportunities identified</p>
                    ) : (
                      <ul className="space-y-1 text-sm text-green-700">
                        {(marketData?.insights.opportunities || []).map((opportunity, index) => (
                          <li key={index}>• {opportunity}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Challenges</h3>
                    {(marketData?.insights.challenges || []).length === 0 ? (
                      <p className="text-sm text-yellow-600 italic">No challenges identified</p>
                    ) : (
                      <ul className="space-y-1 text-sm text-yellow-700">
                        {(marketData?.insights.challenges || []).map((challenge, index) => (
                          <li key={index}>• {challenge}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">💡 Next Steps</h3>
                    {(marketData?.insights.nextSteps || []).length === 0 ? (
                      <p className="text-sm text-blue-600 italic">No next steps available</p>
                    ) : (
                      <ul className="space-y-1 text-sm text-blue-700">
                        {(marketData?.insights.nextSteps || []).map((step, index) => (
                          <li key={index}>• {step}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Sources Section */}
                  {marketData?.insights.sources && marketData.insights.sources.length > 0 && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                        <Globe className="w-4 h-4 mr-2" />
                        📚 Research Sources
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">References used for this analysis:</p>
                      <ul className="space-y-2">
                        {marketData.insights.sources.map((source, index) => (
                          <li key={index} className="text-sm">
                            <a 
                              href={source} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-2"
                            >
                              <Globe className="w-3 h-3 flex-shrink-0" />
                              <span className="break-all">{source}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketValidationDashboard; 