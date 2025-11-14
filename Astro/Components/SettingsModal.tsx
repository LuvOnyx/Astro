

import React, { useState, useEffect } from 'react';
import { SettingsIcon, XIcon } from './Icons';
import type { ProjectSettings } from '../types';

export interface SupabaseConfig {
    url: string;
    anonKey: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supabaseConfig: SupabaseConfig, projectSettings: ProjectSettings) => void;
  currentSupabaseConfig: SupabaseConfig;
  currentProjectSettings: ProjectSettings;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentSupabaseConfig, currentProjectSettings }) => {
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(currentSupabaseConfig);
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>(currentProjectSettings);

  useEffect(() => {
    setSupabaseConfig(currentSupabaseConfig);
    setProjectSettings(currentProjectSettings);
  }, [currentSupabaseConfig, currentProjectSettings]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (supabaseConfig.url.trim() && supabaseConfig.anonKey.trim()) {
      onSave(supabaseConfig, projectSettings);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 animate-in fade-in-20">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800/80 animate-in fade-in-5 zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Settings</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
            
            {/* File Access Control */}
            <div>
                <h3 className="text-md font-semibold text-slate-800 dark:text-slate-200 mb-2">File Access Control</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Define boundaries for the AI. These settings are specific to this project and enhance security when using the local file system bridge.
                </p>
                <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50">
                    <div>
                        <label htmlFor="project-root" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Project Directory Scope
                        </label>
                        <input
                            type="text"
                            id="project-root"
                            name="projectRoot"
                            value={projectSettings.projectRoot}
                            onChange={(e) => setProjectSettings(p => ({...p, projectRoot: e.target.value}))}
                            placeholder="e.g., /Users/me/dev/my-project"
                            className="w-full p-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-slate-500 focus:outline-none font-mono"
                        />
                         <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                            Optional. If set, the local server will be restricted to only read/write files within this folder.
                        </p>
                    </div>
                     <div>
                        <label htmlFor="blacklist-paths" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            File Path Blacklist
                        </label>
                        <textarea
                            id="blacklist-paths"
                            name="blacklist"
                            value={projectSettings.blacklist}
                            onChange={(e) => setProjectSettings(p => ({...p, blacklist: e.target.value}))}
                            placeholder="node_modules&#10;dist&#10;.env"
                            className="w-full h-28 p-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-slate-500 focus:outline-none font-mono"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                            Paths to ignore (one per line). Files or folders starting with these paths will be hidden from the AI.
                        </p>
                    </div>
                </div>
            </div>

            {/* Terminal Access */}
            <div>
                <h3 className="text-md font-semibold text-slate-800 dark:text-slate-200 mb-2">Terminal & Command Execution</h3>
                <div className="space-y-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-300 dark:border-yellow-700/50">
                    <div className="flex items-start justify-between">
                        <div>
                            <label htmlFor="enable-terminal" className="block text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                Enable Terminal Access
                            </label>
                            <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1.5 max-w-md">
                                <span className="font-bold">WARNING:</span> Enabling this gives the AI the ability to execute ANY command on your computer via the local server bridge, including reading/writing/deleting files outside the project scope. Only enable this if you understand and accept the security risks.
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                            <input 
                                type="checkbox" 
                                id="enable-terminal" 
                                className="sr-only peer" 
                                checked={projectSettings.enableTerminal} 
                                onChange={(e) => setProjectSettings(p => ({...p, enableTerminal: e.target.checked}))}
                            />
                            <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-red-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Supabase Config */}
            <div>
                <h3 className="text-md font-semibold text-slate-800 dark:text-slate-200 mb-2">Supabase Configuration</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Enter your Supabase credentials to connect the live preview to your backend. These are stored only in your browser.
                </p>
                <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50">
                    <div>
                        <label htmlFor="supabase-url" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Project URL
                        </label>
                        <input
                            type="text"
                            id="supabase-url"
                            name="url"
                            value={supabaseConfig.url}
                            onChange={(e) => setSupabaseConfig(c => ({...c, url: e.target.value}))}
                            placeholder="https://your-project-ref.supabase.co"
                            className="w-full p-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-slate-500 focus:outline-none"
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="supabase-anon-key" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Anon (Public) Key
                        </label>
                        <input
                            type="text"
                            id="supabase-anon-key"
                            name="anonKey"
                            value={supabaseConfig.anonKey}
                            onChange={(e) => setSupabaseConfig(c => ({...c, anonKey: e.target.value}))}
                            placeholder="ey..."
                            className="w-full p-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-slate-500 focus:outline-none"
                            required
                        />
                    </div>
                </div>
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
              disabled={!supabaseConfig.url.trim() || !supabaseConfig.anonKey.trim()}
              className="px-4 py-2 text-sm font-medium text-white dark:text-slate-900 bg-blue-600 dark:bg-slate-200 rounded-lg hover:bg-blue-500 dark:hover:bg-white disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};