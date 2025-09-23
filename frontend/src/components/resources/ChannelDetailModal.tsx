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
  PlayArrow as PlayArrowIcon,
  ContentCopy as ContentCopyIcon,
  Person as PersonIcon,
  Queue as QueueIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { RabbitMQChannel } from "../../types/rabbitmq";
import { useChannels } from "../../hooks/useChannels";
import { useDetailRefresh } from "../../hooks/useDetailRefresh";
import RefreshControls from "./shared/RefreshControls";

interface ChannelDetailModalProps {
  open: boolean;
  onClose: () => void;
  channel: RabbitMQChannel | null;
  clusterId: string;
}

export const ChannelDetailModal: React.FC<ChannelDetailModalProps> = ({
  open,
  onClose,
  channel,
  clusterId,
}) => {
  const [currentChannel, setCurrentChannel] = useState<RabbitMQChannel | null>(
    channel
  );
  const [error, setError] = useState<string | null>(null);

  const { loadChannels } = useChannels();

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
      if (!channel || !clusterId) return;

      try {
        setError(null);
        // Load fresh channel data
        await loadChannels(clusterId, {
          name: channel.name,
          pageSize: 1,
        });
        // Note: In a real implementation, you'd want a specific API endpoint for single channel
        // For now, we'll simulate the refresh by keeping the current data
        setCurrentChannel(channel);
      } catch (err: any) {
        console.error("Error refreshing channel:", err);
        setError(err.message || "Failed to refresh channel data");
      }
    },
  });

  useEffect(() => {
    setCurrentChannel(channel);
    setError(null);
  }, [channel]);

  const handleRefresh = async () => {
    await performRefresh();
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast notification here
      console.log("Copied to clipboard:", text);
    });
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const formatRate = (rate: number): string => {
    if (rate === 0) return "0/s";
    if (rate < 1) return `${rate.toFixed(2)}/s`;
    return `${Math.round(rate)}/s`;
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case "running":
        return <CheckCircleIcon color="success" />;
      case "flow":
        return <WarningIcon color="warning" />;
      case "starting":
        return <PlayArrowIcon color="info" />;
      case "closing":
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getStateColor = (
    state: string
  ): "success" | "warning" | "error" | "info" | "default" => {
    switch (state) {
      case "running":
        return "success";
      case "flow":
        return "warning";
      case "starting":
        return "info";
      case "closing":
        return "error";
      default:
        return "default";
    }
  };

  if (!currentChannel) {
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
            {getStateIcon(currentChannel.state)}
            <Box>
              <Typography variant="h6" component="div">
                Channel Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentChannel.name} (Channel #{currentChannel.number})
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

        {/* Channel Overview */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Channel Overview
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
                      label={currentChannel.state}
                      color={getStateColor(currentChannel.state)}
                      size="small"
                    />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Channel Number
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    #{currentChannel.number}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Consumers
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {currentChannel.consumer_count}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Connection
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {currentChannel.connection_details?.name || "Unknown"}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Channel Information */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <SettingsIcon />
              <Typography variant="h6">Channel Information</Typography>
            </Box>
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
                      Channel Name
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {currentChannel.name}
                        <Tooltip title="Copy to clipboard">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleCopyToClipboard(currentChannel.name)
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
                    <TableCell>{currentChannel.user}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{ fontWeight: "medium" }}
                    >
                      Virtual Host
                    </TableCell>
                    <TableCell>{currentChannel.vhost}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{ fontWeight: "medium" }}
                    >
                      Connection Host
                    </TableCell>
                    <TableCell>
                      {currentChannel.connection_details?.peer_host ||
                        "Unknown"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>

        {/* Prefetch Settings and Transaction State */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <SettingsIcon />
              <Typography variant="h6">
                Prefetch Settings & Transaction State
              </Typography>
            </Box>
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
                      Prefetch Settings
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Local Prefetch Count:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {currentChannel.prefetch_count}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Global Prefetch Count:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {currentChannel.global_prefetch_count}
                        </Typography>
                      </Box>
                    </Box>
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
                      Transaction State
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Transactional:
                        </Typography>
                        <Chip
                          label={currentChannel.transactional ? "Yes" : "No"}
                          color={
                            currentChannel.transactional ? "info" : "default"
                          }
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Publisher Confirms:
                        </Typography>
                        <Chip
                          label={currentChannel.confirm ? "Yes" : "No"}
                          color={currentChannel.confirm ? "info" : "default"}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Message Statistics */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Message Statistics</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      gutterBottom
                      color="warning.main"
                    >
                      Unacknowledged Messages
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {formatNumber(currentChannel.messages_unacknowledged)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Messages awaiting acknowledgment
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      gutterBottom
                      color="info.main"
                    >
                      Unconfirmed Messages
                    </Typography>
                    <Typography variant="h4" color="info.main">
                      {formatNumber(currentChannel.messages_unconfirmed)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Published messages awaiting confirm
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      gutterBottom
                      color="error.main"
                    >
                      Uncommitted Messages
                    </Typography>
                    <Typography variant="h4" color="error.main">
                      {formatNumber(currentChannel.messages_uncommitted)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Messages in uncommitted transactions
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {currentChannel.message_stats && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Message Rates
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell
                          component="th"
                          scope="row"
                          sx={{ fontWeight: "medium" }}
                        >
                          Publish Rate
                        </TableCell>
                        <TableCell>
                          {formatRate(
                            currentChannel.message_stats.publish_details
                              ?.rate || 0
                          )}
                        </TableCell>
                        <TableCell>
                          {formatNumber(
                            currentChannel.message_stats.publish || 0
                          )}{" "}
                          total
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell
                          component="th"
                          scope="row"
                          sx={{ fontWeight: "medium" }}
                        >
                          Deliver Rate
                        </TableCell>
                        <TableCell>
                          {formatRate(
                            currentChannel.message_stats.deliver_details
                              ?.rate || 0
                          )}
                        </TableCell>
                        <TableCell>
                          {formatNumber(
                            currentChannel.message_stats.deliver || 0
                          )}{" "}
                          total
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell
                          component="th"
                          scope="row"
                          sx={{ fontWeight: "medium" }}
                        >
                          Acknowledge Rate
                        </TableCell>
                        <TableCell>
                          {formatRate(
                            currentChannel.message_stats.ack_details?.rate || 0
                          )}
                        </TableCell>
                        <TableCell>
                          {formatNumber(currentChannel.message_stats.ack || 0)}{" "}
                          total
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Consumer Details */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PersonIcon />
              <Typography variant="h6">
                Consumer Details ({currentChannel.consumer_count})
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {currentChannel.consumer_details &&
              currentChannel.consumer_details.length > 0 ? (
              <Box>
                {currentChannel.consumer_details.map((consumer, index) => (
                  <Card
                    key={consumer.consumer_tag}
                    variant="outlined"
                    sx={{ mb: 2 }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <QueueIcon color="primary" />
                          <Typography variant="subtitle1" fontWeight="medium">
                            Consumer #{index + 1}
                          </Typography>
                        </Box>
                        <Chip
                          label={
                            consumer.ack_required ? "Manual Ack" : "Auto Ack"
                          }
                          color={consumer.ack_required ? "warning" : "success"}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Consumer Tag
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mt: 0.5,
                              }}
                            >
                              <Typography variant="body2" fontWeight="medium">
                                {consumer.consumer_tag}
                              </Typography>
                              <Tooltip title="Copy consumer tag">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleCopyToClipboard(consumer.consumer_tag)
                                  }
                                >
                                  <ContentCopyIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Queue
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {consumer.queue?.name || "Unknown"}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
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
                        <Grid item xs={12} md={6}>
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Virtual Host
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {consumer.queue?.vhost || currentChannel.vhost}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      {consumer.arguments &&
                        Object.keys(consumer.arguments).length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Consumer Arguments
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              {Object.entries(consumer.arguments).map(
                                ([key, value]) => (
                                  <Chip
                                    key={key}
                                    label={`${key}: ${String(value)}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ mr: 1, mb: 1 }}
                                  />
                                )
                              )}
                            </Box>
                          </Box>
                        )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Alert severity="info">
                No consumers are currently active on this channel.
              </Alert>
            )}
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

export default ChannelDetailModal;
