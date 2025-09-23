import { useState, useCallback } from 'react';
import { RabbitMQBinding, ResourceError } from '../types/rabbitmq';
import { rabbitmqResourcesApi } from '../services/api/rabbitmqResourcesApi';

interface UseExchangeBindingsState {
  bindings: RabbitMQBinding[] | null;
  loading: boolean;
  error: ResourceError | null;
}

interface UseExchangeBindingsActions {
  loadBindings: (clusterId: string, vhost: string, exchangeName: string) => Promise<void>;
  clearError: () => void;
}

export const useExchangeBindings = (): UseExchangeBindingsState & UseExchangeBindingsActions => {
  const [state, setState] = useState<UseExchangeBindingsState>({
    bindings: null,
    loading: false,
    error: null
  });

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const setError = (error: ResourceError | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const setBindings = (bindings: RabbitMQBinding[] | null) => {
    setState(prev => ({ ...prev, bindings }));
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

  const loadBindings = useCallback(async (
    clusterId: string,
    vhost: string,
    exchangeName: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await rabbitmqResourcesApi.getExchangeBindings(clusterId, vhost, exchangeName);
      setBindings(response);
    } catch (err: any) {
      console.error('Error loading exchange bindings:', err);

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

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    ...state,
    loadBindings,
    clearError
  };
};