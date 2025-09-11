import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    FormControlLabel,
    Switch,
    Box,
    Typography,
    Chip,
    OutlinedInput,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    InputAdornment,
    IconButton,
    FormHelperText
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    Science as TestIcon
} from '@mui/icons-material';
import { ClusterConnection, CreateClusterConnectionRequest, UpdateClusterConnectionRequest, ConnectionTestRequest } from '../../types/cluster';
import { useClusters } from '../../hooks/useClusters';
import { useUsers } from '../../hooks/useUsers';

interface ClusterConnectionFormProps {
    open: boolean;
    cluster?: ClusterConnection | null;
    onClose: () => void;
    onSuccess: (cluster: ClusterConnection) => void;
}

interface FormData {
    name: string;
    apiUrl: string;
    username: string;
    password: string;
    description: string;
    active: boolean;
    assignedUserIds: string[];
}

interface FormErrors {
    name?: string;
    apiUrl?: string;
    username?: string;
    password?: string;
    description?: string;
}

const ClusterConnectionForm: React.FC<ClusterConnectionFormProps> = ({ open, cluster, onClose, onSuccess }) => {
    const { createCluster, updateCluster, testConnection } = useClusters();
    const { users, loading: usersLoading } = useUsers();

    const [formData, setFormData] = useState<FormData>({
        name: '',
        apiUrl: '',
        username: '',
        password: '',
        description: '',
        active: true,
        assignedUserIds: []
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const isEditing = !!cluster;

    useEffect(() => {
        if (open) {
            if (cluster) {
                setFormData({
                    name: cluster.name,
                    apiUrl: cluster.apiUrl,
                    username: cluster.username,
                    password: '', // Don't populate password for security
                    description: cluster.description || '',
                    active: cluster.active,
                    assignedUserIds: cluster.assignedUsers.map(u => u.id)
                });
            } else {
                setFormData({
                    name: '',
                    apiUrl: '',
                    username: '',
                    password: '',
                    description: '',
                    active: true,
                    assignedUserIds: []
                });
            }
            setErrors({});
            setSubmitError(null);
            setShowPassword(false);
            setTestResult(null);
        }
    }, [open, cluster]);

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        } else if (formData.name.length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }

        if (!formData.apiUrl.trim()) {
            newErrors.apiUrl = 'API URL is required';
        } else if (!/^https?:\/\/.+/.test(formData.apiUrl)) {
            newErrors.apiUrl = 'API URL must be a valid HTTP or HTTPS URL';
        }

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        }

        if (!isEditing && !formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password && formData.password.length < 1) {
            newErrors.password = 'Password cannot be empty';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleTestConnection = async () => {
        // Validate required fields for testing
        if (!formData.apiUrl || !formData.username || !formData.password) {
            setTestResult({
                success: false,
                message: 'API URL, username, and password are required for testing'
            });
            return;
        }

        try {
            setTesting(true);
            setTestResult(null);

            const testData: ConnectionTestRequest = {
                apiUrl: formData.apiUrl,
                username: formData.username,
                password: formData.password
            };

            const result = await testConnection(cluster?.id || 'test', testData);
            setTestResult(result);
        } catch (err: any) {
            console.error('Error testing connection:', err);
            setTestResult({
                success: false,
                message: err.response?.data?.message || 'Connection test failed'
            });
        } finally {
            setTesting(false);
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            setSubmitError(null);

            let savedCluster: ClusterConnection;

            if (isEditing && cluster) {
                const updateData: UpdateClusterConnectionRequest = {
                    name: formData.name,
                    apiUrl: formData.apiUrl,
                    username: formData.username,
                    description: formData.description || undefined,
                    active: formData.active
                };

                if (formData.password) {
                    updateData.password = formData.password;
                }

                savedCluster = await updateCluster(cluster.id, updateData);
            } else {
                const createData: CreateClusterConnectionRequest = {
                    name: formData.name,
                    apiUrl: formData.apiUrl,
                    username: formData.username,
                    password: formData.password,
                    description: formData.description || undefined,
                    active: formData.active
                };

                savedCluster = await createCluster(createData);
            }

            onSuccess(savedCluster);
            // Show success message - in a real app this would use a proper notification system
            console.log(`Cluster connection ${isEditing ? 'updated' : 'created'} successfully:`, savedCluster.name);
        } catch (err: any) {
            console.error('Error saving cluster:', err);

            // Handle specific error cases
            if (err.response?.status === 409) {
                setSubmitError('A cluster connection with this name already exists. Please choose a different name.');
            } else if (err.response?.status === 400) {
                setSubmitError(err.response?.data?.message || 'Invalid input data. Please check your entries.');
            } else if (err.response?.status === 403) {
                setSubmitError('You do not have permission to perform this action.');
            } else {
                setSubmitError(
                    err.response?.data?.message ||
                    `Failed to ${isEditing ? 'update' : 'create'} cluster connection. Please try again.`
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof FormData) => (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
    ) => {
        const value = field === 'active' ? event.target.checked : event.target.value;
        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear error when user starts typing
        if (errors[field as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }

        // Clear test result when connection details change
        if (['apiUrl', 'username', 'password'].includes(field)) {
            setTestResult(null);
        }
    };

    const handleUserChange = (event: any) => {
        const value = event.target.value;
        setFormData(prev => ({
            ...prev,
            assignedUserIds: typeof value === 'string' ? value.split(',') : value
        }));
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { minHeight: '600px' }
            }}
        >
            <DialogTitle>
                {isEditing ? 'Edit Cluster Connection' : 'Create New Cluster Connection'}
            </DialogTitle>

            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                    {submitError && (
                        <Alert severity="error" onClose={() => setSubmitError(null)}>
                            {submitError}
                        </Alert>
                    )}

                    <TextField
                        label="Connection Name"
                        value={formData.name}
                        onChange={handleInputChange('name')}
                        error={!!errors.name}
                        helperText={errors.name || 'A descriptive name for this cluster connection'}
                        fullWidth
                        required
                    />

                    <TextField
                        label="RabbitMQ Management API URL"
                        value={formData.apiUrl}
                        onChange={handleInputChange('apiUrl')}
                        error={!!errors.apiUrl}
                        helperText={errors.apiUrl || 'e.g., http://localhost:15672 or https://rabbitmq.example.com:15672'}
                        fullWidth
                        required
                        placeholder="http://localhost:15672"
                    />

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            label="Username"
                            value={formData.username}
                            onChange={handleInputChange('username')}
                            error={!!errors.username}
                            helperText={errors.username}
                            fullWidth
                            required
                        />

                        <TextField
                            label={isEditing ? "Password (leave blank to keep current)" : "Password"}
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={handleInputChange('password')}
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
                                )
                            }}
                        />
                    </Box>

                    <TextField
                        label="Description"
                        value={formData.description}
                        onChange={handleInputChange('description')}
                        error={!!errors.description}
                        helperText={errors.description || 'Optional description for this cluster connection'}
                        fullWidth
                        multiline
                        rows={2}
                    />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.active}
                                onChange={handleInputChange('active')}
                            />
                        }
                        label="Active"
                    />

                    <FormControl fullWidth>
                        <InputLabel>Assigned Users</InputLabel>
                        <Select
                            multiple
                            value={formData.assignedUserIds}
                            onChange={handleUserChange}
                            input={<OutlinedInput label="Assigned Users" />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {(selected as string[]).map((userId) => {
                                        const user = users.find(u => u.id === userId);
                                        return (
                                            <Chip
                                                key={userId}
                                                label={user?.username || userId}
                                                size="small"
                                            />
                                        );
                                    })}
                                </Box>
                            )}
                            disabled={usersLoading}
                        >
                            {usersLoading ? (
                                <MenuItem disabled>
                                    <CircularProgress size={20} sx={{ mr: 1 }} />
                                    Loading users...
                                </MenuItem>
                            ) : users.length === 0 ? (
                                <MenuItem disabled>
                                    No users available
                                </MenuItem>
                            ) : (
                                users.map((user) => (
                                    <MenuItem key={user.id} value={user.id}>
                                        <Box>
                                            <Typography variant="body2" fontWeight="medium">
                                                {user.username}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {user.role}
                                            </Typography>
                                        </Box>
                                    </MenuItem>
                                ))
                            )}
                        </Select>
                        <FormHelperText>
                            Select which users can access this cluster connection
                        </FormHelperText>
                    </FormControl>

                    {/* Connection Test Section */}
                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6">Connection Test</Typography>
                            <Button
                                variant="outlined"
                                startIcon={testing ? <CircularProgress size={16} /> : <TestIcon />}
                                onClick={handleTestConnection}
                                disabled={testing || !formData.apiUrl || !formData.username || !formData.password}
                            >
                                {testing ? 'Testing...' : 'Test Connection'}
                            </Button>
                        </Box>

                        {testResult && (
                            <Alert severity={testResult.success ? 'success' : 'error'}>
                                {testResult.message}
                            </Alert>
                        )}

                        {!testResult && (
                            <Typography variant="body2" color="text.secondary">
                                Test the connection to ensure the RabbitMQ Management API is accessible with the provided credentials.
                            </Typography>
                        )}
                    </Box>

                    {isEditing && (
                        <Alert severity="info">
                            <Typography variant="body2">
                                <strong>Note:</strong> Leave password field empty to keep the current password unchanged.
                            </Typography>
                        </Alert>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                >
                    {loading ? (
                        <CircularProgress size={20} />
                    ) : (
                        isEditing ? 'Update Connection' : 'Create Connection'
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ClusterConnectionForm;