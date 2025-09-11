import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { UserRole } from '../../types/auth';
import { ROUTES } from '../../utils/constants';
import { Box, Typography, Paper, Alert } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Show access denied if not admin
  if (user?.role !== UserRole.ADMINISTRATOR) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
        p={3}
      >
        <Paper
          elevation={2}
          sx={{
            p: 4,
            textAlign: 'center',
            maxWidth: 400,
          }}
        >
          <LockIcon
            sx={{
              fontSize: 64,
              color: 'text.secondary',
              mb: 2,
            }}
          />
          <Typography variant="h5" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            You need administrator privileges to access this page.
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Contact your administrator if you believe you should have access to this feature.
          </Alert>
        </Paper>
      </Box>
    );
  }

  // Render children if user is admin
  return <>{children}</>;
};

export default AdminRoute;