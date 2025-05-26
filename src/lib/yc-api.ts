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
}

export const ycApi = new YCApiService();

// Helper function to detect if a message contains YC company search triggers
export const detectYCSearchTriggers = (message: string): { shouldSearch: boolean; searchQuery: string } => {
  const lowerMessage = message.toLowerCase();
  
  const triggers = [
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
    'search y combinator'
  ];

  const foundTrigger = triggers.find(trigger => lowerMessage.includes(trigger));
  
  if (foundTrigger) {
    // Extract the search query after the trigger
    const triggerIndex = lowerMessage.indexOf(foundTrigger);
    const afterTrigger = message.substring(triggerIndex + foundTrigger.length).trim();
    
    // Clean up common words
    const cleanedQuery = afterTrigger
      .replace(/^(that|which|who|doing|in|for|with|are|is)\s+/i, '')
      .trim();
    
    return {
      shouldSearch: true,
      searchQuery: cleanedQuery || message
    };
  }

  return { shouldSearch: false, searchQuery: '' };
}; 