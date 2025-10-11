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
  Typography,
  Collapse,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";

export interface FilterOption {
  value: string;
  label: string;
}

export interface ResourceFiltersProps {
  searchTerm: string;
  onSearchChange: (searchTerm: string) => void;
  stateFilter?: string[];
  onStateFilterChange?: (states: string[]) => void;
  stateOptions?: FilterOption[];
  typeFilter?: string[];
  onTypeFilterChange?: (types: string[]) => void;
  typeOptions?: FilterOption[];
  vhostFilter?: string;
  onVhostFilterChange?: (vhost: string) => void;
  vhostOptions?: FilterOption[];
  customFilters?: React.ReactNode;
  onClearFilters: () => void;
  disabled?: boolean;
  searchPlaceholder?: string;
  showAdvancedFilters?: boolean;
}

const ResourceFiltersComponent: React.FC<ResourceFiltersProps> = ({
  searchTerm,
  onSearchChange,
  stateFilter = [],
  onStateFilterChange,
  stateOptions = [],
  typeFilter = [],
  onTypeFilterChange,
  typeOptions = [],
  vhostFilter = "",
  onVhostFilterChange,
  vhostOptions = [],
  customFilters,
  onClearFilters,
  disabled = false,
  searchPlaceholder = "Search resources...",
  showAdvancedFilters = true,
}) => {
  const [searchValue, setSearchValue] = useState(searchTerm);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
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
    }, 500);

    setSearchTimeout(timeout);

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchValue]);

  // Update local search value when prop changes
  useEffect(() => {
    setSearchValue(searchTerm);
  }, [searchTerm]);

  const handleStateFilterChange = (event: any) => {
    const value = event.target.value;
    onStateFilterChange?.(typeof value === "string" ? value.split(",") : value);
  };

  const handleTypeFilterChange = (event: any) => {
    const value = event.target.value;
    onTypeFilterChange?.(typeof value === "string" ? value.split(",") : value);
  };

  const handleVhostFilterChange = (event: any) => {
    const value = event.target.value;
    onVhostFilterChange?.(value);
  };

  const hasActiveFilters =
    searchTerm || stateFilter.length > 0 || typeFilter.length > 0 || vhostFilter;

  const handleClearSearch = () => {
    setSearchValue("");
    onSearchChange("");
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      {/* Search and main controls */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          gap: { xs: 1, sm: 2 },
          mb: showAdvancedFilters ? 2 : 0,
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
          aria-label="Search resources"
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

        {/* Advanced filters toggle */}
        {showAdvancedFilters &&
          (stateOptions.length > 0 ||
            typeOptions.length > 0 ||
            vhostOptions.length > 0 ||
            customFilters) && (
            <Tooltip title="Advanced filters">
              <IconButton
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                disabled={disabled}
                sx={{
                  color: hasActiveFilters ? "primary.main" : "text.secondary",
                }}
              >
                <FilterListIcon />
                {filtersExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Tooltip>
          )}

        {/* Clear filters button */}
        {hasActiveFilters && (
          <Button
            variant="outlined"
            size="small"
            onClick={onClearFilters}
            disabled={disabled}
            startIcon={<ClearIcon />}
          >
            Clear Filters
          </Button>
        )}
      </Box>

      {/* Advanced filters */}
      {showAdvancedFilters && (
        <Collapse in={filtersExpanded}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              alignItems: "center",
            }}
          >
            {/* State filter */}
            {stateOptions.length > 0 && onStateFilterChange && (
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="state-filter-label">State</InputLabel>
                <Select
                  labelId="state-filter-label"
                  id="state-filter-select"
                  data-testid="state-filter-select"
                  multiple
                  value={stateFilter}
                  onChange={handleStateFilterChange}
                  input={<OutlinedInput label="State" />}
                  disabled={disabled}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => {
                        const option = stateOptions.find(
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
                  {stateOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Type filter */}
            {typeOptions.length > 0 && onTypeFilterChange && (
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="type-filter-label">Type</InputLabel>
                <Select
                  labelId="type-filter-label"
                  id="type-filter-select"
                  multiple
                  value={typeFilter}
                  onChange={handleTypeFilterChange}
                  input={<OutlinedInput label="Type" />}
                  disabled={disabled}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => {
                        const option = typeOptions.find(
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
                  {typeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Virtual Host filter */}
            {vhostOptions.length > 0 && onVhostFilterChange && (
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="vhost-filter-label">Virtual Host</InputLabel>
                <Select
                  labelId="vhost-filter-label"
                  id="vhost-filter-select"
                  value={vhostFilter}
                  onChange={handleVhostFilterChange}
                  input={<OutlinedInput label="Virtual Host" />}
                  disabled={disabled}
                >
                  <MenuItem value="">
                    <em>All Virtual Hosts</em>
                  </MenuItem>
                  {vhostOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Custom filters */}
            {customFilters}
          </Box>

          {/* Active filters summary */}
          {hasActiveFilters && (
            <Box
              sx={{
                mt: 2,
                pt: 2,
                borderTop: "1px solid rgba(224, 224, 224, 1)",
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Active filters:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {searchTerm && (
                  <Chip
                    label={`Search: "${searchTerm}"`}
                    size="small"
                    onDelete={handleClearSearch}
                    disabled={disabled}
                  />
                )}
                {stateFilter.map((state) => {
                  const option = stateOptions.find(
                    (opt) => opt.value === state
                  );
                  return (
                    <Chip
                      key={state}
                      label={`State: ${option?.label || state}`}
                      size="small"
                      onDelete={() => {
                        const newStates = stateFilter.filter(
                          (s) => s !== state
                        );
                        onStateFilterChange?.(newStates);
                      }}
                      disabled={disabled}
                    />
                  );
                })}
                {typeFilter.map((type) => {
                  const option = typeOptions.find((opt) => opt.value === type);
                  return (
                    <Chip
                      key={type}
                      label={`Type: ${option?.label || type}`}
                      size="small"
                      onDelete={() => {
                        const newTypes = typeFilter.filter((t) => t !== type);
                        onTypeFilterChange?.(newTypes);
                      }}
                      disabled={disabled}
                    />
                  );
                })}
                {vhostFilter && (
                  <Chip
                    label={`Virtual Host: ${vhostOptions.find((opt) => opt.value === vhostFilter)
                        ?.label || vhostFilter
                      }`}
                    size="small"
                    onDelete={() => {
                      onVhostFilterChange?.("");
                    }}
                    disabled={disabled}
                  />
                )}
              </Box>
            </Box>
          )}
        </Collapse>
      )}
    </Paper>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const ResourceFilters = React.memo(
  ResourceFiltersComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.searchTerm === nextProps.searchTerm &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.searchPlaceholder === nextProps.searchPlaceholder &&
      prevProps.showAdvancedFilters === nextProps.showAdvancedFilters &&
      prevProps.vhostFilter === nextProps.vhostFilter &&
      JSON.stringify(prevProps.stateFilter) ===
      JSON.stringify(nextProps.stateFilter) &&
      JSON.stringify(prevProps.typeFilter) ===
      JSON.stringify(nextProps.typeFilter) &&
      JSON.stringify(prevProps.stateOptions) ===
      JSON.stringify(nextProps.stateOptions) &&
      JSON.stringify(prevProps.typeOptions) ===
      JSON.stringify(nextProps.typeOptions) &&
      JSON.stringify(prevProps.vhostOptions) ===
      JSON.stringify(nextProps.vhostOptions)
    );
  }
);

export default ResourceFilters;
