import React from 'react';
import { ScreenErrorBoundary } from './ScreenErrorBoundary';
import { AsyncErrorBoundary } from './AsyncErrorBoundary';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export interface WithErrorBoundaryOptions {
  level?: 'app' | 'screen' | 'component';
  screenName?: string;
  fallbackRoute?: string;
  enableAsyncRetry?: boolean;
  onRetry?: () => void | Promise<void>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
) {
  const {
    level = 'screen',
    screenName,
    fallbackRoute,
    enableAsyncRetry = false,
    onRetry,
    onError,
  } = options;

  const WrappedComponent = React.forwardRef<any, P>((props, ref) => {
    if (level === 'screen') {
      return (
        <ScreenErrorBoundary
          screenName={screenName}
          fallbackRoute={fallbackRoute}
        >
          <Component {...(props as any)} ref={ref} />
        </ScreenErrorBoundary>
      );
    }

    if (enableAsyncRetry) {
      return (
        <AsyncErrorBoundary onRetry={onRetry}>
          <Component {...(props as any)} ref={ref} />
        </AsyncErrorBoundary>
      );
    }

    return (
      <ErrorBoundary
        level={level}
        onError={onError}
      >
        <Component {...(props as any)} ref={ref} />
      </ErrorBoundary>
    );
  });

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Convenience HOCs for common use cases
export const withScreenErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  screenName?: string,
  fallbackRoute?: string
) => withErrorBoundary(Component, { 
  level: 'screen', 
  screenName, 
  fallbackRoute 
});

export const withAsyncErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  onRetry?: () => void | Promise<void>
) => withErrorBoundary(Component, { 
  enableAsyncRetry: true, 
  onRetry 
});

export const withComponentErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) => withErrorBoundary(Component, { 
  level: 'component', 
  onError 
});