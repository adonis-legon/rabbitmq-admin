import React, { useState, useEffect, useCallback } from "react";
import { Box, Typography, Chip, Tooltip, Alert, Button } from "@mui/material";
import {
  Info as InfoIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  PlayArrow as PlayArrowIcon,
} from "@mui/icons-material";
import { GridColDef, GridRowParams } from "@mui/x-data-grid";
import {
  RabbitMQChannel,
  ResourceFilters as ResourceFiltersType,
} from "../../types/rabbitmq";
import { useChannels } from "../../hooks/useChannels";
import ResourceTable from "./shared/ResourceTable";
import ResourceFilters from "./shared/ResourceFilters";
import RefreshControls from "./shared/RefreshControls";
import ChannelDetailModal from "./ChannelDetailModal";
import { useDebouncedSearch } from "../../hooks/useDebouncedSearch";
import { useAutoRefreshPreferences } from "../../hooks/useAutoRefreshPreferences";

interface ChannelsListProps {
  clusterId: string;
  onChannelClick?: (channel: RabbitMQChannel) => void;
}

const CHANNEL_STATE_OPTIONS = [
  { value: "running", label: "Running" },
  { value: "flow", label: "Flow" },
  { value: "starting", label: "Starting" },
  { value: "closing", label: "Closing" },
];

const ChannelsListComponent: React.FC<ChannelsListProps> = ({
  clusterId,
  onChannelClick,
}) => {
  const [filters, setFilters] = useState<ResourceFiltersType>({
    page: 0,
    pageSize: 50,
    searchTerm: "",
    stateFilter: [],
    typeFilter: [],
  });

  const { debouncedSearchTerm, setSearchTerm } = useDebouncedSearch(
    filters.searchTerm,
    {
      delay: 300,
      minLength: 0,
    }
  );

  const { autoRefresh, refreshInterval, setAutoRefresh, setRefreshInterval } =
    useAutoRefreshPreferences({
      storageKey: 'rabbitmq-admin-channels-autorefresh',
      defaultInterval: 30,
      defaultEnabled: false,
    });
  const [selectedChannel, setSelectedChannel] =
    useState<RabbitMQChannel | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const {
    data,
    loading,
    error,
    lastUpdated,
    loadChannels,
    refreshChannels,
    clearError,
  } = useChannels({
    autoRefresh,
    refreshInterval: refreshInterval * 1000,
  });

  // Load channels when clusterId or filters change
  useEffect(() => {
    if (clusterId) {
      loadChannels(clusterId, {
        page: filters.page,
        pageSize: filters.pageSize,
        name: debouncedSearchTerm || undefined,
        useRegex: false,
      });
    }
  }, [
    clusterId,
    filters.page,
    filters.pageSize,
    debouncedSearchTerm,
    loadChannels,
  ]);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setFilters((prev) => ({ ...prev, page: 0, pageSize }));
  }, []);

  const handleSearchChange = useCallback(
    (searchTerm: string) => {
      setFilters((prev) => ({ ...prev, page: 0, searchTerm }));
      setSearchTerm(searchTerm);
    },
    [setSearchTerm]
  );

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
      const channel = params.row as RabbitMQChannel;
      setSelectedChannel(channel);
      setModalOpen(true);
      if (onChannelClick) {
        onChannelClick(channel);
      }
    },
    [onChannelClick]
  );

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setSelectedChannel(null);
  }, []);

  const handleRefresh = useCallback(() => {
    refreshChannels();
  }, [refreshChannels]);

  const handleRetry = useCallback(() => {
    clearError();
    if (clusterId) {
      loadChannels(clusterId, {
        page: filters.page,
        pageSize: filters.pageSize,
        name: filters.searchTerm || undefined,
        useRegex: false,
      });
    }
  }, [clusterId, filters, loadChannels, clearError]);

  // Format channel data for display
  const formatChannelData = (channels: RabbitMQChannel[]) => {
    return channels.map((channel) => ({
      ...channel,
      id: channel.name, // Use name as ID for DataGrid
      connectionName: channel.connection_details?.name || "Unknown",
      connectionHost: channel.connection_details?.peer_host || "Unknown",
      hasTransactions: channel.transactional ? "Yes" : "No",
      hasConfirms: channel.confirm ? "Yes" : "No",
      totalUnacknowledged:
        channel.messages_unacknowledged +
        channel.messages_unconfirmed +
        channel.messages_uncommitted,
    }));
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case "running":
        return <CheckCircleIcon color="success" fontSize="small" />;
      case "flow":
        return <WarningIcon color="warning" fontSize="small" />;
      case "starting":
        return <PlayArrowIcon color="info" fontSize="small" />;
      case "closing":
        return <ErrorIcon color="error" fontSize="small" />;
      default:
        return <InfoIcon color="info" fontSize="small" />;
    }
  };

  const getStateColor = (
    state: string
  ): "success" | "warning" | "error" | "info" | "default" => {
    switch (state) {
      case "running":
        return "success";
      case "flow":
        return "warning";
      case "starting":
        return "info";
      case "closing":
        return "error";
      default:
        return "default";
    }
  };

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Channel",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          width: "100%",
          height: "100%"
        }}>
          {getStateIcon(params.row.state)}
          <Box sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
            minWidth: 0,
            flex: 1
          }}>
            <Typography
              variant="body2"
              fontWeight="medium"
              sx={{
                lineHeight: 1.2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                width: "100%"
              }}
            >
              {params.value}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                lineHeight: 1.1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                width: "100%"
              }}
            >
              Channel #{params.row.number}
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
        <Chip
          label={params.value}
          color={getStateColor(params.value)}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: "connectionName",
      headerName: "Connection",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          height: "100%",
          minWidth: 0,
          width: "100%"
        }}>
          <Typography
            variant="body2"
            fontWeight="medium"
            sx={{
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              width: "100%"
            }}
          >
            {params.value}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              lineHeight: 1.1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              width: "100%"
            }}
          >
            {params.row.connectionHost}
          </Typography>
        </Box>
      ),
    },
    {
      field: "consumer_count",
      headerName: "Consumers",
      width: 100,
      type: "number",
      align: "center",
      headerAlign: "center",
    },
    {
      field: "totalUnacknowledged",
      headerName: "Unacked Msgs",
      width: 120,
      type: "number",
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Tooltip
          title={`Unacknowledged: ${params.row.messages_unacknowledged}, Unconfirmed: ${params.row.messages_unconfirmed}, Uncommitted: ${params.row.messages_uncommitted}`}
        >
          <Typography variant="body2">{params.value}</Typography>
        </Tooltip>
      ),
    },
    {
      field: "prefetch_count",
      headerName: "Prefetch",
      width: 100,
      type: "number",
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Tooltip
          title={`Local: ${params.value}, Global: ${params.row.global_prefetch_count}`}
        >
          <Typography variant="body2">{params.value}</Typography>
        </Tooltip>
      ),
    },
    {
      field: "user",
      headerName: "User",
      width: 120,
    },
    {
      field: "vhost",
      headerName: "Virtual Host",
      width: 120,
    },
    {
      field: "hasTransactions",
      headerName: "Transactional",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === "Yes" ? "info" : "default"}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: "hasConfirms",
      headerName: "Confirms",
      width: 100,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === "Yes" ? "info" : "default"}
          size="small"
          variant="outlined"
        />
      ),
    },
  ];

  // Filter channels by state if state filter is applied
  const filteredChannels = data?.items
    ? filters.stateFilter.length > 0
      ? data.items.filter((channel) =>
        filters.stateFilter.includes(channel.state)
      )
      : data.items
    : [];

  const formattedChannels = formatChannelData(filteredChannels);

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
          Channels
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
        stateOptions={CHANNEL_STATE_OPTIONS}
        onClearFilters={handleClearFilters}
        searchPlaceholder="Search channels by name..."
        disabled={loading}
      />

      <ResourceTable
        data={formattedChannels}
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
        emptyMessage="No channels found"
        height={600}
        sortingMode="client"
      />

      <ChannelDetailModal
        open={modalOpen}
        onClose={handleCloseModal}
        channel={selectedChannel}
        clusterId={clusterId}
      />
    </Box>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const ChannelsList = React.memo(
  ChannelsListComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.clusterId === nextProps.clusterId &&
      prevProps.onChannelClick === nextProps.onChannelClick
    );
  }
);

export default ChannelsList;
