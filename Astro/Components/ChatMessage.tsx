import React from 'react';
import type { Message } from '../types';
import ReactMarkdown from 'react-markdown';
import { BrainCircuitIcon } from './Icons';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAI = message.sender === 'ai';

  const LoadingDots = () => (
    <div className="flex items-center justify-start gap-1.5 text-slate-500 dark:text-slate-400">
      <span className="animate-bounce [animation-delay:-0.3s] w-2 h-2 bg-current rounded-full"></span>
      <span className="animate-bounce [animation-delay:-0.15s] w-2 h-2 bg-current rounded-full"></span>
      <span className="animate-bounce w-2 h-2 bg-current rounded-full"></span>
    </div>
  );

  if (isAI) {
    // Initial placeholder state before any text arrives.
    if (!message.text && !message.reasoning && message.isLoading) {
      return (
        <div className="self-start bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-3 max-w-xl">
            {message.isFixing ? (
              <div className="flex items-center justify-start gap-2 text-yellow-600 dark:text-yellow-400">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span className="text-sm">An error was detected. Attempting to fix...</span>
              </div>
            ) : (
              <LoadingDots />
            )}
        </div>
      );
    }
    
    // Main render for messages with content, potentially still loading more.
    return (
      <div className="self-start bg-slate-100 dark:bg-slate-800 rounded-lg max-w-3xl flex flex-col">
        {message.reasoning && (
          <details className="group p-4 border-b border-slate-200 dark:border-slate-700/80">
            <summary className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer list-none">
              <BrainCircuitIcon className="w-4 h-4" />
              Reasoning
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-auto transition-transform group-open:rotate-90" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </summary>
            <div className="prose prose-sm prose-slate dark:prose-invert max-w-none mt-3">
              <ReactMarkdown>{message.reasoning}</ReactMarkdown>
            </div>
          </details>
        )}
        {message.text && (
            <div className="p-4">
                <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                </div>
            </div>
        )}
        {message.isLoading && (
          <div className="px-4 pb-4 pt-2">
            <LoadingDots />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="self-end bg-blue-600 dark:bg-slate-700 text-white rounded-lg px-4 py-3 max-w-3xl">
      {message.image && (
        <div className="mb-2">
            <img 
                src={`data:${message.image.mimeType};base64,${message.image.data}`}
                alt="User content"
                className="rounded-lg max-w-xs max-h-64 object-contain"
            />
        </div>
      )}
      {message.text && <p className="text-sm whitespace-pre-wrap">{message.text}</p>}
    </div>
  );
};