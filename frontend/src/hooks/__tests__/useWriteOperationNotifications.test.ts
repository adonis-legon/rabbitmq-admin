import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useWriteOperationNotifications } from '../useWriteOperationNotifications';

// Mock the notification context
const mockSuccess = vi.fn();
const mockError = vi.fn();
const mockWarning = vi.fn();
const mockInfo = vi.fn();

vi.mock('../../contexts/NotificationContext', () => ({
    useNotification: () => ({
        success: mockSuccess,
        error: mockError,
        warning: mockWarning,
        info: mockInfo,
    }),
}));

describe('useWriteOperationNotifications', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should notify exchange creation with type information', () => {
        const { result } = renderHook(() => useWriteOperationNotifications());

        result.current.notifyExchangeCreated('test-exchange', 'direct');

        expect(mockSuccess).toHaveBeenCalledWith(
            'Exchange "test-exchange" created successfully. Type: direct',
            expect.any(Number)
        );
    });

    it('should notify exchange deletion with conditional information', () => {
        const { result } = renderHook(() => useWriteOperationNotifications());

        result.current.notifyExchangeDeleted('test-exchange', true);

        expect(mockSuccess).toHaveBeenCalledWith(
            'Exchange "test-exchange" deleted successfully. Deleted (if unused)',
            expect.any(Number)
        );
    });

    it('should notify queue creation with durability information', () => {
        const { result } = renderHook(() => useWriteOperationNotifications());

        result.current.notifyQueueCreated('test-queue', true);

        expect(mockSuccess).toHaveBeenCalledWith(
            'Queue "test-queue" created successfully. Type: durable',
            expect.any(Number)
        );
    });

    it('should notify queue deletion with conditional options', () => {
        const { result } = renderHook(() => useWriteOperationNotifications());

        result.current.notifyQueueDeleted('test-queue', { ifEmpty: true, ifUnused: true });

        expect(mockSuccess).toHaveBeenCalledWith(
            'Queue "test-queue" deleted successfully. Deleted (if empty, if unused)',
            expect.any(Number)
        );
    });

    it('should notify queue purge', () => {
        const { result } = renderHook(() => useWriteOperationNotifications());

        result.current.notifyQueuePurged('test-queue');

        expect(mockSuccess).toHaveBeenCalledWith(
            'Queue "test-queue" purged successfully. All messages removed',
            expect.any(Number)
        );
    });

    it('should notify binding creation with routing key', () => {
        const { result } = renderHook(() => useWriteOperationNotifications());

        result.current.notifyBindingCreated('source-exchange', 'dest-queue', 'queue', 'routing.key');

        expect(mockSuccess).toHaveBeenCalledWith(
            'Binding "source-exchange → dest-queue (queue) (routing key: "routing.key")" created successfully',
            expect.any(Number)
        );
    });

    it('should notify successful message publishing with routing', () => {
        const { result } = renderHook(() => useWriteOperationNotifications());

        result.current.notifyMessagePublished('exchange', 'test-exchange', true, 'routing.key');

        expect(mockSuccess).toHaveBeenCalledWith(
            'Message published to exchange "test-exchange" with routing key "routing.key" and routed successfully',
            expect.any(Number)
        );
    });

    it('should notify message publishing without routing as warning', () => {
        const { result } = renderHook(() => useWriteOperationNotifications());

        result.current.notifyMessagePublished('exchange', 'test-exchange', false);

        expect(mockWarning).toHaveBeenCalledWith(
            'Message published to exchange "test-exchange" but was not routed to any queue',
            expect.any(Number)
        );
    });

    it('should notify message retrieval with acknowledgment mode', () => {
        const { result } = renderHook(() => useWriteOperationNotifications());

        result.current.notifyMessagesRetrieved('test-queue', 5, 'ack_requeue_false');

        expect(mockSuccess).toHaveBeenCalledWith(
            'Retrieved 5 messages from queue "test-queue" (acknowledged and removed)',
            expect.any(Number)
        );
    });

    it('should notify empty queue as info', () => {
        const { result } = renderHook(() => useWriteOperationNotifications());

        result.current.notifyMessagesRetrieved('test-queue', 0, 'ack_requeue_true');

        expect(mockInfo).toHaveBeenCalledWith(
            'Queue "test-queue" is empty - no messages available',
            expect.any(Number)
        );
    });

    it('should notify operation errors with proper formatting', () => {
        const { result } = renderHook(() => useWriteOperationNotifications());

        const errorResponse = {
            response: {
                status: 409,
                data: { message: 'Resource already exists' }
            }
        };

        result.current.notifyOperationError('create', 'Exchange', 'test-exchange', errorResponse);

        expect(mockError).toHaveBeenCalledWith(
            'Exchange "test-exchange" already exists',
            expect.any(Number)
        );
    });

    it('should handle different HTTP status codes appropriately', () => {
        const { result } = renderHook(() => useWriteOperationNotifications());

        // Test 403 Forbidden
        const forbiddenError = {
            response: { status: 403 }
        };

        result.current.notifyOperationError('delete', 'Queue', 'test-queue', forbiddenError);

        expect(mockError).toHaveBeenCalledWith(
            'You do not have permission to delete queues on this cluster',
            expect.any(Number)
        );
    });

    it('should provide loading operation notifications', () => {
        const { result } = renderHook(() => useWriteOperationNotifications());

        result.current.notifyLoadingOperation('Creating', 'Exchange', 'test-exchange');

        expect(mockInfo).toHaveBeenCalledWith(
            'Creating exchange "test-exchange"...',
            2000
        );
    });
});