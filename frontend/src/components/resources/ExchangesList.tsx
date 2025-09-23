import React, { useState, useEffect, useCallback } from "react";
import { Box, Typography, Chip, Tooltip, Alert, Button } from "@mui/material";
import {
  SwapHoriz as DirectIcon,
  Radio as FanoutIcon,
  AccountTree as TopicIcon,
  ViewList as HeadersIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { GridColDef, GridRowParams } from "@mui/x-data-grid";
import {
  RabbitMQExchange,
  ResourceFilters as ResourceFiltersType,
} from "../../types/rabbitmq";
import { useExchanges } from "../../hooks/useExchanges";
import ResourceTable from "./shared/ResourceTable";
import ResourceFilters from "./shared/ResourceFilters";
import RefreshControls from "./shared/RefreshControls";
import ExchangeDetailModal from "./ExchangeDetailModal";

interface ExchangesListProps {
  clusterId: string;
  onExchangeClick?: (exchange: RabbitMQExchange) => void;
}

const EXCHANGE_TYPE_OPTIONS = [
  { value: "direct", label: "Direct" },
  { value: "fanout", label: "Fanout" },
  { value: "topic", label: "Topic" },
  { value: "headers", label: "Headers" },
];

export const ExchangesList: React.FC<ExchangesListProps> = ({
  clusterId,
  onExchangeClick,
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
  const [selectedExchange, setSelectedExchange] =
    useState<RabbitMQExchange | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const {
    data,
    loading,
    error,
    lastUpdated,
    loadExchanges,
    refreshExchanges,
    clearError,
  } = useExchanges({
    autoRefresh,
    refreshInterval: refreshInterval * 1000,
  });

  // Load exchanges when clusterId or filters change
  useEffect(() => {
    if (clusterId) {
      loadExchanges(clusterId, {
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
    loadExchanges,
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

  const handleTypeFilterChange = useCallback((typeFilter: string[]) => {
    setFilters((prev) => ({ ...prev, page: 0, typeFilter }));
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
      const exchange = params.row as RabbitMQExchange;
      setSelectedExchange(exchange);
      setDetailModalOpen(true);

      if (onExchangeClick) {
        onExchangeClick(exchange);
      }
    },
    [onExchangeClick]
  );

  const handleCloseDetailModal = useCallback(() => {
    setDetailModalOpen(false);
    setSelectedExchange(null);
  }, []);

  const handleRefresh = useCallback(() => {
    refreshExchanges();
  }, [refreshExchanges]);

  const handleRetry = useCallback(() => {
    clearError();
    if (clusterId) {
      loadExchanges(clusterId, {
        page: filters.page,
        pageSize: filters.pageSize,
        name: filters.searchTerm || undefined,
        useRegex: false,
      });
    }
  }, [clusterId, filters, loadExchanges, clearError]);

  // Format exchange data for display
  const formatExchangeData = (exchanges: RabbitMQExchange[]) => {
    return exchanges.map((exchange) => ({
      ...exchange,
      id: exchange.name, // Use name as ID for DataGrid
      durabilityText: exchange.durable ? "Durable" : "Transient",
      autoDeleteText: exchange.auto_delete ? "Yes" : "No",
      internalText: exchange.internal ? "Yes" : "No",
      argumentsCount: Object.keys(exchange.arguments || {}).length,
      publishInRate: exchange.message_stats?.publish_in_details?.rate || 0,
      publishOutRate: exchange.message_stats?.publish_out_details?.rate || 0,
    }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "direct":
        return <DirectIcon fontSize="small" />;
      case "fanout":
        return <FanoutIcon fontSize="small" />;
      case "topic":
        return <TopicIcon fontSize="small" />;
      case "headers":
        return <HeadersIcon fontSize="small" />;
      default:
        return <InfoIcon fontSize="small" />;
    }
  };

  const getTypeColor = (
    type: string
  ): "primary" | "secondary" | "success" | "warning" | "info" | "error" => {
    switch (type) {
      case "direct":
        return "primary";
      case "fanout":
        return "secondary";
      case "topic":
        return "success";
      case "headers":
        return "warning";
      default:
        return "info";
    }
  };

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Exchange Name",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {getTypeIcon(params.row.type)}
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
      field: "type",
      headerName: "Type",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getTypeColor(params.value)}
          size="small"
          variant="outlined"
        />
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
      field: "autoDeleteText",
      headerName: "Auto Delete",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.row.auto_delete ? "warning" : "default"}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: "internalText",
      headerName: "Internal",
      width: 100,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.row.internal ? "info" : "default"}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: "argumentsCount",
      headerName: "Arguments",
      width: 100,
      type: "number",
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Tooltip
          title={
            params.value > 0
              ? `${params.value} argument(s) configured`
              : "No arguments"
          }
        >
          <Typography variant="body2">{params.value}</Typography>
        </Tooltip>
      ),
    },
    {
      field: "publishInRate",
      headerName: "Publish In Rate",
      width: 140,
      type: "number",
      align: "right",
      headerAlign: "right",
      renderCell: (params) => (
        <Typography variant="body2">{params.value.toFixed(2)} msg/s</Typography>
      ),
    },
    {
      field: "publishOutRate",
      headerName: "Publish Out Rate",
      width: 140,
      type: "number",
      align: "right",
      headerAlign: "right",
      renderCell: (params) => (
        <Typography variant="body2">{params.value.toFixed(2)} msg/s</Typography>
      ),
    },
  ];

  // Filter exchanges by type if type filter is applied
  const filteredExchanges = data?.items
    ? filters.typeFilter.length > 0
      ? data.items.filter((exchange) =>
        filters.typeFilter.includes(exchange.type)
      )
      : data.items
    : [];

  const formattedExchanges = formatExchangeData(filteredExchanges);

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
          Exchanges
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
        typeFilter={filters.typeFilter}
        onTypeFilterChange={handleTypeFilterChange}
        typeOptions={EXCHANGE_TYPE_OPTIONS}
        onClearFilters={handleClearFilters}
        searchPlaceholder="Search exchanges by name..."
        disabled={loading}
      />

      <ResourceTable
        data={formattedExchanges}
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
        emptyMessage="No exchanges found"
        height={600}
      />

      {/* Exchange Detail Modal */}
      <ExchangeDetailModal
        open={detailModalOpen}
        onClose={handleCloseDetailModal}
        exchange={selectedExchange}
        clusterId={clusterId}
      />
    </Box>
  );
};

export default ExchangesList;
