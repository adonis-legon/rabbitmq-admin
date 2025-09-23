import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
} from "@mui/material";
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ContentCopy as ContentCopyIcon,
} from "@mui/icons-material";
import { RabbitMQConnection } from "../../types/rabbitmq";
import { useConnections } from "../../hooks/useConnections";
import { useDetailRefresh } from "../../hooks/useDetailRefresh";
import RefreshControls from "./shared/RefreshControls";

interface ConnectionDetailModalProps {
  open: boolean;
  onClose: () => void;
  connection: RabbitMQConnection | null;
  clusterId: string;
}

export const ConnectionDetailModal: React.FC<ConnectionDetailModalProps> = ({
  open,
  onClose,
  connection,
  clusterId,
}) => {
  const [currentConnection, setCurrentConnection] =
    useState<RabbitMQConnection | null>(connection);
  const [error, setError] = useState<string | null>(null);

  const { loadConnections } = useConnections();

  const {
    refreshing,
    lastUpdated,
    autoRefresh,
    refreshInterval,
    handleRefresh: performRefresh,
    setAutoRefresh,
    setRefreshInterval,
  } = useDetailRefresh({
    onRefresh: async () => {
      if (!connection || !clusterId) return;

      try {
        setError(null);
        // Load fresh connection data
        await loadConnections(clusterId, {
          name: connection.name,
          pageSize: 1,
        });
        // Note: In a real implementation, you'd want a specific API endpoint for single connection
        // For now, we'll simulate the refresh by keeping the current data
        setCurrentConnection(connection);
      } catch (err: any) {
        console.error("Error refreshing connection:", err);
        setError(err.message || "Failed to refresh connection data");
      }
    },
  });

  useEffect(() => {
    setCurrentConnection(connection);
    setError(null);
  }, [connection]);

  const handleRefresh = async () => {
    await performRefresh();
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast notification here
      console.log("Copied to clipboard:", text);
    });
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (timestamp: number): string => {
    const now = Date.now();
    const duration = now - timestamp;
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case "running":
        return <CheckCircleIcon color="success" />;
      case "blocked":
      case "blocking":
        return <WarningIcon color="warning" />;
      case "closed":
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getStateColor = (
    state: string
  ): "success" | "warning" | "error" | "default" => {
    switch (state) {
      case "running":
        return "success";
      case "blocked":
      case "blocking":
        return "warning";
      case "closed":
        return "error";
      default:
        return "default";
    }
  };

  if (!currentConnection) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: "70vh" },
      }}
    >
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {getStateIcon(currentConnection.state)}
            <Box>
              <Typography variant="h6" component="div">
                Connection Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentConnection.name}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <RefreshControls
              onRefresh={handleRefresh}
              autoRefresh={autoRefresh}
              onAutoRefreshChange={setAutoRefresh}
              refreshInterval={refreshInterval}
              onRefreshIntervalChange={setRefreshInterval}
              loading={refreshing}
              lastUpdated={lastUpdated || undefined}
              showLastUpdated={false}
            />
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Connection Overview */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Connection Overview
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    State
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mt: 0.5,
                    }}
                  >
                    <Chip
                      label={currentConnection.state}
                      color={getStateColor(currentConnection.state)}
                      size="small"
                    />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Channels
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {currentConnection.channels}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Protocol
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {currentConnection.protocol}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Connected For
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDuration(currentConnection.connected_at)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Connection Details */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Connection Information</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{ fontWeight: "medium" }}
                    >
                      Connection Name
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {currentConnection.name}
                        <Tooltip title="Copy to clipboard">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleCopyToClipboard(currentConnection.name)
                            }
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{ fontWeight: "medium" }}
                    >
                      User
                    </TableCell>
                    <TableCell>{currentConnection.user}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{ fontWeight: "medium" }}
                    >
                      Virtual Host
                    </TableCell>
                    <TableCell>{currentConnection.vhost}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{ fontWeight: "medium" }}
                    >
                      Host
                    </TableCell>
                    <TableCell>
                      {currentConnection.host}:{currentConnection.port}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{ fontWeight: "medium" }}
                    >
                      Peer Host
                    </TableCell>
                    <TableCell>
                      {currentConnection.peer_host}:
                      {currentConnection.peer_port}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{ fontWeight: "medium" }}
                    >
                      Connected At
                    </TableCell>
                    <TableCell>
                      {new Date(
                        currentConnection.connected_at
                      ).toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{ fontWeight: "medium" }}
                    >
                      Timeout
                    </TableCell>
                    <TableCell>{currentConnection.timeout}s</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{ fontWeight: "medium" }}
                    >
                      Frame Max
                    </TableCell>
                    <TableCell>
                      {formatBytes(currentConnection.frame_max)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>

        {/* Client Properties */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Client Properties</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableBody>
                  {Object.entries(currentConnection.client_properties).map(
                    ([key, value]) => (
                      <TableRow key={key}>
                        <TableCell
                          component="th"
                          scope="row"
                          sx={{ fontWeight: "medium" }}
                        >
                          {key
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {String(value)}
                            <Tooltip title="Copy to clipboard">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleCopyToClipboard(String(value))
                                }
                              >
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>

        {/* Statistics */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Statistics</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      gutterBottom
                      color="primary"
                    >
                      Data Received
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {formatBytes(currentConnection.recv_oct)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {currentConnection.recv_cnt.toLocaleString()} packets
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      gutterBottom
                      color="primary"
                    >
                      Data Sent
                    </Typography>
                    <Typography variant="h4" color="info.main">
                      {formatBytes(currentConnection.send_oct)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {currentConnection.send_cnt.toLocaleString()} packets
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConnectionDetailModal;
