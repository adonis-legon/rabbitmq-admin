import { useState, useEffect, useCallback, useRef } from 'react';
import { RabbitMQConnection, PagedResponse, PaginationRequest, ResourceError } from '../types/rabbitmq';
import { rabbitmqResourcesApi } from '../services/api/rabbitmqResourcesApi';
import { useResourceOperation } from './useResourceErrorHandler';
import { connectionsCache } from '../utils/resourceCache';

interface UseConnectionsState {
  data: PagedResponse<RabbitMQConnection> | null;
  loading: boolean;
  error: ResourceError | null;
  lastUpdated: Date | null;
}

interface UseConnectionsActions {
  loadConnections: (clusterId: string, params?: PaginationRequest) => Promise<void>;
  refreshConnections: () => Promise<void>;
  clearError: () => void;
  invalidateCache: (clusterId: string) => void;
}

interface UseConnectionsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export const useConnections = (
  options: UseConnectionsOptions = {}
): UseConnectionsState & UseConnectionsActions => {
  const { autoRefresh = false, refreshInterval = 30000 } = options;

  const [state, setState] = useState<UseConnectionsState>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  // Use ref to store latest params for auto-refresh to avoid dependency issues
  const lastParamsRef = useRef<{
    clusterId: string;
    params?: PaginationRequest;
  } | null>(null);

  // Use enhanced error handling
  const { clearResourceErrors } = useResourceOperation('connections', undefined);

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const setError = (error: ResourceError | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const setData = (data: PagedResponse<RabbitMQConnection> | null) => {
    setState(prev => ({ ...prev, data, lastUpdated: new Date() }));
  };

  const loadConnections = useCallback(async (
    clusterId: string,
    params: PaginationRequest = {}
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Store params for refresh functionality
      lastParamsRef.current = { clusterId, params };

      // Check cache first
      const cachedData = connectionsCache.get(clusterId, 'connections', params);

      if (cachedData && typeof cachedData === 'object' && 'items' in cachedData && Array.isArray(cachedData.items)) {
        setData(cachedData as PagedResponse<RabbitMQConnection>);
        setLoading(false);
        return;
      }

      const response = await rabbitmqResourcesApi.getConnections(clusterId, params);

      // Cache the response
      connectionsCache.set(clusterId, 'connections', response, params);
      setData(response);
    } catch (err: any) {
      console.error('Error loading connections:', err);
      const resourceError: ResourceError = {
        message: err.response?.data?.message || 'Failed to load connections',
        type: 'network',
        retryable: true,
        timestamp: Date.now(),
        details: err.message
      };
      setError(resourceError);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshConnections = useCallback(async () => {
    const currentParams = lastParamsRef.current;
    if (currentParams) {
      // Invalidate cache before refresh
      connectionsCache.invalidate(currentParams.clusterId, 'connections');
      await loadConnections(currentParams.clusterId, currentParams.params);
    }
  }, [loadConnections]);

  const clearError = useCallback(() => {
    setError(null);
    clearResourceErrors();
  }, [clearResourceErrors]);

  const invalidateCache = useCallback((clusterId: string) => {
    connectionsCache.invalidate(clusterId, 'connections');
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const interval = setInterval(async () => {
      const currentParams = lastParamsRef.current;
      if (currentParams) {
        try {
          // Invalidate cache before refresh
          connectionsCache.invalidate(currentParams.clusterId, 'connections');

          const response = await rabbitmqResourcesApi.getConnections(currentParams.clusterId, currentParams.params);

          // Cache the response
          connectionsCache.set(currentParams.clusterId, 'connections', response, currentParams.params);
          setData(response);
        } catch (err: any) {
          console.error('Auto-refresh error:', err);
          const resourceError: ResourceError = {
            message: err.response?.data?.message || 'Failed to refresh connections',
            type: 'network',
            retryable: true,
            timestamp: Date.now(),
            details: err.message
          };
          setError(resourceError);
        }
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  return {
    ...state,
    loadConnections,
    refreshConnections,
    clearError,
    invalidateCache
  };
};