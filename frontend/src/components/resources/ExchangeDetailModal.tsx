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
} from "@mui/material";
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  SwapHoriz as DirectIcon,
  Radio as FanoutIcon,
  AccountTree as TopicIcon,
  ViewList as HeadersIcon,
  ContentCopy as ContentCopyIcon,
  Search as SearchIcon,
  Queue as QueueIcon,
  Hub as ExchangeIcon,
} from "@mui/icons-material";
import { RabbitMQExchange } from "../../types/rabbitmq";
import { useExchangeBindings } from "../../hooks/useExchangeBindings";
import { useDetailRefresh } from "../../hooks/useDetailRefresh";
import RefreshControls from "./shared/RefreshControls";
import { useNotification } from "../../contexts/NotificationContext";

interface ExchangeDetailModalProps {
  open: boolean;
  onClose: () => void;
  exchange: RabbitMQExchange | null;
  clusterId: string;
}

export const ExchangeDetailModal: React.FC<ExchangeDetailModalProps> = ({
  open,
  onClose,
  exchange,
  clusterId,
}) => {
  const [bindingFilter, setBindingFilter] = useState("");
  const [currentExchange, setCurrentExchange] =
    useState<RabbitMQExchange | null>(exchange);

  const { bindings, loading, error, loadBindings, clearError } =
    useExchangeBindings();
  const { success } = useNotification();

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
      if (!currentExchange || !clusterId) return;
      await loadBindings(
        clusterId,
        currentExchange.vhost,
        currentExchange.name
      );
    },
  });

  useEffect(() => {
    setCurrentExchange(exchange);
    if (exchange && clusterId && open) {
      loadBindings(clusterId, exchange.vhost, exchange.originalName || exchange.name);
    }
  }, [exchange, clusterId, open, loadBindings]);

  const handleRefresh = async () => {
    await performRefresh();
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      success("Copied to clipboard");
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "direct":
        return <DirectIcon fontSize="small" />;
      case "fanout":
        return <FanoutIcon fontSize="small" />;
      case "topic":
        return <TopicIcon fontSize="small" />;
      case "headers":
        return <HeadersIcon fontSize="small" />;
      default:
        return <DirectIcon fontSize="small" />;
    }
  };

  const getTypeColor = (
    type: string
  ): "primary" | "secondary" | "success" | "warning" | "info" | "error" => {
    switch (type) {
      case "direct":
        return "primary";
      case "fanout":
        return "secondary";
      case "topic":
        return "success";
      case "headers":
        return "warning";
      default:
        return "info";
    }
  };

  // Filter bindings based on search term
  const filteredBindings = bindings
    ? bindings.filter(
      (binding) =>
        binding.destination
          .toLowerCase()
          .includes(bindingFilter.toLowerCase()) ||
        binding.routing_key
          .toLowerCase()
          .includes(bindingFilter.toLowerCase()) ||
        binding.destination_type
          .toLowerCase()
          .includes(bindingFilter.toLowerCase())
    )
    : [];

  // Separate queue and exchange bindings
  const queueBindings = filteredBindings.filter(
    (binding) => binding.destination_type === "queue"
  );
  const exchangeBindings = filteredBindings.filter(
    (binding) => binding.destination_type === "exchange"
  );

  if (!currentExchange) {
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
            {getTypeIcon(currentExchange.type)}
            <Box>
              <Typography variant="h6" component="div">
                Exchange Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentExchange.name}
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

      <DialogContent dividers>
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={clearError}>
                Dismiss
              </Button>
            }
          >
            {error.message}
            {error.details && (
              <Typography variant="caption" display="block">
                {error.details}
              </Typography>
            )}
          </Alert>
        )}

        {/* Exchange Overview */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Exchange Overview
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Type
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
                      label={currentExchange.type}
                      color={getTypeColor(currentExchange.type)}
                      size="small"
                      icon={getTypeIcon(currentExchange.type)}
                    />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Durability
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={currentExchange.durable ? "Durable" : "Transient"}
                      color={currentExchange.durable ? "success" : "default"}
                      size="small"
                    />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Auto Delete
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={currentExchange.auto_delete ? "Yes" : "No"}
                      color={
                        currentExchange.auto_delete ? "warning" : "default"
                      }
                      size="small"
                    />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Internal
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={currentExchange.internal ? "Yes" : "No"}
                      color={currentExchange.internal ? "info" : "default"}
                      size="small"
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Exchange Properties */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Exchange Properties</Typography>
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
                      Name
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {currentExchange.name}
                        <Tooltip title="Copy to clipboard">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleCopyToClipboard(currentExchange.name)
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
                      Virtual Host
                    </TableCell>
                    <TableCell>{currentExchange.vhost}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{ fontWeight: "medium" }}
                    >
                      Type
                    </TableCell>
                    <TableCell>{currentExchange.type}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{ fontWeight: "medium" }}
                    >
                      Durable
                    </TableCell>
                    <TableCell>
                      {currentExchange.durable ? "Yes" : "No"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{ fontWeight: "medium" }}
                    >
                      Auto Delete
                    </TableCell>
                    <TableCell>
                      {currentExchange.auto_delete ? "Yes" : "No"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{ fontWeight: "medium" }}
                    >
                      Internal
                    </TableCell>
                    <TableCell>
                      {currentExchange.internal ? "Yes" : "No"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>

        {/* Arguments */}
        {currentExchange.arguments &&
          Object.keys(currentExchange.arguments).length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Arguments</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      {Object.entries(currentExchange.arguments).map(
                        ([key, value]) => (
                          <TableRow key={key}>
                            <TableCell
                              component="th"
                              scope="row"
                              sx={{ fontWeight: "medium" }}
                            >
                              {key}
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
          )}

        {/* Message Statistics */}
        {currentExchange.message_stats && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Message Statistics</Typography>
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
                        Messages Published In
                      </Typography>
                      <Typography variant="h4" color="success.main">
                        {currentExchange.message_stats.publish_in?.toLocaleString() ||
                          0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Rate:{" "}
                        {currentExchange.message_stats.publish_in_details?.rate?.toFixed(
                          2
                        ) || 0}{" "}
                        msg/s
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
                        Messages Published Out
                      </Typography>
                      <Typography variant="h4" color="info.main">
                        {currentExchange.message_stats.publish_out?.toLocaleString() ||
                          0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Rate:{" "}
                        {currentExchange.message_stats.publish_out_details?.rate?.toFixed(
                          2
                        ) || 0}{" "}
                        msg/s
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Bindings */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              Bindings ({filteredBindings.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {/* Binding Filter */}
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Filter bindings by destination or routing key..."
                value={bindingFilter}
                onChange={(e) => setBindingFilter(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ maxWidth: 400 }}
              />
            </Box>

            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  py: 4,
                }}
              >
                <CircularProgress />
              </Box>
            ) : filteredBindings.length === 0 ? (
              <Alert severity="info">
                {bindings?.length === 0
                  ? "No bindings found for this exchange."
                  : "No bindings match the current filter."}
              </Alert>
            ) : (
              <Box>
                {/* Queue Bindings */}
                {queueBindings.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Queue Bindings ({queueBindings.length})
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Destination Queue</TableCell>
                            <TableCell>Routing Key</TableCell>
                            <TableCell>Arguments</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {queueBindings.map((binding, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <QueueIcon fontSize="small" color="primary" />
                                  {binding.destination}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    fontFamily="monospace"
                                  >
                                    {binding.routing_key || "(empty)"}
                                  </Typography>
                                  {binding.routing_key && (
                                    <Tooltip title="Copy routing key">
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          handleCopyToClipboard(
                                            binding.routing_key
                                          )
                                        }
                                      >
                                        <ContentCopyIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>
                                {Object.keys(binding.arguments || {}).length >
                                  0 ? (
                                  <Chip
                                    label={`${Object.keys(binding.arguments).length
                                      } args`}
                                    size="small"
                                    variant="outlined"
                                  />
                                ) : (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    None
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {/* Exchange Bindings */}
                {exchangeBindings.length > 0 && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Exchange Bindings ({exchangeBindings.length})
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Destination Exchange</TableCell>
                            <TableCell>Routing Key</TableCell>
                            <TableCell>Arguments</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {exchangeBindings.map((binding, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <ExchangeIcon
                                    fontSize="small"
                                    color="secondary"
                                  />
                                  {binding.destination}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    fontFamily="monospace"
                                  >
                                    {binding.routing_key || "(empty)"}
                                  </Typography>
                                  {binding.routing_key && (
                                    <Tooltip title="Copy routing key">
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          handleCopyToClipboard(
                                            binding.routing_key
                                          )
                                        }
                                      >
                                        <ContentCopyIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>
                                {Object.keys(binding.arguments || {}).length >
                                  0 ? (
                                  <Chip
                                    label={`${Object.keys(binding.arguments).length
                                      } args`}
                                    size="small"
                                    variant="outlined"
                                  />
                                ) : (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    None
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </Box>
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

export default ExchangeDetailModal;
