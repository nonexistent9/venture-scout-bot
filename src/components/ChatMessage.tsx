
import React from 'react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isLongResponse = message.text.length > 200 && !message.isUser;
  
  return (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`${
          isLongResponse ? 'max-w-4xl w-full' : 'max-w-xs lg:max-w-md'
        } px-4 py-2 rounded-lg ${
          message.isUser
            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {isLongResponse ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2 className="text-lg font-bold text-gray-800 mt-4 mb-2 border-b border-gray-300 pb-1">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-md font-semibold text-gray-700 mt-3 mb-2">
                    {children}
                  </h3>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-gray-900">{children}</strong>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>
                ),
                li: ({ children }) => (
                  <li className="text-gray-700">{children}</li>
                ),
                p: ({ children }) => (
                  <p className="text-gray-700 mb-2 leading-relaxed">{children}</p>
                ),
                a: ({ href, children }) => (
                  <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {children}
                  </a>
                )
              }}
            >
              {message.text}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm">{message.text}</p>
        )}
        <p className={`text-xs mt-1 ${message.isUser ? 'text-white/70' : 'text-gray-500'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};
