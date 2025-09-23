import { useState, useCallback, useEffect } from 'react';

interface UseDetailRefreshOptions {
    autoRefresh?: boolean;
    refreshInterval?: number; // in milliseconds
    onRefresh: () => Promise<void>;
}

interface UseDetailRefreshState {
    refreshing: boolean;
    lastUpdated: Date | null;
    autoRefresh: boolean;
    refreshInterval: number;
}

interface UseDetailRefreshActions {
    handleRefresh: () => Promise<void>;
    setAutoRefresh: (enabled: boolean) => void;
    setRefreshInterval: (interval: number) => void;
}

export const useDetailRefresh = (
    options: UseDetailRefreshOptions
): UseDetailRefreshState & UseDetailRefreshActions => {
    const { onRefresh, autoRefresh: initialAutoRefresh = false, refreshInterval: initialRefreshInterval = 30000 } = options;

    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(initialAutoRefresh);
    const [refreshInterval, setRefreshInterval] = useState(initialRefreshInterval);

    const handleRefresh = useCallback(async () => {
        if (refreshing) return;

        try {
            setRefreshing(true);
            await onRefresh();
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error during refresh:', error);
        } finally {
            setRefreshing(false);
        }
    }, [onRefresh, refreshing]);

    // Auto-refresh functionality
    useEffect(() => {
        if (!autoRefresh) {
            return;
        }

        const interval = setInterval(() => {
            handleRefresh();
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, handleRefresh]);

    return {
        refreshing,
        lastUpdated,
        autoRefresh,
        refreshInterval: refreshInterval / 1000, // Convert to seconds for UI
        handleRefresh,
        setAutoRefresh,
        setRefreshInterval: (interval: number) => setRefreshInterval(interval * 1000), // Convert from seconds
    };
};