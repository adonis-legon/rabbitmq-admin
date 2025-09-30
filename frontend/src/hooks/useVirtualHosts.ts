import { useState, useEffect, useCallback } from 'react';
import { VirtualHost } from '../types/rabbitmq';
import { rabbitmqResourcesApi } from '../services/api/rabbitmqResourcesApi';

// Global cache and request deduplication
const virtualHostsCache = new Map<string, {
    data: VirtualHost[];
    timestamp: number;
    error: string | null;
}>();

const ongoingRequests = new Map<string, Promise<VirtualHost[]>>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface UseVirtualHostsState {
    virtualHosts: VirtualHost[];
    loading: boolean;
    error: string | null;
}

interface UseVirtualHostsActions {
    loadVirtualHosts: (clusterId: string) => Promise<void>;
    clearError: () => void;
    refresh: () => Promise<void>;
}

export const useVirtualHosts = (clusterId?: string): UseVirtualHostsState & UseVirtualHostsActions => {
    const [state, setState] = useState<UseVirtualHostsState>({
        virtualHosts: [],
        loading: false,
        error: null
    });

    const setLoading = (loading: boolean) => {
        setState(prev => ({ ...prev, loading }));
    };

    const setError = (error: string | null) => {
        setState(prev => ({ ...prev, error }));
    };

    const setVirtualHosts = (virtualHosts: VirtualHost[]) => {
        setState(prev => ({ ...prev, virtualHosts }));
    };

    const loadVirtualHosts = useCallback(async (targetClusterId: string) => {
        try {
            setLoading(true);
            setError(null);

            // Check cache first
            const cached = virtualHostsCache.get(targetClusterId);
            if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
                if (cached.error) {
                    setError(cached.error);
                    setVirtualHosts([]);
                } else {
                    setVirtualHosts(cached.data);
                }
                setLoading(false);
                return;
            }

            // Check if there's already an ongoing request for this cluster
            let requestPromise = ongoingRequests.get(targetClusterId);

            if (!requestPromise) {
                // Create new request
                requestPromise = rabbitmqResourcesApi.getVirtualHosts(targetClusterId);
                ongoingRequests.set(targetClusterId, requestPromise);
            }

            const vhosts = await requestPromise;

            // Cache the successful result
            virtualHostsCache.set(targetClusterId, {
                data: vhosts,
                timestamp: Date.now(),
                error: null
            });

            setVirtualHosts(vhosts);
        } catch (err: any) {
            console.error('Error loading virtual hosts:', err);
            const errorMessage = err.message || 'Failed to load virtual hosts. Please try again.';

            // Cache the error
            virtualHostsCache.set(targetClusterId, {
                data: [],
                timestamp: Date.now(),
                error: errorMessage
            });

            setError(errorMessage);
            setVirtualHosts([]);
        } finally {
            // Clean up the ongoing request
            ongoingRequests.delete(targetClusterId);
            setLoading(false);
        }
    }, []);

    const refresh = useCallback(async () => {
        if (clusterId) {
            // Clear cache to force fresh data
            virtualHostsCache.delete(clusterId);
            await loadVirtualHosts(clusterId);
        }
    }, [clusterId, loadVirtualHosts]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Load virtual hosts when clusterId changes
    useEffect(() => {
        if (clusterId) {
            loadVirtualHosts(clusterId);
        } else {
            // Clear data when no cluster is selected
            setVirtualHosts([]);
            setError(null);
        }
    }, [clusterId, loadVirtualHosts]);

    return {
        ...state,
        loadVirtualHosts,
        clearError,
        refresh
    };
};