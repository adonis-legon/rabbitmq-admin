import React from "react";
import {
  Box,
  Alert,
  AlertTitle,
  Button,
  Typography,
  Chip,
  Collapse,
  IconButton,
} from "@mui/material";
import {
  Refresh,
  ExpandMore,
  ExpandLess,
  Warning,
  Error as ErrorIcon,
  NetworkCheck,
  Security,
  Cloud,
} from "@mui/icons-material";
import { ResourceError } from "../../../types/rabbitmq";
import { getErrorSuggestions } from "../../../utils/resourceErrorUtils";

export interface ResourceErrorDisplayProps {
  error: ResourceError;
  onRetry?: () => void;
  onClear?: () => void;
  clusterId?: string;
  resourceType?: string;
  showDetails?: boolean;
  compact?: boolean;
}

const ResourceErrorDisplay: React.FC<ResourceErrorDisplayProps> = ({
  error,
  onRetry,
  onClear,
  clusterId,
  resourceType,
  showDetails = false,
  compact = false,
}) => {
  const [expanded, setExpanded] = React.useState(showDetails);

  const getErrorIcon = () => {
    switch (error.type) {
      case "network":
        return <NetworkCheck />;
      case "authentication":
      case "authorization":
        return <Security />;
      case "cluster_unavailable":
        return <Cloud />;
      default:
        return <ErrorIcon />;
    }
  };

  const getErrorSeverity = (): "error" | "warning" | "info" => {
    switch (error.type) {
      case "cluster_unavailable":
        return "warning";
      case "network":
        return "warning";
      default:
        return "error";
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case "network":
        return "Connection Error";
      case "authentication":
        return "Authentication Required";
      case "authorization":
        return "Access Denied";
      case "cluster_unavailable":
        return "Cluster Unavailable";
      case "api_error":
        return "Server Error";
      default:
        return "Error";
    }
  };

  const suggestions = getErrorSuggestions(error, { clusterId, resourceType });
  const canRetry = error.retryable && onRetry;

  if (compact) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert
          severity={getErrorSeverity()}
          icon={getErrorIcon()}
          action={
            <Box sx={{ display: "flex", gap: 1 }}>
              {canRetry && (
                <Button
                  size="small"
                  startIcon={<Refresh />}
                  onClick={onRetry}
                  variant="outlined"
                >
                  Retry
                </Button>
              )}
              {onClear && (
                <Button size="small" onClick={onClear} variant="text">
                  Dismiss
                </Button>
              )}
            </Box>
          }
        >
          <AlertTitle>{getErrorTitle()}</AlertTitle>
          {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Alert severity={getErrorSeverity()} icon={getErrorIcon()} sx={{ mb: 2 }}>
        <AlertTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {getErrorTitle()}
            <Chip
              label={error.type.replace("_", " ")}
              size="small"
              variant="outlined"
              color={getErrorSeverity()}
            />
          </Box>
          {(error.details || suggestions.length > 0) && (
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </AlertTitle>

        <Typography variant="body2" sx={{ mb: 2 }}>
          {error.message}
        </Typography>

        {clusterId && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 1 }}
          >
            Cluster: {clusterId}
          </Typography>
        )}

        {resourceType && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 1 }}
          >
            Resource Type: {resourceType}
          </Typography>
        )}

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: 2 }}
        >
          Occurred: {new Date(error.timestamp).toLocaleString()}
        </Typography>

        <Collapse in={expanded}>
          {suggestions.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                <Warning
                  sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }}
                />
                Suggested Solutions:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                {suggestions.map((suggestion, index) => (
                  <Typography
                    key={index}
                    variant="body2"
                    component="li"
                    sx={{ mb: 0.5 }}
                  >
                    {suggestion}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}

          {error.details && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Technical Details:
              </Typography>
              <Typography
                variant="caption"
                component="pre"
                sx={{
                  p: 1,
                  bgcolor: "grey.100",
                  borderRadius: 1,
                  overflow: "auto",
                  maxHeight: "200px",
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {error.details}
              </Typography>
            </Box>
          )}
        </Collapse>

        <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
          {canRetry && (
            <Button
              startIcon={<Refresh />}
              onClick={onRetry}
              variant="contained"
              size="small"
            >
              {error.type === "network" ? "Reconnect" : "Retry"}
            </Button>
          )}

          {onClear && (
            <Button onClick={onClear} variant="outlined" size="small">
              Dismiss
            </Button>
          )}

          {!error.retryable && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ alignSelf: "center", ml: 1 }}
            >
              This error cannot be automatically retried
            </Typography>
          )}
        </Box>
      </Alert>
    </Box>
  );
};

export default ResourceErrorDisplay;
