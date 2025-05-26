import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Users, MapPin, Calendar, ChevronDown } from 'lucide-react';
import { YCSearchResult } from '@/lib/yc-api';

interface YCCompanyResultsProps {
  searchResult: YCSearchResult;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

export const YCCompanyResults: React.FC<YCCompanyResultsProps> = ({ 
  searchResult, 
  onLoadMore, 
  isLoadingMore = false 
}) => {
  const { companies, searchTerm, totalFound } = searchResult;

  if (companies.length === 0) {
    return (
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 shadow-sm">
        <div className="p-6 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No YC Companies Found</h3>
          <p className="text-gray-600">
            No Y Combinator companies found for "{searchTerm}". Try a different search term or industry.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="text-xl">🚀</span>
              YC Companies
            </h4>
            <p className="text-gray-600 text-sm mt-1">
              Found {totalFound} companies matching "{searchTerm}" 
              {companies.length < totalFound && ` (showing top ${companies.length})`}
            </p>
          </div>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
            YC Portfolio
          </Badge>
        </div>

        <div className="space-y-3">
          {companies.map((company) => (
            <div key={company.id} className="bg-white border border-gray-200 hover:shadow-md transition-shadow rounded-xl">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Company Logo */}
                  <div className="flex-shrink-0">
                    {company.small_logo_url ? (
                      <img 
                        src={company.small_logo_url} 
                        alt={`${company.name} logo`}
                        className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm ${company.small_logo_url ? 'hidden' : ''}`}>
                      {company.name.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* Company Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h5 className="text-base font-semibold text-gray-900 truncate">
                            {company.name}
                          </h5>
                          {company.top_company && (
                            <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                              ⭐
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {company.batch}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-700 text-xs mb-2 line-clamp-2">
                          {company.one_liner}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-2">
                          {company.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{company.location}</span>
                            </div>
                          )}
                          {company.team_size > 0 && (
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>{company.team_size}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{company.status}</span>
                          </div>
                        </div>

                        {/* Tags */}
                        {company.tags && company.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {company.tags.slice(0, 2).map((tag, index) => (
                              <Badge 
                                key={index} 
                                variant="secondary" 
                                className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {company.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                                +{company.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Industry:</span> {company.industry}
                          {company.subindustry && company.subindustry !== company.industry && (
                            <span> • {company.subindustry}</span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-1">
                        {company.website && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-2"
                            onClick={() => window.open(company.website, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Site
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-2"
                          onClick={() => window.open(company.url, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          YC
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalFound > companies.length && (
          <div className="mt-4 space-y-3">
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-3">
                Showing {companies.length} of {totalFound} companies
              </p>
              {onLoadMore && (
                <Button
                  onClick={onLoadMore}
                  disabled={isLoadingMore}
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-orange-50 border-orange-200 text-orange-700 hover:text-orange-800"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin mr-2" />
                      Loading more...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Show More ({Math.min(20, totalFound - companies.length)} more)
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">
                <span className="text-orange-600 font-medium">💡 Tip:</span> Try a more specific search for different results
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 