import React from 'react';
import { TextLoop } from '@/components/ui/text-loop';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  const handleStartValidating = () => {
    // Navigate to the chat interface or validation page
    navigate('/chat');
  };

  const handleBrowseYC = () => {
    // Navigate to the YC companies page
    navigate('/startups');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-transparent flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-4xl mx-auto">
        {/* Text Loop Component */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold text-black mb-4 font-mono">
            <TextLoop interval={1.5} className="text-black font-mono">
              <span>Validate your idea</span>
              <span>Get feedback instantly</span>
              <span>Tap into the wisdom of<br />Paul Graham</span>
              <span>Search the philosophy of<br />Naval Ravikant</span>
              <span>Browse YC companies</span>
            </TextLoop>
          </h1>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={handleStartValidating}
            size="lg"
            className="px-8 py-4 text-lg font-semibold bg-black hover:bg-gray-800 text-white font-mono"
          >
            Start Validating
          </Button>
          <Button 
            onClick={handleBrowseYC}
            variant="outline"
            size="lg"
            className="px-8 py-4 text-lg font-semibold border-black text-black hover:bg-gray-100 font-mono"
          >
            Browse YC Companies
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
