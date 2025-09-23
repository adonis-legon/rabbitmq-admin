import React from "react";
import {
  Box,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  TextField,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
} from "@mui/icons-material";

export interface PaginationControlsProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onJumpToPage?: (page: number) => void;
  disabled?: boolean;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  page,
  pageSize,
  totalItems,
  totalPages,
  pageSizeOptions = [25, 50, 100, 200],
  onPageChange,
  onPageSizeChange,
  onJumpToPage,
  disabled = false,
}) => {
  const [jumpToPageValue, setJumpToPageValue] = React.useState<string>("");

  const handlePageSizeChange = (event: any) => {
    const newPageSize = parseInt(event.target.value, 10);
    onPageSizeChange(newPageSize);
  };

  const handleJumpToPage = () => {
    const pageNumber = parseInt(jumpToPageValue, 10);
    if (pageNumber >= 1 && pageNumber <= totalPages && onJumpToPage) {
      onJumpToPage(pageNumber - 1); // Convert to 0-based index
      setJumpToPageValue("");
    }
  };

  const handleJumpToPageKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleJumpToPage();
    }
  };

  const startItem = totalItems === 0 ? 0 : page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, totalItems);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 2,
        p: 2,
        borderTop: "1px solid rgba(224, 224, 224, 1)",
        backgroundColor: "rgba(0, 0, 0, 0.02)",
      }}
    >
      {/* Items info and page size selector */}
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}
      >
        <Typography variant="body2" color="text.secondary">
          Showing {startItem}-{endItem} of {totalItems} items
        </Typography>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Items per page</InputLabel>
          <Select
            value={pageSize}
            label="Items per page"
            onChange={handlePageSizeChange}
            disabled={disabled}
          >
            {pageSizeOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Pagination controls */}
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}
      >
        {/* Jump to page */}
        {onJumpToPage && totalPages > 1 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Go to page:
            </Typography>
            <TextField
              size="small"
              type="number"
              value={jumpToPageValue}
              onChange={(e) => setJumpToPageValue(e.target.value)}
              onKeyDown={handleJumpToPageKeyPress}
              onBlur={handleJumpToPage}
              inputProps={{
                min: 1,
                max: totalPages,
                style: { width: "60px", textAlign: "center" },
              }}
              disabled={disabled}
            />
          </Box>
        )}

        {/* First/Last page buttons */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Tooltip title="First page">
            <span>
              <IconButton
                onClick={() => onPageChange(0)}
                disabled={disabled || page === 0}
                size="small"
              >
                <FirstPageIcon />
              </IconButton>
            </span>
          </Tooltip>

          {/* Main pagination */}
          <Pagination
            count={totalPages}
            page={page + 1} // Convert from 0-based to 1-based
            onChange={(_, newPage) => onPageChange(newPage - 1)} // Convert back to 0-based
            disabled={disabled}
            showFirstButton={false}
            showLastButton={false}
            siblingCount={1}
            boundaryCount={1}
            size="small"
          />

          <Tooltip title="Last page">
            <span>
              <IconButton
                onClick={() => onPageChange(totalPages - 1)}
                disabled={disabled || page === totalPages - 1}
                size="small"
              >
                <LastPageIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
};

export default PaginationControls;
