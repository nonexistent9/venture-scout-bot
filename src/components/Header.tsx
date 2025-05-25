
import React from 'react';

export const Header = () => {
  return (
    <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SV</span>
            </div>
            <h1 className="text-xl font-bold text-white">Startup Idea Validator</h1>
          </div>
          <div className="text-sm text-white/70">
            Powered by AI • Early Stage Validation
          </div>
        </div>
      </div>
    </header>
  );
};
