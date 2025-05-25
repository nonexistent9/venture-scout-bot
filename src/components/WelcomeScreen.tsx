import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  return (
    <div className="max-w-5xl mx-auto text-center">
      <div className="mb-20">
        <h2 className="text-6xl font-bold text-gray-900 mb-8 leading-tight">
          Validate Your Startup Idea
          <span className="text-gray-600"> Instantly</span>
        </h2>
        <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
          Get AI-powered market insights, competitor analysis, and validation roadmap for your startup idea in minutes.
        </p>
        <Button 
          onClick={onStart}
          className="bg-gray-900 hover:bg-gray-800 text-white px-10 py-4 text-lg font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Start Validating →
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <Card className="bg-white border border-gray-100 p-8 text-left shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="text-3xl mb-4">🚀</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Elevator Pitch</h3>
          <p className="text-gray-600 leading-relaxed">
            Get a clear value proposition, target market description, and unique competitive advantage for your idea.
          </p>
        </Card>
        <Card className="bg-white border border-gray-100 p-8 text-left shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="text-3xl mb-4">🏢</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Competitor Analysis</h3>
          <p className="text-gray-600 leading-relaxed">
            Identify your main competitors with detailed descriptions and market positioning insights.
          </p>
        </Card>
        <Card className="bg-white border border-gray-100 p-8 text-left shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="text-3xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Risk Assessment</h3>
          <p className="text-gray-600 leading-relaxed">
            Understand the major risks and challenges your startup might face with actionable insights.
          </p>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6 text-sm">
        <div className="text-gray-500 font-medium">
          ✓ Market Research
        </div>
        <div className="text-gray-500 font-medium">
          ✓ Competitor Analysis
        </div>
        <div className="text-gray-500 font-medium">
          ✓ Risk Assessment
        </div>
      </div>
    </div>
  );
};
