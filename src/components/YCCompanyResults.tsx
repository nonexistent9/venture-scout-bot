import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Users, MapPin, Calendar } from 'lucide-react';
import { YCSearchResult } from '@/lib/yc-api';

interface YCCompanyResultsProps {
  searchResult: YCSearchResult;
}

export const YCCompanyResults: React.FC<YCCompanyResultsProps> = ({ searchResult }) => {
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
    <Card className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-2xl">🚀</span>
              Y Combinator Companies
            </h3>
            <p className="text-gray-600 mt-1">
              Found {totalFound} companies matching "{searchTerm}" 
              {companies.length < totalFound && ` (showing top ${companies.length})`}
            </p>
          </div>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
            YC Portfolio
          </Badge>
        </div>

        <div className="grid gap-4">
          {companies.map((company) => (
            <Card key={company.id} className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Company Logo */}
                  <div className="flex-shrink-0">
                    {company.small_logo_url ? (
                      <img 
                        src={company.small_logo_url} 
                        alt={`${company.name} logo`}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-lg ${company.small_logo_url ? 'hidden' : ''}`}>
                      {company.name.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* Company Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900 truncate">
                            {company.name}
                          </h4>
                          {company.top_company && (
                            <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                              ⭐ Top Company
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {company.batch}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                          {company.one_liner}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-3">
                          {company.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{company.location}</span>
                            </div>
                          )}
                          {company.team_size > 0 && (
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>{company.team_size} employees</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{company.status}</span>
                          </div>
                        </div>

                        {/* Tags */}
                        {company.tags && company.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {company.tags.slice(0, 3).map((tag, index) => (
                              <Badge 
                                key={index} 
                                variant="secondary" 
                                className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {company.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                                +{company.tags.length - 3} more
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
                      <div className="flex flex-col gap-2">
                        {company.website && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => window.open(company.website, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Website
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => window.open(company.url, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          YC Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {totalFound > companies.length && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Showing {companies.length} of {totalFound} companies. 
              <span className="text-orange-600 font-medium"> Try a more specific search to see different results.</span>
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}; 