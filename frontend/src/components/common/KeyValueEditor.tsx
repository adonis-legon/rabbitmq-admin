import React, { useState, useCallback } from "react";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Button,
  Paper,
  Divider,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";

interface KeyValuePair {
  key: string;
  value: string;
  id: string;
}

interface KeyValueEditorProps {
  label?: string;
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
  keyLabel?: string;
  valueLabel?: string;
  helperText?: string;
  disabled?: boolean;
}

const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
  label = "Arguments",
  value,
  onChange,
  keyLabel = "Key",
  valueLabel = "Value",
  helperText,
  disabled = false,
}) => {
  // Convert object to array of key-value pairs for editing
  const [pairs, setPairs] = useState<KeyValuePair[]>(() => {
    return Object.entries(value || {}).map(([key, val], index) => ({
      key,
      value: typeof val === "string" ? val : JSON.stringify(val),
      id: `pair-${index}`,
    }));
  });

  const generateId = () => `pair-${Date.now()}-${Math.random()}`;

  const updateParent = useCallback(
    (newPairs: KeyValuePair[]) => {
      const newValue: Record<string, any> = {};
      newPairs.forEach((pair) => {
        if (pair.key.trim()) {
          try {
            // Try to parse as JSON first, fallback to string
            newValue[pair.key.trim()] = JSON.parse(pair.value);
          } catch {
            newValue[pair.key.trim()] = pair.value;
          }
        }
      });
      onChange(newValue);
    },
    [onChange]
  );

  const handlePairChange = (
    id: string,
    field: "key" | "value",
    newValue: string
  ) => {
    const newPairs = pairs.map((pair) =>
      pair.id === id ? { ...pair, [field]: newValue } : pair
    );
    setPairs(newPairs);
    updateParent(newPairs);
  };

  const addPair = () => {
    const newPairs = [...pairs, { key: "", value: "", id: generateId() }];
    setPairs(newPairs);
  };

  const removePair = (id: string) => {
    const newPairs = pairs.filter((pair) => pair.id !== id);
    setPairs(newPairs);
    updateParent(newPairs);
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Typography variant="subtitle2" color="text.secondary">
          {label}
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={addPair}
          disabled={disabled}
        >
          Add
        </Button>
      </Box>

      {helperText && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 2, display: "block" }}
        >
          {helperText}
        </Typography>
      )}

      {pairs.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            No {label.toLowerCase()} defined. Click "Add" to create one.
          </Typography>
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ p: 1 }}>
          {pairs.map((pair, index) => (
            <Box key={pair.id}>
              {index > 0 && <Divider sx={{ my: 1 }} />}
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "flex-start",
                  py: 1,
                }}
              >
                <TextField
                  label={keyLabel}
                  value={pair.key}
                  onChange={(e) =>
                    handlePairChange(pair.id, "key", e.target.value)
                  }
                  size="small"
                  sx={{ flex: 1 }}
                  disabled={disabled}
                />
                <TextField
                  label={valueLabel}
                  value={pair.value}
                  onChange={(e) =>
                    handlePairChange(pair.id, "value", e.target.value)
                  }
                  size="small"
                  sx={{ flex: 2 }}
                  disabled={disabled}
                  helperText={
                    index === 0
                      ? "JSON values will be parsed automatically"
                      : ""
                  }
                />
                <IconButton
                  onClick={() => removePair(pair.id)}
                  size="small"
                  color="error"
                  disabled={disabled}
                  sx={{ mt: 0.5 }}
                  aria-label="delete"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
};

export default KeyValueEditor;
