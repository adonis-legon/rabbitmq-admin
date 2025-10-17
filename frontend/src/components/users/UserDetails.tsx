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
                    User Details
                </Typography>
                <Chip
                    icon={getRoleIcon(user.role)}
                    label={user.role}
                    color={getRoleColor(user.role)}
                    size="small"
                />
            </DialogTitle>

            <DialogContent>
                <Grid container spacing={3}>
                    {/* Basic Information */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PersonIcon color="primary" />
                                <Typography variant="h6" component="h3">
                                    Basic Information
                                </Typography>
                            </Box>
                            <Divider sx={{ my: 2 }} />

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
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                        <CalendarIcon fontSize="small" color="action" />
                                        <Typography variant="body2" color="text.secondary">
                                            Created At
                                        </Typography>
                                    </Box>
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
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ClusterIcon color="primary" />
                                <Typography variant="h6" component="h3">
                                    Cluster Assignments
                                </Typography>
                                <Chip
                                    label={user.assignedClusters.length}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                />
                            </Box>
                            <Divider sx={{ my: 2 }} />

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
                                        <ListItem key={cluster.id} sx={{ px: 0, alignItems: 'flex-start' }}>
                                            <ListItemIcon sx={{ mt: 0.5 }}>
                                                <ClusterIcon color="action" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={cluster.name}
                                                secondary={
                                                    <>
                                                        {cluster.apiUrl}
                                                        {cluster.description && (
                                                            <>
                                                                <br />
                                                                {cluster.description}
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
                                                    label={cluster.active ? 'Active' : 'Inactive'}
                                                    size="small"
                                                    color={cluster.active ? 'success' : 'default'}
                                                    variant="outlined"
                                                />
                                            </Box>
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