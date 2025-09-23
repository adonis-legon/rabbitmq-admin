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

#### 2. Centralized Icon Management

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

#### 3. Consistent Filtering Pattern

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

#### 4. Hook-Based State Management

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

#### 5. Context Providers

React contexts provide global state management:

- `AuthProvider`: User authentication state
- `ClusterContext`: Selected cluster information
- `NotificationContext`: Application notifications
- `ErrorContext`: Global error handling

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
