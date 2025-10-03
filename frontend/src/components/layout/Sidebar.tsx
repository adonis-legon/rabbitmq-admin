import React from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Typography,
  useTheme,
  Collapse,
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { AppIcons } from "../../utils/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { UserRole } from "../../types/auth";
import { ROUTES } from "../../utils/constants";
import { useClusterContext } from "../../contexts/ClusterContext";

interface SidebarProps {
  onItemClick?: () => void;
}

interface NavigationItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  adminOnly?: boolean;
  requiresCluster?: boolean;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    text: "Dashboard",
    icon: AppIcons.dashboard,
    path: ROUTES.DASHBOARD,
  },
  {
    text: "Resources",
    icon: AppIcons.resources,
    path: ROUTES.RESOURCES,
    requiresCluster: true,
    children: [
      {
        text: "Connections",
        icon: AppIcons.connections,
        path: ROUTES.RESOURCES_CONNECTIONS,
        requiresCluster: true,
      },
      {
        text: "Channels",
        icon: AppIcons.channels,
        path: ROUTES.RESOURCES_CHANNELS,
        requiresCluster: true,
      },
      {
        text: "Exchanges",
        icon: AppIcons.exchanges,
        path: ROUTES.RESOURCES_EXCHANGES,
        requiresCluster: true,
      },
      {
        text: "Queues",
        icon: AppIcons.queues,
        path: ROUTES.RESOURCES_QUEUES,
        requiresCluster: true,
      },
    ],
  },
  {
    text: "Management",
    icon: AppIcons.management,
    path: ROUTES.USERS, // Default to first child when clicked
    adminOnly: true,
    children: [
      {
        text: "Users",
        icon: AppIcons.users,
        path: ROUTES.USERS,
        adminOnly: true,
      },
      {
        text: "Clusters",
        icon: AppIcons.clusters,
        path: ROUTES.CLUSTERS,
        adminOnly: true,
      },
      {
        text: "Audits",
        icon: AppIcons.audit,
        path: ROUTES.AUDIT,
        adminOnly: true,
      },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const theme = useTheme();
  const { clusters } = useClusterContext();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([
    "Resources",
    "Management",
  ]);

  const isAdmin = user?.role === UserRole.ADMINISTRATOR;
  const hasClusterAccess = clusters.length > 0;

  const handleNavigation = (path: string) => {
    navigate(path);
    onItemClick?.();
  };

  const handleExpandToggle = (itemText: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemText)
        ? prev.filter((item) => item !== itemText)
        : [...prev, itemText]
    );
  };

  const isItemActive = (item: NavigationItem): boolean => {
    if (item.children) {
      return item.children.some((child) => location.pathname === child.path);
    }
    return location.pathname === item.path;
  };

  const isChildActive = (path: string): boolean => {
    return location.pathname === path;
  };

  const filteredItems = navigationItems.filter((item) => {
    // Filter by admin role
    if (item.adminOnly && !isAdmin) return false;

    // Filter by cluster access - show but disable if no cluster access
    return true;
  });

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {/* Toolbar spacer to align with top bar */}
      <Toolbar>
        <Typography
          variant="subtitle2"
          sx={{
            color: theme.palette.text.secondary,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Navigation
        </Typography>
      </Toolbar>

      <Divider />

      {/* Navigation items */}
      <Box sx={{ flexGrow: 1, overflow: "auto" }}>
        <List sx={{ pt: 1 }}>
          {filteredItems.map((item) => {
            const isActive = isItemActive(item);
            const isExpanded = expandedItems.includes(item.text);
            const isDisabled = item.requiresCluster && !hasClusterAccess;

            return (
              <React.Fragment key={item.text}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => {
                      if (item.children) {
                        handleExpandToggle(item.text);
                        // Navigate to first child if available and not disabled
                        if (item.children.length > 0) {
                          const firstChild = item.children[0];
                          const isFirstChildDisabled =
                            firstChild.requiresCluster && !hasClusterAccess;
                          if (!isFirstChildDisabled) {
                            handleNavigation(firstChild.path);
                          }
                        }
                      } else {
                        handleNavigation(item.path);
                      }
                    }}
                    disabled={isDisabled}
                    sx={{
                      mx: 1,
                      mb: 0.5,
                      borderRadius: 1,
                      backgroundColor: isActive
                        ? theme.palette.primary.light
                        : "transparent",
                      color: isDisabled
                        ? theme.palette.text.disabled
                        : isActive
                        ? theme.palette.primary.contrastText
                        : theme.palette.text.primary,
                      "&:hover": {
                        backgroundColor: isDisabled
                          ? "transparent"
                          : isActive
                          ? theme.palette.primary.main
                          : theme.palette.action.hover,
                      },
                      transition: theme.transitions.create(
                        ["background-color"],
                        {
                          duration: theme.transitions.duration.short,
                        }
                      ),
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: isDisabled
                          ? theme.palette.text.disabled
                          : isActive
                          ? theme.palette.primary.contrastText
                          : theme.palette.text.secondary,
                        minWidth: 40,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: "0.875rem",
                        fontWeight: isActive ? 600 : 400,
                      }}
                    />
                    {item.children && (
                      <Box sx={{ ml: 1 }}>
                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                      </Box>
                    )}
                  </ListItemButton>
                </ListItem>

                {/* Render children if expanded */}
                {item.children && (
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.children.map((child) => {
                        const isChildActiveState = isChildActive(child.path);
                        const isChildDisabled =
                          child.requiresCluster && !hasClusterAccess;

                        return (
                          <ListItem key={child.text} disablePadding>
                            <ListItemButton
                              onClick={() => handleNavigation(child.path)}
                              disabled={isChildDisabled}
                              sx={{
                                mx: 1,
                                mb: 0.5,
                                ml: 3, // Indent child items
                                borderRadius: 1,
                                backgroundColor: isChildActiveState
                                  ? theme.palette.primary.light
                                  : "transparent",
                                color: isChildDisabled
                                  ? theme.palette.text.disabled
                                  : isChildActiveState
                                  ? theme.palette.primary.contrastText
                                  : theme.palette.text.primary,
                                "&:hover": {
                                  backgroundColor: isChildDisabled
                                    ? "transparent"
                                    : isChildActiveState
                                    ? theme.palette.primary.main
                                    : theme.palette.action.hover,
                                },
                                transition: theme.transitions.create(
                                  ["background-color"],
                                  {
                                    duration: theme.transitions.duration.short,
                                  }
                                ),
                              }}
                            >
                              <ListItemIcon
                                sx={{
                                  color: isChildDisabled
                                    ? theme.palette.text.disabled
                                    : isChildActiveState
                                    ? theme.palette.primary.contrastText
                                    : theme.palette.text.secondary,
                                  minWidth: 32,
                                }}
                              >
                                {child.icon}
                              </ListItemIcon>
                              <ListItemText
                                primary={child.text}
                                primaryTypographyProps={{
                                  fontSize: "0.8125rem",
                                  fontWeight: isChildActiveState ? 600 : 400,
                                }}
                              />
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                    </List>
                  </Collapse>
                )}
              </React.Fragment>
            );
          })}
        </List>
      </Box>

      {/* User info section at bottom */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            display: "block",
            mb: 0.5,
          }}
        >
          Signed in as
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 500,
          }}
        >
          {user?.username}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            textTransform: "capitalize",
          }}
        >
          {user?.role?.toLowerCase()}
        </Typography>
      </Box>
    </Box>
  );
};

export default Sidebar;
