
import type { Project, Message, AppFile, ProjectSettings } from '../types';

const PROJECTS_KEY = 'ai_app_builder_projects';
const PROJECT_DATA_PREFIX = 'ai_app_builder_project_';
const SETTINGS_PREFIX = 'ai_app_builder_settings_';

export interface ProjectData {
  messages: Message[];
  files: AppFile[] | null;
  target?: 'web' | 'fivem-nui';
}

// Helper to read from localStorage with a default value
function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage for key "${key}":`, error);
    return defaultValue;
  }
}

// Helper to write to localStorage
function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage for key "${key}":`, error);
  }
}

export function getProjects(): Project[] {
  const projects = getFromStorage<Project[]>(PROJECTS_KEY, []);
  // Sort by updated time, which we'll store as a timestamp
  return projects.sort((a, b) => b.id - a.id);
}

export function saveProjects(projects: Project[]): void {
  saveToStorage(PROJECTS_KEY, projects);
}

export function getProjectData(projectId: number): ProjectData {
  return getFromStorage<ProjectData>(`${PROJECT_DATA_PREFIX}${projectId}`, { messages: [], files: null, target: 'web' });
}

export function saveProjectData(projectId: number, data: ProjectData): void {
  saveToStorage(`${PROJECT_DATA_PREFIX}${projectId}`, data);
}

export function deleteProjectData(projectId: number): void {
    try {
        localStorage.removeItem(`${PROJECT_DATA_PREFIX}${projectId}`);
    } catch (error) {
        console.error(`Error deleting project data for id "${projectId}":`, error);
    }
}

export function getProjectSettings(projectId: number): ProjectSettings {
    return getFromStorage<ProjectSettings>(`${SETTINGS_PREFIX}${projectId}`, { blacklist: 'node_modules\ndist\n.env', projectRoot: '', enableTerminal: false });
}

export function saveProjectSettings(projectId: number, settings: ProjectSettings): void {
    saveToStorage(`${SETTINGS_PREFIX}${projectId}`, settings);
}
