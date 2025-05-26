import fs from 'fs';
import path from 'path';

export interface KnowledgeItem {
  id: string;
  title: string;
  author: string;
  content: string;
  excerpt: string;
  topics: string[];
  filename: string;
  type: 'essay' | 'passage' | 'clip';
}

export interface KnowledgeIndex {
  items: KnowledgeItem[];
  topicIndex: Map<string, string[]>; // topic -> item IDs
  authorIndex: Map<string, string[]>; // author -> item IDs
}

// Common startup/business topics for categorization
const TOPIC_KEYWORDS = {
  'startup ideas': ['idea', 'ideas', 'startup idea', 'business idea', 'opportunity'],
  'fundraising': ['funding', 'investor', 'investment', 'raise money', 'venture capital', 'vc'],
  'growth': ['growth', 'scale', 'scaling', 'user acquisition', 'marketing'],
  'product': ['product', 'mvp', 'minimum viable product', 'feature', 'user experience'],
  'team': ['team', 'hiring', 'founder', 'cofounder', 'employee', 'culture'],
  'strategy': ['strategy', 'business model', 'competition', 'market', 'positioning'],
  'execution': ['execution', 'building', 'development', 'launch', 'shipping'],
  'leadership': ['leadership', 'management', 'ceo', 'decision', 'vision'],
  'failure': ['failure', 'mistake', 'error', 'wrong', 'fail'],
  'success': ['success', 'win', 'achievement', 'breakthrough', 'victory']
};

export class KnowledgeProcessor {
  private knowledgeIndex: KnowledgeIndex = {
    items: [],
    topicIndex: new Map(),
    authorIndex: new Map()
  };

  async processKnowledgeBase(knowledgeDir: string = './knowledge'): Promise<KnowledgeIndex> {
    console.log('Processing knowledge base...');
    
    try {
      const files = fs.readdirSync(knowledgeDir);
      
      for (const file of files) {
        const filePath = path.join(knowledgeDir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isFile()) {
          if (file.endsWith('.md')) {
            await this.processMarkdownFile(filePath, file);
          } else if (file.endsWith('.csv')) {
            await this.processCsvFile(filePath, file);
          }
        }
      }
      
      this.buildIndices();
      console.log(`Processed ${this.knowledgeIndex.items.length} knowledge items`);
      
      return this.knowledgeIndex;
    } catch (error) {
      console.error('Error processing knowledge base:', error);
      throw error;
    }
  }

  private async processMarkdownFile(filePath: string, filename: string) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      // Extract title (first # heading)
      let title = filename.replace('.md', '').replace(/^\d+_/, '');
      const titleMatch = content.match(/^#\s+(.+)$/m);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
      
      // Clean content (remove markdown formatting for search)
      const cleanContent = content
        .replace(/^#.*$/gm, '') // Remove headers
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
        .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
        .replace(/\*([^*]+)\*/g, '$1') // Remove italic
        .replace(/`([^`]+)`/g, '$1') // Remove code formatting
        .replace(/\n\s*\n/g, '\n') // Remove extra newlines
        .trim();
      
      // Create excerpt (first 200 characters)
      const excerpt = cleanContent.substring(0, 200) + (cleanContent.length > 200 ? '...' : '');
      
      // Determine topics based on content
      const topics = this.extractTopics(cleanContent.toLowerCase());
      
      const item: KnowledgeItem = {
        id: `md_${filename.replace('.md', '')}`,
        title,
        author: 'Paul Graham',
        content: cleanContent,
        excerpt,
        topics,
        filename,
        type: 'essay'
      };
      
      this.knowledgeIndex.items.push(item);
    } catch (error) {
      console.error(`Error processing ${filename}:`, error);
    }
  }

  private async processCsvFile(filePath: string, filename: string) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      if (lines.length < 2) return; // Need header + at least one row
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const isPassages = filename.includes('passages');
      const isClips = filename.includes('clips');
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        try {
          // Simple CSV parsing (assumes no commas in content)
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          
          if (values.length < 2) continue;
          
          const text = values[1] || values[0]; // Use second column or first if only one
          if (!text || text.length < 10) continue; // Skip very short content
          
          const excerpt = text.substring(0, 200) + (text.length > 200 ? '...' : '');
          const topics = this.extractTopics(text.toLowerCase());
          
          const item: KnowledgeItem = {
            id: `csv_${filename}_${i}`,
            title: isPassages ? `Naval Passage ${i}` : `Naval Clip ${i}`,
            author: 'Naval Ravikant',
            content: text,
            excerpt,
            topics,
            filename,
            type: isPassages ? 'passage' : 'clip'
          };
          
          this.knowledgeIndex.items.push(item);
        } catch (error) {
          console.error(`Error processing line ${i} in ${filename}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error processing ${filename}:`, error);
    }
  }

  private extractTopics(content: string): string[] {
    const topics: string[] = [];
    
    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
      for (const keyword of keywords) {
        if (content.includes(keyword.toLowerCase())) {
          topics.push(topic);
          break; // Only add topic once
        }
      }
    }
    
    return topics;
  }

  private buildIndices() {
    // Build topic index
    for (const item of this.knowledgeIndex.items) {
      for (const topic of item.topics) {
        if (!this.knowledgeIndex.topicIndex.has(topic)) {
          this.knowledgeIndex.topicIndex.set(topic, []);
        }
        this.knowledgeIndex.topicIndex.get(topic)!.push(item.id);
      }
      
      // Build author index
      if (!this.knowledgeIndex.authorIndex.has(item.author)) {
        this.knowledgeIndex.authorIndex.set(item.author, []);
      }
      this.knowledgeIndex.authorIndex.get(item.author)!.push(item.id);
    }
  }

  searchKnowledge(query: string, limit: number = 10): KnowledgeItem[] {
    const queryLower = query.toLowerCase();
    const results: { item: KnowledgeItem; score: number }[] = [];
    
    for (const item of this.knowledgeIndex.items) {
      let score = 0;
      
      // Title match (highest weight)
      if (item.title.toLowerCase().includes(queryLower)) {
        score += 10;
      }
      
      // Topic match (high weight)
      for (const topic of item.topics) {
        if (topic.includes(queryLower) || queryLower.includes(topic)) {
          score += 5;
        }
      }
      
      // Content match (lower weight)
      if (item.content.toLowerCase().includes(queryLower)) {
        score += 1;
      }
      
      // Author match
      if (item.author.toLowerCase().includes(queryLower)) {
        score += 3;
      }
      
      if (score > 0) {
        results.push({ item, score });
      }
    }
    
    // Sort by score and return top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.item);
  }

  getKnowledgeByTopic(topic: string, limit: number = 5): KnowledgeItem[] {
    const itemIds = this.knowledgeIndex.topicIndex.get(topic) || [];
    return itemIds
      .slice(0, limit)
      .map(id => this.knowledgeIndex.items.find(item => item.id === id))
      .filter(Boolean) as KnowledgeItem[];
  }

  getKnowledgeByAuthor(author: string, limit: number = 5): KnowledgeItem[] {
    const itemIds = this.knowledgeIndex.authorIndex.get(author) || [];
    return itemIds
      .slice(0, limit)
      .map(id => this.knowledgeIndex.items.find(item => item.id === id))
      .filter(Boolean) as KnowledgeItem[];
  }
}

// Singleton instance
export const knowledgeProcessor = new KnowledgeProcessor(); 