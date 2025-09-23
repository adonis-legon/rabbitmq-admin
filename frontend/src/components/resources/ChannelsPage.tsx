import React from "react";
import { Box, Alert } from "@mui/material";
import { useClusterContext } from "../../contexts/ClusterContext";
import { RabbitMQChannel } from "../../types/rabbitmq";
import ChannelsList from "./ChannelsList";

export const ChannelsPage: React.FC = () => {
  const { selectedCluster } = useClusterContext();

  const handleChannelClick = (channel: RabbitMQChannel) => {
    // Channel click is now handled by the ChannelsList component
    // This callback can be used for additional functionality if needed
    console.log("Channel clicked:", channel.name);
  };

  if (!selectedCluster) {
    return (
      <Box>
        <Alert severity="warning">
          No cluster selected. Please go to the Dashboard and select a cluster
          to view channels.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <ChannelsList
        clusterId={selectedCluster.id}
        onChannelClick={handleChannelClick}
      />
    </Box>
  );
};

export default ChannelsPage;
