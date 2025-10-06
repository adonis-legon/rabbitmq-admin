/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/setupTests.ts'],
        testTimeout: 5000, // Very short timeout for CI
        hookTimeout: 3000, // Very short hook timeout
        // Force exit after tests complete
        forceRerunTriggers: ['**/package.json/**', '**/vitest.config.*/**'],
        // Maximum parallel execution for CI
        pool: 'threads',
        poolOptions: {
            threads: {
                singleThread: false,
                maxThreads: 6, // More threads for CI
                minThreads: 2,
            },
        },
        // Aggressive performance optimizations for CI
        isolate: false, // Disable isolation for speed
        coverage: {
            enabled: false, // Never run coverage in CI
        },
        // Fail fast to save CI time
        bail: 3, // Stop after just 3 failures
        // Reduce output verbosity
        reporters: ['basic'],
        // Skip slow tests in CI
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/*.integration.test.tsx', // Exclude all integration tests by default
            '**/setupTests.ts'
        ],
    },
});