import React, { useCallback, useMemo, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Chip,
  Tooltip,
  Alert,
  Button,
} from "@mui/material";
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as PartialIcon,
  Info as InfoIcon,
  Person as UserIcon,
  Storage as ClusterIcon,
} from "@mui/icons-material";
import { GridColDef, GridRowParams, GridSortModel } from "@mui/x-data-grid";
import {
  AuditRecord,
  AuditOperationType,
  AuditOperationStatus,
} from "../../types/audit";
import { ResourceError } from "../../types/rabbitmq";
import ResourceTable from "../resources/shared/ResourceTable";
import TimestampToggle from "../common/TimestampToggle";
import {
  formatTimestamp,
  formatTimestampForTable,
  getRelativeTime,
  DEFAULT_TIMESTAMP_OPTIONS,
} from "../../utils/timestampUtils";

export interface AuditRecordsListProps {
  /** Array of audit records to display */
  data: AuditRecord[];
  /** Whether data is currently loading */
  loading?: boolean;
  /** Error state for the audit records */
  error?: ResourceError | null;
  /** Total number of records (for pagination) */
  totalRows?: number;
  /** Current page number (0-based) */
  page?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  /** Callback when page size changes */
  onPageSizeChange?: (pageSize: number) => void;
  /** Callback when sort changes */
  onSortChange?: (sortModel: GridSortModel) => void;
  /** Callback when row is clicked */
  onRowClick?: (record: AuditRecord) => void;
  /** Custom empty message */
  emptyMessage?: string;
  /** Table height */
  height?: number | string;
  /** Callback for retry action */
  onRetry?: () => void;
  /** Whether to show local time by default */
  showLocalTime?: boolean;
  /** Callback when timestamp display mode changes */
  onTimestampModeChange?: (showLocal: boolean) => void;
}

const AuditRecordsList: React.FC<AuditRecordsListProps> = ({
  data,
  loading = false,
  error = null,
  totalRows,
  page = 0,
  pageSize = 50,
  pageSizeOptions = [25, 50, 100, 200],
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onRowClick,
  emptyMessage = "No audit records found",
  height = 600,
  onRetry,
  showLocalTime = true,
  onTimestampModeChange,
}) => {
  const [internalShowLocal, setInternalShowLocal] = useState(showLocalTime);

  // Sync internal state with prop changes
  useEffect(() => {
    setInternalShowLocal(showLocalTime);
  }, [showLocalTime]);

  const handleRowClick = useCallback(
    (params: GridRowParams) => {
      const record = params.row as AuditRecord;
      if (onRowClick) {
        onRowClick(record);
      }
    },
    [onRowClick]
  );

  const handleTimestampModeChange = useCallback(
    (showLocal: boolean) => {
      setInternalShowLocal(showLocal);
      if (onTimestampModeChange) {
        onTimestampModeChange(showLocal);
      }
    },
    [onTimestampModeChange]
  );





  // Get status icon and color
  const getStatusIcon = (status: AuditOperationStatus) => {
    switch (status) {
      case AuditOperationStatus.SUCCESS:
        return <SuccessIcon fontSize="small" color="success" />;
      case AuditOperationStatus.FAILURE:
        return <ErrorIcon fontSize="small" color="error" />;
      case AuditOperationStatus.PARTIAL:
        return <PartialIcon fontSize="small" color="warning" />;
      default:
        return <InfoIcon fontSize="small" color="info" />;
    }
  };

  const getStatusColor = (
    status: AuditOperationStatus
  ): "success" | "error" | "warning" | "info" => {
    switch (status) {
      case AuditOperationStatus.SUCCESS:
        return "success";
      case AuditOperationStatus.FAILURE:
        return "error";
      case AuditOperationStatus.PARTIAL:
        return "warning";
      default:
        return "info";
    }
  };

  // Format operation type for display
  const formatOperationType = (operationType: AuditOperationType): string => {
    return operationType
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const columns: GridColDef[] = useMemo(() => [
    {
      field: "timestamp",
      headerName: "Timestamp",
      width: 180,
      renderCell: (params) => {
        const formatted = formatTimestampForTable(
          params.value,
          internalShowLocal,
          DEFAULT_TIMESTAMP_OPTIONS
        );
        const utcFormatted = formatTimestamp(
          params.value,
          false,
          DEFAULT_TIMESTAMP_OPTIONS
        );
        const localFormatted = formatTimestamp(
          params.value,
          true,
          DEFAULT_TIMESTAMP_OPTIONS
        );

        return (
          <Tooltip
            title={
              <Box>
                <Typography variant="body2">Local: {localFormatted}</Typography>
                <Typography variant="body2">UTC: {utcFormatted}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {getRelativeTime(params.value)}
                </Typography>
              </Box>
            }
          >
            <Box sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-start",
              height: "100%",
              gap: 0.25,
              py: 0.5
            }}>
              <Typography
                variant="body2"
                fontWeight="medium"
                sx={{ lineHeight: 1.2 }}
              >
                {formatted.date}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ lineHeight: 1.1 }}
              >
                {formatted.time}
              </Typography>
            </Box>
          </Tooltip>
        );
      },
    },
    {
      field: "username",
      headerName: "User",
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <UserIcon fontSize="small" color="action" />
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: "clusterName",
      headerName: "Cluster",
      width: 140,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ClusterIcon fontSize="small" color="action" />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: "operationType",
      headerName: "Operation",
      width: 160,
      renderCell: (params) => (
        <Chip
          label={formatOperationType(params.value)}
          size="small"
          variant="outlined"
          color="primary"
        />
      ),
    },
    {
      field: "resourceType",
      headerName: "Resource Type",
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ textTransform: "capitalize" }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: "resourceName",
      headerName: "Resource",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <Typography
            variant="body2"
            fontWeight="medium"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {params.value}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {getStatusIcon(params.value)}
          <Chip
            label={params.value.charAt(0) + params.value.slice(1).toLowerCase()}
            color={getStatusColor(params.value)}
            size="small"
            variant="outlined"
          />
        </Box>
      ),
    },
  ], [
    internalShowLocal,
    getStatusIcon
  ]);

  // Format data for display with expanded row support
  const formattedData = data.map((record) => ({
    ...record,
    id: record.id, // Use record ID for DataGrid
  }));

  return (
    <Box>
      {/* Timestamp Display Mode Toggle */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <TimestampToggle
          showLocal={internalShowLocal}
          onChange={handleTimestampModeChange}
          size="small"
          disabled={loading}
        />
      </Box>

      {/* Pagination Status Display for Tests */}
      {!loading && !error && data.length > 0 && totalRows !== undefined && (
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary">
            {totalRows === data.length ? (
              `Showing ${totalRows} of ${totalRows} audit records`
            ) : (
              `Showing ${pageSize} of ${totalRows} audit records (Page ${page + 1} of ${Math.ceil(totalRows / pageSize)})`
            )}
          </Typography>
        </Box>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            error.retryable &&
            onRetry && (
              <Button color="inherit" size="small" onClick={onRetry}>
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

      <ResourceTable
        key={`audit-table-${internalShowLocal ? 'local' : 'utc'}`}
        data={formattedData}
        columns={columns}
        loading={loading}
        error={null}
        totalRows={totalRows}
        page={page}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        onSortChange={onSortChange}
        onRowClick={handleRowClick}
        getRowId={(row) => row.id}
        emptyMessage={emptyMessage}
        height={height}
        rowHeight={64}
        disableRowSelectionOnClick={true}
      />
    </Box>
  );
};

export default AuditRecordsList;
