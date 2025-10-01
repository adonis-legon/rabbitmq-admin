import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Box,
  Alert,
} from "@mui/material";

export type DeleteType = "exchange" | "queue" | "purge";

export interface DeleteOptions {
  ifUnused?: boolean;
  ifEmpty?: boolean;
}

export interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (options: DeleteOptions) => Promise<void>;
  deleteType: DeleteType;
  resourceName: string;
  loading?: boolean;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  deleteType,
  resourceName,
  loading = false,
}) => {
  const [options, setOptions] = useState<DeleteOptions>({
    ifUnused: false,
    ifEmpty: false,
  });

  const handleClose = () => {
    if (!loading) {
      setOptions({ ifUnused: false, ifEmpty: false });
      onClose();
    }
  };

  const handleConfirm = async () => {
    try {
      await onConfirm(options);
      handleClose();
    } catch (error) {
      // Error handling is done by the parent component
    }
  };

  const getDialogTitle = () => {
    switch (deleteType) {
      case "exchange":
        return "Delete Exchange";
      case "queue":
        return "Delete Queue";
      case "purge":
        return "Purge Queue";
      default:
        return "Confirm Delete";
    }
  };

  const getMainMessage = () => {
    switch (deleteType) {
      case "exchange":
        return `Are you sure you want to delete the exchange "${resourceName}"?`;
      case "queue":
        return `Are you sure you want to delete the queue "${resourceName}"?`;
      case "purge":
        return `Are you sure you want to purge all messages from the queue "${resourceName}"?`;
      default:
        return `Are you sure you want to delete "${resourceName}"?`;
    }
  };

  const getWarningMessage = () => {
    switch (deleteType) {
      case "exchange":
        return "This action cannot be undone. The exchange and all its bindings will be removed.";
      case "queue":
        return "This action cannot be undone. The queue and all its messages will be removed.";
      case "purge":
        return "This action cannot be undone. All messages in the queue will be permanently removed.";
      default:
        return "This action cannot be undone.";
    }
  };

  const getButtonText = () => {
    switch (deleteType) {
      case "exchange":
        return "Delete Exchange";
      case "queue":
        return "Delete Queue";
      case "purge":
        return "Purge Queue";
      default:
        return "Delete";
    }
  };

  const showIfUnusedOption =
    deleteType === "exchange" || deleteType === "queue";
  const showIfEmptyOption = deleteType === "queue";

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{getDialogTitle()}</DialogTitle>
      <DialogContent>
        <Typography gutterBottom>{getMainMessage()}</Typography>

        <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
          {getWarningMessage()}
        </Alert>

        {(showIfUnusedOption || showIfEmptyOption) && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Conditional Deletion Options:
            </Typography>

            {showIfUnusedOption && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.ifUnused || false}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        ifUnused: e.target.checked,
                      }))
                    }
                    disabled={loading}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">
                      Only delete if unused
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {deleteType === "exchange"
                        ? "Delete only if the exchange has no bindings"
                        : "Delete only if the queue has no consumers"}
                    </Typography>
                  </Box>
                }
              />
            )}

            {showIfEmptyOption && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.ifEmpty || false}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        ifEmpty: e.target.checked,
                      }))
                    }
                    disabled={loading}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">
                      Only delete if empty
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Delete only if the queue has no messages
                    </Typography>
                  </Box>
                }
              />
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          color="error"
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : getButtonText()}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
