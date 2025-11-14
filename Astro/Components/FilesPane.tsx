import React, { useMemo, useEffect, useCallback } from 'react';
import type { AppFile } from '../types';
import { Editor } from './Editor';
import { buildFileTree } from '../utils/fileTree';
import { FileTree } from './FileTree';
import { getLanguageFromPath } from '../utils/language';
import { FilePlusIcon, SparklesIcon } from './Icons';
import { EditorTabs } from './EditorTabs';

interface FilesPaneProps {
  files: AppFile[];
  theme: 'light' | 'dark';
  onFileContentChange: (path: string, newContent: string) => void;
  activeFilePath: string | null;
  openFilePaths: string[];
  onOpenFile: (path: string) => void;
  onCloseFile: (path: string) => void;
  onSaveFile: (path: string) => void;
  onNewFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onRenameFile: (oldPath: string, newPath: string) => boolean;
  unsavedChanges: Record<string, string>;
  width: number;
}

// Constants for resizable file tree
const FILE_TREE_WIDTH_STORAGE_KEY = 'ai_app_builder_file_tree_width';
const MIN_FILE_TREE_WIDTH = 160; // 10rem
const MAX_FILE_TREE_WIDTH = 480; // 30rem

export const FilesPane: React.FC<FilesPaneProps> = (props) => {
  const { 
    files, theme, onFileContentChange, activeFilePath, openFilePaths, 
    onOpenFile, onCloseFile, onSaveFile, onNewFile, onDeleteFile, 
    onRenameFile, unsavedChanges, width 
  } = props;
  
  const fileTree = useMemo(() => buildFileTree(files), [files]);
  const activeFile = useMemo(() => files.find(f => f.path === activeFilePath), [files, activeFilePath]);
  
  const editorContent = useMemo(() => {
    if (activeFilePath && unsavedChanges.hasOwnProperty(activeFilePath)) {
      return unsavedChanges[activeFilePath];
    }
    return activeFile?.content ?? null;
  }, [activeFile, activeFilePath, unsavedChanges]);

  // State and ref for internal resizer
  const [fileTreeWidth, setFileTreeWidth] = React.useState(() => {
    try {
      const savedWidth = localStorage.getItem(FILE_TREE_WIDTH_STORAGE_KEY);
      if (savedWidth) {
        const parsedWidth = parseInt(savedWidth, 10);
        if (!isNaN(parsedWidth)) {
          return Math.max(MIN_FILE_TREE_WIDTH, Math.min(parsedWidth, MAX_FILE_TREE_WIDTH));
        }
      }
    } catch (e) { console.error("Failed to parse file tree width from localStorage", e); }
    return 224;
  });
  const [isResizing, setIsResizing] = React.useState(false);
  const filesPaneRef = React.useRef<HTMLElement>(null);

  // Save file tree width to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(FILE_TREE_WIDTH_STORAGE_KEY, String(fileTreeWidth));
    } catch (e) { console.error("Failed to save file tree width to localStorage", e); }
  }, [fileTreeWidth]);

  const handleFormatAndSaveCurrentFile = useCallback(() => {
    if (activeFilePath) {
      onSaveFile(activeFilePath);
    }
  }, [activeFilePath, onSaveFile]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleFormatAndSaveCurrentFile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFormatAndSaveCurrentFile]);
  
  const handleCreateFile = () => {
    const defaultPath = 'src/new-component.tsx';
    const newPath = window.prompt("Enter the new file path (e.g., src/components/Button.tsx):", defaultPath);
    if (newPath && newPath.trim()) {
      onNewFile(newPath.trim());
    }
  };

  const unsavedFilePaths = useMemo(() => {
    const dirtyPaths = new Set<string>();
    for (const path in unsavedChanges) {
        dirtyPaths.add(path);
    }
    return dirtyPaths;
  }, [unsavedChanges]);

  // Handlers for resizing the file tree panel
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !filesPaneRef.current) return;
    const containerRect = filesPaneRef.current.getBoundingClientRect();
    let newWidth = e.clientX - containerRect.left;
    newWidth = Math.max(MIN_FILE_TREE_WIDTH, Math.min(newWidth, MAX_FILE_TREE_WIDTH));
    setFileTreeWidth(newWidth);
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <aside ref={filesPaneRef} style={{ flexBasis: `${width}px` }} className="flex-shrink-0 border-l border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 dark:backdrop-blur-xl flex flex-col">
      <div className="flex-shrink-0 h-16 flex items-center justify-between px-6 border-b border-slate-200/80 dark:border-slate-800/80">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">File Explorer</h2>
        <button
          onClick={handleCreateFile}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:scale-110 active:scale-100 transition-transform"
          title="Create a new file"
        >
          <FilePlusIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 flex flex-row min-h-0">
          <nav 
            style={{ flexBasis: `${fileTreeWidth}px` }}
            className="flex-shrink-0 bg-slate-50/50 dark:bg-slate-900/50 overflow-y-auto"
          >
            <FileTree 
              nodes={fileTree}
              activeFilePath={activeFilePath}
              onSelectFile={onOpenFile}
              onDeleteFile={onDeleteFile}
              onRenameFile={onRenameFile}
              unsavedFilePaths={unsavedFilePaths}
            />
          </nav>
          <div 
            onMouseDown={handleMouseDown}
            className="w-1 flex-shrink-0 bg-slate-200/60 dark:bg-slate-800/60 cursor-col-resize hover:bg-blue-600/80 transition-colors duration-200"
          />
          <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-transparent">
            <EditorTabs
              openFilePaths={openFilePaths}
              activeFilePath={activeFilePath}
              onSelectFile={onOpenFile}
              onCloseFile={onCloseFile}
              unsavedFilePaths={unsavedFilePaths}
              files={files}
            />
            {activeFile && (
              <div className="absolute top-[105px] right-4 z-10">
                <button
                  onClick={handleFormatAndSaveCurrentFile}
                  disabled={!unsavedFilePaths.has(activeFile.path)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Format & Save (Ctrl+S)"
                >
                  <SparklesIcon className="w-3.5 h-3.5" />
                  Format
                </button>
              </div>
            )}
            <main className="flex-1 min-h-0 w-full overflow-auto">
                {activeFile && editorContent !== null ? (
                    <Editor 
                        key={activeFile.path} // Force re-mount on file change
                        code={editorContent}
                        onCodeChange={(newCode) => onFileContentChange(activeFile.path, newCode)}
                        language={getLanguageFromPath(activeFile.path)}
                        theme={theme}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                        <p>Select a file to view and edit</p>
                    </div>
                )}
            </main>
          </div>
      </div>
    </aside>
  );
};
