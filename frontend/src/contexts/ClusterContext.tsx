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
  const { user } = useAuth();
  const [state, setState] = useState<ClusterContextState>({
    clusters: [],
    selectedCluster: null,
    loading: false,
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
        // If no cluster is selected and there are clusters, select the first active one
        if (!prevState.selectedCluster && clustersData.length > 0) {
          const firstActiveCluster =
            clustersData.find((c) => c.active) || clustersData[0];
          return {
            ...prevState,
            selectedCluster: firstActiveCluster,
            clusters: clustersData,
          };
        }
        return { ...prevState, clusters: clustersData };
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
  }, [user]);

  const selectCluster = useCallback((cluster: ClusterConnection) => {
    setSelectedCluster(cluster);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load clusters when user changes
  useEffect(() => {
    if (user) {
      refreshClusters();
    }
  }, [user?.id]); // Only depend on user ID to avoid infinite loops

  const contextValue: ClusterContextType = {
    ...state,
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
