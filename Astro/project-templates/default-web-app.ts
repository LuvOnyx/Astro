import type { AppFile } from '../types';

export const defaultWebApp: AppFile[] = [
  {
    path: 'project.json',
    content: JSON.stringify({
      "name": "vite-react-ts-app",
      "main": "src/main.tsx",
      "target": "web"
    }, null, 2)
  },
  {
    path: 'package.json',
    content: JSON.stringify({
      "name": "vite-react-ts-app",
      "private": true,
      "version": "0.0.0",
      "type": "module",
      "scripts": {
        "dev": "vite",
        "build": "tsc && vite build",
        "preview": "vite preview"
      },
      "dependencies": {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-router-dom": "^6.30.1"
      },
      "devDependencies": {
        "@types/node": "^20.11.24",
        "@types/react": "^18.2.0",
        "@types/react-dom": "^18.2.0",
        "@vitejs/plugin-react": "^4.2.0",
        "autoprefixer": "^10.4.16",
        "postcss": "^8.4.32",
        "tailwindcss": "^3.4.1",
        "typescript": "^5.2.2",
        "vite": "^5.0.0"
      }
    }, null, 2)
  },
  {
    path: 'vite.config.ts',
    content: `import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom'],
  },
})`
  },
  {
    path: 'tsconfig.json',
    content: JSON.stringify({
      "compilerOptions": {
        "target": "ES2020",
        "useDefineForClassFields": true,
        "lib": ["ES2020", "DOM", "DOM.Iterable"],
        "module": "ESNext",
        "skipLibCheck": true,
        "moduleResolution": "bundler",
        "allowImportingTsExtensions": true,
        "resolveJsonModule": true,
        "isolatedModules": true,
        "noEmit": true,
        "jsx": "react-jsx",
        "strict": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noFallthroughCasesInSwitch": true,
        "baseUrl": ".",
        "paths": {
          "@/*": [
            "src/*"
          ]
        }
      },
      "include": ["src"],
      "references": [{ "path": "./tsconfig.node.json" }]
    }, null, 2)
  },
   {
    path: 'tsconfig.node.json',
    content: JSON.stringify({
      "compilerOptions": {
        "composite": true,
        "skipLibCheck": true,
        "module": "ESNext",
        "moduleResolution": "bundler",
        "allowSyntheticDefaultImports": true
      },
      "include": ["vite.config.ts", "postcss.config.js", "tailwind.config.js"]
    }, null, 2)
  },
  {
    path: 'tailwind.config.js',
    content: `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`
  },
  {
    path: 'postcss.config.js',
    content: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`
  },
  {
    path: 'index.html',
    content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React + TS</title>
  </head>
  <body class="dark">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
  },
  {
      path: '.gitignore',
      content: `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?`
  },
  {
      path: 'README.md',
      content: `# Vite + React + TypeScript App

This is a starter project created with AI App Builder.`
  },
  {
    path: 'src/main.tsx',
    content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.tsx';
import HomePage from './pages/HomePage.tsx';
import AboutPage from './pages/AboutPage.tsx';
import ErrorPage from './pages/ErrorPage.tsx';
import './index.css';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "about",
        element: <AboutPage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);`
  },
  {
    path: 'src/index.css',
    content: `@tailwind base;
@tailwind components;
@tailwind utilities;
`
  },
  {
    path: 'src/App.tsx',
    content: `import { NavLink, Outlet } from 'react-router-dom';

const App = () => {
  const linkClasses = "px-3 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors";
  const activeLinkClasses = "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans">
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800/80 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <NavLink to="/" className="font-bold text-xl text-slate-900 dark:text-slate-100">
                MyApp
              </NavLink>
            </div>
            <div className="flex items-center gap-2">
              <NavLink 
                to="/" 
                className={({ isActive }) => \`\${linkClasses} \${isActive ? activeLinkClasses : ''}\`}
              >
                Home
              </NavLink>
              <NavLink 
                to="/about" 
                className={({ isActive }) => \`\${linkClasses} \${isActive ? activeLinkClasses : ''}\`}
              >
                About
              </NavLink>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default App;
`
  },
  {
    path: 'src/pages/AboutPage.tsx',
    content: `const AboutPage = () => {
  return (
    <div className="bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-black/20 rounded-2xl p-8">
      <h1 className="text-4xl font-bold mb-4 text-slate-900 dark:text-slate-100">About Us</h1>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
        This is a simple React application demonstrating client-side routing with React Router.
        The routing is set up using the modern <code>createBrowserRouter</code> API, which provides
        powerful features like data loading, error handling, and more.
      </p>
    </div>
  );
};

export default AboutPage;`
  },
  {
    path: 'src/pages/ErrorPage.tsx',
    content: `import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  let errorMessage: string;
  let errorStatus: number | undefined;

  if (isRouteErrorResponse(error)) {
    errorMessage = error.data?.message || error.statusText;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    errorMessage = 'Unknown error';
  }

  return (
    <div id="error-page" className="flex flex-col gap-8 justify-center items-center h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <h1 className="text-4xl font-bold">Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p className="text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg">
        <i>{errorStatus && \`\${errorStatus} - \`}{errorMessage}</i>
      </p>
    </div>
  );
}`
  },
  {
    path: 'src/pages/HomePage.tsx',
    content: `const HomePage = () => {
  return (
    <div className="bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-black/20 rounded-2xl p-8">
      <h1 className="text-4xl font-bold mb-4 text-slate-900 dark:text-slate-100">Welcome to the Home Page</h1>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
        This is the main page of our application with client-side routing.
        You can navigate to the "About" page using the link in the navigation bar.
        The content here is rendered via an <code>&lt;Outlet /&gt;</code> in the main layout.
      </p>
    </div>
  );
};

export default HomePage;`
  },
  {
    path: 'src/vite-env.d.ts',
    content: '/// <reference types="vite/client" />'
  }
];