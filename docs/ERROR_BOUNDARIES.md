# Error Boundaries Documentation

This document explains the comprehensive error boundary system implemented in the Heinicus Mobile Mechanic app.

## Overview

Error boundaries are React components that catch JavaScript errors anywhere in their child component tree, log those errors, and display a fallback UI instead of the component tree that crashed.

## Available Error Boundaries

### 1. Base ErrorBoundary (`components/ErrorBoundary.tsx`)
The main error boundary component with enhanced features:
- **Error reporting**: Automatic error logging and optional crash reporting
- **Error recovery**: Retry functionality and automatic recovery
- **Error sharing**: Share error reports for debugging
- **Level-specific handling**: Different behavior for app, screen, and component levels
- **Reset mechanisms**: Reset on prop changes or manual triggers

```tsx
<ErrorBoundary 
  level="screen" 
  onError={(error, errorInfo) => console.error(error)}
  resetKeys={[userId]}
>
  <YourComponent />
</ErrorBoundary>
```

### 2. ScreenErrorBoundary (`components/error-boundaries/ScreenErrorBoundary.tsx`)
Specialized for screen-level errors with navigation fallbacks:
- **Navigation recovery**: Go back or navigate to home
- **Screen-specific messages**: Customized error messages per screen
- **Fallback routing**: Automatic routing to safe screens

```tsx
<ScreenErrorBoundary 
  screenName="Customer Dashboard" 
  fallbackRoute="/(customer)"
>
  <CustomerDashboard />
</ScreenErrorBoundary>
```

### 3. AsyncErrorBoundary (`components/error-boundaries/AsyncErrorBoundary.tsx`)
For asynchronous operations and network requests:
- **Retry functionality**: Built-in retry mechanism
- **Loading states**: Shows retry progress
- **Network-specific messages**: Connection-related error handling

```tsx
<AsyncErrorBoundary 
  onRetry={async () => await refetchData()}
  retryText="Reload Data"
>
  <DataComponent />
</AsyncErrorBoundary>
```

### 4. PaymentErrorBoundary (`components/error-boundaries/PaymentErrorBoundary.tsx`)
Specialized for payment processing errors:
- **Payment security**: Shows security notices
- **Support integration**: Contact support options
- **Payment state protection**: Ensures no double charging

```tsx
<PaymentErrorBoundary
  onPaymentError={(error) => logPaymentError(error)}
  onRetryPayment={() => retryPaymentFlow()}
  onCancelPayment={() => cancelPayment()}
>
  <PaymentModal />
</PaymentErrorBoundary>
```

## Higher-Order Components (HOCs)

### withErrorBoundary
Wraps components with appropriate error boundaries:

```tsx
// Screen-level error boundary
const SafeScreen = withScreenErrorBoundary(
  MyScreen, 
  'Screen Name', 
  '/fallback-route'
);

// Async error boundary
const SafeAsyncComponent = withAsyncErrorBoundary(
  MyAsyncComponent,
  () => refetchData()
);

// Component-level error boundary
const SafeComponent = withComponentErrorBoundary(
  MyComponent,
  (error) => logError(error)
);
```

## Error Handling Hooks

### useErrorHandler
React hook for manual error handling:

```tsx
function MyComponent() {
  const { handleError, hasError, clearError, retry } = useErrorHandler({
    showAlert: true,
    logError: true,
    context: 'my_component'
  });

  const handleAsyncOperation = async () => {
    try {
      await riskyOperation();
    } catch (error) {
      handleError(error);
    }
  };

  if (hasError) {
    return <ErrorView onRetry={() => retry(handleAsyncOperation)} />;
  }

  return <NormalView />;
}
```

### Specialized Hooks
- **useAsyncErrorHandler()**: For async operations
- **useNetworkErrorHandler()**: For network requests  
- **usePaymentErrorHandler()**: For payment processing

## Error Reporting Service

### Configuration
```tsx
import { errorReporting } from '@/services/error-reporting';

// Configure error reporting
errorReporting.updateConfig({
  enabled: true,
  endpoint: 'https://api.example.com/errors',
  apiKey: 'your-api-key',
  maxReports: 100,
  retryAttempts: 3,
  reportingLevel: 'error'
});
```

### Manual Error Reporting
```tsx
// Report errors manually
await reportError(new Error('Something went wrong'), 'user_action');

// Report custom errors
await reportCustomError('Custom error message', 'payment_flow', 'error', {
  userId: '123',
  amount: 100
});
```

## Implementation Examples

### 1. App-Level Protection
```tsx
// app/_layout.tsx
function AppContent() {
  return (
    <ErrorBoundary 
      level="app" 
      onError={handleAppError}
      resetKeys={[isReady]}
    >
      <Stack />
    </ErrorBoundary>
  );
}
```

### 2. Screen-Level Protection
```tsx
// app/(customer)/quotes.tsx
function CustomerQuotesScreen() {
  const { handleError } = useErrorHandler({ 
    showAlert: true, 
    context: 'customer_quotes_screen' 
  });

  // Component logic with error handling
}

export default withScreenErrorBoundary(
  CustomerQuotesScreen, 
  'Customer Quotes', 
  '/(customer)'
);
```

### 3. Component-Level Protection
```tsx
// components/ServiceCard.tsx
function ServiceCard({ service, onPress }: ServiceCardProps) {
  // Component logic
}

export const ServiceCardWithErrorBoundary = withComponentErrorBoundary(
  ServiceCard,
  (error, errorInfo) => {
    console.error('ServiceCard error:', error, errorInfo);
  }
);
```

### 4. Payment Protection
```tsx
// components/PaymentModal.tsx
export function PaymentModal(props: PaymentModalProps) {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <PaymentErrorBoundary
        onPaymentError={(error) => logPaymentError(error)}
        onRetryPayment={() => retryPaymentFlow()}
        onCancelPayment={props.onCancel}
      >
        <PaymentModalContent {...props} />
      </PaymentErrorBoundary>
    </StripeProvider>
  );
}
```

## Best Practices

### 1. Error Boundary Hierarchy
```
App Level ErrorBoundary
├── Screen Level ErrorBoundary
│   ├── Component Level ErrorBoundary
│   │   └── Individual Components
│   └── Async ErrorBoundary
│       └── Data Components
└── Payment ErrorBoundary
    └── Payment Components
```

### 2. Error Handling Strategy
- **App Level**: Critical errors that crash the entire app
- **Screen Level**: Screen-specific errors with navigation fallbacks
- **Component Level**: Isolated component failures
- **Async Level**: Network and data loading errors
- **Payment Level**: Payment processing errors with security considerations

### 3. Error Recovery
- **Automatic Recovery**: Use `resetKeys` for automatic error boundary reset
- **Manual Recovery**: Provide retry buttons and recovery actions
- **Progressive Recovery**: Fallback from specific to general error handlers

### 4. Error Reporting
- **Development**: Log detailed errors to console
- **Production**: Send errors to crash reporting service
- **User Feedback**: Provide clear, actionable error messages

## Testing Error Boundaries

### Unit Tests
```tsx
// __tests__/unit/components/ErrorBoundary.test.tsx
describe('ErrorBoundary', () => {
  it('should catch and display errors', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(getByText('Component Error')).toBeTruthy();
  });
});
```

### Integration Tests
```tsx
// __tests__/integration/error-handling.test.tsx
describe('Error Handling Integration', () => {
  it('should handle payment errors gracefully', async () => {
    // Test payment error scenarios
  });
});
```

## Monitoring and Analytics

### Error Metrics
- Error frequency by component
- Error recovery success rates
- User impact of errors
- Error trend analysis

### Dashboard Integration
- Real-time error monitoring
- Error categorization
- User feedback on errors
- Error resolution tracking

## Configuration

### Environment Variables
```env
# Error Reporting
ERROR_REPORTING_ENABLED=true
ERROR_REPORTING_ENDPOINT=https://api.example.com/errors
ERROR_REPORTING_API_KEY=your-api-key
ERROR_REPORTING_LEVEL=error
```

### Runtime Configuration
```tsx
// Configure based on environment
if (process.env.NODE_ENV === 'production') {
  errorReporting.updateConfig({
    enabled: true,
    endpoint: process.env.ERROR_REPORTING_ENDPOINT,
    apiKey: process.env.ERROR_REPORTING_API_KEY,
  });
}
```

This comprehensive error boundary system ensures the app remains stable and provides excellent user experience even when errors occur.