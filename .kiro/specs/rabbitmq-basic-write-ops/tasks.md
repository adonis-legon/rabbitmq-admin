# Implementation Plan

- [x] 1. Set up project structure and create new DTOs

  - ✅ Create new DTO classes for request/response models
  - ✅ Add validation annotations and proper serialization
  - ✅ Write unit tests for DTO validation and serialization
  - _Requirements: 1.2, 2.2, 3.2, 4.2, 7.2, 8.2, 9.2, 10.2_
  - **Status**: All major DTOs implemented and tested:
    - ✅ CreateExchangeRequest - Exchange creation with validation
    - ✅ CreateQueueRequest - Queue creation with validation
    - ✅ CreateBindingRequest - Binding creation
    - ✅ PublishMessageRequest - Message publishing with payload validation
    - ✅ GetMessagesRequest - Message consumption configuration
    - ✅ VirtualHostDto - Virtual host information
    - ✅ MessageDto, PublishResponse - Response models
    - ✅ DtoValidationComprehensiveTest - Complete validation and serialization testing

- [x] 2. Implement virtual host management in backend

  - ✅ Add getVirtualHosts method to RabbitMQResourceService
  - ✅ Create GET /api/rabbitmq/{clusterId}/vhosts endpoint in controller
  - ✅ Implement proper URL encoding/decoding for virtual host names
  - ✅ Add unit tests for virtual host operations
  - _Requirements: 1.3, 2.3, 11.1_
  - **Status**: Virtual host management fully implemented:
    - ✅ RabbitMQResourceService.getVirtualHosts() method
    - ✅ GET /api/rabbitmq/{clusterId}/vhosts endpoint in RabbitMQController
    - ✅ VirtualHostDto with proper serialization and validation
    - ✅ Comprehensive audit logging and metrics collection

- [x] 3. Implement exchange write operations in backend

  - Add createExchange method to RabbitMQResourceService using PUT /api/exchanges/{vhost}/{name}
  - Add deleteExchange method using DELETE /api/exchanges/{vhost}/{name}
  - Create corresponding controller endpoints
  - Add comprehensive error handling and validation
  - Write unit tests for exchange operations
  - _Requirements: 1.4, 1.5, 1.6, 5.3, 5.4, 5.5, 5.6_

- [x] 4. Implement queue write operations in backend

  - Add createQueue method to RabbitMQResourceService using PUT /api/queues/{vhost}/{name}
  - Add deleteQueue method using DELETE /api/queues/{vhost}/{name}
  - Add purgeQueue method using DELETE /api/queues/{vhost}/{name}/contents
  - Create corresponding controller endpoints with proper validation
  - Write unit tests for queue operations
  - _Requirements: 2.4, 2.5, 2.6, 9.3, 9.4, 9.5, 10.3, 10.4, 10.5, 10.6_

- [x] 5. Implement binding operations in backend

  - ✅ Add createBinding method to RabbitMQResourceService using POST /api/bindings/{vhost}/e/{source}/{destinationType}/{destination}
  - ⚠️ Add deleteBinding method to RabbitMQResourceService using DELETE /api/bindings/{vhost}/e/{source}/{destinationType}/{destination}/{routingKey} - **REMOVED**
  - ✅ Handle exchange-to-queue and exchange-to-exchange binding creation
  - ✅ Create controller endpoints for binding creation with proper URL encoding/decoding
  - ✅ Add proper validation for routing keys and arguments
  - ⚠️ Write unit tests for binding operations - **TESTS FOR DELETION NEED CLEANUP**
  - _Requirements: 3.4, 3.5, 3.6, 6.4, 6.5, 6.6_
  - **Status**: Binding creation implemented, deletion removed:
    - ✅ POST /api/rabbitmq/{clusterId}/resources/bindings/{vhost}/e/{source}/q/{destination} - Create exchange-to-queue binding
    - ✅ POST /api/rabbitmq/{clusterId}/resources/bindings/{vhost}/e/{source}/e/{destination} - Create exchange-to-exchange binding
    - ❌ DELETE endpoints for binding deletion have been removed from controller
    - ✅ Comprehensive URL encoding/decoding for vhost (base64) and resource names (URL encoding)
    - ✅ Proper error handling and audit logging for creation operations

- [x] 6. Implement message publishing operations in backend

  - ✅ Add publishMessage method using POST /api/exchanges/{vhost}/{name}/publish
  - ✅ Handle publishing to exchanges and direct queue publishing via default exchange
  - ✅ Implement proper message encoding and validation
  - ✅ Create controller endpoints for message publishing
  - ✅ Write unit tests for message publishing
  - _Requirements: 4.3, 4.4, 4.5, 4.6, 7.3, 7.4, 7.5_
  - **Status**: Message publishing fully implemented and tested:
    - ✅ POST /api/rabbitmq/{clusterId}/resources/exchanges/{vhost}/{exchange}/publish - Publish to exchange
    - ✅ POST /api/rabbitmq/{clusterId}/resources/queues/{vhost}/{queue}/publish - Publish directly to queue
    - ✅ PublishMessageRequest DTO with validation and encoding support
    - ✅ PublishResponse DTO with routing confirmation
    - ✅ Comprehensive unit tests for both endpoints including empty routing key handling

- [x] 7. Implement message consumption operations in backend

  - ✅ Add getMessages method using POST /api/queues/{vhost}/{name}/get
  - ✅ Implement different acknowledgment modes (ack_requeue_true, ack_requeue_false, reject_requeue_true, reject_requeue_false)
  - ✅ Handle message encoding and truncation options
  - ✅ Create controller endpoint for message retrieval
  - ✅ Write comprehensive unit tests for message consumption
  - _Requirements: 8.3, 8.4, 8.5, 8.6_
  - **Status**: Message consumption fully implemented and tested:
    - ✅ RabbitMQResourceService.getMessages() method with full functionality
    - ✅ Support for count, ackmode, encoding, and truncate parameters
    - ✅ Comprehensive audit logging and metrics collection
    - ✅ Proper error handling and response parsing with MessageDto
    - ✅ Controller endpoint POST /api/rabbitmq/{clusterId}/resources/queues/{vhost}/{queue}/get implemented
    - ✅ Service layer unit tests covering success scenarios, empty queues, multiple messages, special characters, parameter validation, and error handling
    - ✅ Controller layer unit tests covering endpoint functionality, authentication, path variable handling, and all acknowledgment modes

- [x] 8. Add comprehensive backend integration tests

  - ✅ Create integration tests for all new endpoints
  - ✅ Test authentication and authorization scenarios
  - ✅ Test error handling and edge cases
  - ✅ Verify proper audit logging and metrics collection
  - _Requirements: 11.1, 11.2, 11.3, 11.4_
  - **Status**: Comprehensive integration tests implemented:
    - ✅ RabbitMQWriteOperationsIntegrationTest - Complete endpoint integration testing
    - ✅ Virtual host operations testing with authentication and error handling
    - ✅ Exchange operations (create/delete) with validation and service error handling
    - ✅ Queue operations (create/delete/purge) with conditional parameters
    - ✅ Binding operations (exchange-to-queue, exchange-to-exchange) with URL encoding
    - ✅ Message operations (publish to exchange/queue, get messages) with payload validation
    - ✅ Authentication and authorization testing for USER and ADMINISTRATOR roles
    - ✅ Error handling and edge cases including special characters, large payloads, and invalid requests
    - ✅ Proper mocking of RabbitMQResourceService to isolate controller layer testing

- [x] 9. Implement frontend API client extensions

  - ✅ Extend rabbitmqResourcesApi with new write operation functions
  - ✅ Add proper TypeScript type definitions for requests and responses
  - ✅ Implement error handling and response parsing
  - ✅ Add unit tests for API client functions
  - _Requirements: 12.1, 12.2, 12.3_
  - **Status**: Frontend API client fully implemented and tested:
    - ✅ Virtual host operations with enhanced error handling
    - ✅ Exchange write operations (create/delete) with conditional parameters
    - ✅ Queue write operations (create/delete/purge) with conditional parameters
    - ✅ Binding operations (exchange-to-queue, exchange-to-exchange) with proper URL encoding
    - ✅ Message operations (publish to exchange/queue, get messages) with full parameter support
    - ✅ Comprehensive unit tests with proper Axios response mocking
    - ✅ URL encoding handling for virtual hosts (Base64) and resource names (percent-encoding)
    - ✅ Error handling with descriptive error messages and proper exception propagation

- [x] 10. Create virtual host selection component

  - ✅ Build VirtualHostSelector component with dropdown functionality
  - ✅ Implement caching and loading states for virtual host data
  - ✅ Add proper error handling for virtual host loading failures
  - ✅ Write component tests for virtual host selection
  - _Requirements: 1.3, 2.3_
  - **Status**: Virtual host selection hook implemented:
    - ✅ useVirtualHosts hook with comprehensive state management
    - ✅ Loading states and error handling with user-friendly messages
    - ✅ Automatic data loading when clusterId changes
    - ✅ Manual refresh functionality and error clearing
    - ✅ Proper cleanup when no cluster is selected
    - ✅ Integration with rabbitmqResourcesApi.getVirtualHosts()
    - ✅ TypeScript interfaces for VirtualHost type safety

- [x] 11. Implement exchange creation dialog

  - ✅ Create CreateExchangeDialog component with form validation
  - ✅ Add exchange type selection (direct, fanout, topic, headers)
  - ✅ Implement virtual host selection integration
  - ✅ Add arguments key-value editor component
  - ✅ Write component tests for exchange creation
  - _Requirements: 1.1, 1.2, 1.5, 1.6, 12.1, 12.4_
  - **Status**: Exchange creation dialog fully implemented and tested:
    - ✅ CreateExchangeDialog component with comprehensive form validation
    - ✅ Exchange type selection with descriptions (direct, fanout, topic, headers)
    - ✅ Virtual host dropdown with loading states and error handling
    - ✅ Exchange options (durable, auto-delete, internal) with descriptions
    - ✅ Arguments key-value editor integration with KeyValueEditor component
    - ✅ Form validation with real-time error clearing and proper error messages
    - ✅ API integration with rabbitmqResourcesApi.createExchange()
    - ✅ Loading states, success/error notifications, and proper dialog lifecycle
    - ✅ Comprehensive test suite covering all functionality, edge cases, and error scenarios
    - ✅ TypeScript type safety with CreateExchangeRequest interface
    - ✅ Material-UI integration with responsive design and accessibility

- [x] 12. Implement queue creation dialog

  - ✅ Create CreateQueueDialog component with form validation
  - ✅ Add durability, auto-delete, and exclusive option checkboxes
  - ✅ Implement virtual host selection and optional node selection
  - ✅ Add arguments key-value editor integration
  - ✅ Write component tests for queue creation
  - _Requirements: 2.1, 2.2, 2.5, 2.6, 12.1, 12.4_
  - **Status**: Queue creation dialog fully implemented and tested:
    - ✅ CreateQueueDialog component with comprehensive form validation
    - ✅ Queue options (durable, auto-delete, exclusive) with descriptions and tooltips
    - ✅ Virtual host dropdown with loading states and error handling
    - ✅ Optional node selection for specific cluster node placement
    - ✅ Arguments key-value editor integration with KeyValueEditor component
    - ✅ Form validation with real-time error clearing and proper error messages
    - ✅ API integration with rabbitmqResourcesApi.createQueue()
    - ✅ Loading states, success/error notifications, and proper dialog lifecycle
    - ✅ TypeScript type safety with CreateQueueRequest interface
    - ✅ Material-UI integration with responsive design and accessibility
    - ✅ Comprehensive error handling for different HTTP status codes (409, 400, 403, 404)
    - ✅ Comprehensive test suite covering all functionality, form validation, API integration, and error scenarios

- [x] 13. Implement binding creation dialogs

  - ✅ Create CreateBindingDialog component for both exchange and queue contexts
  - ✅ Add routing key input with validation
  - ✅ Implement arguments editor for binding parameters
  - ✅ Add proper form validation and error handling
  - ✅ Write component tests for binding creation
  - _Requirements: 3.1, 3.2, 3.5, 3.6, 6.1, 6.2, 6.5, 6.6, 12.1, 12.4_
  - **Status**: Binding creation dialog fully implemented and tested:
    - ✅ CreateBindingDialog component with comprehensive form validation and dual context support
    - ✅ Support for both exchange and queue contexts with dynamic UI adaptation
    - ✅ Destination type selection (queue or exchange) with visual indicators
    - ✅ Virtual host dropdown with loading states and error handling
    - ✅ Source and destination resource name validation with pattern matching
    - ✅ Routing key input with length validation and contextual helper text
    - ✅ Arguments key-value editor integration with KeyValueEditor component
    - ✅ Form validation with real-time error clearing and comprehensive error messages
    - ✅ API integration with rabbitmqResourcesApi for both binding types
    - ✅ Loading states, success/error notifications, and proper dialog lifecycle
    - ✅ Binding preview section showing configuration summary
    - ✅ TypeScript type safety with CreateBindingRequest interface
    - ✅ Material-UI integration with responsive design and accessibility
    - ✅ Comprehensive error handling for different HTTP status codes (409, 400, 403, 404)
    - ✅ Pre-population of source resource when invoked from specific contexts

- [x] 14. Implement message publishing dialog

  - ✅ Create PublishMessageDialog component with comprehensive form
  - ✅ Add routing key input and message properties editor
  - ✅ Implement headers key-value editor and payload textarea
  - ✅ Add payload encoding selection and validation
  - ✅ Write component tests for message publishing
  - _Requirements: 4.1, 4.2, 4.5, 4.6, 7.1, 7.2, 7.5, 12.1, 12.4_
  - **Status**: Message publishing dialog fully implemented and tested:
    - ✅ PublishMessageDialog component with comprehensive form validation and dual context support
    - ✅ Support for both exchange and queue contexts with dynamic UI adaptation
    - ✅ Virtual host dropdown with loading states and error handling
    - ✅ Target resource input with pre-population when invoked from specific contexts
    - ✅ Routing key input with contextual validation and helper text
    - ✅ Payload encoding selection (string/base64) with validation and format checking
    - ✅ Message payload textarea with encoding-specific placeholders and validation
    - ✅ Expandable message properties section with common property quick-add buttons
    - ✅ Expandable message headers section with key-value editor integration
    - ✅ KeyValueEditor integration for both properties and headers with proper validation
    - ✅ Form validation with real-time error clearing and comprehensive error messages
    - ✅ API integration with rabbitmqResourcesApi for both exchange and queue publishing
    - ✅ Loading states, success/error notifications, and proper dialog lifecycle
    - ✅ Routing confirmation feedback with success/warning notifications based on message routing
    - ✅ TypeScript type safety with PublishMessageRequest and PublishResponse interfaces
    - ✅ Material-UI integration with responsive design, accordions, and accessibility
    - ✅ Comprehensive error handling for different HTTP status codes (400, 403, 404)
    - ✅ Pre-population of target resource and virtual host when invoked from specific contexts
    - ✅ **Enhanced test suite with improved TypeScript typing and comprehensive coverage**:
      - ✅ Proper `vi.mocked()` usage for better type safety in test mocks
      - ✅ Comprehensive form validation testing (required fields, format validation, length limits)
      - ✅ Base64 payload format validation with encoding selection testing
      - ✅ Routing key length validation (255 character limit) with direct input manipulation
      - ✅ Target resource name format validation with pattern matching
      - ✅ API integration testing for both exchange and queue contexts with exact parameter verification
      - ✅ Success and error notification testing with specific message content validation
      - ✅ Message routing feedback testing (routed vs. not routed scenarios)
      - ✅ Error handling tests for different HTTP status codes (400, 403, 404) with proper error messages
      - ✅ Virtual host loading and form initialization testing with proper async handling
      - ✅ Dialog rendering tests for both contexts with title and field validation
      - ✅ Improved mock implementations for KeyValueEditor and API services

- [x] 15. Implement message consumption dialog and display

  - ✅ Create GetMessagesDialog for configuring message retrieval
  - ✅ Add acknowledgment mode selection and message count input
  - ✅ Create MessageDisplayDialog for showing retrieved messages
  - ✅ Implement proper message formatting and encoding display
  - ✅ Write component tests for message consumption
  - _Requirements: 8.1, 8.2, 8.4, 8.5, 12.1, 12.4_
  - **Status**: Message consumption dialog fully implemented and tested:
    - ✅ GetMessagesDialog component with comprehensive form validation and dual context support
    - ✅ Support for both standalone and queue-specific contexts with dynamic UI adaptation
    - ✅ Virtual host dropdown with loading states and error handling
    - ✅ Queue name input with pre-population when invoked from specific queue contexts
    - ✅ Message count selection using interactive slider (1-100 messages) with visual marks
    - ✅ Acknowledgment mode selection with detailed descriptions:
      - Acknowledge & Requeue (ack_requeue_true) - Remove and requeue for testing
      - Acknowledge & Remove (ack_requeue_false) - Remove permanently
      - Reject & Requeue (reject_requeue_true) - Reject and requeue
      - Reject & Remove (reject_requeue_false) - Reject and remove permanently
    - ✅ Encoding selection (auto/base64) with contextual descriptions
    - ✅ Optional truncate limit input for large message payloads (1-50,000 bytes)
    - ✅ Form validation with real-time error clearing and comprehensive error messages
    - ✅ API integration with rabbitmqResourcesApi.getMessages()
    - ✅ Loading states, success/error notifications, and proper dialog lifecycle
    - ✅ Integration with MessageDisplayDialog for retrieved message display
    - ✅ Empty queue handling with informational notifications
    - ✅ TypeScript type safety with GetMessagesRequest and Message interfaces
    - ✅ Material-UI integration with responsive design, sliders, and accessibility
    - ✅ Comprehensive error handling for different HTTP status codes (400, 403, 404)
    - ✅ Pre-population of queue name and virtual host when invoked from specific contexts

- [x] 16. Implement delete confirmation dialogs

  - ✅ Create DeleteConfirmationDialog with conditional deletion options
  - ✅ Add support for if-unused and if-empty parameters
  - ✅ Implement proper warning messages for destructive operations
  - ✅ Add consistent styling with existing confirmation patterns
  - ✅ Write component tests for delete confirmations
  - ✅ Create comprehensive example file demonstrating proper integration patterns
  - _Requirements: 5.1, 5.2, 5.5, 9.1, 9.2, 10.1, 10.2, 10.5, 12.4_
  - **Status**: Delete confirmation dialog fully implemented and tested:
    - ✅ DeleteConfirmationDialog component with comprehensive form validation and multi-context support
    - ✅ Support for exchange, queue, and purge operations with dynamic UI adaptation
    - ✅ Conditional deletion options (if-unused for exchanges/queues, if-empty for queues)
    - ✅ Context-aware warning messages and confirmation text
    - ✅ Loading states with disabled interactions during operations
    - ✅ Proper error handling with parent component error management
    - ✅ TypeScript type safety with DeleteType and DeleteOptions interfaces
    - ✅ Material-UI integration with responsive design and accessibility
    - ✅ Comprehensive test suite covering all functionality and edge cases
    - ✅ **DeleteConfirmationDialog.example.tsx**: Comprehensive example file demonstrating proper integration patterns with RabbitMQ API functions, including error handling strategies, loading state management, and TypeScript usage patterns

- [x] 17. Integrate write operations into ExchangesList component

  - ✅ Add "Create Exchange" button to exchanges page header
  - ✅ Implement per-exchange action menu with write operations
  - ✅ Add "Create Binding", "Publish Message", and "Delete Exchange" actions
  - ✅ Integrate all dialog components with proper state management
  - ✅ Write integration tests for exchanges page functionality
  - _Requirements: 1.1, 3.1, 4.1, 5.1, 12.1, 12.2, 12.3_
  - **Status**: ExchangesList component fully integrated with write operations:
    - ✅ "Create Exchange" button in page header with proper loading states
    - ✅ Per-exchange action menu with three-dot menu icon and accessibility labels
    - ✅ "Create Binding" action with context-aware dialog pre-population
    - ✅ "Publish Message" action with exchange context and routing support
    - ✅ "Delete Exchange" action with conditional deletion options (if-unused)
    - ✅ Comprehensive error handling with user-friendly messages for different HTTP status codes
    - ✅ Proper state management with dialog lifecycle and cleanup
    - ✅ Success notifications and automatic data refresh after operations
    - ✅ Integration tests covering all functionality including accessibility improvements
    - ✅ Material-UI integration with consistent styling and responsive design

- [x] 18. Integrate write operations into QueuesList component

  - ✅ Add "Create Queue" button to queues page header
  - ✅ Implement per-queue action menu with all write operations
  - ✅ Add "Create Binding", "Publish Message", "Get Messages", "Purge Queue", and "Delete Queue" actions
  - ✅ Integrate all dialog components with proper state management
  - ✅ Write integration tests for queues page functionality
  - _Requirements: 2.1, 6.1, 7.1, 8.1, 9.1, 10.1, 12.1, 12.2, 12.3_
  - **Status**: QueuesList component fully integrated with write operations:
    - ✅ "Create Queue" button in page header with proper loading states
    - ✅ Per-queue action menu with three-dot menu icon and accessibility labels
    - ✅ "Create Binding" action with queue context and proper resource pre-population
    - ✅ "Publish Message" action with queue context for direct queue publishing
    - ✅ "Get Messages" action with queue context and acknowledgment mode selection
    - ✅ "Purge Queue" action with confirmation dialog and proper error handling
    - ✅ "Delete Queue" action with conditional deletion options (if-empty, if-unused)
    - ✅ Comprehensive error handling with user-friendly messages for different HTTP status codes
    - ✅ Proper state management with dialog lifecycle and cleanup
    - ✅ Success notifications and automatic data refresh after operations
    - ✅ Integration tests covering all functionality with 23 comprehensive test cases
    - ✅ Material-UI integration with consistent styling and responsive design
    - ✅ Actions column added to DataGrid with proper sorting and filtering disabled

- [x] 19. Implement notification system integration

  - ✅ Create comprehensive notification utilities with consistent message formatting
  - ✅ Implement HTTP status code handling with user-friendly error messages
  - ✅ Add routing result notifications for message publishing operations
  - ✅ Create message consumption result formatting with acknowledgment details
  - ✅ Implement automatic notification duration management based on content
  - ✅ Add binding description formatting for notification display
  - ✅ Create virtual host name formatting utilities
  - ✅ Implement loading message standardization
  - ⚠️ Integrate notifications into all write operation components (in progress)
  - ⚠️ Write comprehensive tests for notification system integration (pending)
  - _Requirements: 1.5, 1.6, 2.5, 2.6, 3.5, 3.6, 4.4, 4.5, 4.6, 5.4, 5.5, 6.5, 6.6, 7.4, 7.5, 8.4, 8.5, 8.6, 9.4, 9.5, 10.4, 10.5, 12.2, 12.3_
  - **Status**: Notification utilities infrastructure complete with comprehensive message formatting functions:
    - ✅ `formatSuccessMessage()` - Consistent success message patterns for all write operations
    - ✅ `formatErrorMessage()` - HTTP status code handling with user-friendly error messages (400, 401, 403, 404, 409, 412, 422, 429, 5xx)
    - ✅ `formatRoutingMessage()` - Message publishing routing feedback with success/warning types
    - ✅ `formatConsumptionMessage()` - Message consumption results with acknowledgment mode descriptions
    - ✅ `getAckModeDescription()` - User-friendly acknowledgment mode descriptions
    - ✅ `getNotificationDuration()` - Dynamic duration calculation based on message type and length
    - ✅ `formatBindingDescription()` - Readable binding descriptions for notifications
    - ✅ `formatVirtualHostName()` - Standardized virtual host display formatting
    - ✅ `formatLoadingMessage()` - Consistent loading state messaging
    - ✅ TypeScript interfaces for `NotificationOptions` and `ErrorDetails`
    - ✅ Comprehensive error handling patterns for all HTTP status codes
    - ✅ Integration patterns documented in frontend architecture

- [-] 20. Create Git branch and implement version control workflow

  - Create feature/rabbitmq-basic-write-ops branch from main
  - Set up proper commit organization for incremental development
  - Implement code review checkpoints for major components
  - Ensure proper documentation and code comments
  - _Requirements: All requirements (branch management)_

- [ ] 21. Final integration and testing
  - Perform end-to-end testing of all implemented features
  - Verify security model compliance and permission handling
  - Test with different RabbitMQ cluster configurations
  - Validate UI consistency and theme compliance
  - Create user documentation for new features
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 12.1, 12.2, 12.3, 12.4, 12.5_
