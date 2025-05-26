import React from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { Header } from '@/components/Header';

const Chat = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="container mx-auto px-6 py-16 max-w-6xl">
        <ChatInterface />
      </div>
    </div>
  );
};

export default Chat; 