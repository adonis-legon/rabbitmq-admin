/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    // Force exit after tests complete
    forceRerunTriggers: ['**/package.json/**', '**/vitest.config.*/**'],
    // Ensure tests don't hang
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});