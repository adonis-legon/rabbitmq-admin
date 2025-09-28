# Frontend Architecture

## Overview

The RabbitMQ Admin frontend is built with React 18+ and TypeScript, providing a modern, responsive interface for managing RabbitMQ clusters and resources. The application follows a component-based architecture with clear separation of concerns and comprehensive type safety.

## Technology Stack

### Core Technologies

- **React 18+**: Modern React with hooks and concurrent features
- **TypeScript**: Full type safety and IntelliSense support
- **Material-UI v5**: Consistent design system and components
- **React Router**: Client-side routing with direct URL navigation
- **Vite**: Fast build tool and development server

### Development Tools

- **Vitest**: Modern testing framework
- **React Testing Library**: Component testing utilities
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting

## Project Structure

### Directory Organization

```
frontend/src/
├── components/           # Reusable UI components
│   ├── auth/            # Authentication components
│   ├── common/          # Shared/utility components
│   ├── dashboard/       # Dashboard-specific components
│   ├── layout/          # Layout and navigation components
│   ├── resources/       # Resource management components
│   └── users/           # User management components
├── contexts/            # React context providers
├── hooks/               # Custom React hooks
├── services/            # API and business logic services
├── types/               # TypeScript type definitions
├── utils/               # Utility functions and helpers
│   ├── icons.tsx        # Centralized icon management system
│   └── ...              # Other utility modules
└── templates/           # Code generation templates
```

## Component Architecture

### Component Categories

#### 1. Common Components (`/components/common/`)

Reusable components used throughout the application:

- **`SearchAndFilter`**: Unified search and filtering interface

  - Debounced search input with clear functionality
  - Multi-select dropdown filters with chip display
  - Configurable filter options and labels
  - Clear all filters functionality
  - Responsive design for mobile and desktop
  - Consistent integration across all list components (users, clusters, resources)

- **`Breadcrumbs`**: Navigation breadcrumb component

  - Hierarchical navigation display with automatic Dashboard root
  - Clickable navigation links for easy navigation
  - Icon support using centralized icon management system
  - Consistent sizing with `IconSizes.breadcrumb` (16px)
  - Responsive behavior and Material-UI theme integration
  - Used across Dashboard and resource management pages

- **`DeleteConfirmationDialog`**: Reusable confirmation dialog for destructive operations

  - Multi-context support for exchange, queue, and purge operations
  - Conditional deletion options (if-unused, if-empty parameters)
  - Context-aware warning messages and confirmation text
  - Loading states with disabled interactions during operations
  - Proper error handling with parent component error management
  - TypeScript type safety with DeleteType and DeleteOptions interfaces
  - Material-UI integration with responsive design and accessibility
  - **Example Integration**: Includes comprehensive example file (`DeleteConfirmationDialog.example.tsx`) demonstrating proper integration patterns with RabbitMQ API functions

- **`LoadingSpinner`**: Consistent loading state indicator
- **`ErrorBoundary`**: Error boundary for component error handling

#### Icon Management System (`/utils/icons.tsx`)

Centralized icon management for consistent UI elements:

- **`AppIcons`**: Predefined icon definitions for all application areas

  - App branding icon (rabbit-themed for RabbitMQ context)
  - Main navigation icons (dashboard, home)
  - Resource management icons (connections, channels, exchanges, queues)
  - Admin management icons (users, clusters)
  - Consistent Material-UI icon usage across components

- **`getIcon`**: Helper function for dynamic icon rendering

  - Supports custom sizing and styling
  - Consistent icon properties application
  - Type-safe icon name resolution

- **`IconSizes`**: Standardized icon sizes for different contexts
  - Breadcrumb navigation (16px)
  - Sidebar navigation (20px)
  - Tab navigation (20px)
  - Ensures visual consistency across the application

#### 2. Resource Components (`/components/resources/`)

Components for RabbitMQ resource management:

- **`ResourceLayout`**: Main layout wrapper for resource pages

  - Cluster selection validation
  - Resource navigation tabs
  - Breadcrumb integration
  - Loading and error state handling
  - Responsive tab navigation with scroll support

- **Resource List Components**: Individual resource type components

  - `ConnectionsList`, `ChannelsList`, `ExchangesList`, `QueuesList`
  - Consistent interface patterns with unified filtering behavior
  - Integrated search and filtering with proper empty state messaging
  - Pagination controls
  - Detail modal integration
  - Proper distinction between "no data" and "no filtered results" states
  - **Write Operations Support**: Backend implementation complete for exchanges, queues, bindings, and message publishing. Frontend UI components implemented:
    - ✅ Exchange creation dialog (CreateExchangeDialog) with comprehensive form validation and testing
    - ✅ Queue creation dialog (CreateQueueDialog) with comprehensive form validation, virtual host integration, and queue options
    - ✅ Binding creation dialog (CreateBindingDialog) with dual context support and comprehensive validation
    - ✅ Message publishing dialog (PublishMessageDialog) with exchange/queue contexts and enhanced testing
    - ✅ Message consumption dialog (GetMessagesDialog) with acknowledgment modes and message display integration
    - ✅ Delete confirmation dialog (DeleteConfirmationDialog) with multi-context support and conditional deletion options
    - 🚧 **ExchangesList Integration**: Currently integrating write operations with action menus, "Create Exchange" button, and dialog state management for create binding, publish message, and delete exchange operations

- **Message Operations Components**:

  - `GetMessagesDialog`: Message consumption configuration dialog

    - Interactive message count selection with slider control (1-100 messages)
    - Acknowledgment mode selection with detailed descriptions for each mode
    - Encoding options (auto/base64) for proper message display
    - Optional truncate limit for large message payloads
    - Integration with MessageDisplayDialog for retrieved message viewing
    - Support for both standalone and queue-specific contexts
    - Comprehensive form validation and error handling
    - Pre-population of queue and virtual host when invoked from specific contexts

  - `MessageDisplayDialog`: Retrieved message display and formatting
    - Proper message formatting with encoding detection
    - Message properties and headers display
    - Pagination for multiple retrieved messages
    - Copy-to-clipboard functionality for message content

- **Shared Resource Components** (`/components/resources/shared/`):
  - `ResourceTable`: Virtualized data table component
  - `PaginationControls`: Consistent pagination interface
  - `RefreshControls`: Auto-refresh and manual refresh controls
  - `ResourceFilters`: Resource-specific filtering components
  - `ResourceErrorBoundary`: Error handling for resource components

#### 3. Layout Components (`/components/layout/`)

Application layout and navigation:

- Navigation sidebar with collapsible sections
- Header with user information and logout
- Responsive layout for mobile and desktop
- Theme integration and dark mode support

#### 4. Dashboard Components (`/components/dashboard/`)

Main dashboard interface and cluster management:

- `Dashboard`: Main dashboard with breadcrumb navigation and cluster overview

  - Integrated breadcrumb navigation using centralized Breadcrumbs component
  - Centralized icon management with proper sizing for consistent UI
  - Cluster selection and quick access to resource management
  - Responsive design with mobile-optimized layout
  - Welcome messaging and cluster assignment status

- `ClusterConnectionCard`: Individual cluster connection display cards
- `ClusterSelector`: Dropdown selector for active cluster switching

#### 5. Authentication Components (`/components/auth/`)

User authentication and authorization:

- `LoginForm`: User login interface
- `AuthProvider`: Authentication context provider
- `ProtectedRoute`: Route protection wrapper
- `AdminRoute`: Admin-only route protection

## Notification System

### Notification Utilities (`/utils/notificationUtils.ts`)

The application includes a comprehensive notification utility system for consistent user feedback across all write operations:

#### Core Interfaces

```typescript
export interface NotificationOptions {
  autoHideDuration?: number;
  includeDetails?: boolean;
}

export interface ErrorDetails {
  status?: number;
  message?: string;
  details?: string;
}
```

#### Message Formatting Functions

- **`formatSuccessMessage`**: Creates consistent success messages for write operations
- **`formatErrorMessage`**: Handles HTTP status codes with user-friendly error messages
- **`formatRoutingMessage`**: Provides routing feedback for message publishing operations
- **`formatConsumptionMessage`**: Formats message consumption results with acknowledgment details
- **`formatBindingDescription`**: Creates readable binding descriptions for notifications
- **`formatVirtualHostName`**: Standardizes virtual host display names
- **`formatLoadingMessage`**: Generates consistent loading state messages

#### Error Handling by HTTP Status

The notification system provides specific user-friendly messages for common HTTP status codes:

- **400**: Invalid configuration with input validation guidance
- **401**: Session expiration with re-authentication prompt
- **403**: Permission denied with role-based messaging
- **404**: Resource not found with context-specific details
- **409**: Resource already exists conflicts
- **412**: Precondition failed for conditional operations
- **422**: Invalid data with validation details
- **429**: Rate limiting with retry guidance
- **5xx**: Server errors with retry suggestions

#### Notification Duration Management

The system automatically adjusts notification display duration based on:

- Message type (success: 4s, info: 6s, warning: 8s, error: 10s)
- Message length (longer messages get extended display time)
- Content complexity (up to 3 additional seconds for detailed messages)

#### Usage Examples

```typescript
// Success notification for resource creation
const successMessage = formatSuccessMessage(
  "created",
  "Exchange",
  "user-events",
  "Ready to receive messages"
);

// Error notification with HTTP status handling
const errorMessage = formatErrorMessage("delete", "Queue", "test-queue", {
  status: 412,
  message: "Queue has consumers",
});

// Message publishing feedback
const routingResult = formatRoutingMessage(
  "exchange",
  "user-events",
  true,
  "user.created"
);
```

### Component Design Patterns

#### 1. Composition Pattern

Components are designed for composition and reusability:

```typescript
// ResourceLayout composes multiple smaller components
<ResourceLayout selectedCluster={cluster} loading={loading} error={error}>
  <SearchAndFilter
    searchTerm={searchTerm}
    onSearchChange={handleSearch}
    filterOptions={stateOptions}
    onClearAll={handleClearFilters}
  />
  <ResourceTable data={resources} columns={columns} />
  <PaginationControls
    page={page}
    pageSize={pageSize}
    totalItems={totalItems}
    onPageChange={handlePageChange}
  />
</ResourceLayout>
```

#### 2. Example-Driven Development Pattern

Complex components include comprehensive example files demonstrating proper integration patterns:

```typescript
// DeleteConfirmationDialog.example.tsx demonstrates proper API integration
const DeleteConfirmationExample: React.FC = () => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<DeleteType>("exchange");
  const [resourceName, setResourceName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDeleteExchange = async (options: DeleteOptions) => {
    setLoading(true);
    try {
      await rabbitmqResourcesApi.deleteExchange(
        clusterId,
        vhost,
        resourceName,
        options.ifUnused
      );
      // Success handling: show notification, refresh list
    } catch (error) {
      // Error handling: show error notification
      throw error; // Re-throw to keep dialog open
    } finally {
      setLoading(false);
    }
  };

  return (
    <DeleteConfirmationDialog
      open={deleteDialogOpen}
      onClose={() => setDeleteDialogOpen(false)}
      onConfirm={handleConfirm}
      deleteType={deleteType}
      resourceName={resourceName}
      loading={loading}
    />
  );
};
```

**Example File Benefits:**

- **Integration Guidance**: Shows proper API integration patterns
- **Error Handling**: Demonstrates comprehensive error handling strategies
- **State Management**: Illustrates proper loading state and dialog lifecycle management
- **Type Safety**: Provides TypeScript usage examples with proper type definitions
- **Best Practices**: Documents recommended patterns for component usage

#### 3. Centralized Icon Management

Icons are managed centrally for consistency and maintainability:

```typescript
// Using centralized icon system
import { AppIcons, getIcon, IconSizes } from "../utils/icons";

// Direct icon usage
const NavigationItem = ({ label, iconName }) => (
  <ListItem>
    <ListItemIcon>{AppIcons[iconName]}</ListItemIcon>
    <ListItemText primary={label} />
  </ListItem>
);

// Dynamic icon with custom sizing (used in Dashboard breadcrumbs)
const DashboardBreadcrumbs = () => (
  <Breadcrumbs
    items={[
      {
        label: "Dashboard",
        icon: getIcon("dashboard", {
          fontSize: IconSizes.breadcrumb,
          sx: { mr: 0.5 },
        }),
      },
    ]}
  />
);
```

#### 4. Consistent Filtering Pattern

All list components follow a consistent filtering pattern:

```typescript
// Filtering logic applied consistently across components
useEffect(() => {
  let filtered = items;

  // Apply search filter
  if (searchTerm) {
    filtered = filtered.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Apply status/type filters
  if (statusFilter.length > 0) {
    filtered = filtered.filter((item) => statusFilter.includes(item.status));
  }

  setFilteredItems(filtered);
}, [items, searchTerm, statusFilter]);

// Empty state messaging distinguishes between no data and no filtered results
{
  filteredItems.length === 0 ? (
    <EmptyState>
      {items.length === 0
        ? "No items found. Create your first item to get started."
        : "No items match the current filters."}
    </EmptyState>
  ) : (
    filteredItems.map((item) => <ItemRow key={item.id} item={item} />)
  );
}
```

#### 5. Hook-Based State Management

Custom hooks encapsulate business logic and state:

```typescript
// Resource hooks provide data and operations
const {
  data: connections,
  loading,
  error,
  refresh,
  pagination,
  filters,
} = useConnections({
  clusterId,
  autoRefresh: true,
  pageSize: 50,
});
```

#### 5. Notification Integration Pattern

Components integrate with the notification system using consistent patterns:

```typescript
// Write operation with notification integration
const handleCreateResource = async (data: CreateResourceRequest) => {
  setLoading(true);
  try {
    await api.createResource(clusterId, data);

    // Success notification with consistent formatting
    const successMessage = formatSuccessMessage(
      "created",
      "Resource",
      data.name
    );
    showNotification(successMessage, "success");

    // Refresh data and close dialog
    await refresh();
    onClose();
  } catch (error) {
    // Error notification with HTTP status handling
    const errorMessage = formatErrorMessage("create", "Resource", data.name, {
      status: error.response?.status,
      message: error.message,
    });
    showNotification(errorMessage, "error");
  } finally {
    setLoading(false);
  }
};
```

#### 6. Context Providers

React contexts provide global state management:

- `AuthProvider`: User authentication state
- `ClusterContext`: Selected cluster information
- `NotificationContext`: Application notifications with consistent formatting utilities
- `ErrorContext`: Global error handling with notification integration

## Type System

### TypeScript Integration

The application uses comprehensive TypeScript types for:

#### 1. API Response Types

```typescript
// RabbitMQ resource types
export interface RabbitMQConnection {
  name: string;
  state: ConnectionState;
  channels: number;
  clientProperties: Record<string, any>;
  // ... additional properties
}

export interface PagedResponse<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

#### 2. Component Props

```typescript
// Component prop interfaces
export interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (searchTerm: string) => void;
  filterValue?: string[];
  onFilterChange?: (values: string[]) => void;
  filterOptions?: FilterOption[];
  filterLabel?: string;
  onClearAll: () => void;
  disabled?: boolean;
  searchPlaceholder?: string;
}
```

#### 3. Hook Return Types

```typescript
// Custom hook return types
export interface UseResourceResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  pagination: PaginationState;
  filters: FilterState;
}
```

## State Management

### Local Component State

- React hooks (`useState`, `useEffect`, `useReducer`)
- Component-specific state management
- Form state and validation

### Global State

- React Context for shared state
- Custom hooks for state logic
- Local storage for user preferences

### Server State

- Custom hooks for API data fetching
- Caching with configurable TTL
- Optimistic updates and error handling

## Performance Optimization

### Client-Side Caching

```typescript
// Resource caching with TTL
const cache = new ResourceCache({
  ttl: 30000, // 30 seconds
  maxSize: 1000,
  keyGenerator: (params) => `${params.clusterId}-${params.resource}`,
});
```

### Component Optimization

- `React.memo` for expensive components
- `useMemo` and `useCallback` for expensive computations
- Virtualized tables for large datasets
- Lazy loading for route components

### Bundle Optimization

- Code splitting by route
- Tree shaking for unused code
- Dynamic imports for large dependencies
- Optimized build configuration with Vite

## Testing Strategy

### Component Testing

The application uses comprehensive component testing with React Testing Library and Vitest, focusing on user behavior and real-world scenarios:

```typescript
// Component testing with React Testing Library and Vitest
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { SearchAndFilter } from "./SearchAndFilter";

test("should filter results when search term changes", async () => {
  const mockOnSearchChange = vi.fn();

  render(
    <SearchAndFilter
      searchTerm=""
      onSearchChange={mockOnSearchChange}
      onClearAll={() => {}}
    />
  );

  const searchInput = screen.getByRole("textbox");
  fireEvent.change(searchInput, { target: { value: "test" } });

  // Verify debounced search
  await waitFor(() => {
    expect(mockOnSearchChange).toHaveBeenCalledWith("test");
  });
});
```

#### Advanced Component Testing Examples

**Dialog Component Testing** (PublishMessageDialog):

```typescript
// Enhanced dialog testing with improved TypeScript typing and comprehensive validation
describe("PublishMessageDialog", () => {
  // Proper TypeScript mock setup with vi.mocked()
  const mockPublishMessage = vi.mocked(rabbitmqResourcesApi.publishMessage);
  const mockUseNotification = vi.mocked(useNotification);

  it("publishes message to exchange successfully", async () => {
    const user = userEvent.setup();
    renderComponent({ context: "exchange" });

    // Wait for virtual hosts to load and form to initialize
    await waitFor(() => {
      expect(screen.getByDisplayValue("/")).toBeInTheDocument();
    });

    // Use accessible labels for robust element selection
    const targetInput = screen.getByLabelText(/Target Exchange/i);
    const routingKeyInput = screen.getByLabelText(/Routing Key/i);
    const payloadInput = screen.getByLabelText(/Message Payload/i);

    // Clear and type new values for reliable testing
    await user.clear(targetInput);
    await user.type(targetInput, "test-exchange");
    await user.clear(routingKeyInput);
    await user.type(routingKeyInput, "test.routing");
    await user.clear(payloadInput);
    await user.type(payloadInput, "Hello World");

    const publishButton = screen.getByText("Publish Message");
    await user.click(publishButton);

    // Verify exact API call parameters
    await waitFor(() => {
      expect(mockPublishMessage).toHaveBeenCalledWith(
        "test-cluster",
        "/",
        "test-exchange",
        {
          routingKey: "test.routing",
          properties: {},
          payload: "Hello World",
          payloadEncoding: "string",
        }
      );
    });

    // Verify specific notification content
    expect(mockNotificationContext.success).toHaveBeenCalledWith(
      'Message published to exchange "test-exchange" and routed successfully'
    );
  });

  it("validates routing key length limits", async () => {
    const user = userEvent.setup();
    renderComponent();

    const targetInput = screen.getByLabelText(/Target Exchange/i);
    const routingKeyInput = screen.getByLabelText(/Routing Key/i);
    const payloadInput = screen.getByLabelText(/Message Payload/i);

    await user.type(targetInput, "test-exchange");
    await user.type(payloadInput, "test payload");

    // Test routing key length validation (255 character limit)
    const longRoutingKey = "a".repeat(256);
    fireEvent.change(routingKeyInput, { target: { value: longRoutingKey } });

    const publishButton = screen.getByText("Publish Message");
    await user.click(publishButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Routing key cannot exceed 255 characters/i)
      ).toBeInTheDocument();
    });
  });

  it("validates base64 payload format", async () => {
    const user = userEvent.setup();
    renderComponent();

    const targetInput = screen.getByLabelText(/Target Exchange/i);
    const payloadInput = screen.getByLabelText(/Message Payload/i);

    await user.type(targetInput, "test-exchange");

    // Test encoding selection and validation
    await user.click(screen.getByText("String (UTF-8)"));
    await user.click(screen.getByText("Base64"));
    await user.type(payloadInput, "invalid base64!");

    const publishButton = screen.getByText("Publish Message");
    await user.click(publishButton);

    await waitFor(() => {
      expect(screen.getByText(/Invalid Base64 format/i)).toBeInTheDocument();
    });
  });

  it("handles specific API error responses", async () => {
    mockPublishMessage.mockRejectedValue({
      response: {
        status: 400,
        data: { message: "Invalid message format" },
      },
    });
    const user = userEvent.setup();
    renderComponent();

    // Test specific error handling with HTTP status codes
    await user.type(targetInput, "test-exchange");
    await user.type(payloadInput, "Hello World");
    await user.click(publishButton);

    await waitFor(() => {
      expect(mockNotificationContext.error).toHaveBeenCalledWith(
        "Invalid message format"
      );
    });
  });
});
```

**Testing Patterns Used:**

- **Enhanced TypeScript Testing**: Using `vi.mocked()` for proper type safety in mock functions and better IntelliSense support
- **Accessibility-First Testing**: Using `getByLabelText` and accessible names for robust element selection that matches real user interaction
- **Async State Testing**: Proper handling of loading states and form initialization with `waitFor()` patterns
- **User Event Simulation**: Using `@testing-library/user-event` for realistic user interactions including clear/type sequences
- **Comprehensive Form Validation**: Testing field format validation, length limits, encoding validation, and required field scenarios
- **API Integration Testing**: Mocking API calls with exact parameter verification and response handling
- **Error Handling Testing**: Testing specific HTTP status codes (400, 403, 404) with proper error message validation
- **Context Integration Testing**: Testing integration with notification and virtual host contexts with proper mock setup
- **Dual Context Testing**: Testing components that work in multiple contexts (exchange/queue) with context-specific behavior
- **Input Manipulation Testing**: Using both user events and direct `fireEvent.change` for edge cases like length validation
- **Notification Testing**: Verifying exact notification content for success, warning, and error scenarios

### Integration Testing

- Full user workflow testing
- API integration testing
- Error boundary testing
- Accessibility testing

### Performance Testing

- Large dataset rendering
- Memory leak detection
- Bundle size monitoring
- Core Web Vitals tracking

## Security Considerations

### Authentication

- JWT token management
- Automatic token refresh
- Secure token storage
- Session timeout handling

### Authorization

- Role-based component rendering
- Route protection
- API endpoint authorization
- Cluster access validation

### Data Protection

- Input sanitization
- XSS prevention
- Secure API communication
- Sensitive data filtering

## Build and Deployment

### Development Build

```bash
# Start development server
npm run dev

# Run tests
npm test

# Type checking
npm run type-check
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Analyze bundle
npm run analyze
```

### Build Optimization

- Static asset optimization
- Code splitting and lazy loading
- Service worker for caching
- Progressive Web App features

## Best Practices

### Component Development

1. **Single Responsibility**: Each component has one clear purpose
2. **Composition over Inheritance**: Use composition for component reuse
3. **Props Interface**: Define clear TypeScript interfaces for all props
4. **Error Boundaries**: Wrap components in error boundaries
5. **Accessibility**: Include ARIA labels and keyboard navigation

### State Management

1. **Local First**: Use local state when possible
2. **Context Sparingly**: Use context for truly global state
3. **Custom Hooks**: Extract reusable state logic into hooks
4. **Immutable Updates**: Always use immutable state updates

### Performance

1. **Memoization**: Use React.memo for expensive components
2. **Lazy Loading**: Implement code splitting for routes
3. **Virtualization**: Use virtual scrolling for large lists
4. **Caching**: Implement intelligent caching strategies

### Testing

1. **Test Behavior**: Test what users see and do
2. **Mock External Dependencies**: Mock API calls and external services
3. **Accessibility Testing**: Include accessibility in test suites
4. **Performance Testing**: Test with realistic data sizes

## Future Considerations

### Planned Enhancements

- Enhanced offline support
- Real-time updates with WebSockets
- Advanced data visualization
- Mobile app development
- Micro-frontend architecture

### Technology Upgrades

- React 19 adoption when stable
- Next.js migration for SSR
- GraphQL integration
- Advanced state management (Zustand/Redux Toolkit)

## Contributing

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Run tests: `npm test`

### Code Standards

- Follow TypeScript strict mode
- Use ESLint and Prettier configurations
- Write comprehensive tests
- Document complex components
- Follow accessibility guidelines

### Component Guidelines

- Use functional components with hooks
- Implement proper TypeScript types
- Include comprehensive prop validation
- Write unit and integration tests
- Follow Material-UI design patterns
