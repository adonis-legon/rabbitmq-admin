// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Ensure vitest globals are available
/// <reference types="vitest/globals" />

import { afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Setup global mocks
beforeAll(() => {
    // Mock clipboard API globally with configurable property
    if (!navigator.clipboard) {
        Object.defineProperty(navigator, 'clipboard', {
            value: {
                writeText: vi.fn(() => Promise.resolve()),
            },
            writable: true,
            configurable: true,
        });
    }

    // Mock window.location.href setter for navigation errors
    Object.defineProperty(window, 'location', {
        value: {
            ...window.location,
            href: '',
        },
        writable: true,
        configurable: true,
    });
});

// Clean up after each test
afterEach(() => {
    cleanup();
    // Clear all mocks after each test to prevent cross-test pollution
    vi.clearAllMocks();
});