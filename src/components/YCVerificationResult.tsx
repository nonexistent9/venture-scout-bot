import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Users, MapPin, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { YCVerificationResult } from '@/lib/yc-api';

interface YCVerificationResultProps {
  verificationResult: YCVerificationResult;
}

export const YCVerificationResultComponent: React.FC<YCVerificationResultProps> = ({ verificationResult }) => {
  const { isYCCompany, company, searchedName, confidence, message } = verificationResult;

  const getConfidenceColor = (conf: string) => {
    switch (conf) {
      case 'exact': return 'bg-green-100 text-green-800 border-green-200';
      case 'high': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIcon = () => {
    if (!isYCCompany) return <XCircle className="w-6 h-6 text-red-500" />;
    if (confidence === 'exact' || confidence === 'high') return <CheckCircle className="w-6 h-6 text-green-500" />;
    return <AlertCircle className="w-6 h-6 text-yellow-500" />;
  };

  const getBorderColor = () => {
    if (!isYCCompany) return 'border-red-200';
    if (confidence === 'exact' || confidence === 'high') return 'border-green-200';
    return 'border-yellow-200';
  };

  const getBackgroundColor = () => {
    if (!isYCCompany) return 'from-red-50 to-pink-50';
    if (confidence === 'exact' || confidence === 'high') return 'from-green-50 to-emerald-50';
    return 'from-yellow-50 to-orange-50';
  };

  return (
    <Card className={`bg-gradient-to-r ${getBackgroundColor()} border ${getBorderColor()} shadow-sm`}>
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          {getIcon()}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              YC Company Verification
            </h3>
            <p className="text-gray-700 mb-3">{message}</p>
            
            {confidence !== 'none' && (
              <Badge variant="secondary" className={getConfidenceColor(confidence)}>
                {confidence.charAt(0).toUpperCase() + confidence.slice(1)} Confidence
              </Badge>
            )}
          </div>
        </div>

        {company && (
          <Card className="bg-white border border-gray-200 mt-4">
            <div className="p-4">
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
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 truncate">
                        {company.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {company.one_liner}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                        {company.batch}
                      </Badge>
                      {company.top_company && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          Top Company
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Company Details */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                    {company.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{company.location}</span>
                      </div>
                    )}
                    {company.team_size && (
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{company.team_size} employees</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{company.batch} batch</span>
                    </div>
                  </div>

                  {/* Industry and Tags */}
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        {company.industry}
                      </Badge>
                      {company.subindustry && company.subindustry !== company.industry && (
                        <Badge variant="outline" className="text-xs">
                          {company.subindustry}
                        </Badge>
                      )}
                      {company.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs bg-gray-50">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
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
          </Card>
        )}
      </div>
    </Card>
  );
}; 