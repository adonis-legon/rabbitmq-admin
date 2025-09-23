import React from 'react';
import {
  Box,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';

export interface ResourceSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  showFilters?: boolean;
  showPagination?: boolean;
  height?: number | string;
}

export const ResourceSkeleton: React.FC<ResourceSkeletonProps> = ({
  rows = 10,
  columns = 5,
  showHeader = true,
  showFilters = true,
  showPagination = true,
  height = 'auto'
}) => {
  return (
    <Box>
      {/* Filters skeleton */}
      {showFilters && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Skeleton variant="rectangular" width={300} height={40} />
            <Skeleton variant="circular" width={40} height={40} />
            <Skeleton variant="rectangular" width={120} height={40} />
          </Box>
        </Paper>
      )}

      {/* Refresh controls skeleton */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
          borderRadius: 1,
          mb: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Skeleton variant="rectangular" width={100} height={36} />
          <Skeleton variant="text" width={150} height={20} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Skeleton variant="rectangular" width={120} height={36} />
          <Skeleton variant="rectangular" width={80} height={36} />
        </Box>
      </Box>

      {/* Table skeleton */}
      <TableContainer component={Paper} sx={{ height }}>
        <Table stickyHeader>
          {showHeader && (
            <TableHead>
              <TableRow>
                {Array.from({ length: columns }).map((_, index) => (
                  <TableCell key={index}>
                    <Skeleton variant="text" width="80%" height={24} />
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
          )}
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <Skeleton
                      variant="text"
                      width={colIndex === 0 ? '60%' : '80%'}
                      height={20}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination skeleton */}
      {showPagination && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderTop: '1px solid rgba(224, 224, 224, 1)',
            backgroundColor: 'rgba(0, 0, 0, 0.02)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Skeleton variant="text" width={150} height={20} />
            <Skeleton variant="rectangular" width={120} height={32} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton variant="rectangular" width={200} height={32} />
            <Skeleton variant="circular" width={32} height={32} />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ResourceSkeleton;