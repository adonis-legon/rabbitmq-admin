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
  FormHelperText,
  Box,
  Typography,
  Chip,
  OutlinedInput,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { User, CreateUserRequest, UpdateUserRequest } from "../../types/user";
import { UserRole } from "../../types/auth";
import { ClusterConnection } from "../../types/cluster";
import { userApi } from "../../services/api/userApi";
import { clusterApi } from "../../services/api/clusterApi";
import { useNotification } from "../../contexts/NotificationContext";

interface UserFormProps {
  open: boolean;
  user?: User | null;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

interface FormData {
  username: string;
  password: string;
  role: UserRole;
  clusterConnectionIds: string[];
}

interface FormErrors {
  username?: string;
  password?: string;
  role?: string;
  clusterConnectionIds?: string;
}

const UserForm: React.FC<UserFormProps> = ({
  open,
  user,
  onClose,
  onSuccess,
}) => {
  const { success, error } = useNotification();
  const [formData, setFormData] = useState<FormData>({
    username: "",
    password: "",
    role: UserRole.USER,
    clusterConnectionIds: [],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [clusters, setClusters] = useState<ClusterConnection[]>([]);
  const [clustersLoading, setClustersLoading] = useState(false);

  const isEditing = !!user;

  useEffect(() => {
    if (open) {
      loadClusters();
      if (user) {
        setFormData({
          username: user.username,
          password: "",
          role: user.role,
          clusterConnectionIds: user.assignedClusters.map((c) => c.id),
        });
      } else {
        setFormData({
          username: "",
          password: "",
          role: UserRole.USER,
          clusterConnectionIds: [],
        });
      }
      setErrors({});
      setSubmitError(null);
      setShowPassword(false);
    }
  }, [open, user]);

  const loadClusters = async () => {
    try {
      setClustersLoading(true);
      const clustersData = await clusterApi.getClusters();
      setClusters(clustersData);
    } catch (err) {
      error("Failed to load cluster connections");
    } finally {
      setClustersLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (formData.username.length > 100) {
      newErrors.username = "Username must not exceed 100 characters";
    } else if (!/^([a-zA-Z0-9_-]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/.test(formData.username)) {
      newErrors.username = "Username can only contain letters, numbers, hyphens, underscores, or be a valid email address";
    }

    if (!isEditing && !formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (
      formData.password &&
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(
        formData.password
      )
    ) {
      newErrors.password =
        "Password must contain uppercase, lowercase, number, and special character (@$!%*?&)";
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setSubmitError(null);

      let savedUser: User;

      if (isEditing && user) {
        const updateData: UpdateUserRequest = {
          username: formData.username,
          role: formData.role,
          clusterConnectionIds: formData.clusterConnectionIds,
        };

        if (formData.password) {
          updateData.password = formData.password;
        }

        savedUser = await userApi.updateUser(user.id, updateData);
      } else {
        const createData: CreateUserRequest = {
          username: formData.username,
          password: formData.password,
          role: formData.role,
          clusterConnectionIds: formData.clusterConnectionIds,
        };

        savedUser = await userApi.createUser(createData);
      }

      success(
        `User "${savedUser.username}" ${isEditing ? "updated" : "created"
        } successfully`
      );
      onSuccess(savedUser);
    } catch (err: any) {
      // Handle specific error cases
      let errorMessage: string;
      if (err.response?.status === 409) {
        errorMessage =
          "Username already exists. Please choose a different username.";
      } else if (err.response?.status === 400) {
        errorMessage =
          err.response?.data?.message ||
          "Invalid input data. Please check your entries.";
      } else if (err.response?.status === 403) {
        errorMessage = "You do not have permission to perform this action.";
      } else {
        errorMessage =
          err.response?.data?.message ||
          `Failed to ${isEditing ? "update" : "create"
          } user. Please try again.`;
      }

      error(errorMessage);
      setSubmitError(errorMessage);
    } finally {
      setLoading(false);
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
        if (errors[field]) {
          setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
      };

  const handleClusterChange = (event: any) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      clusterConnectionIds:
        typeof value === "string" ? value.split(",") : value,
    }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: "500px" },
      }}
    >
      <DialogTitle>{isEditing ? "Edit User" : "Create New User"}</DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
          {submitError && (
            <Alert severity="error" onClose={() => setSubmitError(null)}>
              {submitError}
            </Alert>
          )}

          <TextField
            label="Username"
            value={formData.username}
            onChange={handleInputChange("username")}
            error={!!errors.username}
            helperText={errors.username}
            fullWidth
            required
          />

          <TextField
            label={
              isEditing
                ? "New Password (leave blank to keep current)"
                : "Password"
            }
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleInputChange("password")}
            error={!!errors.password}
            helperText={errors.password}
            fullWidth
            required={!isEditing}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <FormControl fullWidth error={!!errors.role}>
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role}
              onChange={handleInputChange("role")}
              label="Role"
            >
              <MenuItem value={UserRole.USER}>User</MenuItem>
              <MenuItem value={UserRole.ADMINISTRATOR}>Administrator</MenuItem>
            </Select>
            {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Assigned Clusters</InputLabel>
            <Select
              multiple
              value={formData.clusterConnectionIds}
              onChange={handleClusterChange}
              input={<OutlinedInput label="Assigned Clusters" />}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {(selected as string[]).map((clusterId) => {
                    const cluster = clusters.find((c) => c.id === clusterId);
                    return (
                      <Chip
                        key={clusterId}
                        label={cluster?.name || clusterId}
                        size="small"
                      />
                    );
                  })}
                </Box>
              )}
              disabled={clustersLoading}
            >
              {clustersLoading ? (
                <MenuItem disabled>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Loading clusters...
                </MenuItem>
              ) : clusters.length === 0 ? (
                <MenuItem disabled>No clusters available</MenuItem>
              ) : (
                clusters.map((cluster) => (
                  <MenuItem key={cluster.id} value={cluster.id}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {cluster.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {cluster.apiUrl}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))
              )}
            </Select>
            <FormHelperText>
              Select which cluster connections this user can access
            </FormHelperText>
          </FormControl>

          {isEditing && (
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Note:</strong> Leave password field empty to keep the
                current password unchanged.
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? (
            <CircularProgress size={20} />
          ) : isEditing ? (
            "Update User"
          ) : (
            "Create User"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserForm;
