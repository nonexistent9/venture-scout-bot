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
          isLongResponse ? 'max-w-full w-full' : 'max-w-xs'
        } px-4 py-3 rounded-xl ${
          message.isUser
            ? 'bg-gray-900 text-white'
            : 'bg-white text-gray-800 border border-gray-200'
        }`}
      >
        {isLongResponse ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2 className="text-base font-semibold text-gray-900 mt-4 mb-2 border-b border-gray-200 pb-1">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-medium text-gray-800 mt-3 mb-2">
                    {children}
                  </h3>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900">{children}</strong>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>
                ),
                li: ({ children }) => (
                  <li className="text-gray-700 leading-relaxed text-sm">{children}</li>
                ),
                p: ({ children }) => (
                  <p className="text-gray-700 mb-2 leading-relaxed text-sm">{children}</p>
                ),
                a: ({ href, children }) => (
                  <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-900 hover:text-gray-700 underline font-medium"
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
          <p className="text-sm leading-relaxed">{message.text}</p>
        )}
        <p className={`text-xs mt-2 ${message.isUser ? 'text-white/70' : 'text-gray-500'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};
