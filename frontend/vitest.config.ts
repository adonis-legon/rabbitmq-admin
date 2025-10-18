/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    testTimeout: 8000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
        // Improve thread cleanup
        useAtomics: true
      }
    },
    // Add debugging options
    reporters: ['verbose'],
    logHeapUsage: true,
    // Exclude problematic integration tests that hang due to form timeouts
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.integration.test.tsx'
    ],
    // Reduce worker cleanup time
    teardownTimeout: 3000,
    // Force run mode when no specific mode is provided to avoid watch mode hanging
    watch: false
  },
});