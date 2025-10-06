import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Grid,
  Typography,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  OutlinedInput,
  ListItemText,
  Checkbox,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import {
  AuditOperationType,
  AuditOperationStatus,
  AuditFilterRequest,
} from "../../types/audit";
import { ClusterConnection } from "../../types/cluster";
import { User } from "../../types/user";
import {
  validateAuditFilters,
  AuditFilterValidationError,
} from "../../utils/auditErrorUtils";

// Common RabbitMQ resource types for filtering
const RESOURCE_TYPES = [
  { value: "exchange", label: "Exchange" },
  { value: "queue", label: "Queue" },
  { value: "binding", label: "Binding" },
  { value: "message", label: "Message" },
] as const;

export interface AuditFiltersProps {
  /** Current filter values */
  filters: AuditFilterRequest;
  /** Callback when filters change */
  onFiltersChange: (filters: AuditFilterRequest) => void;
  /** Available clusters for filtering */
  clusters: ClusterConnection[];
  /** Available users for filtering */
  users: User[];
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Callback when filters are reset */
  onReset: () => void;
  /** Callback when filters are applied */
  onApply: () => void;
  /** Callback when validation errors occur */
  onValidationError?: (errors: AuditFilterValidationError[]) => void;
}

const AuditFilters: React.FC<AuditFiltersProps> = ({
  filters,
  onFiltersChange,
  clusters,
  disabled = false,
  onReset,
  onApply,
  onValidationError,
}) => {
  const [localFilters, setLocalFilters] = useState<AuditFilterRequest>(filters);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [validationErrors, setValidationErrors] = useState<
    AuditFilterValidationError[]
  >([]);
  const [expanded, setExpanded] = useState(false);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Debounced filter updates for text fields
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      onFiltersChange(localFilters);
    }, 300);

    setSearchTimeout(timeout);

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [localFilters.username, localFilters.resourceName, localFilters.resourceType]);

  const handleFilterChange = (field: keyof AuditFilterRequest, value: any) => {
    const newFilters = { ...localFilters, [field]: value || undefined };
    setLocalFilters(newFilters);

    // Validate the new filters
    const errors = validateAuditFilters(newFilters);
    setValidationErrors(errors);

    // Notify parent of validation errors
    if (onValidationError) {
      onValidationError(errors);
    }

    // For non-text fields, update immediately if no validation errors
    // For dates, also update immediately to handle clearing
    if (
      field !== "username" &&
      field !== "resourceName" &&
      field !== "resourceType" &&
      errors.length === 0
    ) {
      onFiltersChange(newFilters);
    }
  };

  const handleClearField = (field: keyof AuditFilterRequest) => {
    // Clear any pending search timeout to prevent debounced updates
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }

    const newFilters = { ...localFilters, [field]: undefined };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    const emptyFilters: AuditFilterRequest = {};
    setLocalFilters(emptyFilters);
    setValidationErrors([]);
    onFiltersChange(emptyFilters);
    onReset();
  };

  const handleApply = () => {
    // Validate filters before applying
    const errors = validateAuditFilters(localFilters);
    setValidationErrors(errors);

    if (errors.length === 0) {
      onFiltersChange(localFilters);
      onApply();
    } else if (onValidationError) {
      onValidationError(errors);
    }
  };

  const hasActiveFilters = Object.values(localFilters).some(
    (value) => value !== undefined && value !== null && value !== ""
  );

  // Helper function to get field-specific error
  const getFieldError = (fieldName: string): string | undefined => {
    const error = validationErrors.find((err) => err.field === fieldName);
    return error?.message;
  };

  // Helper function to check if field has error
  const hasFieldError = (fieldName: string): boolean => {
    return validationErrors.some((err) => err.field === fieldName);
  };

  // Convert operation type enum to display options
  const operationTypeOptions = Object.values(AuditOperationType).map(
    (type) => ({
      value: type,
      label: type
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase()),
    })
  );

  // Convert operation status enum to display options
  const operationStatusOptions = Object.values(AuditOperationStatus).map(
    (status) => ({
      value: status,
      label: status.charAt(0) + status.slice(1).toLowerCase(),
    })
  );

  // Format date for input (YYYY-MM-DDTHH:MM)
  const formatDateForInput = (dateString?: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Format date from input to ISO string
  const formatDateFromInput = (inputValue: string): string | undefined => {
    if (!inputValue) return undefined;
    // Create date in local timezone and convert to ISO string
    const date = new Date(inputValue);
    return date.toISOString();
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
      sx={{ mb: 2 }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <FilterIcon sx={{ mr: 1, color: "text.secondary" }} />
          <Typography variant="h6" component="h2">
            Audit Filters
          </Typography>
        </Box>
      </AccordionSummary>

      <AccordionDetails>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert severity="error" sx={{ mb: 3 }} icon={<WarningIcon />}>
            <Typography variant="subtitle2" gutterBottom>
              Filter Validation Errors:
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {validationErrors.map((error, index) => (
                <Typography key={index} variant="body2" component="li">
                  <strong>{error.field}:</strong> {error.message}
                </Typography>
              ))}
            </Box>
          </Alert>
        )}

        {/* Row 1: Username, Cluster, Operation Type, Status */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {/* Username Search */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Username"
              placeholder="Search by username..."
              value={localFilters.username || ""}
              onChange={(e) => handleFilterChange("username", e.target.value)}
              disabled={disabled}
              error={hasFieldError("username")}
              helperText={getFieldError("username")}
              inputProps={{
                "aria-label": "Username filter",
              }}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />
                ),
                endAdornment: localFilters.username && (
                  <IconButton
                    size="small"
                    onClick={() => handleClearField("username")}
                    disabled={disabled}
                    aria-label="Clear username filter"
                  >
                    <ClearIcon />
                  </IconButton>
                ),
              }}
            />
          </Grid>

          {/* Cluster Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="cluster-filter-label">Cluster</InputLabel>
              <Select
                labelId="cluster-filter-label"
                value={localFilters.clusterName || ""}
                onChange={(e) =>
                  handleFilterChange("clusterName", e.target.value)
                }
                label="Cluster"
                disabled={disabled}
              >
                <MenuItem value="">
                  <em>All Clusters</em>
                </MenuItem>
                {clusters.map((cluster) => (
                  <MenuItem key={cluster.id} value={cluster.name}>
                    {cluster.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Operation Type Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="operation-type-filter-label">
                Operation Type
              </InputLabel>
              <Select
                labelId="operation-type-filter-label"
                value={localFilters.operationType || ""}
                onChange={(e) =>
                  handleFilterChange("operationType", e.target.value)
                }
                label="Operation Type"
                disabled={disabled}
              >
                <MenuItem value="">
                  <em>All Operations</em>
                </MenuItem>
                {operationTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Operation Status Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="operation-status-filter-label">Status</InputLabel>
              <Select
                labelId="operation-status-filter-label"
                value={localFilters.status || ""}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                label="Status"
                disabled={disabled}
              >
                <MenuItem value="">
                  <em>All Statuses</em>
                </MenuItem>
                {operationStatusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Row 2: Resource Name, Resource Type, Start Date, End Date */}
        <Grid container spacing={2}>
          {/* Resource Name Search */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Resource Name"
              placeholder="Search by resource name..."
              value={localFilters.resourceName || ""}
              onChange={(e) => handleFilterChange("resourceName", e.target.value)}
              disabled={disabled}
              error={hasFieldError("resourceName")}
              helperText={getFieldError("resourceName")}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />
                ),
                endAdornment: localFilters.resourceName && (
                  <IconButton
                    size="small"
                    onClick={() => handleClearField("resourceName")}
                    disabled={disabled}
                    aria-label="Clear resource name filter"
                  >
                    <ClearIcon />
                  </IconButton>
                ),
              }}
            />
          </Grid>

          {/* Resource Type Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="resource-type-filter-label">Resource Type</InputLabel>
              <Select
                labelId="resource-type-filter-label"
                multiple
                value={Array.isArray(localFilters.resourceType) ? localFilters.resourceType : (localFilters.resourceType ? [localFilters.resourceType] : [])}
                onChange={(e) => {
                  const value = e.target.value;
                  const selectedTypes = typeof value === 'string' ? [value] : value;
                  handleFilterChange("resourceType", selectedTypes.length > 0 ? selectedTypes : undefined);
                }}
                input={<OutlinedInput label="Resource Type" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => {
                      const resourceType = RESOURCE_TYPES.find(rt => rt.value === value);
                      return (
                        <Chip
                          key={value}
                          label={resourceType?.label || value}
                          size="small"
                        />
                      );
                    })}
                  </Box>
                )}
                disabled={disabled}
                error={hasFieldError("resourceType")}
              >
                <MenuItem value="">
                  <em>All Resource Types</em>
                </MenuItem>
                {RESOURCE_TYPES.map((resourceType) => (
                  <MenuItem key={resourceType.value} value={resourceType.value}>
                    <Checkbox
                      checked={Array.isArray(localFilters.resourceType)
                        ? localFilters.resourceType.includes(resourceType.value)
                        : localFilters.resourceType === resourceType.value
                      }
                    />
                    <ListItemText primary={resourceType.label} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Start Date */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Start Date"
              type="datetime-local"
              value={formatDateForInput(localFilters.startTime)}
              onChange={(e) =>
                handleFilterChange(
                  "startTime",
                  formatDateFromInput(e.target.value)
                )
              }
              disabled={disabled}
              error={hasFieldError("startTime") || hasFieldError("dateRange")}
              helperText={
                getFieldError("startTime") || getFieldError("dateRange")
              }
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                max: formatDateForInput(localFilters.endTime) || undefined,
              }}
            />
          </Grid>

          {/* End Date */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="End Date"
              type="datetime-local"
              value={formatDateForInput(localFilters.endTime)}
              onChange={(e) =>
                handleFilterChange("endTime", formatDateFromInput(e.target.value))
              }
              disabled={disabled}
              error={hasFieldError("endDate") || hasFieldError("dateRange")}
              helperText={getFieldError("endDate") || getFieldError("dateRange")}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                min: formatDateForInput(localFilters.startTime) || undefined,
              }}
            />
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
            mt: 3,
            pt: 2,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          {hasActiveFilters && (
            <Button
              variant="outlined"
              onClick={handleReset}
              disabled={disabled}
              startIcon={<ClearIcon />}
            >
              Reset Filters
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleApply}
            disabled={disabled || validationErrors.length > 0}
            startIcon={<FilterIcon />}
          >
            Apply Filters
          </Button>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default AuditFilters;
