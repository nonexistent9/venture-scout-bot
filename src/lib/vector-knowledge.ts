import OpenAI from 'openai';

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
  embedding?: number[];
}

export interface KnowledgeDatabase {
  metadata: {
    generatedAt: string;
    totalItems: number;
    embeddingModel: string;
    chunkSize: number;
    overlap: number;
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
  private openai: OpenAI | null = null;
  private isLoaded = false;

  constructor() {
    // Initialize OpenAI client if API key is available
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true // Required for client-side usage
      });
    }
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
    } catch (error) {
      console.error('❌ Failed to load knowledge database:', error);
      // Initialize empty database as fallback
      this.knowledgeDB = {
        metadata: {
          generatedAt: new Date().toISOString(),
          totalItems: 0,
          embeddingModel: 'text-embedding-ada-002',
          chunkSize: 800,
          overlap: 100
        },
        items: []
      };
      this.isLoaded = true;
    }
  }

  // Calculate cosine similarity between two vectors
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Generate embedding for a query
  private async generateQueryEmbedding(query: string): Promise<number[] | null> {
    if (!this.openai) {
      console.warn('OpenAI client not initialized - falling back to keyword search');
      return null;
    }

    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: query,
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating query embedding:', error);
      return null;
    }
  }

  // Calculate relevance score based on multiple factors
  private calculateRelevanceScore(
    item: KnowledgeItem, 
    similarity: number, 
    query: string
  ): number {
    let score = similarity * 100; // Base score from semantic similarity
    
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

  // Fallback keyword search when embeddings are not available
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
      
      // Count keyword matches
      queryWords.forEach(word => {
        const contentMatches = (lowerContent.match(new RegExp(word, 'g')) || []).length;
        const titleMatches = (lowerTitle.match(new RegExp(word, 'g')) || []).length;
        score += contentMatches + (titleMatches * 2);
      });
      
      // Topic matching
      item.topics.forEach(topic => {
        if (lowerQuery.includes(topic.replace('-', ' '))) {
          score += 10;
        }
      });
      
      if (score > 0) {
        const similarity = Math.min(score / 20, 1); // Normalize to 0-1
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

  // Main search function
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

    // Try vector search first
    const queryEmbedding = await this.generateQueryEmbedding(query);
    
    let results: SearchResult[] = [];
    
    if (queryEmbedding) {
      // Vector search using embeddings
      for (const item of this.knowledgeDB.items) {
        if (!item.embedding) continue;
        
        // Apply author filter if specified
        if (authorFilter && item.author !== authorFilter) continue;
        
        const similarity = this.cosineSimilarity(queryEmbedding, item.embedding);
        
        if (similarity >= minSimilarity) {
          results.push({
            item,
            similarity,
            relevanceScore: this.calculateRelevanceScore(item, similarity, query)
          });
        }
      }
      
      // Sort by relevance score
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } else {
      // Fallback to keyword search
      results = this.keywordSearch(query, limit * 2, authorFilter); // Get more for better filtering
    }
    
    // Apply limit
    const limitedResults = results.slice(0, limit);
    
    return {
      items: limitedResults,
      totalFound: results.length,
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