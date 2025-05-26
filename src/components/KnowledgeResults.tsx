import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, User, Tag, ExternalLink, Zap } from 'lucide-react';
import { VectorSearchResult, SearchResult } from '@/lib/vector-knowledge';

interface KnowledgeResultsProps {
  searchResult: VectorSearchResult;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  onCardClick?: (itemId: string) => void;
}

export const KnowledgeResults: React.FC<KnowledgeResultsProps> = ({
  searchResult,
  onLoadMore,
  isLoadingMore = false,
  onCardClick
}) => {
  const { items, totalFound, query } = searchResult;

  if (items.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No knowledge found for "{query}"</p>
            <p className="text-sm mt-2">Try searching for topics like "startup ideas", "fundraising", or "growth"</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Knowledge Results
        </h3>
        <Badge variant="secondary">
          {totalFound} found
        </Badge>
      </div>

      <div className="space-y-3">
        {items.map((result) => (
          <KnowledgeCard 
            key={result.item.id} 
            result={result} 
            onClick={onCardClick}
          />
        ))}
      </div>

      {onLoadMore && items.length < totalFound && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="w-full"
          >
            {isLoadingMore ? 'Loading...' : `Load More (${totalFound - items.length} remaining)`}
          </Button>
        </div>
      )}
    </div>
  );
};

interface KnowledgeCardProps {
  result: SearchResult;
  onClick?: (itemId: string) => void;
}

const KnowledgeCard: React.FC<KnowledgeCardProps> = ({ result, onClick }) => {
  const { item, similarity, relevanceScore } = result;
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'essay':
        return <BookOpen className="h-4 w-4" />;
      case 'passage':
        return <User className="h-4 w-4" />;
      case 'clip':
        return <ExternalLink className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'essay':
        return 'bg-blue-100 text-blue-800';
      case 'passage':
        return 'bg-green-100 text-green-800';
      case 'clip':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card 
      className={`hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
      onClick={() => onClick?.(item.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold text-gray-900 mb-1">
              {item.title}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-3 w-3" />
              <span>{item.author}</span>
              <span className="text-gray-400">•</span>
              <div className="flex items-center gap-1">
                {getTypeIcon(item.type)}
                <span className="capitalize">{item.type}</span>
              </div>
              <span className="text-gray-400">•</span>
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-yellow-500" />
                <span className="text-xs font-medium">{Math.round(relevanceScore)}%</span>
              </div>
            </div>
          </div>
          <Badge className={`${getTypeColor(item.type)} text-xs`}>
            {item.type}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-gray-700 mb-3 leading-relaxed">
          {item.content.length > 200 ? `${item.content.substring(0, 200)}...` : item.content}
        </p>
        
        {item.topics.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.topics.map((topic) => (
              <Badge
                key={topic}
                variant="outline"
                className="text-xs px-2 py-0.5"
              >
                <Tag className="h-2.5 w-2.5 mr-1" />
                {topic}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KnowledgeResults; 