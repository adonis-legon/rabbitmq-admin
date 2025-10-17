import React from "react";
import { Box, Paper, Skeleton, Typography, Alert } from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRowParams,
  GridPaginationModel,
  GridSortModel,
  GridFilterModel,
  GridToolbar,
  GridColumnResizeParams,
} from "@mui/x-data-grid";

export interface ResourceTableProps<T = any> {
  data: T[];
  columns: GridColDef[];
  loading?: boolean;
  error?: string | null;
  totalRows?: number;
  page?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSortChange?: (sortModel: GridSortModel) => void;
  onFilterChange?: (filterModel: GridFilterModel) => void;
  onRowClick?: (params: GridRowParams) => void;
  getRowId?: (row: T) => string | number;
  emptyMessage?: string;
  height?: number | string;
  disableColumnFilter?: boolean;
  disableColumnMenu?: boolean;
  disableColumnResize?: boolean;
  disableRowSelectionOnClick?: boolean;
  onColumnResize?: (params: GridColumnResizeParams) => void;
  onColumnWidthChange?: (params: GridColumnResizeParams) => void;
  // Sorting mode - 'server' for server-side sorting, 'client' for client-side sorting
  sortingMode?: 'server' | 'client';
}

const ResourceTableComponent = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  error = null,
  totalRows,
  page = 0,
  pageSize = 50,
  pageSizeOptions = [25, 50, 100, 200],
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onFilterChange,
  onRowClick,
  getRowId,
  emptyMessage = "No data available",
  height = 600,
  disableColumnFilter = false,
  disableColumnMenu = false,
  disableColumnResize = false,
  disableRowSelectionOnClick = true,
  onColumnResize,
  onColumnWidthChange,
  // Sorting mode
  sortingMode = "server",
}: ResourceTableProps<T>) => {
  const handlePaginationModelChange = (model: GridPaginationModel) => {
    if (model.page !== page && onPageChange) {
      onPageChange(model.page);
    }
    if (model.pageSize !== pageSize && onPageSizeChange) {
      onPageSizeChange(model.pageSize);
    }
  };

  // Show error state
  if (error) {
    return (
      <Paper sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  // Show loading skeleton
  if (loading && data.length === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Skeleton variant="text" width="30%" height={32} />
        </Box>
        {Array.from({ length: 5 }).map((_, index) => (
          <Box key={index} sx={{ display: "flex", gap: 2, mb: 1 }}>
            <Skeleton variant="text" width="20%" height={24} />
            <Skeleton variant="text" width="25%" height={24} />
            <Skeleton variant="text" width="15%" height={24} />
            <Skeleton variant="text" width="20%" height={24} />
            <Skeleton variant="text" width="20%" height={24} />
          </Box>
        ))}
      </Paper>
    );
  }

  // Show empty state
  if (!loading && data.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {emptyMessage}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No resources found matching your criteria.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        height: { xs: 400, sm: 500, md: height },
        width: "100%",
      }}
      role="region"
      aria-label="Resource data table"
    >
      <DataGrid
        rows={data}
        columns={columns}
        loading={loading}
        paginationMode="server"
        sortingMode={sortingMode}
        filterMode="server"
        rowCount={totalRows || data.length}
        paginationModel={{
          page,
          pageSize,
        }}
        pageSizeOptions={pageSizeOptions}
        onPaginationModelChange={handlePaginationModelChange}
        onSortModelChange={onSortChange}
        onFilterModelChange={onFilterChange}
        onRowClick={onRowClick}
        getRowId={getRowId}
        disableRowSelectionOnClick={disableRowSelectionOnClick}
        disableColumnFilter={disableColumnFilter}
        disableColumnMenu={disableColumnMenu}
        disableColumnResize={disableColumnResize}
        onColumnResize={onColumnResize}
        onColumnWidthChange={onColumnWidthChange}
        slots={{
          toolbar: GridToolbar,
        }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
          },
        }}
        sx={{
          border: 0,
          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid rgba(224, 224, 224, 1)",
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "rgba(0, 0, 0, 0.04)",
            borderBottom: "2px solid rgba(224, 224, 224, 1)",
          },
          "& .MuiDataGrid-columnSeparator": {
            cursor: "col-resize !important",
            "&:hover": {
              cursor: "col-resize !important",
            },
          },
        }}
      />
    </Paper>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const ResourceTable = React.memo(
  ResourceTableComponent,
  (prevProps, nextProps) => {
    // Custom comparison function for better performance
    return (
      prevProps.loading === nextProps.loading &&
      prevProps.error === nextProps.error &&
      prevProps.page === nextProps.page &&
      prevProps.pageSize === nextProps.pageSize &&
      prevProps.totalRows === nextProps.totalRows &&
      JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
      JSON.stringify(prevProps.columns) === JSON.stringify(nextProps.columns)
    );
  }
) as <T extends Record<string, any>>(
  props: ResourceTableProps<T>
) => JSX.Element;

export default ResourceTable;
