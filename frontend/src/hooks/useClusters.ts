import { useState, useEffect, useCallback } from 'react';
import { ClusterConnection, CreateClusterConnectionRequest, UpdateClusterConnectionRequest, ConnectionTestRequest, ConnectionTestResponse } from '../types/cluster';
import { clusterApi } from '../services/api/clusterApi';

interface UseClustersState {
  clusters: ClusterConnection[];
  loading: boolean;
  error: string | null;
}

interface UseClustersActions {
  loadClusters: () => Promise<void>;
  createCluster: (clusterData: CreateClusterConnectionRequest) => Promise<ClusterConnection>;
  updateCluster: (id: string, clusterData: UpdateClusterConnectionRequest) => Promise<ClusterConnection>;
  deleteCluster: (id: string) => Promise<void>;
  testConnection: (id: string, testData: ConnectionTestRequest) => Promise<ConnectionTestResponse>;
  testNewConnection: (testData: ConnectionTestRequest) => Promise<ConnectionTestResponse>;
  clearError: () => void;
}

export const useClusters = (): UseClustersState & UseClustersActions => {
  const [state, setState] = useState<UseClustersState>({
    clusters: [],
    loading: false,
    error: null
  });

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const setClusters = (clusters: ClusterConnection[] | ((prev: ClusterConnection[]) => ClusterConnection[])) => {
    setState(prev => ({
      ...prev,
      clusters: typeof clusters === 'function' ? clusters(prev.clusters) : clusters
    }));
  };

  const loadClusters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const clustersData = await clusterApi.getClusters();
      setClusters(clustersData);
    } catch (err: any) {
      console.error('Error loading clusters:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load cluster connections. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCluster = useCallback(async (clusterData: CreateClusterConnectionRequest): Promise<ClusterConnection> => {
    try {
      setError(null);
      const newCluster = await clusterApi.createCluster(clusterData);
      setClusters((prev: ClusterConnection[]) => [...prev, newCluster]);
      return newCluster;
    } catch (err: any) {
      console.error('Error creating cluster:', err);
      const errorMessage = err.response?.data?.message || 'Failed to create cluster connection. Please try again.';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateCluster = useCallback(async (id: string, clusterData: UpdateClusterConnectionRequest): Promise<ClusterConnection> => {
    try {
      setError(null);
      const updatedCluster = await clusterApi.updateCluster(id, clusterData);
      setClusters((prev: ClusterConnection[]) => prev.map((c: ClusterConnection) => c.id === id ? updatedCluster : c));
      return updatedCluster;
    } catch (err: any) {
      console.error('Error updating cluster:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update cluster connection. Please try again.';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteCluster = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await clusterApi.deleteCluster(id);
      setClusters((prev: ClusterConnection[]) => prev.filter((c: ClusterConnection) => c.id !== id));
    } catch (err: any) {
      console.error('Error deleting cluster:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete cluster connection. Please try again.';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const testConnection = useCallback(async (id: string, testData: ConnectionTestRequest): Promise<ConnectionTestResponse> => {
    try {
      setError(null);
      const result = await clusterApi.testConnection(id, testData);
      return result;
    } catch (err: any) {
      console.error('Error testing connection:', err);
      const errorMessage = err.response?.data?.message || 'Connection test failed. Please check your network connection and try again.';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const testNewConnection = useCallback(async (testData: ConnectionTestRequest): Promise<ConnectionTestResponse> => {
    try {
      setError(null);
      const result = await clusterApi.testNewConnection(testData);
      return result;
    } catch (err: any) {
      console.error('Error testing new connection:', err);
      const errorMessage = err.response?.data?.message || 'Connection test failed. Please check your connection details and try again.';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load clusters on mount
  useEffect(() => {
    loadClusters();
  }, [loadClusters]);

  return {
    ...state,
    loadClusters,
    createCluster,
    updateCluster,
    deleteCluster,
    testConnection,
    testNewConnection,
    clearError
  };
};