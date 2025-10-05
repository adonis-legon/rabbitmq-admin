import { describe, it, expect } from 'vitest';
import {
    AuditOperationType,
    AuditOperationStatus,
    AuditRecord,
    AuditFilterRequest,
    AuditRecordsPagedResponse,
    PagedAuditRecords
} from '../audit';

describe('Audit Types', () => {
    describe('AuditOperationType enum', () => {
        it('should have all expected operation types', () => {
            expect(AuditOperationType.CREATE_EXCHANGE).toBe('CREATE_EXCHANGE');
            expect(AuditOperationType.DELETE_EXCHANGE).toBe('DELETE_EXCHANGE');
            expect(AuditOperationType.CREATE_QUEUE).toBe('CREATE_QUEUE');
            expect(AuditOperationType.DELETE_QUEUE).toBe('DELETE_QUEUE');
            expect(AuditOperationType.PURGE_QUEUE).toBe('PURGE_QUEUE');
            expect(AuditOperationType.CREATE_BINDING_EXCHANGE).toBe('CREATE_BINDING_EXCHANGE');
            expect(AuditOperationType.CREATE_BINDING_QUEUE).toBe('CREATE_BINDING_QUEUE');
            expect(AuditOperationType.DELETE_BINDING).toBe('DELETE_BINDING');
            expect(AuditOperationType.PUBLISH_MESSAGE_EXCHANGE).toBe('PUBLISH_MESSAGE_EXCHANGE');
            expect(AuditOperationType.PUBLISH_MESSAGE_QUEUE).toBe('PUBLISH_MESSAGE_QUEUE');
            expect(AuditOperationType.MOVE_MESSAGES_QUEUE).toBe('MOVE_MESSAGES_QUEUE');
        });

        it('should have exactly 11 operation types', () => {
            const operationTypes = Object.values(AuditOperationType);
            expect(operationTypes).toHaveLength(11);
        });
    });

    describe('AuditOperationStatus enum', () => {
        it('should have all expected status values', () => {
            expect(AuditOperationStatus.SUCCESS).toBe('SUCCESS');
            expect(AuditOperationStatus.FAILURE).toBe('FAILURE');
            expect(AuditOperationStatus.PARTIAL).toBe('PARTIAL');
        });

        it('should have exactly 3 status values', () => {
            const statusValues = Object.values(AuditOperationStatus);
            expect(statusValues).toHaveLength(3);
        });
    });

    describe('AuditRecord interface', () => {
        it('should accept a valid audit record object', () => {
            const auditRecord: AuditRecord = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                username: 'testuser',
                clusterName: 'test-cluster',
                operationType: AuditOperationType.CREATE_EXCHANGE,
                resourceType: 'exchange',
                resourceName: 'test-exchange',
                status: AuditOperationStatus.SUCCESS,
                timestamp: '2023-10-01T12:00:00.000Z'
            };

            expect(auditRecord.id).toBe('123e4567-e89b-12d3-a456-426614174000');
            expect(auditRecord.username).toBe('testuser');
            expect(auditRecord.operationType).toBe(AuditOperationType.CREATE_EXCHANGE);
            expect(auditRecord.status).toBe(AuditOperationStatus.SUCCESS);
        });

        it('should accept optional fields', () => {
            const auditRecord: AuditRecord = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                username: 'testuser',
                clusterName: 'test-cluster',
                operationType: AuditOperationType.DELETE_QUEUE,
                resourceType: 'queue',
                resourceName: 'test-queue',
                status: AuditOperationStatus.FAILURE,
                timestamp: '2023-10-01T12:00:00.000Z',
                resourceDetails: { durable: true, autoDelete: false },
                errorMessage: 'Queue not found',
                clientIp: '192.168.1.100',
                userAgent: 'Mozilla/5.0',
                createdAt: '2023-10-01T12:00:01.000Z'
            };

            expect(auditRecord.resourceDetails).toEqual({ durable: true, autoDelete: false });
            expect(auditRecord.errorMessage).toBe('Queue not found');
            expect(auditRecord.clientIp).toBe('192.168.1.100');
        });
    });

    describe('AuditFilterRequest interface', () => {
        it('should accept an empty filter request', () => {
            const filterRequest: AuditFilterRequest = {};
            expect(filterRequest).toEqual({});
        });

        it('should accept a filter request with all fields', () => {
            const filterRequest: AuditFilterRequest = {
                username: 'testuser',
                clusterName: 'test-cluster',
                operationType: AuditOperationType.CREATE_EXCHANGE,
                status: AuditOperationStatus.SUCCESS,
                resourceName: 'test-exchange',
                resourceType: 'exchange',
                startTime: '2023-10-01T00:00:00.000Z',
                endTime: '2023-10-01T23:59:59.999Z'
            };

            expect(filterRequest.username).toBe('testuser');
            expect(filterRequest.operationType).toBe(AuditOperationType.CREATE_EXCHANGE);
            expect(filterRequest.status).toBe(AuditOperationStatus.SUCCESS);
        });

        it('should accept partial filter requests', () => {
            const filterRequest: AuditFilterRequest = {
                username: 'testuser',
                startTime: '2023-10-01T00:00:00.000Z'
            };

            expect(filterRequest.username).toBe('testuser');
            expect(filterRequest.startTime).toBe('2023-10-01T00:00:00.000Z');
            expect(filterRequest.clusterName).toBeUndefined();
        });
    });

    describe('AuditRecordsPagedResponse interface', () => {
        it('should accept a valid paged response', () => {
            const pagedResponse: AuditRecordsPagedResponse = {
                items: [
                    {
                        id: '123e4567-e89b-12d3-a456-426614174000',
                        username: 'testuser',
                        clusterName: 'test-cluster',
                        operationType: AuditOperationType.CREATE_EXCHANGE,
                        resourceType: 'exchange',
                        resourceName: 'test-exchange',
                        status: AuditOperationStatus.SUCCESS,
                        timestamp: '2023-10-01T12:00:00.000Z'
                    }
                ],
                page: 0,
                pageSize: 50,
                totalItems: 1,
                totalPages: 1,
                hasNext: false,
                hasPrevious: false
            };

            expect(pagedResponse.items).toHaveLength(1);
            expect(pagedResponse.page).toBe(0);
            expect(pagedResponse.totalItems).toBe(1);
        });

        it('should accept empty items array', () => {
            const pagedResponse: AuditRecordsPagedResponse = {
                items: [],
                page: 0,
                pageSize: 50,
                totalItems: 0,
                totalPages: 0,
                hasNext: false,
                hasPrevious: false
            };

            expect(pagedResponse.items).toHaveLength(0);
            expect(pagedResponse.totalItems).toBe(0);
        });
    });

    describe('PagedAuditRecords type alias', () => {
        it('should be compatible with generic PagedResponse', () => {
            const pagedAuditRecords: PagedAuditRecords = {
                items: [
                    {
                        id: '123e4567-e89b-12d3-a456-426614174000',
                        username: 'testuser',
                        clusterName: 'test-cluster',
                        operationType: AuditOperationType.CREATE_EXCHANGE,
                        resourceType: 'exchange',
                        resourceName: 'test-exchange',
                        status: AuditOperationStatus.SUCCESS,
                        timestamp: '2023-10-01T12:00:00.000Z'
                    }
                ],
                page: 0,
                pageSize: 50,
                totalItems: 1,
                totalPages: 1,
                hasNext: false,
                hasPrevious: false
            };

            expect(pagedAuditRecords.items[0].operationType).toBe(AuditOperationType.CREATE_EXCHANGE);
        });
    });
});