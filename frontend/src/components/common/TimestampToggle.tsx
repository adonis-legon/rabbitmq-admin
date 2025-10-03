import React from "react";
import {
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Box,
  Typography,
} from "@mui/material";
import {
  Schedule as LocalTimeIcon,
  Public as UtcIcon,
} from "@mui/icons-material";
import { getTimestampDisplayModes } from "../../utils/timestampUtils";

export interface TimestampToggleProps {
  /** Whether to show local time (true) or UTC (false) */
  showLocal: boolean;
  /** Callback when the display mode changes */
  onChange: (showLocal: boolean) => void;
  /** Size of the toggle buttons */
  size?: "small" | "medium" | "large";
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Additional styling */
  sx?: any;
}

/**
 * Toggle component for switching between local time and UTC display
 */
const TimestampToggle: React.FC<TimestampToggleProps> = ({
  showLocal,
  onChange,
  size = "small",
  disabled = false,
  sx,
}) => {
  const displayModes = getTimestampDisplayModes();

  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: string | null
  ) => {
    if (newValue !== null) {
      onChange(newValue === "local");
    }
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, ...sx }}>
      <Typography variant="caption" color="text.secondary">
        Time:
      </Typography>
      <ToggleButtonGroup
        value={showLocal ? "local" : "utc"}
        exclusive
        onChange={handleChange}
        size={size}
        disabled={disabled}
        aria-label="timestamp display mode"
      >
        <ToggleButton value="local" aria-label="show local time">
          <Tooltip title={displayModes[0].label}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <LocalTimeIcon fontSize="small" />
              <Typography variant="caption">Local</Typography>
            </Box>
          </Tooltip>
        </ToggleButton>
        <ToggleButton value="utc" aria-label="show UTC time">
          <Tooltip title={displayModes[1].label}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <UtcIcon fontSize="small" />
              <Typography variant="caption">UTC</Typography>
            </Box>
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default TimestampToggle;
