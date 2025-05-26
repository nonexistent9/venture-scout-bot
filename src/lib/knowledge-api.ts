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

export interface KnowledgeSearchResult {
  items: KnowledgeItem[];
  totalFound: number;
  query: string;
}

// This will be populated with pre-processed knowledge data
let knowledgeIndex: KnowledgeItem[] = [];
let isLoaded = false;

// Topic keywords for smart categorization
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

export class KnowledgeAPI {
  async loadKnowledge(): Promise<void> {
    if (isLoaded) return;
    
    try {
      // For now, we'll create a sample dataset
      // In production, this would load from a pre-processed JSON file
      knowledgeIndex = await this.createSampleKnowledge();
      isLoaded = true;
      console.log(`Loaded ${knowledgeIndex.length} knowledge items`);
    } catch (error) {
      console.error('Error loading knowledge:', error);
      throw error;
    }
  }

  private async createSampleKnowledge(): Promise<KnowledgeItem[]> {
    // Sample knowledge items based on the files we saw
    return [
      {
        id: 'pg_founder_mode',
        title: 'Founder Mode',
        author: 'Paul Graham',
        content: `At a YC event last week Brian Chesky gave a talk that everyone who was there will remember. Most founders I talked to afterward said it was the best they'd ever heard. The theme of Brian's talk was that the conventional wisdom about how to run larger companies is mistaken. As Airbnb grew, well-meaning people advised him that he had to run the company in a certain way for it to scale. Their advice could be optimistically summarized as "hire good people and give them room to do their jobs." He followed this advice and the results were disastrous. So he had to figure out a better way on his own, which he did partly by studying how Steve Jobs ran Apple.

There are two different ways to run a company: founder mode and manager mode. Till now most people even in Silicon Valley have implicitly assumed that scaling a startup meant switching to manager mode. But we can infer the existence of another mode from the dismay of founders who've tried it, and the success of their attempts to escape from it.

The way managers are taught to run companies seems to be like modular design in the sense that you treat subtrees of the org chart as black boxes. You tell your direct reports what to do, and it's up to them to figure out how. But you don't get involved in the details of what they do. That would be micromanaging them, which is bad.

Hire good people and give them room to do their jobs. Sounds great when it's described that way, doesn't it? Except in practice, judging from the report of founder after founder, what this often turns out to mean is: hire professional fakers and let them drive the company into the ground.`,
        excerpt: 'At a YC event last week Brian Chesky gave a talk about how conventional wisdom about running larger companies is mistaken. There are two different ways to run a company: founder mode and manager mode...',
        topics: ['leadership', 'strategy', 'team'],
        filename: '224_founder_mode.md',
        type: 'essay'
      },
      {
        id: 'pg_startup_ideas',
        title: 'How to Get Startup Ideas',
        author: 'Paul Graham',
        content: `The way to get startup ideas is not to try to think of startup ideas. It's to look for problems, preferably problems you have yourself.

The very best startup ideas tend to have three things in common: they're something the founders themselves want, that they themselves can build, and that few others realize are worth doing. Microsoft, Apple, Yahoo, Google, and Facebook all began this way.

Why is it so important to work on a problem you have? Among other things, it ensures the problem really exists. It sounds obvious to say you should only work on problems that exist. And yet by far the most common mistake startups make is to solve problems no one has.

At YC we call these "made-up" or "sitcom" startup ideas. Imagine one of the characters on a TV show was starting a startup. The writers would have to invent something for it to do. But coming up with good startup ideas is hard. It's not something you can do for the asking.

When a startup launches, there have to be at least some users who really need what they're making -- not just people who could see themselves using it one day, but who want it urgently. Usually this initial group of users is small, for the simple reason that if there were something that large numbers of people urgently needed and that could be built with the amount of effort a startup usually puts into a version one, it would probably already exist.

Live in the future, then build what's missing.`,
        excerpt: 'The way to get startup ideas is not to try to think of startup ideas. It\'s to look for problems, preferably problems you have yourself. The very best startup ideas tend to have three things in common...',
        topics: ['startup ideas', 'product', 'strategy'],
        filename: '151_how_to_get_startup_ideas.md',
        type: 'essay'
      },
      {
        id: 'naval_wealth',
        title: 'Naval on Wealth Creation',
        author: 'Naval Ravikant',
        content: `Seek wealth, not money or status. Wealth is having assets that earn while you sleep. Money is how we transfer time and wealth. Status is your place in the social hierarchy.

You're not going to get rich renting out your time. You must own equity - a piece of a business - to gain your financial freedom.

You will get rich by giving society what it wants but does not yet know how to get. At scale.

Pick an industry where you can play long-term games with long-term people. All the returns in life, whether in wealth, relationships, or knowledge, come from compound interest.

Play iterated games. All the returns in life, whether in wealth, relationships, or knowledge, come from compound interest.

Pick business partners with high intelligence, energy, and above all, integrity.

Learn to sell. Learn to build. If you can do both, you will be unstoppable.`,
        excerpt: 'Seek wealth, not money or status. Wealth is having assets that earn while you sleep. You\'re not going to get rich renting out your time. You must own equity...',
        topics: ['success', 'strategy', 'team'],
        filename: 'naval_passages.csv',
        type: 'passage'
      },
      {
        id: 'pg_do_things_that_dont_scale',
        title: 'Do Things that Don\'t Scale',
        author: 'Paul Graham',
        content: `One of the most common types of advice we give at Y Combinator is to do things that don't scale. A lot of would-be founders believe that startups either take off or don't. You build something, make it available, and if you've made a better mousetrap, people beat a path to your door as promised. Or they don't, in which case the market must not exist.

Actually startups take off because the founders make them take off. There may be a handful of cases where a startup grew by itself, but usually it takes some sort of push to get them going. A good metaphor would be the cranking of an old car. Once you get the engine going, it runs by itself, but there's a separate and laborious process to get it started.

The most common unscalable thing founders have to do at the start is to recruit users manually. Nearly all startups have to. You can't wait for users to come to you. You have to go out and get them.

That's what Airbnb did. Getting your first users is always hard. But when you only have a small number of users, you can sometimes get away with doing things for them that you couldn't do for a larger number. And when you're a startup, that "small number" includes the first several hundred.

Airbnb's founders went door to door in New York, recruiting new users and helping existing ones improve their listings. When they launched, they got users by going to meetups and conferences. They'd set up a table and try to get people to sign up. Brian would even go to people's houses to help them take better photos of their listings.`,
        excerpt: 'One of the most common types of advice we give at Y Combinator is to do things that don\'t scale. Actually startups take off because the founders make them take off...',
        topics: ['growth', 'execution', 'startup ideas'],
        filename: '153_do_things_that_dont_scale.md',
        type: 'essay'
      }
    ];
  }

  searchKnowledge(query: string, limit: number = 10): KnowledgeSearchResult {
    if (!isLoaded) {
      return { items: [], totalFound: 0, query };
    }

    const queryLower = query.toLowerCase();
    const results: { item: KnowledgeItem; score: number }[] = [];
    
    for (const item of knowledgeIndex) {
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
    const sortedResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.item);
    
    return {
      items: sortedResults,
      totalFound: results.length,
      query
    };
  }

  getKnowledgeByTopic(topic: string, limit: number = 5): KnowledgeItem[] {
    if (!isLoaded) return [];
    
    return knowledgeIndex
      .filter(item => item.topics.includes(topic))
      .slice(0, limit);
  }

  getKnowledgeByAuthor(author: string, limit: number = 5): KnowledgeItem[] {
    if (!isLoaded) return [];
    
    return knowledgeIndex
      .filter(item => item.author.toLowerCase().includes(author.toLowerCase()))
      .slice(0, limit);
  }

  getRelevantKnowledge(context: string, limit: number = 3): KnowledgeItem[] {
    if (!isLoaded) return [];
    
    // Extract topics from context
    const contextLower = context.toLowerCase();
    const relevantTopics: string[] = [];
    
    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
      for (const keyword of keywords) {
        if (contextLower.includes(keyword)) {
          relevantTopics.push(topic);
          break;
        }
      }
    }
    
    if (relevantTopics.length === 0) {
      // Fallback to general startup advice
      return this.getKnowledgeByTopic('startup ideas', limit);
    }
    
    // Get knowledge items that match the relevant topics
    const relevantItems: KnowledgeItem[] = [];
    for (const topic of relevantTopics) {
      const items = this.getKnowledgeByTopic(topic, 2);
      relevantItems.push(...items);
    }
    
    // Remove duplicates and limit results
    const uniqueItems = relevantItems.filter((item, index, self) => 
      index === self.findIndex(i => i.id === item.id)
    );
    
    return uniqueItems.slice(0, limit);
  }

  getAllTopics(): string[] {
    return Object.keys(TOPIC_KEYWORDS);
  }

  getRandomKnowledge(limit: number = 3): KnowledgeItem[] {
    if (!isLoaded) return [];
    
    const shuffled = [...knowledgeIndex].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
  }
}

// Singleton instance
export const knowledgeAPI = new KnowledgeAPI(); 