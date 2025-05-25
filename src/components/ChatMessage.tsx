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
        } px-5 py-4 rounded-xl ${
          message.isUser
            ? 'bg-gray-900 text-white'
            : 'bg-gray-50 text-gray-800 border border-gray-100'
        }`}
      >
        {isLongResponse ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3 border-b border-gray-200 pb-2">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">
                    {children}
                  </h3>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900">{children}</strong>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-2 my-3">{children}</ul>
                ),
                li: ({ children }) => (
                  <li className="text-gray-700 leading-relaxed">{children}</li>
                ),
                p: ({ children }) => (
                  <p className="text-gray-700 mb-3 leading-relaxed">{children}</p>
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
