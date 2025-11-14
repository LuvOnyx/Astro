import React, { useState, useRef, useEffect } from 'react';
import type { Project } from '../types';
import { EditIcon, TrashIcon, CheckIcon, XIcon } from './Icons';

interface ProjectItemProps {
  project: Project;
  isSelected: boolean;
  onClick: () => void;
  onRename: (id: number, newName: string) => void;
  onDelete: (id: number) => void;
}

export const ProjectItem: React.FC<ProjectItemProps> = ({ project, isSelected, onClick, onRename, onDelete }) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(project.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);
  
  useEffect(() => {
    setName(project.name);
  }, [project.name]);

  const handleRename = () => {
    if (name.trim() && name.trim() !== project.name) {
      onRename(project.id, name.trim());
    }
    setIsRenaming(false);
  };

  const handleCancelRename = () => {
    setName(project.name);
    setIsRenaming(false);
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(project.id);
  }
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        handleRename();
    } else if (e.key === 'Escape') {
        handleCancelRename();
    }
  }

  return (
    <div
      onClick={!isRenaming ? onClick : undefined}
      className={`group relative w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
        isSelected && !isRenaming
          ? 'bg-blue-600 dark:bg-slate-800 text-white dark:text-slate-100 shadow-lg shadow-blue-600/20 dark:shadow-black/20'
          : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:-translate-y-px'
      } ${isRenaming ? 'bg-slate-200 dark:bg-slate-700' : ''}`}
    >
      {isRenaming ? (
        <div className="flex items-center gap-2">
            <input 
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleRename}
                className="flex-grow bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200 outline-none border-none p-0"
            />
            <button onClick={handleRename} className="p-1 rounded hover:bg-green-200 dark:hover:bg-green-800 text-green-600 dark:text-green-400"><CheckIcon className="w-4 h-4" /></button>
            <button onClick={handleCancelRename} className="p-1 rounded hover:bg-red-200 dark:hover:bg-red-800 text-red-600 dark:text-red-400"><XIcon className="w-4 h-4" /></button>
        </div>
      ) : (
        <>
          <h3 className={`text-sm font-medium truncate ${isSelected ? 'text-white dark:text-slate-100' : 'text-slate-800 dark:text-slate-200'}`}>{project.name}</h3>
          <p className={`text-xs ${isSelected ? 'text-blue-200 dark:text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>{project.updated}</p>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
            <button onClick={(e) => { e.stopPropagation(); setIsRenaming(true); }} className={`p-1 rounded ${isSelected ? 'text-blue-200 dark:text-slate-300 hover:bg-blue-500 dark:hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-300/80 dark:hover:bg-slate-700/80'}`} aria-label="Rename project"><EditIcon className="w-3.5 h-3.5" /></button>
            <button onClick={handleDelete} className={`p-1 rounded ${isSelected ? 'text-blue-200 dark:text-slate-300 hover:bg-blue-500 dark:hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-300/80 dark:hover:bg-slate-700/80'}`} aria-label="Delete project"><TrashIcon className="w-3.5 h-3.5" /></button>
          </div>
        </>
      )}
    </div>
  );
};