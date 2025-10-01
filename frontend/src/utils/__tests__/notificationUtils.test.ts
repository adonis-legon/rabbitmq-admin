import { describe, it, expect } from 'vitest';
import {
    formatSuccessMessage,
    formatErrorMessage,
    formatRoutingMessage,
    formatConsumptionMessage,
    getAckModeDescription,
    getNotificationDuration,
    formatBindingDescription,
    formatVirtualHostName,
    formatLoadingMessage,
    type ErrorDetails,
} from '../notificationUtils';

describe('notificationUtils', () => {
    describe('formatSuccessMessage', () => {
        it('should format basic success message', () => {
            const result = formatSuccessMessage('created', 'Exchange', 'test-exchange');
            expect(result).toBe('Exchange "test-exchange" created successfully');
        });

        it('should include additional info when provided', () => {
            const result = formatSuccessMessage(
                'created',
                'Queue',
                'test-queue',
                'Ready to receive messages'
            );
            expect(result).toBe('Queue "test-queue" created successfully. Ready to receive messages');
        });
    });

    describe('formatErrorMessage', () => {
        it('should handle 400 Bad Request', () => {
            const error: ErrorDetails = { status: 400 };
            const result = formatErrorMessage('create', 'Exchange', 'test-exchange', error);
            expect(result).toBe('Invalid exchange configuration. Please check your inputs.');
        });

        it('should handle 401 Unauthorized', () => {
            const error: ErrorDetails = { status: 401 };
            const result = formatErrorMessage('delete', 'Queue', 'test-queue', error);
            expect(result).toBe('Your session has expired. Please log in again.');
        });

        it('should handle 403 Forbidden', () => {
            const error: ErrorDetails = { status: 403 };
            const result = formatErrorMessage('create', 'Exchange', 'test-exchange', error);
            expect(result).toBe('You do not have permission to create exchanges on this cluster');
        });

        it('should handle 404 Not Found with resource name', () => {
            const error: ErrorDetails = { status: 404 };
            const result = formatErrorMessage('delete', 'Queue', 'test-queue', error);
            expect(result).toBe('Queue "test-queue" not found');
        });

        it('should handle 409 Conflict', () => {
            const error: ErrorDetails = { status: 409 };
            const result = formatErrorMessage('create', 'Exchange', 'test-exchange', error);
            expect(result).toBe('Exchange "test-exchange" already exists');
        });

        it('should handle 412 Precondition Failed for delete operations', () => {
            const error: ErrorDetails = { status: 412 };
            const result = formatErrorMessage('delete', 'Queue', 'test-queue', error);
            expect(result).toBe('Cannot delete queue "test-queue" because it is in use or has dependencies');
        });

        it('should handle 422 Unprocessable Entity', () => {
            const error: ErrorDetails = { status: 422 };
            const result = formatErrorMessage('create', 'Queue', 'test-queue', error);
            expect(result).toBe('Invalid queue data. Please check your inputs.');
        });

        it('should handle 429 Too Many Requests', () => {
            const error: ErrorDetails = { status: 429 };
            const result = formatErrorMessage('publish', 'Message', '', error);
            expect(result).toBe('Too many requests. Please wait a moment and try again.');
        });

        it('should handle 500 Server Error', () => {
            const error: ErrorDetails = { status: 500 };
            const result = formatErrorMessage('create', 'Exchange', 'test-exchange', error);
            expect(result).toBe('Server error occurred while create exchange. Please try again later.');
        });

        it('should use custom message when provided', () => {
            const error: ErrorDetails = { status: 400, message: 'Custom error message' };
            const result = formatErrorMessage('create', 'Exchange', 'test-exchange', error);
            expect(result).toBe('Custom error message');
        });

        it('should handle unknown status codes', () => {
            const error: ErrorDetails = { status: 999 };
            const result = formatErrorMessage('create', 'Exchange', 'test-exchange', error);
            expect(result).toBe('Failed to create exchange. Please try again.');
        });
    });

    describe('formatRoutingMessage', () => {
        it('should format successful routing message', () => {
            const result = formatRoutingMessage('exchange', 'test-exchange', true, 'user.created');
            expect(result).toEqual({
                message: 'Message published to exchange "test-exchange" with routing key "user.created" and routed successfully',
                type: 'success'
            });
        });

        it('should format unrouted message warning', () => {
            const result = formatRoutingMessage('queue', 'test-queue', false);
            expect(result).toEqual({
                message: 'Message published to queue "test-queue" but was not routed to any queue',
                type: 'warning'
            });
        });

        it('should handle empty routing key', () => {
            const result = formatRoutingMessage('exchange', 'test-exchange', true);
            expect(result).toEqual({
                message: 'Message published to exchange "test-exchange" and routed successfully',
                type: 'success'
            });
        });
    });

    describe('formatConsumptionMessage', () => {
        it('should format single message consumption', () => {
            const result = formatConsumptionMessage('test-queue', 1, 'ack_requeue_false');
            expect(result).toBe('Retrieved 1 message from queue "test-queue" (acknowledged and removed)');
        });

        it('should format multiple messages consumption', () => {
            const result = formatConsumptionMessage('test-queue', 5, 'ack_requeue_true');
            expect(result).toBe('Retrieved 5 messages from queue "test-queue" (acknowledged and requeued)');
        });

        it('should handle empty queue', () => {
            const result = formatConsumptionMessage('test-queue', 0, 'ack_requeue_false');
            expect(result).toBe('Queue "test-queue" is empty - no messages available');
        });
    });

    describe('getAckModeDescription', () => {
        it('should return correct descriptions for all ack modes', () => {
            expect(getAckModeDescription('ack_requeue_true')).toBe('acknowledged and requeued');
            expect(getAckModeDescription('ack_requeue_false')).toBe('acknowledged and removed');
            expect(getAckModeDescription('reject_requeue_true')).toBe('rejected and requeued');
            expect(getAckModeDescription('reject_requeue_false')).toBe('rejected and removed');
            expect(getAckModeDescription('unknown')).toBe('processed');
        });
    });

    describe('getNotificationDuration', () => {
        it('should return correct base durations', () => {
            expect(getNotificationDuration('success')).toBe(4000);
            expect(getNotificationDuration('info')).toBe(6000);
            expect(getNotificationDuration('warning')).toBe(8000);
            expect(getNotificationDuration('error')).toBe(10000);
        });

        it('should extend duration for long messages', () => {
            const shortMessage = getNotificationDuration('success', 50);
            const longMessage = getNotificationDuration('success', 200);
            expect(longMessage).toBeGreaterThan(shortMessage);
        });

        it('should cap maximum extension', () => {
            const veryLongMessage = getNotificationDuration('success', 10000);
            expect(veryLongMessage).toBeLessThanOrEqual(7000); // 4000 base + 3000 max extension
        });
    });

    describe('formatBindingDescription', () => {
        it('should format binding with routing key', () => {
            const result = formatBindingDescription('source-exchange', 'target-queue', 'queue', 'user.created');
            expect(result).toBe('source-exchange → target-queue (queue) (routing key: "user.created")');
        });

        it('should format binding without routing key', () => {
            const result = formatBindingDescription('source-exchange', 'target-exchange', 'exchange');
            expect(result).toBe('source-exchange → target-exchange (exchange)');
        });
    });

    describe('formatVirtualHostName', () => {
        it('should format default virtual host', () => {
            const result = formatVirtualHostName('/');
            expect(result).toBe('/ (default)');
        });

        it('should format custom virtual host', () => {
            const result = formatVirtualHostName('production');
            expect(result).toBe('production');
        });
    });

    describe('formatLoadingMessage', () => {
        it('should format loading message with resource name', () => {
            const result = formatLoadingMessage('Creating', 'Exchange', 'test-exchange');
            expect(result).toBe('Creating exchange "test-exchange"...');
        });

        it('should format loading message without resource name', () => {
            const result = formatLoadingMessage('Loading', 'Queues');
            expect(result).toBe('Loading queues...');
        });
    });
});