import { useState, useEffect, useCallback } from 'react';
import { VirtualHost } from '../types/rabbitmq';
import { rabbitmqResourcesApi } from '../services/api/rabbitmqResourcesApi';

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
            const vhosts = await rabbitmqResourcesApi.getVirtualHosts(targetClusterId);
            setVirtualHosts(vhosts);
        } catch (err: any) {
            console.error('Error loading virtual hosts:', err);
            const errorMessage = err.message || 'Failed to load virtual hosts. Please try again.';
            setError(errorMessage);
            setVirtualHosts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const refresh = useCallback(async () => {
        if (clusterId) {
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