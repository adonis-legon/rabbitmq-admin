# DeleteConfirmationDialog Component

A reusable confirmation dialog component for delete operations in the RabbitMQ Admin interface. This component provides consistent styling and behavior for destructive operations with appropriate warning messages and conditional deletion options.

## Features

- **Consistent UI**: Follows the existing Material-UI design patterns used throughout the application
- **Conditional Deletion**: Supports `if-unused` and `if-empty` parameters for safe deletion operations
- **Loading States**: Built-in loading spinner and disabled state management
- **Accessibility**: Proper ARIA labels, keyboard navigation, and focus management
- **Type Safety**: Full TypeScript support with proper type definitions
- **Comprehensive Testing**: 100% test coverage with various scenarios

## Usage

### Basic Import

```typescript
import DeleteConfirmationDialog, {
  DeleteType,
  DeleteOptions,
} from "../common/DeleteConfirmationDialog";
```

### Props Interface

```typescript
interface DeleteConfirmationDialogProps {
  open: boolean; // Controls dialog visibility
  onClose: () => void; // Called when dialog should close
  onConfirm: (options: DeleteOptions) => Promise<void>; // Called when user confirms deletion
  deleteType: DeleteType; // Type of deletion: 'exchange' | 'queue' | 'purge'
  resourceName: string; // Name of the resource being deleted
  loading?: boolean; // Shows loading spinner when true
}

interface DeleteOptions {
  ifUnused?: boolean; // Only delete if resource is unused
  ifEmpty?: boolean; // Only delete if queue is empty (queue deletion only)
}
```

### Exchange Deletion Example

```typescript
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [loading, setLoading] = useState(false);

const handleDeleteExchange = async (options: DeleteOptions) => {
  setLoading(true);
  try {
    await rabbitmqResourcesApi.deleteExchange(
      clusterId,
      vhost,
      exchangeName,
      options.ifUnused
    );
    // Show success notification
    // Refresh exchanges list
  } catch (error) {
    // Show error notification
    throw error; // Keep dialog open on error
  } finally {
    setLoading(false);
  }
};

return (
  <>
    <Button onClick={() => setDeleteDialogOpen(true)}>Delete Exchange</Button>

    <DeleteConfirmationDialog
      open={deleteDialogOpen}
      onClose={() => setDeleteDialogOpen(false)}
      onConfirm={handleDeleteExchange}
      deleteType="exchange"
      resourceName="my-exchange"
      loading={loading}
    />
  </>
);
```

### Queue Deletion Example

```typescript
const handleDeleteQueue = async (options: DeleteOptions) => {
  setLoading(true);
  try {
    await rabbitmqResourcesApi.deleteQueue(
      clusterId,
      vhost,
      queueName,
      options.ifEmpty,
      options.ifUnused
    );
    // Show success notification
    // Refresh queues list
  } catch (error) {
    // Show error notification
    throw error; // Keep dialog open on error
  } finally {
    setLoading(false);
  }
};

return (
  <DeleteConfirmationDialog
    open={deleteDialogOpen}
    onClose={() => setDeleteDialogOpen(false)}
    onConfirm={handleDeleteQueue}
    deleteType="queue"
    resourceName="my-queue"
    loading={loading}
  />
);
```

### Queue Purging Example

```typescript
const handlePurgeQueue = async (options: DeleteOptions) => {
  setLoading(true);
  try {
    await rabbitmqResourcesApi.purgeQueue(clusterId, vhost, queueName);
    // Show success notification
    // Refresh queue details
  } catch (error) {
    // Show error notification
    throw error; // Keep dialog open on error
  } finally {
    setLoading(false);
  }
};

return (
  <DeleteConfirmationDialog
    open={deleteDialogOpen}
    onClose={() => setDeleteDialogOpen(false)}
    onConfirm={handlePurgeQueue}
    deleteType="purge"
    resourceName="my-queue"
    loading={loading}
  />
);
```

## Delete Types and Options

### Exchange Deletion (`deleteType: "exchange"`)

- **Available Options**: `ifUnused`
- **Warning Message**: "This action cannot be undone. The exchange and all its bindings will be removed."
- **Conditional Option**: "Only delete if unused" - Delete only if the exchange has no bindings

### Queue Deletion (`deleteType: "queue"`)

- **Available Options**: `ifUnused`, `ifEmpty`
- **Warning Message**: "This action cannot be undone. The queue and all its messages will be removed."
- **Conditional Options**:
  - "Only delete if unused" - Delete only if the queue has no consumers
  - "Only delete if empty" - Delete only if the queue has no messages

### Queue Purging (`deleteType: "purge"`)

- **Available Options**: None
- **Warning Message**: "This action cannot be undone. All messages in the queue will be permanently removed."
- **No Conditional Options**: Purging doesn't support conditional parameters

## Error Handling

The component expects the `onConfirm` function to throw an error if the operation fails. This keeps the dialog open so the user can retry or see the error message (which should be handled by the parent component).

```typescript
const handleConfirm = async (options: DeleteOptions) => {
  try {
    await apiCall(options);
    // Success - dialog will close automatically
  } catch (error) {
    // Show error notification in parent component
    throw error; // Re-throw to keep dialog open
  }
};
```

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support with proper tab order
- **Screen Reader Support**: Proper ARIA labels and roles
- **Focus Management**: Focus is trapped within the dialog
- **Loading States**: All interactive elements are disabled during loading
- **Warning Alerts**: Important warnings are announced to screen readers

## Testing

The component includes comprehensive tests covering:

- All delete types (exchange, queue, purge)
- Conditional deletion options
- Loading states and error handling
- Accessibility features
- User interactions and callbacks

Run tests with:

```bash
npm test -- DeleteConfirmationDialog.test.tsx
```

## Integration with Existing Patterns

This component is designed to replace the inline confirmation dialogs currently used in:

- `ClusterConnectionList.tsx`
- `UserList.tsx`

It provides a more consistent and feature-rich alternative while maintaining the same visual design and user experience.
