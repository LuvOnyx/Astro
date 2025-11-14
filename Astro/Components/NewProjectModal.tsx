import React, { useState } from 'react';
import { PlusIcon, XIcon } from './Icons';

type ProjectTarget = 'web' | 'fivem-nui';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, target: ProjectTarget) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [target, setTarget] = useState<ProjectTarget>('web');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), target);
    }
  };

  const RadioCard = ({ id, value, label, description }: { id: string, value: ProjectTarget, label: string, description: string }) => (
    <div className="relative">
        <input 
            type="radio" 
            id={id} 
            name="project-target" 
            value={value} 
            checked={target === value}
            onChange={() => setTarget(value)}
            className="sr-only peer"
        />
        <label 
            htmlFor={id} 
            className="flex flex-col p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer transition-all peer-checked:border-blue-500 dark:peer-checked:border-slate-300 peer-checked:ring-2 peer-checked:ring-blue-500/50 dark:peer-checked:ring-slate-300/20 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
            <span className="font-semibold text-slate-800 dark:text-slate-200">{label}</span>
            <span className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</span>
        </label>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 animate-in fade-in-20">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800/80 animate-in fade-in-5 zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <PlusIcon className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Create New Project</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            <div>
              <label htmlFor="project-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Project Name
              </label>
              <input
                type="text"
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome App"
                className="w-full p-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-slate-500 focus:outline-none"
                required
                autoFocus
              />
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Select a starting point
              </label>
              <RadioCard 
                id="target-web"
                value="web"
                label="Web Application"
                description="A standard web project using Vite, React, and TypeScript."
              />
              <RadioCard 
                id="target-fivem"
                value="fivem-nui"
                label="FiveM NUI Resource"
                description="A resource for the FiveM platform with a web-based UI."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 text-sm font-medium text-white dark:text-slate-900 bg-blue-600 dark:bg-slate-200 rounded-lg hover:bg-blue-500 dark:hover:bg-white disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};