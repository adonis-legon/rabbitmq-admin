import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Chip,
  Tooltip,
  Alert,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Queue as QueueIcon,
  PlayArrow as RunningIcon,
  Pause as IdleIcon,
  Warning as FlowIcon,
  Error as DownIcon,
  Memory as MemoryIcon,
  People as ConsumersIcon,
  Message as MessagesIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Link as LinkIcon,
  Send as SendIcon,
  GetApp as GetAppIcon,
  Clear as ClearIcon,
  Delete as DeleteIcon,
  MoveToInbox as ShovelIcon,
} from "@mui/icons-material";
import { GridColDef, GridRowParams } from "@mui/x-data-grid";
import {
  RabbitMQQueue,
  ResourceFilters as ResourceFiltersType,
} from "../../types/rabbitmq";
import { useQueues } from "../../hooks/useQueues";
import { useWriteOperationNotifications } from "../../hooks/useWriteOperationNotifications";
import { useAutoRefreshPreferences } from "../../hooks/useAutoRefreshPreferences";
import { rabbitmqResourcesApi } from "../../services/api/rabbitmqResourcesApi";
import ResourceTable from "./shared/ResourceTable";
import ResourceFilters from "./shared/ResourceFilters";
import RefreshControls from "./shared/RefreshControls";
import QueueDetailModal from "./QueueDetailModal";
import CreateQueueDialog from "./CreateQueueDialog";
import CreateBindingDialog from "./CreateBindingDialog";
import PublishMessageDialog from "./PublishMessageDialog";
import GetMessagesDialog from "./GetMessagesDialog";
import { CreateShovelDialog } from "./CreateShovelDialog";
import DeleteConfirmationDialog, {
  DeleteOptions,
} from "../common/DeleteConfirmationDialog";

interface QueuesListProps {
  clusterId: string;
  onQueueClick?: (queue: RabbitMQQueue) => void;
}

const QUEUE_STATE_OPTIONS = [
  { value: "running", label: "Running" },
  { value: "idle", label: "Idle" },
  { value: "flow", label: "Flow" },
  { value: "down", label: "Down" },
];

export const QueuesList: React.FC<QueuesListProps> = ({
  clusterId,
  onQueueClick,
}) => {
  const [filters, setFilters] = useState<ResourceFiltersType>({
    page: 0,
    pageSize: 50,
    searchTerm: "",
    stateFilter: [],
    typeFilter: [],
  });

  const { autoRefresh, refreshInterval, setAutoRefresh, setRefreshInterval } =
    useAutoRefreshPreferences({
      storageKey: 'rabbitmq-admin-queues-autorefresh',
      defaultInterval: 30,
      defaultEnabled: false,
    });
  const [selectedQueue, setSelectedQueue] = useState<RabbitMQQueue | null>(
    null
  );
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Dialog states
  const [createQueueDialogOpen, setCreateQueueDialogOpen] = useState(false);
  const [createBindingDialogOpen, setCreateBindingDialogOpen] = useState(false);
  const [publishMessageDialogOpen, setPublishMessageDialogOpen] =
    useState(false);
  const [getMessagesDialogOpen, setGetMessagesDialogOpen] = useState(false);
  const [createShovelDialogOpen, setCreateShovelDialogOpen] = useState(false);
  const [deleteConfirmationDialogOpen, setDeleteConfirmationDialogOpen] =
    useState(false);
  const [purgeConfirmationDialogOpen, setPurgeConfirmationDialogOpen] =
    useState(false);

  // Action menu state
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [actionMenuQueue, setActionMenuQueue] = useState<RabbitMQQueue | null>(
    null
  );

  // Loading states for write operations
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [purgeLoading, setPurgeLoading] = useState(false);

  const { notifyQueueDeleted, notifyQueuePurged, notifyOperationError } =
    useWriteOperationNotifications();

  const {
    data,
    loading,
    error: queuesError,
    lastUpdated,
    loadQueues,
    refreshQueues,
    clearError,
  } = useQueues({
    autoRefresh,
    refreshInterval: refreshInterval * 1000,
  });

  // Load queues when clusterId or filters change
  useEffect(() => {
    if (clusterId) {
      loadQueues(clusterId, {
        page: filters.page,
        pageSize: filters.pageSize,
        name: filters.searchTerm || undefined,
        useRegex: false,
      });
    }
  }, [
    clusterId,
    filters.page,
    filters.pageSize,
    filters.searchTerm,
    loadQueues,
  ]);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setFilters((prev) => ({ ...prev, page: 0, pageSize }));
  }, []);

  const handleSearchChange = useCallback((searchTerm: string) => {
    setFilters((prev) => ({ ...prev, page: 0, searchTerm }));
  }, []);

  const handleStateFilterChange = useCallback((stateFilter: string[]) => {
    setFilters((prev) => ({ ...prev, page: 0, stateFilter }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      page: 0,
      pageSize: 50,
      searchTerm: "",
      stateFilter: [],
      typeFilter: [],
    });
  }, []);

  const handleRowClick = useCallback(
    (params: GridRowParams) => {
      const queue = params.row as RabbitMQQueue;
      setSelectedQueue(queue);
      setDetailModalOpen(true);

      if (onQueueClick) {
        onQueueClick(queue);
      }
    },
    [onQueueClick]
  );

  const handleCloseDetailModal = useCallback(() => {
    setDetailModalOpen(false);
    setSelectedQueue(null);
  }, []);

  const handleRefresh = useCallback(() => {
    refreshQueues();
  }, [refreshQueues]);

  // Action menu handlers
  const handleActionMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>, queue: RabbitMQQueue) => {
      event.stopPropagation();
      // Close any open dialogs first
      setCreateBindingDialogOpen(false);
      setPublishMessageDialogOpen(false);
      setGetMessagesDialogOpen(false);
      setDeleteConfirmationDialogOpen(false);
      setPurgeConfirmationDialogOpen(false);

      setActionMenuAnchor(event.currentTarget);
      setActionMenuQueue(queue);
    },
    []
  );

  const handleActionMenuClose = useCallback(() => {
    setActionMenuAnchor(null);
    // Don't clear actionMenuQueue here as dialogs need it
  }, []);

  // Dialog handlers
  const handleCreateQueueOpen = useCallback(() => {
    setCreateQueueDialogOpen(true);
  }, []);

  const handleCreateQueueClose = useCallback(() => {
    setCreateQueueDialogOpen(false);
  }, []);

  const handleCreateQueueSuccess = useCallback(() => {
    handleRefresh();
  }, [handleRefresh]);

  const handleCreateBindingOpen = useCallback(() => {
    setCreateBindingDialogOpen(true);
    handleActionMenuClose();
  }, [handleActionMenuClose]);

  const handleCreateBindingClose = useCallback(() => {
    setCreateBindingDialogOpen(false);
    setActionMenuQueue(null);
  }, []);

  const handleCreateBindingSuccess = useCallback(() => {
    // Refresh queues to update binding counts if needed
    handleRefresh();
  }, [handleRefresh]);

  const handlePublishMessageOpen = useCallback(() => {
    setPublishMessageDialogOpen(true);
    handleActionMenuClose();
  }, [handleActionMenuClose]);

  const handlePublishMessageClose = useCallback(() => {
    setPublishMessageDialogOpen(false);
    setActionMenuQueue(null);
  }, []);

  const handlePublishMessageSuccess = useCallback(() => {
    // No need to refresh for message publishing
  }, []);

  const handleGetMessagesOpen = useCallback(() => {
    setGetMessagesDialogOpen(true);
    handleActionMenuClose();
  }, [handleActionMenuClose]);

  const handleGetMessagesClose = useCallback(() => {
    setGetMessagesDialogOpen(false);
    setActionMenuQueue(null);
  }, []);

  const handleGetMessagesSuccess = useCallback(() => {
    // No need to refresh for message consumption
  }, []);

  const handleCreateShovelOpen = useCallback(() => {
    setCreateShovelDialogOpen(true);
    handleActionMenuClose();
  }, [handleActionMenuClose]);

  const handleCreateShovelClose = useCallback(() => {
    setCreateShovelDialogOpen(false);
    setActionMenuQueue(null);
  }, []);

  const handleCreateShovelSuccess = useCallback(() => {
    handleRefresh();
  }, [handleRefresh]);

  const handlePurgeQueueOpen = useCallback(() => {
    setPurgeConfirmationDialogOpen(true);
    handleActionMenuClose();
  }, [handleActionMenuClose]);

  const handlePurgeQueueClose = useCallback(() => {
    setPurgeConfirmationDialogOpen(false);
    setActionMenuQueue(null);
  }, []);

  const handlePurgeQueueConfirm = useCallback(async () => {
    if (!actionMenuQueue) return;

    try {
      setPurgeLoading(true);
      await rabbitmqResourcesApi.purgeQueue(
        clusterId,
        actionMenuQueue.vhost,
        actionMenuQueue.name
      );
      notifyQueuePurged(actionMenuQueue.name);
      handleRefresh();
    } catch (err: any) {
      console.error("Error purging queue:", err);
      notifyOperationError("purge", "Queue", actionMenuQueue.name, err);
      throw err; // Re-throw to prevent dialog from closing
    } finally {
      setPurgeLoading(false);
    }
  }, [
    actionMenuQueue,
    clusterId,
    notifyQueuePurged,
    notifyOperationError,
    handleRefresh,
  ]);

  const handleDeleteQueueOpen = useCallback(() => {
    setDeleteConfirmationDialogOpen(true);
    handleActionMenuClose();
  }, [handleActionMenuClose]);

  const handleDeleteQueueClose = useCallback(() => {
    setDeleteConfirmationDialogOpen(false);
    setActionMenuQueue(null);
  }, []);

  const handleDeleteQueueConfirm = useCallback(
    async (options: DeleteOptions) => {
      if (!actionMenuQueue) return;

      try {
        setDeleteLoading(true);
        await rabbitmqResourcesApi.deleteQueue(
          clusterId,
          actionMenuQueue.vhost,
          actionMenuQueue.name,
          options.ifEmpty,
          options.ifUnused
        );
        notifyQueueDeleted(actionMenuQueue.name, options);
        handleRefresh();
      } catch (err: any) {
        console.error("Error deleting queue:", err);
        notifyOperationError("delete", "Queue", actionMenuQueue.name, err);
        throw err; // Re-throw to prevent dialog from closing
      } finally {
        setDeleteLoading(false);
      }
    },
    [
      actionMenuQueue,
      clusterId,
      notifyQueueDeleted,
      notifyOperationError,
      handleRefresh,
    ]
  );

  const handleRetry = useCallback(() => {
    clearError();
    if (clusterId) {
      loadQueues(clusterId, {
        page: filters.page,
        pageSize: filters.pageSize,
        name: filters.searchTerm || undefined,
        useRegex: false,
      });
    }
  }, [clusterId, filters, loadQueues, clearError]);

  // Format queue data for display
  const formatQueueData = (queues: RabbitMQQueue[]) => {
    return queues.map((queue) => ({
      ...queue,
      id: queue.name, // Use name as ID for DataGrid
      durabilityText: queue.durable ? "Durable" : "Transient",
      autoDeleteText: queue.auto_delete ? "Yes" : "No",
      exclusiveText: queue.exclusive ? "Yes" : "No",
      argumentsCount: Object.keys(queue.arguments || {}).length,
      memoryMB: queue.memory
        ? (queue.memory / (1024 * 1024)).toFixed(2)
        : "0.00",
      publishRate: queue.message_stats?.publish_details?.rate || 0,
      deliverGetRate: queue.message_stats?.deliver_get_details?.rate || 0,
      consumerUtilisationPercent: queue.consumer_utilisation
        ? (queue.consumer_utilisation * 100).toFixed(1)
        : "N/A",
    }));
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case "running":
        return <RunningIcon fontSize="small" />;
      case "idle":
        return <IdleIcon fontSize="small" />;
      case "flow":
        return <FlowIcon fontSize="small" />;
      case "down":
        return <DownIcon fontSize="small" />;
      default:
        return <QueueIcon fontSize="small" />;
    }
  };

  const getStateColor = (
    state: string
  ): "primary" | "secondary" | "success" | "warning" | "info" | "error" => {
    switch (state) {
      case "running":
        return "success";
      case "idle":
        return "info";
      case "flow":
        return "warning";
      case "down":
        return "error";
      default:
        return "secondary";
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Queue Name",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <QueueIcon color="primary" fontSize="small" />
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {params.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.vhost}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: "state",
      headerName: "State",
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {getStateIcon(params.value)}
          <Chip
            label={params.value}
            color={getStateColor(params.value)}
            size="small"
            variant="outlined"
          />
        </Box>
      ),
    },
    {
      field: "messages",
      headerName: "Messages",
      width: 120,
      type: "number",
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Tooltip
          title={`Ready: ${params.row.messages_ready ?? 0}, Unacked: ${params.row.messages_unacknowledged ?? 0}`}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <MessagesIcon fontSize="small" color="action" />
            <Typography variant="body2" fontWeight="medium">
              {(params.value ?? 0).toLocaleString()}
            </Typography>
          </Box>
        </Tooltip>
      ),
    },
    {
      field: "consumers",
      headerName: "Consumers",
      width: 120,
      type: "number",
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <ConsumersIcon fontSize="small" color="action" />
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: "consumerUtilisationPercent",
      headerName: "Consumer Util.",
      width: 130,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Tooltip title="Consumer utilisation percentage">
          <Typography variant="body2">
            {params.value !== "N/A" ? `${params.value}%` : params.value}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: "memoryMB",
      headerName: "Memory",
      width: 120,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <MemoryIcon fontSize="small" color="action" />
          <Typography variant="body2">
            {formatBytes(params.row.memory)}
          </Typography>
        </Box>
      ),
    },
    {
      field: "durabilityText",
      headerName: "Durability",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.row.durable ? "success" : "default"}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: "publishRate",
      headerName: "Publish Rate",
      width: 130,
      type: "number",
      align: "right",
      headerAlign: "right",
      renderCell: (params) => (
        <Typography variant="body2">{params.value.toFixed(2)} msg/s</Typography>
      ),
    },
    {
      field: "deliverGetRate",
      headerName: "Deliver Rate",
      width: 130,
      type: "number",
      align: "right",
      headerAlign: "right",
      renderCell: (params) => (
        <Typography variant="body2">{params.value.toFixed(2)} msg/s</Typography>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 80,
      align: "center",
      headerAlign: "center",
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={(event) =>
            handleActionMenuOpen(event, params.row as RabbitMQQueue)
          }
          aria-label={`Actions for queue ${params.row.name}`}
        >
          <MoreVertIcon />
        </IconButton>
      ),
    },
  ];

  // Filter queues by state if state filter is applied
  const filteredQueues = data?.items
    ? filters.stateFilter.length > 0
      ? data.items.filter((queue) => filters.stateFilter.includes(queue.state))
      : data.items
    : [];

  const formattedQueues = formatQueueData(filteredQueues);

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" component="h2">
          Queues
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateQueueOpen}
            disabled={loading}
          >
            Create Queue
          </Button>
          <RefreshControls
            onRefresh={handleRefresh}
            autoRefresh={autoRefresh}
            onAutoRefreshChange={setAutoRefresh}
            refreshInterval={refreshInterval}
            onRefreshIntervalChange={setRefreshInterval}
            loading={loading}
            lastUpdated={lastUpdated || undefined}
          />
        </Box>
      </Box>

      {queuesError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            queuesError.retryable && (
              <Button color="inherit" size="small" onClick={handleRetry}>
                Retry
              </Button>
            )
          }
        >
          <Typography variant="body2" fontWeight="medium">
            {queuesError.message}
          </Typography>
          {queuesError.details && (
            <Typography variant="caption" display="block">
              {queuesError.details}
            </Typography>
          )}
        </Alert>
      )}

      <ResourceFilters
        searchTerm={filters.searchTerm}
        onSearchChange={handleSearchChange}
        stateFilter={filters.stateFilter}
        onStateFilterChange={handleStateFilterChange}
        stateOptions={QUEUE_STATE_OPTIONS}
        onClearFilters={handleClearFilters}
        searchPlaceholder="Search queues by name..."
        disabled={loading}
      />

      <ResourceTable
        data={formattedQueues}
        columns={columns}
        loading={loading}
        error={queuesError?.message || null}
        totalRows={data?.totalItems}
        page={filters.page}
        pageSize={filters.pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRowClick={handleRowClick}
        getRowId={(row) => row.id}
        emptyMessage="No queues found"
        height={600}
      />

      {/* Queue Detail Modal */}
      <QueueDetailModal
        open={detailModalOpen}
        onClose={handleCloseDetailModal}
        queue={selectedQueue}
        clusterId={clusterId}
      />

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem onClick={handleCreateBindingOpen}>
          <ListItemIcon>
            <LinkIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Create Binding</ListItemText>
        </MenuItem>
        <MenuItem onClick={handlePublishMessageOpen}>
          <ListItemIcon>
            <SendIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Publish Message</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleGetMessagesOpen}>
          <ListItemIcon>
            <GetAppIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Get Messages</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleCreateShovelOpen}>
          <ListItemIcon>
            <ShovelIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Move Messages</ListItemText>
        </MenuItem>
        <MenuItem onClick={handlePurgeQueueOpen}>
          <ListItemIcon>
            <ClearIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Purge Queue</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteQueueOpen} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Queue</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create Queue Dialog */}
      <CreateQueueDialog
        open={createQueueDialogOpen}
        clusterId={clusterId}
        onClose={handleCreateQueueClose}
        onSuccess={handleCreateQueueSuccess}
      />

      {/* Create Binding Dialog */}
      {actionMenuQueue && (
        <CreateBindingDialog
          open={createBindingDialogOpen}
          clusterId={clusterId}
          context="queue"
          sourceResource={{
            name: actionMenuQueue.name,
            vhost: actionMenuQueue.vhost,
          }}
          onClose={handleCreateBindingClose}
          onSuccess={handleCreateBindingSuccess}
        />
      )}

      {/* Publish Message Dialog */}
      {actionMenuQueue && (
        <PublishMessageDialog
          open={publishMessageDialogOpen}
          clusterId={clusterId}
          context="queue"
          targetResource={{
            name: actionMenuQueue.name,
            vhost: actionMenuQueue.vhost,
          }}
          onClose={handlePublishMessageClose}
          onSuccess={handlePublishMessageSuccess}
        />
      )}

      {/* Get Messages Dialog */}
      {actionMenuQueue && (
        <GetMessagesDialog
          open={getMessagesDialogOpen}
          clusterId={clusterId}
          targetQueue={{
            name: actionMenuQueue.name,
            vhost: actionMenuQueue.vhost,
          }}
          onClose={handleGetMessagesClose}
          onSuccess={handleGetMessagesSuccess}
        />
      )}

      {/* Move Messages Dialog */}
      {actionMenuQueue && (
        <CreateShovelDialog
          open={createShovelDialogOpen}
          clusterId={clusterId}
          sourceQueue={{
            name: actionMenuQueue.name,
            vhost: actionMenuQueue.vhost,
          }}
          onClose={handleCreateShovelClose}
          onSuccess={handleCreateShovelSuccess}
        />
      )}

      {/* Purge Queue Confirmation Dialog */}
      {actionMenuQueue && (
        <DeleteConfirmationDialog
          open={purgeConfirmationDialogOpen}
          onClose={handlePurgeQueueClose}
          onConfirm={handlePurgeQueueConfirm}
          deleteType="purge"
          resourceName={actionMenuQueue.name}
          loading={purgeLoading}
        />
      )}

      {/* Delete Queue Confirmation Dialog */}
      {actionMenuQueue && (
        <DeleteConfirmationDialog
          open={deleteConfirmationDialogOpen}
          onClose={handleDeleteQueueClose}
          onConfirm={handleDeleteQueueConfirm}
          deleteType="queue"
          resourceName={actionMenuQueue.name}
          loading={deleteLoading}
        />
      )}
    </Box>
  );
};

export default QueuesList;
