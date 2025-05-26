export interface YCCompany {
  id: string;
  name: string;
  slug: string;
  website: string;
  small_logo_url: string;
  location: string;
  long_description: string;
  one_liner: string;
  team_size: number;
  industry: string;
  subindustry: string;
  batch: string;
  status: string;
  tags: string[];
  top_company: boolean;
  url: string;
}

export interface YCSearchResult {
  companies: YCCompany[];
  searchTerm: string;
  totalFound: number;
}

export interface YCVerificationResult {
  isYCCompany: boolean;
  company?: YCCompany;
  searchedName: string;
  confidence: 'exact' | 'high' | 'medium' | 'low' | 'none';
  message: string;
}

export interface YCQueryResult {
  type: 'search' | 'verification';
  searchResult?: YCSearchResult;
  verificationResult?: YCVerificationResult;
}

class YCApiService {
  private baseUrl = 'https://yc-oss.github.io/api';
  private companiesCache: YCCompany[] | null = null;

  async getAllCompanies(): Promise<YCCompany[]> {
    if (this.companiesCache) {
      return this.companiesCache;
    }

    try {
      const response = await fetch(`${this.baseUrl}/companies/all.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch companies: ${response.status}`);
      }
      
      this.companiesCache = await response.json();
      return this.companiesCache || [];
    } catch (error) {
      console.error('Error fetching YC companies:', error);
      return [];
    }
  }

  async getTopCompanies(): Promise<YCCompany[]> {
    try {
      const response = await fetch(`${this.baseUrl}/companies/top.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch top companies: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching top YC companies:', error);
      return [];
    }
  }

  async searchCompanies(query: string, limit: number = 10): Promise<YCSearchResult> {
    const companies = await this.getAllCompanies();
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) {
      return {
        companies: companies.slice(0, limit),
        searchTerm: query,
        totalFound: companies.length
      };
    }

    // Enhanced search with scoring
    const companiesWithScores = companies.map(company => ({
      company,
      score: this.calculateSearchScore(company, searchTerm)
    }));

    // Filter companies with score > 0 and sort by score
    const filteredCompanies = companiesWithScores
      .filter(item => item.score > 0)
      .sort((a, b) => {
        // First sort by score (higher is better)
        if (b.score !== a.score) return b.score - a.score;
        
        // Then by top company status
        if (a.company.top_company && !b.company.top_company) return -1;
        if (!a.company.top_company && b.company.top_company) return 1;
        
        return 0;
      })
      .map(item => item.company);

    return {
      companies: filteredCompanies.slice(0, limit),
      searchTerm: query,
      totalFound: filteredCompanies.length
    };
  }

  private calculateSearchScore(company: YCCompany, searchTerm: string): number {
    let score = 0;
    const normalizedSearchTerm = this.normalizeSearchTerm(searchTerm);
    const searchWords = this.extractSearchWords(normalizedSearchTerm);
    
    // Prepare company text fields
    const companyName = company.name.toLowerCase();
    const companyOneLiner = company.one_liner.toLowerCase();
    const companyDescription = company.long_description.toLowerCase();
    const companyIndustry = company.industry.toLowerCase();
    const companySubindustry = company.subindustry.toLowerCase();
    const companyTags = company.tags.map(tag => tag.toLowerCase());
    
    // Score weights
    const weights = {
      exactNameMatch: 100,
      nameWordMatch: 50,
      oneLinerExactMatch: 40,
      oneLinerWordMatch: 25,
      industryMatch: 30,
      tagMatch: 20,
      descriptionWordMatch: 10,
      partialMatch: 5
    };

    // Check for exact matches first
    if (companyName.includes(normalizedSearchTerm)) {
      score += weights.exactNameMatch;
    }
    
    if (companyOneLiner.includes(normalizedSearchTerm)) {
      score += weights.oneLinerExactMatch;
    }

    // Check industry matches
    if (companyIndustry.includes(normalizedSearchTerm) || companySubindustry.includes(normalizedSearchTerm)) {
      score += weights.industryMatch;
    }

    // Check tag matches
    for (const tag of companyTags) {
      if (tag.includes(normalizedSearchTerm)) {
        score += weights.tagMatch;
        break; // Don't double count tag matches
      }
    }

    // Word-based matching for better flexibility
    for (const word of searchWords) {
      if (word.length < 2) continue; // Skip very short words
      
      const expandedWords = this.expandSearchWord(word);
      
      for (const expandedWord of expandedWords) {
        // Name word matches
        if (companyName.includes(expandedWord)) {
          score += weights.nameWordMatch / expandedWords.length;
        }
        
        // One-liner word matches
        if (companyOneLiner.includes(expandedWord)) {
          score += weights.oneLinerWordMatch / expandedWords.length;
        }
        
        // Industry word matches
        if (companyIndustry.includes(expandedWord) || companySubindustry.includes(expandedWord)) {
          score += weights.industryMatch / expandedWords.length;
        }
        
        // Tag word matches
        for (const tag of companyTags) {
          if (tag.includes(expandedWord)) {
            score += weights.tagMatch / expandedWords.length;
            break;
          }
        }
        
        // Description word matches
        if (companyDescription.includes(expandedWord)) {
          score += weights.descriptionWordMatch / expandedWords.length;
        }
        
        // Partial word matches (for things like "tech" matching "technology")
        if (expandedWord.length >= 4) {
          const allText = [companyName, companyOneLiner, companyIndustry, companySubindustry, ...companyTags].join(' ');
          if (this.hasPartialMatch(allText, expandedWord)) {
            score += weights.partialMatch / expandedWords.length;
          }
        }
      }
    }

    return score;
  }

  private normalizeSearchTerm(term: string): string {
    return term
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private extractSearchWords(term: string): string[] {
    const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an']);
    return term
      .split(/\s+/)
      .filter(word => word.length > 1 && !stopWords.has(word));
  }

  private expandSearchWord(word: string): string[] {
    const synonyms: { [key: string]: string[] } = {
      'ai': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning'],
      'artificial': ['ai', 'artificial intelligence', 'machine learning'],
      'intelligence': ['ai', 'artificial intelligence', 'machine learning'],
      'ml': ['machine learning', 'ai', 'artificial intelligence'],
      'fintech': ['fintech', 'financial technology', 'finance', 'banking', 'payments'],
      'financial': ['fintech', 'financial technology', 'finance', 'banking'],
      'crypto': ['crypto', 'cryptocurrency', 'blockchain', 'bitcoin', 'ethereum'],
      'blockchain': ['blockchain', 'crypto', 'cryptocurrency', 'web3'],
      'web3': ['web3', 'blockchain', 'crypto', 'decentralized'],
      'saas': ['saas', 'software as a service', 'software'],
      'ecommerce': ['ecommerce', 'e-commerce', 'online shopping', 'retail'],
      'marketplace': ['marketplace', 'platform', 'market'],
      'social': ['social', 'social media', 'social network'],
      'mobile': ['mobile', 'app', 'smartphone', 'ios', 'android'],
      'health': ['health', 'healthcare', 'medical', 'wellness'],
      'healthcare': ['healthcare', 'health', 'medical', 'wellness'],
      'medical': ['medical', 'healthcare', 'health', 'wellness'],
      'food': ['food', 'restaurant', 'delivery', 'dining'],
      'delivery': ['delivery', 'logistics', 'shipping'],
      'logistics': ['logistics', 'delivery', 'shipping', 'supply chain'],
      'education': ['education', 'learning', 'edtech', 'teaching'],
      'edtech': ['edtech', 'education', 'learning', 'teaching'],
      'gaming': ['gaming', 'games', 'video games', 'entertainment'],
      'entertainment': ['entertainment', 'media', 'content', 'gaming'],
      'productivity': ['productivity', 'workflow', 'automation', 'tools'],
      'automation': ['automation', 'workflow', 'productivity', 'ai'],
      'analytics': ['analytics', 'data', 'insights', 'metrics'],
      'data': ['data', 'analytics', 'insights', 'big data'],
      'security': ['security', 'cybersecurity', 'privacy', 'safety'],
      'cybersecurity': ['cybersecurity', 'security', 'privacy'],
      'real': ['real estate', 'property', 'housing'],
      'estate': ['real estate', 'property', 'housing'],
      'property': ['property', 'real estate', 'housing'],
      'travel': ['travel', 'tourism', 'booking', 'hospitality'],
      'tourism': ['tourism', 'travel', 'hospitality'],
      'hospitality': ['hospitality', 'travel', 'tourism', 'hotel'],
      'energy': ['energy', 'renewable', 'solar', 'clean energy'],
      'renewable': ['renewable', 'energy', 'solar', 'clean energy'],
      'climate': ['climate', 'environmental', 'sustainability', 'green'],
      'environmental': ['environmental', 'climate', 'sustainability'],
      'sustainability': ['sustainability', 'environmental', 'climate', 'green']
    };

    const expanded = new Set([word]);
    
    // Add direct synonyms
    if (synonyms[word]) {
      synonyms[word].forEach(synonym => expanded.add(synonym));
    }
    
    // Add reverse lookups (if word appears in any synonym list)
    for (const [key, values] of Object.entries(synonyms)) {
      if (values.includes(word)) {
        expanded.add(key);
        values.forEach(synonym => expanded.add(synonym));
      }
    }
    
    return Array.from(expanded);
  }

  private hasPartialMatch(text: string, word: string): boolean {
    // Check if any word in the text starts with our search word
    const words = text.split(/\s+/);
    return words.some(textWord => 
      textWord.length >= word.length && 
      textWord.startsWith(word)
    );
  }

  async searchByIndustry(industry: string, limit: number = 10): Promise<YCSearchResult> {
    const companies = await this.getAllCompanies();
    const searchTerm = industry.toLowerCase().trim();
    
    const filteredCompanies = companies.filter(company => {
      return company.industry.toLowerCase().includes(searchTerm) ||
             company.subindustry.toLowerCase().includes(searchTerm);
    });

    return {
      companies: filteredCompanies.slice(0, limit),
      searchTerm: industry,
      totalFound: filteredCompanies.length
    };
  }

  async searchByTags(tags: string[], limit: number = 10): Promise<YCSearchResult> {
    const companies = await this.getAllCompanies();
    
    const filteredCompanies = companies.filter(company => {
      return tags.some(tag => 
        company.tags.some(companyTag => 
          companyTag.toLowerCase().includes(tag.toLowerCase())
        )
      );
    });

    return {
      companies: filteredCompanies.slice(0, limit),
      searchTerm: tags.join(', '),
      totalFound: filteredCompanies.length
    };
  }

  async verifyCompany(companyName: string): Promise<YCVerificationResult> {
    const companies = await this.getAllCompanies();
    const searchName = companyName.toLowerCase().trim();
    
    if (!searchName) {
      return {
        isYCCompany: false,
        searchedName: companyName,
        confidence: 'none',
        message: 'Please provide a company name to verify.'
      };
    }

    // Try exact name match first
    let exactMatch = companies.find(company => 
      company.name.toLowerCase() === searchName
    );

    if (exactMatch) {
      return {
        isYCCompany: true,
        company: exactMatch,
        searchedName: companyName,
        confidence: 'exact',
        message: `Yes! ${exactMatch.name} is a Y Combinator company from the ${exactMatch.batch} batch.`
      };
    }

    // Try partial name matches
    const partialMatches = companies.filter(company => {
      const companyNameLower = company.name.toLowerCase();
      return companyNameLower.includes(searchName) || searchName.includes(companyNameLower);
    });

    if (partialMatches.length === 1) {
      const match = partialMatches[0];
      return {
        isYCCompany: true,
        company: match,
        searchedName: companyName,
        confidence: 'high',
        message: `Yes! Found "${match.name}" (${match.batch} batch) - this appears to match "${companyName}".`
      };
    }

    if (partialMatches.length > 1) {
      // Multiple matches - return the most relevant one
      const bestMatch = partialMatches.sort((a, b) => {
        const aScore = this.calculateNameSimilarity(searchName, a.name.toLowerCase());
        const bScore = this.calculateNameSimilarity(searchName, b.name.toLowerCase());
        return bScore - aScore;
      })[0];

      return {
        isYCCompany: true,
        company: bestMatch,
        searchedName: companyName,
        confidence: 'medium',
        message: `Found "${bestMatch.name}" (${bestMatch.batch} batch) which might match "${companyName}". There are ${partialMatches.length} similar companies in YC.`
      };
    }

    // Try fuzzy matching on company descriptions and tags
    const fuzzyMatches = companies.filter(company => {
      const searchableText = [
        company.name,
        company.one_liner,
        ...company.tags
      ].join(' ').toLowerCase();
      
      return searchableText.includes(searchName);
    });

    if (fuzzyMatches.length > 0) {
      const bestMatch = fuzzyMatches[0];
      return {
        isYCCompany: true,
        company: bestMatch,
        searchedName: companyName,
        confidence: 'low',
        message: `Found "${bestMatch.name}" (${bestMatch.batch} batch) which might be related to "${companyName}". This is based on description/tag matching.`
      };
    }

    return {
      isYCCompany: false,
      searchedName: companyName,
      confidence: 'none',
      message: `No, "${companyName}" does not appear to be a Y Combinator company in our database.`
    };
  }

  private calculateNameSimilarity(name1: string, name2: string): number {
    // Simple similarity calculation based on common words and character overlap
    const words1 = name1.split(/\s+/);
    const words2 = name2.split(/\s+/);
    
    let commonWords = 0;
    words1.forEach(word1 => {
      if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
        commonWords++;
      }
    });
    
    return commonWords / Math.max(words1.length, words2.length);
  }
}

export const ycApi = new YCApiService();

// Helper function to detect if a message contains YC company verification triggers
export const detectYCVerificationTriggers = (message: string): { shouldVerify: boolean; companyName: string } => {
  const lowerMessage = message.toLowerCase();
  
  // Patterns for verification queries
  const verificationPatterns = [
    /is\s+(.+?)\s+(?:a\s+)?(?:yc|y combinator|ycombinator)\s+company/i,
    /is\s+(.+?)\s+(?:in\s+)?(?:yc|y combinator|ycombinator)/i,
    /(?:was|is)\s+(.+?)\s+funded\s+by\s+(?:yc|y combinator|ycombinator)/i,
    /did\s+(?:yc|y combinator|ycombinator)\s+fund\s+(.+)/i,
    /(.+?)\s+(?:yc|y combinator|ycombinator)\s+company\?/i,
    /check\s+if\s+(.+?)\s+is\s+(?:a\s+)?(?:yc|y combinator|ycombinator)/i,
    /(.+?)\s+(?:part\s+of|in)\s+(?:yc|y combinator|ycombinator)/i,
    /(?:yc|y combinator|ycombinator)\s+portfolio.*?(.+)/i
  ];

  for (const pattern of verificationPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      let companyName = match[1].trim();
      
      // Clean up the company name
      companyName = companyName
        .replace(/^(the|a|an)\s+/i, '')
        .replace(/\s+(company|startup|firm|business)$/i, '')
        .replace(/[?.,!]$/g, '')
        .trim();
      
      if (companyName.length > 1) {
        return {
          shouldVerify: true,
          companyName: companyName
        };
      }
    }
  }

  return { shouldVerify: false, companyName: '' };
};

// Enhanced function to detect both search and verification queries
export const detectYCQuery = (message: string): { 
  type: 'search' | 'verification' | 'none'; 
  query: string; 
} => {
  // First check for verification queries
  const { shouldVerify, companyName } = detectYCVerificationTriggers(message);
  if (shouldVerify) {
    return {
      type: 'verification',
      query: companyName
    };
  }

  // Then check for search queries (using the existing logic)
  const { shouldSearch, searchQuery } = detectYCSearchTriggers(message);
  if (shouldSearch) {
    return {
      type: 'search',
      query: searchQuery
    };
  }

  return { type: 'none', query: '' };
};

// Keep the original function for backward compatibility
export const detectYCSearchTriggers = (message: string): { shouldSearch: boolean; searchQuery: string } => {
  const lowerMessage = message.toLowerCase();
  
  // Primary triggers - explicit search phrases
  const primaryTriggers = [
    'show me companies like',
    'find companies like',
    'yc companies doing',
    'y combinator companies',
    'similar companies',
    'companies in',
    'startups like',
    'find similar startups',
    'what companies do',
    'companies that',
    'show companies',
    'find startups',
    'search for companies',
    'look up companies',
    'companies doing',
    'yc startups',
    'y combinator startups',
    'show me startups',
    'find me companies',
    'search yc',
    'search y combinator',
    'lookup yc',
    'look up yc',
    'yc search',
    'ycombinator search',
    'companies similar to',
    'startups similar to',
    'yc companies in',
    'y combinator companies in',
    'companies working on',
    'startups working on',
    'what yc companies',
    'which yc companies',
    'any yc companies',
    'list yc companies',
    'show yc companies',
    'find yc companies',
    'yc portfolio companies',
    'y combinator portfolio',
    'companies from yc',
    'startups from yc',
    'yc backed companies',
    'y combinator backed'
  ];

  // YC-specific keywords that when combined with action words should trigger search
  const ycKeywords = ['yc', 'ycombinator', 'y combinator', 'y-combinator'];
  const actionWords = [
    'find', 'search', 'look', 'lookup', 'show', 'get', 'fetch', 'give',
    'list', 'display', 'tell', 'what', 'which', 'any', 'are there'
  ];
  const targetWords = [
    'companies', 'startups', 'company', 'startup', 'firms', 'businesses'
  ];

  // Check for primary triggers first
  const foundPrimaryTrigger = primaryTriggers.find(trigger => lowerMessage.includes(trigger));
  
  if (foundPrimaryTrigger) {
    // Extract the search query after the trigger
    const triggerIndex = lowerMessage.indexOf(foundPrimaryTrigger);
    const afterTrigger = message.substring(triggerIndex + foundPrimaryTrigger.length).trim();
    
    // Clean up common words
    const cleanedQuery = afterTrigger
      .replace(/^(that|which|who|doing|in|for|with|are|is)\s+/i, '')
      .trim();
    
    return {
      shouldSearch: true,
      searchQuery: cleanedQuery || extractMainSearchTerm(message)
    };
  }

  // Check for YC-specific patterns (YC + action + target)
  const hasYCKeyword = ycKeywords.some(keyword => lowerMessage.includes(keyword));
  const hasActionWord = actionWords.some(action => lowerMessage.includes(action));
  const hasTargetWord = targetWords.some(target => lowerMessage.includes(target));

  if (hasYCKeyword && hasActionWord && hasTargetWord) {
    return {
      shouldSearch: true,
      searchQuery: extractMainSearchTerm(message)
    };
  }

  // Check for simple YC mentions with search intent
  if (hasYCKeyword) {
    // Look for patterns like "any yc companies that...", "yc companies in...", etc.
    const searchPatterns = [
      /yc?\s+(companies?|startups?)\s+(that|doing|in|for|with|like)/i,
      /(any|some|which)\s+yc?\s+(companies?|startups?)/i,
      /yc?\s+(companies?|startups?)\s+similar/i,
      /(show|find|get|list)\s+.*yc/i,
      /yc.*\s+(similar|like|doing|in)\s+/i
    ];

    const hasSearchPattern = searchPatterns.some(pattern => pattern.test(lowerMessage));
    
    if (hasSearchPattern) {
      return {
        shouldSearch: true,
        searchQuery: extractMainSearchTerm(message)
      };
    }
  }

  return { shouldSearch: false, searchQuery: '' };
};

// Helper function to extract the main search term from a message
const extractMainSearchTerm = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  // Enhanced patterns for extracting search terms
  const extractionPatterns = [
    // "companies like X" or "startups like X"
    /(?:companies?|startups?)\s+(?:like|similar to)\s+(.+)/i,
    // "X companies" or "X startups"
    /(.+?)\s+(?:companies?|startups?)(?:\s|$)/i,
    // "companies doing X" or "startups doing X"
    /(?:companies?|startups?)\s+(?:doing|in|for|that)\s+(.+)/i,
    // "find X" or "show X"
    /(?:find|show|get|list|search)\s+(?:me\s+)?(?:companies?|startups?)?\s*(?:doing|in|like|for)?\s*(.+)/i,
    // "X industry" or "X sector"
    /(.+?)\s+(?:industry|sector|space|market)(?:\s|$)/i,
    // After "yc companies" or similar
    /(?:yc|y combinator|ycombinator)\s+(?:companies?|startups?)\s+(?:doing|in|for|like|that)\s+(.+)/i,
    // Generic pattern - everything after common prefixes
    /(?:show me|find me|get me|list|display|tell me about|what are|which are|any)\s+(?:yc\s+)?(?:companies?|startups?)?\s*(?:doing|in|like|for|that)?\s*(.+)/i
  ];

  // Try each pattern
  for (const pattern of extractionPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      let extracted = match[1].trim();
      
      // Clean up the extracted term
      extracted = extracted
        .replace(/^(the|a|an)\s+/i, '')
        .replace(/\s+(company|startup|firm|business|industry|sector|space|market)$/i, '')
        .replace(/[?.,!]$/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (extracted.length > 1) {
        return extracted;
      }
    }
  }

  // Fallback: remove common prefixes and suffixes
  let cleanedMessage = message
    .replace(/^(show me|find me|get me|list|display|tell me about|what are|which are|any)\s+/i, '')
    .replace(/\b(yc|ycombinator|y combinator|y-combinator)\s+(companies?|startups?)\s+/i, '')
    .replace(/\b(companies?|startups?)\s+(that|doing|in|for|with|like|similar to)\s+/i, '')
    .replace(/^(that|which|who|doing|in|for|with|are|is)\s+/i, '')
    .replace(/[?.,!]$/g, '')
    .trim();

  // If still too short, extract meaningful words
  if (cleanedMessage.length < 3) {
    const words = message.split(/\s+/);
    const stopWords = new Set(['the', 'and', 'for', 'are', 'that', 'with', 'like', 'yc', 'companies', 'startups', 'show', 'find', 'me', 'get', 'list']);
    const meaningfulWords = words.filter(word => 
      word.length > 2 && 
      !stopWords.has(word.toLowerCase())
    );
    
    cleanedMessage = meaningfulWords.slice(-3).join(' '); // Take last 3 meaningful words
  }

  return cleanedMessage || message;
}; 