// FIX: (L9) Add a triple-slash directive to ensure Node.js types are loaded for this file, fixing the type error for `process.cwd()`.
/// <reference types="node" />

import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const env = loadEnv(mode, process.cwd(), '');

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      },
      plugins: [react()],
      define: {
        // Expose the API key to the client-side code from the .env file
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          // Point the '@' alias to the project root
          '@': path.resolve('./'),
        },
        dedupe: ['react', 'react-dom'],
      }
    };
});