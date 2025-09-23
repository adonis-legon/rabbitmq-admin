import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Button,
  Paper,
  IconButton,
} from "@mui/material";
import { Search as SearchIcon, Clear as ClearIcon } from "@mui/icons-material";

export interface FilterOption {
  value: string;
  label: string;
}

export interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (searchTerm: string) => void;
  filterValue?: string[];
  onFilterChange?: (values: string[]) => void;
  filterOptions?: FilterOption[];
  filterLabel?: string;
  onClearAll: () => void;
  disabled?: boolean;
  searchPlaceholder?: string;
}

const SearchAndFilterComponent: React.FC<SearchAndFilterProps> = ({
  searchTerm,
  onSearchChange,
  filterValue = [],
  onFilterChange,
  filterOptions = [],
  filterLabel = "Filter",
  onClearAll,
  disabled = false,
  searchPlaceholder = "Search...",
}) => {
  const [searchValue, setSearchValue] = useState(searchTerm);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Debounced search
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      onSearchChange(searchValue);
    }, 300);

    setSearchTimeout(timeout);

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchValue, onSearchChange]);

  // Update local search value when prop changes
  useEffect(() => {
    setSearchValue(searchTerm);
  }, [searchTerm]);

  const handleFilterChange = (event: any) => {
    const value = event.target.value;
    onFilterChange?.(typeof value === "string" ? value.split(",") : value);
  };

  const hasActiveFilters = searchTerm || filterValue.length > 0;

  const handleClearSearch = () => {
    setSearchValue("");
    onSearchChange("");
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          gap: { xs: 1, sm: 2 },
        }}
      >
        {/* Search field */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          disabled={disabled}
          aria-label="Search"
          InputProps={{
            startAdornment: (
              <SearchIcon
                sx={{ color: "text.secondary", mr: 1 }}
                aria-hidden="true"
              />
            ),
            endAdornment: searchValue && (
              <IconButton
                size="small"
                onClick={handleClearSearch}
                disabled={disabled}
                aria-label="Clear search"
              >
                <ClearIcon />
              </IconButton>
            ),
          }}
          sx={{ maxWidth: { xs: "100%", sm: 400 } }}
        />

        {/* Filter dropdown */}
        {filterOptions.length > 0 && onFilterChange && (
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id={`${filterLabel.toLowerCase()}-filter-label`}>
              {filterLabel}
            </InputLabel>
            <Select
              labelId={`${filterLabel.toLowerCase()}-filter-label`}
              multiple
              value={filterValue}
              onChange={handleFilterChange}
              input={<OutlinedInput label={filterLabel} />}
              disabled={disabled}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => {
                    const option = filterOptions.find(
                      (opt) => opt.value === value
                    );
                    return (
                      <Chip
                        key={value}
                        label={option?.label || value}
                        size="small"
                      />
                    );
                  })}
                </Box>
              )}
            >
              {filterOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Clear filters button */}
        {hasActiveFilters && (
          <Button
            variant="outlined"
            size="small"
            onClick={onClearAll}
            disabled={disabled}
            startIcon={<ClearIcon />}
          >
            Clear All
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export const SearchAndFilter = React.memo(SearchAndFilterComponent);

export default SearchAndFilter;
