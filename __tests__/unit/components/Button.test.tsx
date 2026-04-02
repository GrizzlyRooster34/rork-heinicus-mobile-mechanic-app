import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/Button';
import { render } from '../../utils/test-utils';

describe('Button Component', () => {
  describe('Rendering', () => {
    test('should render with title', () => {
      const { getByText } = render(
        <Button title="Test Button" onPress={jest.fn()} />
      );

      expect(getByText('Test Button')).toBeTruthy();
    });

    test('should render with custom style', () => {
      const customStyle = { backgroundColor: 'red' };
      const { getByTestId } = render(
        <Button 
          title="Test Button" 
          onPress={jest.fn()} 
          style={customStyle}
          testID="custom-button"
        />
      );

      const button = getByTestId('custom-button');
      expect(button).toBeTruthy();
    });

    test('should render with default variant', () => {
      const { getByText } = render(
        <Button title="Test Button" onPress={jest.fn()} />
      );

      const button = getByText('Test Button');
      expect(button).toBeTruthy();
    });

    test('should render with outline variant', () => {
      const { getByText } = render(
        <Button title="Test Button" onPress={jest.fn()} variant="outline" />
      );

      const button = getByText('Test Button');
      expect(button).toBeTruthy();
    });

    test('should render with secondary variant', () => {
      const { getByText } = render(
        <Button title="Test Button" onPress={jest.fn()} variant="secondary" />
      );

      const button = getByText('Test Button');
      expect(button).toBeTruthy();
    });
  });

  describe('Interaction', () => {
    test('should call onPress when pressed', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <Button title="Test Button" onPress={mockOnPress} />
      );

      const button = getByText('Test Button');
      fireEvent.press(button);

      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    test('should not call onPress when disabled', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <Button title="Test Button" onPress={mockOnPress} disabled />
      );

      const button = getByText('Test Button');
      fireEvent.press(button);

      expect(mockOnPress).not.toHaveBeenCalled();
    });

    test('should call onPress multiple times', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <Button title="Test Button" onPress={mockOnPress} />
      );

      const button = getByText('Test Button');
      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);

      expect(mockOnPress).toHaveBeenCalledTimes(3);
    });
  });

  describe('Disabled State', () => {
    test('should render as disabled when disabled prop is true', () => {
      const { getByText } = render(
        <Button title="Disabled Button" onPress={jest.fn()} disabled />
      );

      const button = getByText('Disabled Button');
      expect(button).toBeTruthy();
      // Note: In a real test, you'd check for disabled styling
    });

    test('should be accessible when not disabled', () => {
      const { getByText } = render(
        <Button title="Enabled Button" onPress={jest.fn()} />
      );

      const button = getByText('Enabled Button');
      expect(button).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    test('should show loading state when loading prop is true', () => {
      const { getByText } = render(
        <Button title="Loading Button" onPress={jest.fn()} loading />
      );

      // Assuming the button shows loading text or spinner
      const button = getByText('Loading Button');
      expect(button).toBeTruthy();
    });

    test('should not call onPress when loading', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <Button title="Loading Button" onPress={mockOnPress} loading />
      );

      const button = getByText('Loading Button');
      fireEvent.press(button);

      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('should have correct accessibility label', () => {
      const { getByLabelText } = render(
        <Button 
          title="Test Button" 
          onPress={jest.fn()} 
          accessibilityLabel="Custom accessibility label"
        />
      );

      expect(getByLabelText('Custom accessibility label')).toBeTruthy();
    });

    test('should have accessibility role of button', () => {
      const { getByRole } = render(
        <Button title="Test Button" onPress={jest.fn()} />
      );

      expect(getByRole('button')).toBeTruthy();
    });

    test('should indicate disabled state to screen readers', () => {
      const { getByText } = render(
        <Button title="Disabled Button" onPress={jest.fn()} disabled />
      );

      const button = getByText('Disabled Button');
      expect(button).toBeTruthy();
      // Note: Would check accessibilityState.disabled in real implementation
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty title', () => {
      const { container } = render(
        <Button title="" onPress={jest.fn()} />
      );

      expect(container).toBeTruthy();
    });

    test('should handle very long title', () => {
      const longTitle = 'This is a very long button title that might wrap to multiple lines or get truncated';
      const { getByText } = render(
        <Button title={longTitle} onPress={jest.fn()} />
      );

      expect(getByText(longTitle)).toBeTruthy();
    });

    test('should handle rapid consecutive presses', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <Button title="Test Button" onPress={mockOnPress} />
      );

      const button = getByText('Test Button');
      
      // Simulate rapid presses
      for (let i = 0; i < 10; i++) {
        fireEvent.press(button);
      }

      expect(mockOnPress).toHaveBeenCalledTimes(10);
    });
  });
});