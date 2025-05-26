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

    const filteredCompanies = companies.filter(company => {
      const searchableText = [
        company.name,
        company.one_liner,
        company.long_description,
        company.industry,
        company.subindustry,
        ...company.tags
      ].join(' ').toLowerCase();

      return searchableText.includes(searchTerm);
    });

    // Sort by relevance (prioritize name matches, then one-liner, then description)
    const sortedCompanies = filteredCompanies.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aOneLiner = a.one_liner.toLowerCase();
      const bOneLiner = b.one_liner.toLowerCase();

      // Exact name match gets highest priority
      if (aName.includes(searchTerm) && !bName.includes(searchTerm)) return -1;
      if (!aName.includes(searchTerm) && bName.includes(searchTerm)) return 1;

      // One-liner match gets second priority
      if (aOneLiner.includes(searchTerm) && !bOneLiner.includes(searchTerm)) return -1;
      if (!aOneLiner.includes(searchTerm) && bOneLiner.includes(searchTerm)) return 1;

      // Top companies get preference
      if (a.top_company && !b.top_company) return -1;
      if (!a.top_company && b.top_company) return 1;

      return 0;
    });

    return {
      companies: sortedCompanies.slice(0, limit),
      searchTerm: query,
      totalFound: filteredCompanies.length
    };
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
    'ycombinator search'
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
  
  // Remove common YC-related prefixes
  let cleanedMessage = message
    .replace(/^(show me|find me|get me|list|display|tell me about|what are|which are|any)\s+/i, '')
    .replace(/\b(yc|ycombinator|y combinator|y-combinator)\s+(companies?|startups?)\s+/i, '')
    .replace(/\b(companies?|startups?)\s+(that|doing|in|for|with|like|similar to)\s+/i, '')
    .replace(/^(that|which|who|doing|in|for|with|are|is)\s+/i, '')
    .trim();

  // If the cleaned message is too short or generic, try to extract key terms
  if (cleanedMessage.length < 3) {
    // Look for industry terms, technology terms, or company names
    const words = message.split(/\s+/);
    const meaningfulWords = words.filter(word => 
      word.length > 2 && 
      !['the', 'and', 'for', 'are', 'that', 'with', 'like', 'yc', 'companies', 'startups'].includes(word.toLowerCase())
    );
    
    cleanedMessage = meaningfulWords.slice(-3).join(' '); // Take last 3 meaningful words
  }

  return cleanedMessage || message;
}; 