import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Message, AppFile, ProjectSettings, ProjectSpec, Part } from '../types';
import { GoogleGenAI } from '@google/genai';
import { formatCode } from '../utils/formatter';
import { systemInstruction } from '../services/geminiService';

const MAX_AUTOFIX_ATTEMPTS = 2;


interface ChatManagerProps {
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    files: AppFile[] | null;
    setFiles: React.Dispatch<React.SetStateAction<AppFile[] | null>>;
    projectSettings: ProjectSettings;
    setProjectTarget: (target: 'web' | 'fivem-nui') => void;
    currentError: string | null;
    onGenerationComplete: (finalFiles: AppFile[]) => void;
}

export const useChatManager = ({
    messages,
    setMessages,
    files,
    setFiles,
    projectSettings,
    setProjectTarget,
    currentError,
    onGenerationComplete,
}: ChatManagerProps) => {
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [imageForPrompt, setImageForPrompt] = useState<{data: string, mimeType: string} | null>(null);
    const [autofixAttempts, setAutofixAttempts] = useState(0);
    const isCancelledRef = useRef(false);

    const parseFileStructure = (text: string): AppFile[] => {
        const filesStartTag = '---FILE_STRUCTURE_START---';
        const filesStartIndex = text.indexOf(filesStartTag);
        if (filesStartIndex !== -1) {
            const filesEndTag = '---FILE_STRUCTURE_END---';
            const filesEndIndex = text.lastIndexOf(filesEndTag);
            if (filesEndIndex !== -1) {
                const filesJsonString = text.substring(filesStartIndex + filesStartTag.length, filesEndIndex).trim().replace(/```json\n?|\n?```/g, '');
                try {
                    return JSON.parse(filesJsonString);
                } catch (e) {
                    console.error("Error parsing file structure JSON:", e);
                }
            }
        }
        return [];
    };

    const handleSendMessage = useCallback(async (e: React.FormEvent | string, isAutofix: boolean = false) => {
        let currentInput = '';
        if (typeof e === 'string') {
            currentInput = e;
        } else {
            e.preventDefault();
            currentInput = userInput;
        }

        const imageToSend = imageForPrompt;
    
        if (!currentInput.trim() && !imageToSend || isLoading) return;
        
        if (isAutofix) {
            setAutofixAttempts(prev => prev + 1);
        } else {
            setAutofixAttempts(0); // Reset for new user prompts
        }
    
        isCancelledRef.current = false;
        const userMessage: Message = { id: Date.now(), text: currentInput, sender: 'user', image: imageToSend };
        const aiMessagePlaceholder: Message = { id: Date.now() + 1, text: '', sender: 'ai', isFixing: isAutofix, isLoading: true };
        
        if (isAutofix) {
            setMessages(prev => [...prev.slice(0, -1), aiMessagePlaceholder]);
        } else {
            setMessages(prev => [...prev, userMessage, aiMessagePlaceholder]);
        }
    
        setUserInput('');
        setImageForPrompt(null);
        setIsLoading(true);
    
        try {
            let fullPrompt = currentInput;
            
            const blacklistPatterns = projectSettings.blacklist.split('\n').filter(p => p.trim() !== '');
            const filteredFiles = files && blacklistPatterns.length > 0
                ? files.filter(file => !blacklistPatterns.some(pattern => file.path.startsWith(pattern.trim())))
                : files;
    
            fullPrompt += "\n\n---SECURITY_CONTEXT_START---\n" +
                `Project Root Directory (for local server): "${projectSettings.projectRoot || '(Not Set)'}"\n` +
                `Terminal Access: ${projectSettings.enableTerminal ? 'Enabled' : 'Disabled'}\n` +
                "Blacklisted File Paths (DO NOT ACCESS):\n" + (projectSettings.blacklist || '(None)') +
                "\n---SECURITY_CONTEXT_END---";
    
            if (filteredFiles) {
                fullPrompt += "\n\n---CURRENT_FILES_START---\n" + JSON.stringify(filteredFiles, null, 2) + "\n---CURRENT_FILES_END---";
            }
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const model = 'gemini-2.5-flash';

            const parts: Part[] = [{ text: fullPrompt }];
            if (imageToSend) {
                parts.unshift({
                    inlineData: {
                        mimeType: imageToSend.mimeType,
                        data: imageToSend.data,
                    }
                });
            }

            const response = await ai.models.generateContent({
                model,
                contents: { parts },
                config: {
                    systemInstruction: systemInstruction,
                }
            });

            if (isCancelledRef.current) {
                setMessages(prev => prev.map(msg => msg.id === aiMessagePlaceholder.id ? { ...msg, text: 'Generation cancelled by user.', reasoning: '', isFixing: false, isLoading: false } : msg));
                return;
            }

            const responseText = response.text;

            const reasoningStartTag = '---REASONING_START---';
            const reasoningEndTag = '---REASONING_END---';
            let finalReasoning = '';
            
            const reasoningStartIndex = responseText.indexOf(reasoningStartTag);
             if (reasoningStartIndex !== -1) {
                const reasoningEndIndex = responseText.indexOf(reasoningEndTag, reasoningStartIndex);
                finalReasoning = reasoningEndIndex !== -1
                    ? responseText.substring(reasoningStartIndex + reasoningStartTag.length, reasoningEndIndex).trim()
                    : responseText.substring(reasoningStartIndex + reasoningStartTag.length).trim();
            }

            const finalFiles = parseFileStructure(responseText);
    
            if (finalFiles.length > 0) {
                const projectConfigFile = finalFiles.find(f => f.path === 'project.json' || f.path === 'ui/project.json');
                if (projectConfigFile) {
                    try {
                        const projectSpec: ProjectSpec = JSON.parse(projectConfigFile.content);
                        setProjectTarget(projectSpec.target === 'fivem-nui' ? 'fivem-nui' : 'web');
                    } catch (e) {
                        setProjectTarget(finalFiles.some(f => f.path === 'fxmanifest.lua') ? 'fivem-nui' : 'web');
                    }
                } else {
                     setProjectTarget(finalFiles.some(f => f.path === 'fxmanifest.lua') ? 'fivem-nui' : 'web');
                }
    
                const formattedFiles = await Promise.all(
                    finalFiles.map(async (file) => ({
                        ...file,
                        content: await formatCode(file.path, file.content)
                    }))
                );
                if (isAutofix) {
                    setAutofixAttempts(prev => prev + 1);
                } else {
                    setAutofixAttempts(0); // Reset on successful user generation
                }
                setFiles(formattedFiles);
                onGenerationComplete(formattedFiles);
            }
    
            let cleanedFinalText = responseText;
            if (reasoningStartIndex !== -1) {
                 const reasoningEndIndex = cleanedFinalText.indexOf(reasoningEndTag, reasoningStartIndex);
                 if (reasoningEndIndex !== -1) {
                    cleanedFinalText = cleanedFinalText.substring(0, reasoningStartIndex) + cleanedFinalText.substring(reasoningEndIndex + reasoningEndTag.length);
                 }
            }
            const filesStartTag = '---FILE_STRUCTURE_START---';
            const filesStartIdx = cleanedFinalText.indexOf(filesStartTag);
            if (filesStartIdx !== -1) {
                cleanedFinalText = cleanedFinalText.substring(0, filesStartIdx);
            }
            
            setMessages(prev => prev.map(msg => 
                msg.id === aiMessagePlaceholder.id 
                ? { ...msg, text: cleanedFinalText.trim(), reasoning: finalReasoning, isFixing: false, isLoading: false } 
                : msg
            ));
    
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => prev.map(msg => msg.id === aiMessagePlaceholder.id ? { ...msg, text: `An error occurred: ${(error as Error).message}`, isFixing: false, isLoading: false } : msg));
        } finally {
            setIsLoading(false);
        }
      }, [userInput, imageForPrompt, isLoading, files, projectSettings, setMessages, setFiles, setProjectTarget, onGenerationComplete, messages]);

    const handleStopGeneration = useCallback(() => {
        isCancelledRef.current = true;
        setIsLoading(false);
    }, []);

    // Effect to trigger autofix when an error is detected
    useEffect(() => {
        if (currentError && !isLoading && messages[messages.length - 1]?.sender === 'ai' && autofixAttempts < MAX_AUTOFIX_ATTEMPTS) {
            const fixPrompt = `The previous code you generated resulted in an error. Please analyze the error message and the provided files and generate a new, complete file structure that fixes the issue. Do not apologize or explain in prose, just provide the reasoning and the fixed file structure.\n\n---ERROR_MESSAGE_START---\n${currentError}\n---ERROR_MESSAGE_END---`;
            
            setTimeout(() => {
                 handleSendMessage(fixPrompt, true);
            }, 500);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentError, isLoading, autofixAttempts]); // Intentionally leave out dependencies that would cause loops

    return {
        userInput,
        setUserInput,
        isLoading,
        handleSendMessage,
        handleStopGeneration,
        imageForPrompt,
        setImageForPrompt,
    };
};