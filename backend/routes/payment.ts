import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createPaymentIntent, createStripeCustomer, retrievePaymentIntent } from '@/lib/stripe-service';

const payment = new Hono();

// Schema for creating payment intent
const createPaymentIntentSchema = z.object({
  amount: z.number().min(0.5, 'Amount must be at least $0.50'),
  currency: z.string().default('usd'),
  customerId: z.string().optional(),
  quoteId: z.string(),
  paymentType: z.enum(['deposit', 'full', 'completion']),
  customerEmail: z.string().email().optional(),
  customerName: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

// Schema for creating customer
const createCustomerSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  metadata: z.record(z.string()).optional(),
});

// Create payment intent
payment.post(
  '/create-payment-intent',
  zValidator('json', createPaymentIntentSchema),
  async (c) => {
    try {
      const data = c.req.valid('json');

      let customerId = data.customerId;

      // Create customer if not provided
      if (!customerId && data.customerEmail && data.customerName) {
        const customer = await createStripeCustomer(
          data.customerEmail,
          data.customerName,
          data.metadata
        );
        customerId = customer.id;
      }

      const paymentIntent = await createPaymentIntent({
        amount: data.amount,
        currency: data.currency,
        customerId,
        quoteId: data.quoteId,
        paymentType: data.paymentType,
        metadata: data.metadata,
      });

      return c.json({
        success: true,
        data: paymentIntent,
        customerId,
      });
    } catch (error) {
      console.error('Payment intent creation failed:', error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create payment intent',
        },
        400
      );
    }
  }
);

// Create Stripe customer
payment.post(
  '/create-customer',
  zValidator('json', createCustomerSchema),
  async (c) => {
    try {
      const { email, name, metadata } = c.req.valid('json');

      const customer = await createStripeCustomer(email, name, metadata);

      return c.json({
        success: true,
        data: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
        },
      });
    } catch (error) {
      console.error('Customer creation failed:', error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create customer',
        },
        400
      );
    }
  }
);

// Retrieve payment intent
payment.get('/payment-intent/:id', async (c) => {
  try {
    const paymentIntentId = c.req.param('id');

    if (!paymentIntentId) {
      return c.json(
        {
          success: false,
          error: 'Payment intent ID is required',
        },
        400
      );
    }

    const paymentIntent = await retrievePaymentIntent(paymentIntentId);

    return c.json({
      success: true,
      data: {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        metadata: paymentIntent.metadata,
      },
    });
  } catch (error) {
    console.error('Payment intent retrieval failed:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve payment intent',
      },
      400
    );
  }
});

// Webhook endpoint for Stripe events
payment.post('/webhook', async (c) => {
  try {
    const body = await c.req.text();
    const signature = c.req.header('stripe-signature');

    if (!signature) {
      return c.json(
        {
          success: false,
          error: 'Missing Stripe signature',
        },
        400
      );
    }

    // TODO: Implement webhook signature verification and event handling
    // This would handle events like:
    // - payment_intent.succeeded
    // - payment_intent.payment_failed
    // - customer.created
    // etc.

    console.log('Stripe webhook received:', { signature });

    return c.json({
      success: true,
      received: true,
    });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      },
      400
    );
  }
});

export { payment };