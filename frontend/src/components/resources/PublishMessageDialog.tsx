import React, { useState, useEffect } from "react";
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from "@mui/material";
import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import { PublishMessageRequest } from "../../types/rabbitmq";
import { rabbitmqResourcesApi } from "../../services/api/rabbitmqResourcesApi";
import { useVirtualHosts } from "../../hooks/useVirtualHosts";
import { useWriteOperationNotifications } from "../../hooks/useWriteOperationNotifications";
import { useWriteOperationState } from "../../hooks/useWriteOperationState";
import KeyValueEditor from "../common/KeyValueEditor";

export type PublishContext = "exchange" | "queue";

interface PublishMessageDialogProps {
  open: boolean;
  clusterId: string;
  context: PublishContext;
  targetResource?: {
    name: string;
    vhost: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  vhost: string;
  target: string;
  routingKey: string;
  properties: Record<string, any>;
  headers: Record<string, any>;
  payload: string;
  payloadEncoding: "string" | "base64";
}

interface FormErrors {
  vhost?: string;
  target?: string;
  routingKey?: string;
  payload?: string;
}

const PAYLOAD_ENCODINGS = [
  {
    value: "string" as const,
    label: "String (UTF-8)",
    description: "Plain text message content",
  },
  {
    value: "base64" as const,
    label: "Base64",
    description: "Binary data encoded as Base64",
  },
];

const COMMON_PROPERTIES = [
  {
    key: "delivery_mode",
    label: "Delivery Mode",
    type: "number",
    description: "1 = non-persistent, 2 = persistent",
  },
  {
    key: "priority",
    label: "Priority",
    type: "number",
    description: "Message priority (0-255)",
  },
  {
    key: "correlation_id",
    label: "Correlation ID",
    type: "string",
    description: "Application correlation identifier",
  },
  {
    key: "reply_to",
    label: "Reply To",
    type: "string",
    description: "Queue name for replies",
  },
  {
    key: "expiration",
    label: "Expiration",
    type: "string",
    description: "Message TTL in milliseconds",
  },
  {
    key: "message_id",
    label: "Message ID",
    type: "string",
    description: "Application message identifier",
  },
  {
    key: "timestamp",
    label: "Timestamp",
    type: "number",
    description: "Message timestamp (Unix epoch)",
  },
  {
    key: "type",
    label: "Type",
    type: "string",
    description: "Message type name",
  },
  {
    key: "user_id",
    label: "User ID",
    type: "string",
    description: "Creating user ID",
  },
  {
    key: "app_id",
    label: "App ID",
    type: "string",
    description: "Creating application ID",
  },
];

const PublishMessageDialog: React.FC<PublishMessageDialogProps> = ({
  open,
  clusterId,
  context,
  targetResource,
  onClose,
  onSuccess,
}) => {
  const { notifyMessagePublished, notifyOperationError } =
    useWriteOperationNotifications();
  const { loading, executeOperation, reset } = useWriteOperationState();

  const {
    virtualHosts,
    loading: vhostsLoading,
    error: vhostsError,
  } = useVirtualHosts(clusterId);

  const [formData, setFormData] = useState<FormData>({
    vhost: targetResource?.vhost || "",
    target: targetResource?.name || "",
    routingKey: "",
    properties: {},
    headers: {},
    payload: "",
    payloadEncoding: "string",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    properties: false,
    headers: false,
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        vhost:
          targetResource?.vhost ||
          (virtualHosts.length > 0 ? virtualHosts[0].name : ""),
        target: targetResource?.name || "",
        routingKey: context === "queue" ? targetResource?.name || "" : "",
        properties: {},
        headers: {},
        payload: "",
        payloadEncoding: "string",
      });
      setErrors({});
      setSubmitError(null);
      setExpandedSections({
        properties: false,
        headers: false,
      });
      reset();
    }
  }, [open, targetResource, virtualHosts, context, reset]);

  // Set default vhost when virtual hosts load
  useEffect(() => {
    if (virtualHosts.length > 0 && !formData.vhost && !targetResource?.vhost) {
      setFormData((prev) => ({ ...prev, vhost: virtualHosts[0].name }));
    }
  }, [virtualHosts, formData.vhost, targetResource?.vhost]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.vhost) {
      newErrors.vhost = "Virtual host is required";
    }

    if (!formData.target.trim()) {
      const resourceType = context === "exchange" ? "exchange" : "queue";
      newErrors.target = `Target ${resourceType} name is required`;
    } else if (!/^[a-zA-Z0-9._-]*$/.test(formData.target)) {
      newErrors.target =
        "Resource name can only contain letters, numbers, dots, underscores, and hyphens";
    }

    // Routing key validation (optional but if provided should be valid)
    if (formData.routingKey && formData.routingKey.length > 255) {
      newErrors.routingKey = "Routing key cannot exceed 255 characters";
    }

    if (!formData.payload.trim()) {
      newErrors.payload = "Message payload is required";
    } else if (formData.payloadEncoding === "base64") {
      // Validate base64 format
      try {
        atob(formData.payload);
      } catch {
        newErrors.payload = "Invalid Base64 format";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const request: PublishMessageRequest = {
      routingKey: formData.routingKey || "",
      properties: {
        ...formData.properties,
        ...(Object.keys(formData.headers).length > 0 && {
          headers: formData.headers,
        }),
      },
      payload: formData.payload.trim(),
      payloadEncoding: formData.payloadEncoding,
    };

    try {
      await executeOperation(
        async () => {
          if (context === "exchange") {
            return await rabbitmqResourcesApi.publishMessage(
              clusterId,
              formData.vhost,
              formData.target,
              request
            );
          } else {
            return await rabbitmqResourcesApi.publishToQueue(
              clusterId,
              formData.vhost,
              formData.target,
              request
            );
          }
        },
        (response) => {
          notifyMessagePublished(
            context,
            formData.target,
            response.routed,
            formData.routingKey || undefined
          );
          onSuccess();
          onClose();
        },
        (err) => {
          notifyOperationError(
            "publish message to",
            context,
            formData.target,
            err
          );
          setSubmitError(
            err.response?.data?.message ||
              err.message ||
              "Failed to publish message. Please try again."
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

  const handlePropertiesChange = (newProperties: Record<string, any>) => {
    setFormData((prev) => ({ ...prev, properties: newProperties }));
  };

  const handleHeadersChange = (newHeaders: Record<string, any>) => {
    setFormData((prev) => ({ ...prev, headers: newHeaders }));
  };

  const handleAccordionChange =
    (section: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedSections((prev) => ({ ...prev, [section]: isExpanded }));
    };

  const getDialogTitle = () => {
    const resourceType = context === "exchange" ? "Exchange" : "Queue";
    if (targetResource?.name) {
      return `Publish Message to ${resourceType} "${targetResource.name}"`;
    }
    return `Publish Message to ${resourceType}`;
  };

  const getTargetLabel = () => {
    return context === "exchange" ? "Target Exchange" : "Target Queue";
  };

  const getRoutingKeyHelperText = () => {
    if (context === "exchange") {
      return "Routing key for message routing (leave empty for default routing)";
    } else {
      return "Routing key is automatically set to the queue name for direct queue publishing";
    }
  };

  const selectedEncoding = PAYLOAD_ENCODINGS.find(
    (enc) => enc.value === formData.payloadEncoding
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: "600px", maxHeight: "90vh" },
      }}
    >
      <DialogTitle>{getDialogTitle()}</DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
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

          <FormControl fullWidth error={!!errors.vhost}>
            <InputLabel>Virtual Host</InputLabel>
            <Select
              value={formData.vhost}
              onChange={handleInputChange("vhost")}
              label="Virtual Host"
              disabled={loading || vhostsLoading || !!targetResource?.vhost}
            >
              {vhostsLoading ? (
                <MenuItem disabled>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Loading virtual hosts...
                </MenuItem>
              ) : virtualHosts.length === 0 ? (
                <MenuItem disabled>No virtual hosts available</MenuItem>
              ) : (
                virtualHosts.map((vhost) => (
                  <MenuItem key={vhost.name} value={vhost.name}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {vhost.name === "/" ? "/ (default)" : vhost.name}
                      </Typography>
                      {vhost.description && (
                        <Typography variant="caption" color="text.secondary">
                          {vhost.description}
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                ))
              )}
            </Select>
            {errors.vhost && <FormHelperText>{errors.vhost}</FormHelperText>}
            {targetResource?.vhost && (
              <FormHelperText>
                Virtual host is pre-selected based on the target resource
              </FormHelperText>
            )}
          </FormControl>

          <TextField
            label={getTargetLabel()}
            value={formData.target}
            onChange={handleInputChange("target")}
            error={!!errors.target}
            helperText={
              errors.target ||
              (targetResource?.name
                ? "Target resource is pre-selected"
                : `Name of the ${context} to publish to`)
            }
            fullWidth
            required
            disabled={loading || !!targetResource?.name}
          />

          <TextField
            label="Routing Key"
            value={formData.routingKey}
            onChange={handleInputChange("routingKey")}
            error={!!errors.routingKey}
            helperText={errors.routingKey || getRoutingKeyHelperText()}
            fullWidth
            disabled={loading || context === "queue"}
            placeholder="e.g., user.created, order.#, *.important"
          />

          <FormControl fullWidth>
            <InputLabel>Payload Encoding</InputLabel>
            <Select
              value={formData.payloadEncoding}
              onChange={handleInputChange("payloadEncoding")}
              label="Payload Encoding"
              disabled={loading}
            >
              {PAYLOAD_ENCODINGS.map((encoding) => (
                <MenuItem key={encoding.value} value={encoding.value}>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {encoding.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {encoding.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {selectedEncoding && (
              <FormHelperText>{selectedEncoding.description}</FormHelperText>
            )}
          </FormControl>

          <TextField
            label="Message Payload"
            value={formData.payload}
            onChange={handleInputChange("payload")}
            error={!!errors.payload}
            helperText={
              errors.payload ||
              (formData.payloadEncoding === "base64"
                ? "Enter Base64-encoded binary data"
                : "Enter the message content as plain text")
            }
            fullWidth
            required
            multiline
            rows={4}
            disabled={loading}
            placeholder={
              formData.payloadEncoding === "base64"
                ? "SGVsbG8gV29ybGQ="
                : '{"message": "Hello World", "timestamp": "2023-01-01T00:00:00Z"}'
            }
          />

          <Accordion
            expanded={expandedSections.properties}
            onChange={handleAccordionChange("properties")}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="subtitle1">Message Properties</Typography>
                {Object.keys(formData.properties).length > 0 && (
                  <Chip
                    label={`${Object.keys(formData.properties).length} set`}
                    size="small"
                    color="primary"
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Common message properties (optional):
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                  {COMMON_PROPERTIES.map((prop) => (
                    <Button
                      key={prop.key}
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        const newProperties = { ...formData.properties };
                        if (!(prop.key in newProperties)) {
                          newProperties[prop.key] =
                            prop.type === "number" ? 0 : "";
                          handlePropertiesChange(newProperties);
                        }
                      }}
                      disabled={prop.key in formData.properties}
                    >
                      {prop.label}
                    </Button>
                  ))}
                </Box>
              </Box>
              <KeyValueEditor
                label="Properties"
                value={formData.properties}
                onChange={handlePropertiesChange}
                keyLabel="Property Name"
                valueLabel="Property Value"
                helperText="Message properties like delivery_mode, priority, correlation_id, etc."
                disabled={loading}
              />
            </AccordionDetails>
          </Accordion>

          <Accordion
            expanded={expandedSections.headers}
            onChange={handleAccordionChange("headers")}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="subtitle1">Message Headers</Typography>
                {Object.keys(formData.headers).length > 0 && (
                  <Chip
                    label={`${Object.keys(formData.headers).length} set`}
                    size="small"
                    color="secondary"
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <KeyValueEditor
                label="Headers"
                value={formData.headers}
                onChange={handleHeadersChange}
                keyLabel="Header Name"
                valueLabel="Header Value"
                helperText="Custom application headers for message metadata and routing"
                disabled={loading}
              />
            </AccordionDetails>
          </Accordion>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || vhostsLoading || !!vhostsError}
        >
          {loading ? <CircularProgress size={20} /> : "Publish Message"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PublishMessageDialog;
