const mockPaymentIntentCreate = jest.fn();
const mockPaymentIntentRetrieve = jest.fn();
const mockPrisma = {
  payment: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: mockPaymentIntentCreate,
      retrieve: mockPaymentIntentRetrieve,
    },
  }));
});

describe('stripe service', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
  });

  afterAll(() => {
    delete process.env.STRIPE_SECRET_KEY;
  });

  it('createPaymentIntent returns a clientSecret', async () => {
    mockPaymentIntentCreate.mockResolvedValue({
      id: 'pi_123',
      client_secret: 'pi_123_secret_abc',
      status: 'requires_confirmation',
    });
    mockPrisma.payment.create.mockResolvedValue({
      id: 'payment-1',
      stripePaymentId: 'pi_123',
      amount: 149.99,
      status: 'PENDING',
    });

    const { createPaymentIntent } = require('@/backend/services/stripe');

    const result = await createPaymentIntent({
      jobId: 'job-1',
      customerId: 'customer-1',
      amount: 149.99,
      quoteId: 'quote-1',
    });

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        clientSecret: 'pi_123_secret_abc',
        paymentIntentId: 'pi_123',
      })
    );
    expect(mockPaymentIntentCreate).toHaveBeenCalledWith({
      amount: 14999,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        jobId: 'job-1',
        customerId: 'customer-1',
        quoteId: 'quote-1',
      },
    });
  });
});
