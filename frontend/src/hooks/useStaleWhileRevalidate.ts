import { useState, useEffect, useCallback, useRef } from 'react';
import { ResourceCache } from '../utils/resourceCache';

interface UseStaleWhileRevalidateOptions<T> {
    cache: ResourceCache<T>;
    clusterId: string;
    resourceType: string;
    params?: Record<string, any>;
    fetcher: () => Promise<T>;
    autoRefresh?: boolean;
    refreshInterval?: number; // in milliseconds
    staleTime?: number; // Time after which data is considered stale but still usable
}

interface UseStaleWhileRevalidateResult<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
    isStale: boolean;
    lastUpdated: Date | null;
    refresh: () => Promise<void>;
}

export function useStaleWhileRevalidate<T>(
    options: UseStaleWhileRevalidateOptions<T>
): UseStaleWhileRevalidateResult<T> {
    const {
        cache,
        clusterId,
        resourceType,
        params = {},
        fetcher,
        autoRefresh = false,
        refreshInterval = 30000,
        staleTime = 15000, // 15 seconds
    } = options;

    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [isStale, setIsStale] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetcherRef = useRef(fetcher);
    const paramsRef = useRef(params);
    const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const backgroundFetchRef = useRef<Promise<void> | null>(null);

    // Update refs when dependencies change
    useEffect(() => {
        fetcherRef.current = fetcher;
    }, [fetcher]);

    useEffect(() => {
        paramsRef.current = params;
    }, [params]);

    // Check if data is stale
    const checkStaleStatus = useCallback((timestamp: Date) => {
        const now = Date.now();
        const dataAge = now - timestamp.getTime();
        return dataAge > staleTime;
    }, [staleTime]);

    // Fetch data from cache or API
    const fetchData = useCallback(async (isBackground = false) => {
        try {
            if (!isBackground) {
                setLoading(true);
                setError(null);
            }

            // Try to get from cache first
            const cachedData = cache.get(clusterId, resourceType, paramsRef.current);

            if (cachedData && !isBackground) {
                setData(cachedData);
                setLastUpdated(new Date());
                setIsStale(false);
                setLoading(false);

                // If data exists but might be stale, trigger background refresh
                if (checkStaleStatus(new Date())) {
                    setIsStale(true);
                    // Trigger background fetch without affecting loading state
                    if (!backgroundFetchRef.current) {
                        backgroundFetchRef.current = fetchData(true);
                    }
                }
                return;
            }

            // Fetch fresh data
            const freshData = await fetcherRef.current();

            // Cache the fresh data
            cache.set(clusterId, resourceType, freshData, paramsRef.current);

            setData(freshData);
            setLastUpdated(new Date());
            setIsStale(false);
            setError(null);

            if (!isBackground) {
                setLoading(false);
            }

            // Clear background fetch reference
            if (isBackground) {
                backgroundFetchRef.current = null;
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            const errorObj = err instanceof Error ? err : new Error('Unknown error');

            if (!isBackground) {
                setError(errorObj);
                setLoading(false);
            }

            // If background fetch fails, clear the reference
            if (isBackground) {
                backgroundFetchRef.current = null;
            }
        }
    }, [cache, clusterId, resourceType, checkStaleStatus]);

    // Manual refresh function
    const refresh = useCallback(async () => {
        // Cancel any pending background fetch
        backgroundFetchRef.current = null;

        // Invalidate cache for this resource
        cache.invalidate(clusterId, resourceType);

        await fetchData(false);
    }, [fetchData, cache, clusterId, resourceType]);

    // Initial data fetch
    useEffect(() => {
        fetchData(false);
    }, [fetchData]);

    // Auto-refresh functionality
    useEffect(() => {
        if (!autoRefresh) {
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
                refreshTimeoutRef.current = null;
            }
            return;
        }

        const scheduleRefresh = () => {
            refreshTimeoutRef.current = setTimeout(() => {
                // Use background fetch for auto-refresh to avoid loading states
                if (!backgroundFetchRef.current) {
                    backgroundFetchRef.current = fetchData(true);
                }
                scheduleRefresh(); // Schedule next refresh
            }, refreshInterval);
        };

        scheduleRefresh();

        return () => {
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
                refreshTimeoutRef.current = null;
            }
        };
    }, [autoRefresh, refreshInterval, fetchData]);

    // Check stale status when lastUpdated changes
    useEffect(() => {
        if (!lastUpdated) return;

        const checkStale = () => {
            setIsStale(checkStaleStatus(lastUpdated));
        };

        // Check immediately
        checkStale();

        // Set up interval to check stale status
        const interval = setInterval(checkStale, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, [lastUpdated, checkStaleStatus]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
            }
            backgroundFetchRef.current = null;
        };
    }, []);

    return {
        data,
        loading,
        error,
        isStale,
        lastUpdated,
        refresh,
    };
}