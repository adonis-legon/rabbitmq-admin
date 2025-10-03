import apiClient from './apiClient';
import {
    AuditRecord,
    AuditFilterRequest,
    PagedResponse
} from '../../types/audit';

/**
 * API service for audit-related operations.
 * Provides methods to fetch and filter audit records with proper error handling.
 */
export const auditApi = {
    /**
     * Retrieves audit records with optional filtering and pagination.
     * 
     * @param filterRequest - Optional filter parameters for querying audit records
     * @param page - Page number (0-based, defaults to 0)
     * @param pageSize - Number of items per page (defaults to 50)
     * @param sortBy - Field to sort by (defaults to 'timestamp')
     * @param sortDirection - Sort direction: 'asc' or 'desc' (defaults to 'desc')
     * @returns Promise resolving to paginated audit records
     * @throws Error with descriptive message if the request fails
     */
    getAuditRecords: async (
        filterRequest: AuditFilterRequest = {},
        page: number = 0,
        pageSize: number = 50,
        sortBy: string = 'timestamp',
        sortDirection: 'asc' | 'desc' = 'desc'
    ): Promise<PagedResponse<AuditRecord>> => {
        try {
            const searchParams = new URLSearchParams();

            // Add pagination parameters
            searchParams.append('page', page.toString());
            searchParams.append('pageSize', pageSize.toString());
            searchParams.append('sortBy', sortBy);
            searchParams.append('sortDirection', sortDirection);

            // Add filter parameters if provided (including empty strings)
            if (filterRequest.username !== undefined) {
                searchParams.append('username', filterRequest.username);
            }
            if (filterRequest.clusterName !== undefined) {
                searchParams.append('clusterName', filterRequest.clusterName);
            }
            if (filterRequest.operationType !== undefined) {
                searchParams.append('operationType', filterRequest.operationType);
            }
            if (filterRequest.status !== undefined) {
                searchParams.append('status', filterRequest.status);
            }
            if (filterRequest.resourceName !== undefined) {
                searchParams.append('resourceName', filterRequest.resourceName);
            }
            if (filterRequest.resourceType !== undefined) {
                searchParams.append('resourceType', filterRequest.resourceType);
            }
            if (filterRequest.startTime !== undefined) {
                searchParams.append('startTime', filterRequest.startTime);
            }
            if (filterRequest.endTime !== undefined) {
                searchParams.append('endTime', filterRequest.endTime);
            }

            const response = await apiClient.get<PagedResponse<AuditRecord>>(
                `/audit/records?${searchParams.toString()}`
            );

            return response.data;
        } catch (error) {
            // Provide specific error messages based on common scenarios
            if (error instanceof Error) {
                if (error.message.includes('403')) {
                    throw new Error('You do not have permission to access audit records. Administrator role is required.');
                }
                if (error.message.includes('401')) {
                    throw new Error('Authentication required to access audit records.');
                }
                if (error.message.includes('404')) {
                    throw new Error('Audit service is not available or not configured.');
                }
                if (error.message.includes('500')) {
                    throw new Error('Server error occurred while fetching audit records. Please try again later.');
                }
                throw new Error(`Failed to fetch audit records: ${error.message}`);
            }
            throw new Error('An unexpected error occurred while fetching audit records.');
        }
    }
};