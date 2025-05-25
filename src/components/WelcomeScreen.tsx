
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  return (
    <div className="max-w-4xl mx-auto text-center">
      <div className="mb-12">
        <h2 className="text-5xl font-bold text-white mb-6">
          Validate Your Startup Idea
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"> Instantly</span>
        </h2>
        <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
          Get AI-powered market insights, competitor analysis, and validation roadmap for your startup idea in minutes.
        </p>
        <Button 
          onClick={onStart}
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          Start Validating →
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 text-left">
          <h3 className="text-xl font-semibold text-white mb-3">🚀 Elevator Pitch</h3>
          <p className="text-white/70">
            Get a clear value proposition, target market description, and unique competitive advantage for your idea.
          </p>
        </Card>
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 text-left">
          <h3 className="text-xl font-semibold text-white mb-3">🏢 Competitor Analysis</h3>
          <p className="text-white/70">
            Identify your main competitors with detailed descriptions and market positioning insights.
          </p>
        </Card>
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 text-left">
          <h3 className="text-xl font-semibold text-white mb-3">⚠️ Risk Assessment</h3>
          <p className="text-white/70">
            Understand the major risks and challenges your startup might face with actionable insights.
          </p>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-4 text-sm">
        <div className="text-white/60">
          ✓ Market Research
        </div>
        <div className="text-white/60">
          ✓ Competitor Analysis
        </div>
        <div className="text-white/60">
          ✓ Risk Assessment
        </div>
      </div>
    </div>
  );
};
