import React, { useEffect, useRef } from 'react';
import type { PreviewDevice } from '../types';

interface WebPreviewProps {
  device: PreviewDevice;
  htmlContent: string | null;
  error: string | null;
  status: 'idle' | 'pending' | 'success' | 'error';
  onRuntimeError: (message: string) => void;
}

const iframeErrorHandler = `
<script>
    window.addEventListener('error', (event) => {
        event.preventDefault();
        window.parent.postMessage({ type: 'runtime-error', payload: event.message }, '*');
        document.body.innerHTML = '<div style="color: red; font-family: sans-serif; padding: 1rem;"><h4>Runtime Error</h4><pre>' + (event.message || 'Script execution failed') + '</pre></div>';
    });
    window.addEventListener('unhandledrejection', (event) => {
      event.preventDefault();
      const message = event.reason instanceof Error ? event.reason.message : String(event.reason);
      window.parent.postMessage({ type: 'runtime-error', payload: 'Unhandled Promise: ' + message }, '*');
      document.body.innerHTML = '<div style="color: red; font-family: sans-serif; padding: 1rem;"><h4>Runtime Error (Unhandled Promise)</h4><pre>' + message + '</pre></div>';
    });
<\/script>
`;

const serviceWorkerDisabler = `
<script>
  if ('serviceWorker' in navigator) {
    try {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          register: function() {
            console.log('Service Worker registration disabled in preview iframe.');
            return Promise.resolve({ scope: '/' });
          },
          getRegistrations: function() { return Promise.resolve([]); },
          getRegistration: function() { return Promise.resolve(undefined); },
          controller: null,
          addEventListener: function() {},
          removeEventListener: function() {}
        },
        writable: false, configurable: false
      });
    } catch(e) {
        console.warn('Could not override navigator.serviceWorker.');
    }
  }
<\/script>
`;

export const generatePreviewHtml = (htmlFileContent: string, bundledCode: string, tailwindConfigJs?: string): string => {
    let processedHtml = htmlFileContent;
          
    let tailwindInjection = '<script src="https://cdn.tailwindcss.com"><\/script>';
    if (tailwindConfigJs) {
      try {
        // Strip exports/imports to get just the config object
        const configString = tailwindConfigJs
          .replace(/^(?:import|require)\s*\(.*\);?/gm, '')
          .replace(/export\s+default\s*/, '')
          .trim();
        if (configString.startsWith('{')) {
          // Use the modern, recommended <script type="text/tailwindcss-config"> tag
          tailwindInjection += `\n<script type="text/tailwindcss-config">${configString}<\/script>`;
        }
      } catch (e) { console.error("Could not process tailwind.config.js for preview:", e); }
    }

    const headInjection = `${serviceWorkerDisabler}\n${tailwindInjection}\n${iframeErrorHandler}`;
    
    processedHtml = processedHtml.replace(/<script[^>]+tailwindcss\.com[^>]+><\/script>/gi, '');
    const scriptTagRegex = /<script\s+type="module"\s+src=(["']).*?\1\s*><\/script>/i;
    processedHtml = processedHtml.replace(scriptTagRegex, '');
    
    if (processedHtml.includes('</head>')) {
        processedHtml = processedHtml.replace('</head>', `${headInjection}\n</head>`);
    } else {
        processedHtml = `<head>${headInjection}</head>` + processedHtml;
    }

    if (processedHtml.includes('</body>')) {
          processedHtml = processedHtml.replace('</body>', `<script type="module">${bundledCode}<\/script>\n</body>`);
    } else {
          processedHtml += `<script type="module">${bundledCode}<\/script>`;
    }

    return processedHtml;
}

export const WebPreview: React.FC<WebPreviewProps> = ({ device, htmlContent, error, status, onRuntimeError }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'runtime-error') {
            onRuntimeError(event.data.payload);
        }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onRuntimeError]);

  const renderContent = () => {
    if (status === 'idle') {
      return null;
    }
    
    switch (status) {
        case 'pending':
            return <div className="flex-1 flex items-center justify-center"><p className="text-slate-500 dark:text-slate-400 animate-pulse">Building preview...</p></div>
        case 'error':
            return <div className="flex-1 p-4 text-red-500 bg-red-50 dark:bg-red-900/20"><h4 className="font-bold">Build Failed</h4><pre className="whitespace-pre-wrap text-xs mt-2">{error}</pre></div>
    }

    return (
      <iframe
        ref={iframeRef}
        key={htmlContent} // Force re-mount on content change
        title="App Preview"
        className="w-full h-full border-0 bg-white"
        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
        srcDoc={htmlContent || ''}
      />
    );
  }

  if (device === 'iphone15') {
    return (
      <div className="flex-shrink-0 transform scale-[0.8] sm:scale-90 lg:scale-95 origin-center transition-transform duration-300">
        <div className="relative mx-auto border-black bg-black border-[10px] rounded-[2.5rem] h-[852px] w-[393px] shadow-2xl shadow-slate-900/40">
          <div className="w-[140px] h-[28px] bg-black top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute z-10"></div>
          <div className="h-[40px] w-[3px] bg-black absolute -left-[13px] top-[100px] rounded-l-lg"></div>
          <div className="h-[40px] w-[3px] bg-black absolute -left-[13px] top-[150px] rounded-l-lg"></div>
          <div className="h-[56px] w-[3px] bg-black absolute -right-[13px] top-[128px] rounded-r-lg"></div>
          <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white">
            {renderContent()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full h-full min-h-[400px] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900/70 shadow-xl shadow-slate-300/30 dark:shadow-black/30 overflow-hidden">
        <div className="flex-1 min-h-0">
            {renderContent()}
        </div>
    </div>
  );
};