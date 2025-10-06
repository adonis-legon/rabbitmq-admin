import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { AxiosResponse } from 'axios';
import { auditApi } from '../auditApi';
import apiClient from '../apiClient';
import {
    AuditRecord,
    AuditFilterRequest,
    AuditOperationType,
    AuditOperationStatus,
    PagedResponse
} from '../../../types/audit';

// Mock the apiClient
vi.mock('../apiClient');

const mockApiClient = vi.mocked(apiClient);

// Helper function to create mock Axios responses
const createMockResponse = <T>(data: T): AxiosResponse<T> => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any
});

describe('auditApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterAll(() => {
        vi.restoreAllMocks();
    });

    describe('getAuditRecords', () => {
        const mockAuditRecords: AuditRecord[] = [
            {
                id: '123e4567-e89b-12d3-a456-426614174000',
                username: 'admin',
                clusterName: 'test-cluster',
                operationType: AuditOperationType.CREATE_EXCHANGE,
                resourceType: 'exchange',
                resourceName: 'test-exchange',
                resourceDetails: {
                    type: 'direct',
                    durable: true,
                    autoDelete: false
                },
                status: AuditOperationStatus.SUCCESS,
                timestamp: '2023-10-01T12:00:00Z',
                clientIp: '192.168.1.100'
            },
            {
                id: '123e4567-e89b-12d3-a456-426614174001',
                username: 'user1',
                clusterName: 'test-cluster',
                operationType: AuditOperationType.DELETE_QUEUE,
                resourceType: 'queue',
                resourceName: 'test-queue',
                status: AuditOperationStatus.FAILURE,
                errorMessage: 'Queue not found',
                timestamp: '2023-10-01T11:30:00Z',
                clientIp: '192.168.1.101'
            }
        ];

        const mockPagedResponse: PagedResponse<AuditRecord> = {
            items: mockAuditRecords,
            page: 0,
            pageSize: 50,
            totalItems: 2,
            totalPages: 1,
            hasNext: false,
            hasPrevious: false
        };

        it('should fetch audit records with default parameters', async () => {
            mockApiClient.get.mockResolvedValue(createMockResponse(mockPagedResponse));

            const result = await auditApi.getAuditRecords();

            expect(mockApiClient.get).toHaveBeenCalledWith(
                '/audits?page=0&pageSize=50&sortBy=timestamp&sortDirection=desc'
            );
            expect(result).toEqual(mockPagedResponse);
        });

        it('should fetch audit records with custom pagination parameters', async () => {
            mockApiClient.get.mockResolvedValue(createMockResponse(mockPagedResponse));

            const result = await auditApi.getAuditRecords({}, 2, 25, 'username', 'asc');

            expect(mockApiClient.get).toHaveBeenCalledWith(
                '/audits?page=2&pageSize=25&sortBy=username&sortDirection=asc'
            );
            expect(result).toEqual(mockPagedResponse);
        });

        it('should fetch audit records with all filter parameters', async () => {
            const filterRequest: AuditFilterRequest = {
                username: 'admin',
                clusterName: 'test-cluster',
                operationType: AuditOperationType.CREATE_EXCHANGE,
                status: AuditOperationStatus.SUCCESS,
                resourceName: 'test-exchange',
                resourceType: 'exchange',
                startTime: '2023-10-01T00:00:00Z',
                endTime: '2023-10-01T23:59:59Z'
            };

            mockApiClient.get.mockResolvedValue(createMockResponse(mockPagedResponse));

            const result = await auditApi.getAuditRecords(filterRequest);

            const expectedUrl = '/audits?page=0&pageSize=50&sortBy=timestamp&sortDirection=desc' +
                '&username=admin&clusterName=test-cluster&operationType=CREATE_EXCHANGE' +
                '&status=SUCCESS&resourceName=test-exchange&resourceType=exchange' +
                '&startTime=2023-10-01T00%3A00%3A00Z&endTime=2023-10-01T23%3A59%3A59Z';

            expect(mockApiClient.get).toHaveBeenCalledWith(expectedUrl);
            expect(result).toEqual(mockPagedResponse);
        });

        it('should fetch audit records with partial filter parameters', async () => {
            const filterRequest: AuditFilterRequest = {
                username: 'admin',
                operationType: AuditOperationType.DELETE_QUEUE,
                startTime: '2023-10-01T00:00:00Z'
            };

            mockApiClient.get.mockResolvedValue(createMockResponse(mockPagedResponse));

            const result = await auditApi.getAuditRecords(filterRequest, 1, 100);

            const expectedUrl = '/audits?page=1&pageSize=100&sortBy=timestamp&sortDirection=desc' +
                '&username=admin&operationType=DELETE_QUEUE&startTime=2023-10-01T00%3A00%3A00Z';

            expect(mockApiClient.get).toHaveBeenCalledWith(expectedUrl);
            expect(result).toEqual(mockPagedResponse);
        });

        it('should handle empty filter request', async () => {
            mockApiClient.get.mockResolvedValue(createMockResponse(mockPagedResponse));

            const result = await auditApi.getAuditRecords({});

            expect(mockApiClient.get).toHaveBeenCalledWith(
                '/audits?page=0&pageSize=50&sortBy=timestamp&sortDirection=desc'
            );
            expect(result).toEqual(mockPagedResponse);
        });

        it('should handle special characters in filter parameters', async () => {
            const filterRequest: AuditFilterRequest = {
                username: 'user@domain.com',
                clusterName: 'cluster with spaces',
                resourceName: 'queue/with/slashes'
            };

            mockApiClient.get.mockResolvedValue(createMockResponse(mockPagedResponse));

            await auditApi.getAuditRecords(filterRequest);

            const expectedUrl = '/audits?page=0&pageSize=50&sortBy=timestamp&sortDirection=desc' +
                '&username=user%40domain.com&clusterName=cluster+with+spaces&resourceName=queue%2Fwith%2Fslashes';

            expect(mockApiClient.get).toHaveBeenCalledWith(expectedUrl);
        });

        describe('Error Handling', () => {
            it('should handle 403 Forbidden error with specific message', async () => {
                const error = new Error('Request failed with status code 403');
                mockApiClient.get.mockRejectedValue(error);

                await expect(auditApi.getAuditRecords()).rejects.toThrow(
                    'You do not have permission to access audit records. Administrator role is required.'
                );
            });

            it('should handle 401 Unauthorized error with specific message', async () => {
                const error = new Error('Request failed with status code 401');
                mockApiClient.get.mockRejectedValue(error);

                await expect(auditApi.getAuditRecords()).rejects.toThrow(
                    'Authentication required to access audit records.'
                );
            });

            it('should handle 404 Not Found error with specific message', async () => {
                const error = new Error('Request failed with status code 404');
                mockApiClient.get.mockRejectedValue(error);

                await expect(auditApi.getAuditRecords()).rejects.toThrow(
                    'Audit service is not available or not configured.'
                );
            });

            it('should handle 500 Internal Server Error with specific message', async () => {
                const error = new Error('Request failed with status code 500');
                mockApiClient.get.mockRejectedValue(error);

                await expect(auditApi.getAuditRecords()).rejects.toThrow(
                    'Server error occurred while fetching audit records. Please try again later.'
                );
            });

            it('should handle generic API errors', async () => {
                const error = new Error('Network timeout');
                mockApiClient.get.mockRejectedValue(error);

                await expect(auditApi.getAuditRecords()).rejects.toThrow(
                    'Failed to fetch audit records: Network timeout'
                );
            });

            it('should handle non-Error exceptions', async () => {
                const error = 'String error';
                mockApiClient.get.mockRejectedValue(error);

                await expect(auditApi.getAuditRecords()).rejects.toThrow(
                    'An unexpected error occurred while fetching audit records.'
                );
            });

            it('should handle null/undefined errors', async () => {
                mockApiClient.get.mockRejectedValue(null);

                await expect(auditApi.getAuditRecords()).rejects.toThrow(
                    'An unexpected error occurred while fetching audit records.'
                );
            });
        });

        describe('Parameter Validation', () => {
            it('should handle negative page numbers', async () => {
                mockApiClient.get.mockResolvedValue(createMockResponse(mockPagedResponse));

                await auditApi.getAuditRecords({}, -1, 50);

                expect(mockApiClient.get).toHaveBeenCalledWith(
                    '/audits?page=-1&pageSize=50&sortBy=timestamp&sortDirection=desc'
                );
            });

            it('should handle zero page size', async () => {
                mockApiClient.get.mockResolvedValue(createMockResponse(mockPagedResponse));

                await auditApi.getAuditRecords({}, 0, 0);

                expect(mockApiClient.get).toHaveBeenCalledWith(
                    '/audits?page=0&pageSize=0&sortBy=timestamp&sortDirection=desc'
                );
            });

            it('should handle empty string filter values', async () => {
                const filterRequest: AuditFilterRequest = {
                    username: '',
                    clusterName: '',
                    resourceName: '',
                    resourceType: ''
                };

                mockApiClient.get.mockResolvedValue(createMockResponse(mockPagedResponse));

                await auditApi.getAuditRecords(filterRequest);

                // Empty strings should still be included in the URL
                const expectedUrl = '/audits?page=0&pageSize=50&sortBy=timestamp&sortDirection=desc' +
                    '&username=&clusterName=&resourceName=&resourceType=';

                expect(mockApiClient.get).toHaveBeenCalledWith(expectedUrl);
            });

            it('should handle undefined filter values correctly', async () => {
                const filterRequest: AuditFilterRequest = {
                    username: 'admin',
                    clusterName: undefined,
                    operationType: AuditOperationType.CREATE_QUEUE,
                    status: undefined,
                    resourceName: undefined
                };

                mockApiClient.get.mockResolvedValue(createMockResponse(mockPagedResponse));

                await auditApi.getAuditRecords(filterRequest);

                // Only defined values should be included in the URL
                const expectedUrl = '/audits?page=0&pageSize=50&sortBy=timestamp&sortDirection=desc' +
                    '&username=admin&operationType=CREATE_QUEUE';

                expect(mockApiClient.get).toHaveBeenCalledWith(expectedUrl);
            });
        });

        describe('Response Data Integrity', () => {
            it('should return the exact response data from the API', async () => {
                const customResponse: PagedResponse<AuditRecord> = {
                    items: [
                        {
                            id: 'custom-id',
                            username: 'custom-user',
                            clusterName: 'custom-cluster',
                            operationType: AuditOperationType.PURGE_QUEUE,
                            resourceType: 'queue',
                            resourceName: 'custom-queue',
                            status: AuditOperationStatus.PARTIAL,
                            timestamp: '2023-12-01T10:00:00Z',
                            errorMessage: 'Partial failure occurred'
                        }
                    ],
                    page: 5,
                    pageSize: 10,
                    totalItems: 100,
                    totalPages: 10,
                    hasNext: true,
                    hasPrevious: true
                };

                mockApiClient.get.mockResolvedValue(createMockResponse(customResponse));

                const result = await auditApi.getAuditRecords();

                expect(result).toEqual(customResponse);
                expect(result.items).toHaveLength(1);
                expect(result.items[0].operationType).toBe(AuditOperationType.PURGE_QUEUE);
                expect(result.items[0].status).toBe(AuditOperationStatus.PARTIAL);
            });

            it('should handle empty audit records response', async () => {
                const emptyResponse: PagedResponse<AuditRecord> = {
                    items: [],
                    page: 0,
                    pageSize: 50,
                    totalItems: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrevious: false
                };

                mockApiClient.get.mockResolvedValue(createMockResponse(emptyResponse));

                const result = await auditApi.getAuditRecords();

                expect(result).toEqual(emptyResponse);
                expect(result.items).toHaveLength(0);
                expect(result.totalItems).toBe(0);
            });
        });

        describe('URL Construction', () => {
            it('should properly encode ISO 8601 timestamps', async () => {
                const filterRequest: AuditFilterRequest = {
                    startTime: '2023-10-01T12:30:45.123Z',
                    endTime: '2023-10-02T08:15:30.456Z'
                };

                mockApiClient.get.mockResolvedValue(createMockResponse(mockPagedResponse));

                await auditApi.getAuditRecords(filterRequest);

                const expectedUrl = '/audits?page=0&pageSize=50&sortBy=timestamp&sortDirection=desc' +
                    '&startTime=2023-10-01T12%3A30%3A45.123Z&endTime=2023-10-02T08%3A15%3A30.456Z';

                expect(mockApiClient.get).toHaveBeenCalledWith(expectedUrl);
            });

            it('should handle all audit operation types', async () => {
                const operationTypes = Object.values(AuditOperationType);

                for (const operationType of operationTypes) {
                    mockApiClient.get.mockResolvedValue(createMockResponse(mockPagedResponse));

                    await auditApi.getAuditRecords({ operationType });

                    const expectedUrl = `/audits?page=0&pageSize=50&sortBy=timestamp&sortDirection=desc&operationType=${operationType}`;
                    expect(mockApiClient.get).toHaveBeenCalledWith(expectedUrl);
                }
            });

            it('should handle all audit operation statuses', async () => {
                const statuses = Object.values(AuditOperationStatus);

                for (const status of statuses) {
                    mockApiClient.get.mockResolvedValue(createMockResponse(mockPagedResponse));

                    await auditApi.getAuditRecords({ status });

                    const expectedUrl = `/audits?page=0&pageSize=50&sortBy=timestamp&sortDirection=desc&status=${status}`;
                    expect(mockApiClient.get).toHaveBeenCalledWith(expectedUrl);
                }
            });
        });
    });
});