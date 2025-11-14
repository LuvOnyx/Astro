import React, { useState } from 'react';
import { FigmaIcon, XIcon } from './Icons';

interface FigmaImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (description: string) => void;
}

export const FigmaImportModal: React.FC<FigmaImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim()) {
      onImport(description.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 animate-in fade-in-20">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800/80 animate-in fade-in-5 zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <FigmaIcon className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Import from Figma</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              This tool uses AI to generate code from a description of your Figma design.
              Please describe the layout, components, and styling of your design in the text box below.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 p-2 rounded-md">
              <strong>Example:</strong> "A modern dashboard with a sidebar for navigation. The main content area has 3 stat cards at the top and a data table below. The primary color is a deep blue."
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your Figma design here..."
              className="w-full h-32 p-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-slate-500 focus:outline-none"
              required
            />
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
              disabled={!description.trim()}
              className="px-4 py-2 text-sm font-medium text-white dark:text-slate-900 bg-blue-600 dark:bg-slate-200 rounded-lg hover:bg-blue-500 dark:hover:bg-white disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            >
              Generate App
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};