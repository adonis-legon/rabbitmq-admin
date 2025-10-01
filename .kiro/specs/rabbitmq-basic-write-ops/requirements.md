# Requirements Document

## Introduction

This feature adds basic write operations to the RabbitMQ Admin application, enabling users to create, modify, and delete RabbitMQ resources (exchanges, queues, bindings) and perform message operations (publish, consume, purge) through the web interface. These operations extend the current read-only functionality to provide a complete management experience for RabbitMQ clusters.

The feature leverages the RabbitMQ Management HTTP API endpoints for all operations and maintains the same security model as existing features - users can perform operations only on clusters they have access to, and operations will fail gracefully if the cluster connection lacks the necessary permissions.

## Requirements

### Requirement 1

**User Story:** As a RabbitMQ administrator, I want to create new exchanges from the Exchanges resource page, so that I can set up message routing infrastructure for my applications.

#### Acceptance Criteria

1. WHEN I am on the Exchanges page THEN I SHALL see a "Create Exchange" button or action
2. WHEN I click the "Create Exchange" action THEN the system SHALL display a form with fields for exchange name, type, virtual host selection, durability, auto-delete, internal flag, and arguments
3. WHEN I select a virtual host THEN the system SHALL populate the dropdown with available virtual hosts from the current cluster connection
4. WHEN I submit a valid exchange creation form THEN the system SHALL call the RabbitMQ Management API PUT /api/exchanges/{vhost}/{name} endpoint
5. WHEN the exchange is successfully created THEN the system SHALL display a success notification and refresh the exchanges list
6. WHEN the exchange creation fails THEN the system SHALL display an error notification with the failure reason

### Requirement 2

**User Story:** As a RabbitMQ administrator, I want to create new queues from the Queues resource page, so that I can set up message storage for my applications.

#### Acceptance Criteria

1. WHEN I am on the Queues page THEN I SHALL see a "Create Queue" button or action
2. WHEN I click the "Create Queue" action THEN the system SHALL display a form with fields for queue name, virtual host selection, durability, auto-delete, exclusive flag, and arguments
3. WHEN I select a virtual host THEN the system SHALL populate the dropdown with available virtual hosts from the current cluster connection
4. WHEN I submit a valid queue creation form THEN the system SHALL call the RabbitMQ Management API PUT /api/queues/{vhost}/{name} endpoint
5. WHEN the queue is successfully created THEN the system SHALL display a success notification and refresh the queues list
6. WHEN the queue creation fails THEN the system SHALL display an error notification with the failure reason

### Requirement 3

**User Story:** As a RabbitMQ administrator, I want to create bindings from an exchange to a queue, so that I can define message routing rules.

#### Acceptance Criteria

1. WHEN I select an exchange from the Exchanges list THEN I SHALL see a "Create Binding" action in the exchange details or context menu
2. WHEN I click "Create Binding" THEN the system SHALL display a form with fields for destination queue name, routing key, and binding arguments
3. WHEN I enter a queue name THEN the system SHALL accept any valid queue name (the queue does not need to exist beforehand)
4. WHEN I submit a valid binding form THEN the system SHALL call the RabbitMQ Management API POST /api/bindings/{vhost}/e/{exchange}/q/{queue} endpoint
5. WHEN the binding is successfully created THEN the system SHALL display a success notification and refresh the exchange bindings
6. WHEN the binding creation fails THEN the system SHALL display an error notification with the failure reason

### Requirement 4

**User Story:** As a RabbitMQ administrator, I want to publish messages to an exchange, so that I can test message routing and send data to my applications.

#### Acceptance Criteria

1. WHEN I select an exchange from the Exchanges list THEN I SHALL see a "Publish Message" action in the exchange details or context menu
2. WHEN I click "Publish Message" THEN the system SHALL display a form with fields for routing key, message headers, message properties, and payload
3. WHEN I submit a valid message form THEN the system SHALL call the RabbitMQ Management API PUT /api/exchanges/{vhost}/{name}/publish endpoint
4. WHEN the message is successfully published THEN the system SHALL display a success notification indicating whether the message was routed
5. WHEN the message publishing fails THEN the system SHALL display an error notification with the failure reason
6. WHEN the message is published but not routed THEN the system SHALL display a warning notification indicating the message was not routed to any queue

### Requirement 5

**User Story:** As a RabbitMQ administrator, I want to delete exchanges, so that I can clean up unused routing infrastructure.

#### Acceptance Criteria

1. WHEN I select an exchange from the Exchanges list THEN I SHALL see a "Delete Exchange" action in the exchange details or context menu
2. WHEN I click "Delete Exchange" THEN the system SHALL display a confirmation dialog with options for conditional deletion (if-unused)
3. WHEN I confirm the deletion THEN the system SHALL call the RabbitMQ Management API DELETE /api/exchanges/{vhost}/{name} endpoint
4. WHEN the exchange is successfully deleted THEN the system SHALL display a success notification and refresh the exchanges list
5. WHEN the exchange deletion fails THEN the system SHALL display an error notification with the failure reason
6. WHEN I select the "if-unused" option THEN the system SHALL include the if-unused query parameter in the API call

### Requirement 6

**User Story:** As a RabbitMQ administrator, I want to create bindings from a queue to an exchange, so that I can define which exchanges can route messages to specific queues.

#### Acceptance Criteria

1. WHEN I select a queue from the Queues list THEN I SHALL see a "Create Binding" action in the queue details or context menu
2. WHEN I click "Create Binding" THEN the system SHALL display a form with fields for source exchange name, routing key, and binding arguments
3. WHEN I enter an exchange name THEN the system SHALL accept any valid exchange name (the exchange does not need to exist beforehand)
4. WHEN I submit a valid binding form THEN the system SHALL call the RabbitMQ Management API POST /api/bindings/{vhost}/e/{exchange}/q/{queue} endpoint
5. WHEN the binding is successfully created THEN the system SHALL display a success notification and refresh the queue bindings
6. WHEN the binding creation fails THEN the system SHALL display an error notification with the failure reason

### Requirement 7

**User Story:** As a RabbitMQ administrator, I want to publish messages directly to a queue, so that I can test queue functionality and send data directly to consumers.

#### Acceptance Criteria

1. WHEN I select a queue from the Queues list THEN I SHALL see a "Publish Message" action in the queue details or context menu
2. WHEN I click "Publish Message" THEN the system SHALL display a form with fields for message headers, message properties, and payload
3. WHEN I submit a valid message form THEN the system SHALL call the RabbitMQ Management API PUT /api/exchanges/{vhost}//publish endpoint with the queue name as routing key (using default exchange)
4. WHEN the message is successfully published THEN the system SHALL display a success notification
5. WHEN the message publishing fails THEN the system SHALL display an error notification with the failure reason

### Requirement 8

**User Story:** As a RabbitMQ administrator, I want to consume messages from a queue with different acknowledgment modes, so that I can inspect message content and test consumer behavior.

#### Acceptance Criteria

1. WHEN I select a queue from the Queues list THEN I SHALL see a "Get Messages" action in the queue details or context menu
2. WHEN I click "Get Messages" THEN the system SHALL display a form with fields for message count and acknowledgment mode (ack, nack-requeue, nack-discard)
3. WHEN I submit a valid get messages form THEN the system SHALL call the RabbitMQ Management API POST /api/queues/{vhost}/{name}/get endpoint
4. WHEN messages are successfully retrieved THEN the system SHALL display the messages with their properties, headers, and payload in a readable format
5. WHEN no messages are available THEN the system SHALL display an informational message indicating the queue is empty
6. WHEN the message retrieval fails THEN the system SHALL display an error notification with the failure reason

### Requirement 9

**User Story:** As a RabbitMQ administrator, I want to purge all messages from a queue, so that I can clear accumulated messages during testing or maintenance.

#### Acceptance Criteria

1. WHEN I select a queue from the Queues list THEN I SHALL see a "Purge Queue" action in the queue details or context menu
2. WHEN I click "Purge Queue" THEN the system SHALL display a confirmation dialog warning about the irreversible nature of the operation
3. WHEN I confirm the purge operation THEN the system SHALL call the RabbitMQ Management API DELETE /api/queues/{vhost}/{name}/contents endpoint
4. WHEN the queue is successfully purged THEN the system SHALL display a success notification and refresh the queue details
5. WHEN the queue purging fails THEN the system SHALL display an error notification with the failure reason

### Requirement 10

**User Story:** As a RabbitMQ administrator, I want to delete queues, so that I can clean up unused message storage.

#### Acceptance Criteria

1. WHEN I select a queue from the Queues list THEN I SHALL see a "Delete Queue" action in the queue details or context menu
2. WHEN I click "Delete Queue" THEN the system SHALL display a confirmation dialog with options for conditional deletion (if-empty, if-unused)
3. WHEN I confirm the deletion THEN the system SHALL call the RabbitMQ Management API DELETE /api/queues/{vhost}/{name} endpoint
4. WHEN the queue is successfully deleted THEN the system SHALL display a success notification and refresh the queues list
5. WHEN the queue deletion fails THEN the system SHALL display an error notification with the failure reason
6. WHEN I select conditional deletion options THEN the system SHALL include the appropriate query parameters (if-empty, if-unused) in the API call

### Requirement 11

**User Story:** As a system user, I want all write operations to respect the existing security model, so that I can only perform operations on clusters I have access to.

#### Acceptance Criteria

1. WHEN I attempt any write operation THEN the system SHALL verify I have access to the target cluster connection
2. WHEN the cluster connection lacks permissions for an operation THEN the system SHALL display an appropriate error message from the RabbitMQ API
3. WHEN I am not authenticated THEN the system SHALL redirect me to the login page before allowing any write operations
4. WHEN my session expires during an operation THEN the system SHALL handle the authentication error gracefully and prompt for re-authentication

### Requirement 12

**User Story:** As a system user, I want consistent UI patterns for all write operations, so that I have a familiar and intuitive experience.

#### Acceptance Criteria

1. WHEN I perform any write operation THEN the system SHALL use consistent form layouts, button styles, and interaction patterns matching the existing application theme
2. WHEN operations are in progress THEN the system SHALL display appropriate loading indicators
3. WHEN operations complete THEN the system SHALL use the existing notification system for success and error messages
4. WHEN I need to confirm destructive operations THEN the system SHALL use consistent confirmation dialog patterns
5. WHEN forms have validation errors THEN the system SHALL display field-level error messages using the existing validation patterns
