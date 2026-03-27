# Loading States Documentation

This document explains the comprehensive loading state system implemented in the Heinicus Mobile Mechanic app.

## Overview

The loading state system provides a complete solution for managing async operations, user feedback, and loading indicators throughout the app. It includes components, hooks, and utilities for different loading scenarios.

## Core Components

### 1. LoadingState (`components/LoadingState.tsx`)

Generic loading state component with multiple display modes.

```tsx
<LoadingState
  isLoading={isLoading}
  error={error}
  empty={!data?.length}
  emptyMessage="No items found"
  emptyIcon="Inbox"
  loadingMessage="Loading items..."
  size="medium"
>
  <YourContent />
</LoadingState>
```

**Props:**
- `isLoading` - Show loading spinner
- `error` - Error message to display
- `empty` - Show empty state
- `emptyMessage` - Custom empty message
- `emptyIcon` - Icon for empty state
- `loadingMessage` - Custom loading message
- `size` - Component size (small, medium, large)

### 2. LoadingOverlay (`components/LoadingState.tsx`)

Modal loading overlay for blocking operations.

```tsx
<LoadingOverlay
  visible={isProcessing}
  message="Processing payment..."
  transparent={false}
/>
```

### 3. LoadingButton (`components/LoadingState.tsx`)

Button with integrated loading state.

```tsx
<LoadingButton
  title="Save Changes"
  loadingTitle="Saving..."
  isLoading={isSaving}
  onPress={handleSave}
  variant="primary"
  size="medium"
/>
```

### 4. LoadingSkeleton (`components/LoadingSkeleton.tsx`)

Animated skeleton loading components.

```tsx
// Basic skeleton
<Skeleton width="100%" height={20} borderRadius={4} />

// Pre-built skeleton cards
<SkeletonServiceCard />
<SkeletonQuoteCard />
<SkeletonList itemCount={5} />
```

## Core Hooks

### 1. useAsyncState (`hooks/useAsyncState.ts`)

General-purpose hook for managing async operations.

```tsx
function MyComponent() {
  const { execute, isLoading, error, data, reset } = useAsyncState({
    onSuccess: (result) => console.log('Success:', result),
    onError: (error) => console.error('Error:', error),
  });

  const handleLoad = async () => {
    try {
      await execute(async () => {
        const response = await fetch('/api/data');
        return response.json();
      });
    } catch (error) {
      // Error handling is managed by the hook
    }
  };

  if (isLoading) return <LoadingState isLoading />;
  if (error) return <LoadingState error={error} />;
  
  return <DataComponent data={data} />;
}
```

### 2. useNetworkState (`hooks/useNetworkState.ts`)

Specialized hook for network operations with retry logic.

```tsx
function ApiComponent() {
  const { execute, isLoading, error, retryCount } = useNetworkState({
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 10000,
    showErrorAlert: true,
  });

  const fetchData = async () => {
    await execute(async (signal) => {
      const response = await fetch('/api/data', { signal });
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    });
  };

  return (
    <View>
      <LoadingButton
        title="Fetch Data"
        loadingTitle={`Fetching... ${retryCount > 0 ? `(Retry ${retryCount})` : ''}`}
        isLoading={isLoading}
        onPress={fetchData}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}
```

### 3. useDatabase (`hooks/useDatabase.ts`)

Database operation hooks with loading states.

```tsx
function UserProfile({ userId }) {
  const { loadUsers, isLoading, error, data } = useUsers();
  const vehicles = useVehicles(userId);

  useEffect(() => {
    loadUsers();
    if (userId) {
      vehicles.loadVehicles();
    }
  }, [userId]);

  return (
    <LoadingState isLoading={isLoading} error={error}>
      <UserList users={data} />
      <LoadingState isLoading={vehicles.isLoading} error={vehicles.error}>
        <VehicleList vehicles={vehicles.data} />
      </LoadingState>
    </LoadingState>
  );
}
```

## Global Loading Management

### LoadingProvider (`components/LoadingManager.tsx`)

Global loading state management with priority-based overlays.

```tsx
// App root setup
function App() {
  return (
    <LoadingProvider globalOverlay={true} maxDisplayTime={30000}>
      <YourApp />
    </LoadingProvider>
  );
}

// Using global loading
function PaymentScreen() {
  const { showLoading, hideLoading, isLoading } = useLoading();

  const processPayment = async () => {
    showLoading('payment', 'Processing payment...', 'high');
    try {
      await paymentAPI.process();
    } finally {
      hideLoading('payment');
    }
  };

  return (
    <LoadingButton
      title="Pay Now"
      isLoading={isLoading('payment')}
      onPress={processPayment}
    />
  );
}
```

### useLoadingState Hook

Manages specific loading states.

```tsx
function ServiceScreen() {
  const loading = useLoadingState('service-operations');

  const handleServiceAction = async () => {
    loading.show('Starting service...', 'medium');
    try {
      await serviceAPI.start();
      loading.update('Service in progress...');
      await serviceAPI.complete();
    } finally {
      loading.hide();
    }
  };

  return (
    <LoadingButton
      title="Start Service"
      isLoading={loading.isLoading}
      onPress={handleServiceAction}
    />
  );
}
```

## Implementation Examples

### 1. Chat Component with Message Loading

```tsx
// components/ChatComponent.tsx
function ChatComponent() {
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const loadMessages = async () => {
      setIsLoadingMessages(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessages(mockMessages);
      setIsLoadingMessages(false);
    };
    loadMessages();
  }, []);

  return (
    <View>
      <ScrollView>
        {isLoadingMessages ? (
          <SkeletonList itemCount={3} />
        ) : (
          messages.map(message => <MessageBubble key={message.id} {...message} />)
        )}
      </ScrollView>
      
      <LoadingButton
        title="Send"
        isLoading={isSending}
        onPress={sendMessage}
        disabled={!newMessage.trim()}
      />
    </View>
  );
}
```

### 2. Quote Screen with Async Actions

```tsx
// app/(customer)/quotes.tsx
function CustomerQuotesScreen() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const paymentOperation = useAsyncState();

  const handlePaymentSuccess = async (quoteId) => {
    await paymentOperation.execute(async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      updateQuote(quoteId, { status: 'accepted' });
      return { success: true };
    });
  };

  if (isInitialLoading) {
    return (
      <View>
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonQuoteCard key={index} />
        ))}
      </View>
    );
  }

  return (
    <ScrollView>
      {quotes.map(quote => (
        <QuoteCard key={quote.id}>
          <LoadingButton
            title="Accept & Pay"
            loadingTitle="Processing..."
            isLoading={paymentOperation.isLoading}
            onPress={() => handlePaymentSuccess(quote.id)}
          />
        </QuoteCard>
      ))}
    </ScrollView>
  );
}
```

### 3. Payment Modal with Overlay

```tsx
// components/PaymentModal.tsx
function PaymentModal() {
  const stripePayment = useStripePayment();

  return (
    <Modal>
      <View>
        {/* Payment form */}
        <LoadingButton
          title={`Pay $${amount}`}
          loadingTitle="Processing Payment..."
          isLoading={stripePayment.isProcessing}
          onPress={handlePayment}
          variant="primary"
        />
      </View>
      
      <LoadingOverlay
        visible={stripePayment.isProcessing}
        message="Processing your payment securely..."
        transparent={false}
      />
    </Modal>
  );
}
```

## Best Practices

### 1. Loading State Hierarchy

```
Global Loading (High Priority)
├── Screen Loading (Medium Priority)
│   ├── Component Loading (Low Priority)
│   └── Action Loading (Medium Priority)
└── Network Loading (Medium Priority)
```

### 2. Loading Message Guidelines

- **Specific**: "Processing payment..." not "Loading..."
- **Progressive**: Update messages during long operations
- **Contextual**: Match message to user action
- **Reassuring**: "Securely processing..." for sensitive operations

### 3. Skeleton Loading

Use skeletons for:
- Initial page loads
- Content that has predictable structure
- List items and cards
- Profile information

Avoid skeletons for:
- Button actions
- Form submissions
- Critical error states

### 4. Error Handling with Loading

```tsx
function DataComponent() {
  const { execute, isLoading, error, data } = useAsyncState({
    onError: (error) => {
      // Log error for debugging
      console.error('Data loading failed:', error);
      
      // Show user-friendly message
      Alert.alert('Loading Failed', 'Please try again');
    },
  });

  return (
    <LoadingState
      isLoading={isLoading}
      error={error}
      empty={!data?.length}
      emptyMessage="No data available"
    >
      <DataList data={data} />
    </LoadingState>
  );
}
```

### 5. Performance Considerations

- Use `useCallback` for loading functions
- Implement request cancellation for network operations
- Set reasonable timeouts (10-30 seconds)
- Clean up loading states on component unmount
- Batch multiple loading states when appropriate

### 6. Accessibility

- Ensure loading states are announced by screen readers
- Provide alternative content for loading animations
- Use appropriate ARIA labels and live regions
- Test with accessibility tools

## Configuration

### Environment Variables

```env
# Loading timeouts
DEFAULT_REQUEST_TIMEOUT=10000
MAX_RETRY_ATTEMPTS=3
LOADING_SKELETON_ANIMATION_DURATION=1000

# Error handling
SHOW_LOADING_ERROR_ALERTS=true
AUTO_HIDE_LOADING_AFTER=30000
```

### Customization

```tsx
// Custom loading component
const CustomLoader = ({ message, progress }) => (
  <View style={styles.loader}>
    <ProgressBar progress={progress} />
    <Text>{message}</Text>
  </View>
);

// Use with LoadingState
<LoadingState
  isLoading={true}
  loadingComponent={<CustomLoader message="Custom loading..." progress={0.5} />}
>
  <Content />
</LoadingState>
```

This comprehensive loading state system ensures excellent user experience during async operations while maintaining code organization and reusability.