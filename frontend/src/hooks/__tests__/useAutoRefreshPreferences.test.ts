import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useAutoRefreshPreferences } from '../useAutoRefreshPreferences';

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

describe('useAutoRefreshPreferences', () => {
    const storageKey = 'test-autorefresh';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with default values when no localStorage data exists', () => {
        localStorageMock.getItem.mockReturnValue(null);

        const { result } = renderHook(() =>
            useAutoRefreshPreferences({
                storageKey,
                defaultInterval: 60,
                defaultEnabled: true,
            })
        );

        expect(result.current.autoRefresh).toBe(true);
        expect(result.current.refreshInterval).toBe(60);
    });

    it('should load preferences from localStorage when available', () => {
        const storedPreferences = JSON.stringify({
            enabled: true,
            interval: 30,
        });
        localStorageMock.getItem.mockReturnValue(storedPreferences);

        const { result } = renderHook(() =>
            useAutoRefreshPreferences({
                storageKey,
                defaultInterval: 30,
                defaultEnabled: false,
            })
        );

        expect(result.current.autoRefresh).toBe(true);
        expect(result.current.refreshInterval).toBe(30);
        expect(localStorageMock.getItem).toHaveBeenCalledWith(storageKey);
    });

    it('should convert 5 second interval to 10 seconds (minimum safe interval)', () => {
        const storedPreferences = JSON.stringify({
            enabled: true,
            interval: 5, // Previously allowed but now removed
        });
        localStorageMock.getItem.mockReturnValue(storedPreferences);

        const { result } = renderHook(() =>
            useAutoRefreshPreferences({
                storageKey,
                defaultInterval: 30,
                defaultEnabled: false,
            })
        );

        expect(result.current.autoRefresh).toBe(true);
        expect(result.current.refreshInterval).toBe(10); // Should be converted to 10
        expect(localStorageMock.getItem).toHaveBeenCalledWith(storageKey);
    });

    it('should save preferences to localStorage when values change', () => {
        localStorageMock.getItem.mockReturnValue(null);

        const { result } = renderHook(() =>
            useAutoRefreshPreferences({
                storageKey,
                defaultInterval: 30,
                defaultEnabled: false,
            })
        );

        act(() => {
            result.current.setAutoRefresh(true);
        });

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            storageKey,
            JSON.stringify({ enabled: true, interval: 30 })
        );

        act(() => {
            result.current.setRefreshInterval(10);
        });

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            storageKey,
            JSON.stringify({ enabled: true, interval: 10 })
        );
    });

    it('should handle localStorage errors gracefully', () => {
        // Mock localStorage.getItem to throw an error
        localStorageMock.getItem.mockImplementation(() => {
            throw new Error('localStorage not available');
        });

        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

        const { result } = renderHook(() =>
            useAutoRefreshPreferences({
                storageKey,
                defaultInterval: 15,
                defaultEnabled: true,
            })
        );

        // Should fall back to default values
        expect(result.current.autoRefresh).toBe(true);
        expect(result.current.refreshInterval).toBe(15);
        expect(consoleSpy).toHaveBeenCalledWith(
            'Failed to load auto-refresh preferences from localStorage:',
            expect.any(Error)
        );

        consoleSpy.mockRestore();
    });

    it('should handle invalid JSON in localStorage gracefully', () => {
        localStorageMock.getItem.mockReturnValue('invalid json');

        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

        const { result } = renderHook(() =>
            useAutoRefreshPreferences({
                storageKey,
                defaultInterval: 25,
                defaultEnabled: false,
            })
        );

        // Should fall back to default values
        expect(result.current.autoRefresh).toBe(false);
        expect(result.current.refreshInterval).toBe(25);
        expect(consoleSpy).toHaveBeenCalledWith(
            'Failed to load auto-refresh preferences from localStorage:',
            expect.any(Error)
        );

        consoleSpy.mockRestore();
    });
});