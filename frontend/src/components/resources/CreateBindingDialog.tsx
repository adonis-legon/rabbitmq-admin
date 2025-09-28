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
  Chip,
} from "@mui/material";
import { CreateBindingRequest } from "../../types/rabbitmq";
import { rabbitmqResourcesApi } from "../../services/api/rabbitmqResourcesApi";
import { useVirtualHosts } from "../../hooks/useVirtualHosts";
import { useWriteOperationNotifications } from "../../hooks/useWriteOperationNotifications";
import { useWriteOperationState } from "../../hooks/useWriteOperationState";
import KeyValueEditor from "../common/KeyValueEditor";

export type BindingContext = "exchange" | "queue";
export type DestinationType = "queue" | "exchange";

interface CreateBindingDialogProps {
  open: boolean;
  clusterId: string;
  context: BindingContext;
  sourceResource?: {
    name: string;
    vhost: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  vhost: string;
  source: string;
  destination: string;
  destinationType: DestinationType;
  routingKey: string;
  arguments: Record<string, any>;
}

interface FormErrors {
  vhost?: string;
  source?: string;
  destination?: string;
  routingKey?: string;
}

const CreateBindingDialog: React.FC<CreateBindingDialogProps> = ({
  open,
  clusterId,
  context,
  sourceResource,
  onClose,
  onSuccess,
}) => {
  const { notifyBindingCreated, notifyOperationError } =
    useWriteOperationNotifications();
  const { loading, executeOperation, reset } = useWriteOperationState();

  const {
    virtualHosts,
    loading: vhostsLoading,
    error: vhostsError,
  } = useVirtualHosts(clusterId);

  const [formData, setFormData] = useState<FormData>({
    vhost: sourceResource?.vhost || "",
    source: sourceResource?.name || "",
    destination: "",
    destinationType: context === "exchange" ? "queue" : "queue",
    routingKey: "",
    arguments: {},
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        vhost:
          sourceResource?.vhost ||
          (virtualHosts.length > 0 ? virtualHosts[0].name : ""),
        source: sourceResource?.name || "",
        destination: "",
        destinationType: context === "exchange" ? "queue" : "queue",
        routingKey: "",
        arguments: {},
      });
      setErrors({});
      setSubmitError(null);
      reset();
    }
  }, [open, sourceResource, virtualHosts, context, reset]);

  // Set default vhost when virtual hosts load
  useEffect(() => {
    if (virtualHosts.length > 0 && !formData.vhost && !sourceResource?.vhost) {
      setFormData((prev) => ({ ...prev, vhost: virtualHosts[0].name }));
    }
  }, [virtualHosts, formData.vhost, sourceResource?.vhost]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.vhost) {
      newErrors.vhost = "Virtual host is required";
    }

    if (context === "queue") {
      // When creating from queue context, source is the exchange name
      if (!formData.source.trim()) {
        newErrors.source = "Source exchange name is required";
      } else if (!/^[a-zA-Z0-9._-]*$/.test(formData.source)) {
        newErrors.source =
          "Exchange name can only contain letters, numbers, dots, underscores, and hyphens";
      }
    }

    if (!formData.destination.trim()) {
      const resourceType =
        formData.destinationType === "queue" ? "queue" : "exchange";
      newErrors.destination = `Destination ${resourceType} name is required`;
    } else if (!/^[a-zA-Z0-9._-]+$/.test(formData.destination)) {
      newErrors.destination =
        "Resource name can only contain letters, numbers, dots, underscores, and hyphens";
    }

    // Routing key validation (optional but if provided should be valid)
    if (formData.routingKey && formData.routingKey.length > 255) {
      newErrors.routingKey = "Routing key cannot exceed 255 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const request: CreateBindingRequest = {
      routingKey: formData.routingKey || "",
      arguments: formData.arguments,
    };

    try {
      await executeOperation(
        async () => {
          if (formData.destinationType === "queue") {
            return await rabbitmqResourcesApi.createExchangeToQueueBinding(
              clusterId,
              formData.vhost,
              formData.source,
              formData.destination,
              request
            );
          } else {
            return await rabbitmqResourcesApi.createExchangeToExchangeBinding(
              clusterId,
              formData.vhost,
              formData.source,
              formData.destination,
              request
            );
          }
        },
        () => {
          notifyBindingCreated(
            formData.source,
            formData.destination,
            formData.destinationType,
            formData.routingKey || undefined
          );
          onSuccess();
          onClose();
        },
        (err) => {
          notifyOperationError(
            "create",
            "Binding",
            `${formData.source} → ${formData.destination}`,
            err
          );
          setSubmitError(
            err.response?.data?.message ||
              err.message ||
              "Failed to create binding. Please try again."
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

  const handleArgumentsChange = (newArguments: Record<string, any>) => {
    setFormData((prev) => ({ ...prev, arguments: newArguments }));
  };

  const getDialogTitle = () => {
    if (context === "exchange") {
      return `Create Binding from Exchange "${sourceResource?.name}"`;
    } else {
      return `Create Binding to Queue "${sourceResource?.name}"`;
    }
  };

  const getSourceLabel = () => {
    return context === "exchange" ? "Source Exchange" : "Source Exchange Name";
  };

  const getDestinationLabel = () => {
    return formData.destinationType === "queue"
      ? "Destination Queue Name"
      : "Destination Exchange Name";
  };

  const getRoutingKeyHelperText = () => {
    if (formData.destinationType === "queue") {
      return "Routing key for message routing (leave empty for default routing)";
    } else {
      return "Routing key for exchange-to-exchange binding";
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: "500px" },
      }}
    >
      <DialogTitle>{getDialogTitle()}</DialogTitle>

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

          <FormControl fullWidth error={!!errors.vhost}>
            <InputLabel>Virtual Host</InputLabel>
            <Select
              value={formData.vhost}
              onChange={handleInputChange("vhost")}
              label="Virtual Host"
              disabled={loading || vhostsLoading || !!sourceResource?.vhost}
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
            {sourceResource?.vhost && (
              <FormHelperText>
                Virtual host is pre-selected based on the source resource
              </FormHelperText>
            )}
          </FormControl>

          <TextField
            label={getSourceLabel()}
            value={formData.source}
            onChange={handleInputChange("source")}
            error={!!errors.source}
            helperText={
              errors.source ||
              (context === "exchange"
                ? "Source exchange is pre-selected"
                : "Name of the exchange to bind from")
            }
            fullWidth
            required={context === "queue"}
            disabled={loading || context === "exchange"}
          />

          {context === "exchange" && (
            <FormControl fullWidth>
              <InputLabel>Destination Type</InputLabel>
              <Select
                value={formData.destinationType}
                onChange={handleInputChange("destinationType")}
                label="Destination Type"
                disabled={loading}
              >
                <MenuItem value="queue">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip label="Queue" size="small" color="primary" />
                    <Typography>Bind to Queue</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="exchange">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip label="Exchange" size="small" color="secondary" />
                    <Typography>Bind to Exchange</Typography>
                  </Box>
                </MenuItem>
              </Select>
              <FormHelperText>
                Choose whether to bind to a queue or another exchange
              </FormHelperText>
            </FormControl>
          )}

          <TextField
            label={getDestinationLabel()}
            value={formData.destination}
            onChange={handleInputChange("destination")}
            error={!!errors.destination}
            helperText={
              errors.destination ||
              `Name of the ${formData.destinationType} to bind to (resource will be created if it doesn't exist)`
            }
            fullWidth
            required
            disabled={loading}
          />

          <TextField
            label="Routing Key"
            value={formData.routingKey}
            onChange={handleInputChange("routingKey")}
            error={!!errors.routingKey}
            helperText={errors.routingKey || getRoutingKeyHelperText()}
            fullWidth
            disabled={loading}
            placeholder="e.g., user.created, order.#, *.important"
          />

          <KeyValueEditor
            label="Arguments"
            value={formData.arguments}
            onChange={handleArgumentsChange}
            keyLabel="Argument Name"
            valueLabel="Argument Value"
            helperText="Optional arguments for binding configuration (e.g., x-match for headers exchange)"
            disabled={loading}
          />

          <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Binding Preview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Source:</strong> {formData.source || "(not specified)"}{" "}
              (exchange)
              <br />
              <strong>Destination:</strong>{" "}
              {formData.destination || "(not specified)"} (
              {formData.destinationType})
              <br />
              <strong>Routing Key:</strong> {formData.routingKey || "(empty)"}
              <br />
              <strong>Virtual Host:</strong>{" "}
              {formData.vhost || "(not selected)"}
            </Typography>
          </Box>
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
          {loading ? <CircularProgress size={20} /> : "Create Binding"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateBindingDialog;
