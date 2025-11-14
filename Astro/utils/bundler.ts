import esbuild, { type Plugin, type PluginBuild, type BuildFailure, type Loader } from 'esbuild-wasm';
import type { AppFile } from '../types';

let initializePromise: Promise<void> | null = null;

/**
 * Initializes the esbuild-wasm service.
 * This must be called once before any bundling can occur.
 */
export const initializeBundler = (): Promise<void> => {
  if (initializePromise) {
    return initializePromise;
  }
  initializePromise = esbuild.initialize({
    wasmURL: 'https://unpkg.com/esbuild-wasm@0.23.0/esbuild.wasm',
    worker: true,
  }).catch((error) => {
    console.error("Failed to initialize esbuild:", error);
    initializePromise = null; // Allow retry on failure
    throw error;
  });
  return initializePromise;
};

/**
 * An esbuild plugin to resolve and load files from the in-memory virtual file system.
 * It prioritizes local files and falls back to other resolvers for external packages.
 */
const virtualFilePlugin = (files: AppFile[]): Plugin => {
    const fileMap = new Map(files.map(file => [file.path, file.content]));
    const extensionFallbacks = ['.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.jsx', '/index.ts', '/index.tsx', '.json'];

    return {
        name: 'virtual-file-plugin',
        setup(build: PluginBuild) {
            // Intercept all paths to first check against the virtual file system.
            build.onResolve({ filter: /.*/ }, (args) => {
                const potentialPaths: string[] = [];

                // Handle path alias '@/' first
                if (args.path.startsWith('@/')) {
                    potentialPaths.push(args.path.replace('@/', 'src/'));
                }
                // Case 1: Relative import (e.g., './Button' from another virtual file)
                else if (args.path.startsWith('.')) {
                    const basePath = args.importer.substring(0, args.importer.lastIndexOf('/'));
                    potentialPaths.push(new URL(args.path, `file:///${basePath}/`).pathname.substring(1));
                } 
                // Case 2: Absolute-like import (e.g., 'App.tsx' or 'components/Button') and bare imports
                else {
                    potentialPaths.push(args.path);
                    potentialPaths.push(`src/${args.path}`); // Also check inside /src
                }

                // Check all potential paths against the file map, with extension fallbacks.
                for (const path of potentialPaths) {
                    if (fileMap.has(path)) {
                        return { path, namespace: 'virtual' };
                    }
                    for (const ext of extensionFallbacks) {
                        if (fileMap.has(path + ext)) {
                            return { path: path + ext, namespace: 'virtual' };
                        }
                    }
                }

                // If we haven't found a virtual file, return undefined to let other resolvers try.
                return undefined;
            });

            // Load virtual files when esbuild requests them under the 'virtual' namespace.
            build.onLoad({ filter: /.*/, namespace: 'virtual' }, async (args) => {
                const content = fileMap.get(args.path);
                if (content === undefined) {
                    return { errors: [{ text: `File not found in virtual file system: ${args.path}` }] };
                }

                const extension = args.path.split('.').pop()?.toLowerCase();
                
                // For CSS files, transform the import into JS that injects a <style> tag.
                if (extension === 'css') {
                    // If it's a Tailwind entry file, let the CDN handle it by returning an empty module.
                    if (content.includes('@tailwind')) {
                        return {
                            contents: '/* Tailwind CSS entry file handled by CDN */',
                            loader: 'js',
                            resolveDir: args.path.substring(0, args.path.lastIndexOf('/')),
                        };
                    }

                    // For regular CSS files, inject them as a <style> tag.
                    const escaped = content
                        .replace(/\\/g, '\\\\')
                        .replace(/\n/g, '\\n')
                        .replace(/"/g, '\\"');

                    const styleId = `injected-css-${args.path.replace(/[^a-zA-Z0-9]/g, '-')}`;
                    const jsContent = `
                        try {
                            if (!document.getElementById('${styleId}')) {
                                const style = document.createElement('style');
                                style.id = '${styleId}';
                                style.innerText = "${escaped}";
                                document.head.appendChild(style);
                            }
                        } catch (e) {
                            console.error('Failed to inject CSS for ${args.path}', e);
                        }
                    `;
                    return {
                        contents: jsContent,
                        loader: 'js',
                        resolveDir: args.path.substring(0, args.path.lastIndexOf('/')),
                    };
                }

                let loader: Loader = 'js';
                 switch (extension) {
                    case 'ts': case 'tsx': loader = 'tsx'; break;
                    case 'js': case 'jsx': loader = 'jsx'; break;
                    case 'json': loader = 'json'; break;
                }

                return {
                    contents: content,
                    loader,
                    resolveDir: args.path.substring(0, args.path.lastIndexOf('/')),
                };
            });
        }
    };
};

/**
 * An esbuild plugin to resolve package imports from esm.sh, ensuring React is deduplicated.
 */
const esmResolverPlugin = (reactVersion: string, reactRouterVersion: string): Plugin => {
    return {
        name: 'esm-resolver-plugin',
        setup(build: PluginBuild) {
            // Handle jsx-runtime imports specifically, which are auto-injected by esbuild
            build.onResolve({ filter: /^react\/jsx-runtime$/ }, () => ({
                path: `https://esm.sh/react@${reactVersion}/jsx-runtime`,
                namespace: 'esm'
            }));
            
            build.onResolve({ filter: /^react\/jsx-dev-runtime$/ }, () => ({
                path: `https://esm.sh/react@${reactVersion}/jsx-dev-runtime`,
                namespace: 'esm'
            }));

            // Rule for react-router-dom to pin its version and its React dependency.
            // This is the critical fix for the 'useRouteError' bug.
            build.onResolve({ filter: /^react-router-dom(\/.*)?$/ }, (args) => {
                const path = args.path.replace('react-router-dom', `react-router-dom@${reactRouterVersion}`);
                return { path: `https://esm.sh/${path}?deps=react@${reactVersion}`, namespace: 'esm' };
            });

            // Intercept other bare imports (e.g. "react") that weren't resolved locally
            build.onResolve({ filter: /^[^./]/ }, (args) => {
                // Pin react and react-dom to specific versions to avoid duplicates
                if (args.path === 'react') {
                    return { path: `https://esm.sh/react@${reactVersion}`, namespace: 'esm' };
                }
                if (args.path.startsWith('react-dom')) {
                     // Handles 'react-dom' and 'react-dom/client'
                    const path = args.path.replace('react-dom', `react-dom@${reactVersion}`);
                    return { path: `https://esm.sh/${path}`, namespace: 'esm' };
                }
                
                // For any other package, tell esm.sh to use our pinned version of react.
                // This is the key to preventing duplicate React instances.
                return { path: `https://esm.sh/${args.path}?deps=react@${reactVersion}`, namespace: 'esm' };
            });

            // Intercept relative imports within esm.sh modules (e.g. "./utils")
            build.onResolve({ filter: /^\./, namespace: 'esm' }, (args) => {
                return { path: new URL(args.path, args.importer).href, namespace: 'esm' };
            });
            
            // Intercept absolute paths within esm.sh modules (e.g. "/react@19...")
            build.onResolve({ filter: /^\//, namespace: 'esm' }, (args) => {
                return { path: new URL(args.path, 'https://esm.sh').href, namespace: 'esm' };
            });
        }
    };
};

/**
 * An esbuild plugin to load packages from esm.sh
 */
const esmLoaderPlugin = (): Plugin => {
    return {
        name: 'esm-loader-plugin',
        setup(build: PluginBuild) {
            build.onLoad({ filter: /.*/, namespace: 'esm' }, async (args) => {
                try {
                    // Set an 8-second timeout for network requests
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 8000);

                    const res = await fetch(args.path, { signal: controller.signal });
                    clearTimeout(timeoutId);

                    if (!res.ok) {
                        return { errors: [{ text: `Failed to load from esm.sh: HTTP error! status: ${res.status}` }] };
                    }
                    
                    const contents = await res.text();
                    const resolveDir = new URL('.', res.url).href;
                    return { contents, loader: 'jsx', resolveDir };
                } catch (error) {
                    if ((error as Error).name === 'AbortError') {
                        return { errors: [{ text: `Failed to load package from ${args.path}: The request timed out. The CDN might be slow or the package is too large.` }] };
                    }
                    return { errors: [{ text: `Failed to load from esm.sh: ${(error as Error).message}` }] };
                }
            });
        }
    };
};


/**
 * Bundles the provided files using esbuild-wasm.
 * @param files - An array of file objects with path and content.
 * @param initialRoute - The starting route for multi-page apps using MemoryRouter.
 * @returns An object with the bundled code or an error message.
 */
export const bundle = async (files: AppFile[], initialRoute: string = '/'): Promise<{ code: string | null; error: string | null }> => {
  try {
    await initializeBundler();
  } catch (err) {
    return { code: null, error: 'Bundler service is not available. It might have failed to initialize.' };
  }

  try {
    let entryPointFile: AppFile | undefined;
    const projectConfigFile = files.find(f => f.path === 'project.json');

    if (projectConfigFile) {
        try {
            const projectConfig = JSON.parse(projectConfigFile.content);
            if (typeof projectConfig.main === 'string') {
                entryPointFile = files.find(f => f.path === projectConfig.main);
            }
        } catch (e) {
            console.warn('Could not parse project.json:', e);
        }
    }

    // Fallback if entry point not found via project.json
    if (!entryPointFile) {
        entryPointFile = files.find(f => ['src/main.tsx', 'src/main.jsx', 'src/index.js', 'src/index.jsx', 'src/index.tsx'].includes(f.path));
    }

    if (!entryPointFile) {
      return { code: null, error: "Could not find an entry point file. Please ensure 'project.json' has a valid 'main' property, or that a standard entry file (e.g., src/index.tsx) exists." };
    }

    const packageJsonFile = files.find(f => f.path === 'package.json');
    let isReactRouterProject = false;
    let reactVersion = '18.2.0'; // A safe default if parsing fails or package.json doesn't exist.
    let reactRouterVersion = '6.30.1'; // A safe default

    if (packageJsonFile) {
        try {
            const pkg = JSON.parse(packageJsonFile.content);
            if (pkg.dependencies?.['react-router-dom']) {
                isReactRouterProject = true;
                reactRouterVersion = pkg.dependencies['react-router-dom'];
            }
             if (pkg.dependencies?.['react']) {
                reactVersion = pkg.dependencies['react'];
            }
        } catch (e) { 
            console.warn("Could not parse package.json to determine dependency versions:", e);
        }
    }
    
    // Create a mutable copy of files to potentially modify the entry point
    const processedFiles = files.map(f => ({...f}));

    if (isReactRouterProject) {
        const usesBrowserRouter = files.some(f => 
            (f.path.endsWith('.tsx') || f.path.endsWith('.jsx')) &&
            f.content.includes('<BrowserRouter>')
        );
        
        if (usesBrowserRouter) {
            return {
                code: null,
                error: `Build failed: Detected the use of the <BrowserRouter> component. This component is not compatible with the preview environment and is strictly forbidden.
                
To fix this, you MUST refactor the routing setup in 'src/main.tsx' to use the 'createBrowserRouter' and 'RouterProvider' APIs from react-router-dom.
                
Refer to the system instructions for the required implementation pattern, including the mandatory 'errorElement' property.`
            };
        }

        const routerSetupFile = files.find(f => f.content.includes('createBrowserRouter'));
        if (routerSetupFile) {
            // STAGE 1 VALIDATION: Check for the forbidden pattern of using a variable for the routes array.
            const usesRouteVariableRegex = /createBrowserRouter\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/;
            if (usesRouteVariableRegex.test(routerSetupFile.content)) {
                return {
                    code: null,
                    error: `Build failed: The routes for 'createBrowserRouter' must be defined as an array literal directly inside the function call. Using a variable for the routes is forbidden by the preview environment's validation.

To fix this, move the array definition directly into the createBrowserRouter call.

Correct Example:
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
  },
]);

Incorrect Example (This is what you did):
const myRoutes = [{...}];
const router = createBrowserRouter(myRoutes); // <--- THIS IS FORBIDDEN`
                };
            }
            
            // STAGE 2 VALIDATION: If Stage 1 passes, it must be an inline array. Now check for the errorElement.
            // This regex uses positive lookaheads to confirm the root route object has both path:"/" and errorElement:, regardless of their order.
            const rootRouteWithErrorHandlerRegex = /createBrowserRouter\s*\(\s*\[\s*\{\s*(?=[^}]*?path:\s*["']\/["'])(?=[^}]*?errorElement:)[^}]*?\}/s;
            if (!rootRouteWithErrorHandlerRegex.test(routerSetupFile.content)) {
                return {
                    code: null,
                    error: `Build failed: The root route (path: "/") in your 'createBrowserRouter' setup is missing the mandatory 'errorElement' property. This is a critical requirement for error handling in the preview environment.

To fix this, ensure you import your ErrorPage component and add the 'errorElement' key to the root route object.

Correct Example:
import ErrorPage from './pages/ErrorPage';
// ...
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />, // <-- THIS PROPERTY IS REQUIRED
    children: [...]
  },
  // ... other routes
]);`
                };
            }
        }
        
        let routerFileModified = false;

        // Try to patch modern data router (createBrowserRouter)
        for (const file of processedFiles) {
            if ((file.path.endsWith('.tsx') || file.path.endsWith('.jsx')) && file.content.includes('createBrowserRouter')) {
                let content = file.content;
                
                // 1. Replace the import name
                content = content.replace(/createBrowserRouter/g, 'createMemoryRouter');

                // 2. Find the router creation call and inject MemoryRouter options.
                // This regex handles both inline arrays `[...]` and variable names `routes`.
                const routerCallRegex = /(createMemoryRouter\s*\()((?:\[[\s\S]*?\]|[\w.]+))(\s*\))/;
                const replacement = `$1$2, { initialEntries: ['${initialRoute}'] }$3`;
                
                if (routerCallRegex.test(content)) {
                    content = content.replace(routerCallRegex, replacement);
                    file.content = content;
                    routerFileModified = true;
                    break;
                }
            }
        }

        if (!routerFileModified) {
            console.warn("Could not find a 'createBrowserRouter' call to replace for preview. Multi-page navigation may not work correctly.");
        }
    }

    // Get Supabase credentials from localStorage to inject into the build
    const supabaseUrl = localStorage.getItem('supabase_url') || '';
    const supabaseAnonKey = localStorage.getItem('supabase_anon_key') || '';


    const buildResult = await esbuild.build({
      entryPoints: [entryPointFile.path],
      bundle: true,
      write: false,
      plugins: [
        {
          name: 'entry',
          setup(build) {
            // Marks the initial entry file to be handled by our virtual file plugin.
            build.onResolve({ filter: new RegExp(`^${entryPointFile.path}$`) }, args => ({
              path: args.path,
              namespace: 'virtual'
            }));
          }
        },
        virtualFilePlugin(processedFiles), // Tries to resolve local/virtual files first.
        esmResolverPlugin(reactVersion, reactRouterVersion), // Fallback for external packages, now with correct versions.
        esmLoaderPlugin(),
      ],
      jsx: 'automatic',
      jsxImportSource: 'react',
      define: {
        'process.env.NODE_ENV': '"production"',
        global: 'window',
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
      },
    });

    return { code: buildResult.outputFiles[0].text, error: null };
  } catch (err) {
    if (err && (err as any).errors) {
        const esbuildError = err as BuildFailure;
        const errorMessages = esbuildError.errors.map(e => {
            const location = e.location;
            if (location) {
                return `> ${location.file}:${location.line}:${location.column}: ${e.text}`;
            }
            return `> ${e.text}`;
        }).join('\n');
        return { code: null, error: `Build failed:\n${errorMessages}` };
    }
    const error = err as Error;
    return { code: null, error: error.message };
  }
};