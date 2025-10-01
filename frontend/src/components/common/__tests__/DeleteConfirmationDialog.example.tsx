import React, { useState } from "react";
import { Button, Box, Typography } from "@mui/material";
import DeleteConfirmationDialog, {
  DeleteType,
  DeleteOptions,
} from "../DeleteConfirmationDialog";
import { rabbitmqResourcesApi } from "../../../services/api/rabbitmqResourcesApi";

/**
 * Example usage of DeleteConfirmationDialog component
 * This demonstrates how to integrate the dialog with the RabbitMQ API functions
 */
const DeleteConfirmationExample: React.FC = () => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<DeleteType>("exchange");
  const [resourceName, setResourceName] = useState("");
  const [loading, setLoading] = useState(false);

  // Example cluster and vhost data
  const clusterId = "example-cluster";
  const vhost = "/";

  const handleDeleteExchange = async (options: DeleteOptions) => {
    setLoading(true);
    try {
      await rabbitmqResourcesApi.deleteExchange(
        clusterId,
        vhost,
        resourceName,
        options.ifUnused
      );
      console.log("Exchange deleted successfully");
      // In real implementation: show success notification, refresh list
    } catch (error) {
      console.error("Failed to delete exchange:", error);
      // In real implementation: show error notification
      throw error; // Re-throw to keep dialog open
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQueue = async (options: DeleteOptions) => {
    setLoading(true);
    try {
      await rabbitmqResourcesApi.deleteQueue(
        clusterId,
        vhost,
        resourceName,
        options.ifEmpty,
        options.ifUnused
      );
      console.log("Queue deleted successfully");
      // In real implementation: show success notification, refresh list
    } catch (error) {
      console.error("Failed to delete queue:", error);
      // In real implementation: show error notification
      throw error; // Re-throw to keep dialog open
    } finally {
      setLoading(false);
    }
  };

  const handlePurgeQueue = async (_options: DeleteOptions) => {
    setLoading(true);
    try {
      await rabbitmqResourcesApi.purgeQueue(clusterId, vhost, resourceName);
      console.log("Queue purged successfully");
      // In real implementation: show success notification, refresh queue details
    } catch (error) {
      console.error("Failed to purge queue:", error);
      // In real implementation: show error notification
      throw error; // Re-throw to keep dialog open
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (options: DeleteOptions) => {
    switch (deleteType) {
      case "exchange":
        return handleDeleteExchange(options);
      case "queue":
        return handleDeleteQueue(options);
      case "purge":
        return handlePurgeQueue(options);
      default:
        throw new Error(`Unknown delete type: ${deleteType}`);
    }
  };

  const openDeleteDialog = (type: DeleteType, name: string) => {
    setDeleteType(type);
    setResourceName(name);
    setDeleteDialogOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Delete Confirmation Dialog Examples
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          color="error"
          onClick={() => openDeleteDialog("exchange", "my-exchange")}
        >
          Delete Exchange
        </Button>

        <Button
          variant="outlined"
          color="error"
          onClick={() => openDeleteDialog("queue", "my-queue")}
        >
          Delete Queue
        </Button>

        <Button
          variant="outlined"
          color="warning"
          onClick={() => openDeleteDialog("purge", "my-queue")}
        >
          Purge Queue
        </Button>
      </Box>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirm}
        deleteType={deleteType}
        resourceName={resourceName}
        loading={loading}
      />
    </Box>
  );
};

export default DeleteConfirmationExample;
