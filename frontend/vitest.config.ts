/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    testTimeout: 8000, // Reduced timeout for faster failure detection
    hookTimeout: 5000, // Reduced hook timeout
    // Force exit after tests complete
    forceRerunTriggers: ['**/package.json/**', '**/vitest.config.*/**'],
    // Enable parallel execution for better CI performance
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false, // Enable parallel execution
        maxThreads: 4, // Limit threads for CI environment
        minThreads: 2,
      },
    },
    // Performance optimizations
    isolate: false, // Disable isolation for faster execution
    coverage: {
      enabled: false, // Disable coverage in CI for speed
    },
    // Bail early on failures to save time
    bail: 5, // Stop after 5 failures
  },
});