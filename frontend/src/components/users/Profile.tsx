import React from "react";
import {
  Paper,
  Box,
  Typography,
  Chip,
  Divider,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
} from "@mui/material";
import {
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  CalendarToday as CalendarIcon,
  Storage as ClusterIcon,
  Security as SecurityIcon,
} from "@mui/icons-material";
import { useAuth } from "../auth/AuthProvider";
import { UserRole } from "../../types/auth";
import { Breadcrumbs } from "../common";
import { getIcon, IconSizes } from "../../utils/icons";

const Profile: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Box sx={{ mt: { xs: 1, sm: 2 }, mb: 4, px: { xs: 1, sm: 3 } }}>
        <Alert severity="error">
          Unable to load user profile. Please try logging in again.
        </Alert>
      </Box>
    );
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleColor = (role: UserRole): "primary" | "secondary" => {
    return role === UserRole.ADMINISTRATOR ? "primary" : "secondary";
  };

  const getRoleIcon = (role: UserRole) => {
    return role === UserRole.ADMINISTRATOR ? <AdminIcon /> : <PersonIcon />;
  };

  return (
    <Box sx={{ mt: { xs: 1, sm: 2 }, mb: 4, px: { xs: 1, sm: 3 } }}>
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          {
            label: "My Profile",
            icon: getIcon("users", {
              fontSize: IconSizes.breadcrumb,
              sx: { mr: 0.5 },
            }),
          },
        ]}
      />

      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View your account information and settings
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Basic Information Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <PersonIcon color="primary" />
                Basic Information
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Username
                  </Typography>
                  <Typography variant="h6" fontWeight="medium">
                    {user.username}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    User ID
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}
                  >
                    {user.id}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Account Type
                  </Typography>
                  <Chip
                    icon={getRoleIcon(user.role)}
                    label={user.role}
                    color={getRoleColor(user.role)}
                    size="medium"
                  />
                </Box>

                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    <CalendarIcon fontSize="small" />
                    Account Created
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(user.createdAt)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Permissions & Access Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <SecurityIcon color="primary" />
                Permissions & Access
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <List disablePadding>
                <ListItem disablePadding sx={{ mb: 1 }}>
                  <ListItemIcon>
                    <PersonIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="View Dashboard"
                    secondary="Access to the main dashboard and cluster overview"
                  />
                </ListItem>

                <ListItem disablePadding sx={{ mb: 1 }}>
                  <ListItemIcon>
                    <ClusterIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="RabbitMQ Access"
                    secondary="Access to RabbitMQ management interface for assigned clusters"
                  />
                </ListItem>

                {user.role === UserRole.ADMINISTRATOR && (
                  <>
                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <ListItemIcon>
                        <AdminIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="User Management"
                        secondary="Create, edit, and manage user accounts"
                      />
                    </ListItem>

                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <ListItemIcon>
                        <ClusterIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Cluster Management"
                        secondary="Configure and manage cluster connections"
                      />
                    </ListItem>
                  </>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Account Status Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <SecurityIcon color="primary" />
                Account Status
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                    <Typography
                      variant="h5"
                      color="success.main"
                      fontWeight="bold"
                    >
                      Active
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Account Status
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                    <Typography
                      variant="h5"
                      color="primary.main"
                      fontWeight="bold"
                    >
                      {user.role === UserRole.ADMINISTRATOR
                        ? "Full"
                        : "Limited"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Access Level
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                    <Typography
                      variant="h5"
                      color="primary.main"
                      fontWeight="bold"
                    >
                      Current
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Session Status
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                    <Typography
                      variant="h5"
                      color="success.main"
                      fontWeight="bold"
                    >
                      Secure
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Authentication
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Information Note */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Note:</strong> To modify your account settings or request
          permission changes, please contact your system administrator.
        </Typography>
      </Alert>
    </Box>
  );
};

export default Profile;
