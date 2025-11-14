import React, { useState, useCallback, useEffect } from 'react';

const MIN_PANE_WIDTH = 400; // 25rem
const MAX_PANE_WIDTH = 960; // 60rem
const PANE_WIDTH_STORAGE_KEY = 'ai_app_builder_file_pane_width';

export const useFilePaneResizer = (appContainerRef: React.RefObject<HTMLDivElement>) => {
    const [paneWidth, setPaneWidth] = useState(() => {
        try {
            const savedWidth = localStorage.getItem(PANE_WIDTH_STORAGE_KEY);
            if (savedWidth) {
                const parsedWidth = parseInt(savedWidth, 10);
                if (!isNaN(parsedWidth)) {
                    return Math.max(MIN_PANE_WIDTH, Math.min(parsedWidth, MAX_PANE_WIDTH));
                }
            }
        } catch (e) {
            console.error("Failed to parse file pane width from localStorage", e);
            localStorage.removeItem(PANE_WIDTH_STORAGE_KEY);
        }
        return 640; // Default width
    });

    const [isResizing, setIsResizing] = useState(false);

    const handleResizeMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    };

    const handleResizeMouseUp = useCallback(() => {
        setIsResizing(false);
    }, []);

    const handleResizeMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing || !appContainerRef.current) return;
        const containerRect = appContainerRef.current.getBoundingClientRect();
        let newWidth = containerRect.right - e.clientX;
    
        newWidth = Math.max(MIN_PANE_WIDTH, Math.min(newWidth, MAX_PANE_WIDTH));
        setPaneWidth(newWidth);
    }, [isResizing, appContainerRef]);

    useEffect(() => {
        if (isResizing) {
          document.addEventListener('mousemove', handleResizeMouseMove);
          document.addEventListener('mouseup', handleResizeMouseUp);
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';
        } else {
          document.removeEventListener('mousemove', handleResizeMouseMove);
          document.removeEventListener('mouseup', handleResizeMouseUp);
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        }
    
        return () => {
          document.removeEventListener('mousemove', handleResizeMouseMove);
          document.removeEventListener('mouseup', handleResizeMouseUp);
        };
    }, [isResizing, handleResizeMouseMove, handleResizeMouseUp]);

    // Save the file explorer pane width when it changes
    useEffect(() => {
        try {
            localStorage.setItem(PANE_WIDTH_STORAGE_KEY, String(paneWidth));
        } catch (e) {
            console.error("Failed to save file pane width to localStorage", e);
        }
    }, [paneWidth]);


    return { paneWidth, handleResizeMouseDown };
};