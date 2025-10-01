import React, { useMemo } from "react";
import { Box, Paper, Typography, Alert, Skeleton } from "@mui/material";

export interface VirtualizedColumn<T> {
  key: keyof T;
  label: string;
  width: number;
  render?: (value: any, row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
}

export interface VirtualizedResourceTableProps<T> {
  data: T[];
  columns: VirtualizedColumn<T>[];
  loading?: boolean;
  error?: string | null;
  height?: number;
  itemHeight?: number;
  onRowClick?: (row: T, index: number) => void;
  emptyMessage?: string;
}

const VirtualizedResourceTableComponent = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  error = null,
  height: _height = 600,
  itemHeight: _itemHeight = 52,
  onRowClick: _onRowClick,
  emptyMessage = "No data available",
}: VirtualizedResourceTableProps<T>) => {
  const totalWidth = useMemo(() => {
    return columns.reduce((sum, col) => sum + col.width, 0);
  }, [columns]);

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
        {Array.from({ length: 8 }).map((_, index) => (
          <Box key={index} sx={{ display: "flex", gap: 2, mb: 1 }}>
            {columns.map((col, colIndex) => (
              <Skeleton
                key={colIndex}
                variant="text"
                width={`${(col.width / totalWidth) * 100}%`}
                height={24}
              />
            ))}
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
  // Placeholder for virtualized table
  return (
    <Paper sx={{ p: 4, textAlign: "center" }}>
      <Alert severity="info" sx={{ mb: 2 }}>
        Virtual scrolling is not yet available. Install react-window dependency
        to enable this feature.
      </Alert>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        VirtualizedResourceTable
      </Typography>
      <Typography variant="body2" color="text.secondary">
        This component will provide efficient rendering for large datasets once
        react-window is installed.
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Data items: {data.length}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Columns: {columns.length}
        </Typography>
      </Box>
    </Paper>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const VirtualizedResourceTable = React.memo(
  VirtualizedResourceTableComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.loading === nextProps.loading &&
      prevProps.error === nextProps.error &&
      prevProps.height === nextProps.height &&
      prevProps.itemHeight === nextProps.itemHeight &&
      prevProps.emptyMessage === nextProps.emptyMessage &&
      JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
      JSON.stringify(prevProps.columns) === JSON.stringify(nextProps.columns)
    );
  }
) as <T extends Record<string, any>>(
  props: VirtualizedResourceTableProps<T>
) => JSX.Element;

export default VirtualizedResourceTable;
