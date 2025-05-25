import React, { useState } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { Header } from '@/components/Header';
import { WelcomeScreen } from '@/components/WelcomeScreen';

const Index = () => {
  const [hasStarted, setHasStarted] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="container mx-auto px-6 py-16 max-w-6xl">
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
