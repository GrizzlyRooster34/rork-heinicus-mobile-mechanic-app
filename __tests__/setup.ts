/**
 * Jest Setup File
 * Runs before each test suite
 */

import '@testing-library/react-native/extend-expect';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.JWT_SECRET = 'test-jwt-secret-key-that-is-at-least-32-characters-long';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_mock_key';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FRONTEND_URL = 'http://localhost:3000';

// Silence console during tests (optional)
global.console = {
  ...console,
  // Uncomment to suppress logs during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  error: jest.fn(), // Keep errors visible
};

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

// Mock Expo modules
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => true),
}));

jest.mock('expo-asset', () => ({
  Asset: {
    loadAsync: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      name: 'Test App',
      slug: 'test-app',
    },
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  useLocalSearchParams: () => ({}),
  usePathname: () => '/',
  useSegments: () => [],
  Link: ({ children }: { children: React.ReactNode }) => children,
  Stack: {
    Screen: ({ children }: { children: React.ReactNode }) => children,
  },
}));

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// Mock Stripe
jest.mock('@stripe/stripe-react-native', () => ({
  StripeProvider: ({ children }: { children: React.ReactNode }) => children,
  useStripe: () => ({
    initPaymentSheet: jest.fn(() => Promise.resolve({ error: null })),
    presentPaymentSheet: jest.fn(() => Promise.resolve({ error: null })),
    confirmPayment: jest.fn(() => Promise.resolve({ error: null, paymentIntent: { id: 'pi_test' } })),
  }),
}));

// Mock Prisma
jest.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    job: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    quote: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    payment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    review: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    jobTimeline: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    passwordReset: {
      create: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    twoFactorBackupCode: {
      findFirst: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((operations) =>
      Promise.all(Array.isArray(operations) ? operations : [operations])
    ),
  },
}));

// Mock Firebase
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  messaging: jest.fn(() => ({
    send: jest.fn(() => Promise.resolve('message-id')),
    sendMulticast: jest.fn(() => Promise.resolve({ successCount: 1, failureCount: 0 })),
  })),
}));

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(() => Promise.resolve({ messageId: 'test-message-id' })),
  })),
}));

// Global test utilities
global.testUtils = {
  createMockUser: (overrides = {}) => ({
    id: 'user-test-id',
    role: 'CUSTOMER',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: '555-1234',
    address: '123 Test St',
    isActive: true,
    joinedAt: new Date('2024-01-01'),
    ...overrides,
  }),

  createMockJob: (overrides = {}) => ({
    id: 'job-test-id',
    quoteId: 'quote-test-id',
    customerId: 'customer-test-id',
    mechanicId: 'mechanic-test-id',
    status: 'PENDING',
    urgency: 'MEDIUM',
    title: 'Test Job',
    category: 'oil_change',
    location: { lat: 45.5152, lng: -122.6784, address: '123 Test St' },
    photos: [],
    partsUsed: [],
    timers: [],
    totals: { labor: 100, parts: 50, fees: 10, discounts: 0, grand_total: 160 },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }),

  createMockQuote: (overrides = {}) => ({
    id: 'quote-test-id',
    customerId: 'customer-test-id',
    vehicleId: 'vehicle-test-id',
    serviceId: 'service-test-id',
    lineItems: [{ label: 'Labor', amount: 100 }],
    laborRate: 50,
    estHours: 2,
    laborCost: 100,
    partsCost: 50,
    travelFee: 25,
    discountsApplied: [],
    status: 'PENDING',
    subtotal: 175,
    taxes: 15.75,
    total: 190.75,
    totalCost: 190.75,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }),

  waitFor: (callback: () => boolean | Promise<boolean>, timeout = 5000) => {
    return new Promise<void>((resolve, reject) => {
      const startTime = Date.now();
      const checkCondition = async () => {
        try {
          const result = await callback();
          if (result) {
            resolve();
          } else if (Date.now() - startTime > timeout) {
            reject(new Error('Timeout waiting for condition'));
          } else {
            setTimeout(checkCondition, 100);
          }
        } catch (error) {
          reject(error);
        }
      };
      checkCondition();
    });
  },
};

// Extend TypeScript global namespace
declare global {
  var testUtils: typeof global.testUtils;
}

// Increase test timeout for integration tests
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
