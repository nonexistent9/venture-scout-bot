import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, User, Tag, Clock } from 'lucide-react';
import { KnowledgeItem } from '@/lib/vector-knowledge';

interface FullTextViewProps {
  item: KnowledgeItem;
  fullText: string;
  contextChunks: KnowledgeItem[];
  onBack: () => void;
}

export const FullTextView: React.FC<FullTextViewProps> = ({
  item,
  fullText,
  contextChunks,
  onBack
}) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'essay': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'passage': return 'bg-green-100 text-green-800 border-green-200';
      case 'clip': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'essay': return <BookOpen className="h-3 w-3" />;
      case 'passage': return <Tag className="h-3 w-3" />;
      case 'clip': return <Clock className="h-3 w-3" />;
      default: return <BookOpen className="h-3 w-3" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Results
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{item.author}</span>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-1">
                    {getTypeIcon(item.type)}
                    <span className="capitalize">{item.type}</span>
                  </div>
                  {contextChunks.length > 1 && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {contextChunks.length} chunks with context
                      </span>
                    </>
                  )}
                </div>
                
                {/* Topics */}
                {item.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.topics.map((topic) => (
                      <Badge
                        key={topic}
                        variant="secondary"
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 border-gray-200"
                      >
                        {topic.replace('-', ' ')}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <Badge className={`${getTypeColor(item.type)} text-xs ml-4`}>
                {item.type}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                {fullText}
              </div>
            </div>
            
            {/* Source info */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                <span className="font-medium">Source:</span> {item.source}
                {item.totalChunks > 1 && (
                  <span className="ml-2">
                    (Chunk {item.chunkIndex + 1} of {item.totalChunks})
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 