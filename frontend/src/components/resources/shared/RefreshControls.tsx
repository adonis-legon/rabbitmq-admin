import React from "react";
import {
  Box,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Chip,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";

export interface RefreshControlsProps {
  onRefresh: () => void;
  autoRefresh: boolean;
  onAutoRefreshChange: (enabled: boolean) => void;
  refreshInterval: number; // in seconds
  onRefreshIntervalChange: (interval: number) => void;
  loading?: boolean;
  lastUpdated?: Date;
  disabled?: boolean;
  showLastUpdated?: boolean;
}

const REFRESH_INTERVALS = [
  { value: 10, label: "10 seconds" },
  { value: 30, label: "30 seconds" },
  { value: 60, label: "1 minute" },
  { value: 300, label: "5 minutes" },
  { value: 600, label: "10 minutes" },
];

const RefreshControlsComponent: React.FC<RefreshControlsProps> = ({
  onRefresh,
  autoRefresh,
  onAutoRefreshChange,
  refreshInterval,
  onRefreshIntervalChange,
  loading = false,
  lastUpdated,
  disabled = false,
  showLastUpdated = true,
}) => {
  const handleAutoRefreshChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onAutoRefreshChange(event.target.checked);
  };

  const handleIntervalChange = (event: any) => {
    onRefreshIntervalChange(parseInt(event.target.value, 10));
  };

  const formatLastUpdated = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleString();
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: { xs: 1, sm: 2 },
        flexWrap: "wrap",
        justifyContent: { xs: "center", sm: "flex-start" },
      }}
    >
      {/* Last updated indicator */}
      {showLastUpdated && lastUpdated && (
        <Chip
          icon={<ScheduleIcon />}
          label={`Updated ${formatLastUpdated(lastUpdated)}`}
          size="small"
          variant="outlined"
          color="default"
        />
      )}

      {/* Manual refresh button */}
      <Tooltip title="Refresh data">
        <span>
          <IconButton
            onClick={onRefresh}
            disabled={disabled || loading}
            color="primary"
            size="small"
          >
            <RefreshIcon
              sx={{
                animation: loading ? "spin 1s linear infinite" : "none",
                "@keyframes spin": {
                  "0%": { transform: "rotate(0deg)" },
                  "100%": { transform: "rotate(360deg)" },
                },
              }}
            />
          </IconButton>
        </span>
      </Tooltip>

      {/* Auto-refresh toggle */}
      <FormControlLabel
        control={
          <Switch
            checked={autoRefresh}
            onChange={handleAutoRefreshChange}
            disabled={disabled}
            size="small"
          />
        }
        label={
          <Typography variant="body2" color="text.secondary">
            Auto-refresh
          </Typography>
        }
      />

      {/* Refresh interval selector */}
      {autoRefresh && (
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Interval</InputLabel>
          <Select
            value={refreshInterval}
            label="Interval"
            onChange={handleIntervalChange}
            disabled={disabled}
          >
            {REFRESH_INTERVALS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Auto-refresh status indicator */}
      {autoRefresh && (
        <Chip
          label={`Auto-refreshing every ${refreshInterval}s`}
          size="small"
          color="primary"
          variant="outlined"
        />
      )}
    </Box>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const RefreshControls = React.memo(
  RefreshControlsComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.loading === nextProps.loading &&
      prevProps.autoRefresh === nextProps.autoRefresh &&
      prevProps.refreshInterval === nextProps.refreshInterval &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.showLastUpdated === nextProps.showLastUpdated &&
      prevProps.lastUpdated?.getTime() === nextProps.lastUpdated?.getTime()
    );
  }
);

export default RefreshControls;
