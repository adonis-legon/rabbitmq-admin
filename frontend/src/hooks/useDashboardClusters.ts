import { useState, useEffect, useCallback } from 'react';
import { ClusterConnection } from '../types/cluster';
import { clusterApi } from '../services/api/clusterApi';
import { useAuth } from '../hooks';
import { UserRole } from '../types/auth';

interface UseDashboardClustersState {
  clusters: ClusterConnection[];
  selectedCluster: ClusterConnection | null;
  loading: boolean;
  error: string | null;
}

interface UseDashboardClustersActions {
  selectCluster: (cluster: ClusterConnection) => void;
  refreshClusters: () => Promise<void>;
  clearError: () => void;
}

export const useDashboardClusters = (): UseDashboardClustersState & UseDashboardClustersActions => {
  const { user } = useAuth();
  const [state, setState] = useState<UseDashboardClustersState>({
    clusters: [],
    selectedCluster: null,
    loading: false,
    error: null
  });

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const setClusters = (clusters: ClusterConnection[]) => {
    setState(prev => ({ ...prev, clusters }));
  };

  const setSelectedCluster = (selectedCluster: ClusterConnection | null) => {
    setState(prev => ({ ...prev, selectedCluster }));
  };

  const refreshClusters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use role-appropriate endpoint
      let clustersData: ClusterConnection[];
      if (user?.role === UserRole.ADMINISTRATOR) {
        clustersData = await clusterApi.getClusters();
      } else {
        clustersData = await clusterApi.getMyActiveClusters();
      }

      setClusters(clustersData);

      // If no cluster is selected and there are clusters, select the first active one
      if (!state.selectedCluster && clustersData.length > 0) {
        const firstActiveCluster = clustersData.find(c => c.active) || clustersData[0];
        setSelectedCluster(firstActiveCluster);
      }
    } catch (err: any) {
      console.error('Error loading clusters:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load cluster connections. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [state.selectedCluster, user?.role]);

  const selectCluster = useCallback((cluster: ClusterConnection) => {
    setSelectedCluster(cluster);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load clusters on mount
  useEffect(() => {
    refreshClusters();
  }, []);

  return {
    ...state,
    selectCluster,
    refreshClusters,
    clearError
  };
};