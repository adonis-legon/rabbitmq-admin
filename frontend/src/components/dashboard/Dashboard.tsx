import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  Container,
  Button
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useAuth } from '../auth/AuthProvider';
import { useDashboardClusters } from '../../hooks/useDashboardClusters';
import ClusterConnectionCard from './ClusterConnectionCard';
import ClusterSelector from './ClusterSelector';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const {
    clusters: assignedClusters,
    selectedCluster,
    loading,
    error,
    selectCluster,
    refreshClusters
  } = useDashboardClusters();

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={refreshClusters}
              startIcon={<RefreshIcon />}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome back, {user?.username}! Select a cluster connection to manage your RabbitMQ resources.
      </Typography>

      {assignedClusters.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            No Cluster Connections Assigned
          </Typography>
          <Typography variant="body2">
            You don't have access to any RabbitMQ clusters yet. Please contact your administrator
            to get assigned to cluster connections.
          </Typography>
        </Alert>
      ) : (
        <Box>
          {/* Cluster Selector */}
          <Box sx={{ mb: 4 }}>
            <ClusterSelector
              clusters={assignedClusters}
              selectedCluster={selectedCluster}
              onClusterSelect={selectCluster}
            />
          </Box>

          {/* Cluster Connection Cards */}
          <Typography variant="h5" component="h2" gutterBottom>
            Your Cluster Connections
          </Typography>

          <Grid container spacing={3}>
            {assignedClusters.map((cluster) => (
              <Grid item xs={12} sm={6} md={4} key={cluster.id}>
                <ClusterConnectionCard
                  cluster={cluster}
                  isSelected={selectedCluster?.id === cluster.id}
                  onSelect={() => selectCluster(cluster)}
                />
              </Grid>
            ))}
          </Grid>

          {selectedCluster && (
            <Box sx={{ mt: 4 }}>
              <Alert severity="success">
                <Typography variant="body2">
                  <strong>{selectedCluster.name}</strong> is currently selected.
                  You can now access RabbitMQ management features for this cluster.
                </Typography>
              </Alert>
            </Box>
          )}
        </Box>
      )}
    </Container>
  );
};

export default Dashboard;