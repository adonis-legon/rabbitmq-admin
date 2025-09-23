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
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  TextField,
  InputAdornment,
  Divider,
} from "@mui/material";
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Queue as QueueIcon,
  ContentCopy as ContentCopyIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Memory as MemoryIcon,
  Message as MessageIcon,
  PlayArrow as RunningIcon,
  Pause as IdleIcon,
  Warning as FlowIcon,
  Error as DownIcon,
  Hub as ExchangeIcon,
} from "@mui/icons-material";
import { RabbitMQQueue } from "../../types/rabbitmq";
import { useQueueBindings } from "../../hooks/useQueueBindings";
import { useDetailRefresh } from "../../hooks/useDetailRefresh";
import RefreshControls from "./shared/RefreshControls";

interface QueueDetailModalProps {
  open: boolean;
  onClose: () => void;
  queue: RabbitMQQueue | null;
  clusterId: string;
}

export const QueueDetailModal: React.FC<QueueDetailModalProps> = ({
  open,
  onClose,
  queue,
  clusterId,
}) => {
  const [bindingFilter, setBindingFilter] = useState("");
  const [currentQueue, setCurrentQueue] = useState<RabbitMQQueue | null>(queue);

  const { bindings, loading, error, loadBindings } = useQueueBindings();

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
      if (!currentQueue || !clusterId) return;
      await loadBindings(clusterId, currentQueue.vhost, currentQueue.name);
    },
  });

  useEffect(() => {
    setCurrentQueue(queue);
    if (queue && clusterId && open) {
      loadBindings(clusterId, queue.vhost, queue.name);
    }
  }, [queue, clusterId, open, loadBindings]);

  const handleRefresh = async () => {
    await performRefresh();
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log("Copied to clipboard:", text);
    });
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case "running":
        return <RunningIcon fontSize="small" />;
      case "idle":
        return <IdleIcon fontSize="small" />;
      case "flow":
        return <FlowIcon fontSize="small" />;
      case "down":
        return <DownIcon fontSize="small" />;
      default:
        return <QueueIcon fontSize="small" />;
    }
  };

  const getStateColor = (
    state: string
  ): "primary" | "secondary" | "success" | "warning" | "info" | "error" => {
    switch (state) {
      case "running":
        return "success";
      case "idle":
        return "info";
      case "flow":
        return "warning";
      case "down":
        return "error";
      default:
        return "secondary";
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Filter bindings based on search term
  const filteredBindings = bindings
    ? bindings.filter(
        (binding) =>
          binding.source.toLowerCase().includes(bindingFilter.toLowerCase()) ||
          binding.routing_key
            .toLowerCase()
            .includes(bindingFilter.toLowerCase()) ||
          binding.destination_type
            .toLowerCase()
            .includes(bindingFilter.toLowerCase())
      )
    : [];

  if (!currentQueue) {
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
            {getStateIcon(currentQueue.state)}
            <Box>
              <Typography variant="h6" component="div">
                Queue Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentQueue.name}
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
              loading={refreshing || loading}
              lastUpdated={lastUpdated || undefined}
              showLastUpdated={false}
            />
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          {/* Queue Overview */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Queue Overview
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      State
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {getStateIcon(currentQueue.state)}
                      <Chip
                        label={currentQueue.state}
                        color={getStateColor(currentQueue.state)}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Virtual Host
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {currentQueue.vhost}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Node
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {currentQueue.node}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Memory Usage
                    </Typography>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <MemoryIcon fontSize="small" color="action" />
                      <Typography variant="body2" fontWeight="medium">
                        {formatBytes(currentQueue.memory)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Message Statistics */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Message Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Total Messages
                    </Typography>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <MessageIcon fontSize="small" color="primary" />
                      <Typography variant="h6" color="primary">
                        {currentQueue.messages.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Ready Messages
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {currentQueue.messages_ready.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Unacknowledged
                    </Typography>
                    <Typography variant="h6" color="warning.main">
                      {currentQueue.messages_unacknowledged.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Consumers
                    </Typography>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="h6">
                        {currentQueue.consumers}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              {/* Message Rates */}
              {currentQueue.message_stats && (
                <Box sx={{ mt: 2 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Message Rates
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Publish Rate
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {currentQueue.message_stats.publish_details?.rate?.toFixed(
                            2
                          ) || 0}{" "}
                          msg/s
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Deliver/Get Rate
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {currentQueue.message_stats.deliver_get_details?.rate?.toFixed(
                            2
                          ) || 0}{" "}
                          msg/s
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Consumer Utilisation */}
              {currentQueue.consumer_utilisation !== undefined && (
                <Box sx={{ mt: 2 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Consumer Utilisation
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {(currentQueue.consumer_utilisation * 100).toFixed(1)}%
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Queue Properties */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <SettingsIcon fontSize="small" />
                <Typography variant="subtitle1">Queue Properties</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Durable
                    </Typography>
                    <Box>
                      <Chip
                        label={currentQueue.durable ? "Yes" : "No"}
                        color={currentQueue.durable ? "success" : "default"}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Auto Delete
                    </Typography>
                    <Box>
                      <Chip
                        label={currentQueue.auto_delete ? "Yes" : "No"}
                        color={currentQueue.auto_delete ? "warning" : "default"}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Exclusive
                    </Typography>
                    <Box>
                      <Chip
                        label={currentQueue.exclusive ? "Yes" : "No"}
                        color={currentQueue.exclusive ? "info" : "default"}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              {/* Arguments */}
              {Object.keys(currentQueue.arguments || {}).length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Arguments
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Key</TableCell>
                          <TableCell>Value</TableCell>
                          <TableCell width={60}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(currentQueue.arguments || {}).map(
                          ([key, value]) => (
                            <TableRow key={key}>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {key}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {typeof value === "object"
                                    ? JSON.stringify(value)
                                    : String(value)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Tooltip title="Copy to clipboard">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleCopyToClipboard(
                                        typeof value === "object"
                                          ? JSON.stringify(value)
                                          : String(value)
                                      )
                                    }
                                  >
                                    <ContentCopyIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Consumer Details */}
          {currentQueue.consumer_details &&
            currentQueue.consumer_details.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PersonIcon fontSize="small" />
                    <Typography variant="subtitle1">
                      Consumer Details ({currentQueue.consumer_details.length})
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    {currentQueue.consumer_details.map((consumer, index) => (
                      <Card key={index} variant="outlined">
                        <CardContent>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 2,
                            }}
                          >
                            <PersonIcon color="primary" />
                            <Typography variant="subtitle1" fontWeight="medium">
                              Consumer #{index + 1}
                            </Typography>
                          </Box>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Consumer Tag
                                </Typography>
                                <Typography variant="body2" fontWeight="medium">
                                  {consumer.consumer_tag}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Channel
                                </Typography>
                                <Typography variant="body2" fontWeight="medium">
                                  {consumer.channel_details?.name || "Unknown"}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Connection
                                </Typography>
                                <Typography variant="body2" fontWeight="medium">
                                  {consumer.channel_details?.connection_name ||
                                    "Unknown"}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Peer Host
                                </Typography>
                                <Typography variant="body2" fontWeight="medium">
                                  {consumer.channel_details?.peer_host ||
                                    "Unknown"}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Acknowledgment Required
                                </Typography>
                                <Chip
                                  label={consumer.ack_required ? "Yes" : "No"}
                                  color={
                                    consumer.ack_required
                                      ? "success"
                                      : "warning"
                                  }
                                  size="small"
                                  variant="outlined"
                                />
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Prefetch Count
                                </Typography>
                                <Typography variant="body2" fontWeight="medium">
                                  {consumer.prefetch_count}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}

          {/* Queue Bindings */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ExchangeIcon fontSize="small" />
                <Typography variant="subtitle1">
                  Queue Bindings {bindings && `(${bindings.length})`}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {error.message}
                  </Typography>
                  {error.details && (
                    <Typography variant="caption" display="block">
                      {error.details}
                    </Typography>
                  )}
                </Alert>
              )}

              {bindings && bindings.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <TextField
                    size="small"
                    placeholder="Filter bindings..."
                    value={bindingFilter}
                    onChange={(e) => setBindingFilter(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ width: "100%", maxWidth: 400 }}
                  />
                </Box>
              )}

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : filteredBindings.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Source Exchange</TableCell>
                        <TableCell>Routing Key</TableCell>
                        <TableCell>Arguments</TableCell>
                        <TableCell width={60}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredBindings.map((binding, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <ExchangeIcon fontSize="small" color="primary" />
                              {binding.source}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              fontFamily="monospace"
                              sx={{
                                backgroundColor: "grey.100",
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                display: "inline-block",
                              }}
                            >
                              {binding.routing_key || "(empty)"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {Object.keys(binding.arguments || {}).length > 0 ? (
                              <Typography variant="body2">
                                {Object.keys(binding.arguments).length}{" "}
                                argument(s)
                              </Typography>
                            ) : (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                None
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Copy routing key">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleCopyToClipboard(binding.routing_key)
                                }
                              >
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : bindings && bindings.length === 0 ? (
                <Alert severity="info">
                  This queue has no bindings configured.
                </Alert>
              ) : (
                <Alert severity="info">
                  No bindings match the current filter.
                </Alert>
              )}
            </AccordionDetails>
          </Accordion>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default QueueDetailModal;
