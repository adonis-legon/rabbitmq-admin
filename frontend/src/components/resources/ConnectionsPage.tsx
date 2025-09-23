import React from "react";
import { Box, Alert } from "@mui/material";
import { useClusterContext } from "../../contexts/ClusterContext";
import ConnectionsList from "./ConnectionsList";

export const ConnectionsPage: React.FC = () => {
  const { selectedCluster } = useClusterContext();

  if (!selectedCluster) {
    return (
      <Box>
        <Alert severity="warning">
          No cluster selected. Please go to the Dashboard and select a cluster
          to view connections.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <ConnectionsList clusterId={selectedCluster.id} />
    </Box>
  );
};

export default ConnectionsPage;
