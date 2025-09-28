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
import { CreateExchangeRequest } from "../../types/rabbitmq";
import { rabbitmqResourcesApi } from "../../services/api/rabbitmqResourcesApi";
import { useVirtualHosts } from "../../hooks/useVirtualHosts";
import { useWriteOperationNotifications } from "../../hooks/useWriteOperationNotifications";
import { useWriteOperationState } from "../../hooks/useWriteOperationState";
import KeyValueEditor from "../common/KeyValueEditor";

interface CreateExchangeDialogProps {
  open: boolean;
  clusterId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  type: "direct" | "fanout" | "topic" | "headers";
  vhost: string;
  durable: boolean;
  autoDelete: boolean;
  internal: boolean;
  arguments: Record<string, any>;
}

interface FormErrors {
  name?: string;
  type?: string;
  vhost?: string;
}

const EXCHANGE_TYPES = [
  {
    value: "direct",
    label: "Direct",
    description: "Routes messages with exact routing key match",
  },
  {
    value: "fanout",
    label: "Fanout",
    description: "Routes messages to all bound queues",
  },
  {
    value: "topic",
    label: "Topic",
    description: "Routes messages using pattern matching",
  },
  {
    value: "headers",
    label: "Headers",
    description: "Routes messages based on header attributes",
  },
] as const;

const CreateExchangeDialog: React.FC<CreateExchangeDialogProps> = ({
  open,
  clusterId,
  onClose,
  onSuccess,
}) => {
  const { notifyExchangeCreated, notifyOperationError } =
    useWriteOperationNotifications();
  const { loading, executeOperation, reset } = useWriteOperationState();

  const {
    virtualHosts,
    loading: vhostsLoading,
    error: vhostsError,
  } = useVirtualHosts(clusterId);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    type: "direct",
    vhost: "",
    durable: true,
    autoDelete: false,
    internal: false,
    arguments: {},
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: "",
        type: "direct",
        vhost: virtualHosts.length > 0 ? virtualHosts[0].name : "",
        durable: true,
        autoDelete: false,
        internal: false,
        arguments: {},
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
      newErrors.name = "Exchange name is required";
    } else if (formData.name.length < 1) {
      newErrors.name = "Exchange name cannot be empty";
    } else if (!/^[a-zA-Z0-9._-]+$/.test(formData.name)) {
      newErrors.name =
        "Exchange name can only contain letters, numbers, dots, underscores, and hyphens";
    }

    if (!formData.type) {
      newErrors.type = "Exchange type is required";
    }

    if (!formData.vhost) {
      newErrors.vhost = "Virtual host is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const request: CreateExchangeRequest = {
      name: formData.name.trim(),
      type: formData.type,
      vhost: formData.vhost,
      durable: formData.durable,
      autoDelete: formData.autoDelete,
      internal: formData.internal,
      arguments: formData.arguments,
    };

    try {
      await executeOperation(
        () => rabbitmqResourcesApi.createExchange(clusterId, request),
        () => {
          notifyExchangeCreated(formData.name, formData.type);
          onSuccess();
          onClose();
        },
        (err) => {
          notifyOperationError("create", "Exchange", formData.name, err);
          setSubmitError(
            err.response?.data?.message ||
              err.message ||
              "Failed to create exchange. Please try again."
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
      const value = ["durable", "autoDelete", "internal"].includes(field)
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

  const selectedExchangeType = EXCHANGE_TYPES.find(
    (type) => type.value === formData.type
  );

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
      <DialogTitle>Create New Exchange</DialogTitle>

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
            label="Exchange Name"
            value={formData.name}
            onChange={handleInputChange("name")}
            error={!!errors.name}
            helperText={
              errors.name ||
              "A unique name for the exchange within the virtual host"
            }
            fullWidth
            required
            disabled={loading}
          />

          <FormControl fullWidth error={!!errors.type}>
            <InputLabel htmlFor="exchange-type-select">
              Exchange Type
            </InputLabel>
            <Select
              id="exchange-type-select"
              value={formData.type}
              onChange={handleInputChange("type")}
              label="Exchange Type"
              disabled={loading}
            >
              {EXCHANGE_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {type.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {type.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
            {selectedExchangeType && (
              <FormHelperText>
                {selectedExchangeType.description}
              </FormHelperText>
            )}
          </FormControl>

          <FormControl fullWidth error={!!errors.vhost}>
            <InputLabel htmlFor="virtual-host-select">Virtual Host</InputLabel>
            <Select
              id="virtual-host-select"
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

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Exchange Options
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
              Exchange survives server restarts
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
              Exchange is deleted when last queue is unbound
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.internal}
                  onChange={handleInputChange("internal")}
                  disabled={loading}
                />
              }
              label="Internal"
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ ml: 4, mt: -1 }}
            >
              Exchange cannot be used by publishers, only for
              exchange-to-exchange bindings
            </Typography>
          </Box>

          <KeyValueEditor
            label="Arguments"
            value={formData.arguments}
            onChange={handleArgumentsChange}
            keyLabel="Argument Name"
            valueLabel="Argument Value"
            helperText="Optional arguments for exchange configuration (e.g., alternate-exchange)"
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
          data-testid="create-exchange-submit"
        >
          {loading ? <CircularProgress size={20} /> : "Create Exchange"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateExchangeDialog;
