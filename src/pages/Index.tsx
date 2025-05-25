
import React, { useState } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { Header } from '@/components/Header';
import { WelcomeScreen } from '@/components/WelcomeScreen';

const Index = () => {
  const [hasStarted, setHasStarted] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {!hasStarted ? (
          <WelcomeScreen onStart={() => setHasStarted(true)} />
        ) : (
          <ChatInterface />
        )}
      </div>
    </div>
  );
};

export default Index;
