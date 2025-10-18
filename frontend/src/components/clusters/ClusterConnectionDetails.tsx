import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Chip,
    Grid,
    Paper,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from "@mui/material";
import {
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Person as PersonIcon,
    Link as LinkIcon,
    Group as GroupIcon,
} from "@mui/icons-material";
import { ClusterConnection } from "../../types/cluster";

interface ClusterConnectionDetailsProps {
    open: boolean;
    onClose: () => void;
    cluster: ClusterConnection | null;
    onEdit?: (cluster: ClusterConnection) => void;
}

const ClusterConnectionDetails: React.FC<ClusterConnectionDetailsProps> = ({
    open,
    onClose,
    cluster,
    onEdit,
}) => {
    if (!cluster) return null;

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { minHeight: '500px' }
            }}
        >
            <DialogTitle
                component="div"
                sx={{
                    pb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                }}
            >
                <Typography variant="h5" component="h2">
                    Cluster Connection Details
                </Typography>
                <Chip
                    icon={cluster.active ? <CheckCircleIcon /> : <ErrorIcon />}
                    label={cluster.active ? 'Active' : 'Inactive'}
                    color={cluster.active ? 'success' : 'error'}
                    size="small"
                />
            </DialogTitle>

            <DialogContent>
                <Grid container spacing={3}>
                    {/* Basic Information */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinkIcon color="primary" />
                                <Typography variant="h6" component="h3">
                                    Connection Information
                                </Typography>
                            </Box>
                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Connection Name
                                    </Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {cluster.name}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Connection ID
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                        {cluster.id}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        API URL
                                    </Typography>
                                    <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                                        {cluster.apiUrl}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Username
                                    </Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {cluster.username}
                                    </Typography>
                                </Box>

                                {cluster.description && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Description
                                        </Typography>
                                        <Typography variant="body1">
                                            {cluster.description}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Assigned Users */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <GroupIcon color="primary" />
                                <Typography variant="h6" component="h3">
                                    Assigned Users
                                </Typography>
                                <Chip
                                    label={cluster.assignedUsers.length}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                />
                            </Box>
                            <Divider sx={{ my: 2 }} />

                            {cluster.assignedUsers.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        No users assigned
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        This cluster connection is not accessible by any users
                                    </Typography>
                                </Box>
                            ) : (
                                <List dense>
                                    {cluster.assignedUsers.map((user) => (
                                        <ListItem key={user.id} sx={{ px: 0, alignItems: 'flex-start' }}>
                                            <ListItemIcon sx={{ mt: 0.5 }}>
                                                <PersonIcon color="action" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={user.username}
                                                secondary={
                                                    <>
                                                        {user.role}
                                                        {user.createdAt && (
                                                            <>
                                                                <br />
                                                                Created: {formatDate(user.createdAt)}
                                                            </>
                                                        )}
                                                    </>
                                                }
                                                primaryTypographyProps={{
                                                    variant: 'body2',
                                                    fontWeight: 'medium'
                                                }}
                                                secondaryTypographyProps={{
                                                    variant: 'caption',
                                                    color: 'text.secondary',
                                                    component: 'div'
                                                }}
                                                sx={{ mr: 1 }}
                                            />
                                            <Box sx={{ mt: 0.5 }}>
                                                <Chip
                                                    label={user.role}
                                                    size="small"
                                                    color={user.role === 'ADMINISTRATOR' ? 'primary' : 'default'}
                                                    variant="outlined"
                                                />
                                            </Box>
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Paper>
                    </Grid>

                    {/* Connection Status */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Connection Summary
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={4}>
                                    <Box sx={{ textAlign: 'center', p: 2 }}>
                                        <Typography variant="h4" color={cluster.active ? 'success.main' : 'error.main'} fontWeight="bold">
                                            {cluster.active ? 'Active' : 'Inactive'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Connection Status
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Box sx={{ textAlign: 'center', p: 2 }}>
                                        <Typography variant="h4" color="primary" fontWeight="bold">
                                            {cluster.assignedUsers.length}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Assigned Users
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Box sx={{ textAlign: 'center', p: 2 }}>
                                        <Typography variant="h4" color="info.main" fontWeight="bold">
                                            {cluster.assignedUsers.filter(user => user.role === 'ADMINISTRATOR').length}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Admin Users
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} variant="outlined">
                    Close
                </Button>
                {onEdit && (
                    <Button onClick={() => onEdit(cluster)} variant="contained">
                        Edit Connection
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ClusterConnectionDetails;