import React from "react";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  ViewList as ViewListIcon,
  Home as HomeIcon,
  AccountTree as AccountTreeIcon,
  Router as RouterIcon,
  Transform as TransformIcon,
  Inbox as InboxIcon,
  DnsRounded as ClusterIcon,
  Settings as ManagementIcon,
  Pets as RabbitIcon,
} from "@mui/icons-material";

// Centralized icon definitions for consistent usage across the app
export const AppIcons = {
  // App branding
  app: <RabbitIcon />,

  // Main navigation
  dashboard: <DashboardIcon />,
  home: <HomeIcon />,

  // Resource management
  resources: <ViewListIcon />,
  connections: <RouterIcon />, // Changed from CableIcon for better distinction
  channels: <AccountTreeIcon />, // Changed from HubIcon for better distinction
  exchanges: <TransformIcon />, // Changed from SwapHorizIcon for better distinction
  queues: <InboxIcon />, // Changed from QueueIcon for better distinction

  // Admin management
  management: <ManagementIcon />,
  users: <PeopleIcon />,
  clusters: <ClusterIcon />, // Changed from StorageIcon to better represent cluster infrastructure
} as const;

// Helper function to get icon with consistent sizing
export const getIcon = (
  iconName: keyof typeof AppIcons,
  props?: { fontSize?: number; sx?: any }
) => {
  const icon = AppIcons[iconName];
  if (props?.fontSize || props?.sx) {
    return React.cloneElement(icon, {
      sx: { fontSize: props.fontSize, ...props.sx },
    });
  }
  return icon;
};

// Icon sizes for different contexts
export const IconSizes = {
  breadcrumb: 16,
  sidebar: 20,
  tab: 20,
} as const;
