import React from 'react';
import { getIconForNode } from '../utils/iconHelper';
import { XIcon } from './Icons';
import type { AppFile } from '../types';

interface EditorTabsProps {
    openFilePaths: string[];
    activeFilePath: string | null;
    onSelectFile: (path: string) => void;
    onCloseFile: (path: string) => void;
    unsavedFilePaths: Set<string>;
    files: AppFile[];
}

export const EditorTabs: React.FC<EditorTabsProps> = ({ openFilePaths, activeFilePath, onSelectFile, onCloseFile, unsavedFilePaths, files }) => {
    return (
        <div className="flex-shrink-0 h-10 bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
            <div className="flex items-end h-full overflow-x-auto tab-scrollbar">
                {openFilePaths.map(path => {
                    const file = files.find(f => f.path === path);
                    if (!file) return null;

                    const isActive = path === activeFilePath;
                    const isUnsaved = unsavedFilePaths.has(path);
                    const Icon = getIconForNode({ name: path.split('/').pop() || '', path });
                    
                    return (
                        <div
                            key={path}
                            onClick={() => onSelectFile(path)}
                            className={`group flex items-center gap-2 pl-3 pr-2 h-[39px] border-r border-slate-200/80 dark:border-slate-800/80 cursor-pointer relative -mb-px border-b-2 transition-colors flex-shrink-0 ${
                                isActive 
                                ? 'bg-white dark:bg-slate-900 border-b-blue-600 dark:border-b-slate-300' 
                                : 'border-b-transparent hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                            }`}
                            title={path}
                        >
                            <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            <span className={`text-sm ${isActive ? 'text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>
                                {path.split('/').pop()}
                            </span>
                            <div className="w-4 h-4 flex items-center justify-center ml-2">
                                {isUnsaved ? (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onCloseFile(path); }}
                                        className="w-4 h-4 rounded-full bg-slate-400 dark:bg-slate-600 text-white flex items-center justify-center opacity-100 group-hover:hidden"
                                    >
                                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                    </button>
                                ) : <div className="w-4 h-4"></div>}
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onCloseFile(path); }}
                                    className={`w-4 h-4 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 ${isUnsaved ? 'hidden group-hover:flex' : 'opacity-0 group-hover:opacity-100'}`}
                                >
                                    <XIcon className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};