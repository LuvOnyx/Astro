import React, { useState, useRef, useEffect } from 'react';
import { ChatPane } from './ChatPane';
import { MessageSquare as ChatIcon } from 'lucide-react';
import { XIcon, ResizeHandleIcon } from './Icons';
import type { Message } from '../types';

interface ChatPanelProps {
    messages: Message[];
    userInput: string;
    onUserInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onSendMessage: (e: React.FormEvent) => void;
    onStopGeneration: () => void;
    isLoading: boolean;
    onClose: () => void;
    imageForPrompt: { data: string; mimeType: string } | null;
    onSetImageForPrompt: (image: { data: string; mimeType: string } | null) => void;
}

const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;
const LOCAL_STORAGE_KEY = 'ai_app_builder_chat_panel_state';

export const ChatPanel: React.FC<ChatPanelProps> = ({ onClose, onStopGeneration, imageForPrompt, onSetImageForPrompt, ...chatPaneProps }) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [size, setSize] = useState({ width: 550, height: 600 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    
    const dragStartPos = useRef({ x: 0, y: 0 });
    const resizeStartInfo = useRef({ x: 0, y: 0, width: 0, height: 0 });
    const isInitialMount = useRef(true);

    // Load state from localStorage on initial mount
    useEffect(() => {
        const savedStateJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedStateJSON) {
            try {
                const savedState = JSON.parse(savedStateJSON);
                if (savedState.position && savedState.size) {
                    setPosition(savedState.position);
                    setSize(savedState.size);
                    return; // Exit if we successfully loaded state
                }
            } catch (e) {
                console.error("Failed to parse chat panel state from localStorage", e);
                localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear corrupted data
            }
        }
        
        // Position the panel on initial render if no saved state
        if (panelRef.current) {
            const { innerWidth, innerHeight } = window;
            const initialWidth = Math.min(550, innerWidth - 40);
            const initialHeight = Math.min(600, innerHeight - 120);
            
            setSize({ width: initialWidth, height: initialHeight });
            setPosition({
                x: (innerWidth / 2) - (initialWidth / 2) - 300,
                y: 80,
            });
        }
    }, []);

    // Effect to save state to localStorage on change
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const stateToSave = { position, size };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    }, [position, size]);

    const handleDragMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('button, form, .no-drag, [data-resize-handle]')) return;
        setIsDragging(true);
        dragStartPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    };

    const handleDragTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('button, form, .no-drag, [data-resize-handle]') || e.touches.length !== 1) return;
        const touch = e.touches[0];
        setIsDragging(true);
        dragStartPos.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
    };
    
    const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        resizeStartInfo.current = { x: e.clientX, y: e.clientY, width: size.width, height: size.height };
    };

    const handleResizeTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.touches.length !== 1) return;
        const touch = e.touches[0];
        setIsResizing(true);
        resizeStartInfo.current = { x: touch.clientX, y: touch.clientY, width: size.width, height: size.height };
    };

    useEffect(() => {
        const handleMove = (e: MouseEvent | TouchEvent) => {
            // Prevent page scroll on touch devices
            if ('touches' in e) {
                e.preventDefault();
            }

            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

            if (isDragging) {
                setPosition({ x: clientX - dragStartPos.current.x, y: clientY - dragStartPos.current.y });
            } else if (isResizing) {
                const dx = clientX - resizeStartInfo.current.x;
                const dy = clientY - resizeStartInfo.current.y;
                setSize({
                    width: Math.max(MIN_WIDTH, resizeStartInfo.current.width + dx),
                    height: Math.max(MIN_HEIGHT, resizeStartInfo.current.height + dy),
                });
            }
        };

        const handleUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleUp);
            window.addEventListener('touchmove', handleMove, { passive: false });
            window.addEventListener('touchend', handleUp);
            document.body.style.userSelect = 'none';
            document.body.style.cursor = isResizing ? 'se-resize' : 'move';
        }
        
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        };
    }, [isDragging, isResizing]);


    return (
        <div
            ref={panelRef}
            className="absolute z-20 max-w-[90vw] flex flex-col bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg dark:backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.2),_0_8px_16px_-8px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5),_0_8px_16px_-8px_rgba(0,0,0,0.3)] overflow-hidden"
            style={{
                top: `${position.y}px`,
                left: `${position.x}px`,
                width: `${size.width}px`,
                height: `${size.height}px`,
            }}
        >
            <header 
                className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between cursor-move"
                onMouseDown={handleDragMouseDown}
                onTouchStart={handleDragTouchStart}
            >
                <div className="flex items-center gap-2">
                    <ChatIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">Chat</h3>
                </div>
                <button onClick={onClose} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700">
                    <XIcon className="w-4 h-4" />
                </button>
            </header>
            <div className="flex-1 p-4 md:p-6 overflow-y-auto no-drag min-h-0">
                <ChatPane {...chatPaneProps} onStopGeneration={onStopGeneration} imageForPrompt={imageForPrompt} onSetImageForPrompt={onSetImageForPrompt} />
            </div>
             <div
                data-resize-handle
                className="absolute bottom-0 right-0 w-5 h-5 flex items-center justify-center cursor-se-resize text-slate-400/70 dark:text-slate-600/70 hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
                onMouseDown={handleResizeMouseDown}
                onTouchStart={handleResizeTouchStart}
                title="Resize Panel"
            >
                <ResizeHandleIcon className="w-3 h-3" />
            </div>
        </div>
    );
};
