/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/setupTests.ts'],
        testTimeout: 30000, // Longer timeout for integration tests
        hookTimeout: 10000, // Longer hook timeout for integration tests
        // Force exit after tests complete
        forceRerunTriggers: ['**/package.json/**', '**/vitest.config.*/**'],
        // Enable parallel execution but with fewer threads for stability
        pool: 'threads',
        poolOptions: {
            threads: {
                singleThread: false,
                maxThreads: 2, // Fewer threads for integration tests to avoid race conditions
                minThreads: 1,
            },
        },
        // Performance optimizations for integration tests
        isolate: true, // Enable isolation for proper test separation
        coverage: {
            enabled: false, // Disable coverage for integration tests
        },
        // Be more lenient with failures for integration tests
        bail: 10, // Allow more failures before stopping
        // Include only integration test files
        include: [
            'src/**/*.integration.test.tsx',
            'src/**/*.integration.test.ts'
        ],
        // Exclude standard excludes but not our test files
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/setupTests.ts'
        ],
    },
});