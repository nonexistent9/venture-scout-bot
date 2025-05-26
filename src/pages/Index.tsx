import React from 'react';
import { TextLoop } from '@/components/ui/text-loop';
import { MagnetizeButton } from '@/components/ui/magnetize-button';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  const handleStartValidating = () => {
    // Navigate to the chat interface or validation page
    navigate('/chat');
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

        {/* Button */}
        <div className="flex justify-center">
          <MagnetizeButton 
            onClick={handleStartValidating}
            className="px-8 py-4 text-lg font-semibold bg-black hover:bg-gray-800 text-white border-black font-mono min-w-48 [&>div]:bg-gradient-to-r [&>div]:from-purple-400 [&>div]:to-purple-600 [&>span>svg]:text-white"
            particleCount={15}
            attractRadius={60}
          >
            Start Building
          </MagnetizeButton>
        </div>
      </div>
    </div>
  );
};

export default Index;
