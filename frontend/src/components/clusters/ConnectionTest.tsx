import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Alert,
    CircularProgress,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { ClusterConnection, ConnectionTestRequest, ConnectionTestResponse } from '../../types/cluster';
import { useClusters } from '../../hooks/useClusters';

interface ConnectionTestProps {
    open: boolean;
    cluster: ClusterConnection;
    onClose: () => void;
}

interface TestState {
    loading: boolean;
    result: ConnectionTestResponse | null;
    error: string | null;
}

const ConnectionTest: React.FC<ConnectionTestProps> = ({ open, cluster, onClose }) => {
    const { testConnection } = useClusters();
    const [testState, setTestState] = useState<TestState>({
        loading: false,
        result: null,
        error: null
    });

    const runConnectionTest = async () => {
        try {
            setTestState({ loading: true, result: null, error: null });

            const testData: ConnectionTestRequest = {
                apiUrl: cluster.apiUrl,
                username: cluster.username,
                password: cluster.password
            };

            const result = await testConnection(cluster.id, testData);
            setTestState({ loading: false, result, error: null });
        } catch (err: any) {
            console.error('Error testing connection:', err);
            setTestState({
                loading: false,
                result: null,
                error: err.response?.data?.message || 'Connection test failed. Please check your network connection and try again.'
            });
        }
    };

    const handleClose = () => {
        setTestState({ loading: false, result: null, error: null });
        onClose();
    };

    // Auto-run test when dialog opens
    React.useEffect(() => {
        if (open) {
            runConnectionTest();
        }
    }, [open]);

    const renderTestResult = () => {
        if (testState.loading) {
            return (
                <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                    <CircularProgress size={48} sx={{ mb: 2 }} />
                    <Typography variant="body1">Testing connection...</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Attempting to connect to {cluster.apiUrl}
                    </Typography>
                </Box>
            );
        }

        if (testState.error) {
            return (
                <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="medium">
                        Connection Test Failed
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        {testState.error}
                    </Typography>
                </Alert>
            );
        }

        if (testState.result) {
            return (
                <Alert severity={testState.result.success ? 'success' : 'error'} sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="medium">
                        {testState.result.success ? 'Connection Successful' : 'Connection Failed'}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        {testState.result.message}
                    </Typography>
                    {testState.result.details && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" fontWeight="medium">
                                Details:
                            </Typography>
                            <Box component="pre" sx={{
                                fontSize: '0.75rem',
                                fontFamily: 'monospace',
                                backgroundColor: 'rgba(0,0,0,0.05)',
                                p: 1,
                                borderRadius: 1,
                                mt: 1,
                                overflow: 'auto',
                                maxHeight: '200px'
                            }}>
                                {JSON.stringify(testState.result.details, null, 2)}
                            </Box>
                        </Box>
                    )}
                </Alert>
            );
        }

        return null;
    };

    const getStatusChip = () => {
        if (testState.loading) {
            return <Chip icon={<CircularProgress size={16} />} label="Testing..." color="default" />;
        }

        if (testState.error) {
            return <Chip icon={<ErrorIcon />} label="Failed" color="error" />;
        }

        if (testState.result) {
            return (
                <Chip
                    icon={testState.result.success ? <CheckCircleIcon /> : <ErrorIcon />}
                    label={testState.result.success ? 'Connected' : 'Failed'}
                    color={testState.result.success ? 'success' : 'error'}
                />
            );
        }

        return <Chip icon={<InfoIcon />} label="Ready" color="default" />;
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { minHeight: '400px' }
            }}
        >
            <DialogTitle>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6">
                        Connection Test: {cluster.name}
                    </Typography>
                    {getStatusChip()}
                </Box>
            </DialogTitle>

            <DialogContent>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Testing connection to RabbitMQ Management API
                    </Typography>

                    <List dense>
                        <ListItem>
                            <ListItemIcon>
                                <InfoIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText
                                primary="API URL"
                                secondary={cluster.apiUrl}
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <InfoIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText
                                primary="Username"
                                secondary={cluster.username}
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <InfoIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText
                                primary="Status"
                                secondary={cluster.active ? 'Active' : 'Inactive'}
                            />
                        </ListItem>
                    </List>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {renderTestResult()}

                <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        <strong>What this test checks:</strong>
                    </Typography>
                    <List dense sx={{ mt: 1 }}>
                        <ListItem sx={{ py: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                                • Network connectivity to the RabbitMQ Management API
                            </Typography>
                        </ListItem>
                        <ListItem sx={{ py: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                                • Authentication with provided credentials
                            </Typography>
                        </ListItem>
                        <ListItem sx={{ py: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                                • API endpoint accessibility and response format
                            </Typography>
                        </ListItem>
                    </List>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button
                    onClick={runConnectionTest}
                    startIcon={<RefreshIcon />}
                    disabled={testState.loading}
                >
                    Test Again
                </Button>
                <Button onClick={handleClose} variant="contained">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConnectionTest;