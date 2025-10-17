import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  SwapHoriz as DirectIcon,
  Radio as FanoutIcon,
  AccountTree as TopicIcon,
  ViewList as HeadersIcon,
  Info as InfoIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Link as LinkIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { GridColDef, GridRowParams } from "@mui/x-data-grid";
import {
  RabbitMQExchange,
  ResourceFilters as ResourceFiltersType,
} from "../../types/rabbitmq";
import { useExchanges } from "../../hooks/useExchanges";
import { useWriteOperationNotifications } from "../../hooks/useWriteOperationNotifications";
import { useAutoRefreshPreferences } from "../../hooks/useAutoRefreshPreferences";
import { useVirtualHosts } from "../../hooks/useVirtualHosts";
import { rabbitmqResourcesApi } from "../../services/api/rabbitmqResourcesApi";
import ResourceTable from "./shared/ResourceTable";
import ResourceFilters from "./shared/ResourceFilters";
import RefreshControls from "./shared/RefreshControls";
import ExchangeDetailModal from "./ExchangeDetailModal";
import CreateExchangeDialog from "./CreateExchangeDialog";
import CreateBindingDialog from "./CreateBindingDialog";
import PublishMessageDialog from "./PublishMessageDialog";
import DeleteConfirmationDialog, {
  DeleteOptions,
} from "../common/DeleteConfirmationDialog";

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
    vhost: "",
  });

  const { autoRefresh, refreshInterval, setAutoRefresh, setRefreshInterval } =
    useAutoRefreshPreferences({
      storageKey: 'rabbitmq-admin-exchanges-autorefresh',
      defaultInterval: 30,
      defaultEnabled: false,
    });
  const [selectedExchange, setSelectedExchange] =
    useState<RabbitMQExchange | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Dialog states
  const [createExchangeDialogOpen, setCreateExchangeDialogOpen] =
    useState(false);
  const [createBindingDialogOpen, setCreateBindingDialogOpen] = useState(false);
  const [publishMessageDialogOpen, setPublishMessageDialogOpen] =
    useState(false);
  const [deleteConfirmationDialogOpen, setDeleteConfirmationDialogOpen] =
    useState(false);

  // Action menu state
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [actionMenuExchange, setActionMenuExchange] =
    useState<RabbitMQExchange | null>(null);

  // Loading states for write operations
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { notifyExchangeDeleted, notifyOperationError } =
    useWriteOperationNotifications();

  // Virtual hosts hook for vhost filtering
  const { virtualHosts, loading: vhostsLoading } = useVirtualHosts(clusterId);

  // Transform virtual hosts to filter options
  const vhostOptions = useMemo(() => {
    return virtualHosts.map(vhost => ({
      value: vhost.name,
      label: vhost.name === "/" ? "/ (default)" : vhost.name
    }));
  }, [virtualHosts]);

  const {
    data,
    loading,
    error: exchangesError,
    lastUpdated,
    loadExchanges,
    refreshExchanges,
    clearError,
  } = useExchanges({
    autoRefresh,
    refreshInterval: refreshInterval * 1000,
  });

  const handleRefresh = useCallback(() => {
    refreshExchanges();
  }, [refreshExchanges]);

  // Load exchanges when clusterId or filters change
  useEffect(() => {
    if (clusterId) {
      loadExchanges(clusterId, {
        page: filters.page,
        pageSize: filters.pageSize,
        name: filters.searchTerm || undefined,
        vhost: filters.vhost || undefined,
        useRegex: false,
      });
    }
  }, [
    clusterId,
    filters.page,
    filters.pageSize,
    filters.searchTerm,
    filters.vhost,
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

  const handleVhostFilterChange = useCallback((vhost: string) => {
    setFilters((prev) => ({ ...prev, page: 0, vhost }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      page: 0,
      pageSize: 50,
      searchTerm: "",
      stateFilter: [],
      typeFilter: [],
      vhost: "",
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

  // Action menu handlers
  const handleActionMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>, exchange: RabbitMQExchange) => {
      event.stopPropagation();
      // Close any open dialogs first
      setCreateBindingDialogOpen(false);
      setPublishMessageDialogOpen(false);
      setDeleteConfirmationDialogOpen(false);

      setActionMenuAnchor(event.currentTarget);
      setActionMenuExchange(exchange);
    },
    []
  );

  const handleActionMenuClose = useCallback(() => {
    setActionMenuAnchor(null);
    // Don't clear actionMenuExchange here as dialogs need it
  }, []);

  // Dialog handlers
  const handleCreateExchangeOpen = useCallback(() => {
    setCreateExchangeDialogOpen(true);
  }, []);

  const handleCreateExchangeClose = useCallback(() => {
    setCreateExchangeDialogOpen(false);
  }, []);

  const handleCreateExchangeSuccess = useCallback(() => {
    handleRefresh();
  }, [handleRefresh]);

  const handleCreateBindingOpen = useCallback(() => {
    setCreateBindingDialogOpen(true);
    handleActionMenuClose();
  }, [handleActionMenuClose]);

  const handleCreateBindingClose = useCallback(() => {
    setCreateBindingDialogOpen(false);
    setActionMenuExchange(null);
  }, []);

  const handleCreateBindingSuccess = useCallback(() => {
    // Refresh exchanges to update binding counts if needed
    handleRefresh();
  }, [handleRefresh]);

  const handlePublishMessageOpen = useCallback(() => {
    setPublishMessageDialogOpen(true);
    handleActionMenuClose();
  }, [handleActionMenuClose]);

  const handlePublishMessageClose = useCallback(() => {
    setPublishMessageDialogOpen(false);
    setActionMenuExchange(null);
  }, []);

  const handlePublishMessageSuccess = useCallback(() => {
    // No need to refresh for message publishing
  }, []);

  const handleDeleteExchangeOpen = useCallback(() => {
    setDeleteConfirmationDialogOpen(true);
    handleActionMenuClose();
  }, [handleActionMenuClose]);

  const handleDeleteExchangeClose = useCallback(() => {
    setDeleteConfirmationDialogOpen(false);
    setActionMenuExchange(null);
  }, []);

  const handleDeleteExchangeConfirm = useCallback(
    async (options: DeleteOptions) => {
      if (!actionMenuExchange) return;

      try {
        setDeleteLoading(true);
        await rabbitmqResourcesApi.deleteExchange(
          clusterId,
          actionMenuExchange.vhost,
          actionMenuExchange.name,
          options.ifUnused
        );
        notifyExchangeDeleted(actionMenuExchange.name, options.ifUnused);
        handleRefresh();
      } catch (err: any) {
        console.error("Error deleting exchange:", err);
        notifyOperationError(
          "delete",
          "Exchange",
          actionMenuExchange.name,
          err
        );
        throw err; // Re-throw to prevent dialog from closing
      } finally {
        setDeleteLoading(false);
      }
    },
    [
      actionMenuExchange,
      clusterId,
      notifyExchangeDeleted,
      notifyOperationError,
      handleRefresh,
    ]
  );

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
            handleActionMenuOpen(event, params.row as RabbitMQExchange)
          }
          aria-label={`Actions for exchange ${params.row.name}`}
        >
          <MoreVertIcon />
        </IconButton>
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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateExchangeOpen}
            disabled={loading}
          >
            Create Exchange
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

      {exchangesError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            exchangesError.retryable && (
              <Button color="inherit" size="small" onClick={handleRetry}>
                Retry
              </Button>
            )
          }
        >
          <Typography variant="body2" fontWeight="medium">
            {exchangesError.message}
          </Typography>
          {exchangesError.details && (
            <Typography variant="caption" display="block">
              {exchangesError.details}
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
        vhostFilter={filters.vhost}
        onVhostFilterChange={handleVhostFilterChange}
        vhostOptions={vhostOptions}
        onClearFilters={handleClearFilters}
        searchPlaceholder="Search exchanges by name..."
        disabled={loading || vhostsLoading}
      />

      <ResourceTable
        data={formattedExchanges}
        columns={columns}
        loading={loading}
        error={exchangesError?.message || null}
        totalRows={data?.totalItems}
        page={filters.page}
        pageSize={filters.pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRowClick={handleRowClick}
        getRowId={(row) => row.id}
        emptyMessage="No exchanges found"
        height={600}
        sortingMode="client"
      />

      {/* Exchange Detail Modal */}
      <ExchangeDetailModal
        open={detailModalOpen}
        onClose={handleCloseDetailModal}
        exchange={selectedExchange}
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
        <MenuItem
          onClick={handleDeleteExchangeOpen}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Exchange</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create Exchange Dialog */}
      <CreateExchangeDialog
        open={createExchangeDialogOpen}
        clusterId={clusterId}
        onClose={handleCreateExchangeClose}
        onSuccess={handleCreateExchangeSuccess}
      />

      {/* Create Binding Dialog */}
      {actionMenuExchange && (
        <CreateBindingDialog
          open={createBindingDialogOpen}
          clusterId={clusterId}
          context="exchange"
          sourceResource={{
            name: actionMenuExchange.name,
            vhost: actionMenuExchange.vhost,
          }}
          onClose={handleCreateBindingClose}
          onSuccess={handleCreateBindingSuccess}
        />
      )}

      {/* Publish Message Dialog */}
      {actionMenuExchange && (
        <PublishMessageDialog
          open={publishMessageDialogOpen}
          clusterId={clusterId}
          context="exchange"
          targetResource={{
            name: actionMenuExchange.name,
            vhost: actionMenuExchange.vhost,
          }}
          onClose={handlePublishMessageClose}
          onSuccess={handlePublishMessageSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {actionMenuExchange && (
        <DeleteConfirmationDialog
          open={deleteConfirmationDialogOpen}
          onClose={handleDeleteExchangeClose}
          onConfirm={handleDeleteExchangeConfirm}
          deleteType="exchange"
          resourceName={actionMenuExchange.name}
          loading={deleteLoading}
        />
      )}
    </Box>
  );
};

export default ExchangesList;
