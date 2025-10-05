import { Component, ErrorInfo, ReactNode } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  AlertTitle,
  Chip,
} from "@mui/material";
import {
  ErrorOutline,
  Refresh,
  Home,
  BugReport,
  Security,
  History,
} from "@mui/icons-material";

interface Props {
  children: ReactNode;
  clusterId?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

class AuditErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorId: "",
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `audit-error-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 11)}`,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Enhanced logging for audit errors
    const logData = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo,
      context: {
        component: "AuditErrorBoundary",
        clusterId: this.props.clusterId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        feature: "audit-logging",
      },
      errorId: this.state.errorId,
    };

    console.error("AuditErrorBoundary caught an error:", logData);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, send to error reporting service
    if (process.env.NODE_ENV === "production") {
      // Example: Send to error reporting service
      // errorReportingService.captureException(error, {
      //   tags: {
      //     component: 'AuditErrorBoundary',
      //     feature: 'audit-logging',
      //     clusterId: this.props.clusterId
      //   },
      //   extra: logData
      // });
    }
  }

  private handleRetry = () => {
    // Clear error state
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: "",
    });

    // Call custom retry handler if provided
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private getErrorType = (): {
    type: string;
    severity: "error" | "warning" | "info";
    icon: ReactNode;
  } => {
    const { error } = this.state;
    if (!error)
      return { type: "Unknown", severity: "error", icon: <ErrorOutline /> };

    const message = error.message.toLowerCase();

    if (message.includes("401") || message.includes("unauthorized")) {
      return {
        type: "Authentication Error",
        severity: "warning",
        icon: <Security />,
      };
    }

    if (message.includes("403") || message.includes("forbidden")) {
      return {
        type: "Permission Error",
        severity: "error",
        icon: <Security />,
      };
    }

    if (message.includes("network") || message.includes("fetch")) {
      return {
        type: "Network Error",
        severity: "warning",
        icon: <ErrorOutline />,
      };
    }

    if (message.includes("timeout")) {
      return {
        type: "Timeout Error",
        severity: "warning",
        icon: <ErrorOutline />,
      };
    }

    return {
      type: "Application Error",
      severity: "error",
      icon: <ErrorOutline />,
    };
  };

  private getErrorSuggestions = (): string[] => {
    const { error } = this.state;
    const { clusterId } = this.props;
    const suggestions: string[] = [];

    if (!error) return suggestions;

    const message = error.message.toLowerCase();

    // Authentication errors
    if (message.includes("401") || message.includes("unauthorized")) {
      suggestions.push(
        "Your session may have expired - try refreshing the page"
      );
      suggestions.push("Log out and log back in to renew your session");
      suggestions.push("Contact your administrator if the problem persists");
    }

    // Authorization errors
    else if (message.includes("403") || message.includes("forbidden")) {
      suggestions.push(
        "You need administrator privileges to access audit records"
      );
      suggestions.push("Contact your administrator to request audit access");
      suggestions.push("Verify you are logged in with the correct account");
    }

    // Network-related errors
    else if (message.includes("network") || message.includes("fetch")) {
      suggestions.push("Check your internet connection");
      suggestions.push("Verify the application server is accessible");
      if (clusterId) {
        suggestions.push(
          `Ensure cluster "${clusterId}" is running and reachable`
        );
      }
      suggestions.push("Try refreshing the page in a few moments");
    }

    // Timeout errors
    else if (message.includes("timeout")) {
      suggestions.push("The audit query may be taking too long to process");
      suggestions.push(
        "Try applying more specific filters to reduce the data set"
      );
      suggestions.push("Check your network connection stability");
      suggestions.push("Contact your administrator if timeouts persist");
    }

    // General audit-specific suggestions
    else {
      suggestions.push("Try refreshing the audit records");
      suggestions.push("Clear any applied filters and try again");
      suggestions.push("Check if audit logging is enabled on the system");
      suggestions.push("Contact your administrator if the problem persists");
    }

    // Always add general suggestions
    suggestions.push("Clear your browser cache and cookies");
    suggestions.push("Try using a different browser or incognito mode");

    return suggestions;
  };

  public render() {
    if (this.state.hasError) {
      const { error } = this.state;
      const { clusterId } = this.props;
      const errorType = this.getErrorType();
      const suggestions = this.getErrorSuggestions();

      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="400px"
          p={3}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: "center",
              maxWidth: 800,
              width: "100%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              {errorType.icon}
              <History sx={{ fontSize: 64, color: "primary.main", ml: 1 }} />
            </Box>

            <Typography variant="h5" gutterBottom>
              Audit System Error
            </Typography>

            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <Chip
                label={errorType.type}
                color={errorType.severity}
                variant="outlined"
                size="small"
              />
            </Box>

            <Typography variant="body1" color="text.secondary" paragraph>
              {clusterId ? (
                <>
                  Unable to load audit records for cluster "{clusterId}". The
                  audit system encountered an unexpected error.
                </>
              ) : (
                <>
                  Unable to load audit records. The audit system encountered an
                  unexpected error.
                </>
              )}
            </Typography>

            {error && (
              <Alert
                severity={errorType.severity}
                sx={{ mb: 3, textAlign: "left" }}
              >
                <AlertTitle>Error Details</AlertTitle>
                <Typography variant="body2" component="div">
                  <strong>Error:</strong> {error.message}
                </Typography>
                {process.env.NODE_ENV === "development" && (
                  <Typography
                    variant="caption"
                    component="div"
                    sx={{ mt: 1, fontFamily: "monospace" }}
                  >
                    Error ID: {this.state.errorId}
                  </Typography>
                )}
              </Alert>
            )}

            {suggestions.length > 0 && (
              <Alert severity="info" sx={{ mb: 3, textAlign: "left" }}>
                <AlertTitle>Suggested Solutions</AlertTitle>
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  {suggestions.map((suggestion, index) => (
                    <Typography key={index} variant="body2" component="li">
                      {suggestion}
                    </Typography>
                  ))}
                </Box>
              </Alert>
            )}

            <Box
              sx={{
                mt: 3,
                display: "flex",
                gap: 2,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {this.props.onRetry && (
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={this.handleRetry}
                  color="primary"
                >
                  Retry Loading Audit Records
                </Button>
              )}

              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={this.handleReload}
              >
                Reload Page
              </Button>

              <Button
                variant="outlined"
                startIcon={<Home />}
                onClick={this.handleGoHome}
              >
                Go to Dashboard
              </Button>
            </Box>

            {process.env.NODE_ENV === "development" && (
              <Box sx={{ mt: 3 }}>
                <Button
                  size="small"
                  startIcon={<BugReport />}
                  onClick={() => {
                    // Error details available in React DevTools
                  }}
                  variant="text"
                >
                  Log Error Details
                </Button>
              </Box>
            )}

            {process.env.NODE_ENV === "production" && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 2, display: "block" }}
              >
                Error ID: {this.state.errorId}
              </Typography>
            )}

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 2, display: "block" }}
            >
              If you continue to experience issues, please contact your system
              administrator with the error ID above.
            </Typography>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default AuditErrorBoundary;
