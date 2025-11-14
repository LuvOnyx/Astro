import React, { useMemo, useEffect, useState, RefObject } from 'react';
import type { AppFile, ProjectSpec } from '../types';
import { bundle } from '../utils/bundler';
import type { LogEntry } from './NuiControls';

interface FiveMPreviewProps {
  files: AppFile[] | null;
  iframeRef: RefObject<HTMLIFrameElement>;
  addLog: (type: LogEntry['type'], message: string, data?: any) => void;
  isFocused: boolean;
}

const iframeErrorHandler = `<script>
    window.addEventListener('error', (event) => {
        event.preventDefault();
        window.parent.postMessage({ type: 'nui:error', payload: event.message }, '*');
        document.body.innerHTML = '<div style="color: red; font-family: sans-serif; padding: 1rem;"><h4>Runtime Error</h4><pre>' + (event.message || 'Script execution failed') + '</pre></div>';
    });
    window.addEventListener('unhandledrejection', (event) => {
      event.preventDefault();
      const message = event.reason instanceof Error ? event.reason.message : String(event.reason);
      window.parent.postMessage({ type: 'nui:error', payload: 'Unhandled Promise: ' + message }, '*');
      document.body.innerHTML = '<div style="color: red; font-family: sans-serif; padding: 1rem;"><h4>Runtime Error (Unhandled Promise)</h4><pre>' + message + '</pre></div>';
    });
<\/script>`;

const createBridgeScript = (resourceName: string) => `
<script>
    const resourceName = '${resourceName || 'my-resource'}';
    const originalFetch = window.fetch;

    window.fetch = function(resource, options) {
        const url = typeof resource === 'string' ? resource : resource.url;
        const isNuiCallback = url.startsWith('https://' + resourceName + '/');

        if (isNuiCallback) {
            const path = url.substring(('https://' + resourceName).length);
            return new Promise(async (resolve, reject) => {
                const callbackId = 'cb_' + Date.now() + '_' + Math.random().toString(36).substring(2);
                
                const messageListener = (event) => {
                    if (event.data.type === 'nui:callbackResult' && event.data.callbackId === callbackId) {
                        window.removeEventListener('message', messageListener);
                        if (event.data.error) {
                            reject(new Error(event.data.error));
                        } else {
                            const response = new Response(JSON.stringify(event.data.result), {
                                status: 200,
                                headers: { 'Content-Type': 'application/json; charset=UTF-8' }
                            });
                            resolve(response);
                        }
                    }
                };
                window.addEventListener('message', messageListener);

                let body;
                if (options && options.body) {
                    try {
                        body = JSON.parse(options.body);
                    } catch(e) {
                        console.error('NUI callback body must be valid JSON.', e);
                        body = options.body;
                    }
                }

                window.parent.postMessage({
                    type: 'nui:callback',
                    path: path,
                    body: body,
                    callbackId: callbackId
                }, '*');
            });
        }
        return originalFetch(resource, options);
    };
<\/script>
`;

export const FiveMPreview: React.FC<FiveMPreviewProps> = ({ files, iframeRef, addLog, isFocused }) => {
  const [bundleState, setBundleState] = useState<{ status: 'idle' | 'pending' | 'success' | 'error'; error: string | null }>({ status: 'idle', error: null });
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [previewKey, setPreviewKey] = useState(0);
  
  const resourceName = useMemo(() => {
    const projectFile = files?.find(f => f.path === 'project.json');
    if (projectFile) {
        try {
            const spec: ProjectSpec = JSON.parse(projectFile.content);
            return spec.name;
        } catch(e) { return 'my-resource'; }
    }
    return 'my-resource';
  }, [files]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
        if (event.source !== iframeRef.current?.contentWindow) return;
        
        const { type, payload, path, body, callbackId } = event.data ?? {};

        if (type === 'nui:callback') {
            addLog('in', `NUI Callback: ${path}`, body);
            // Simulate a successful response
            iframeRef.current?.contentWindow?.postMessage({
                type: 'nui:callbackResult',
                callbackId: callbackId,
                result: { ok: true, message: `Callback '${path}' handled.` }
            }, '*');
        } else if (type === 'nui:error') {
            addLog('error', 'UI Runtime Error', payload);
        }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addLog, iframeRef]);

  useEffect(() => {
    if (!files) {
      setHtmlContent('');
      return;
    }
    setPreviewKey(k => k + 1);
    
    const generateSrcDoc = async () => {
      setBundleState({ status: 'pending', error: null });
      const result = await bundle(files);

      if (result.error) {
        setBundleState({ status: 'error', error: result.error });
        addLog('error', 'Build Failed', result.error);
        setHtmlContent('');
        return;
      }

      const htmlFile = files.find(f => f.path.endsWith('index.html'));
      if (htmlFile && result.code) {
        let processedHtml = htmlFile.content;

        const tailwindConfigFile = files.find(f => f.path === 'ui/tailwind.config.js' || f.path === 'tailwind.config.js');
        let tailwindInjection = '<script src="https://cdn.tailwindcss.com"><\/script>';
        if (tailwindConfigFile) {
          try {
            const configString = tailwindConfigFile.content
              .replace(/^(?:import|require)\s*\(.*\);?/gm, '')
              .replace(/export\s+default\s*/, '')
              .trim();
            if (configString.startsWith('{')) {
              tailwindInjection += `\n<script type="text/tailwindcss-config">${configString}<\/script>`;
            }
          } catch (e) { console.error("Could not process tailwind.config.js for preview:", e); }
        }

        const headInjection = `${iframeErrorHandler}\n${createBridgeScript(resourceName)}\n${tailwindInjection}`;

        const scriptTagRegex = /<script\s+type="module"\s+src=(["']).*?\1\s*><\/script>/i;
        processedHtml = processedHtml.replace(scriptTagRegex, '');
        processedHtml = processedHtml.replace(/<script[^>]+tailwindcss\.com[^>]+><\/script>/gi, '');
        
        if (processedHtml.includes('</head>')) {
            processedHtml = processedHtml.replace('</head>', `${headInjection}\n</head>`);
        } else {
            processedHtml = `<head>${headInjection}</head>` + processedHtml;
        }

        if (processedHtml.includes('</body>')) {
             processedHtml = processedHtml.replace('</body>', `<script type="module">${result.code}<\/script>\n</body>`);
        } else {
             processedHtml += `<script type="module">${result.code}<\/script>`;
        }

        setHtmlContent(processedHtml);
        setBundleState({ status: 'success', error: null });
        addLog('system', 'Preview rebuilt successfully.');
      } else {
        const error = 'Failed to construct preview (index.html not found or bundle failed).';
        setBundleState({ status: 'error', error });
        addLog('error', error);
        setHtmlContent('');
      }
    };
    generateSrcDoc();
  }, [files, resourceName, addLog]);
  
  const renderIframe = () => {
    switch (bundleState.status) {
        case 'pending':
            return <div className="flex-1 flex items-center justify-center bg-white dark:bg-black"><p className="text-slate-500 dark:text-slate-400 animate-pulse">Building preview...</p></div>
        case 'error':
            return <div className="flex-1 p-4 text-red-500 bg-red-50 dark:bg-red-900/20"><h4 className="font-bold">Build Failed</h4><pre className="whitespace-pre-wrap text-xs mt-2">{bundleState.error}</pre></div>
        default:
             return (
                <div className="relative w-full h-full">
                    <iframe
                        ref={iframeRef}
                        key={previewKey}
                        title="FiveM NUI Preview"
                        className="w-full h-full border-0 bg-transparent"
                        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
                        srcDoc={htmlContent}
                    />
                    {isFocused && <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg"><p>NUI Focus is Active</p></div>}
                </div>
             );
    }
  };
  
  return (
    <div className="flex-1 flex flex-row min-h-[400px] border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
        <main className="flex-1 flex flex-col min-h-0 relative bg-[url('https://raw.githubusercontent.com/google/generative-ai-docs/main/site/en/gemini-api/docs/images/custom_applications/fivem_bg.png')] bg-cover bg-center">
            {renderIframe()}
        </main>
    </div>
  );
};