import { useState, useEffect, useCallback } from 'react';
import * as projectService from '../services/projectService';
import type { Project, Message, AppFile, ProjectSettings } from '../types';
import { defaultWebApp } from '../project-templates/default-web-app';

export const useProjectManager = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [files, setFiles] = useState<AppFile[] | null>(null);
    const [projectTarget, setProjectTarget] = useState<'web' | 'fivem-nui'>('web');
    const [projectSettings, setProjectSettings] = useState<ProjectSettings>({ blacklist: '', projectRoot: '', enableTerminal: false });

    // Load initial projects list on mount
    useEffect(() => {
        const loadedProjects = projectService.getProjects();
        if (loadedProjects.length > 0) {
            setProjects(loadedProjects);
            setSelectedProjectId(loadedProjects[0].id);
        } else {
            // Create a default project if none exist
            const newId = createNewProjectEntry('My First App');
            projectService.saveProjectData(newId, { messages: [], files: defaultWebApp, target: 'web' });
            // This will trigger the other effects to load the new project's data
        }
    // This effect should only run once on mount to initialize
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load project data when selectedProjectId changes
    useEffect(() => {
        if (selectedProjectId === null) {
            setMessages([]);
            setFiles(null);
            setProjectTarget('web');
            setProjectSettings({ blacklist: '', projectRoot: '', enableTerminal: false });
            return;
        }
        const data = projectService.getProjectData(selectedProjectId);
        const settings = projectService.getProjectSettings(selectedProjectId);
        setMessages(data.messages);
        setFiles(data.files);
        setProjectTarget(data.target || 'web');
        setProjectSettings(settings);
    }, [selectedProjectId]);

    // Save messages/files when they change for the current project
    useEffect(() => {
        if (selectedProjectId !== null) {
            projectService.saveProjectData(selectedProjectId, { messages, files, target: projectTarget });
        }
    }, [messages, files, selectedProjectId, projectTarget]);
    
    // Save settings when they change for the current project
    useEffect(() => {
        if (selectedProjectId !== null) {
            projectService.saveProjectSettings(selectedProjectId, projectSettings);
        }
    }, [projectSettings, selectedProjectId]);

    // Save the list of projects when it changes
    useEffect(() => {
        // Don't save an empty project list on the initial render before loading
        if (projects.length > 0) {
            projectService.saveProjects(projects);
        }
    }, [projects]);

    const handleSelectProject = useCallback((id: number) => {
        if (id === selectedProjectId) return;
        setSelectedProjectId(id);
    }, [selectedProjectId]);

    const createNewProjectEntry = useCallback((name?: string): number => {
        const newId = Date.now();
        const newProject: Project = {
          id: newId,
          name: name || `New Project ${projects.length + 1}`,
          updated: 'Just now',
        };
        
        setProjects(prevProjects => [newProject, ...prevProjects]);
        projectService.saveProjectData(newId, { messages: [], files: null, target: 'web' });
        projectService.saveProjectSettings(newId, { blacklist: 'node_modules\ndist\n.env', projectRoot: '', enableTerminal: false });
        return newId;
    }, [projects]);
      
    const handleRenameProject = (id: number, newName: string) => {
        setProjects(prev => prev.map(p => 
            p.id === id ? { ...p, name: newName, updated: 'Just now' } : p
        ));
    };
    
    const handleDeleteProject = (id: number) => {
        if (projects.length <= 1) {
            alert("Cannot delete the last project.");
            return;
        }
        
        const isConfirmed = window.confirm(`Are you sure you want to delete this project? This action cannot be undone.`);
        if (!isConfirmed) return;
  
        setProjects(prev => {
            const newProjects = prev.filter(p => p.id !== id);
            if (selectedProjectId === id) {
                setSelectedProjectId(newProjects[0]?.id ?? null);
            }
            return newProjects;
        });
        projectService.deleteProjectData(id);
    };

    return {
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
        handleRenameProject,
        handleDeleteProject,
    };
};
