// Types for our knowledge system
export interface KnowledgeItem {
  id: string;
  title: string;
  author: string;
  type: 'essay' | 'passage' | 'clip';
  content: string;
  topics: string[];
  source: string;
  chunkIndex: number;
  totalChunks: number;
}

export interface KnowledgeDatabase {
  metadata: {
    generatedAt: string;
    totalItems: number;
    embeddingModel: string;
    chunkSize: number;
    overlap: number;
    searchMethod?: string;
  };
  items: KnowledgeItem[];
}

export interface SearchResult {
  item: KnowledgeItem;
  similarity: number;
  relevanceScore: number;
}

export interface VectorSearchResult {
  items: SearchResult[];
  totalFound: number;
  query: string;
  searchTime: number;
}

class VectorKnowledgeAPI {
  private knowledgeDB: KnowledgeDatabase | null = null;
  private isLoaded = false;

  constructor() {
    // No external dependencies needed - pure keyword search
  }

  // Load knowledge database from embeddings file
  async loadKnowledge(): Promise<void> {
    if (this.isLoaded) return;

    try {
      const response = await fetch('/knowledge-embeddings.json');
      if (!response.ok) {
        throw new Error(`Failed to load knowledge database: ${response.status}`);
      }
      
      this.knowledgeDB = await response.json();
      this.isLoaded = true;
      
      console.log(`✅ Loaded knowledge database with ${this.knowledgeDB?.items.length} items`);
      console.log(`🔍 Search method: ${this.knowledgeDB?.metadata?.searchMethod || 'keyword-based'}`);
    } catch (error) {
      console.error('❌ Failed to load knowledge database:', error);
      // Initialize empty database as fallback
      this.knowledgeDB = {
        metadata: {
          generatedAt: new Date().toISOString(),
          totalItems: 0,
          embeddingModel: 'none',
          chunkSize: 800,
          overlap: 100,
          searchMethod: 'keyword-based'
        },
        items: []
      };
      this.isLoaded = true;
    }
  }

  // Calculate relevance score based on multiple factors
  private calculateRelevanceScore(
    item: KnowledgeItem, 
    similarity: number, 
    query: string
  ): number {
    let score = similarity * 100; // Base score from keyword similarity
    
    const lowerQuery = query.toLowerCase();
    const lowerContent = item.content.toLowerCase();
    const lowerTitle = item.title.toLowerCase();
    
    // Boost score for exact keyword matches
    const queryWords = lowerQuery.split(' ').filter(word => word.length > 2);
    queryWords.forEach(word => {
      if (lowerContent.includes(word)) score += 5;
      if (lowerTitle.includes(word)) score += 10;
    });
    
    // Boost score for topic relevance
    item.topics.forEach(topic => {
      if (lowerQuery.includes(topic.replace('-', ' '))) {
        score += 15;
      }
    });
    
    // Boost score for author mentions
    if (lowerQuery.includes('paul graham') || lowerQuery.includes('pg')) {
      if (item.author === 'Paul Graham') score += 20;
    }
    if (lowerQuery.includes('naval')) {
      if (item.author === 'Naval Ravikant') score += 20;
    }
    
    // Slight preference for complete essays over clips
    if (item.type === 'essay') score += 2;
    
    return Math.min(score, 100); // Cap at 100
  }

  // Advanced keyword search with fuzzy matching and scoring
  private keywordSearch(query: string, limit: number = 10, authorFilter?: string): SearchResult[] {
    if (!this.knowledgeDB) return [];
    
    const lowerQuery = query.toLowerCase();
    const queryWords = lowerQuery.split(' ').filter(word => word.length > 2);
    
    const results: SearchResult[] = [];
    
    for (const item of this.knowledgeDB.items) {
      // Apply author filter if specified
      if (authorFilter && item.author !== authorFilter) continue;
      
      let score = 0;
      const lowerContent = item.content.toLowerCase();
      const lowerTitle = item.title.toLowerCase();
      
      // Exact phrase matching gets highest score
      if (lowerContent.includes(lowerQuery) || lowerTitle.includes(lowerQuery)) {
        score += 50;
      }
      
      // Count keyword matches with diminishing returns
      queryWords.forEach((word, index) => {
        const contentMatches = (lowerContent.match(new RegExp('\\b' + word + '\\b', 'g')) || []).length;
        const titleMatches = (lowerTitle.match(new RegExp('\\b' + word + '\\b', 'g')) || []).length;
        
        // Weight earlier words more heavily
        const wordWeight = Math.max(1, 3 - index * 0.5);
        score += (contentMatches * wordWeight) + (titleMatches * wordWeight * 2);
      });
      
      // Topic matching with exact and partial matches
      item.topics.forEach(topic => {
        const topicWords = topic.replace('-', ' ').split(' ');
        
        // Exact topic match
        if (lowerQuery.includes(topic.replace('-', ' '))) {
          score += 15;
        }
        
        // Partial topic word matching
        topicWords.forEach(topicWord => {
          if (queryWords.includes(topicWord)) {
            score += 5;
          }
        });
      });
      
      // Length bonus for substantial content
      if (item.content.length > 500) score += 2;
      
      if (score > 0) {
        const similarity = Math.min(score / 30, 1); // Normalize to 0-1
        results.push({
          item,
          similarity,
          relevanceScore: this.calculateRelevanceScore(item, similarity, query)
        });
      }
    }
    
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  // Main search function - pure keyword search
  async searchKnowledge(
    query: string, 
    limit: number = 10,
    minSimilarity: number = 0.1,
    authorFilter?: string
  ): Promise<VectorSearchResult> {
    const startTime = Date.now();
    
    await this.loadKnowledge();
    
    if (!this.knowledgeDB || this.knowledgeDB.items.length === 0) {
      return {
        items: [],
        totalFound: 0,
        query,
        searchTime: Date.now() - startTime
      };
    }

    // Use advanced keyword search
    const results = this.keywordSearch(query, limit * 2, authorFilter);
    
    // Filter by minimum similarity
    const filteredResults = results.filter(result => result.similarity >= minSimilarity);
    
    // Apply final limit
    const limitedResults = filteredResults.slice(0, limit);
    
    return {
      items: limitedResults,
      totalFound: filteredResults.length,
      query,
      searchTime: Date.now() - startTime
    };
  }

  // Get contextually relevant knowledge based on content analysis
  async getRelevantKnowledge(
    content: string, 
    limit: number = 5
  ): Promise<SearchResult[]> {
    // Extract key topics and concepts from the content
    const topics = this.extractTopicsFromContent(content);
    const query = topics.join(' ');
    
    const result = await this.searchKnowledge(query, limit, 0.05);
    return result.items;
  }

  // Extract topics from content for contextual suggestions
  private extractTopicsFromContent(content: string): string[] {
    const lowerContent = content.toLowerCase();
    const topics: string[] = [];
    
    const topicKeywords = {
      'startup ideas': ['idea', 'startup idea', 'business idea', 'concept'],
      'fundraising': ['funding', 'investment', 'investor', 'money', 'capital'],
      'growth': ['growth', 'scale', 'scaling', 'user growth'],
      'product development': ['product', 'mvp', 'feature', 'development'],
      'marketing': ['marketing', 'customer acquisition', 'sales'],
      'team building': ['team', 'hiring', 'founder', 'employee'],
      'strategy': ['strategy', 'business model', 'plan'],
      'competition': ['competitor', 'competition', 'market'],
      'advice': ['advice', 'tip', 'lesson', 'mistake']
    };
    
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        topics.push(topic);
      }
    }
    
    return topics.length > 0 ? topics : ['startup advice'];
  }

  // Get full text with surrounding context for a knowledge item
  async getFullTextWithContext(itemId: string): Promise<{
    item: KnowledgeItem;
    fullText: string;
    contextChunks: KnowledgeItem[];
  } | null> {
    await this.loadKnowledge();
    
    if (!this.knowledgeDB) return null;
    
    const targetItem = this.knowledgeDB.items.find(item => item.id === itemId);
    if (!targetItem) return null;
    
    // For Naval passages/clips, return the full content as is
    if (targetItem.author === 'Naval Ravikant') {
      return {
        item: targetItem,
        fullText: targetItem.content,
        contextChunks: [targetItem]
      };
    }
    
    // For Paul Graham essays, get surrounding chunks
    const sameSourceItems = this.knowledgeDB.items
      .filter(item => 
        item.source === targetItem.source && 
        item.author === targetItem.author
      )
      .sort((a, b) => a.chunkIndex - b.chunkIndex);
    
    const targetIndex = sameSourceItems.findIndex(item => item.id === itemId);
    if (targetIndex === -1) {
      return {
        item: targetItem,
        fullText: targetItem.content,
        contextChunks: [targetItem]
      };
    }
    
    // Get 1 chunk before and 1 chunk after for context
    const startIndex = Math.max(0, targetIndex - 1);
    const endIndex = Math.min(sameSourceItems.length - 1, targetIndex + 1);
    
    const contextChunks = sameSourceItems.slice(startIndex, endIndex + 1);
    const fullText = contextChunks.map(chunk => chunk.content).join('\n\n');
    
    return {
      item: targetItem,
      fullText,
      contextChunks
    };
  }

  // Get knowledge statistics
  getStats(): any {
    if (!this.knowledgeDB) return null;
    
    const authorStats: Record<string, number> = {};
    const typeStats: Record<string, number> = {};
    const topicStats: Record<string, number> = {};
    
    this.knowledgeDB.items.forEach(item => {
      authorStats[item.author] = (authorStats[item.author] || 0) + 1;
      typeStats[item.type] = (typeStats[item.type] || 0) + 1;
      item.topics.forEach(topic => {
        topicStats[topic] = (topicStats[topic] || 0) + 1;
      });
    });
    
    return {
      metadata: this.knowledgeDB.metadata,
      authors: authorStats,
      types: typeStats,
      topics: topicStats
    };
  }
}

// Export singleton instance
export const vectorKnowledgeAPI = new VectorKnowledgeAPI(); 