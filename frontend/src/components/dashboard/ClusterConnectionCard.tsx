import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ViewList as ViewListIcon,
} from "@mui/icons-material";
import { AppIcons } from "../../utils/icons";
import { ClusterConnection } from "../../types/cluster";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../utils/constants";

interface ClusterConnectionCardProps {
  cluster: ClusterConnection;
  isSelected: boolean;
  onSelect: () => void;
}

const ClusterConnectionCard: React.FC<ClusterConnectionCardProps> = ({
  cluster,
  isSelected,
  onSelect,
}) => {
  const navigate = useNavigate();

  const getStatusColor = () => {
    return cluster.active ? "success" : "error";
  };

  const getStatusIcon = () => {
    return cluster.active ? <CheckCircleIcon /> : <ErrorIcon />;
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border: isSelected ? 2 : 1,
        borderColor: isSelected ? "primary.main" : "divider",
        boxShadow: isSelected ? 3 : 1,
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          boxShadow: 3,
          transform: "translateY(-2px)",
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
          {React.cloneElement(AppIcons.clusters, {
            sx: { mr: 1, mt: 0.5, color: "primary.main" },
          })}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="h3" gutterBottom>
              {cluster.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {cluster.apiUrl}
            </Typography>
          </Box>
          <Tooltip title={cluster.active ? "Active" : "Inactive"}>
            <Chip
              icon={getStatusIcon()}
              label={cluster.active ? "Active" : "Inactive"}
              color={getStatusColor()}
              size="small"
            />
          </Tooltip>
        </Box>

        {cluster.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {cluster.description}
          </Typography>
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            User: {cluster.username}
          </Typography>
          {isSelected && (
            <Chip
              label="Selected"
              color="primary"
              size="small"
              variant="outlined"
            />
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
        <Button
          variant={isSelected ? "contained" : "outlined"}
          color="primary"
          onClick={onSelect}
          size="small"
        >
          {isSelected ? "Selected" : "Select"}
        </Button>

        <Box sx={{ display: "flex", gap: 1 }}>
          {isSelected && (
            <Tooltip title="View Resources">
              <IconButton
                color="primary"
                onClick={() => navigate(ROUTES.RESOURCES_CONNECTIONS)}
                disabled={!cluster.active}
                size="small"
              >
                <ViewListIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </CardActions>
    </Card>
  );
};

export default ClusterConnectionCard;
