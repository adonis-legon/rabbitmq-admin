import React from "react";
import {
  Breadcrumbs as MuiBreadcrumbs,
  Link,
  Typography,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../utils/constants";

export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const navigate = useNavigate();
  const theme = useTheme();

  // Always start with RabbitMQ Admin
  const allItems: BreadcrumbItem[] = [
    {
      label: "RabbitMQ Admin",
      path: ROUTES.DASHBOARD,
    },
    ...items,
  ];

  return (
    <MuiBreadcrumbs sx={{ mb: 2 }}>
      {allItems.map((item, index) => {
        const isLast = index === allItems.length - 1;

        if (isLast || !item.path) {
          // Last item or item without path - render as text
          return (
            <Typography
              key={index}
              variant="body2"
              sx={{
                display: "flex",
                alignItems: "center",
                color: theme.palette.text.primary,
              }}
            >
              {item.icon}
              {item.label}
            </Typography>
          );
        }

        // Clickable breadcrumb item
        return (
          <Link
            key={index}
            component="button"
            variant="body2"
            onClick={() => navigate(item.path!)}
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
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
};

export default Breadcrumbs;
