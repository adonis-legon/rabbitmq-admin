import { useState, useEffect, useCallback, useRef } from 'react';
import { RabbitMQQueue, PagedResponse, PaginationRequest, ResourceError } from '../types/rabbitmq';
import { rabbitmqResourcesApi } from '../services/api/rabbitmqResourcesApi';
import { queuesCache } from '../utils/resourceCache';

interface UseQueuesState {
  data: PagedResponse<RabbitMQQueue> | null;
  loading: boolean;
  error: ResourceError | null;
  lastUpdated: Date | null;
}

interface UseQueuesActions {
  loadQueues: (clusterId: string, params?: PaginationRequest) => Promise<void>;
  refreshQueues: () => Promise<void>;
  clearError: () => void;
  invalidateCache: (clusterId: string) => void;
}

interface UseQueuesOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export const useQueues = (
  options: UseQueuesOptions = {}
): UseQueuesState & UseQueuesActions => {
  const { autoRefresh = false, refreshInterval = 30000 } = options;

  const [state, setState] = useState<UseQueuesState>({
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

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const setError = (error: ResourceError | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const setData = (data: PagedResponse<RabbitMQQueue> | null) => {
    setState(prev => ({ ...prev, data, lastUpdated: new Date() }));
  };

  const createResourceError = (err: any, type: ResourceError['type'] = 'api_error'): ResourceError => {
    const message = err.response?.data?.message || err.message || 'An unexpected error occurred';
    const details = err.response?.data?.details || err.response?.statusText;

    return {
      type,
      message,
      details,
      retryable: err.response?.status !== 403 && err.response?.status !== 404,
      timestamp: Date.now()
    };
  };

  const loadQueues = useCallback(async (
    clusterId: string,
    params: PaginationRequest = {}
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Store params for refresh functionality
      lastParamsRef.current = { clusterId, params };

      // Check cache first
      const cachedData = queuesCache.get(clusterId, 'queues', params);

      if (cachedData && typeof cachedData === 'object' && 'items' in cachedData && Array.isArray(cachedData.items)) {
        setData(cachedData as PagedResponse<RabbitMQQueue>);
        setLoading(false);
        return;
      }

      const response = await rabbitmqResourcesApi.getQueues(clusterId, params);

      // Cache the response
      queuesCache.set(clusterId, 'queues', response, params);
      setData(response);
    } catch (err: any) {
      console.error('Error loading queues:', err);

      let errorType: ResourceError['type'] = 'api_error';
      if (err.response?.status === 401) {
        errorType = 'authentication';
      } else if (err.response?.status === 403) {
        errorType = 'authorization';
      } else if (err.code === 'ECONNABORTED' || err.code === 'NETWORK_ERROR') {
        errorType = 'network';
      } else if (err.response?.status === 503 || err.response?.status === 502) {
        errorType = 'cluster_unavailable';
      }

      setError(createResourceError(err, errorType));
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshQueues = useCallback(async () => {
    const currentParams = lastParamsRef.current;
    if (currentParams) {
      // Invalidate cache before refresh
      queuesCache.invalidate(currentParams.clusterId, 'queues');
      await loadQueues(currentParams.clusterId, currentParams.params);
    }
  }, [loadQueues]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const invalidateCache = useCallback((clusterId: string) => {
    queuesCache.invalidate(clusterId, 'queues');
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
          queuesCache.invalidate(currentParams.clusterId, 'queues');

          const response = await rabbitmqResourcesApi.getQueues(currentParams.clusterId, currentParams.params);

          // Cache the response
          queuesCache.set(currentParams.clusterId, 'queues', response, currentParams.params);
          setData(response);
        } catch (err: any) {
          console.error('Auto-refresh error:', err);
          const resourceError: ResourceError = {
            message: err.response?.data?.message || 'Failed to refresh queues',
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
    loadQueues,
    refreshQueues,
    clearError,
    invalidateCache
  };
};