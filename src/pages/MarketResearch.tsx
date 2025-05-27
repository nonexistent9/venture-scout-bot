import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import MarketValidationDashboard from '@/components/MarketValidationDashboard';

const MarketResearch = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the startup idea from navigation state or URL params
  const [startupIdea, setStartupIdea] = useState(
    location.state?.idea || new URLSearchParams(location.search).get('idea') || ''
  );

  const handleBack = () => {
    navigate('/chat');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Chat</span>
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">Market Research</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MarketValidationDashboard 
          idea={startupIdea}
          onClose={handleBack}
        />
      </div>
    </div>
  );
};

export default MarketResearch; 