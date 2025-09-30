import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Paper,
  IconButton,
  Tooltip,
  Alert,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ContentCopy as ContentCopyIcon,
} from "@mui/icons-material";
import { Message } from "../../types/rabbitmq";
import { useNotification } from "../../contexts/NotificationContext";

interface MessageDisplayDialogProps {
  open: boolean;
  messages: Message[];
  queueName: string;
  onClose: () => void;
}

interface MessageProperty {
  key: string;
  value: any;
  type: string;
}

const MessageDisplayDialog: React.FC<MessageDisplayDialogProps> = ({
  open,
  messages,
  queueName,
  onClose,
}) => {
  const { success } = useNotification();
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(
    new Set([0]) // Expand first message by default
  );

  // Reset expanded state when messages change
  useEffect(() => {
    setExpandedMessages(new Set([0])); // Always expand first message when messages change
  }, [messages]);

  const handleMessageToggle = (index: number) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedMessages(newExpanded);
  };

  const handleCopyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      success(`${label} copied to clipboard`);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const formatPropertyValue = (value: any): string => {
    if (value === null || value === undefined) {
      return "null";
    }
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getPropertyType = (value: any): string => {
    if (value === null || value === undefined) {
      return "null";
    }
    if (Array.isArray(value)) {
      return "array";
    }
    return typeof value;
  };

  const parseMessageProperties = (
    properties: Record<string, any> = {}
  ): MessageProperty[] => {
    return Object.entries(properties)
      .filter(([key]) => key !== "headers") // Headers are handled separately
      .map(([key, value]) => ({
        key,
        value,
        type: getPropertyType(value),
      }));
  };

  const parseMessageHeaders = (
    properties: Record<string, any> = {}
  ): MessageProperty[] => {
    const headers = properties.headers;
    if (!headers || typeof headers !== "object") {
      return [];
    }
    return Object.entries(headers).map(([key, value]) => ({
      key,
      value,
      type: getPropertyType(value),
    }));
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

  const getEncodingChip = (encoding: string) => {
    const color = encoding === "base64" ? "warning" : "default";
    return (
      <Chip
        label={encoding.toUpperCase()}
        size="small"
        color={color}
        variant="outlined"
      />
    );
  };

  const getRedeliveredChip = (redelivered?: boolean) => {
    if (redelivered === undefined) return null;
    return (
      <Chip
        label={redelivered ? "REDELIVERED" : "FIRST DELIVERY"}
        size="small"
        color={redelivered ? "warning" : "success"}
        variant="outlined"
      />
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { maxHeight: "90vh", height: "auto" },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="h6" component="span">
            Messages from Queue "{queueName}"
          </Typography>
          <Chip
            label={`${messages.length} message${
              messages.length === 1 ? "" : "s"
            }`}
            color="primary"
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 1, overflow: "auto" }}>
        {messages.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No messages were retrieved from the queue.
          </Alert>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {messages.map((message, index) => {
              const properties = parseMessageProperties(message.properties);
              const headers = parseMessageHeaders(message.properties);
              const { content: payloadContent, isBinary } =
                formatPayload(message);
              const isExpanded = expandedMessages.has(index);

              return (
                <Paper
                  key={index}
                  variant="outlined"
                  sx={{ overflow: "hidden" }}
                >
                  <Accordion
                    expanded={isExpanded}
                    onChange={() => handleMessageToggle(index)}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        backgroundColor: "action.hover",
                        "& .MuiAccordionSummary-content": {
                          alignItems: "center",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          width: "100%",
                        }}
                      >
                        <Typography variant="subtitle1" fontWeight="medium">
                          Message {index + 1}
                        </Typography>

                        {message.exchange && (
                          <Chip
                            label={`Exchange: ${message.exchange}`}
                            size="small"
                            variant="outlined"
                          />
                        )}

                        {message.routingKey && (
                          <Chip
                            label={`Key: ${message.routingKey}`}
                            size="small"
                            variant="outlined"
                          />
                        )}

                        {getEncodingChip(message.payloadEncoding)}
                        {getRedeliveredChip(message.redelivered)}

                        <Box sx={{ flexGrow: 1 }} />

                        {message.messageCount !== undefined && (
                          <Typography variant="caption" color="text.secondary">
                            Queue depth: {message.messageCount}
                          </Typography>
                        )}
                      </Box>
                    </AccordionSummary>

                    <AccordionDetails sx={{ p: 0 }}>
                      <Box sx={{ p: 2 }}>
                        {/* Message Payload */}
                        <Box sx={{ mb: 3 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1,
                            }}
                          >
                            <Typography variant="subtitle2" fontWeight="medium">
                              Payload
                            </Typography>
                            <Tooltip title="Copy payload to clipboard">
                              <IconButton
                                size="small"
                                aria-label="Copy payload to clipboard"
                                data-testid="copy-payload-button"
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
                            {isBinary && (
                              <Chip
                                label="BINARY"
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                            )}
                          </Box>
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 2,
                              backgroundColor: "grey.50",
                              fontFamily: "monospace",
                              fontSize: "0.875rem",
                              maxHeight: "400px",
                              overflow: "auto",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-all",
                            }}
                          >
                            {payloadContent || "(empty payload)"}
                          </Paper>
                        </Box>

                        {/* Message Properties */}
                        {properties.length > 0 && (
                          <Box sx={{ mb: 3 }}>
                            <Typography
                              variant="subtitle2"
                              fontWeight="medium"
                              gutterBottom
                            >
                              Properties
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 1,
                                }}
                              >
                                {properties.map((prop, propIndex) => (
                                  <Box
                                    key={propIndex}
                                    sx={{
                                      display: "flex",
                                      alignItems: "flex-start",
                                      gap: 2,
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      fontWeight="medium"
                                      sx={{
                                        minWidth: "120px",
                                        color: "text.secondary",
                                      }}
                                    >
                                      {prop.key}:
                                    </Typography>
                                    <Box sx={{ flexGrow: 1 }}>
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontFamily: "monospace",
                                          wordBreak: "break-all",
                                        }}
                                      >
                                        {formatPropertyValue(prop.value)}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        ({prop.type})
                                      </Typography>
                                    </Box>
                                  </Box>
                                ))}
                              </Box>
                            </Paper>
                          </Box>
                        )}

                        {/* Message Headers */}
                        {headers.length > 0 && (
                          <Box>
                            <Typography
                              variant="subtitle2"
                              fontWeight="medium"
                              gutterBottom
                            >
                              Headers
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 1,
                                }}
                              >
                                {headers.map((header, headerIndex) => (
                                  <Box
                                    key={headerIndex}
                                    sx={{
                                      display: "flex",
                                      alignItems: "flex-start",
                                      gap: 2,
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      fontWeight="medium"
                                      sx={{
                                        minWidth: "120px",
                                        color: "text.secondary",
                                      }}
                                    >
                                      {header.key}:
                                    </Typography>
                                    <Box sx={{ flexGrow: 1 }}>
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontFamily: "monospace",
                                          wordBreak: "break-all",
                                        }}
                                      >
                                        {formatPropertyValue(header.value)}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        ({header.type})
                                      </Typography>
                                    </Box>
                                  </Box>
                                ))}
                              </Box>
                            </Paper>
                          </Box>
                        )}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </Paper>
              );
            })}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MessageDisplayDialog;
