import React from "react";
import {
  Box,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  Button,
} from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";
import { AppIcons, getIcon, IconSizes } from "../../utils/icons";
import { Breadcrumbs } from "../common";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useClusterContext } from "../../contexts/ClusterContext";
import { ROUTES } from "../../utils/constants";
import ClusterConnectionCard from "./ClusterConnectionCard";
import ClusterSelector from "./ClusterSelector";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    clusters: assignedClusters,
    selectedCluster,
    loading,
    error,
    selectCluster,
    refreshClusters,
  } = useClusterContext();

  if (loading) {
    return (
      <Box sx={{ mt: { xs: 1, sm: 2 }, mb: 4, px: { xs: 1, sm: 3 } }}>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: { xs: 1, sm: 2 }, mb: 4, px: { xs: 1, sm: 3 } }}>
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
      </Box>
    );
  }

  return (
    <Box sx={{ mt: { xs: 1, sm: 2 }, mb: 4, px: { xs: 1, sm: 3 } }}>
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          {
            label: "Dashboard",
            icon: getIcon("dashboard", {
              fontSize: IconSizes.breadcrumb,
              sx: { mr: 0.5 },
            }),
          },
        ]}
      />

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>

        <Typography variant="body1" color="text.secondary">
          Welcome back, {user?.username}! Select a cluster connection to manage
          your RabbitMQ resources.
        </Typography>
      </Box>

      {assignedClusters.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            No Cluster Connections Assigned
          </Typography>
          <Typography variant="body2">
            You don't have access to any RabbitMQ clusters yet. Please contact
            your administrator to get assigned to cluster connections.
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
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>{selectedCluster.name}</strong> is currently selected.
                  You can now access RabbitMQ management features for this
                  cluster.
                </Typography>
              </Alert>

              {/* Quick Access to Resource Management */}
              <Typography variant="h5" component="h2" gutterBottom>
                Quick Access
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={AppIcons.connections}
                    onClick={() => navigate(ROUTES.RESOURCES_CONNECTIONS)}
                    sx={{
                      py: 1.5,
                      textTransform: "none",
                      justifyContent: "flex-start",
                    }}
                  >
                    View Connections
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={AppIcons.channels}
                    onClick={() => navigate(ROUTES.RESOURCES_CHANNELS)}
                    sx={{
                      py: 1.5,
                      textTransform: "none",
                      justifyContent: "flex-start",
                    }}
                  >
                    View Channels
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={AppIcons.exchanges}
                    onClick={() => navigate(ROUTES.RESOURCES_EXCHANGES)}
                    sx={{
                      py: 1.5,
                      textTransform: "none",
                      justifyContent: "flex-start",
                    }}
                  >
                    View Exchanges
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={AppIcons.queues}
                    onClick={() => navigate(ROUTES.RESOURCES_QUEUES)}
                    sx={{
                      py: 1.5,
                      textTransform: "none",
                      justifyContent: "flex-start",
                    }}
                  >
                    View Queues
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;
