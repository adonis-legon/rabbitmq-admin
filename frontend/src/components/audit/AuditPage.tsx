import React, { useState, useCallback, useEffect } from "react";
import {
  Box,
  Typography,
  Alert,
  Paper,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  History as HistoryIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { GridSortModel } from "@mui/x-data-grid";
import { useAuth } from "../auth/AuthProvider";
import { UserRole } from "../../types/auth";
import { useAuditRecords } from "../../hooks/useAuditRecords";
import { useClusters } from "../../hooks/useClusters";
import { useUsers } from "../../hooks/useUsers";
import { AuditFilterRequest } from "../../types/audit";
import AuditFilters from "./AuditFilters";
import AuditRecordsList from "./AuditRecordsList";
import AuditErrorBoundary from "./AuditErrorBoundary";
import AuditErrorDisplay from "./AuditErrorDisplay";
import AuditFallbackUI from "./AuditFallbackUI";
import Breadcrumbs from "../common/Breadcrumbs";
import AdminRoute from "../auth/AdminRoute";
import {
  AuditError,
  AuditFilterValidationError,
  createFilterValidationError,
} from "../../utils/auditErrorUtils";

export const AuditPage: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // State for filters and pagination
  const [filters, setFilters] = useState<AuditFilterRequest>({});
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showLocalTime, setShowLocalTime] = useState(true);
  const [filterValidationErrors, setFilterValidationErrors] = useState<
    AuditFilterValidationError[]
  >([]);

  // Hooks for data fetching
  const {
    data: auditData,
    loading: auditLoading,
    error: auditError,
    loadAuditRecords,
    refreshAuditRecords,
    clearError,
  } = useAuditRecords({
    autoRefresh: false, // Manual refresh for audit records
  });

  const { clusters, loading: clustersLoading } = useClusters();
  const { users, loading: usersLoading } = useUsers();

  // Load initial data
  useEffect(() => {
    if (isAuthenticated && user?.role === UserRole.ADMINISTRATOR) {
      loadAuditRecords(filters, page, pageSize, sortBy, sortDirection);
    }
  }, [
    isAuthenticated,
    user,
    loadAuditRecords,
    filters,
    page,
    pageSize,
    sortBy,
    sortDirection,
  ]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: AuditFilterRequest) => {
    setFilters(newFilters);
    setPage(0); // Reset to first page when filters change
  }, []);

  // Handle filter reset
  const handleFiltersReset = useCallback(() => {
    setFilters({});
    setPage(0);
  }, []);

  // Handle filter apply (for manual apply button)
  const handleFiltersApply = useCallback(() => {
    setPage(0);
    loadAuditRecords(filters, 0, pageSize, sortBy, sortDirection);
  }, [filters, pageSize, sortBy, sortDirection, loadAuditRecords]);

  // Handle pagination changes
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(0); // Reset to first page when page size changes
  }, []);

  // Handle sorting changes
  const handleSortChange = useCallback((sortModel: GridSortModel) => {
    if (sortModel.length > 0) {
      const sort = sortModel[0];
      setSortBy(sort.field);
      setSortDirection(sort.sort || "desc");
    } else {
      setSortBy("timestamp");
      setSortDirection("desc");
    }
    setPage(0); // Reset to first page when sort changes
  }, []);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    refreshAuditRecords();
  }, [refreshAuditRecords]);

  // Handle retry on error
  const handleRetry = useCallback(() => {
    clearError();
    loadAuditRecords(filters, page, pageSize, sortBy, sortDirection);
  }, [
    clearError,
    loadAuditRecords,
    filters,
    page,
    pageSize,
    sortBy,
    sortDirection,
  ]);

  // Handle timestamp display mode change
  const handleTimestampModeChange = useCallback((showLocal: boolean) => {
    setShowLocalTime(showLocal);
  }, []);

  // Handle filter validation errors
  const handleFilterValidationError = useCallback(
    (errors: AuditFilterValidationError[]) => {
      setFilterValidationErrors(errors);
    },
    []
  );

  // auditError is already an AuditError from the hook, no need to convert
  const enhancedAuditError: AuditError | null = auditError;

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Breadcrumb items
  const breadcrumbItems = [
    {
      label: "Management",
    },
    {
      label: "Audit Records",
      icon: <HistoryIcon sx={{ mr: 1 }} />,
    },
  ];

  return (
    <AdminRoute>
      <AuditErrorBoundary onRetry={handleRetry}>
        <Box sx={{ p: 3 }}>
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbItems} />

          {/* Page Header */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <HistoryIcon
                  sx={{ mr: 2, fontSize: 32, color: "primary.main" }}
                />
                <Box>
                  <Typography variant="h4" component="h1" gutterBottom>
                    Audit Records
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    View and filter all write operations performed on RabbitMQ
                    clusters
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={auditLoading}
                sx={{ minWidth: 120 }}
              >
                {auditLoading ? "Refreshing..." : "Refresh"}
              </Button>
            </Box>

            {/* Summary Information */}
            {auditData && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Showing {auditData.items.length} of {auditData.totalItems}{" "}
                  audit records
                  {auditData.totalPages > 1 && (
                    <>
                      {" "}
                      (Page {page + 1} of {auditData.totalPages})
                    </>
                  )}
                </Typography>
              </Alert>
            )}
          </Paper>

          {/* Filter Validation Errors */}
          {filterValidationErrors.length > 0 && (
            <AuditErrorDisplay
              error={createFilterValidationError(filterValidationErrors)}
              onClearError={() => setFilterValidationErrors([])}
              compact={true}
            />
          )}

          {/* Enhanced Error Display */}
          {enhancedAuditError && (
            <AuditErrorDisplay
              error={enhancedAuditError}
              onRetry={handleRetry}
              onClearError={clearError}
            />
          )}

          {/* Filters */}
          <AuditFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            clusters={clusters}
            users={users}
            disabled={auditLoading || clustersLoading || usersLoading}
            onReset={handleFiltersReset}
            onApply={handleFiltersApply}
            onValidationError={handleFilterValidationError}
          />

          {/* Audit Records List or Fallback UI */}
          {enhancedAuditError &&
            enhancedAuditError.auditErrorType === "audit_disabled" ? (
            <AuditFallbackUI
              type="disabled"
              onRefresh={handleRefresh}
              message="Audit logging is disabled on this system. Contact your administrator to enable audit logging."
            />
          ) : enhancedAuditError &&
            enhancedAuditError.auditErrorType === "authorization" ? (
            <AuditFallbackUI
              type="permission-denied"
              onRefresh={handleRefresh}
            />
          ) : enhancedAuditError && !enhancedAuditError.retryable ? (
            <AuditFallbackUI
              type="loading-failed"
              onRetry={handleRetry}
              onRefresh={handleRefresh}
              message={enhancedAuditError.message}
            />
          ) : !auditLoading && auditData && auditData.items.length === 0 ? (
            <AuditFallbackUI
              type="no-data"
              onRefresh={handleRefresh}
              message={
                Object.keys(filters).length > 0
                  ? "No audit records found matching the current filters. Try adjusting your filter criteria."
                  : "No audit records are available. This may be because audit logging was recently enabled or no write operations have been performed."
              }
            />
          ) : (
            <Paper sx={{ p: 2 }}>
              <AuditRecordsList
                data={auditData?.items || []}
                loading={auditLoading}
                error={null} // We handle errors above with AuditErrorDisplay
                totalRows={auditData?.totalItems}
                page={page}
                pageSize={pageSize}
                pageSizeOptions={[25, 50, 100, 200]}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                onSortChange={handleSortChange}
                emptyMessage={
                  Object.keys(filters).length > 0
                    ? "No audit records found matching the current filters"
                    : "No audit records found"
                }
                height={600}
                onRetry={handleRetry}
                showLocalTime={showLocalTime}
                onTimestampModeChange={handleTimestampModeChange}
              />
            </Paper>
          )}

          {/* Additional Information */}
          <Paper sx={{ p: 2, mt: 2, backgroundColor: "grey.50" }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Note:</strong> Audit records show all write operations
              performed on RabbitMQ clusters. Timestamps can be displayed in
              your local timezone or UTC using the toggle above the table. Only
              administrators can access audit records.
              {auditData?.totalItems && auditData.totalItems > 1000 && (
                <> Use filters to narrow down results for better performance.</>
              )}
            </Typography>
          </Paper>
        </Box>
      </AuditErrorBoundary>
    </AdminRoute>
  );
};

export default AuditPage;
