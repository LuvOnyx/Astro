





import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Project, Message, AppFile, ProjectSpec, PreviewDevice, Part, ProjectSettings } from './types';
import { Sidebar } from './Components/Sidebar';
import { MainContent } from './Components/MainContent';
import * as projectService from './services/projectService';
import { FilesPane } from './Components/FilesPane';
import { initializeBundler, bundle } from './utils/bundler';
import { TopMenuBar } from './Components/TopMenuBar';
import { ContextMenuProvider } from './hooks/useContextMenu';
import { ContextMenu } from './Components/ContextMenu';
import { FigmaImportModal } from './Components/FigmaImportModal';
import { SettingsModal, type SupabaseConfig } from './Components/SettingsModal';
import { NewProjectModal } from './Components/NewProjectModal';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { generatePreviewHtml } from './Components/WebPreview';
import { useProjectManager } from './hooks/useProjectManager';
import { useChatManager } from './hooks/useChatManager';
import { useFilePaneResizer } from './hooks/useFilePaneResizer';
import { formatCode } from './utils/formatter';

type Theme = 'light' | 'dark';

const SUPABASE_URL_KEY = 'supabase_url';
const SUPABASE_ANON_KEY = 'supabase_anon_key';


// FIX: (L33) Changed component declaration to a standard function component, which is modern React best practice and avoids potential typing issues with `React.FC`.
const App = () => {
  const {
    projects,
    setProjects,
    selectedProjectId,
    setSelectedProjectId,
    messages,
    setMessages,
    files,
    setFiles,
    projectTarget,
    setProjectTarget,
    projectSettings,
    setProjectSettings,
    handleSelectProject,
    createNewProjectEntry,
    handleRenameProject: handleRenameProjectEntry,
    handleDeleteProject,
  } = useProjectManager();
  
  const [theme, setTheme] = useState<Theme>('dark');
  const [isProjectSidebarOpen, setIsProjectSidebarOpen] = useState(true);
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(!!files);
  const [isNuiPanelOpen, setIsNuiPanelOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(messages.length === 0);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);

  // State for multi-tab editor
  const [openFilePaths, setOpenFilePaths] = useState<string[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState<Record<string, string>>({});
  
  // State for bundling and the autofix feature
  const [bundleResult, setBundleResult] = useState<{ code: string | null; error: string | null; status: 'idle' | 'pending' | 'success' | 'error' }>({ code: null, error: null, status: 'idle' });
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState('/');
  const [htmlContent, setHtmlContent] = useState<string | null>(null);

  const currentError = bundleResult.error || runtimeError;

  const appContainerRef = useRef<HTMLDivElement>(null);
  const { paneWidth, handleResizeMouseDown } = useFilePaneResizer(appContainerRef);
  
  const [isFigmaModalOpen, setIsFigmaModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  
  // Initialize Supabase config from localStorage once
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => ({
      url: localStorage.getItem(SUPABASE_URL_KEY) || 'https://zdakoozxfudkaisxsji.supabase.co',
      anonKey: localStorage.getItem(SUPABASE_ANON_KEY) || 'sb_publishable_04Ed0t4JKqC0Xdl7bAxWYg_t4E08uPo',
  }));

  const {
    userInput,
    setUserInput,
    isLoading,
    handleSendMessage,
    handleStopGeneration,
    imageForPrompt,
    setImageForPrompt,
  } = useChatManager({
    messages,
    setMessages,
    files,
    setFiles,
    projectSettings,
    setProjectTarget,
    currentError,
    onGenerationComplete: (finalFiles) => {
      if (finalFiles.length > 0) {
        setIsFileExplorerOpen(true);
        const defaultFile = finalFiles.find(f => f.path.endsWith('App.tsx'))?.path || finalFiles[0]?.path || null;
        if (defaultFile) {
            setOpenFilePaths([defaultFile]);
            setActiveFilePath(defaultFile);
        }
      }
    }
  });
  
  const importProjectInputRef = useRef<HTMLInputElement>(null);
  const importFilesInputRef = useRef<HTMLInputElement>(null);
  const importFolderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initializeBundler();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // On first load, if Supabase keys aren't in localStorage,
  // save the pre-filled default ones so they can be injected into the preview bundle.
  useEffect(() => {
    const urlInStorage = localStorage.getItem(SUPABASE_URL_KEY);
    const keyInStorage = localStorage.getItem(SUPABASE_ANON_KEY);
    if (!urlInStorage && !keyInStorage && supabaseConfig.url && supabaseConfig.anonKey) {
        try {
            localStorage.setItem(SUPABASE_URL_KEY, supabaseConfig.url);
            localStorage.setItem(SUPABASE_ANON_KEY, supabaseConfig.anonKey);
        } catch(e) {
            console.error("Failed to pre-fill Supabase config to localStorage", e);
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // This effect handles UI state updates when the project changes.
  // The actual data loading is handled within useProjectManager.
  useEffect(() => {
    if (selectedProjectId !== null) {
      const data = projectService.getProjectData(selectedProjectId);
      setPreviewDevice('desktop');
      setIsFileExplorerOpen(!!data.files);
      setIsChatPanelOpen(data.messages.length === 0);
      
      // Reset editor state for new project
      setActiveFilePath(null);
      setOpenFilePaths([]);
      setUnsavedChanges({});
      
      // Open a default file if available
      const defaultFile = data.files?.find(f => f.path === 'src/App.tsx')?.path || data.files?.[0]?.path;
      if (defaultFile) {
        setOpenFilePaths([defaultFile]);
        setActiveFilePath(defaultFile);
      }
    }
  }, [selectedProjectId]);

  // Listen for runtime errors from the preview iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'runtime-error') {
            setRuntimeError(event.data.payload);
        }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Effect to bundle the code whenever files change
  useEffect(() => {
    if (!files || projectTarget !== 'web') {
        setBundleResult({ code: null, error: null, status: 'idle' });
        setHtmlContent(null);
        return;
    }
    
    let isCancelled = false;

    const performBundle = async () => {
        setBundleResult(prev => ({ ...prev, status: 'pending', error: null }));
        setRuntimeError(null);

        const result = await bundle(files, activeRoute);
        if (isCancelled) return;

        if (result.error) {
            setBundleResult({ code: null, error: result.error, status: 'error' });
            setHtmlContent(null);
        } else if (result.code) {
            setBundleResult({ code: result.code, error: null, status: 'success' });
            
            const htmlFile = files.find(f => f.path.endsWith('index.html'));
            const tailwindFile = files.find(f => f.path === 'tailwind.config.js');

            if (htmlFile) {
                const fullHtml = generatePreviewHtml(htmlFile.content, result.code, tailwindFile?.content);
                setHtmlContent(fullHtml);
            } else {
                 setBundleResult({ code: null, error: 'Build succeeded, but no index.html found.', status: 'error' });
                 setHtmlContent(null);
            }
        }
    };

    performBundle();

    return () => { isCancelled = true; };
  }, [files, activeRoute, projectTarget]);
  
  const handleCreateAndGenerateProject = useCallback((name: string, target: 'web' | 'fivem-nui') => {
    setIsNewProjectModalOpen(false);

    const newId = createNewProjectEntry(name);
    projectService.saveProjectData(newId, { messages: [], files: null, target });
    
    handleSelectProject(newId);

    const prompt = target === 'web'
      ? "Create a new default web application using Vite, React, TypeScript, and Tailwind CSS."
      : "Create a new default FiveM NUI resource using Vite, React, and TypeScript.";
    
    setTimeout(() => {
        handleSendMessage(prompt);
    }, 100);
  }, [createNewProjectEntry, handleSelectProject, handleSendMessage]);

  const handleRefreshPreview = useCallback(() => {
    setPreviewRefreshKey(k => k + 1);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);
  
  const toggleProjectSidebar = useCallback(() => {
    setIsProjectSidebarOpen(prev => !prev);
  }, []);

  const toggleFileExplorer = useCallback(() => {
    if (files) {
        setIsFileExplorerOpen(prev => !prev);
    }
  }, [files]);

  const toggleNuiPanel = useCallback(() => {
    setIsNuiPanelOpen(prev => !prev);
  }, []);
  
  const toggleChatPanel = useCallback(() => {
    setIsChatPanelOpen(prev => !prev);
  }, []);

  const handleSaveFile = useCallback(async (path: string) => {
    if (unsavedChanges.hasOwnProperty(path)) {
      const contentToSave = unsavedChanges[path];
      const formattedContent = await formatCode(path, contentToSave);
      
      setFiles(prevFiles => {
        if (!prevFiles) return null;
        return prevFiles.map(file => 
          file.path === path ? { ...file, content: formattedContent } : file
        );
      });

      setUnsavedChanges(prev => {
        const next = { ...prev };
        delete next[path];
        return next;
      });
    }
  }, [unsavedChanges, setFiles]);

  const handleOpenFile = useCallback(async (path: string) => {
    if (activeFilePath && activeFilePath !== path && unsavedChanges.hasOwnProperty(activeFilePath)) {
      await handleSaveFile(activeFilePath);
    }
    
    if (!openFilePaths.includes(path)) {
      setOpenFilePaths(prev => [...prev, path]);
    }
    setActiveFilePath(path);
  }, [activeFilePath, openFilePaths, unsavedChanges, handleSaveFile]);

  const handleCloseFile = useCallback(async (path: string) => {
    await handleSaveFile(path);

    const pathIndex = openFilePaths.indexOf(path);
    const newOpenFilePaths = openFilePaths.filter(p => p !== path);
    setOpenFilePaths(newOpenFilePaths);

    if (activeFilePath === path) {
      if (newOpenFilePaths.length > 0) {
        const newActiveIndex = Math.max(0, pathIndex - 1);
        setActiveFilePath(newOpenFilePaths[newActiveIndex]);
      } else {
        setActiveFilePath(null);
      }
    }
  }, [activeFilePath, openFilePaths, handleSaveFile]);

  const handleFileContentChange = useCallback((path: string, newContent: string) => {
     const originalFile = files?.find(f => f.path === path);
      if (originalFile && newContent !== originalFile.content) {
        setUnsavedChanges(prev => ({ ...prev, [path]: newContent }));
      } else {
        // Reverted to original content, so remove from unsaved state
        setUnsavedChanges(prev => {
          const next = { ...prev };
          delete next[path];
          return next;
        });
      }
  }, [files]);

  const handleNewFile = useCallback((path: string) => {
    if (!path || !path.trim()) return;
    if (files && files.some(f => f.path === path)) {
        alert(`Error: A file with the path "${path}" already exists.`);
        return;
    }
    const newFile: AppFile = { path, content: '' };
    setFiles(prevFiles => [...(prevFiles || []), newFile]);
    handleOpenFile(path);
  }, [files, setFiles, handleOpenFile]);

  const handleRenameFile = useCallback((oldPath: string, newPath: string) => {
    if (oldPath === newPath) return true;
    if (files && files.some(f => f.path === newPath)) {
        alert(`Error: A file or folder with the path "${newPath}" already exists.`);
        return false;
    }
    
    const isFolder = files?.some(f => f.path !== oldPath && f.path.startsWith(oldPath + '/'));

    setFiles(prevFiles => {
        if (!prevFiles) return null;
        return prevFiles.map(file => {
            if (file.path === oldPath) return { ...file, path: newPath };
            if (isFolder && file.path.startsWith(oldPath + '/')) return { ...file, path: file.path.replace(oldPath, newPath) };
            return file;
        });
    });

    setOpenFilePaths(prev => prev.map(p => {
        if (p === oldPath) return newPath;
        if (isFolder && p.startsWith(oldPath + '/')) return p.replace(oldPath, newPath);
        return p;
    }));

    if (activeFilePath === oldPath) setActiveFilePath(newPath);
    else if (isFolder && activeFilePath?.startsWith(oldPath + '/')) setActiveFilePath(activeFilePath.replace(oldPath, newPath));

    setUnsavedChanges(prev => {
        const next: Record<string, string> = {};
        for (const [key, value] of Object.entries(prev)) {
            if (key === oldPath) {
                next[newPath] = value;
            } else if (isFolder && key.startsWith(oldPath + '/')) {
                next[key.replace(oldPath, newPath)] = value;
            } else {
                next[key] = value;
            }
        }
        return next;
    });

    return true;
  }, [files, activeFilePath, setFiles]);

  const handleDeleteFile = useCallback((pathToDelete: string) => {
    if (!files) return;
    const isFolder = files.some(f => f.path !== pathToDelete && f.path.startsWith(pathToDelete + '/'));
    const nodeName = pathToDelete.split('/').pop();
    const confirmationMessage = isFolder
      ? `Are you sure you want to delete the folder "${nodeName}" and all of its contents?`
      : `Are you sure you want to delete the file "${nodeName}"?`;
    if (!window.confirm(confirmationMessage)) return;

    const pathsToDelete = new Set(files.filter(f => f.path.startsWith(pathToDelete)).map(f => f.path));
    if (!isFolder) pathsToDelete.add(pathToDelete);

    // Close any open tabs that are being deleted
    pathsToDelete.forEach(p => handleCloseFile(p));

    setFiles(prevFiles => {
      if (!prevFiles) return null;
      const remainingFiles = prevFiles.filter(file => !pathsToDelete.has(file.path));
      return remainingFiles.length > 0 ? remainingFiles : null;
    });
    
    setUnsavedChanges(prev => {
        const next = {...prev};
        pathsToDelete.forEach(p => delete next[p]);
        return next;
    });

  }, [files, handleCloseFile, setFiles]);
  
  const handleFigmaImport = useCallback((description: string) => {
    setIsFigmaModalOpen(false);
    const prompt = `Create a new web application based on this Figma design description:\n\n${description}\n\nUse React with TypeScript and Tailwind CSS.`;
    handleSendMessage(prompt);
  }, [handleSendMessage]);

  const handleSaveSettings = useCallback((newSupabaseConfig: SupabaseConfig, newProjectSettings: ProjectSettings) => {
    try {
        localStorage.setItem(SUPABASE_URL_KEY, newSupabaseConfig.url);
        localStorage.setItem(SUPABASE_ANON_KEY, newSupabaseConfig.anonKey);
        setSupabaseConfig(newSupabaseConfig);
        setProjectSettings(newProjectSettings);
        setIsSettingsModalOpen(false);
        setFiles(files => files ? [...files] : null); // Trigger a re-bundle to inject new settings
    } catch(e) {
        console.error("Failed to save settings", e);
    }
  }, [setFiles, setProjectSettings]);

  const handleDownloadZip = useCallback(async () => {
    if (!files || files.length === 0) return;
    if (activeFilePath) await handleSaveFile(activeFilePath);

    const zip = new JSZip();
    files.forEach(file => {
        const content = unsavedChanges[file.path] ?? file.content;
        zip.file(file.path, content);
    });

    try {
        const content = await zip.generateAsync({ type: 'blob' });
        const projectName = projects.find(p => p.id === selectedProjectId)?.name || 'project';
        const sanitizedName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        saveAs(content, `${sanitizedName}.zip`);
    } catch (e) {
        console.error("Error creating zip file", e);
    }
  }, [files, projects, selectedProjectId, activeFilePath, handleSaveFile, unsavedChanges]);

  const handleImportProject = () => importProjectInputRef.current?.click();
  const handleImportFiles = () => importFilesInputRef.current?.click();
  const handleImportFolder = () => importFolderInputRef.current?.click();

  const handleProjectFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const zip = await JSZip.loadAsync(file);
      const newFiles: AppFile[] = [];
      const promises: Promise<void>[] = [];

      zip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) {
          const promise = zipEntry.async('string').then(content => {
            newFiles.push({ path: relativePath, content });
          });
          promises.push(promise);
        }
      });
      
      await Promise.all(promises);

      const projectName = file.name.replace(/\.zip$/, '');
      const newId = createNewProjectEntry(projectName);
      
      let projectTarget: 'web' | 'fivem-nui' = 'web';
      const projectConfigFile = newFiles.find(f => f.path.endsWith('project.json'));
      if (projectConfigFile) {
          try {
              const projectSpec = JSON.parse(projectConfigFile.content) as ProjectSpec;
              projectTarget = projectSpec.target === 'fivem-nui' ? 'fivem-nui' : 'web';
          } catch (e) { /* ignore */ }
      } else if (newFiles.some(f => f.path === 'fxmanifest.lua')) {
          projectTarget = 'fivem-nui';
      }

      projectService.saveProjectData(newId, { messages: [], files: newFiles, target: projectTarget });
      handleSelectProject(newId);

    } catch (error) {
      console.error("Error importing project:", error);
      alert(`Failed to import project: ${(error as Error).message}`);
    } finally {
      if (e.target) e.target.value = '';
    }
  };
  
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedInputFiles = e.target.files;
    if (!selectedInputFiles || selectedInputFiles.length === 0) return;

    const basePath = window.prompt("Enter a base path to add these files to (e.g., 'src/assets/'), or leave empty for root.", 'src/');
    if (basePath === null) return;

    try {
        const newFiles: AppFile[] = await Promise.all(
            Array.from(selectedInputFiles).map((file: File) => {
                return new Promise<AppFile>((resolve, reject) => {
                    const reader = new FileReader();
                    // FIX: (L362, L364, L366) Replace reader handlers with more explicit checks to avoid potential type errors with `event.target.result`.
                    reader.onload = (event: ProgressEvent<FileReader>) => {
                        if (event.target && typeof event.target.result === 'string') {
                          const path = `${basePath.trim()}${file.name}`;
                          resolve({ path, content: event.target.result });
                        } else {
                          reject(new Error(`Failed to read file content as text for ${file.name}`));
                        }
                    };
                    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
                    reader.readAsText(file);
                });
            })
        );
        
        setFiles(prevFiles => {
            const existingFilesMap = new Map((prevFiles || []).map(f => [f.path, f]));
            newFiles.forEach(nf => existingFilesMap.set(nf.path, nf));
            return Array.from(existingFilesMap.values());
        });
        
    // FIX: (L534) Corrected `catch` block syntax from an arrow function to a standard block. This resolves this error and subsequent scope-related errors.
    } catch (error) {
        console.error("Error importing files:", error);
        alert(`Failed to import files: ${(error as Error).message}`);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleFolderSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedInputFiles = e.target.files;
    if (!selectedInputFiles || selectedInputFiles.length === 0) return;

    try {
        const newFiles: AppFile[] = await Promise.all(
            Array.from(selectedInputFiles).map((file: File) => {
                return new Promise<AppFile>((resolve, reject) => {
                    const reader = new FileReader();
                    // FIX: (L398) Replace reader logic to be more robust and avoid potential type errors.
                    reader.onload = (event: ProgressEvent<FileReader>) => {
                        const path = (file as any).webkitRelativePath;

                        if (typeof path !== 'string' || !path) {
                            return reject(new Error(`Could not determine relative path for file: ${file.name}`));
                        }
                        
                        if (event.target && typeof event.target.result === 'string') {
                            resolve({ path, content: event.target.result });
                        } else {
                           reject(new Error(`Failed to read file content as text for ${path}`));
                        }
                    };
                    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
                    reader.readAsText(file);
                });
            })
        );

        setFiles(prevFiles => {
            const existingFilesMap = new Map((prevFiles || []).map(f => [f.path, f]));
            newFiles.forEach(nf => existingFilesMap.set(nf.path, nf));
            return Array.from(existingFilesMap.values());
        });

    // FIX: (L577) Corrected `catch` block syntax from an arrow function to a standard block. This resolves this error and subsequent scope-related errors.
    } catch (error) {
        console.error("Error importing folder:", error);
        alert(`Failed to import folder: ${(error as Error).message}`);
    } finally {
      if (e.target) e.target.value = '';
    }
  };
  
  return (
    <ContextMenuProvider>
      <div ref={appContainerRef} className="h-screen w-screen flex flex-col font-sans text-slate-900 dark:text-slate-100 overflow-hidden">
        <TopMenuBar 
            onNewProject={() => setIsNewProjectModalOpen(true)}
            onDownloadZip={handleDownloadZip}
            onImportProject={handleImportProject}
            onImportFromFigma={() => setIsFigmaModalOpen(true)}
            onImportFiles={handleImportFiles}
            onImportFolder={handleImportFolder}
            onSettings={() => setIsSettingsModalOpen(true)}
            toggleTheme={toggleTheme}
            toggleProjectSidebar={toggleProjectSidebar}
            isProjectSidebarOpen={isProjectSidebarOpen}
            toggleFileExplorer={toggleFileExplorer}
            toggleChatPanel={toggleChatPanel}
            toggleNuiPanel={toggleNuiPanel}
            target={projectTarget}
            hasFiles={!!files && files.length > 0}
        />
        <div className="flex-1 flex flex-row min-h-0 relative">
          
          {isProjectSidebarOpen && (
            <Sidebar 
              projects={projects} 
              selectedProjectId={selectedProjectId!} 
              onSelectProject={handleSelectProject} 
              onNewProject={() => setIsNewProjectModalOpen(true)}
              onRenameProject={handleRenameProjectEntry}
              onDeleteProject={handleDeleteProject}
              onToggle={toggleProjectSidebar}
            />
          )}
          <main className="flex-1 flex flex-row min-w-0">
            <div className="flex-1 flex flex-col min-w-0">
                <MainContent
                    messages={messages}
                    userInput={userInput}
                    onUserInputChange={(e) => setUserInput(e.target.value)}
                    onSendMessage={handleSendMessage}
                    onStopGeneration={handleStopGeneration}
                    isLoading={isLoading}
                    theme={theme}
                    toggleTheme={toggleTheme}
                    files={files}
                    isFileExplorerOpen={isFileExplorerOpen}
                    toggleFileExplorer={toggleFileExplorer}
                    isProjectSidebarOpen={isProjectSidebarOpen}
                    toggleProjectSidebar={toggleProjectSidebar}
                    isNuiPanelOpen={isNuiPanelOpen}
                    toggleNuiPanel={toggleNuiPanel}
                    isChatPanelOpen={isChatPanelOpen}
                    toggleChatPanel={toggleChatPanel}
                    target={projectTarget}
                    onDownloadZip={handleDownloadZip}
                    previewDevice={previewDevice}
                    setPreviewDevice={setPreviewDevice}
                    htmlContent={htmlContent}
                    bundleStatus={bundleResult.status}
                    bundleError={currentError}
                    onRuntimeError={setRuntimeError}
                    imageForPrompt={imageForPrompt}
                    onSetImageForPrompt={setImageForPrompt}
                    onRefreshPreview={handleRefreshPreview}
                    previewRefreshKey={previewRefreshKey}
                />
            </div>
            {isFileExplorerOpen && files && (
                <>
                    <div onMouseDown={handleResizeMouseDown} className="w-1.5 flex-shrink-0 bg-slate-200/60 dark:bg-slate-800/60 cursor-col-resize hover:bg-blue-600/80 transition-colors duration-200" />
                    <FilesPane 
                        files={files} 
                        theme={theme} 
                        onFileContentChange={handleFileContentChange}
                        activeFilePath={activeFilePath}
                        openFilePaths={openFilePaths}
                        onOpenFile={handleOpenFile}
                        onCloseFile={handleCloseFile}
                        onSaveFile={handleSaveFile}
                        onNewFile={handleNewFile}
                        onDeleteFile={handleDeleteFile}
                        onRenameFile={handleRenameFile}
                        unsavedChanges={unsavedChanges}
                        width={paneWidth}
                    />
                </>
            )}
          </main>
        </div>
        
        {isFigmaModalOpen && <FigmaImportModal isOpen={isFigmaModalOpen} onClose={() => setIsFigmaModalOpen(false)} onImport={handleFigmaImport} />}
        {isSettingsModalOpen && <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} onSave={handleSaveSettings} currentSupabaseConfig={supabaseConfig} currentProjectSettings={projectSettings} />}
        {isNewProjectModalOpen && <NewProjectModal isOpen={isNewProjectModalOpen} onClose={() => setIsNewProjectModalOpen(false)} onCreate={handleCreateAndGenerateProject} />}
        
        <input type="file" accept=".zip" ref={importProjectInputRef} onChange={handleProjectFileSelected} className="hidden" />
        <input type="file" multiple ref={importFilesInputRef} onChange={handleFilesSelected} className="hidden" />
        {/* FIX: The 'directory' and 'webkitdirectory' attributes are non-standard. The spread object is a valid workaround to bypass TypeScript's strict prop checking. */}
        <input type="file" {...{ directory: "", webkitdirectory: "" } as any} ref={importFolderInputRef} onChange={handleFolderSelected} className="hidden" />
      </div>
      <ContextMenu />
    </ContextMenuProvider>
  );
};

export default App;
