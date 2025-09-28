import React from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useVirtualHosts } from "../../hooks/useVirtualHosts";

interface VirtualHostSelectorProps {
  clusterId?: string;
  selectedVirtualHost: string | null;
  onVirtualHostSelect: (vhost: string) => void;
  disabled?: boolean;
  label?: string;
  showRefresh?: boolean;
}

const VirtualHostSelector: React.FC<VirtualHostSelectorProps> = ({
  clusterId,
  selectedVirtualHost,
  onVirtualHostSelect,
  disabled = false,
  label = "Virtual Host",
  showRefresh = true,
}) => {
  const { virtualHosts, loading, error, refresh, clearError } =
    useVirtualHosts(clusterId);

  const handleChange = (event: any) => {
    const vhostName = event.target.value;
    onVirtualHostSelect(vhostName);
  };

  const handleRefresh = async () => {
    clearError();
    await refresh();
  };

  // Don't render if no cluster is selected
  if (!clusterId) {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Typography variant="subtitle2" component="label">
          {label}
        </Typography>
        {showRefresh && (
          <Tooltip title="Refresh virtual hosts">
            <span>
              <IconButton
                size="small"
                onClick={handleRefresh}
                disabled={loading}
                sx={{ ml: "auto" }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      <FormControl fullWidth disabled={disabled || loading}>
        <InputLabel id="vhost-select-label">{label}</InputLabel>
        <Select
          labelId="vhost-select-label"
          id="vhost-select"
          value={selectedVirtualHost || ""}
          label={label}
          onChange={handleChange}
          startAdornment={
            loading ? (
              <Box sx={{ display: "flex", alignItems: "center", pl: 1 }}>
                <CircularProgress size={16} />
              </Box>
            ) : null
          }
        >
          {virtualHosts.map((vhost) => (
            <MenuItem key={vhost.name} value={vhost.name}>
              <Box
                sx={{ display: "flex", alignItems: "center", width: "100%" }}
              >
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2">
                    {vhost.name === "/" ? "/ (default)" : vhost.name}
                  </Typography>
                  {vhost.description && (
                    <Typography variant="caption" color="text.secondary">
                      {vhost.description}
                    </Typography>
                  )}
                </Box>
                {vhost.tags && (
                  <Typography variant="caption" color="primary" sx={{ ml: 1 }}>
                    {vhost.tags}
                  </Typography>
                )}
              </Box>
            </MenuItem>
          ))}
          {virtualHosts.length === 0 && !loading && !error && (
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                No virtual hosts available
              </Typography>
            </MenuItem>
          )}
        </Select>
      </FormControl>

      {selectedVirtualHost && (
        <Box sx={{ mt: 1, p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Selected Virtual Host:</strong>{" "}
            {selectedVirtualHost === "/" ? "/ (default)" : selectedVirtualHost}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default VirtualHostSelector;
