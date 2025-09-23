import React, { useState, useEffect, useCallback } from "react";
import { Box, Typography, Chip, Tooltip, Alert, Button } from "@mui/material";
import {
  Queue as QueueIcon,
  PlayArrow as RunningIcon,
  Pause as IdleIcon,
  Warning as FlowIcon,
  Error as DownIcon,
  Memory as MemoryIcon,
  People as ConsumersIcon,
  Message as MessagesIcon,
} from "@mui/icons-material";
import { GridColDef, GridRowParams } from "@mui/x-data-grid";
import {
  RabbitMQQueue,
  ResourceFilters as ResourceFiltersType,
} from "../../types/rabbitmq";
import { useQueues } from "../../hooks/useQueues";
import ResourceTable from "./shared/ResourceTable";
import ResourceFilters from "./shared/ResourceFilters";
import RefreshControls from "./shared/RefreshControls";
import QueueDetailModal from "./QueueDetailModal";

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

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [selectedQueue, setSelectedQueue] = useState<RabbitMQQueue | null>(
    null
  );
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const {
    data,
    loading,
    error,
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
          title={`Ready: ${params.row.messages_ready}, Unacked: ${params.row.messages_unacknowledged}`}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <MessagesIcon fontSize="small" color="action" />
            <Typography variant="body2" fontWeight="medium">
              {params.value.toLocaleString()}
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

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            error.retryable && (
              <Button color="inherit" size="small" onClick={handleRetry}>
                Retry
              </Button>
            )
          }
        >
          <Typography variant="body2" fontWeight="medium">
            {error.message}
          </Typography>
          {error.details && (
            <Typography variant="caption" display="block">
              {error.details}
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
        error={error?.message || null}
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
    </Box>
  );
};

export default QueuesList;
