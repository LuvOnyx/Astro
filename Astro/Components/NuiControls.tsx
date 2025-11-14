import React, { useState, useRef, useEffect } from 'react';
import { Editor } from './Editor';
import { XIcon } from './Icons';

export interface LogEntry { 
    id: number;
    type: 'in' | 'out' | 'system' | 'error';
    timestamp: string;
    message: string;
    data?: any;
}

interface NuiControlsProps {
    logs: LogEntry[];
    testPayload: string;
    isFocused: boolean;
    onTestPayloadChange: (payload: string) => void;
    onSendNuiMessage: () => void;
    onFocusToggle: (isFocused: boolean) => void;
    onClose: () => void;
}

const NUI_PANEL_STORAGE_KEY = 'ai_app_builder_nui_panel_position';

export const NuiControls: React.FC<NuiControlsProps> = ({
    logs,
    testPayload,
    isFocused,
    onTestPayloadChange,
    onSendNuiMessage,
    onFocusToggle,
    onClose,
}) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const isInitialMount = useRef(true);

    // Load state from localStorage on initial mount
    useEffect(() => {
        const savedStateJSON = localStorage.getItem(NUI_PANEL_STORAGE_KEY);
        if (savedStateJSON) {
            try {
                const savedPosition = JSON.parse(savedStateJSON);
                if (savedPosition.x !== undefined && savedPosition.y !== undefined) {
                    setPosition(savedPosition);
                    return; // Exit if we successfully loaded state
                }
            } catch (e) {
                console.error("Failed to parse NUI panel position from localStorage", e);
                localStorage.removeItem(NUI_PANEL_STORAGE_KEY); // Clear corrupted data
            }
        }
        
        // Position the panel on initial render if no saved state
        if (panelRef.current) {
            const { innerWidth, innerHeight } = window;
            const { offsetWidth, offsetHeight } = panelRef.current;
            setPosition({
                x: innerWidth - offsetWidth - 80,
                y: (innerHeight / 2) - (offsetHeight / 2),
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Effect to save state to localStorage on change
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        localStorage.setItem(NUI_PANEL_STORAGE_KEY, JSON.stringify(position));
    }, [position]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('button, .no-drag')) {
            return;
        }
        setIsDragging(true);
        dragStartPos.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStartPos.current.x,
                y: e.clientY - dragStartPos.current.y,
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = 'none';
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = '';
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDragging]);


    return (
        <div
            ref={panelRef}
            className="absolute z-10 w-96 flex flex-col bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg dark:backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.2),_0_8px_16px_-8px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5),_0_8px_16px_-8px_rgba(0,0,0,0.3)] overflow-hidden"
            style={{
                top: `${position.y}px`,
                left: `${position.x}px`,
                height: '70vh',
                maxHeight: '600px'
            }}
        >
            <header 
                className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between cursor-move"
                onMouseDown={handleMouseDown}
            >
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">NUI Simulator Controls</h3>
                <button onClick={onClose} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700">
                    <XIcon className="w-4 h-4" />
                </button>
            </header>
            <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 no-drag">
                <div className="flex items-center justify-between">
                    <label htmlFor="nui-focus" className="text-sm font-medium text-slate-700 dark:text-slate-300">NUI Focus</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="nui-focus" className="sr-only peer" checked={isFocused} onChange={(e) => onFocusToggle(e.target.checked)} />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600 dark:peer-checked:bg-slate-300"></div>
                    </label>
                </div>
            </div>
            <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col gap-3 no-drag">
                 <label htmlFor="nui-payload" className="text-sm font-medium text-slate-700 dark:text-slate-300">Send NUI Message (JSON)</label>
                 <div className="h-40 w-full rounded-md overflow-hidden border border-slate-200 dark:border-slate-700">
                    <Editor code={testPayload} onCodeChange={onTestPayloadChange} language="json" theme="dark" />
                 </div>
                 <button onClick={onSendNuiMessage} className="w-full px-3 py-2 text-sm font-medium text-white dark:text-slate-900 bg-blue-600 dark:bg-slate-200 rounded-lg hover:bg-blue-500 dark:hover:bg-white shadow-md hover:shadow-lg hover:-translate-y-px active:translate-y-0 active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900">Send Message</button>
            </div>
            <div className="flex-1 flex flex-col min-h-0 no-drag">
                <h3 className="p-4 font-semibold text-slate-800 dark:text-slate-200 text-sm">Event Log</h3>
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    <ul className="space-y-3">
                        {logs.length === 0 && <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">No events yet...</p>}
                        {logs.map(log => (
                           <li key={log.id} className="text-xs">
                                <div className="flex items-center gap-2">
                                    <span className={`font-mono text-slate-500 dark:text-slate-400`}>{log.timestamp}</span>
                                    {log.type === 'in' && <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">IN</span>}
                                    {log.type === 'out' && <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">OUT</span>}
                                    {log.type === 'system' && <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">SYS</span>}
                                    {log.type === 'error' && <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">ERR</span>}
                                    <p className="text-slate-700 dark:text-slate-300 flex-1 truncate">{log.message}</p>
                                </div>
                                {log.data && <pre className="mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400 whitespace-pre-wrap text-[11px] font-mono">{log.data}</pre>}
                           </li> 
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};