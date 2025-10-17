import React, { useState, useEffect, useCallback } from "react";
import { Box, Typography, Chip, Tooltip, Alert, Button } from "@mui/material";
import {
  Info as InfoIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { GridColDef, GridRowParams } from "@mui/x-data-grid";
import {
  RabbitMQConnection,
  ResourceFilters as ResourceFiltersType,
} from "../../types/rabbitmq";
import { useConnections } from "../../hooks/useConnections";
import ResourceTable from "./shared/ResourceTable";
import ResourceFilters from "./shared/ResourceFilters";
import RefreshControls from "./shared/RefreshControls";
import ConnectionDetailModal from "./ConnectionDetailModal";
import { useDebouncedSearch } from "../../hooks/useDebouncedSearch";

interface ConnectionsListProps {
  clusterId: string;
  onConnectionClick?: (connection: RabbitMQConnection) => void;
}

const CONNECTION_STATE_OPTIONS = [
  { value: "running", label: "Running" },
  { value: "blocked", label: "Blocked" },
  { value: "blocking", label: "Blocking" },
  { value: "closed", label: "Closed" },
];

const ConnectionsListComponent: React.FC<ConnectionsListProps> = ({
  clusterId,
  onConnectionClick,
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

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [selectedConnection, setSelectedConnection] =
    useState<RabbitMQConnection | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const {
    data,
    loading,
    error,
    lastUpdated,
    loadConnections,
    refreshConnections,
    clearError,
  } = useConnections({
    autoRefresh,
    refreshInterval: refreshInterval * 1000,
  });

  // Load connections when clusterId or filters change
  useEffect(() => {
    if (clusterId) {
      loadConnections(clusterId, {
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
    loadConnections,
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
      const connection = params.row as RabbitMQConnection;
      setSelectedConnection(connection);
      setDetailModalOpen(true);

      if (onConnectionClick) {
        onConnectionClick(connection);
      }
    },
    [onConnectionClick]
  );

  const handleCloseDetailModal = useCallback(() => {
    setDetailModalOpen(false);
    setSelectedConnection(null);
  }, []);

  const handleRefresh = useCallback(() => {
    refreshConnections();
  }, [refreshConnections]);

  const handleRetry = useCallback(() => {
    clearError();
    if (clusterId) {
      loadConnections(clusterId, {
        page: filters.page,
        pageSize: filters.pageSize,
        name: filters.searchTerm || undefined,
        useRegex: false,
      });
    }
  }, [clusterId, filters, loadConnections, clearError]);

  // Format connection data for display
  const formatConnectionData = (connections: RabbitMQConnection[]) => {
    return connections.map((connection) => ({
      ...connection,
      id: connection.name, // Use name as ID for DataGrid
      clientName: connection.client_properties?.connection_name || "Unknown",
      clientPlatform: connection.client_properties?.platform || "Unknown",
      clientProduct: connection.client_properties?.product || "Unknown",
      clientVersion: connection.client_properties?.version || "Unknown",
      connectedAtFormatted: new Date(connection.connected_at).toLocaleString(),
      bytesReceived: formatBytes(connection.recv_oct),
      bytesSent: formatBytes(connection.send_oct),
    }));
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case "running":
        return <CheckCircleIcon color="success" fontSize="small" />;
      case "blocked":
      case "blocking":
        return <WarningIcon color="warning" fontSize="small" />;
      case "closed":
        return <ErrorIcon color="error" fontSize="small" />;
      default:
        return <InfoIcon color="info" fontSize="small" />;
    }
  };

  const getStateColor = (
    state: string
  ): "success" | "warning" | "error" | "default" => {
    switch (state) {
      case "running":
        return "success";
      case "blocked":
      case "blocking":
        return "warning";
      case "closed":
        return "error";
      default:
        return "default";
    }
  };

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Connection Name",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {getStateIcon(params.row.state)}
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {params.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.peer_host}:{params.row.peer_port}
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
      field: "channels",
      headerName: "Channels",
      width: 100,
      type: "number",
      align: "center",
      headerAlign: "center",
    },
    {
      field: "clientName",
      headerName: "Client Info",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.clientProduct} {params.row.clientVersion}
          </Typography>
        </Box>
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
      field: "protocol",
      headerName: "Protocol",
      width: 120,
    },
    {
      field: "connectedAtFormatted",
      headerName: "Connected At",
      width: 180,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <Typography variant="body2">{params.value}</Typography>
        </Tooltip>
      ),
    },
    {
      field: "bytesReceived",
      headerName: "Received",
      width: 100,
      align: "right",
      headerAlign: "right",
    },
    {
      field: "bytesSent",
      headerName: "Sent",
      width: 100,
      align: "right",
      headerAlign: "right",
    },
  ];

  // Filter connections by state if state filter is applied
  const filteredConnections = data?.items
    ? filters.stateFilter.length > 0
      ? data.items.filter((conn) => filters.stateFilter.includes(conn.state))
      : data.items
    : [];

  const formattedConnections = formatConnectionData(filteredConnections);

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
          Connections
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
        stateOptions={CONNECTION_STATE_OPTIONS}
        onClearFilters={handleClearFilters}
        searchPlaceholder="Search connections by name..."
        disabled={loading}
      />

      <ResourceTable
        data={formattedConnections}
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
        emptyMessage="No connections found"
        height={600}
        sortingMode="client"
      />

      {/* Connection Detail Modal */}
      <ConnectionDetailModal
        open={detailModalOpen}
        onClose={handleCloseDetailModal}
        connection={selectedConnection}
        clusterId={clusterId}
      />
    </Box>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const ConnectionsList = React.memo(
  ConnectionsListComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.clusterId === nextProps.clusterId &&
      prevProps.onConnectionClick === nextProps.onConnectionClick
    );
  }
);

export default ConnectionsList;
