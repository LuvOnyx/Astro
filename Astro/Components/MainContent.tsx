import React from 'react';
import type { Message, AppFile, PreviewDevice } from '../types';
import { Header } from './Header';
import { PreviewPane } from './PreviewPane';
import { ChatPanel } from './ChatPanel';

interface MainContentProps {
  messages: Message[];
  userInput: string;
  onUserInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onStopGeneration: () => void;
  isLoading: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  files: AppFile[] | null;
  isFileExplorerOpen: boolean;
  toggleFileExplorer: () => void;
  isProjectSidebarOpen: boolean;
  toggleProjectSidebar: () => void;
  isNuiPanelOpen: boolean;
  toggleNuiPanel: () => void;
  isChatPanelOpen: boolean;
  toggleChatPanel: () => void;
  target: 'web' | 'fivem-nui';
  onDownloadZip: () => void;
  previewDevice: PreviewDevice;
  setPreviewDevice: (device: PreviewDevice) => void;
  htmlContent: string | null;
  bundleStatus: 'idle' | 'pending' | 'success' | 'error';
  bundleError: string | null;
  onRuntimeError: (message: string) => void;
  imageForPrompt: { data: string; mimeType: string } | null;
  onSetImageForPrompt: (image: { data: string; mimeType: string } | null) => void;
  onRefreshPreview: () => void;
  previewRefreshKey: number;
}

export const MainContent: React.FC<MainContentProps> = ({ 
  theme, 
  toggleTheme, 
  files, 
  isFileExplorerOpen, 
  toggleFileExplorer, 
  isProjectSidebarOpen,
  toggleProjectSidebar,
  isNuiPanelOpen, 
  toggleNuiPanel, 
  isChatPanelOpen,
  toggleChatPanel,
  target, 
  onDownloadZip,
  previewDevice,
  setPreviewDevice,
  htmlContent,
  bundleStatus,
  bundleError,
  onRuntimeError,
  onStopGeneration,
  imageForPrompt,
  onSetImageForPrompt,
  onRefreshPreview,
  previewRefreshKey,
  ...chatPaneProps 
}) => {
  return (
    <main className="flex-1 flex flex-col bg-slate-100 dark:bg-transparent min-w-0 relative">
      <Header 
        theme={theme} 
        toggleTheme={toggleTheme} 
        files={files}
        isFileExplorerOpen={isFileExplorerOpen}
        toggleFileExplorer={toggleFileExplorer}
        isProjectSidebarOpen={isProjectSidebarOpen}
        toggleProjectSidebar={toggleProjectSidebar}
        isChatPanelOpen={isChatPanelOpen}
        toggleChatPanel={toggleChatPanel}
        target={target}
        onDownloadZip={onDownloadZip}
        previewDevice={previewDevice}
        setPreviewDevice={setPreviewDevice}
        onRefreshPreview={onRefreshPreview}
      />
      <div className={`flex-1 flex flex-col gap-6 overflow-y-auto ${target === 'web' ? 'p-4 md:p-6 items-center justify-start' : 'p-4 md:p-6'}`}>
        <PreviewPane 
          files={files} 
          target={target} 
          isNuiPanelOpen={isNuiPanelOpen} 
          onToggleNuiPanel={toggleNuiPanel} 
          previewDevice={previewDevice} 
          htmlContent={htmlContent}
          bundleStatus={bundleStatus}
          bundleError={bundleError}
          onRuntimeError={onRuntimeError}
          previewRefreshKey={previewRefreshKey}
        />
      </div>
      {isChatPanelOpen && (
        <ChatPanel 
          {...chatPaneProps}
          onClose={toggleChatPanel}
          onStopGeneration={onStopGeneration}
          imageForPrompt={imageForPrompt}
          onSetImageForPrompt={onSetImageForPrompt}
        />
      )}
    </main>
  );
};