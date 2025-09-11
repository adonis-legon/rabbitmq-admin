import React from 'react';
import { Typography, Box, Chip } from '@mui/material';
import { getVersionInfo, formatBuildDate } from '../utils/version';

interface VersionDisplayProps {
    variant?: 'footer' | 'login' | 'full';
    color?: 'primary' | 'secondary' | 'text.secondary';
}

const VersionDisplay: React.FC<VersionDisplayProps> = ({
    variant = 'footer',
    color = 'text.secondary'
}) => {
    const versionInfo = getVersionInfo();

    if (variant === 'footer') {
        return (
            <Typography
                variant="caption"
                color={color}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontSize: '0.75rem'
                }}
            >
                v{versionInfo.displayVersion}
                {versionInfo.isSnapshot && (
                    <Chip
                        label="DEV"
                        size="small"
                        color="warning"
                        sx={{ height: 16, fontSize: '0.6rem' }}
                    />
                )}
            </Typography>
        );
    }

    if (variant === 'login') {
        return (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="caption" color={color}>
                    RabbitMQ Admin Dashboard
                </Typography>
                <Typography variant="caption" color={color} display="block">
                    Version {versionInfo.displayVersion}
                </Typography>
            </Box>
        );
    }

    // Full variant
    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Version Information
            </Typography>
            <Typography variant="body2" color={color}>
                <strong>Version:</strong> {versionInfo.version}
            </Typography>
            <Typography variant="body2" color={color}>
                <strong>Build Date:</strong> {formatBuildDate()}
            </Typography>
            <Typography variant="body2" color={color}>
                <strong>Environment:</strong> {versionInfo.isSnapshot ? 'Development' : 'Production'}
            </Typography>
        </Box>
    );
};

export default VersionDisplay;