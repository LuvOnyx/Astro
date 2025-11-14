import React from 'react';
import type { Project } from '../types';
import { ProjectItem } from './ProjectItem';
import { PlusIcon, PanelLeftCloseIcon } from './Icons';

interface SidebarProps {
  projects: Project[];
  selectedProjectId: number;
  onSelectProject: (id: number) => void;
  onNewProject: () => void;
  onRenameProject: (id: number, newName: string) => void;
  onDeleteProject: (id: number) => void;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ projects, selectedProjectId, onSelectProject, onNewProject, onRenameProject, onDeleteProject, onToggle }) => {
  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 dark:backdrop-blur-xl p-4 flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200 px-2">Projects</h1>
        <button 
          onClick={onToggle}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:scale-110 active:scale-100 transition-transform"
          title="Toggle Project Panel"
        >
          <PanelLeftCloseIcon className="w-5 h-5" />
        </button>
      </div>
      <button 
        onClick={onNewProject}
        className="flex items-center justify-center gap-2 w-full my-4 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700/80 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-md hover:-translate-y-px focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-900 transition-all duration-200 active:scale-[0.98] active:translate-y-0"
      >
        <PlusIcon className="w-4 h-4" />
        New Project
      </button>
      <nav className="flex flex-col gap-1 overflow-y-auto -mr-2 pr-1">
        {projects.map((project) => (
          <ProjectItem
            key={project.id}
            project={project}
            isSelected={project.id === selectedProjectId}
            onClick={() => onSelectProject(project.id)}
            onRename={onRenameProject}
            onDelete={onDeleteProject}
          />
        ))}
      </nav>
    </aside>
  );
};
