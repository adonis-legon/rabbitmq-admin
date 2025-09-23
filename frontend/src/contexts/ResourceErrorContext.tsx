import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  tokenExpirationHandler,
  TokenStatus,
} from "../services/tokenExpirationHandler";
import {
  clusterConnectivityService,
  ClusterStatus,
} from "../services/clusterConnectivityService";
import { clusterAccessValidator } from "../services/clusterAccessValidator";
import { rateLimitHandler } from "../services/rateLimitHandler";
import { errorLoggingService } from "../services/errorLoggingService";
import { useError } from "./ErrorContext";

export interface ResourceErrorContextType {
  tokenStatus: TokenStatus | null;
  clusterStatuses: Map<string, ClusterStatus>;
  isMonitoring: boolean;
  startMonitoring: (clusterIds: string[]) => void;
  stopMonitoring: () => void;
  refreshClusterStatus: (clusterId: string) => Promise<void>;
  clearAllErrors: () => void;
  getErrorSummary: () => {
    tokenExpiring: boolean;
    clustersUnavailable: number;
    rateLimitedEndpoints: number;
    totalErrors: number;
  };
}

const ResourceErrorContext = createContext<
  ResourceErrorContextType | undefined
>(undefined);

interface ResourceErrorProviderProps {
  children: ReactNode;
}

export const ResourceErrorProvider: React.FC<ResourceErrorProviderProps> = ({
  children,
}) => {
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
  const [clusterStatuses, setClusterStatuses] = useState<
    Map<string, ClusterStatus>
  >(new Map());
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitoringClusterIds, setMonitoringClusterIds] = useState<string[]>(
    []
  );

  const navigate = useNavigate();
  const location = useLocation();
  const { showWarning, showError } = useError();

  // Token expiration monitoring
  useEffect(() => {
    const unsubscribe = tokenExpirationHandler.addListener((status) => {
      setTokenStatus(status);

      // Show warning when token is about to expire
      if (status.needsWarning && status.minutesUntilExpiry) {
        showWarning(
          `Your session will expire in ${status.minutesUntilExpiry} minutes. Please save your work and refresh the page to extend your session.`
        );
      }
    });

    // Start token monitoring
    tokenExpirationHandler.startMonitoring();

    return () => {
      unsubscribe();
      tokenExpirationHandler.stopMonitoring();
    };
  }, [showWarning]);

  // Cluster connectivity monitoring
  useEffect(() => {
    if (!isMonitoring || monitoringClusterIds.length === 0) {
      return;
    }

    const stopClusterMonitoring = clusterConnectivityService.startMonitoring(
      monitoringClusterIds,
      30000 // Check every 30 seconds
    );

    // Periodic update of cluster statuses
    const updateInterval = setInterval(() => {
      const statuses = clusterConnectivityService.getAllCachedStatuses();
      const statusMap = new Map<string, ClusterStatus>();

      statuses.forEach((status) => {
        statusMap.set(status.clusterId, status);

        // Show error for newly unavailable clusters
        const previousStatus = clusterStatuses.get(status.clusterId);
        if (previousStatus?.isAvailable && !status.isAvailable) {
          showError(
            `Cluster "${status.clusterId}" is now unavailable`,
            status.error || "Connection to cluster lost"
          );
        }
      });

      setClusterStatuses(statusMap);
    }, 10000); // Update UI every 10 seconds

    return () => {
      stopClusterMonitoring();
      clearInterval(updateInterval);
    };
  }, [isMonitoring, monitoringClusterIds, clusterStatuses, showError]);

  // Handle route changes - validate cluster access for resource pages
  useEffect(() => {
    const validateRouteAccess = async () => {
      const path = location.pathname;

      // Check if this is a resource page with cluster ID
      const resourceMatch = path.match(/\/resources\/([^/]+)\/(.+)/);
      if (resourceMatch) {
        const [, clusterId, resourceType] = resourceMatch;

        try {
          const result = await clusterAccessValidator.validateClusterAccess(
            clusterId,
            {
              operation: "access",
              resourceType,
            }
          );

          if (!result.hasAccess) {
            const errorInfo = clusterAccessValidator.handleClusterAccessError(
              result,
              {
                operation: "access",
                resourceType,
              }
            );

            showError(`${errorInfo.title}: ${errorInfo.message}`);

            // Redirect to dashboard if cluster access is denied
            if (
              result.errorType === "not_found" ||
              result.errorType === "unauthorized"
            ) {
              navigate("/dashboard", { replace: true });
            }
          }
        } catch (error) {
          console.error("Route access validation failed:", error);
        }
      }
    };

    validateRouteAccess();
  }, [location.pathname, navigate, showError]);

  const startMonitoring = (clusterIds: string[]) => {
    setMonitoringClusterIds(clusterIds);
    setIsMonitoring(true);

    errorLoggingService.logInfo({
      category: "resource",
      message: "Started resource error monitoring",
      details: { clusterIds },
    });
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    setMonitoringClusterIds([]);

    errorLoggingService.logInfo({
      category: "resource",
      message: "Stopped resource error monitoring",
    });
  };

  const refreshClusterStatus = async (clusterId: string) => {
    try {
      const result = await clusterConnectivityService.checkClusterConnectivity(
        clusterId
      );
      if (result.status) {
        setClusterStatuses((prev) =>
          new Map(prev).set(clusterId, result.status!)
        );
      }
    } catch (error) {
      console.error(
        `Failed to refresh cluster status for ${clusterId}:`,
        error
      );
    }
  };

  const clearAllErrors = () => {
    // Clear all error caches
    clusterAccessValidator.clearCache();
    clusterConnectivityService.clearCache();
    rateLimitHandler.clearRateLimitInfo();

    // Clear error logs (keep only recent ones)
    const recentLogs = errorLoggingService.getLogs({
      since: Date.now() - 5 * 60 * 1000, // Last 5 minutes
    });
    errorLoggingService.clearLogs();

    errorLoggingService.logInfo({
      category: "general",
      message: "Cleared all error caches and logs",
      details: { preservedLogs: recentLogs.length },
    });
  };

  const getErrorSummary = () => {
    const tokenExpiring = tokenStatus?.needsWarning || false;
    const clustersUnavailable = Array.from(clusterStatuses.values()).filter(
      (status) => !status.isAvailable
    ).length;
    const rateLimitSummary = rateLimitHandler.getRateLimitSummary();
    const errorSummary = errorLoggingService.getErrorSummary();

    return {
      tokenExpiring,
      clustersUnavailable,
      rateLimitedEndpoints: rateLimitSummary.rateLimitedEndpoints,
      totalErrors: errorSummary.unresolved,
    };
  };

  const contextValue: ResourceErrorContextType = {
    tokenStatus,
    clusterStatuses,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    refreshClusterStatus,
    clearAllErrors,
    getErrorSummary,
  };

  return (
    <ResourceErrorContext.Provider value={contextValue}>
      {children}
    </ResourceErrorContext.Provider>
  );
};

export const useResourceError = (): ResourceErrorContextType => {
  const context = useContext(ResourceErrorContext);
  if (context === undefined) {
    throw new Error(
      "useResourceError must be used within a ResourceErrorProvider"
    );
  }
  return context;
};

// Hook for resource pages to automatically start monitoring
export const useResourceMonitoring = (clusterIds: string[]) => {
  const { startMonitoring, stopMonitoring } = useResourceError();

  useEffect(() => {
    if (clusterIds.length > 0) {
      startMonitoring(clusterIds);
      return () => stopMonitoring();
    }
  }, [clusterIds, startMonitoring, stopMonitoring]);
};
