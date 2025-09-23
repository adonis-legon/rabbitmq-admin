import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { ClusterConnection } from "../types/cluster";
import { clusterApi } from "../services/api/clusterApi";
import { useAuth } from "../components/auth/AuthProvider";
import { UserRole } from "../types/auth";

interface ClusterContextState {
  clusters: ClusterConnection[];
  selectedCluster: ClusterConnection | null;
  loading: boolean;
  error: string | null;
}

interface ClusterContextActions {
  selectCluster: (cluster: ClusterConnection) => void;
  refreshClusters: () => Promise<void>;
  clearError: () => void;
}

type ClusterContextType = ClusterContextState & ClusterContextActions;

const ClusterContext = createContext<ClusterContextType | undefined>(undefined);

interface ClusterProviderProps {
  children: ReactNode;
}

export const ClusterProvider: React.FC<ClusterProviderProps> = ({
  children,
}) => {
  const { user, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<ClusterContextState>({
    clusters: [],
    selectedCluster: null,
    loading: true, // Start with loading true to prevent premature redirects
    error: null,
  });

  const setLoading = (loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  };

  const setSelectedCluster = (selectedCluster: ClusterConnection | null) => {
    setState((prev) => ({ ...prev, selectedCluster }));
    // Persist selected cluster to localStorage
    if (selectedCluster) {
      localStorage.setItem("selectedClusterId", selectedCluster.id);
    } else {
      localStorage.removeItem("selectedClusterId");
    }
  };

  const refreshClusters = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Use role-appropriate endpoint
      let clustersData: ClusterConnection[];
      if (user.role === UserRole.ADMINISTRATOR) {
        clustersData = await clusterApi.getClusters();
      } else {
        clustersData = await clusterApi.getMyActiveClusters();
      }

      // Use a callback to get the current state to avoid dependency issues
      setState((prevState) => {
        let selectedCluster = prevState.selectedCluster;

        // Try to restore selected cluster from localStorage
        const savedClusterId = localStorage.getItem("selectedClusterId");

        if (savedClusterId && clustersData.length > 0) {
          const savedCluster = clustersData.find(
            (c) => c.id === savedClusterId
          );
          if (savedCluster) {
            selectedCluster = savedCluster;
          }
        }

        // If no cluster is selected and there are clusters, select the first active one
        if (!selectedCluster && clustersData.length > 0) {
          const firstActiveCluster =
            clustersData.find((c) => c.active) || clustersData[0];
          selectedCluster = firstActiveCluster;
          // Persist the auto-selected cluster
          if (firstActiveCluster) {
            localStorage.setItem("selectedClusterId", firstActiveCluster.id);
          }
        }

        return {
          ...prevState,
          selectedCluster,
          clusters: clustersData,
        };
      });
    } catch (err: any) {
      console.error("Error loading clusters:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Failed to load cluster connections. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const selectCluster = useCallback((cluster: ClusterConnection) => {
    setSelectedCluster(cluster);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load clusters when user changes
  useEffect(() => {
    if (authLoading) {
      // Still loading auth, keep cluster loading state
      return;
    }

    if (user) {
      refreshClusters();
    } else {
      // Clear state when user logs out or auth completes with no user
      setState({
        clusters: [],
        selectedCluster: null,
        loading: false,
        error: null,
      });
    }
  }, [user?.id, authLoading]); // Depend on both user ID and auth loading state

  const contextValue: ClusterContextType = {
    ...state,
    // Include auth loading in the overall loading state
    loading: state.loading || authLoading,
    selectCluster,
    refreshClusters,
    clearError,
  };

  return (
    <ClusterContext.Provider value={contextValue}>
      {children}
    </ClusterContext.Provider>
  );
};

export const useClusterContext = (): ClusterContextType => {
  const context = useContext(ClusterContext);
  if (context === undefined) {
    throw new Error("useClusterContext must be used within a ClusterProvider");
  }
  return context;
};

export default ClusterProvider;
