/* eslint-env jest */

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
// Mock by suppressing the console warning instead
jest.spyOn(console, 'warn').mockImplementation((message) => {
  if (
    typeof message === 'string' &&
    message.includes('useNativeDriver')
  ) {
    return;
  }
  console.warn(message);
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Stripe
jest.mock('@stripe/stripe-react-native', () => ({
  useStripe: () => ({
    initStripe: jest.fn(),
    presentPaymentSheet: jest.fn(),
    confirmPayment: jest.fn(),
    createPaymentMethod: jest.fn(),
  }),
  StripeProvider: ({ children }: any) => children,
}));

// Mock for expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: {
      latitude: 37.7749,
      longitude: -122.4194,
      altitude: 0,
      accuracy: 5,
      altitudeAccuracy: 5,
      heading: 0,
      speed: 0,
    },
    timestamp: Date.now(),
  })),
}));
