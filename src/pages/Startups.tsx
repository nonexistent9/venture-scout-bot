import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ycApi, YCCompany } from '@/lib/yc-api';
import { Search, ExternalLink, Users, Calendar, Building2, Tag, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Startups = () => {
  const [companies, setCompanies] = useState<YCCompany[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<YCCompany[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [industries, setIndustries] = useState<string[]>([]);
  const [batches, setBatches] = useState<string[]>([]);

  const companiesPerPage = 20;

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [companies, searchQuery, selectedIndustry, selectedBatch]);

  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      const allCompanies = await ycApi.getAllCompanies();
      setCompanies(allCompanies);
      
      // Extract unique industries and batches for filters
      const uniqueIndustries = [...new Set(allCompanies.map(c => c.industry))].sort();
      const uniqueBatches = [...new Set(allCompanies.map(c => c.batch))].sort().reverse();
      
      setIndustries(uniqueIndustries);
      setBatches(uniqueBatches);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterCompanies = () => {
    let filtered = companies;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(company => 
        company.name.toLowerCase().includes(query) ||
        company.one_liner.toLowerCase().includes(query) ||
        company.industry.toLowerCase().includes(query) ||
        company.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Industry filter
    if (selectedIndustry !== 'all') {
      filtered = filtered.filter(company => company.industry === selectedIndustry);
    }

    // Batch filter
    if (selectedBatch !== 'all') {
      filtered = filtered.filter(company => company.batch === selectedBatch);
    }

    setFilteredCompanies(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * companiesPerPage,
    currentPage * companiesPerPage
  );

  const totalPages = Math.ceil(filteredCompanies.length / companiesPerPage);

  const CompanyCard = ({ company }: { company: YCCompany }) => (
    <Card className="p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {company.small_logo_url ? (
            <img 
              src={company.small_logo_url} 
              alt={`${company.name} logo`}
              className="w-12 h-12 rounded-lg object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {company.name}
            </h3>
            <div className="flex items-center space-x-2 ml-4">
              {company.top_company && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Top Company
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {company.batch}
              </Badge>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {company.one_liner}
          </p>
          
          <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
            <div className="flex items-center space-x-1">
              <Users className="w-3 h-3" />
              <span>{company.team_size} employees</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{company.batch}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Tag className="w-3 h-3" />
              <span>{company.industry}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {company.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {company.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{company.tags.length - 3} more
                </Badge>
              )}
            </div>
            
            {company.website && (
              <Button variant="ghost" size="sm" asChild>
                <a 
                  href={company.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Visit</span>
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link to="/" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Y Combinator Startups Directory
            </h1>
          </div>
          <p className="text-gray-600">
            Browse and search through {companies.length} Y Combinator companies
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-8">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search companies by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <Tabs defaultValue="filters" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="filters">Filters</TabsTrigger>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="filters" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industry
                    </label>
                    <select
                      value={selectedIndustry}
                      onChange={(e) => setSelectedIndustry(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    >
                      <option value="all">All Industries</option>
                      {industries.map(industry => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Batch
                    </label>
                    <select
                      value={selectedBatch}
                      onChange={(e) => setSelectedBatch(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    >
                      <option value="all">All Batches</option>
                      {batches.map(batch => (
                        <option key={batch} value={batch}>
                          {batch}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="stats" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{companies.length}</div>
                    <div className="text-sm text-gray-600">Total Companies</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{filteredCompanies.length}</div>
                    <div className="text-sm text-gray-600">Filtered Results</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{industries.length}</div>
                    <div className="text-sm text-gray-600">Industries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{batches.length}</div>
                    <div className="text-sm text-gray-600">Batches</div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading companies...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Showing {((currentPage - 1) * companiesPerPage) + 1}-{Math.min(currentPage * companiesPerPage, filteredCompanies.length)} of {filteredCompanies.length} companies
              </p>
              
              {(searchQuery || selectedIndustry !== 'all' || selectedBatch !== 'all') && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedIndustry('all');
                    setSelectedBatch('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Companies Grid */}
            <div className="space-y-4 mb-8">
              {paginatedCompanies.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}

            {filteredCompanies.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search terms or filters
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedIndustry('all');
                    setSelectedBatch('all');
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Startups; 