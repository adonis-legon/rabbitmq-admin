# Notification System

The RabbitMQ Admin application includes a comprehensive notification system that provides consistent user feedback for all operations, particularly write operations like creating, modifying, and deleting resources.

## Overview

The notification system ensures users receive clear, actionable feedback for all operations with:

- **Consistent messaging patterns** across all resource types
- **Context-aware error handling** with specific guidance
- **Automatic duration management** based on message complexity
- **HTTP status code translation** to user-friendly messages
- **Operation-specific feedback** for different types of actions

## Notification Types

### Success Notifications

Success notifications confirm that operations completed successfully:

- **Resource Creation**: "Exchange 'user-events' created successfully"
- **Resource Deletion**: "Queue 'test-queue' deleted successfully"
- **Message Publishing**: "Message published to exchange 'user-events' and routed successfully"
- **Message Consumption**: "Retrieved 5 messages from queue 'test-queue' (acknowledged and removed)"

### Warning Notifications

Warning notifications indicate operations that completed but may need attention:

- **Unrouted Messages**: "Message published to exchange 'user-events' but was not routed to any queue"
- **Conditional Operations**: Operations that were skipped due to conditions (if-empty, if-unused)

### Error Notifications

Error notifications provide specific guidance based on the type of error:

#### Authentication Errors (401)

- **Message**: "Your session has expired. Please log in again."
- **Action**: Automatic redirect to login page

#### Permission Errors (403)

- **Message**: "You do not have permission to create exchanges on this cluster"
- **Action**: Contact administrator for proper role assignment

#### Validation Errors (400, 422)

- **Message**: "Invalid exchange configuration. Please check your inputs."
- **Action**: Review form inputs and correct validation errors

#### Resource Conflicts (409)

- **Message**: "Exchange 'user-events' already exists"
- **Action**: Choose a different name or modify existing resource

#### Precondition Failures (412)

- **Message**: "Cannot delete queue 'test-queue' because it is in use or has dependencies"
- **Action**: Remove consumers or dependencies before deletion

#### Rate Limiting (429)

- **Message**: "Too many requests. Please wait a moment and try again."
- **Action**: Wait before retrying the operation

#### Server Errors (5xx)

- **Message**: "Server error occurred while creating exchange. Please try again later."
- **Action**: Retry operation or contact support if persistent

## Notification Duration

The system automatically adjusts notification display duration based on:

- **Message Type**:

  - Success: 4 seconds
  - Info: 6 seconds
  - Warning: 8 seconds
  - Error: 10 seconds

- **Message Length**: Longer messages get extended display time (up to 3 additional seconds)

## Special Operation Feedback

### Message Publishing

Message publishing operations provide specific routing feedback:

- **Successful Routing**: Green notification confirming message was routed to queues
- **No Routing**: Orange warning when message wasn't routed to any queue
- **Routing Key Display**: Shows the routing key used for the operation

### Message Consumption

Message consumption operations show detailed acknowledgment information:

- **Message Count**: Number of messages retrieved
- **Acknowledgment Mode**: How messages were processed:
  - "acknowledged and removed" - Messages permanently consumed
  - "acknowledged and requeued" - Messages returned to queue for testing
  - "rejected and removed" - Messages rejected and discarded
  - "rejected and requeued" - Messages rejected but returned to queue

### Binding Operations

Binding creation shows the relationship being established:

- **Source and Destination**: Clear indication of what's being connected
- **Routing Key**: The routing pattern being used
- **Destination Type**: Whether binding to queue or exchange

## Virtual Host Display

Virtual host names are formatted for clarity:

- **Default Virtual Host**: "/" displays as "/ (default)"
- **Named Virtual Hosts**: Display as-is (e.g., "production", "staging")

## Integration with Components

All write operation components integrate with the notification system:

1. **Form Validation**: Real-time validation errors with specific guidance
2. **Operation Feedback**: Success/error notifications for all operations
3. **Loading States**: Clear indication of operations in progress
4. **Error Recovery**: Actionable error messages with retry guidance

## Best Practices

### For Users

- **Read Error Messages Carefully**: Error messages provide specific guidance for resolution
- **Wait for Confirmations**: Success notifications confirm operations completed
- **Check Routing Results**: Pay attention to message routing feedback
- **Review Validation Errors**: Form validation helps prevent common mistakes

### For Developers

- **Use Consistent Patterns**: Follow established notification patterns for new features
- **Provide Context**: Include resource names and operation types in messages
- **Handle All Status Codes**: Ensure all HTTP status codes have appropriate user messages
- **Test Error Scenarios**: Verify error messages are helpful and actionable

## Troubleshooting

### Common Issues

**Notifications Not Appearing**

- Check browser notification permissions
- Verify JavaScript is enabled
- Check for browser console errors

**Error Messages Too Generic**

- May indicate server-side error without specific details
- Check application logs for more information
- Contact support with operation details

**Notifications Disappearing Too Quickly**

- Longer messages automatically get extended display time
- Error messages stay visible longer than success messages
- Click notification area to keep it visible longer (if supported)

## Future Enhancements

Planned improvements to the notification system:

- **Persistent Notifications**: Option to keep important notifications visible
- **Notification History**: View recent notifications and their details
- **Custom Duration Settings**: User preference for notification display time
- **Sound Notifications**: Optional audio feedback for important operations
- **Batch Operation Feedback**: Summary notifications for multiple operations
