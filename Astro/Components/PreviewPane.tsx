import React, { useState, useRef, useCallback } from 'react';
import type { AppFile, PreviewDevice } from '../types';
import { WebPreview } from './WebPreview';
import { FiveMPreview } from './FiveMPreview';
import { NuiControls, type LogEntry } from './NuiControls';
import { BrainCircuitIcon } from './Icons';

interface PreviewPaneProps {
  files: AppFile[] | null;
  target: 'web' | 'fivem-nui';
  isNuiPanelOpen: boolean;
  onToggleNuiPanel: () => void;
  previewDevice: PreviewDevice;
  htmlContent: string | null;
  bundleStatus: 'idle' | 'pending' | 'success' | 'error';
  bundleError: string | null;
  onRuntimeError: (message: string) => void;
  previewRefreshKey: number;
}


export const PreviewPane: React.FC<PreviewPaneProps> = ({ files, target, isNuiPanelOpen, onToggleNuiPanel, previewDevice, htmlContent, bundleStatus, bundleError, onRuntimeError, previewRefreshKey }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [testPayload, setTestPayload] = useState('{\n  "action": "setVisible",\n  "data": true\n}');

  const addLog = useCallback((type: LogEntry['type'], message: string, data?: any) => {
    const newLog: LogEntry = {
        id: Date.now() + Math.random(),
        type,
        timestamp: new Date().toLocaleTimeString(),
        message,
        data: data ? JSON.stringify(data, null, 2) : undefined
    };
    setLogs(prev => [newLog, ...prev].slice(0, 100)); // Keep last 100 logs
  }, []);

  const handleSendNuiMessage = () => {
    try {
        const payload = JSON.parse(testPayload);
        iframeRef.current?.contentWindow?.postMessage(payload, '*');
        addLog('out', 'Sent NUI Message', payload);
    } catch (e) {
        addLog('error', 'Invalid JSON payload', (e as Error).message);
    }
  };
  
  const handleFocusToggle = (checked: boolean) => {
    setIsFocused(checked);
    const focusPayload = { action: '__sim_set_focus', data: checked };
    iframeRef.current?.contentWindow?.postMessage(focusPayload, '*');
    addLog('system', `NUI Focus ${checked ? 'enabled' : 'disabled'}.`);
  };


  if (!files || files.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-slate-200/60 dark:border-slate-800/60 rounded-2xl bg-white dark:bg-slate-900/50 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
        <BrainCircuitIcon className="w-40 h-40 text-slate-300 dark:text-slate-700 mb-4" />
        <h3 className="mt-4 text-xl font-bold text-slate-800 dark:text-slate-200">Start by Chatting with the AI</h3>
        <p className="mt-2 max-w-sm text-slate-500 dark:text-slate-400">Describe the application you want to build, and the AI will generate the initial files for you to preview here.</p>
      </div>
    );
  }

  if (target === 'fivem-nui') {
      return (
        <div className="relative w-full h-full">
            <FiveMPreview 
                key={previewRefreshKey}
                files={files} 
                iframeRef={iframeRef}
                addLog={addLog}
                isFocused={isFocused}
            />
            {isNuiPanelOpen && (
                <NuiControls 
                    logs={logs}
                    testPayload={testPayload}
                    isFocused={isFocused}
                    onTestPayloadChange={setTestPayload}
                    onSendNuiMessage={handleSendNuiMessage}
                    onFocusToggle={handleFocusToggle}
                    onClose={onToggleNuiPanel}
                />
            )}
        </div>
      );
  }

  return <WebPreview 
            key={previewRefreshKey}
            device={previewDevice} 
            htmlContent={htmlContent} 
            error={bundleError}
            status={bundleStatus}
            onRuntimeError={onRuntimeError}
          />;
};