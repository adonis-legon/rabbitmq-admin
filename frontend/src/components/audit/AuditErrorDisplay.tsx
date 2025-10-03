import React from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Typography,
  Chip,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  ExpandMore,
  ExpandLess,
  Refresh,
  Login,
  ContactSupport,
  FilterList,
  Schedule,
  Security,
  NetworkCheck,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle,
} from "@mui/icons-material";
import {
  AuditError,
  AuditErrorType,
  getAuditErrorMessage,
  getAuditErrorSuggestions,
  isAuditErrorRecoverable,
} from "../../utils/auditErrorUtils";

interface AuditErrorDisplayProps {
  error: AuditError;
  onRetry?: () => void;
  onClearError?: () => void;
  showDetails?: boolean;
  compact?: boolean;
}

const AuditErrorDisplay: React.FC<AuditErrorDisplayProps> = ({
  error,
  onRetry,
  onClearError,
  showDetails = false,
  compact = false,
}) => {
  const [expanded, setExpanded] = React.useState(showDetails);

  const getSeverity = (
    errorType: AuditErrorType
  ): "error" | "warning" | "info" => {
    switch (errorType) {
      case AuditErrorType.AUTHORIZATION:
      case AuditErrorType.SERVER_ERROR:
      case AuditErrorType.UNKNOWN:
        return "error";
      case AuditErrorType.AUTHENTICATION:
      case AuditErrorType.NETWORK:
      case AuditErrorType.TIMEOUT:
      case AuditErrorType.VALIDATION:
      case AuditErrorType.FILTER_ERROR:
        return "warning";
      case AuditErrorType.AUDIT_DISABLED:
      case AuditErrorType.DATA_UNAVAILABLE:
        return "info";
      default:
        return "error";
    }
  };

  const getErrorIcon = (errorType: AuditErrorType) => {
    switch (errorType) {
      case AuditErrorType.AUTHENTICATION:
      case AuditErrorType.AUTHORIZATION:
        return <Security fontSize="small" />;
      case AuditErrorType.NETWORK:
        return <NetworkCheck fontSize="small" />;
      case AuditErrorType.TIMEOUT:
        return <Schedule fontSize="small" />;
      case AuditErrorType.VALIDATION:
      case AuditErrorType.FILTER_ERROR:
        return <FilterList fontSize="small" />;
      case AuditErrorType.AUDIT_DISABLED:
      case AuditErrorType.DATA_UNAVAILABLE:
        return <InfoIcon fontSize="small" />;
      default:
        return <ErrorIcon fontSize="small" />;
    }
  };

  const getErrorTypeLabel = (errorType: AuditErrorType): string => {
    switch (errorType) {
      case AuditErrorType.AUTHENTICATION:
        return "Authentication Required";
      case AuditErrorType.AUTHORIZATION:
        return "Access Denied";
      case AuditErrorType.NETWORK:
        return "Network Error";
      case AuditErrorType.TIMEOUT:
        return "Request Timeout";
      case AuditErrorType.VALIDATION:
        return "Validation Error";
      case AuditErrorType.SERVER_ERROR:
        return "Server Error";
      case AuditErrorType.AUDIT_DISABLED:
        return "Audit Disabled";
      case AuditErrorType.DATA_UNAVAILABLE:
        return "No Data Available";
      case AuditErrorType.FILTER_ERROR:
        return "Filter Error";
      default:
        return "Unknown Error";
    }
  };

  const getPrimaryAction = () => {
    switch (error.auditErrorType) {
      case AuditErrorType.AUTHENTICATION:
        return (
          <Button
            startIcon={<Login />}
            onClick={() => (window.location.href = "/login")}
            color="primary"
            variant="contained"
            size="small"
          >
            Log In
          </Button>
        );
      case AuditErrorType.AUTHORIZATION:
        return (
          <Button
            startIcon={<ContactSupport />}
            onClick={() => (window.location.href = "/contact")}
            color="primary"
            variant="outlined"
            size="small"
          >
            Contact Admin
          </Button>
        );
      default:
        return onRetry && isAuditErrorRecoverable(error) ? (
          <Button
            startIcon={<Refresh />}
            onClick={onRetry}
            color="primary"
            variant="contained"
            size="small"
          >
            Retry
          </Button>
        ) : null;
    }
  };

  const severity = getSeverity(error.auditErrorType);
  const errorIcon = getErrorIcon(error.auditErrorType);
  const errorTypeLabel = getErrorTypeLabel(error.auditErrorType);
  const userMessage = getAuditErrorMessage(error);
  const suggestions = getAuditErrorSuggestions(error);
  const primaryAction = getPrimaryAction();

  if (compact) {
    return (
      <Alert
        severity={severity}
        action={
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {primaryAction}
            {onClearError && (
              <IconButton size="small" onClick={onClearError} color="inherit">
                <ExpandLess />
              </IconButton>
            )}
          </Box>
        }
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {errorIcon}
          <Typography variant="body2" fontWeight="medium">
            {errorTypeLabel}
          </Typography>
        </Box>
        <Typography variant="body2">{userMessage}</Typography>
      </Alert>
    );
  }

  return (
    <Alert
      severity={severity}
      sx={{ mb: 2 }}
      action={
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {primaryAction}
          {onClearError && (
            <Button size="small" onClick={onClearError} color="inherit">
              Dismiss
            </Button>
          )}
        </Box>
      }
    >
      <AlertTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {errorIcon}
          <span>{errorTypeLabel}</span>
          <Chip
            label={error.auditErrorType}
            size="small"
            variant="outlined"
            color={severity}
          />
        </Box>
      </AlertTitle>

      <Typography variant="body2" paragraph>
        {userMessage}
      </Typography>

      {error.context && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Context:{" "}
            {error.context.clusterId && `Cluster: ${error.context.clusterId}`}
            {error.context.operation &&
              ` | Operation: ${error.context.operation}`}
          </Typography>
        </Box>
      )}

      {suggestions.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Suggested Solutions:
            </Typography>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? "Hide suggestions" : "Show suggestions"}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>

          <Collapse in={expanded}>
            <List dense sx={{ py: 0 }}>
              {suggestions.map((suggestion, index) => (
                <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircle fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="text.secondary">
                        {suggestion}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Collapse>
        </Box>
      )}

      {process.env.NODE_ENV === "development" && error.details && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Technical Details: {error.details}
          </Typography>
        </Box>
      )}

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 1, display: "block" }}
      >
        Error occurred at {new Date(error.timestamp).toLocaleString()}
        {error.retryable && " | This error can be retried"}
      </Typography>
    </Alert>
  );
};

export default AuditErrorDisplay;
