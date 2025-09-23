import React from "react";
import { Box, Typography, Alert } from "@mui/material";
import { useClusterContext } from "../../contexts/ClusterContext";
import QueuesList from "./QueuesList";

export const QueuesPage: React.FC = () => {
  const { selectedCluster } = useClusterContext();

  if (!selectedCluster) {
    return (
      <Box>
        <Typography variant="h5" component="h2" gutterBottom>
          Queues
        </Typography>
        <Alert severity="warning">
          No cluster selected. Please go to the Dashboard and select a cluster
          to view queues.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <QueuesList clusterId={selectedCluster.id} />
    </Box>
  );
};

export default QueuesPage;
