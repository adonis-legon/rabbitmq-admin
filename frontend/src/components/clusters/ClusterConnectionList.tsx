import React, { useState } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    IconButton,
    Typography,
    Chip,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Science as TestIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon
} from '@mui/icons-material';
import { ClusterConnection } from '../../types/cluster';
import { useClusters } from '../../hooks/useClusters';
import ClusterConnectionForm from './ClusterConnectionForm';
import ConnectionTest from './ConnectionTest';

const ClusterConnectionList: React.FC = () => {
    const { clusters, loading, error, deleteCluster, clearError } = useClusters();
    const [formOpen, setFormOpen] = useState(false);
    const [testOpen, setTestOpen] = useState(false);
    const [selectedCluster, setSelectedCluster] = useState<ClusterConnection | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [clusterToDelete, setClusterToDelete] = useState<ClusterConnection | null>(null);
    const [deleting, setDeleting] = useState(false);

    const handleCreateCluster = () => {
        setSelectedCluster(null);
        setFormOpen(true);
    };

    const handleEditCluster = (cluster: ClusterConnection) => {
        setSelectedCluster(cluster);
        setFormOpen(true);
    };

    const handleTestConnection = (cluster: ClusterConnection) => {
        setSelectedCluster(cluster);
        setTestOpen(true);
    };

    const handleDeleteClick = (cluster: ClusterConnection) => {
        setClusterToDelete(cluster);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!clusterToDelete) return;

        try {
            setDeleting(true);
            await deleteCluster(clusterToDelete.id);
            setDeleteDialogOpen(false);
            setClusterToDelete(null);
            // Show success message - in a real app this would use a proper notification system
            console.log('Cluster connection deleted successfully:', clusterToDelete.name);
        } catch (err: any) {
            // Error is handled by the hook
        } finally {
            setDeleting(false);
        }
    };

    const handleFormSuccess = (_cluster: ClusterConnection) => {
        // The hook handles updating the clusters state
        setFormOpen(false);
        setSelectedCluster(null);
    };

    const handleFormClose = () => {
        setFormOpen(false);
        setSelectedCluster(null);
    };

    const handleTestClose = () => {
        setTestOpen(false);
        setSelectedCluster(null);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    Cluster Connections
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateCluster}
                >
                    Add Cluster Connection
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
                    {error}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>API URL</TableCell>
                            <TableCell>Username</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Assigned Users</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {clusters.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        No cluster connections found. Create your first connection to get started.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            clusters.map((cluster) => (
                                <TableRow key={cluster.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="medium">
                                            {cluster.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                            {cluster.apiUrl}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {cluster.username}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={cluster.active ? <CheckCircleIcon /> : <ErrorIcon />}
                                            label={cluster.active ? 'Active' : 'Inactive'}
                                            color={cluster.active ? 'success' : 'error'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {cluster.assignedUsers.length} user{cluster.assignedUsers.length !== 1 ? 's' : ''}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {cluster.description || '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box display="flex" gap={1}>
                                            <Tooltip title="Test Connection">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleTestConnection(cluster)}
                                                    color="info"
                                                >
                                                    <TestIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEditCluster(cluster)}
                                                    color="primary"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDeleteClick(cluster)}
                                                    color="error"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create/Edit Form Dialog */}
            <ClusterConnectionForm
                open={formOpen}
                cluster={selectedCluster}
                onClose={handleFormClose}
                onSuccess={handleFormSuccess}
            />

            {/* Connection Test Dialog */}
            {selectedCluster && (
                <ConnectionTest
                    open={testOpen}
                    cluster={selectedCluster}
                    onClose={handleTestClose}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => !deleting && setDeleteDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Delete Cluster Connection</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete the cluster connection "{clusterToDelete?.name}"?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        This action cannot be undone. The connection will be removed from all assigned users.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        variant="contained"
                        disabled={deleting}
                    >
                        {deleting ? <CircularProgress size={20} /> : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ClusterConnectionList;