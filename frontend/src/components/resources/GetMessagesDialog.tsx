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
  Slider,
} from "@mui/material";
import { GetMessagesRequest, Message } from "../../types/rabbitmq";
import { rabbitmqResourcesApi } from "../../services/api/rabbitmqResourcesApi";
import { useVirtualHosts } from "../../hooks/useVirtualHosts";
import { useWriteOperationNotifications } from "../../hooks/useWriteOperationNotifications";
import { useWriteOperationState } from "../../hooks/useWriteOperationState";
import MessageDisplayDialog from "./MessageDisplayDialog";

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

  const {
    virtualHosts,
    loading: vhostsLoading,
    error: vhostsError,
  } = useVirtualHosts(clusterId);

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
  const [showMessages, setShowMessages] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        vhost:
          targetQueue?.vhost ||
          (virtualHosts.length > 0 ? virtualHosts[0].name : ""),
        queue: targetQueue?.name || "",
        count: 1,
        ackmode: "ack_requeue_true",
        encoding: "auto",
        truncate: undefined,
      });
      setErrors({});
      setSubmitError(null);
      setMessages([]);
      setShowMessages(false);
      reset();
    }
  }, [open, targetQueue, virtualHosts, reset]);

  // Set default vhost when virtual hosts load
  useEffect(() => {
    if (virtualHosts.length > 0 && !formData.vhost && !targetQueue?.vhost) {
      setFormData((prev) => ({ ...prev, vhost: virtualHosts[0].name }));
    }
  }, [virtualHosts, formData.vhost, targetQueue?.vhost]);

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

    const request: GetMessagesRequest = {
      count: formData.count,
      ackmode: formData.ackmode,
      encoding: formData.encoding,
      ...(formData.truncate && { truncate: formData.truncate }),
    };

    try {
      await executeOperation(
        () =>
          rabbitmqResourcesApi.getMessages(
            clusterId,
            formData.vhost,
            formData.queue,
            request
          ),
        (retrievedMessages) => {
          setMessages(retrievedMessages);
          notifyMessagesRetrieved(
            formData.queue,
            retrievedMessages.length,
            formData.ackmode
          );

          if (retrievedMessages.length > 0) {
            setShowMessages(true);
          }

          onSuccess();
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

  const selectedAckMode = ACKNOWLEDGMENT_MODES.find(
    (mode) => mode.value === formData.ackmode
  );

  const selectedEncoding = ENCODING_OPTIONS.find(
    (enc) => enc.value === formData.encoding
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { minHeight: "500px" },
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
                disabled={loading || vhostsLoading || !!targetQueue?.vhost}
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
              {targetQueue?.vhost && (
                <FormHelperText>
                  Virtual host is pre-selected based on the target queue
                </FormHelperText>
              )}
            </FormControl>

            <TextField
              label="Queue Name"
              value={formData.queue}
              onChange={handleInputChange("queue")}
              error={!!errors.queue}
              helperText={
                errors.queue ||
                (targetQueue?.name
                  ? "Queue is pre-selected"
                  : "Name of the queue to retrieve messages from")
              }
              fullWidth
              required
              disabled={loading || !!targetQueue?.name}
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
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
                  { value: 10, label: "10" },
                  { value: 50, label: "50" },
                  { value: 100, label: "100" },
                ]}
                disabled={loading}
              />
              <FormHelperText>
                Number of messages to retrieve (1-100)
              </FormHelperText>
              {errors.count && (
                <FormHelperText error>{errors.count}</FormHelperText>
              )}
            </Box>

            <FormControl fullWidth>
              <InputLabel>Acknowledgment Mode</InputLabel>
              <Select
                value={formData.ackmode}
                onChange={handleInputChange("ackmode")}
                label="Acknowledgment Mode"
                disabled={loading}
              >
                {ACKNOWLEDGMENT_MODES.map((mode) => (
                  <MenuItem key={mode.value} value={mode.value}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {mode.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {mode.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {selectedAckMode && (
                <FormHelperText>{selectedAckMode.description}</FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Encoding</InputLabel>
              <Select
                value={formData.encoding}
                onChange={handleInputChange("encoding")}
                label="Encoding"
                disabled={loading}
              >
                {ENCODING_OPTIONS.map((encoding) => (
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
              label="Truncate Limit (bytes)"
              type="number"
              value={formData.truncate || ""}
              onChange={handleTruncateChange}
              error={!!errors.truncate}
              helperText={
                errors.truncate ||
                "Optional: Truncate message payloads longer than this limit (1-50,000 bytes)"
              }
              fullWidth
              disabled={loading}
              inputProps={{ min: 1, max: 50000 }}
            />
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
            {loading ? <CircularProgress size={20} /> : "Get Messages"}
          </Button>
        </DialogActions>
      </Dialog>

      <MessageDisplayDialog
        open={showMessages}
        messages={messages}
        queueName={formData.queue}
        onClose={() => setShowMessages(false)}
      />
    </>
  );
};

export default GetMessagesDialog;
