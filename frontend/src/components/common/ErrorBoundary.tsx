import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper, Collapse } from '@mui/material';
import { ErrorOutline, ExpandMore, ExpandLess, Refresh, Home } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  showDetails: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    showDetails: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error reporting service
      // errorReportingService.captureException(error, { extra: errorInfo });
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private toggleDetails = () => {
    this.setState(prevState => ({ showDetails: !prevState.showDetails }));
  };

  private formatErrorDetails = (): string => {
    const { error, errorInfo } = this.state;
    let details = '';

    if (error) {
      details += `Error: ${error.name}\n`;
      details += `Message: ${error.message}\n`;
      if (error.stack) {
        details += `Stack Trace:\n${error.stack}\n`;
      }
    }

    if (errorInfo?.componentStack) {
      details += `\nComponent Stack:${errorInfo.componentStack}`;
    }

    return details;
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

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
              textAlign: 'center',
              maxWidth: 600,
              width: '100%'
            }}
          >
            <ErrorOutline
              color="error"
              sx={{ fontSize: 64, mb: 2 }}
            />
            <Typography variant="h5" gutterBottom>
              Oops! Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              We're sorry, but something unexpected happened. This error has been logged
              and our team will investigate.
            </Typography>

            <Box sx={{ mt: 3, mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={this.handleReload}
                sx={{ mr: 2 }}
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

            {/* Error details for development or debugging */}
            {(process.env.NODE_ENV === 'development' || this.state.showDetails) && (
              <Box sx={{ mt: 2 }}>
                <Button
                  size="small"
                  onClick={this.toggleDetails}
                  endIcon={this.state.showDetails ? <ExpandLess /> : <ExpandMore />}
                >
                  {this.state.showDetails ? 'Hide' : 'Show'} Error Details
                </Button>

                <Collapse in={this.state.showDetails}>
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{
                      mt: 2,
                      p: 2,
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                      textAlign: 'left',
                      overflow: 'auto',
                      maxHeight: '300px',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {this.formatErrorDetails()}
                  </Typography>
                </Collapse>
              </Box>
            )}

            {process.env.NODE_ENV === 'production' && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Error ID: {Date.now().toString(36)} {/* Simple error ID for reference */}
              </Typography>
            )}
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;