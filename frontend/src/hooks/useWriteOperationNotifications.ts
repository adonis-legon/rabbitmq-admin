import { useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import {
    formatSuccessMessage,
    formatErrorMessage,
    formatRoutingMessage,
    formatConsumptionMessage,
    formatBindingDescription,
    getNotificationDuration,
    ErrorDetails,
} from '../utils/notificationUtils';

export interface WriteOperationResult {
    success: boolean;
    message?: string;
    routed?: boolean;
    messageCount?: number;
}

/**
 * Hook for handling notifications in write operations with consistent patterns
 */
export const useWriteOperationNotifications = () => {
    const { success, error, warning, info } = useNotification();

    const notifySuccess = useCallback(
        (
            operation: string,
            resourceType: string,
            resourceName: string,
            additionalInfo?: string
        ) => {
            const message = formatSuccessMessage(operation, resourceType, resourceName, additionalInfo);
            const duration = getNotificationDuration('success', message.length);
            success(message, duration);
        },
        [success]
    );

    const notifyError = useCallback(
        (
            operation: string,
            resourceType: string,
            resourceName: string,
            errorDetails: ErrorDetails
        ) => {
            const message = formatErrorMessage(operation, resourceType, resourceName, errorDetails);
            const duration = getNotificationDuration('error', message.length);
            error(message, duration);
        },
        [error]
    );

    const notifyExchangeCreated = useCallback(
        (exchangeName: string, exchangeType: string) => {
            notifySuccess('created', 'Exchange', exchangeName, `Type: ${exchangeType}`);
        },
        [notifySuccess]
    );

    const notifyExchangeDeleted = useCallback(
        (exchangeName: string, ifUnused?: boolean) => {
            const condition = ifUnused ? ' (if unused)' : '';
            notifySuccess('deleted', 'Exchange', exchangeName, `Deleted${condition}`);
        },
        [notifySuccess]
    );

    const notifyQueueCreated = useCallback(
        (queueName: string, durable: boolean) => {
            const durability = durable ? 'durable' : 'transient';
            notifySuccess('created', 'Queue', queueName, `Type: ${durability}`);
        },
        [notifySuccess]
    );

    const notifyQueueDeleted = useCallback(
        (queueName: string, options?: { ifEmpty?: boolean; ifUnused?: boolean }) => {
            const conditions = [];
            if (options?.ifEmpty) conditions.push('if empty');
            if (options?.ifUnused) conditions.push('if unused');
            const condition = conditions.length > 0 ? ` (${conditions.join(', ')})` : '';
            notifySuccess('deleted', 'Queue', queueName, `Deleted${condition}`);
        },
        [notifySuccess]
    );

    const notifyQueuePurged = useCallback(
        (queueName: string) => {
            notifySuccess('purged', 'Queue', queueName, 'All messages removed');
        },
        [notifySuccess]
    );

    const notifyBindingCreated = useCallback(
        (
            source: string,
            destination: string,
            destinationType: 'queue' | 'exchange',
            routingKey?: string
        ) => {
            const bindingDesc = formatBindingDescription(source, destination, destinationType, routingKey);
            const message = `Binding "${bindingDesc}" created successfully`;
            const duration = getNotificationDuration('success', message.length);
            success(message, duration);
        },
        [success]
    );

    const notifyMessagePublished = useCallback(
        (
            targetType: 'exchange' | 'queue',
            targetName: string,
            routed: boolean,
            routingKey?: string
        ) => {
            const { message, type } = formatRoutingMessage(targetType, targetName, routed, routingKey);
            const duration = getNotificationDuration(type, message.length);

            if (type === 'success') {
                success(message, duration);
            } else {
                warning(message, duration);
            }
        },
        [success, warning]
    );

    const notifyMessagesRetrieved = useCallback(
        (queueName: string, messageCount: number, ackMode: string) => {
            const message = formatConsumptionMessage(queueName, messageCount, ackMode);
            const duration = getNotificationDuration(messageCount === 0 ? 'info' : 'success', message.length);

            if (messageCount === 0) {
                info(message, duration);
            } else {
                success(message, duration);
            }
        },
        [success, info]
    );

    const notifyOperationError = useCallback(
        (
            operation: string,
            resourceType: string,
            resourceName: string,
            err: any
        ) => {
            const errorDetails: ErrorDetails = {
                status: err.response?.status,
                message: err.response?.data?.message || err.message,
                details: err.response?.data?.details,
            };

            notifyError(operation, resourceType, resourceName, errorDetails);
        },
        [notifyError]
    );

    const notifyLoadingOperation = useCallback(
        (operation: string, resourceType: string, resourceName?: string) => {
            const resource = resourceName ? ` "${resourceName}"` : '';
            const message = `${operation} ${resourceType.toLowerCase()}${resource}...`;
            info(message, 2000); // Short duration for loading messages
        },
        [info]
    );

    return {
        // Generic notifications
        notifySuccess,
        notifyError,
        notifyOperationError,
        notifyLoadingOperation,

        // Specific operation notifications
        notifyExchangeCreated,
        notifyExchangeDeleted,
        notifyQueueCreated,
        notifyQueueDeleted,
        notifyQueuePurged,
        notifyBindingCreated,
        notifyMessagePublished,
        notifyMessagesRetrieved,
    };
};