import type { Part } from '@google/genai';

export interface Project {
  id: number;
  name: string;
  updated: string;
}

export interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  reasoning?: string;
  isFixing?: boolean; // Used for AI placeholders during autofix attempts
  isLoading?: boolean; // True if the AI is still generating parts for this message
  image?: {
    data: string; // base64
    mimeType: string;
  };
}

export interface AppFile {
  path: string;
  content: string;
}

export interface AppRoute {
  path:string;
  name: string;
}

export interface ProjectSpec {
  name: string;
  main: string;
  compatibility_date: string;
  target?: 'web' | 'fivem-nui';
}

export interface ProjectSettings {
  blacklist: string; // Stored as a single string, lines separated by \n
  projectRoot: string;
  enableTerminal: boolean;
}

export type PreviewDevice = 'desktop' | 'iphone15';

// Re-export Part for use in App.tsx
export type { Part };