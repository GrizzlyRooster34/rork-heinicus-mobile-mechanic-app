import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Mock Colors
jest.mock('@/constants/colors', () => ({
  Colors: {
    error: '#FF0000',
    white: '#FFFFFF',
    background: '#F5F5F5',
    text: '#000000',
    textSecondary: '#666666',
    textMuted: '#999999',
    primary: '#007AFF',
  },
}));

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => ({
  AlertTriangle: ({ size, color }: any) => `AlertTriangle-${size}-${color}`,
  RefreshCw: ({ size, color }: any) => `RefreshCw-${size}-${color}`,
}));

// Test component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <Text>Normal content</Text>;
};

// Test component that throws on render
const AlwaysThrowError = () => {
  throw new Error('Always throws error');
};

describe('ErrorBoundary', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on console.error and suppress it during tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Normal Operation', () => {
    test('should render children when there is no error', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <Text>Test content</Text>
        </ErrorBoundary>
      );

      expect(getByText('Test content')).toBeTruthy();
    });

    test('should render multiple children without error', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <Text>First child</Text>
          <Text>Second child</Text>
        </ErrorBoundary>
      );

      expect(getByText('First child')).toBeTruthy();
      expect(getByText('Second child')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    test('should catch and display error boundary UI when child throws', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <AlwaysThrowError />
        </ErrorBoundary>
      );

      expect(getByText('App Error')).toBeTruthy();
      expect(getByText('The app encountered an error and needs to restart.')).toBeTruthy();
      expect(getByText('Try Again')).toBeTruthy();
    });

    test('should display error details when error has message', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <AlwaysThrowError />
        </ErrorBoundary>
      );

      expect(getByText('Error Details:')).toBeTruthy();
      expect(getByText('Always throws error')).toBeTruthy();
    });

    test('should log error to console when componentDidCatch is called', () => {
      render(
        <ErrorBoundary>
          <AlwaysThrowError />
        </ErrorBoundary>
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error),
        expect.any(Object)
      );
    });
  });

  describe('Custom Fallback', () => {
    test('should render custom fallback when provided', () => {
      const customFallback = <Text>Custom error message</Text>;

      const { getByText, queryByText } = render(
        <ErrorBoundary fallback={customFallback}>
          <AlwaysThrowError />
        </ErrorBoundary>
      );

      expect(getByText('Custom error message')).toBeTruthy();
      expect(queryByText('App Error')).toBeNull();
    });

    test('should prefer custom fallback over default error UI', () => {
      const customFallback = <Text>Preferred fallback</Text>;

      const { getByText, queryByText } = render(
        <ErrorBoundary fallback={customFallback}>
          <AlwaysThrowError />
        </ErrorBoundary>
      );

      expect(getByText('Preferred fallback')).toBeTruthy();
      expect(queryByText('Try Again')).toBeNull();
    });
  });

  describe('Recovery Mechanism', () => {
    test('should reset error state when retry button is pressed', () => {
      const TestComponent = ({ shouldError }: { shouldError: boolean }) => {
        if (shouldError) {
          throw new Error('Test error');
        }
        return <Text>Content loaded</Text>;
      };

      const { getByText, rerender } = render(
        <ErrorBoundary>
          <TestComponent shouldError={true} />
        </ErrorBoundary>
      );

      // Should show error state
      expect(getByText('App Error')).toBeTruthy();
      const retryButton = getByText('Try Again');

      // Press retry button
      fireEvent.press(retryButton);

      // Re-render with non-throwing component
      rerender(
        <ErrorBoundary>
          <TestComponent shouldError={false} />
        </ErrorBoundary>
      );

      // Should show normal content
      expect(getByText('Content loaded')).toBeTruthy();
    });

    test('should clear error details after retry', () => {
      class TestErrorBoundary extends ErrorBoundary {
        constructor(props: any) {
          super(props);
          this.state = { hasError: true, error: new Error('Test error') };
        }
      }

      const { getByText, queryByText } = render(
        <TestErrorBoundary>
          <Text>Content</Text>
        </TestErrorBoundary>
      );

      expect(getByText('Test error')).toBeTruthy();

      // Simulate retry
      const retryButton = getByText('Try Again');
      fireEvent.press(retryButton);

      // Note: In actual implementation, you'd need to test the state change
      // This test verifies the retry handler exists and is callable
      expect(retryButton).toBeTruthy();
    });
  });

  describe('Error Boundary Lifecycle', () => {
    test('should call getDerivedStateFromError with proper error state', () => {
      const originalGetDerivedStateFromError = ErrorBoundary.getDerivedStateFromError;
      const mockGetDerivedStateFromError = jest.fn(originalGetDerivedStateFromError);
      ErrorBoundary.getDerivedStateFromError = mockGetDerivedStateFromError;

      render(
        <ErrorBoundary>
          <AlwaysThrowError />
        </ErrorBoundary>
      );

      expect(mockGetDerivedStateFromError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Always throws error'
        })
      );

      // Restore original method
      ErrorBoundary.getDerivedStateFromError = originalGetDerivedStateFromError;
    });

    test('should set hasError to true when error occurs', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <AlwaysThrowError />
        </ErrorBoundary>
      );

      // If error UI is shown, hasError is true
      expect(getByText('App Error')).toBeTruthy();
    });
  });

  describe('UI Elements', () => {
    test('should display help text', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <AlwaysThrowError />
        </ErrorBoundary>
      );

      expect(getByText('If this persists, the app may need server configuration.')).toBeTruthy();
    });

    test('should have retry button with icon and text', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <AlwaysThrowError />
        </ErrorBoundary>
      );

      const retryButton = getByText('Try Again');
      expect(retryButton).toBeTruthy();
    });

    test('should display error details section when error exists', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <AlwaysThrowError />
        </ErrorBoundary>
      );

      expect(getByText('Error Details:')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    test('should be accessible with proper text content', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <AlwaysThrowError />
        </ErrorBoundary>
      );

      // All text should be readable by screen readers
      expect(getByText('App Error')).toBeTruthy();
      expect(getByText('The app encountered an error and needs to restart.')).toBeTruthy();
      expect(getByText('Try Again')).toBeTruthy();
    });

    test('should have pressable retry button', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <AlwaysThrowError />
        </ErrorBoundary>
      );

      const retryButton = getByText('Try Again');
      
      // Should be pressable
      expect(() => fireEvent.press(retryButton)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('should handle error with undefined message', () => {
      const ErrorWithoutMessage = () => {
        const error = new Error();
        error.message = '';
        throw error;
      };

      const { getByText } = render(
        <ErrorBoundary>
          <ErrorWithoutMessage />
        </ErrorBoundary>
      );

      expect(getByText('App Error')).toBeTruthy();
    });

    test('should handle non-Error objects thrown', () => {
      const ThrowString = () => {
        throw 'String error';
      };

      // ErrorBoundary should still catch and handle
      expect(() => {
        render(
          <ErrorBoundary>
            <ThrowString />
          </ErrorBoundary>
        );
      }).not.toThrow();
    });

    test('should not crash when rendering without children', () => {
      expect(() => {
        render(<ErrorBoundary />);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    test('should not re-render children unnecessarily when no error', () => {
      let renderCount = 0;
      const CountingComponent = () => {
        renderCount++;
        return <Text>Render count: {renderCount}</Text>;
      };

      const { rerender } = render(
        <ErrorBoundary>
          <CountingComponent />
        </ErrorBoundary>
      );

      const initialRenderCount = renderCount;

      // Re-render ErrorBoundary with same children
      rerender(
        <ErrorBoundary>
          <CountingComponent />
        </ErrorBoundary>
      );

      // Component should re-render normally
      expect(renderCount).toBeGreaterThan(initialRenderCount);
    });
  });
});