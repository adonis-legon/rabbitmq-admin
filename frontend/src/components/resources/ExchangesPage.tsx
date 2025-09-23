import React from "react";
import { Box, Alert } from "@mui/material";
import { useClusterContext } from "../../contexts/ClusterContext";
import ExchangesList from "./ExchangesList";

export const ExchangesPage: React.FC = () => {
  const { selectedCluster } = useClusterContext();

  if (!selectedCluster) {
    return (
      <Box>
        <Alert severity="warning">
          No cluster selected. Please go to the Dashboard and select a cluster
          to view exchanges.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <ExchangesList clusterId={selectedCluster.id} />
    </Box>
  );
};

export default ExchangesPage;
