import React, { useRef, useEffect } from 'react';
import type { Message } from '../types';
import { ChatMessage } from './ChatMessage';
import { StopIcon, PlusIcon, ImageIcon, XIcon } from './Icons';
import { DropdownMenu, type MenuItem } from './DropdownMenu';
import { ImagePromptCard } from './ImagePromptCard';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatPaneProps {
  messages: Message[];
  userInput: string;
  onUserInputChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onStopGeneration: () => void;
  isLoading: boolean;
  imageForPrompt: { data: string; mimeType: string } | null;
  onSetImageForPrompt: (image: { data: string; mimeType: string } | null) => void;
}

export const ChatPane: React.FC<ChatPaneProps> = ({ 
    messages, 
    userInput, 
    onUserInputChange, 
    onSendMessage, 
    onStopGeneration, 
    isLoading,
    imageForPrompt,
    onSetImageForPrompt
}) => {
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);
    
    useEffect(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        const maxHeight = 200;
        textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      }
    }, [userInput]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSendMessage(e as unknown as React.FormEvent);
        }
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64String = (event.target?.result as string)?.split(',')[1];
            if (base64String) {
                onSetImageForPrompt({
                    data: base64String,
                    mimeType: file.type,
                });
            }
        };
        reader.readAsDataURL(file);
        if (e.target) e.target.value = '';
    };

    const handleAddImageClick = () => {
        imageInputRef.current?.click();
    };

    const addImageMenuItems: MenuItem[] = [
        { label: 'Insert Image', action: handleAddImageClick, icon: ImageIcon },
    ];

    const animationProps = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 20 },
        transition: { duration: 0.3, ease: 'easeInOut' },
    };


  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2" ref={chatContainerRef}>
            {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
            ))}
        </div>
        <form onSubmit={onSendMessage} className="relative mt-4 flex-shrink-0">
            <AnimatePresence mode="wait">
                {imageForPrompt ? (
                    <motion.div key="image-input" {...animationProps}>
                        <ImagePromptCard
                            image={imageForPrompt}
                            userInput={userInput}
                            onUserInputChange={onUserInputChange}
                            onKeyDown={handleKeyDown}
                            onRemoveImage={() => onSetImageForPrompt(null)}
                            isLoading={isLoading}
                            onStopGeneration={onStopGeneration}
                        />
                    </motion.div>
                ) : (
                    <motion.div key="text-input" {...animationProps}>
                        <div className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl shadow-inner transition-all focus-within:ring-2 focus-within:ring-blue-500 dark:focus-within:ring-slate-500">
                            <div className="flex items-end p-1.5">
                                <div className="flex-shrink-0 self-end p-2">
                                    <DropdownMenu
                                        trigger={
                                            <button type="button" className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Add attachment">
                                                <PlusIcon className="w-5 h-5" />
                                            </button>
                                        }
                                        items={addImageMenuItems}
                                        position="top"
                                    />
                                </div>
                                <textarea
                                    ref={textareaRef}
                                    value={userInput}
                                    onChange={onUserInputChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Describe the app you want to create..."
                                    className="w-full pl-1 pr-24 py-2.5 text-sm text-slate-700 dark:text-slate-300 bg-transparent focus:outline-none resize-none overflow-y-auto custom-scrollbar"
                                    rows={1}
                                    disabled={isLoading}
                                />
                                <div className="absolute right-3 bottom-3">
                                    {isLoading ? (
                                    <button
                                        type="button"
                                        onClick={onStopGeneration}
                                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-500 shadow-md hover:shadow-lg hover:-translate-y-px active:translate-y-0 active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-slate-900"
                                        title="Stop Generation"
                                    >
                                        <StopIcon className="w-4 h-4" />
                                        Stop
                                    </button>
                                    ) : (
                                    <button
                                        type="submit"
                                        disabled={!userInput.trim() && !imageForPrompt}
                                        className="px-4 py-2 text-sm font-semibold text-white dark:text-slate-900 bg-blue-600 dark:bg-slate-200 rounded-lg hover:bg-blue-500 dark:hover:bg-white shadow-md hover:shadow-lg hover:-translate-y-px active:translate-y-0 active:scale-[0.98] disabled:bg-slate-400 dark:disabled:bg-slate-700 dark:disabled:text-slate-400 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900"
                                    >
                                        Send
                                    </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <input type="file" ref={imageInputRef} onChange={handleImageChange} className="hidden" accept="image/png, image/jpeg, image/gif, image/webp" />
        </form>
    </div>
  );
};