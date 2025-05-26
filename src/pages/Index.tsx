import React, { useState } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { ComparisonInterface } from '@/components/ComparisonInterface';
import { Header } from '@/components/Header';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, BarChart3 } from 'lucide-react';

const Index = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [activeTab, setActiveTab] = useState('single');

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="container mx-auto px-6 py-16 max-w-6xl">
        {!hasStarted ? (
          <WelcomeScreen onStart={() => setHasStarted(true)} />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="single" className="flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Single Analysis</span>
                </TabsTrigger>
                <TabsTrigger value="compare" className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Compare Ideas</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="single">
              <ChatInterface />
            </TabsContent>
            
            <TabsContent value="compare">
              <ComparisonInterface />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Index;
