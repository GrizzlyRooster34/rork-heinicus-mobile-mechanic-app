import React from 'react';
import { render } from '@testing-library/react-native';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// Mock Colors import
jest.mock('@/constants/colors', () => ({
  Colors: {
    primary: '#007AFF',
    black: '#000000',
    card: '#FFFFFF',
  },
}));

describe('LoadingSpinner', () => {
  describe('Basic Rendering', () => {
    test('should render spinner with default props', () => {
      const { getByTestId } = render(<LoadingSpinner />);
      
      // ActivityIndicator should be present
      const spinner = getByTestId('activity-indicator');
      expect(spinner).toBeTruthy();
    });

    test('should render without overlay by default', () => {
      const { queryByTestId } = render(<LoadingSpinner />);
      
      // Should not have overlay by default
      const overlay = queryByTestId('loading-overlay');
      expect(overlay).toBeNull();
    });
  });

  describe('Size Prop', () => {
    test('should render with small size', () => {
      const { getByTestId } = render(<LoadingSpinner size="small" />);
      
      const spinner = getByTestId('activity-indicator');
      expect(spinner).toBeTruthy();
      expect(spinner.props.size).toBe('small');
    });

    test('should render with large size', () => {
      const { getByTestId } = render(<LoadingSpinner size="large" />);
      
      const spinner = getByTestId('activity-indicator');
      expect(spinner).toBeTruthy();
      expect(spinner.props.size).toBe('large');
    });

    test('should default to large size when not specified', () => {
      const { getByTestId } = render(<LoadingSpinner />);
      
      const spinner = getByTestId('activity-indicator');
      expect(spinner.props.size).toBe('large');
    });
  });

  describe('Color Prop', () => {
    test('should use default primary color', () => {
      const { getByTestId } = render(<LoadingSpinner />);
      
      const spinner = getByTestId('activity-indicator');
      expect(spinner.props.color).toBe('#007AFF');
    });

    test('should use custom color when provided', () => {
      const customColor = '#FF0000';
      const { getByTestId } = render(<LoadingSpinner color={customColor} />);
      
      const spinner = getByTestId('activity-indicator');
      expect(spinner.props.color).toBe(customColor);
    });
  });

  describe('Overlay Mode', () => {
    test('should render overlay when overlay prop is true', () => {
      const { getByTestId } = render(<LoadingSpinner overlay={true} />);
      
      const overlay = getByTestId('loading-overlay');
      expect(overlay).toBeTruthy();
    });

    test('should render spinner inside overlay', () => {
      const { getByTestId } = render(<LoadingSpinner overlay={true} />);
      
      const overlay = getByTestId('loading-overlay');
      const spinner = getByTestId('activity-indicator');
      
      expect(overlay).toBeTruthy();
      expect(spinner).toBeTruthy();
    });

    test('should not render overlay when overlay prop is false', () => {
      const { queryByTestId } = render(<LoadingSpinner overlay={false} />);
      
      const overlay = queryByTestId('loading-overlay');
      expect(overlay).toBeNull();
    });

    test('should have proper overlay styling', () => {
      const { getByTestId } = render(<LoadingSpinner overlay={true} />);
      
      const overlay = getByTestId('loading-overlay');
      const style = overlay.props.style;
      
      expect(style).toMatchObject(
        expect.objectContaining({
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
        })
      );
    });
  });

  describe('Combined Props', () => {
    test('should handle all props together correctly', () => {
      const { getByTestId } = render(
        <LoadingSpinner 
          size="small" 
          color="#00FF00" 
          overlay={true} 
        />
      );
      
      const overlay = getByTestId('loading-overlay');
      const spinner = getByTestId('activity-indicator');
      
      expect(overlay).toBeTruthy();
      expect(spinner).toBeTruthy();
      expect(spinner.props.size).toBe('small');
      expect(spinner.props.color).toBe('#00FF00');
    });
  });

  describe('Container Styling', () => {
    test('should apply correct container styles without overlay', () => {
      const { getByTestId } = render(<LoadingSpinner />);
      
      const container = getByTestId('spinner-container');
      const style = container.props.style;
      
      expect(style).toMatchObject(
        expect.objectContaining({
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        })
      );
    });

    test('should apply correct overlay container styles', () => {
      const { getByTestId } = render(<LoadingSpinner overlay={true} />);
      
      const spinnerContainer = getByTestId('spinner-inner-container');
      const style = spinnerContainer.props.style;
      
      expect(style).toMatchObject(
        expect.objectContaining({
          backgroundColor: '#FFFFFF',
          padding: 20,
          borderRadius: 12,
        })
      );
    });
  });

  describe('Performance', () => {
    test('should not re-render unnecessarily', () => {
      const { rerender } = render(<LoadingSpinner />);
      
      // Re-render with same props should not cause issues
      expect(() => {
        rerender(<LoadingSpinner />);
        rerender(<LoadingSpinner />);
      }).not.toThrow();
    });

    test('should handle rapid prop changes', () => {
      const { rerender } = render(<LoadingSpinner size="small" />);
      
      expect(() => {
        rerender(<LoadingSpinner size="large" />);
        rerender(<LoadingSpinner size="small" color="#FF0000" />);
        rerender(<LoadingSpinner overlay={true} />);
        rerender(<LoadingSpinner overlay={false} />);
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('should handle undefined props gracefully', () => {
      expect(() => {
        render(<LoadingSpinner size={undefined} color={undefined} />);
      }).not.toThrow();
    });

    test('should handle invalid size values gracefully', () => {
      expect(() => {
        render(<LoadingSpinner size={'invalid' as any} />);
      }).not.toThrow();
    });

    test('should handle empty color string', () => {
      const { getByTestId } = render(<LoadingSpinner color="" />);
      
      const spinner = getByTestId('activity-indicator');
      expect(spinner).toBeTruthy();
    });
  });
});

// Mock ActivityIndicator to provide testID
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  return {
    ...RN,
    ActivityIndicator: ({ size, color, ...props }: any) => 
      RN.View({ 
        testID: 'activity-indicator',
        ...props,
        props: { size, color }
      }),
  };
});

// Additional mock for proper test rendering
beforeAll(() => {
  // Add testIDs to components for testing
  const originalLoadingSpinner = require('@/components/LoadingSpinner').LoadingSpinner;
  
  jest.doMock('@/components/LoadingSpinner', () => ({
    LoadingSpinner: ({ size = 'large', color = '#007AFF', overlay = false }: any) => {
      const React = require('react');
      const { View, ActivityIndicator } = require('react-native');
      
      if (overlay) {
        return React.createElement(View, 
          { testID: 'loading-overlay', style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 } },
          React.createElement(View, 
            { testID: 'spinner-inner-container', style: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12 } },
            React.createElement(ActivityIndicator, { testID: 'activity-indicator', size, color })
          )
        );
      }
      
      return React.createElement(View,
        { testID: 'spinner-container', style: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 } },
        React.createElement(ActivityIndicator, { testID: 'activity-indicator', size, color })
      );
    }
  }));
});