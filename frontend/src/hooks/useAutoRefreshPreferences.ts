import { useState, useEffect, useCallback } from 'react';

interface AutoRefreshPreferences {
    enabled: boolean;
    interval: number; // in seconds
}

interface UseAutoRefreshPreferencesOptions {
    storageKey: string;
    defaultInterval?: number;
    defaultEnabled?: boolean;
}

interface UseAutoRefreshPreferencesReturn {
    autoRefresh: boolean;
    refreshInterval: number;
    setAutoRefresh: (enabled: boolean) => void;
    setRefreshInterval: (interval: number) => void;
}

/**
 * Custom hook for managing auto-refresh preferences with localStorage persistence
 * @param options Configuration options
 * @returns Auto-refresh state and setters
 */
export const useAutoRefreshPreferences = ({
    storageKey,
    defaultInterval = 30,
    defaultEnabled = false,
}: UseAutoRefreshPreferencesOptions): UseAutoRefreshPreferencesReturn => {
    const [preferences, setPreferences] = useState<AutoRefreshPreferences>(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const parsed = JSON.parse(stored) as AutoRefreshPreferences;
                // Validate interval - if it's 5 seconds (removed option), default to 10 seconds
                const validatedInterval = parsed.interval === 5 ? 10 : (parsed.interval ?? defaultInterval);
                return {
                    enabled: parsed.enabled ?? defaultEnabled,
                    interval: validatedInterval,
                };
            }
        } catch (error) {
            console.warn('Failed to load auto-refresh preferences from localStorage:', error);
        }

        return {
            enabled: defaultEnabled,
            interval: defaultInterval,
        };
    });

    // Save preferences to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(preferences));
        } catch (error) {
            console.warn('Failed to save auto-refresh preferences to localStorage:', error);
        }
    }, [storageKey, preferences]);

    const setAutoRefresh = useCallback((enabled: boolean) => {
        setPreferences(prev => ({
            ...prev,
            enabled,
        }));
    }, []);

    const setRefreshInterval = useCallback((interval: number) => {
        // Validate interval - prevent setting 5 seconds or other invalid values
        const validatedInterval = interval === 5 ? 10 : interval;
        setPreferences(prev => ({
            ...prev,
            interval: validatedInterval,
        }));
    }, []);

    return {
        autoRefresh: preferences.enabled,
        refreshInterval: preferences.interval,
        setAutoRefresh,
        setRefreshInterval,
    };
};

export default useAutoRefreshPreferences;