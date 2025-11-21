import React from 'react';
import { render, act } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { OfflineIndicator } from '@/components/OfflineIndicator';

// Mock Colors
jest.mock('@/constants/colors', () => ({
  Colors: {
    error: '#FF0000',
    white: '#FFFFFF',
  },
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  WifiOff: ({ size, color }: any) => `WifiOff-${size}-${color}`,
}));

// Mock Platform
const mockPlatform = Platform as any;

describe('OfflineIndicator', () => {
  let originalNavigator: Navigator;
  let mockNavigator: any;

  beforeEach(() => {
    // Store original navigator
    originalNavigator = global.navigator;
    
    // Create mock navigator
    mockNavigator = {
      onLine: true,
    };
    
    // Mock global navigator
    Object.defineProperty(global, 'navigator', {
      writable: true,
      value: mockNavigator,
    });

    // Mock window event listeners
    global.addEventListener = jest.fn();
    global.removeEventListener = jest.fn();
  });

  afterEach(() => {
    // Restore original navigator
    global.navigator = originalNavigator;
    jest.clearAllMocks();
  });

  describe('Online State', () => {
    test('should not render when online', () => {
      mockPlatform.OS = 'web';
      mockNavigator.onLine = true;

      const { queryByText } = render(<OfflineIndicator />);
      expect(queryByText(/offline/i)).toBeNull();
    });

    test('should return null when connection is available', () => {
      mockPlatform.OS = 'web';
      mockNavigator.onLine = true;

      const { queryByText } = render(<OfflineIndicator />);
      expect(queryByText('You are offline')).toBeNull();
    });
  });

  describe('Offline State', () => {
    test('should render offline indicator when offline', async () => {
      mockPlatform.OS = 'web';
      mockNavigator.onLine = false;

      const { getByText } = render(<OfflineIndicator />);
      
      expect(getByText('You are offline')).toBeTruthy();
    });

    test('should display offline icon and text', async () => {
      mockPlatform.OS = 'web';
      mockNavigator.onLine = false;

      const { getByText } = render(<OfflineIndicator />);
      
      expect(getByText('You are offline')).toBeTruthy();
      // Icon is mocked, so we just verify the text is present
    });
  });

  describe('Web Platform Event Listeners', () => {
    test('should set up event listeners on web platform', () => {
      mockPlatform.OS = 'web';
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      render(<OfflineIndicator />);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    test('should check initial online state', () => {
      mockPlatform.OS = 'web';
      mockNavigator.onLine = false;

      const { getByText } = render(<OfflineIndicator />);
      
      expect(getByText('You are offline')).toBeTruthy();
    });

    test('should clean up event listeners on unmount', () => {
      mockPlatform.OS = 'web';
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(<OfflineIndicator />);
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    test('should update state when online event fires', async () => {
      mockPlatform.OS = 'web';
      mockNavigator.onLine = false;
      
      let onlineHandler: () => void;
      jest.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
        if (event === 'online') {
          onlineHandler = handler as () => void;
        }
      });

      const { queryByText, rerender } = render(<OfflineIndicator />);
      
      // Initially offline
      expect(queryByText('You are offline')).toBeTruthy();
      
      // Simulate going online
      act(() => {
        onlineHandler!();
      });
      
      rerender(<OfflineIndicator />);
      
      // Should not show offline indicator
      expect(queryByText('You are offline')).toBeNull();
    });

    test('should update state when offline event fires', async () => {
      mockPlatform.OS = 'web';
      mockNavigator.onLine = true;
      
      let offlineHandler: () => void;
      jest.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
        if (event === 'offline') {
          offlineHandler = handler as () => void;
        }
      });

      const { queryByText, rerender } = render(<OfflineIndicator />);
      
      // Initially online (nothing shown)
      expect(queryByText('You are offline')).toBeNull();
      
      // Simulate going offline
      act(() => {
        offlineHandler!();
      });
      
      rerender(<OfflineIndicator />);
      
      // Should show offline indicator
      expect(queryByText('You are offline')).toBeTruthy();
    });
  });

  describe('Mobile Platform', () => {
    test('should handle mobile platform gracefully', () => {
      mockPlatform.OS = 'ios';
      
      expect(() => {
        render(<OfflineIndicator />);
      }).not.toThrow();
    });

    test('should not set up web event listeners on mobile', () => {
      mockPlatform.OS = 'android';
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      render(<OfflineIndicator />);
      
      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });

    test('should return empty cleanup function on mobile', () => {
      mockPlatform.OS = 'ios';
      
      expect(() => {
        const { unmount } = render(<OfflineIndicator />);
        unmount();
      }).not.toThrow();
    });
  });

  describe('Styling', () => {
    test('should apply correct styles when offline', () => {
      mockPlatform.OS = 'web';
      mockNavigator.onLine = false;

      const { getByText } = render(<OfflineIndicator />);
      
      const textElement = getByText('You are offline');
      expect(textElement).toBeTruthy();
      
      // Verify the component renders without style errors
      expect(textElement.props.style).toBeDefined();
    });

    test('should have proper container styling', () => {
      mockPlatform.OS = 'web';
      mockNavigator.onLine = false;

      const { getByText } = render(<OfflineIndicator />);
      
      const textElement = getByText('You are offline');
      const container = textElement.parent;
      
      expect(container).toBeTruthy();
    });
  });

  describe('Component Lifecycle', () => {
    test('should handle multiple mount/unmount cycles', () => {
      mockPlatform.OS = 'web';
      
      expect(() => {
        const { unmount, rerender } = render(<OfflineIndicator />);
        unmount();
        rerender(<OfflineIndicator />);
        unmount();
      }).not.toThrow();
    });

    test('should maintain state consistency across re-renders', () => {
      mockPlatform.OS = 'web';
      mockNavigator.onLine = false;

      const { getByText, rerender } = render(<OfflineIndicator />);
      
      expect(getByText('You are offline')).toBeTruthy();
      
      rerender(<OfflineIndicator />);
      
      expect(getByText('You are offline')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing navigator gracefully', () => {
      mockPlatform.OS = 'web';
      
      // Remove navigator
      delete (global as any).navigator;
      
      expect(() => {
        render(<OfflineIndicator />);
      }).not.toThrow();
    });

    test('should handle event listener errors gracefully', () => {
      mockPlatform.OS = 'web';
      
      // Mock addEventListener to throw
      jest.spyOn(window, 'addEventListener').mockImplementation(() => {
        throw new Error('Event listener error');
      });
      
      expect(() => {
        render(<OfflineIndicator />);
      }).not.toThrow();
    });

    test('should handle removeEventListener errors gracefully', () => {
      mockPlatform.OS = 'web';
      
      // Mock removeEventListener to throw
      jest.spyOn(window, 'removeEventListener').mockImplementation(() => {
        throw new Error('Remove event listener error');
      });
      
      expect(() => {
        const { unmount } = render(<OfflineIndicator />);
        unmount();
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    test('should provide accessible text content', () => {
      mockPlatform.OS = 'web';
      mockNavigator.onLine = false;

      const { getByText } = render(<OfflineIndicator />);
      
      const text = getByText('You are offline');
      expect(text).toBeTruthy();
      expect(text.props.children).toBe('You are offline');
    });

    test('should be visible to screen readers when offline', () => {
      mockPlatform.OS = 'web';
      mockNavigator.onLine = false;

      const { getByText } = render(<OfflineIndicator />);
      
      // Text should be accessible
      expect(getByText('You are offline')).toBeTruthy();
    });
  });
});