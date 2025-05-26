import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const Header = () => {
  const location = useLocation();

  return (
    <header className="bg-white border-b border-gray-100">
      <div className="container mx-auto px-6 py-6 max-w-6xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                <span className="text-white font-semibold text-lg">SV</span>
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">Startup Idea Validator</h1>
            </Link>
          </div>
          
          <div className="flex items-center space-x-6">
            <nav className="flex items-center space-x-4">
              <Link to="/">
                <Button 
                  variant={location.pathname === '/' ? 'default' : 'ghost'}
                  size="sm"
                >
                  Validator
                </Button>
              </Link>
              <Link to="/startups">
                <Button 
                  variant={location.pathname === '/startups' ? 'default' : 'ghost'}
                  size="sm"
                >
                  YC Directory
                </Button>
              </Link>
            </nav>
            
            <div className="text-sm text-gray-500 font-medium">
              Powered by AI • Early Stage Validation
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
