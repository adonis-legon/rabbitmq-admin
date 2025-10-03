import { describe, it, expect } from 'vitest';

// Test importing from the main types module
import {
    AuditOperationType,
    AuditOperationStatus,
    AuditRecord,
    AuditFilterRequest,
    AuditRecordsPagedResponse,
    PagedAuditRecords
} from '../index';

describe('Audit Types Exports', () => {
    it('should export AuditOperationType from main types module', () => {
        expect(AuditOperationType.CREATE_EXCHANGE).toBe('CREATE_EXCHANGE');
        expect(typeof AuditOperationType).toBe('object');
    });

    it('should export AuditOperationStatus from main types module', () => {
        expect(AuditOperationStatus.SUCCESS).toBe('SUCCESS');
        expect(typeof AuditOperationStatus).toBe('object');
    });

    it('should allow creating AuditRecord objects', () => {
        const record: AuditRecord = {
            id: 'test-id',
            username: 'testuser',
            clusterName: 'test-cluster',
            operationType: AuditOperationType.CREATE_QUEUE,
            resourceType: 'queue',
            resourceName: 'test-queue',
            status: AuditOperationStatus.SUCCESS,
            timestamp: '2023-10-01T12:00:00.000Z'
        };

        expect(record.operationType).toBe(AuditOperationType.CREATE_QUEUE);
    });

    it('should allow creating AuditFilterRequest objects', () => {
        const filter: AuditFilterRequest = {
            username: 'testuser',
            operationType: AuditOperationType.DELETE_EXCHANGE
        };

        expect(filter.operationType).toBe(AuditOperationType.DELETE_EXCHANGE);
    });

    it('should allow creating AuditRecordsPagedResponse objects', () => {
        const response: AuditRecordsPagedResponse = {
            items: [],
            page: 0,
            pageSize: 50,
            totalItems: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false
        };

        expect(response.items).toEqual([]);
    });

    it('should allow using PagedAuditRecords type alias', () => {
        const response: PagedAuditRecords = {
            items: [],
            page: 0,
            pageSize: 50,
            totalItems: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false
        };

        expect(response.items).toEqual([]);
    });
});