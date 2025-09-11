import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip
} from '@mui/material';
import { ClusterConnection } from '../../types/cluster';

interface ClusterSelectorProps {
  clusters: ClusterConnection[];
  selectedCluster: ClusterConnection | null;
  onClusterSelect: (cluster: ClusterConnection) => void;
}

const ClusterSelector: React.FC<ClusterSelectorProps> = ({
  clusters,
  selectedCluster,
  onClusterSelect
}) => {
  const handleChange = (event: any) => {
    const clusterId = event.target.value;
    const cluster = clusters.find(c => c.id === clusterId);
    if (cluster) {
      onClusterSelect(cluster);
    }
  };

  if (clusters.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Active Cluster Selection
      </Typography>
      
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="cluster-select-label">Select Active Cluster</InputLabel>
        <Select
          labelId="cluster-select-label"
          id="cluster-select"
          value={selectedCluster?.id || ''}
          label="Select Active Cluster"
          onChange={handleChange}
        >
          {clusters.map((cluster) => (
            <MenuItem key={cluster.id} value={cluster.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body1">
                    {cluster.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {cluster.apiUrl}
                  </Typography>
                </Box>
                <Chip
                  label={cluster.active ? 'Active' : 'Inactive'}
                  color={cluster.active ? 'success' : 'error'}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedCluster && (
        <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1, color: 'primary.contrastText' }}>
          <Typography variant="body2">
            <strong>Currently Selected:</strong> {selectedCluster.name}
          </Typography>
          <Typography variant="caption">
            {selectedCluster.description || 'No description available'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ClusterSelector;