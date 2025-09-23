import { Component, ErrorInfo, ReactNode } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  AlertTitle,
} from "@mui/material";
import { ErrorOutline, Refresh, Home, BugReport } from "@mui/icons-material";

interface Props {
  children: ReactNode;
  clusterId?: string;
  resourceType?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

class ResourceErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorId: "",
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `resource-error-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 11)}`,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Enhanced logging for resource errors
    const logData = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo,
      context: {
        clusterId: this.props.clusterId,
        resourceType: this.props.resourceType,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
      errorId: this.state.errorId,
    };

    console.error("ResourceErrorBoundary caught an error:", logData);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, send to error reporting service
    if (process.env.NODE_ENV === "production") {
      // Example: Send to error reporting service
      // errorReportingService.captureException(error, {
      //   tags: {
      //     component: 'ResourceErrorBoundary',
      //     clusterId: this.props.clusterId,
      //     resourceType: this.props.resourceType
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

  private getErrorSuggestions = (): string[] => {
    const { error } = this.state;
    const { clusterId, resourceType } = this.props;
    const suggestions: string[] = [];

    if (!error) return suggestions;

    // Network-related errors
    if (error.message.includes("Network") || error.message.includes("fetch")) {
      suggestions.push("Check your internet connection");
      suggestions.push("Verify the RabbitMQ cluster is accessible");
      if (clusterId) {
        suggestions.push(
          `Ensure cluster "${clusterId}" is running and reachable`
        );
      }
    }

    // Authentication errors
    if (
      error.message.includes("401") ||
      error.message.includes("Unauthorized")
    ) {
      suggestions.push(
        "Your session may have expired - try refreshing the page"
      );
      suggestions.push("Log out and log back in");
    }

    // Authorization errors
    if (error.message.includes("403") || error.message.includes("Forbidden")) {
      suggestions.push("You may not have permission to access this resource");
      suggestions.push("Contact your administrator for access");
    }

    // Resource-specific suggestions
    if (resourceType) {
      suggestions.push(`Try navigating to a different ${resourceType} page`);
      suggestions.push(
        `Check if the ${resourceType} data is available in RabbitMQ`
      );
    }

    // General suggestions
    suggestions.push("Try refreshing the page");
    suggestions.push("Clear your browser cache and cookies");

    return suggestions;
  };

  public render() {
    if (this.state.hasError) {
      const { error } = this.state;
      const { clusterId, resourceType } = this.props;
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
              maxWidth: 700,
              width: "100%",
            }}
          >
            <ErrorOutline color="error" sx={{ fontSize: 64, mb: 2 }} />

            <Typography variant="h5" gutterBottom>
              Resource Loading Error
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph>
              {resourceType && clusterId ? (
                <>
                  Unable to load {resourceType} data for cluster "{clusterId}".
                </>
              ) : resourceType ? (
                <>Unable to load {resourceType} data.</>
              ) : (
                <>Unable to load resource data.</>
              )}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>
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
                  Retry
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
                Go Home
              </Button>
            </Box>

            {process.env.NODE_ENV === "development" && (
              <Box sx={{ mt: 3 }}>
                <Button
                  size="small"
                  startIcon={<BugReport />}
                  onClick={() => console.log("Error details:", this.state)}
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
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ResourceErrorBoundary;
