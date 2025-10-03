import React from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  ContactSupport as ContactIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";

interface AuditFallbackUIProps {
  /** Type of fallback to display */
  type: "no-data" | "disabled" | "loading-failed" | "permission-denied";
  /** Optional cluster ID for context */
  clusterId?: string;
  /** Callback for retry action */
  onRetry?: () => void;
  /** Callback for refresh action */
  onRefresh?: () => void;
  /** Additional context message */
  message?: string;
}

const AuditFallbackUI: React.FC<AuditFallbackUIProps> = ({
  type,
  clusterId,
  onRetry,
  onRefresh,
  message,
}) => {
  const getContent = () => {
    switch (type) {
      case "no-data":
        const noDataActions: Array<{
          label: string;
          icon: React.ReactElement;
          onClick: () => void;
          variant: "contained" | "outlined";
        }> = [];
        if (onRefresh) {
          noDataActions.push({
            label: "Refresh",
            icon: <RefreshIcon />,
            onClick: onRefresh,
            variant: "contained" as const,
          });
        }

        return {
          icon: <HistoryIcon sx={{ fontSize: 64, color: "text.secondary" }} />,
          title: "No Audit Records Found",
          description: clusterId
            ? `No audit records are available for cluster "${clusterId}".`
            : "No audit records are available at this time.",
          severity: "info" as const,
          suggestions: [
            "Audit logging may have been recently enabled",
            "Try expanding your date range to include older records",
            "Check if any filters are too restrictive",
            "Verify that write operations have been performed on the system",
          ],
          actions: noDataActions,
        };

      case "disabled":
        const disabledActions: Array<{
          label: string;
          icon: React.ReactElement;
          onClick: () => void;
          variant: "contained" | "outlined";
        }> = [
            {
              label: "Contact Administrator",
              icon: <ContactIcon />,
              onClick: () => {
                window.location.href = "/contact";
              },
              variant: "outlined" as const,
            },
          ];
        if (onRefresh) {
          disabledActions.push({
            label: "Check Again",
            icon: <RefreshIcon />,
            onClick: onRefresh,
            variant: "contained" as const,
          });
        }

        return {
          icon: <SettingsIcon sx={{ fontSize: 64, color: "warning.main" }} />,
          title: "Audit Logging Disabled",
          description: "Audit logging is currently disabled on this system.",
          severity: "warning" as const,
          suggestions: [
            "Contact your system administrator to enable audit logging",
            "Check system configuration documentation",
            "Verify audit logging requirements with your compliance team",
            "Review application settings for audit configuration",
          ],
          actions: disabledActions,
        };

      case "loading-failed":
        const loadingFailedActions: Array<{
          label: string;
          icon: React.ReactElement;
          onClick: () => void;
          variant: "contained" | "outlined";
        }> = [];
        if (onRetry) {
          loadingFailedActions.push({
            label: "Retry",
            icon: <RefreshIcon />,
            onClick: onRetry,
            variant: "contained" as const,
          });
        }
        if (onRefresh) {
          loadingFailedActions.push({
            label: "Refresh Page",
            icon: <RefreshIcon />,
            onClick: onRefresh,
            variant: "outlined" as const,
          });
        }

        return {
          icon: <WarningIcon sx={{ fontSize: 64, color: "error.main" }} />,
          title: "Failed to Load Audit Records",
          description:
            message ||
            "Unable to load audit records due to an unexpected error.",
          severity: "error" as const,
          suggestions: [
            "Check your internet connection",
            "Verify the application server is accessible",
            "Try refreshing the page",
            "Clear your browser cache and cookies",
            "Contact your administrator if the problem persists",
          ],
          actions: loadingFailedActions,
        };

      case "permission-denied":
        const permissionDeniedActions: Array<{
          label: string;
          icon: React.ReactElement;
          onClick: () => void;
          variant: "contained" | "outlined";
        }> = [
            {
              label: "Contact Administrator",
              icon: <ContactIcon />,
              onClick: () => {
                window.location.href = "/contact";
              },
              variant: "contained" as const,
            },
            {
              label: "Go to Dashboard",
              icon: <HistoryIcon />,
              onClick: () => {
                window.location.href = "/";
              },
              variant: "outlined" as const,
            },
          ];

        return {
          icon: <ContactIcon sx={{ fontSize: 64, color: "error.main" }} />,
          title: "Access Denied",
          description:
            "You don't have permission to access audit records. Administrator privileges are required.",
          severity: "error" as const,
          suggestions: [
            "Contact your administrator to request audit access permissions",
            "Verify you are logged in with an administrator account",
            "Check if your user role has been recently changed",
            "Log out and log back in to refresh your permissions",
          ],
          actions: permissionDeniedActions,
        };

      default:
        const defaultActions: Array<{
          label: string;
          icon: React.ReactElement;
          onClick: () => void;
          variant: "contained" | "outlined";
        }> = [];
        if (onRefresh) {
          defaultActions.push({
            label: "Refresh",
            icon: <RefreshIcon />,
            onClick: onRefresh,
            variant: "contained" as const,
          });
        }

        return {
          icon: <InfoIcon sx={{ fontSize: 64, color: "text.secondary" }} />,
          title: "Audit Records Unavailable",
          description: message || "Audit records are currently unavailable.",
          severity: "info" as const,
          suggestions: [
            "Try refreshing the page",
            "Contact your administrator for assistance",
          ],
          actions: defaultActions,
        };
    }
  };

  const content = getContent();

  return (
    <Box
      role="main"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="400px"
      p={3}
    >
      <Paper
        elevation={1}
        sx={{
          p: 4,
          textAlign: "center",
          maxWidth: 600,
          width: "100%",
          backgroundColor: "background.paper",
        }}
      >
        {/* Icon */}
        <Box sx={{ mb: 3 }}>{content.icon}</Box>

        {/* Title */}
        <Typography variant="h5" gutterBottom color="text.primary">
          {content.title}
        </Typography>

        {/* Description */}
        <Typography variant="body1" color="text.secondary" paragraph>
          {content.description}
        </Typography>

        {/* Alert with additional context */}
        {message && type !== "loading-failed" && !content.description.includes(message) && (
          <Alert severity={content.severity} sx={{ mb: 3, textAlign: "left" }}>
            {message}
          </Alert>
        )}

        {/* Suggestions */}
        {content.suggestions.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom color="text.primary">
              What you can do:
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List sx={{ textAlign: "left" }}>
              {content.suggestions.map((suggestion, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckIcon fontSize="small" color="primary" />
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
          </Box>
        )}

        {/* Action Buttons */}
        {content.actions.length > 0 && (
          <Box
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {content.actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant}
                startIcon={action.icon}
                onClick={action.onClick}
                color="primary"
              >
                {action.label}
              </Button>
            ))}
          </Box>
        )}

        {/* Additional Information */}
        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: "divider" }}>
          <Typography variant="caption" color="text.secondary">
            {type === "no-data" && (
              <>
                Audit records track all write operations performed on RabbitMQ
                clusters. If you expect to see data here, contact your
                administrator.
              </>
            )}
            {type === "disabled" && (
              <>
                Audit logging can be enabled in the application configuration.
                Contact your administrator for assistance with enabling this
                feature.
              </>
            )}
            {type === "loading-failed" && (
              <>
                If this problem persists, please contact your system
                administrator with details about when the error occurred.
              </>
            )}
            {type === "permission-denied" && (
              <>
                Audit records contain sensitive information and require
                administrator access. Your current user role does not have
                sufficient permissions.
              </>
            )}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default AuditFallbackUI;
