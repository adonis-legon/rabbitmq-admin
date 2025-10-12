import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Typography,
    Box,
    FormHelperText,
    Autocomplete,
} from '@mui/material';
import { CreateShovelRequest, RabbitMQQueue } from '../../types/rabbitmq';
import { rabbitmqResourcesApi } from '../../services/api/rabbitmqResourcesApi';
import { useWriteOperationNotifications } from '../../hooks/useWriteOperationNotifications';

interface CreateShovelDialogProps {
    open: boolean;
    clusterId: string;
    sourceQueue?: {
        name: string;
        vhost: string;
    };
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateShovelDialog: React.FC<CreateShovelDialogProps> = ({
    open,
    clusterId,
    sourceQueue,
    onClose,
    onSuccess,
}) => {
    const { notifyShovelCreated, notifyOperationError } = useWriteOperationNotifications();

    const [formData, setFormData] = useState<CreateShovelRequest>({
        name: '',
        vhost: '/',
        sourceQueue: '',
        destinationQueue: '',
        sourceUri: 'amqp://localhost',
        destinationUri: 'amqp://localhost',
        deleteAfter: 'queue-length',
        ackMode: 'on-confirm',
    });

    const [queues, setQueues] = useState<RabbitMQQueue[]>([]);
    const [loading, setLoading] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Initialize form with source queue if provided
    useEffect(() => {
        if (sourceQueue && open) {
            setFormData(prev => ({
                ...prev,
                vhost: sourceQueue.vhost,
                sourceQueue: sourceQueue.name,
                name: `shovel-${sourceQueue.name}-${Date.now()}`,
            }));
        }
    }, [sourceQueue, open]);

    // Load queues for autocomplete
    const loadQueues = useCallback(async () => {
        try {
            const response = await rabbitmqResourcesApi.getQueues(clusterId, { pageSize: 500 });
            setQueues(response.items);
        } catch (error) {
            console.error('Failed to load queues:', error);
        }
    }, [clusterId]);

    useEffect(() => {
        if (open) {
            loadQueues();
        }
    }, [open, loadQueues]);

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.name.trim()) {
            errors.name = 'Shovel name is required';
        } else if (!/^[a-zA-Z0-9._-]+$/.test(formData.name)) {
            errors.name = 'Name can only contain letters, numbers, dots, underscores, and hyphens';
        }

        if (!formData.vhost.trim()) {
            errors.vhost = 'Virtual host is required';
        }

        if (!formData.sourceQueue.trim()) {
            errors.sourceQueue = 'Source queue is required';
        }

        if (!formData.destinationQueue.trim()) {
            errors.destinationQueue = 'Destination queue is required';
        }

        if (formData.sourceQueue === formData.destinationQueue) {
            errors.destinationQueue = 'Destination queue must be different from source queue';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            // Find the source queue to get its current message count
            const sourceQueueData = queues.find(q =>
                q.name === formData.sourceQueue && q.vhost === formData.vhost
            );

            // Submit data without URI fields since they're hardcoded on the backend
            const submitData = {
                name: formData.name,
                vhost: formData.vhost,
                sourceQueue: formData.sourceQueue,
                destinationQueue: formData.destinationQueue,
                deleteAfter: formData.deleteAfter,
                ackMode: formData.ackMode,
                sourceQueueMessageCount: sourceQueueData?.messages || 0,
            };

            await rabbitmqResourcesApi.createShovel(clusterId, submitData);
            notifyShovelCreated(formData.name, formData.sourceQueue, formData.destinationQueue);
            onSuccess();
            handleClose();
        } catch (error: any) {
            console.error('Error creating shovel:', error);
            notifyOperationError('move', 'Messages', formData.name, error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            vhost: '/',
            sourceQueue: '',
            destinationQueue: '',
            deleteAfter: 'queue-length',
            ackMode: 'on-confirm',
        });
        setFormErrors({});
        onClose();
    };

    const handleFieldChange = (field: keyof CreateShovelRequest) => (
        event: React.ChangeEvent<HTMLInputElement> | any
    ) => {
        const value = event.target?.value || event;
        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear field error when user starts typing
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    // Filter queues by vhost
    const availableQueues = queues.filter(queue => queue.vhost === formData.vhost);
    const sourceQueueOptions = availableQueues.map(q => q.name);
    const destinationQueueOptions = availableQueues
        .filter(q => q.name !== formData.sourceQueue)
        .map(q => q.name);

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            disableEscapeKeyDown={loading}
        >
            <DialogTitle>Move Messages</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Move messages from one queue to another. Messages will be transferred
                        continuously until the source queue is empty.
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Operation Name"
                                value={formData.name}
                                onChange={handleFieldChange('name')}
                                error={!!formErrors.name}
                                helperText={formErrors.name || 'Unique name for this move operation'}
                                disabled={loading}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Virtual Host"
                                value={formData.vhost}
                                onChange={handleFieldChange('vhost')}
                                error={!!formErrors.vhost}
                                helperText={formErrors.vhost}
                                disabled={loading}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Autocomplete
                                options={sourceQueueOptions}
                                value={formData.sourceQueue}
                                onChange={(_, newValue) => handleFieldChange('sourceQueue')(newValue || '')}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Source Queue"
                                        error={!!formErrors.sourceQueue}
                                        helperText={formErrors.sourceQueue || 'Queue to move messages from'}
                                        disabled={loading}
                                    />
                                )}
                                freeSolo
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Autocomplete
                                options={destinationQueueOptions}
                                value={formData.destinationQueue}
                                onChange={(_, newValue) => handleFieldChange('destinationQueue')(newValue || '')}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Destination Queue"
                                        error={!!formErrors.destinationQueue}
                                        helperText={formErrors.destinationQueue || 'Queue to move messages to'}
                                        disabled={loading}
                                    />
                                )}
                                freeSolo
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth error={!!formErrors.deleteAfter}>
                                <InputLabel>Delete After</InputLabel>
                                <Select
                                    value={formData.deleteAfter}
                                    onChange={handleFieldChange('deleteAfter')}
                                    label="Delete After"
                                    disabled={loading}
                                >
                                    <MenuItem value="queue-length">Queue Length (Delete after transfer)</MenuItem>
                                    <MenuItem value="never">Never (Keep messages in source)</MenuItem>
                                </Select>
                                <FormHelperText>
                                    {formErrors.deleteAfter || 'When to delete messages from source queue'}
                                </FormHelperText>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth error={!!formErrors.ackMode}>
                                <InputLabel>Acknowledgment Mode</InputLabel>
                                <Select
                                    value={formData.ackMode}
                                    onChange={handleFieldChange('ackMode')}
                                    label="Acknowledgment Mode"
                                    disabled={loading}
                                >
                                    <MenuItem value="on-confirm">On Confirm (Safest)</MenuItem>
                                    <MenuItem value="on-publish">On Publish (Faster)</MenuItem>
                                    <MenuItem value="no-ack">No Acknowledgment (Fastest, least safe)</MenuItem>
                                </Select>
                                <FormHelperText>
                                    {formErrors.ackMode || 'When to acknowledge messages'}
                                </FormHelperText>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                >
                    {loading ? 'Moving Messages...' : 'Move Messages'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};