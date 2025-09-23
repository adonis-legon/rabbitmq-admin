import React from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from "@mui/material";
import { AppIcons, getIcon, IconSizes } from "../../utils/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "../../utils/constants";
import { ClusterConnection } from "../../types/cluster";
import { Breadcrumbs } from "../common";

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
    icon: AppIcons.connections,
  },
  {
    label: "Channels",
    value: "channels",
    path: ROUTES.RESOURCES_CHANNELS,
    icon: AppIcons.channels,
  },
  {
    label: "Exchanges",
    value: "exchanges",
    path: ROUTES.RESOURCES_EXCHANGES,
    icon: AppIcons.exchanges,
  },
  {
    label: "Queues",
    value: "queues",
    path: ROUTES.RESOURCES_QUEUES,
    icon: AppIcons.queues,
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
  // Determine current tab based on pathname
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes("/connections")) return "connections";
    if (path.includes("/channels")) return "channels";
    if (path.includes("/exchanges")) return "exchanges";
    if (path.includes("/queues")) return "queues";
    return "connections"; // default
  };

  // Get properly capitalized label for current tab
  const getCurrentTabLabel = () => {
    const currentTab = getCurrentTab();
    switch (currentTab) {
      case "connections":
        return "Connections";
      case "channels":
        return "Channels";
      case "exchanges":
        return "Exchanges";
      case "queues":
        return "Queues";
      default:
        return "Connections";
    }
  };

  // Get icon for current tab
  const getCurrentTabIcon = () => {
    const currentTab = getCurrentTab();
    switch (currentTab) {
      case "connections":
        return getIcon("connections", {
          fontSize: IconSizes.breadcrumb,
          sx: { mr: 0.5 },
        });
      case "channels":
        return getIcon("channels", {
          fontSize: IconSizes.breadcrumb,
          sx: { mr: 0.5 },
        });
      case "exchanges":
        return getIcon("exchanges", {
          fontSize: IconSizes.breadcrumb,
          sx: { mr: 0.5 },
        });
      case "queues":
        return getIcon("queues", {
          fontSize: IconSizes.breadcrumb,
          sx: { mr: 0.5 },
        });
      default:
        return getIcon("connections", {
          fontSize: IconSizes.breadcrumb,
          sx: { mr: 0.5 },
        });
    }
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
      <Box sx={{ mt: 4, px: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Cluster Selection Required
          </Typography>
          <Typography variant="body2">
            Please select a cluster connection from the dashboard to access
            RabbitMQ resources.
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ mt: 4, display: "flex", justifyContent: "center", px: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box sx={{ mt: 4, px: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
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
            label: "Resources",
            path: ROUTES.RESOURCES,
            icon: getIcon("resources", {
              fontSize: IconSizes.breadcrumb,
              sx: { mr: 0.5 },
            }),
          },
          {
            label: getCurrentTabLabel(),
            icon: getCurrentTabIcon(),
          },
        ]}
      />

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
    </Box>
  );
};

export default ResourceLayout;
