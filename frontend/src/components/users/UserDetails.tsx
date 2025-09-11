import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Paper,
    Grid
} from '@mui/material';
import {
    Person as PersonIcon,
    AdminPanelSettings as AdminIcon,
    CalendarToday as CalendarIcon,
    Storage as ClusterIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import { User } from '../../types/user';
import { UserRole } from '../../types/auth';

interface UserDetailsProps {
    open: boolean;
    user: User | null;
    onClose: () => void;
    onEdit: () => void;
}

const UserDetails: React.FC<UserDetailsProps> = ({ open, user, onClose, onEdit }) => {
    if (!user) return null;

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getRoleColor = (role: UserRole): 'primary' | 'secondary' => {
        return role === UserRole.ADMINISTRATOR ? 'primary' : 'secondary';
    };

    const getRoleIcon = (role: UserRole) => {
        return role === UserRole.ADMINISTRATOR ? <AdminIcon /> : <PersonIcon />;
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { minHeight: '400px' }
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h5" component="div">
                        User Details
                    </Typography>
                    <Chip
                        icon={getRoleIcon(user.role)}
                        label={user.role}
                        color={getRoleColor(user.role)}
                        size="small"
                    />
                </Box>
            </DialogTitle>

            <DialogContent>
                <Grid container spacing={3}>
                    {/* Basic Information */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: '100%' }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PersonIcon color="primary" />
                                Basic Information
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Username
                                    </Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {user.username}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        User ID
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                        {user.id}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Role
                                    </Typography>
                                    <Chip
                                        icon={getRoleIcon(user.role)}
                                        label={user.role}
                                        color={getRoleColor(user.role)}
                                        size="small"
                                    />
                                </Box>

                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <CalendarIcon fontSize="small" />
                                        Created At
                                    </Typography>
                                    <Typography variant="body1">
                                        {formatDate(user.createdAt)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Cluster Assignments */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: '100%' }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ClusterIcon color="primary" />
                                Cluster Assignments
                                <Chip
                                    label={user.assignedClusters.length}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                />
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            {user.assignedClusters.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        No cluster connections assigned
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        This user cannot access any RabbitMQ clusters
                                    </Typography>
                                </Box>
                            ) : (
                                <List dense>
                                    {user.assignedClusters.map((cluster) => (
                                        <ListItem key={cluster.id} sx={{ px: 0 }}>
                                            <ListItemIcon>
                                                <ClusterIcon color="action" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {cluster.name}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {cluster.apiUrl}
                                                        </Typography>
                                                        {cluster.description && (
                                                            <Typography variant="caption" display="block" color="text.secondary">
                                                                {cluster.description}
                                                            </Typography>
                                                        )}
                                                        <Chip
                                                            label={cluster.active ? 'Active' : 'Inactive'}
                                                            size="small"
                                                            color={cluster.active ? 'success' : 'default'}
                                                            variant="outlined"
                                                            sx={{ mt: 0.5 }}
                                                        />
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Paper>
                    </Grid>

                    {/* Additional Information */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Access Summary
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={4}>
                                    <Box sx={{ textAlign: 'center', p: 2 }}>
                                        <Typography variant="h4" color="primary" fontWeight="bold">
                                            {user.assignedClusters.length}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Assigned Clusters
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Box sx={{ textAlign: 'center', p: 2 }}>
                                        <Typography variant="h4" color="success.main" fontWeight="bold">
                                            {user.assignedClusters.filter(c => c.active).length}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Active Clusters
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Box sx={{ textAlign: 'center', p: 2 }}>
                                        <Typography variant="h4" color="warning.main" fontWeight="bold">
                                            {user.assignedClusters.filter(c => !c.active).length}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Inactive Clusters
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={onClose}>
                    Close
                </Button>
                <Button
                    onClick={onEdit}
                    variant="contained"
                    startIcon={<EditIcon />}
                >
                    Edit User
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UserDetails;