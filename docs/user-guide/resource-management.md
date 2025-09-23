# RabbitMQ Resource Management User Guide

## Overview

The RabbitMQ Resource Management feature provides a comprehensive interface for browsing and monitoring RabbitMQ cluster resources. This read-only interface allows you to inspect connections, channels, exchanges, and queues from your assigned RabbitMQ clusters.

## Getting Started

### Prerequisites

- Valid user account with access to at least one RabbitMQ cluster
- Active cluster connection configured by an administrator
- Web browser with JavaScript enabled

### Cluster Access and User Assignments

Access to RabbitMQ clusters is controlled through user assignments configured by administrators:

- **User Assignment**: Administrators assign specific users to cluster connections
- **Role-Based Access**: Both USER and ADMINISTRATOR roles can access assigned clusters
- **Multiple Clusters**: Users can be assigned to multiple cluster connections
- **Active Clusters Only**: Only active cluster connections are accessible for resource browsing
- **Assignment Management**: User assignments can be updated when creating or modifying cluster connections

**Note**: If you don't see any clusters available, contact your administrator to verify your cluster assignments.

### Accessing Resource Management

1. **Login** to the RabbitMQ Admin application
2. **Select a cluster** from the dashboard or cluster selector
3. **Navigate** to the Resources section using either:
   - **Sidebar Menu**: Click the Resources section in the sidebar menu
   - **Direct URL**: Navigate directly to `/resources` or specific resource pages like `/resources/connections`
4. **Choose** the resource type you want to explore:
   - **Connections**: Active client connections (`/resources/connections`)
   - **Channels**: Communication channels within connections (`/resources/channels`)
   - **Exchanges**: Message routing components (`/resources/exchanges`)
   - **Queues**: Message storage and delivery queues (`/resources/queues`)

## Navigation and Interface

### Cluster Dashboard Navigation

The cluster dashboard provides access to RabbitMQ resources:

- **View Resources Button**: Navigate to the integrated resource management interface within the application

### Sidebar Navigation

The sidebar provides organized access to all application features:

**Resources Section** (requires cluster access):

- **Connections**: View all active client connections
- **Channels**: Browse channels across all connections
- **Exchanges**: Explore message routing exchanges
- **Queues**: Monitor message queues and their status

**Management Section** (admin-only):

- **Users**: Manage user accounts and permissions
- **Clusters**: Configure and manage cluster connections

Each section and resource type is represented by a consistent icon throughout the application for easy identification and navigation.

The navigation automatically:

- Highlights the currently active resource type
- Disables menu items when no cluster access is available
- Adapts to different screen sizes for mobile and tablet use

### Breadcrumb Navigation

The application includes breadcrumb navigation at the top of pages to help you understand your current location and navigate back to parent pages:

- **Dashboard**: Always available as the root navigation point with a dashboard icon (automatically included on all pages)
- **Cluster Management**: Shows when viewing cluster connection management pages
- **Resources**: Shows when viewing any resource management page
- **Current Resource**: Displays the specific resource type you're currently viewing

#### Breadcrumb Features

- **Automatic Dashboard Root**: All pages automatically include Dashboard as the first breadcrumb item
- **Consistent Icons**: Each breadcrumb item includes an appropriate icon for visual context
- **Clickable Navigation**: All breadcrumb items (except the current page) are clickable for quick navigation
- **Responsive Design**: Breadcrumbs adapt to different screen sizes and maintain readability
- **Visual Hierarchy**: Clear visual distinction between clickable and current page items

Breadcrumbs are especially useful when navigating deep into resource details, managing cluster connections, or when accessing pages via direct URLs. The Dashboard breadcrumb provides a consistent way to return to the main application overview from any page.

### Direct URL Navigation

The application supports direct URL navigation to resource pages, enabling:

- **Bookmarking**: Save direct links to specific resource types
- **Deep Linking**: Share URLs that navigate directly to resource views
- **Browser Navigation**: Use browser back/forward buttons seamlessly
- **URL Structure**:
  - Main resources page: `/resources`
  - Specific resource types: `/resources/connections`, `/resources/channels`, `/resources/exchanges`, `/resources/queues`

**Note**: Direct URL navigation requires authentication and cluster selection. If accessing a resource URL without a selected cluster, you'll be redirected to the dashboard to choose a cluster first. The application properly handles page refreshes and initial loading states to prevent premature redirects during startup.

### RabbitMQ Management UI Access

While the integrated resource browser provides comprehensive read-only access to RabbitMQ resources, you can also access the native RabbitMQ Management UI directly:

#### Accessing the Management UI

- **Direct URL Access**: Navigate directly to your cluster's management URL (typically `http://your-cluster:15672`)
- **Separate Authentication**: Use your RabbitMQ cluster credentials to log in
- **Independent Session**: Management UI sessions are separate from the main application

#### When to Use Each Interface

**Integrated Resource Browser (This Application)**:

- **Read-only monitoring**: View connections, channels, exchanges, and queues
- **Filtered views**: Use search and filtering capabilities
- **Consistent UI**: Unified interface across multiple clusters
- **Mobile-friendly**: Responsive design for mobile and tablet access

**Native RabbitMQ Management UI**:

- **Full administrative access**: Create, modify, and delete resources
- **Advanced features**: Queue purging, message publishing, policy management
- **Real-time monitoring**: Live updates and detailed statistics
- **Plugin management**: Access to RabbitMQ plugins and advanced configuration

### Resource List Interface

Each resource page provides a consistent interface with:

#### Data Table

- **Sortable columns** for easy data organization
- **Responsive design** that adapts to screen size
- **Row selection** for detailed information access
- **Visual indicators** for different states and statuses

#### Pagination Controls

- **Page size selection**: Choose 25, 50, 100, or 200 items per page
- **Page navigation**: First, previous, next, and last page buttons
- **Total count display**: Shows current page and total items
- **Jump to page**: Direct navigation to specific pages

#### Search and Filtering

- **Name search**: Filter resources by name with debounced input
- **State filters**: Filter by resource state (running, idle, flow, etc.)
- **Type filters**: Filter by resource type where applicable
- **Consistent behavior**: All list views (resources, clusters, users) use the same filtering interface
- **Smart empty states**: Distinguishes between "no data available" and "no results match filters"
- **Clear filters**: Reset all filters with a single click

#### Refresh Controls

- **Manual refresh**: Update data on demand
- **Auto-refresh**: Automatic updates at configurable intervals (15s, 30s, 1m, 5m)
- **Last updated**: Timestamp showing when data was last refreshed
- **Refresh status**: Visual indicator of refresh operations

## Resource Types

### Connections

Connections represent active client connections to your RabbitMQ cluster.

#### Connection Information

- **Connection Name**: Client-provided connection identifier
- **State**: Current connection status (running, blocked, blocking, closed)
- **Channels**: Number of channels using this connection
- **Client Info**: Application platform, product, and version
- **Network Details**: Host, port, and peer information
- **Protocol**: AMQP version and connection parameters

#### Connection States

- **🟢 Running**: Connection is active and processing messages
- **🟡 Blocked**: Connection is temporarily blocked due to resource limits
- **🔴 Blocking**: Connection is blocking other operations
- **⚫ Closed**: Connection has been terminated

#### Viewing Connection Details

1. Click on any connection row to open the detail modal
2. View comprehensive connection information including:
   - **Client Properties**: Application details and custom properties
   - **Network Statistics**: Bytes sent/received and packet counts
   - **Connection Parameters**: Timeout, frame size, and protocol details
   - **Timestamps**: Connection establishment time

### Channels

Channels are lightweight connections within a parent connection, used for message operations.

#### Channel Information

- **Channel Number**: Unique identifier within the connection
- **Connection**: Parent connection name and host
- **State**: Current channel status
- **Consumers**: Number of active consumers
- **Messages**: Unacknowledged, unconfirmed, and uncommitted message counts
- **Prefetch**: Message prefetch settings

#### Channel States

- **🟢 Running**: Channel is active and processing messages
- **🟡 Flow**: Channel is in flow control state
- **🔵 Starting**: Channel is initializing
- **🔴 Closing**: Channel is being terminated

#### Enhanced Channel Features

- **State Icons**: Visual indicators for each channel state
- **Tooltips**: Hover for detailed information about message counts and prefetch settings
- **Transaction/Confirm Chips**: Visual indicators for transactional and confirm modes
- **Connection Details**: Shows associated connection name and host information

#### Viewing Channel Details

1. Click on any channel row to open the detail modal
2. Explore detailed channel information:
   - **Consumer Details**: Active consumers with tags, queues, and acknowledgment settings
   - **Message Statistics**: Detailed message flow rates and totals
   - **Channel Configuration**: Prefetch counts, transaction modes, and user information
   - **Performance Metrics**: Acknowledgment rates, delivery statistics, and redelivery counts

### Exchanges

Exchanges route messages to queues based on routing rules and binding configurations.

#### Exchange Information

- **Exchange Name**: Unique identifier for the exchange
- **Type**: Routing algorithm (direct, fanout, topic, headers)
- **Durability**: Whether the exchange survives server restarts
- **Auto-Delete**: Whether the exchange is deleted when no longer used
- **Arguments**: Custom exchange configuration parameters

#### Exchange Types

- **Direct**: Routes messages with exact routing key matches
- **Fanout**: Routes messages to all bound queues (ignores routing key)
- **Topic**: Routes messages using wildcard pattern matching
- **Headers**: Routes messages based on header attributes

#### Viewing Exchange Details

1. Click on any exchange row to open the detail modal
2. Examine exchange configuration and bindings:
   - **Exchange Properties**: Type, durability, and custom arguments
   - **Bindings**: All queue and exchange bindings with routing keys
   - **Message Statistics**: Publish rates and message flow metrics
   - **Binding Details**: Source, destination, routing patterns, and arguments

### Queues

Queues store and deliver messages to consumers.

#### Queue Information

- **Queue Name**: Unique identifier for the queue
- **State**: Current queue status and activity level
- **Messages**: Total, ready, and unacknowledged message counts
- **Consumers**: Number of active consumers
- **Memory**: Memory usage by the queue
- **Properties**: Durability, exclusivity, and auto-delete settings

#### Queue States

- **🟢 Running**: Queue is actively processing messages
- **🟡 Idle**: Queue has no activity but is available
- **🔵 Flow**: Queue is in flow control state
- **🔴 Down**: Queue is unavailable or has errors

#### Viewing Queue Details

1. Click on any queue row to open the detail modal
2. Review comprehensive queue information:
   - **Message Statistics**: Delivery rates, publish rates, and message counts
   - **Consumer Details**: Active consumers with channels and acknowledgment modes
   - **Queue Configuration**: Arguments, policies, and node assignment
   - **Bindings**: All exchange bindings that route messages to this queue

## Features and Functionality

### Search and Filtering

#### Name Search

- Enter text in the search box to filter resources by name
- Search is debounced (300ms delay) to improve performance
- Search is case-insensitive by default
- Clear search with the "×" button or by emptying the search box
- Consistent behavior across all list views (resources, clusters, users)

#### State Filtering

- Use dropdown filters to show only resources in specific states
- Multiple states can be selected simultaneously
- State filters are resource-type specific
- Visual indicators show the current filter selections

#### Filter Persistence

- Filters are maintained when navigating between pages
- Search terms and state filters persist during auto-refresh
- Filters are reset when switching between resource types
- Use "Clear Filters" to reset all filtering options

#### Empty State Messaging

- When no data exists: Shows helpful message to create first item
- When filters don't match: Shows "No items match current filters" message
- Clear distinction helps users understand whether to adjust filters or create new items

### Pagination

#### Page Size Options

- **25 items**: Best for detailed review of individual resources
- **50 items**: Default setting balancing performance and usability
- **100 items**: Good for broader overviews
- **200 items**: Maximum page size for comprehensive views

#### Navigation Controls

- **First/Last**: Jump to the beginning or end of the dataset
- **Previous/Next**: Navigate one page at a time
- **Page Input**: Enter a specific page number to jump directly
- **Total Display**: Shows current position and total available items

### Auto-Refresh

#### Refresh Intervals

- **15 seconds**: For highly dynamic environments
- **30 seconds**: Default setting for most use cases
- **1 minute**: For stable environments with less frequent changes
- **5 minutes**: For monitoring scenarios with minimal changes
- **Manual only**: Disable auto-refresh for on-demand updates

#### Refresh Behavior

- Auto-refresh preserves current page and filter settings
- Manual refresh button available for immediate updates
- Last updated timestamp shows when data was refreshed
- Refresh status indicator shows ongoing refresh operations
- Network errors during refresh don't disrupt the current view

### Performance Optimization

#### Client-Side Caching

The application automatically caches resource data to improve performance:

- **Smart Caching**: Different cache durations for different resource types
- **Automatic Cleanup**: Expired data is automatically removed
- **Cache Invalidation**: Manual refresh clears cached data
- **Transparent Operation**: Caching works behind the scenes

#### Cache Durations

- **Connections/Channels**: 30 seconds (highly dynamic)
- **Queues**: 1 minute (moderately dynamic)
- **Exchanges**: 5 minutes (less dynamic)
- **Bindings**: 10 minutes (least dynamic)

## Troubleshooting

### Common Issues

#### "No clusters available" Message

**Problem**: Cannot access resource management features
**Solutions**:

1. Verify you have been assigned to at least one cluster
2. Check that assigned clusters are active and accessible
3. Contact your administrator to verify cluster assignments
4. Try refreshing the page or logging out and back in

#### "Cluster unavailable" Error

**Problem**: Selected cluster cannot be reached
**Solutions**:

1. Verify the cluster is running and accessible
2. Check network connectivity to the cluster
3. Try selecting a different cluster if available
4. Contact your administrator about cluster status

#### Slow Loading or Timeouts

**Problem**: Resource data takes too long to load
**Solutions**:

1. Reduce page size to load fewer items at once
2. Use name filtering to narrow down results
3. Check your network connection
4. Try refreshing the page
5. Contact support if the issue persists

#### Authentication Errors

**Problem**: "Unauthorized" or "Forbidden" errors
**Solutions**:

1. Verify you are logged in with a valid account
2. Check that your session hasn't expired
3. Ensure you have permission to access the selected cluster
4. Try logging out and logging back in
5. Contact your administrator about access permissions

#### Missing or Incorrect Data

**Problem**: Resource information appears incomplete or outdated
**Solutions**:

1. Use the manual refresh button to update data
2. Clear browser cache and reload the page
3. Verify the cluster is responding correctly
4. Check if there are any known issues with the cluster
5. Try accessing the same data from the RabbitMQ Management UI directly

### Error Recovery

#### Automatic Error Recovery

The application includes automatic error recovery features:

- **Error Boundaries**: Catch and recover from component errors
- **Automatic Retry**: Network errors trigger automatic retry attempts
- **State Reset**: Navigation between resources resets error states
- **Graceful Degradation**: Partial failures don't break the entire interface

#### Manual Recovery Steps

If you encounter persistent issues:

1. **Refresh the Page**: Use browser refresh (Ctrl+R or Cmd+R)
2. **Clear Filters**: Reset all search and filter settings
3. **Switch Clusters**: Try accessing a different cluster
4. **Logout/Login**: Clear session state and re-authenticate
5. **Clear Browser Data**: Clear cookies and local storage for the application

### Performance Tips

#### Optimizing Resource Browsing

- Use name filtering to reduce dataset size
- Choose appropriate page sizes for your use case
- Enable auto-refresh only when needed
- Close detail modals when not in use
- Use state filtering to focus on relevant resources

#### Network Considerations

- Stable network connection improves performance
- VPN connections may introduce latency
- Firewall settings should allow access to cluster management ports
- Consider network bandwidth when using large page sizes

## Configuration Options

### Auto-Refresh Settings

Auto-refresh can be configured per resource type:

1. **Toggle auto-refresh** using the switch in the refresh controls
2. **Select interval** from the dropdown (15s, 30s, 1m, 5m)
3. **Settings persist** across browser sessions
4. **Independent settings** for each resource type

### Pagination Preferences

Page size preferences are remembered:

1. **Select preferred page size** from the pagination controls
2. **Setting applies** to all resource types
3. **Persists across sessions** using browser local storage
4. **Can be changed** at any time

### Display Options

Various display options can be customized:

- **Column sorting**: Click column headers to sort data
- **Column visibility**: Some columns can be hidden on smaller screens
- **Theme**: Follows the application's overall theme settings
- **Responsive behavior**: Automatically adapts to screen size

## Security and Access Control

### Access Permissions

Resource access is controlled at multiple levels:

- **User Authentication**: Must be logged in with valid credentials
- **Cluster Assignment**: Can only access assigned clusters
- **Role-Based Access**: Minimum USER role required
- **Read-Only Access**: All resource operations are read-only

### Data Security

The application protects sensitive information:

- **Filtered Properties**: Sensitive connection properties are hidden
- **Audit Logging**: All access attempts are logged
- **Session Management**: Automatic logout on token expiration
- **Secure Communication**: All API calls use HTTPS

### Privacy Considerations

- **No Personal Data**: Resource data contains only technical information
- **Cluster Isolation**: Users can only see data from assigned clusters
- **Activity Logging**: Access patterns are logged for security monitoring
- **Data Retention**: Cached data is automatically cleaned up

## Best Practices

### Monitoring Workflows

- **Regular Monitoring**: Check resource status regularly during peak hours
- **State Awareness**: Monitor queue states and connection health
- **Performance Tracking**: Watch message rates and consumer activity
- **Capacity Planning**: Monitor memory usage and connection counts

### Efficient Navigation

- **Use Bookmarks**: Bookmark frequently accessed resource pages using direct URLs (e.g., `/resources/queues`)
- **Direct Navigation**: Use direct URLs to quickly access specific resource types
- **Native Management UI**: Access the RabbitMQ Management UI directly via cluster URLs for full administrative features not available in the integrated interface
- **Filter Strategically**: Use filters to focus on relevant resources
- **Batch Operations**: Review multiple resources before taking action
- **Context Switching**: Keep cluster context in mind when switching resources

### Troubleshooting Approach

- **Start Broad**: Begin with overview pages before drilling down
- **Follow Dependencies**: Check connections before channels, exchanges before queues
- **Use Details**: Leverage detail modals for comprehensive information
- **Cross-Reference**: Compare related resources to identify issues

## Support and Resources

### Getting Help

- **Documentation**: Refer to this guide and API documentation
- **Administrator**: Contact your RabbitMQ administrator for cluster issues
- **Support Team**: Reach out to technical support for application issues
- **Community**: Consult RabbitMQ community resources for general questions

### Additional Resources

- **RabbitMQ Documentation**: Official RabbitMQ documentation and guides
- **Management Plugin**: RabbitMQ Management Plugin documentation
- **AMQP Specification**: Understanding of AMQP protocol concepts
- **Application Logs**: Check browser console for detailed error information

### Feedback and Improvements

- **Feature Requests**: Submit suggestions for new features
- **Bug Reports**: Report issues with detailed reproduction steps
- **Usability Feedback**: Share thoughts on interface improvements
- **Performance Issues**: Report slow loading or timeout problems
