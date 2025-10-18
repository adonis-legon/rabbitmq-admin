import React, { useState, useCallback, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { getIcon, IconSizes } from "../../utils/icons";
import { GridSortModel } from "@mui/x-data-grid";
// Authentication handled by AdminRoute wrapper
import { useAuth } from "../auth/AuthProvider";
import { useAuditRecords } from "../../hooks/useAuditRecords";
import { useClusters } from "../../hooks/useClusters";
// TEMPORARY: Commented out to test 401 theory
// import { useUsers } from "../../hooks/useUsers";
import { tokenService } from "../../services/auth/tokenService";
import { AuditFilterRequest, AuditRecord } from "../../types/audit";
import AuditFilters from "./AuditFilters";
import AuditRecordsList from "./AuditRecordsList";
import AuditDetailModal from "./AuditDetailModal";
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
  // Authentication is handled by AdminRoute wrapper, so no need to check here
  // But we need to wait for authentication to be confirmed before making API calls
  const { user, isAuthenticated, isLoading } = useAuth();

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
  const [selectedAuditRecord, setSelectedAuditRecord] = useState<AuditRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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

  // Load clusters available to the current admin user
  const { clusters, loading: clustersLoading } = useClusters();
  // TEMPORARY: Commented out users hook to test 401 theory  
  // const { users, loading: usersLoading } = useUsers();
  const users: any[] = [];
  const usersLoading = false;

  // Load initial data - wait for authentication before making API calls
  useEffect(() => {
    const hasValidToken = tokenService.hasValidToken();

    // Only load audit records if ALL conditions are met:
    // 1. User is authenticated
    // 2. Not in loading state  
    // 3. User object exists
    // 4. Valid token exists (not null and not expired)
    // 5. User has ADMINISTRATOR role
    if (isAuthenticated && !isLoading && user && hasValidToken && user.role === 'ADMINISTRATOR') {

      // Double-check token one more time before making the call
      if (tokenService.hasValidToken()) {
        loadAuditRecords(filters, page, pageSize, sortBy, sortDirection);
      }
    }
  }, [loadAuditRecords, filters, page, pageSize, sortBy, sortDirection, isAuthenticated, isLoading, user]);

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
    // Only apply filters if authentication is ready
    if (!isAuthenticated || isLoading || !user || user.role !== 'ADMINISTRATOR') {
      return;
    }

    setPage(0);
    loadAuditRecords(filters, 0, pageSize, sortBy, sortDirection);
  }, [filters, pageSize, sortBy, sortDirection, loadAuditRecords, isAuthenticated, user, isLoading]);

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
    // Only refresh if authentication is ready
    if (!isAuthenticated || !user || isLoading) {
      return;
    }

    refreshAuditRecords();
  }, [refreshAuditRecords, isAuthenticated, user, isLoading]);

  // Handle retry on error
  const handleRetry = useCallback(() => {
    // Only retry if authentication is ready
    if (!isAuthenticated || !user || isLoading) {
      return;
    }

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
    isAuthenticated,
    user,
    isLoading,
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

  // Handle audit record row click to open modal
  const handleAuditRecordClick = useCallback((record: AuditRecord) => {
    setSelectedAuditRecord(record);
    setModalOpen(true);
  }, []);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setSelectedAuditRecord(null);
  }, []);

  // auditError is already an AuditError from the hook, no need to convert
  const enhancedAuditError: AuditError | null = auditError;

  // AdminRoute handles authentication loading, so no need for separate loading check

  // Breadcrumb items
  const breadcrumbItems = [
    {
      label: "Management",
      icon: getIcon("management", {
        fontSize: IconSizes.breadcrumb,
        sx: { mr: 0.5 },
      }),
    },
    {
      label: "Audits",
      icon: getIcon("audit", {
        fontSize: IconSizes.breadcrumb,
        sx: { mr: 0.5 },
      }),
    },
  ];

  return (
    <AdminRoute>
      <AuditErrorBoundary onRetry={handleRetry}>
        <Box sx={{ mt: { xs: 1, sm: 2 }, mb: 4, px: { xs: 1, sm: 3 } }}>
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbItems} />

          {/* Header */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography variant="h4" component="h1">
              Audits
            </Typography>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={auditLoading}
              >
                {auditLoading ? "Refreshing..." : "Refresh"}
              </Button>
            </Box>
          </Box>

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
                onRowClick={handleAuditRecordClick}
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

        {/* Audit Detail Modal */}
        <AuditDetailModal
          record={selectedAuditRecord}
          open={modalOpen}
          onClose={handleModalClose}
          showLocalTime={showLocalTime}
        />
      </AuditErrorBoundary>
    </AdminRoute>
  );
};

export default AuditPage;
