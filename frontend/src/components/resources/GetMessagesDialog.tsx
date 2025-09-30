import React, { useState, useEffect, Fragment, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Alert,
  FormHelperText,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  Divider,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ContentCopy as ContentCopyIcon,
} from "@mui/icons-material";
import { GetMessagesRequest, Message } from "../../types/rabbitmq";
import { rabbitmqResourcesApi } from "../../services/api/rabbitmqResourcesApi";
import { useVirtualHosts } from "../../hooks/useVirtualHosts";
import { useWriteOperationNotifications } from "../../hooks/useWriteOperationNotifications";
import { useWriteOperationState } from "../../hooks/useWriteOperationState";
import { useNotification } from "../../contexts/NotificationContext";


interface GetMessagesDialogProps {
  open: boolean;
  clusterId: string;
  targetQueue?: {
    name: string;
    vhost: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  vhost: string;
  queue: string;
  count: number;
  ackmode:
  | "ack_requeue_true"
  | "ack_requeue_false"
  | "reject_requeue_true"
  | "reject_requeue_false";
  encoding: "auto" | "base64";
  truncate?: number;
}

interface FormErrors {
  vhost?: string;
  queue?: string;
  count?: string;
  truncate?: string;
}

const ACKNOWLEDGMENT_MODES = [
  {
    value: "ack_requeue_true" as const,
    label: "Acknowledge & Requeue",
    description: "Remove messages from queue and requeue them (for testing)",
  },
  {
    value: "ack_requeue_false" as const,
    label: "Acknowledge & Remove",
    description: "Remove messages from queue permanently",
  },
  {
    value: "reject_requeue_true" as const,
    label: "Reject & Requeue",
    description: "Reject messages and requeue them",
  },
  {
    value: "reject_requeue_false" as const,
    label: "Reject & Remove",
    description: "Reject messages and remove them permanently",
  },
];

const ENCODING_OPTIONS = [
  {
    value: "auto" as const,
    label: "Auto",
    description: "Automatically detect best encoding for display",
  },
  {
    value: "base64" as const,
    label: "Base64",
    description: "Force Base64 encoding for binary data",
  },
];

const GetMessagesDialog: React.FC<GetMessagesDialogProps> = ({
  open,
  clusterId,
  targetQueue,
  onClose,
  onSuccess,
}) => {
  const { notifyMessagesRetrieved, notifyOperationError } =
    useWriteOperationNotifications();
  const { loading, executeOperation, reset } = useWriteOperationState();
  const { success } = useNotification();

  // Only fetch virtual hosts if no target queue is provided or if it doesn't have a vhost
  const shouldFetchVhosts = !targetQueue?.vhost;
  const {
    virtualHosts,
    loading: vhostsLoading,
    error: vhostsError,
  } = useVirtualHosts(shouldFetchVhosts ? clusterId : undefined);

  const [formData, setFormData] = useState<FormData>({
    vhost: targetQueue?.vhost || "",
    queue: targetQueue?.name || "",
    count: 1,
    ackmode: "ack_requeue_true",
    encoding: "auto",
    truncate: undefined,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesRetrieved, setMessagesRetrieved] = useState(false);
  const [retrievedMessageCount, setRetrievedMessageCount] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const hasRetrievedMessages = useRef(false);



  // Reset form when dialog opens (but not when virtualHosts changes)
  useEffect(() => {
    if (open && !hasRetrievedMessages.current) {
      const defaultVhost = targetQueue?.vhost || (virtualHosts.length > 0 ? virtualHosts[0].name : "");
      setFormData({
        vhost: defaultVhost,
        queue: targetQueue?.name || "",
        count: 1,
        ackmode: "ack_requeue_true",
        encoding: "auto",
        truncate: undefined,
      });
      setErrors({});
      setSubmitError(null);
      setMessages([]);
      setMessagesRetrieved(false);
      setRetrievedMessageCount(0);
      setExpandedRows(new Set());
      reset();
    }
  }, [open, targetQueue, reset]); // Removed circular dependencies

  // Set default vhost when virtual hosts load (only if no vhost is set)
  useEffect(() => {
    if (virtualHosts.length > 0 && !formData.vhost && !targetQueue?.vhost) {
      setFormData((prev) => ({ ...prev, vhost: virtualHosts[0].name }));
    }
  }, [virtualHosts, formData.vhost, targetQueue?.vhost]);

  // Ensure vhost is valid when virtualHosts changes
  useEffect(() => {
    if (virtualHosts.length > 0 && formData.vhost) {
      const vhostExists = virtualHosts.some(vh => vh.name === formData.vhost);
      if (!vhostExists) {
        setFormData((prev) => ({ ...prev, vhost: virtualHosts[0].name }));
      }
    }
  }, [virtualHosts, formData.vhost]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.vhost) {
      newErrors.vhost = "Virtual host is required";
    }

    if (!formData.queue.trim()) {
      newErrors.queue = "Queue name is required";
    } else if (!/^[a-zA-Z0-9._-]*$/.test(formData.queue)) {
      newErrors.queue =
        "Queue name can only contain letters, numbers, dots, underscores, and hyphens";
    }

    if (formData.count < 1 || formData.count > 100) {
      newErrors.count = "Message count must be between 1 and 100";
    }

    if (
      formData.truncate !== undefined &&
      (formData.truncate < 1 || formData.truncate > 50000)
    ) {
      newErrors.truncate = "Truncate limit must be between 1 and 50,000 bytes";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Clear previous results before making new request
    setMessages([]);
    setMessagesRetrieved(false);
    setRetrievedMessageCount(0);
    setSubmitError(null);
    setExpandedRows(new Set());

    const request: GetMessagesRequest = {
      count: formData.count,
      ackmode: formData.ackmode,
      encoding: formData.encoding,
      ...(formData.truncate && { truncate: formData.truncate }),
    };

    try {
      await executeOperation(
        async () => {
          const result = await rabbitmqResourcesApi.getMessages(
            clusterId,
            formData.vhost,
            formData.queue,
            request
          );
          return result;
        },
        (retrievedMessages) => {
          const retrievedMessagesList = retrievedMessages || [];

          // Store the message count to avoid race condition with state updates
          setMessages(retrievedMessagesList);
          setRetrievedMessageCount(retrievedMessagesList.length);
          setMessagesRetrieved(true);
          hasRetrievedMessages.current = true; // Mark that we have retrieved messages

          notifyMessagesRetrieved(
            formData.queue,
            retrievedMessagesList.length,
            formData.ackmode
          );
        },
        (err) => {
          notifyOperationError(
            "retrieve messages from",
            "Queue",
            formData.queue,
            err
          );
          setSubmitError(
            err.response?.data?.message ||
            err.message ||
            "Failed to retrieve messages. Please try again."
          );
        }
      );
    } catch {
      // Error handling is done in the executeOperation callback
    }
  };

  const handleInputChange =
    (field: keyof FormData) =>
      (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
      ) => {
        const value = event.target.value;
        setFormData((prev) => ({ ...prev, [field]: value }));

        // Clear error when user starts typing
        if (errors[field as keyof FormErrors]) {
          setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
      };

  const handleCountChange = (_: Event, newValue: number | number[]) => {
    const count = Array.isArray(newValue) ? newValue[0] : newValue;
    setFormData((prev) => ({ ...prev, count }));
    if (errors.count) {
      setErrors((prev) => ({ ...prev, count: undefined }));
    }
  };

  const handleTruncateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const truncate = value === "" ? undefined : parseInt(value, 10);
    setFormData((prev) => ({ ...prev, truncate }));
    if (errors.truncate) {
      setErrors((prev) => ({ ...prev, truncate: undefined }));
    }
  };

  const getDialogTitle = () => {
    if (targetQueue?.name) {
      return `Get Messages from Queue "${targetQueue.name}"`;
    }
    return "Get Messages from Queue";
  };

  const handleRowToggle = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const handleCopyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      success(`${label} copied to clipboard`);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const formatPayload = (
    message: Message
  ): { content: string; isBinary: boolean } => {
    const { payload, payloadEncoding } = message;

    if (payloadEncoding === "base64") {
      try {
        const decoded = atob(payload);
        // Check if it's likely binary data
        const isBinary = /[\x00-\x08\x0E-\x1F\x7F-\xFF]/.test(decoded);
        return {
          content: isBinary ? payload : decoded,
          isBinary,
        };
      } catch {
        return { content: payload, isBinary: true };
      }
    }

    return { content: payload, isBinary: false };
  };

  const truncateText = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const handleClose = () => {
    hasRetrievedMessages.current = false; // Reset the flag when closing
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: "95vh",
            height: "auto",
            minWidth: "900px",
          },
        }}
      >
        <DialogTitle>{getDialogTitle()}</DialogTitle>

        <DialogContent sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {submitError && (
              <Alert severity="error" onClose={() => setSubmitError(null)}>
                {submitError}
              </Alert>
            )}

            {vhostsError && (
              <Alert severity="error">
                Failed to load virtual hosts: {vhostsError}
              </Alert>
            )}

            {messagesRetrieved && (
              <Alert
                severity={retrievedMessageCount > 0 ? "success" : "info"}
                onClose={() => setMessagesRetrieved(false)}
              >
                {retrievedMessageCount > 0
                  ? `Successfully retrieved ${retrievedMessageCount} message${retrievedMessageCount === 1 ? "" : "s"
                  }!`
                  : `No messages found in queue "${formData.queue}". The queue appears to be empty.`}
              </Alert>
            )}

            {/* Virtual Host and Queue Name Row */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl fullWidth error={!!errors.vhost}>
                <InputLabel>Virtual Host</InputLabel>
                <Select
                  value={formData.vhost}
                  onChange={handleInputChange("vhost")}
                  label="Virtual Host"
                  disabled={loading || vhostsLoading || !!targetQueue?.vhost}
                  size="small"
                >
                  {vhostsLoading ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Loading virtual hosts...
                    </MenuItem>
                  ) : virtualHosts.length === 0 && !targetQueue?.vhost ? (
                    <MenuItem disabled>No virtual hosts available</MenuItem>
                  ) : (
                    // If we have a target queue with vhost, show that as an option
                    // Otherwise show the loaded virtual hosts
                    (targetQueue?.vhost && virtualHosts.length === 0 ?
                      [{ name: targetQueue.vhost }] :
                      virtualHosts
                    ).map((vhost) => (
                      <MenuItem key={vhost.name} value={vhost.name}>
                        <Typography variant="body2">
                          {vhost.name === "/" ? "/ (default)" : vhost.name}
                        </Typography>
                      </MenuItem>
                    ))
                  )}
                </Select>
                {errors.vhost && (
                  <FormHelperText>{errors.vhost}</FormHelperText>
                )}
              </FormControl>

              <TextField
                label="Queue Name"
                value={formData.queue}
                onChange={handleInputChange("queue")}
                error={!!errors.queue}
                helperText={errors.queue}
                fullWidth
                required
                disabled={loading || !!targetQueue?.name}
                size="small"
              />
            </Box>

            <Box>
              <Typography variant="body2" gutterBottom>
                Message Count: {formData.count}
              </Typography>
              <Slider
                value={formData.count}
                onChange={handleCountChange}
                min={1}
                max={100}
                step={1}
                marks={[
                  { value: 1, label: "1" },
                  { value: 50, label: "50" },
                  { value: 100, label: "100" },
                ]}
                disabled={loading}
                size="small"
              />
              {errors.count && (
                <FormHelperText error>{errors.count}</FormHelperText>
              )}
            </Box>

            {/* Acknowledgment Mode and Encoding Row */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Acknowledgment Mode</InputLabel>
                <Select
                  value={formData.ackmode}
                  onChange={handleInputChange("ackmode")}
                  label="Acknowledgment Mode"
                  disabled={loading}
                  size="small"
                >
                  {ACKNOWLEDGMENT_MODES.map((mode) => (
                    <MenuItem key={mode.value} value={mode.value}>
                      <Typography variant="body2">{mode.label}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Encoding</InputLabel>
                <Select
                  value={formData.encoding}
                  onChange={handleInputChange("encoding")}
                  label="Encoding"
                  disabled={loading}
                  size="small"
                >
                  {ENCODING_OPTIONS.map((encoding) => (
                    <MenuItem key={encoding.value} value={encoding.value}>
                      <Typography variant="body2">{encoding.label}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <TextField
              label="Truncate Limit (bytes)"
              type="number"
              value={formData.truncate || ""}
              onChange={handleTruncateChange}
              error={!!errors.truncate}
              helperText={
                errors.truncate ||
                "Optional: Truncate payloads (1-50,000 bytes)"
              }
              fullWidth
              disabled={loading}
              inputProps={{ min: 1, max: 50000 }}
              size="small"
            />

            {/* Messages Table - Always Visible */}
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              {messages.length > 0 ? `Retrieved Messages (${messages.length})` : "Messages"}
            </Typography>
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ maxHeight: 400, overflow: "auto" }}
            >
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width="50px"></TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Exchange</TableCell>
                    <TableCell>Routing Key</TableCell>
                    <TableCell>Encoding</TableCell>
                    <TableCell>Payload Preview</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {messages.length > 0 ? (
                    messages.map((message, index) => {
                      const isExpanded = expandedRows.has(index);
                      const { content: payloadContent, isBinary } =
                        formatPayload(message);

                      return (
                        <Fragment key={index}>
                          <TableRow hover>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => handleRowToggle(index)}
                                aria-label={
                                  isExpanded ? "Collapse" : "Expand"
                                }
                              >
                                {isExpanded ? (
                                  <ExpandLessIcon />
                                ) : (
                                  <ExpandMoreIcon />
                                )}
                              </IconButton>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                #{index + 1}
                              </Typography>
                              {message.redelivered !== undefined && (
                                <Chip
                                  label={
                                    message.redelivered
                                      ? "REDELIVERED"
                                      : "FIRST"
                                  }
                                  size="small"
                                  color={
                                    message.redelivered
                                      ? "warning"
                                      : "success"
                                  }
                                  variant="outlined"
                                  sx={{ mt: 0.5 }}
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {message.exchange || "(default)"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {message.routingKey || "(none)"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={message.payloadEncoding.toUpperCase()}
                                size="small"
                                color={
                                  message.payloadEncoding === "base64"
                                    ? "warning"
                                    : "default"
                                }
                                variant="outlined"
                              />
                              {isBinary && (
                                <Chip
                                  label="BINARY"
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                  sx={{ ml: 0.5 }}
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "monospace",
                                  maxWidth: 200,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {payloadContent
                                  ? truncateText(payloadContent, 50)
                                  : "(empty)"}
                              </Typography>
                            </TableCell>
                          </TableRow>

                          {/* Expanded Row Content */}
                          <TableRow>
                            <TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
                              <Collapse
                                in={isExpanded}
                                timeout="auto"
                                unmountOnExit
                              >
                                <Box
                                  sx={{ p: 2, backgroundColor: "grey.50" }}
                                >
                                  {/* Payload Section */}
                                  <Box sx={{ mb: 2 }}>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        mb: 1,
                                      }}
                                    >
                                      <Typography
                                        variant="subtitle2"
                                        fontWeight="medium"
                                      >
                                        Payload
                                      </Typography>
                                      <Tooltip title="Copy payload to clipboard">
                                        <IconButton
                                          size="small"
                                          onClick={() =>
                                            handleCopyToClipboard(
                                              payloadContent,
                                              "Payload"
                                            )
                                          }
                                        >
                                          <ContentCopyIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                    <Paper
                                      variant="outlined"
                                      sx={{
                                        p: 1.5,
                                        backgroundColor: "white",
                                        fontFamily: "monospace",
                                        fontSize: "0.875rem",
                                        maxHeight: "200px",
                                        overflow: "auto",
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-all",
                                      }}
                                    >
                                      {payloadContent || "(empty payload)"}
                                    </Paper>
                                  </Box>

                                  {/* Properties Section */}
                                  {message.properties &&
                                    Object.keys(message.properties).length >
                                    0 && (
                                      <Box sx={{ mb: 2 }}>
                                        <Typography
                                          variant="subtitle2"
                                          fontWeight="medium"
                                          gutterBottom
                                        >
                                          Properties
                                        </Typography>
                                        <Paper
                                          variant="outlined"
                                          sx={{
                                            p: 1.5,
                                            backgroundColor: "white",
                                          }}
                                        >
                                          <pre
                                            style={{
                                              margin: 0,
                                              fontSize: "0.75rem",
                                              overflow: "auto",
                                            }}
                                          >
                                            {JSON.stringify(
                                              message.properties,
                                              null,
                                              2
                                            )}
                                          </pre>
                                        </Paper>
                                      </Box>
                                    )}

                                  {/* Message Count */}
                                  {message.messageCount !== undefined && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      Queue depth after retrieval:{" "}
                                      {message.messageCount} messages
                                    </Typography>
                                  )}
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </Fragment>
                      );
                    })) : (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          {messagesRetrieved && retrievedMessageCount === 0
                            ? `No messages found in queue "${formData.queue}"`
                            : "Click 'Get Messages' to retrieve messages from the queue"
                          }
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => {
              hasRetrievedMessages.current = false; // Reset the flag when closing
              onClose();
              onSuccess(); // Call onSuccess when dialog is closed
            }}
            disabled={loading}
          >
            {messages && messages.length > 0 ? "Close" : "Cancel"}
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || vhostsLoading || !!vhostsError}
          >
            {loading ? <CircularProgress size={20} /> : "Get Messages"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GetMessagesDialog;
