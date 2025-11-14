import React from 'react';
import { Sun, Moon, Download, FileCode, Gamepad, MessageSquare, Monitor, Smartphone, PanelLeftOpen, RefreshCw } from 'lucide-react';
import type { AppFile, PreviewDevice } from '../types';

type Theme = 'light' | 'dark';

interface HeaderProps {
    theme: Theme;
    toggleTheme: () => void;
    files: AppFile[] | null;
    isFileExplorerOpen: boolean;
    toggleFileExplorer: () => void;
    isChatPanelOpen: boolean;
    toggleChatPanel: () => void;
    target: 'web' | 'fivem-nui';
    onDownloadZip: () => void;
    previewDevice: PreviewDevice;
    setPreviewDevice: (device: PreviewDevice) => void;
    isProjectSidebarOpen: boolean;
    toggleProjectSidebar: () => void;
    onRefreshPreview: () => void;
}

const DeviceToggleButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode; ariaLabel: string; }> = ({ isActive, onClick, children, ariaLabel }) => (
    <button
      onClick={onClick}
      className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${
        isActive
          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-slate-100 shadow-inner'
          : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/60'
      }`}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );


export const Header: React.FC<HeaderProps> = ({ 
    theme, 
    toggleTheme, 
    files, 
    isFileExplorerOpen, 
    toggleFileExplorer,
    isChatPanelOpen,
    toggleChatPanel,
    target,
    onDownloadZip,
    previewDevice,
    setPreviewDevice,
    isProjectSidebarOpen,
    toggleProjectSidebar,
    onRefreshPreview,
}) => {
  const hasFiles = files && files.length > 0;

  return (
    <header className="flex-shrink-0 h-16 flex items-center justify-between px-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm z-20">
      <div className="flex items-center gap-4">
        {!isProjectSidebarOpen && (
            <button
                onClick={toggleProjectSidebar}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:scale-110 active:scale-100 transition-transform"
                title="Show Project Panel"
            >
                <PanelLeftOpen className="w-5 h-5" />
            </button>
        )}
      </div>
      <div className="flex items-center gap-4">
        {target === 'web' && hasFiles && (
            <div className="p-1 bg-slate-200/70 dark:bg-slate-800/70 rounded-full flex items-center gap-1">
                <DeviceToggleButton
                    onClick={() => setPreviewDevice('desktop')}
                    isActive={previewDevice === 'desktop'}
                    ariaLabel="Desktop preview"
                >
                    <Monitor size={20} />
                </DeviceToggleButton>
                <DeviceToggleButton
                    onClick={() => setPreviewDevice('iphone15')}
                    isActive={previewDevice === 'iphone15'}
                    ariaLabel="iPhone 15 preview"
                >
                    <Smartphone size={20} />
                </DeviceToggleButton>
            </div>
        )}
        <button
          onClick={onRefreshPreview}
          disabled={!hasFiles}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105 active:scale-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          aria-label="Refresh Preview"
          title="Refresh Preview"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
        <button
          onClick={onDownloadZip}
          disabled={!hasFiles}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700/80 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-md hover:-translate-y-px active:scale-[0.98] active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          aria-label="Download project as ZIP"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Download ZIP</span>
        </button>
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105 active:scale-100 transition-all"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
        <button
          onClick={toggleChatPanel}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
            isChatPanelOpen
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 ring-2 ring-inset ring-slate-300 dark:ring-slate-600'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
          aria-label="Toggle Chat Panel"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
        <button
          onClick={toggleFileExplorer}
          disabled={!hasFiles}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
            isFileExplorerOpen 
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 ring-2 ring-inset ring-slate-300 dark:ring-slate-600'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
          aria-label="Toggle File Explorer"
        >
          <FileCode className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};