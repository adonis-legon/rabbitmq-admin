// Utility functions for consistent notification handling across write operations

export interface NotificationOptions {
    autoHideDuration?: number;
    includeDetails?: boolean;
}

export interface ErrorDetails {
    status?: number;
    message?: string;
    details?: string;
}

/**
 * Formats success messages for write operations with consistent patterns
 */
export const formatSuccessMessage = (
    operation: string,
    resourceType: string,
    resourceName: string,
    additionalInfo?: string
): string => {
    const baseMessage = `${resourceType} "${resourceName}" ${operation} successfully`;
    return additionalInfo ? `${baseMessage}. ${additionalInfo}` : baseMessage;
};

/**
 * Formats error messages for write operations with consistent patterns and detailed error handling
 */
export const formatErrorMessage = (
    operation: string,
    resourceType: string,
    resourceName: string,
    error: ErrorDetails
): string => {
    const { status, message } = error;

    // Handle specific HTTP status codes with user-friendly messages
    switch (status) {
        case 400:
            return message || `Invalid ${resourceType.toLowerCase()} configuration. Please check your inputs.`;

        case 401:
            return "Your session has expired. Please log in again.";

        case 403:
            return `You do not have permission to ${operation.toLowerCase()} ${resourceType.toLowerCase()}s on this cluster`;

        case 404:
            if (resourceName) {
                return `${resourceType} "${resourceName}" not found`;
            }
            return message || "The requested resource was not found";

        case 409:
            return `${resourceType} "${resourceName}" already exists`;

        case 412:
            // Precondition failed - common for conditional deletions
            if (operation.toLowerCase().includes('delete')) {
                return `Cannot ${operation.toLowerCase()} ${resourceType.toLowerCase()} "${resourceName}" because it is in use or has dependencies`;
            }
            return message || `Operation failed due to precondition requirements`;

        case 422:
            return message || `Invalid ${resourceType.toLowerCase()} data. Please check your inputs.`;

        case 429:
            return "Too many requests. Please wait a moment and try again.";

        case 500:
        case 502:
        case 503:
        case 504:
            return `Server error occurred while ${operation.toLowerCase()} ${resourceType.toLowerCase()}. Please try again later.`;

        default:
            // Fallback to provided message or generic error
            return message || `Failed to ${operation.toLowerCase()} ${resourceType.toLowerCase()}. Please try again.`;
    }
};

/**
 * Formats routing result messages for message publishing operations
 */
export const formatRoutingMessage = (
    targetType: 'exchange' | 'queue',
    targetName: string,
    routed: boolean,
    routingKey?: string
): { message: string; type: 'success' | 'warning' } => {
    const routingInfo = routingKey ? ` with routing key "${routingKey}"` : '';

    if (routed) {
        return {
            message: `Message published to ${targetType} "${targetName}"${routingInfo} and routed successfully`,
            type: 'success'
        };
    } else {
        return {
            message: `Message published to ${targetType} "${targetName}"${routingInfo} but was not routed to any queue`,
            type: 'warning'
        };
    }
};

/**
 * Formats message consumption result messages
 */
export const formatConsumptionMessage = (
    queueName: string,
    messageCount: number,
    ackMode: string
): string => {
    const ackModeDescription = getAckModeDescription(ackMode);
    const messageText = messageCount === 1 ? 'message' : 'messages';

    if (messageCount === 0) {
        return `Queue "${queueName}" is empty - no messages available`;
    }

    return `Retrieved ${messageCount} ${messageText} from queue "${queueName}" (${ackModeDescription})`;
};

/**
 * Gets user-friendly description for acknowledgment modes
 */
export const getAckModeDescription = (ackMode: string): string => {
    switch (ackMode) {
        case 'ack_requeue_true':
            return 'acknowledged and requeued';
        case 'ack_requeue_false':
            return 'acknowledged and removed';
        case 'reject_requeue_true':
            return 'rejected and requeued';
        case 'reject_requeue_false':
            return 'rejected and removed';
        default:
            return 'processed';
    }
};

/**
 * Gets appropriate notification duration based on message type and content
 */
export const getNotificationDuration = (
    type: 'success' | 'error' | 'warning' | 'info',
    messageLength: number = 0
): number => {
    // Base durations in milliseconds
    const baseDurations = {
        success: 4000,
        info: 6000,
        warning: 8000,
        error: 10000
    };

    let duration = baseDurations[type];

    // Extend duration for longer messages
    if (messageLength > 100) {
        duration += Math.min(3000, Math.floor(messageLength / 50) * 1000);
    }

    return duration;
};

/**
 * Formats binding description for notifications
 */
export const formatBindingDescription = (
    source: string,
    destination: string,
    destinationType: 'queue' | 'exchange',
    routingKey?: string
): string => {
    const routingInfo = routingKey ? ` (routing key: "${routingKey}")` : '';
    return `${source} → ${destination} (${destinationType})${routingInfo}`;
};

/**
 * Formats virtual host display name for notifications
 */
export const formatVirtualHostName = (vhost: string): string => {
    return vhost === '/' ? '/ (default)' : vhost;
};

/**
 * Creates a standardized loading message for operations
 */
export const formatLoadingMessage = (
    operation: string,
    resourceType: string,
    resourceName?: string
): string => {
    const resource = resourceName ? ` "${resourceName}"` : '';
    return `${operation} ${resourceType.toLowerCase()}${resource}...`;
};