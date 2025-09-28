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
  FormControlLabel,
  Switch,
  Box,
  Typography,
  CircularProgress,
  Alert,
  FormHelperText,
} from "@mui/material";
import { CreateQueueRequest } from "../../types/rabbitmq";
import { rabbitmqResourcesApi } from "../../services/api/rabbitmqResourcesApi";
import { useVirtualHosts } from "../../hooks/useVirtualHosts";
import { useWriteOperationNotifications } from "../../hooks/useWriteOperationNotifications";
import { useWriteOperationState } from "../../hooks/useWriteOperationState";
import KeyValueEditor from "../common/KeyValueEditor";

interface CreateQueueDialogProps {
  open: boolean;
  clusterId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  vhost: string;
  durable: boolean;
  autoDelete: boolean;
  exclusive: boolean;
  arguments: Record<string, any>;
  node: string;
}

interface FormErrors {
  name?: string;
  vhost?: string;
  node?: string;
}

const CreateQueueDialog: React.FC<CreateQueueDialogProps> = ({
  open,
  clusterId,
  onClose,
  onSuccess,
}) => {
  const { notifyQueueCreated, notifyOperationError } =
    useWriteOperationNotifications();
  const { loading, executeOperation, reset } = useWriteOperationState();

  const {
    virtualHosts,
    loading: vhostsLoading,
    error: vhostsError,
  } = useVirtualHosts(clusterId);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    vhost: "",
    durable: true,
    autoDelete: false,
    exclusive: false,
    arguments: {},
    node: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: "",
        vhost: virtualHosts.length > 0 ? virtualHosts[0].name : "",
        durable: true,
        autoDelete: false,
        exclusive: false,
        arguments: {},
        node: "",
      });
      setErrors({});
      setSubmitError(null);
      reset();
    }
  }, [open, virtualHosts, reset]);

  // Set default vhost when virtual hosts load
  useEffect(() => {
    if (virtualHosts.length > 0 && !formData.vhost) {
      setFormData((prev) => ({ ...prev, vhost: virtualHosts[0].name }));
    }
  }, [virtualHosts, formData.vhost]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Queue name is required";
    } else if (formData.name.length < 1) {
      newErrors.name = "Queue name cannot be empty";
    } else if (!/^[a-zA-Z0-9._-]+$/.test(formData.name)) {
      newErrors.name =
        "Queue name can only contain letters, numbers, dots, underscores, and hyphens";
    }

    if (!formData.vhost) {
      newErrors.vhost = "Virtual host is required";
    }

    // Node is optional, but if provided, validate format
    if (formData.node && !/^[a-zA-Z0-9._@-]+$/.test(formData.node)) {
      newErrors.node =
        "Node name can only contain letters, numbers, dots, underscores, @ symbols, and hyphens";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const request: CreateQueueRequest = {
      name: formData.name.trim(),
      vhost: formData.vhost,
      durable: formData.durable,
      autoDelete: formData.autoDelete,
      exclusive: formData.exclusive,
      arguments: formData.arguments,
      ...(formData.node.trim() && { node: formData.node.trim() }),
    };

    try {
      await executeOperation(
        () => rabbitmqResourcesApi.createQueue(clusterId, request),
        () => {
          notifyQueueCreated(formData.name, formData.durable);
          onSuccess();
          onClose();
        },
        (err) => {
          notifyOperationError("create", "Queue", formData.name, err);
          setSubmitError(
            err.response?.data?.message ||
              err.message ||
              "Failed to create queue. Please try again."
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
      const value = ["durable", "autoDelete", "exclusive"].includes(field)
        ? event.target.checked
        : event.target.value;

      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear error when user starts typing
      if (errors[field as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  const handleArgumentsChange = (newArguments: Record<string, any>) => {
    setFormData((prev) => ({ ...prev, arguments: newArguments }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: "600px" },
      }}
    >
      <DialogTitle>Create New Queue</DialogTitle>

      <DialogContent>
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

          <TextField
            label="Queue Name"
            value={formData.name}
            onChange={handleInputChange("name")}
            error={!!errors.name}
            helperText={
              errors.name ||
              "A unique name for the queue within the virtual host"
            }
            fullWidth
            required
            disabled={loading}
          />

          <FormControl fullWidth error={!!errors.vhost}>
            <InputLabel id="virtual-host-label">Virtual Host</InputLabel>
            <Select
              labelId="virtual-host-label"
              value={formData.vhost}
              onChange={handleInputChange("vhost")}
              label="Virtual Host"
              disabled={loading || vhostsLoading}
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
          </FormControl>

          <TextField
            label="Node (Optional)"
            value={formData.node}
            onChange={handleInputChange("node")}
            error={!!errors.node}
            helperText={
              errors.node ||
              "Specific cluster node to create the queue on (leave empty for automatic selection)"
            }
            fullWidth
            disabled={loading}
          />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Queue Options
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.durable}
                  onChange={handleInputChange("durable")}
                  disabled={loading}
                />
              }
              label="Durable"
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ ml: 4, mt: -1 }}
            >
              Queue survives server restarts
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.autoDelete}
                  onChange={handleInputChange("autoDelete")}
                  disabled={loading}
                />
              }
              label="Auto Delete"
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ ml: 4, mt: -1 }}
            >
              Queue is deleted when last consumer unsubscribes
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.exclusive}
                  onChange={handleInputChange("exclusive")}
                  disabled={loading}
                />
              }
              label="Exclusive"
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ ml: 4, mt: -1 }}
            >
              Queue can only be accessed by the current connection and is
              deleted when connection closes
            </Typography>
          </Box>

          <KeyValueEditor
            label="Arguments"
            value={formData.arguments}
            onChange={handleArgumentsChange}
            keyLabel="Argument Name"
            valueLabel="Argument Value"
            helperText="Optional arguments for queue configuration (e.g., x-message-ttl, x-max-length)"
            disabled={loading}
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
          {loading ? <CircularProgress size={20} /> : "Create Queue"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateQueueDialog;
