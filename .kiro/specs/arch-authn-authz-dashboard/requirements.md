# Requirements Document

## Introduction

RabbitMQ Admin is a comprehensive web application that provides an administrative interface to the RabbitMQ API. The application features user authentication, role-based access control, and cluster connection management capabilities. It follows a three-tier architecture with a React frontend, Spring Boot backend, and PostgreSQL database, all containerized for easy deployment.

## Requirements

### Requirement 1

**User Story:** As a user, I want to authenticate using my username and password, so that I can securely access the RabbitMQ Admin application.

#### Acceptance Criteria

1. WHEN a user provides valid credentials THEN the system SHALL authenticate the user and generate a JWT token
2. WHEN a user provides invalid credentials THEN the system SHALL reject the authentication and display an error message
3. WHEN a user successfully authenticates THEN the system SHALL redirect them to the main dashboard
4. WHEN a user wants to sign out THEN the system SHALL invalidate their session and redirect to the login page
5. WHEN a user's JWT token expires THEN the system SHALL require re-authentication

### Requirement 2

**User Story:** As an Administrator, I want to manage user accounts with different roles, so that I can control access to the application features.

#### Acceptance Criteria

1. WHEN an Administrator creates a new user THEN the system SHALL generate an internal ID and creation date automatically
2. WHEN an Administrator creates a new user THEN the system SHALL require a username, password, and role assignment
3. WHEN a password is set THEN the system SHALL enforce strong password requirements (minimum 8 characters, uppercase, lowercase, number, special character)
4. WHEN an Administrator edits a user THEN the system SHALL allow modification of username, password, role, and assigned cluster connections
5. WHEN an Administrator edits a user THEN the system SHALL NOT allow modification of internal ID or creation date
6. WHEN a non-Administrator user attempts user management THEN the system SHALL deny access

### Requirement 3

**User Story:** As an Administrator, I want to manage cluster connections, so that I can configure RabbitMQ API endpoints and credentials for users.

#### Acceptance Criteria

1. WHEN an Administrator creates a cluster connection THEN the system SHALL store the API endpoint and corresponding credentials
2. WHEN an Administrator edits a cluster connection THEN the system SHALL allow modification of all connection properties
3. WHEN an Administrator deletes a cluster connection THEN the system SHALL remove it from all assigned users
4. WHEN a non-Administrator user attempts cluster connection management THEN the system SHALL deny access
5. WHEN a cluster connection is created THEN the system SHALL validate the API endpoint format

### Requirement 4

**User Story:** As a user, I want to view a dashboard with my available cluster connections, so that I can select and work with the RabbitMQ clusters I have access to.

#### Acceptance Criteria

1. WHEN a user logs in THEN the system SHALL display a dashboard as the main view
2. WHEN the dashboard loads THEN the system SHALL show only cluster connections assigned to the current user
3. WHEN a user selects a cluster connection THEN the system SHALL provide access to RabbitMQ management features for that cluster
4. WHEN no cluster connections are assigned THEN the system SHALL display an appropriate message

### Requirement 5

**User Story:** As a developer, I want the application to follow a three-tier architecture, so that it is maintainable and scalable.

#### Acceptance Criteria

1. WHEN the application is deployed THEN the system SHALL have a React frontend using Material UI with an admin template
2. WHEN the frontend is rendered THEN the system SHALL display a hamburger left sidebar navigation, top ribbon with logo, and bottom-left sign-out option
3. WHEN the application runs THEN the system SHALL use a sky blue color theme with professional admin template styling
4. WHEN the backend processes requests THEN the system SHALL validate all frontend requests using JWT tokens
5. WHEN the application starts THEN the system SHALL use Java 21 and the latest Spring Boot version

### Requirement 6

**User Story:** As a developer, I want the application to use PostgreSQL with proper data management, so that data is stored reliably and schema changes are managed.

#### Acceptance Criteria

1. WHEN the application accesses data THEN the system SHALL use JPA for database operations
2. WHEN database schema changes are needed THEN the system SHALL use Flyway for version control
3. WHEN the application starts THEN the system SHALL connect to a PostgreSQL database
4. WHEN database migrations run THEN the system SHALL apply schema changes in the correct order

### Requirement 7

**User Story:** As a DevOps engineer, I want the application to be containerized, so that it is portable and easy to deploy.

#### Acceptance Criteria

1. WHEN the application is built THEN the system SHALL create Docker containers for all components
2. WHEN the application is deployed THEN the system SHALL use docker-compose to orchestrate frontend, backend, and database
3. WHEN containers start THEN the system SHALL ensure proper networking between all components
4. WHEN the application runs THEN the system SHALL serve both frontend and backend from the same application

### Requirement 8

**User Story:** As a developer, I want the backend to integrate with RabbitMQ API, so that users can manage RabbitMQ clusters through the application.

#### Acceptance Criteria

1. WHEN a user selects a cluster connection THEN the system SHALL connect to the corresponding RabbitMQ API
2. WHEN RabbitMQ API calls are made THEN the system SHALL use the stored credentials for authentication
3. WHEN RabbitMQ operations are performed THEN the system SHALL provide appropriate feedback to the user
4. WHEN RabbitMQ API is unavailable THEN the system SHALL handle errors gracefully

### Requirement 9

**User Story:** As a developer, I want comprehensive backend testing, so that the application is reliable and maintainable.

#### Acceptance Criteria

1. WHEN backend code is written THEN the system SHALL include unit tests for all service classes
2. WHEN backend code is written THEN the system SHALL include integration tests for API endpoints
3. WHEN tests are run THEN the system SHALL achieve adequate code coverage
4. WHEN tests are executed THEN the system SHALL validate both positive and negative scenarios

### Requirement 10

**User Story:** As a developer, I want the BFF APIs to be accessible via a specific URL path, so that frontend and backend communication is well-organized.

#### Acceptance Criteria

1. WHEN the backend starts THEN the system SHALL expose all BFF APIs under a specific URL path prefix
2. WHEN the frontend makes API calls THEN the system SHALL route requests to the correct BFF endpoints
3. WHEN API endpoints are accessed THEN the system SHALL validate JWT tokens for all protected routes
4. WHEN API responses are sent THEN the system SHALL include appropriate HTTP status codes and error messages
