import React from "react";
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  useTheme,
} from "@mui/material";
import {
  Home as HomeIcon,
  Storage as StorageIcon,
  Cable as CableIcon,
  Hub as HubIcon,
  SwapHoriz as SwapHorizIcon,
  Queue as QueueIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "../../utils/constants";
import { ClusterConnection } from "../../types/cluster";

interface ResourceLayoutProps {
  children: React.ReactNode;
  selectedCluster: ClusterConnection | null;
  loading?: boolean;
  error?: string | null;
}

const resourceTabs = [
  {
    label: "Connections",
    value: "connections",
    path: ROUTES.RESOURCES_CONNECTIONS,
    icon: <CableIcon />,
  },
  {
    label: "Channels",
    value: "channels",
    path: ROUTES.RESOURCES_CHANNELS,
    icon: <HubIcon />,
  },
  {
    label: "Exchanges",
    value: "exchanges",
    path: ROUTES.RESOURCES_EXCHANGES,
    icon: <SwapHorizIcon />,
  },
  {
    label: "Queues",
    value: "queues",
    path: ROUTES.RESOURCES_QUEUES,
    icon: <QueueIcon />,
  },
];

export const ResourceLayout: React.FC<ResourceLayoutProps> = ({
  children,
  selectedCluster,
  loading = false,
  error = null,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  // Determine current tab based on pathname
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes("/connections")) return "connections";
    if (path.includes("/channels")) return "channels";
    if (path.includes("/exchanges")) return "exchanges";
    if (path.includes("/queues")) return "queues";
    return "connections"; // default
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    const tab = resourceTabs.find((t) => t.value === newValue);
    if (tab) {
      navigate(tab.path);
    }
  };

  // Show cluster selection required message if no cluster is selected
  if (!selectedCluster && !loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Cluster Selection Required
          </Typography>
          <Typography variant="body2">
            Please select a cluster connection from the dashboard to access
            RabbitMQ resources.
          </Typography>
        </Alert>
      </Container>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <Container
        maxWidth="lg"
        sx={{ mt: 4, display: "flex", justifyContent: "center" }}
      >
        <CircularProgress />
      </Container>
    );
  }

  // Show error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{ mt: { xs: 1, sm: 2 }, mb: 4, px: { xs: 1, sm: 3 } }}
    >
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          variant="body2"
          onClick={() => navigate(ROUTES.DASHBOARD)}
          sx={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            color: theme.palette.text.secondary,
            border: "none",
            background: "none",
            cursor: "pointer",
            "&:hover": {
              color: theme.palette.primary.main,
            },
          }}
        >
          <HomeIcon sx={{ mr: 0.5, fontSize: 16 }} />
          Dashboard
        </Link>
        <Link
          component="button"
          variant="body2"
          onClick={() => navigate(ROUTES.RESOURCES)}
          sx={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            color: theme.palette.text.secondary,
            border: "none",
            background: "none",
            cursor: "pointer",
            "&:hover": {
              color: theme.palette.primary.main,
            },
          }}
        >
          <StorageIcon sx={{ mr: 0.5, fontSize: 16 }} />
          Resources
        </Link>
        <Typography
          variant="body2"
          sx={{
            display: "flex",
            alignItems: "center",
            color: theme.palette.text.primary,
            textTransform: "capitalize",
          }}
        >
          {getCurrentTab()}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          RabbitMQ Resources
        </Typography>
        {selectedCluster && (
          <Typography variant="body1" color="text.secondary">
            Managing resources for cluster:{" "}
            <strong>{selectedCluster.name}</strong>
          </Typography>
        )}
      </Box>

      {/* Resource Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={getCurrentTab()}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            "& .MuiTab-root": {
              minHeight: { xs: 48, sm: 64 },
              textTransform: "none",
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              fontWeight: 500,
              minWidth: { xs: 80, sm: 120 },
              padding: { xs: "6px 8px", sm: "12px 16px" },
            },
            "& .MuiTabs-scrollButtons": {
              "&.Mui-disabled": {
                opacity: 0.3,
              },
            },
          }}
        >
          {resourceTabs.map((tab) => (
            <Tab
              key={tab.value}
              label={tab.label}
              value={tab.value}
              icon={tab.icon}
              iconPosition="start"
              sx={{
                "& .MuiTab-iconWrapper": {
                  marginRight: 1,
                  marginBottom: 0,
                },
              }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Content */}
      <Box>{children}</Box>
    </Container>
  );
};

export default ResourceLayout;
