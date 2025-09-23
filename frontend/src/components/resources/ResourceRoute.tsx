import React from "react";
import { Navigate } from "react-router-dom";
import { useClusterContext } from "../../contexts/ClusterContext";
import { ResourceLayout } from "./ResourceLayout";
import { ROUTES } from "../../utils/constants";

interface ResourceRouteProps {
  children: React.ReactNode;
}

/**
 * Route guard component for resource pages that ensures:
 * 1. User has access to at least one cluster
 * 2. A cluster is selected for resource browsing
 * 3. Provides consistent layout and cluster context
 */
export const ResourceRoute: React.FC<ResourceRouteProps> = ({ children }) => {
  const { clusters, selectedCluster, loading, error } = useClusterContext();

  // If loading, show loading state in layout
  if (loading) {
    return (
      <ResourceLayout selectedCluster={null} loading={true}>
        {children}
      </ResourceLayout>
    );
  }

  // If error loading clusters, show error in layout
  if (error) {
    return (
      <ResourceLayout selectedCluster={null} error={error}>
        {children}
      </ResourceLayout>
    );
  }

  // Only redirect to dashboard if we're done loading AND user has no assigned clusters
  // This prevents redirect during the initial loading phase on page refresh
  if (!loading && clusters.length === 0) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // If no cluster is selected, show cluster selection required message
  if (!selectedCluster) {
    return <ResourceLayout selectedCluster={null}>{children}</ResourceLayout>;
  }

  // If selected cluster is not active, show warning
  if (!selectedCluster.active) {
    return (
      <ResourceLayout
        selectedCluster={selectedCluster}
        error="The selected cluster connection is not active. Please select an active cluster from the dashboard."
      >
        {children}
      </ResourceLayout>
    );
  }

  // All checks passed, render children with layout
  return (
    <ResourceLayout selectedCluster={selectedCluster}>
      {children}
    </ResourceLayout>
  );
};

export default ResourceRoute;
