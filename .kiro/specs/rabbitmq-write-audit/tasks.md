# Implementation Plan

- [x] 1. Create database schema and migration

  - Create Flyway migration V5\_\_Audit_Records_Schema.sql with audit_records table, indexes, and constraints
  - Define proper foreign key relationships to users and cluster_connections tables
  - Add retention policy configuration columns
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 2. Implement backend data models and enums

  - Create AuditOperationType enum with all write operation types (CREATE_EXCHANGE, DELETE_EXCHANGE, etc.)
  - Create AuditOperationStatus enum (SUCCESS, FAILURE, PARTIAL)
  - Implement AuditRecord JPA entity with proper annotations, relationships, and validation
  - _Requirements: 1.1, 1.2, 7.1_

- [x] 3. Create repository layer for audit data access

  - Implement AuditRecordRepository interface extending JpaRepository
  - Add custom query methods for filtering by user, cluster, operation type, date range
  - Create complex filtering query method with multiple optional parameters
  - Write unit tests for repository query methods
  - _Requirements: 3.4, 4.3, 4.4_

- [x] 4. Implement audit service layer

  - Create WriteAuditService with conditional bean creation based on configuration
  - Implement auditWriteOperation method to create and persist audit records
  - Add getAuditRecords method with filtering and pagination support
  - Integrate with existing ResourceAuditService for dual logging (file + database)
  - Write comprehensive unit tests for service methods
  - _Requirements: 1.1, 1.3, 2.1, 2.2, 6.1, 6.2_

- [x] 5. Create DTOs for audit API

  - Implement AuditRecordDto with proper field mapping and validation
  - Create AuditFilterRequest DTO with validation annotations
  - Add proper JSON serialization/deserialization annotations
  - Write unit tests for DTO validation and serialization
  - _Requirements: 4.1, 4.3_

- [x] 6. Implement audit controller with admin security

  - Create AuditController with @PreAuthorize("hasRole('ADMINISTRATOR')")
  - Implement getAuditRecords endpoint with filtering, pagination, and sorting
  - Add proper request validation and error handling
  - Write controller unit tests and integration tests
  - _Requirements: 4.1, 4.5, 5.3_

- [x] 7. Create aspect for intercepting write operations

  - Implement WriteOperationAuditAspect with conditional creation based on configuration
  - Create @AuditWriteOperation annotation for marking methods to audit
  - Add aspect logic to capture operation details, success/failure status, and timing
  - Ensure aspect doesn't interfere with original operation execution
  - Write unit tests for aspect interception logic
  - _Requirements: 1.1, 1.4, 6.1, 6.2, 6.3_

- [x] 8. Annotate existing write operation methods

  - Add @AuditWriteOperation annotations to all RabbitMQ write operations in controllers/services
  - Include create/delete exchange, create/delete queue, create/delete binding operations
  - Add annotations for publish message, purge queue, and move messages operations
  - Ensure all operation types from requirements are covered
  - _Requirements: 1.2, 1.3_

- [x] 9. Add audit configuration properties

  - Extend application.yml with app.audit.write-operations configuration section
  - Add enabled, retention-days, batch-size, and async-processing properties
  - Create AuditConfigurationProperties class with @ConfigurationProperties
  - Add validation for configuration values
  - Write tests for configuration property binding
  - _Requirements: 2.1, 2.3_

- [x] 10. Create frontend TypeScript types and interfaces

  - Define AuditRecord interface matching backend DTO structure
  - Create AuditOperationType and AuditOperationStatus enums
  - Implement AuditFilterRequest interface for API calls
  - Add PagedResponse type specialization for audit records
  - _Requirements: 4.1, 4.3, 5.1_

- [x] 11. Implement audit API service

  - Create auditApi.ts following existing API service patterns
  - Implement getAuditRecords function with filtering and pagination parameters
  - Add proper error handling and response type definitions
  - Include authentication token handling
  - Write unit tests for API service methods
  - _Requirements: 4.1, 5.3_

- [x] 12. Create useAuditRecords hook

  - Implement custom hook following existing resource hook patterns (useQueues, useExchanges)
  - Add state management for audit records, loading, error states
  - Include filtering, pagination, and sorting functionality
  - Add auto-refresh capability with configurable intervals
  - Write comprehensive hook unit tests
  - _Requirements: 4.1, 4.3, 4.4_

- [x] 13. Implement AuditFilters component

  - Create filter component with date range picker, user filter, cluster filter
  - Add operation type dropdown and resource name search field
  - Follow existing SearchAndFilter component patterns and styling
  - Include filter reset and apply functionality
  - Write component unit tests with user interaction scenarios
  - _Requirements: 4.2, 4.3, 5.1_

- [x] 14. Create AuditRecordsList component

  - Implement table component using existing ResourceTable patterns
  - Add columns for timestamp (local time), user, cluster, operation, resource, status
  - Include sorting functionality for all columns
  - Add row expansion for detailed operation information
  - Implement proper loading states and error handling
  - Write component unit tests and integration tests
  - _Requirements: 4.1, 4.2, 5.1_

- [x] 15. Implement main AuditPage component

  - Create main audit page following existing resource page patterns (QueuesPage, ExchangesPage)
  - Integrate AuditFilters and AuditRecordsList components
  - Add proper page title, breadcrumbs, and layout structure
  - Include admin role check and appropriate error messaging
  - Implement responsive design following existing patterns
  - Write page component tests
  - _Requirements: 4.1, 4.5, 5.1_

- [x] 16. Add audit navigation to navbar

  - Update navigation configuration to include Audits option under Management group
  - Add appropriate audit/history icon (HistoryIcon or similar)
  - Ensure navigation item is only visible to ADMINISTRATOR role users
  - Update routing configuration to include audit page route
  - Test navigation integration and role-based visibility
  - _Requirements: 4.5, 5.1_

- [x] 17. Implement timestamp localization

  - Add utility functions to convert UTC timestamps to user's local timezone
  - Update AuditRecordsList to display timestamps in local time by default
  - Add timezone indicator or toggle for UTC/local time display
  - Ensure consistent date/time formatting across the audit interface
  - Write tests for timestamp conversion utilities
  - _Requirements: 4.2_

- [x] 18. Add comprehensive error handling

  - Implement proper error boundaries for audit components
  - Add user-friendly error messages for API failures and permission errors
  - Include fallback UI states for when audit data is unavailable
  - Add validation error handling for filter inputs
  - Write error handling integration tests
  - _Requirements: 4.5, 6.2_

- [x] 19. Create integration tests for audit flow

  - Write end-to-end tests covering complete audit flow from write operation to UI display
  - Test audit record creation, storage, and retrieval
  - Verify filtering, pagination, and sorting functionality
  - Test admin role enforcement and security boundaries
  - Include performance tests for audit operations
  - _Requirements: 1.1, 4.1, 4.5, 6.3, 7.2_

- [x] 20. Add audit configuration validation and documentation
  - Create configuration validation tests for all audit properties
  - Add proper error messages for misconfiguration scenarios
  - Update application documentation with audit feature configuration
  - Include examples of audit configuration for different environments
  - Test configuration changes without application restart
  - _Requirements: 2.1, 2.3_
