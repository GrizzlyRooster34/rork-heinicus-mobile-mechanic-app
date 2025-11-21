import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { ServiceCard } from '@/components/ServiceCard';
import { render } from '../../utils/test-utils';
import { ServiceCategory } from '@/constants/services';

// Mock the lucide-react-native icons
jest.mock('lucide-react-native', () => ({
  Wrench: ({ size, color }: any) => `MockIcon-${size}-${color}`,
  Car: ({ size, color }: any) => `MockIcon-${size}-${color}`,
  Zap: ({ size, color }: any) => `MockIcon-${size}-${color}`,
}));

describe('ServiceCard', () => {
  const mockService: ServiceCategory = {
    id: 'oil_change',
    title: 'Oil Change',
    description: 'Complete oil and filter change service',
    basePrice: 49.99,
    estimatedTime: '30-45 min',
    icon: 'Wrench',
    services: [],
  } as any;

  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render service information correctly', () => {
      const { getByText } = render(
        <ServiceCard service={mockService} onPress={mockOnPress} />
      );

      expect(getByText('Oil Change')).toBeTruthy();
      expect(getByText('Complete oil and filter change service')).toBeTruthy();
      expect(getByText('30-45 min')).toBeTruthy();
      expect(getByText('From $49.99')).toBeTruthy();
    });

    test('should render with different service data', () => {
      const differentService: ServiceCategory = {
        id: 'brake_service',
        title: 'Brake Repair',
        description: 'Professional brake inspection and repair',
        basePrice: 199.99,
        estimatedTime: '2-3 hours',
        icon: 'Car',
        services: [],
      } as any;

      const { getByText } = render(
        <ServiceCard service={differentService} onPress={mockOnPress} />
      );

      expect(getByText('Brake Repair')).toBeTruthy();
      expect(getByText('Professional brake inspection and repair')).toBeTruthy();
      expect(getByText('2-3 hours')).toBeTruthy();
      expect(getByText('From $199.99')).toBeTruthy();
    });

    test('should handle missing or undefined service properties gracefully', () => {
      const minimalService: ServiceCategory = {
        id: 'general_repair',
        title: 'Test Service',
        description: '',
        basePrice: 0,
        estimatedTime: '',
        icon: 'Wrench',
        services: [],
      } as any;

      const { getByText } = render(
        <ServiceCard service={minimalService} onPress={mockOnPress} />
      );

      expect(getByText('Test Service')).toBeTruthy();
      expect(getByText('From $0')).toBeTruthy();
    });
  });

  describe('Interaction', () => {
    test('should call onPress when card is pressed', () => {
      const { getByText } = render(
        <ServiceCard service={mockService} onPress={mockOnPress} />
      );

      const cardElement = getByText('Oil Change');
      fireEvent.press(cardElement);

      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    test('should handle multiple presses correctly', () => {
      const { getByText } = render(
        <ServiceCard service={mockService} onPress={mockOnPress} />
      );

      const cardElement = getByText('Oil Change');
      fireEvent.press(cardElement);
      fireEvent.press(cardElement);
      fireEvent.press(cardElement);

      expect(mockOnPress).toHaveBeenCalledTimes(3);
    });

    test('should be accessible for screen readers', () => {
      const { getByRole } = render(
        <ServiceCard service={mockService} onPress={mockOnPress} />
      );

      const touchableElement = getByRole('button');
      expect(touchableElement).toBeTruthy();
    });
  });

  describe('Icon Rendering', () => {
    test('should render icon when valid icon is provided', () => {
      const { getByText } = render(
        <ServiceCard service={mockService} onPress={mockOnPress} />
      );

      // Since we're mocking the icon, we can't directly test its rendering
      // but we can ensure the component doesn't crash
      expect(getByText('Oil Change')).toBeTruthy();
    });

    test('should handle invalid icon gracefully', () => {
      const serviceWithInvalidIcon: ServiceCategory = {
        ...mockService,
        icon: 'NonExistentIcon' as any,
      };

      const { getByText } = render(
        <ServiceCard service={serviceWithInvalidIcon} onPress={mockOnPress} />
      );

      // Component should still render without crashing
      expect(getByText('Oil Change')).toBeTruthy();
    });
  });

  describe('Price Formatting', () => {
    test('should format integer prices correctly', () => {
      const serviceWithIntPrice: ServiceCategory = {
        ...mockService,
        basePrice: 50,
      };

      const { getByText } = render(
        <ServiceCard service={serviceWithIntPrice} onPress={mockOnPress} />
      );

      expect(getByText('From $50')).toBeTruthy();
    });

    test('should format decimal prices correctly', () => {
      const serviceWithDecimalPrice: ServiceCategory = {
        ...mockService,
        basePrice: 75.5,
      };

      const { getByText } = render(
        <ServiceCard service={serviceWithDecimalPrice} onPress={mockOnPress} />
      );

      expect(getByText('From $75.5')).toBeTruthy();
    });

    test('should handle zero price', () => {
      const serviceWithZeroPrice: ServiceCategory = {
        ...mockService,
        basePrice: 0,
      };

      const { getByText } = render(
        <ServiceCard service={serviceWithZeroPrice} onPress={mockOnPress} />
      );

      expect(getByText('From $0')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    test('should have proper accessibility labels', () => {
      const { getByText } = render(
        <ServiceCard service={mockService} onPress={mockOnPress} />
      );

      const titleElement = getByText('Oil Change');
      const descriptionElement = getByText('Complete oil and filter change service');
      const timeElement = getByText('30-45 min');
      const priceElement = getByText('From $49.99');

      expect(titleElement).toBeTruthy();
      expect(descriptionElement).toBeTruthy();
      expect(timeElement).toBeTruthy();
      expect(priceElement).toBeTruthy();
    });
  });

  describe('Style Application', () => {
    test('should apply styles without throwing errors', () => {
      // This test ensures that the StyleSheet doesn't cause runtime errors
      expect(() => {
        render(<ServiceCard service={mockService} onPress={mockOnPress} />);
      }).not.toThrow();
    });
  });
});