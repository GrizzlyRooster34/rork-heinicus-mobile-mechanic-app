import { z } from 'zod';
import { publicProcedure, router } from '../../trpc';
import { prisma } from '../../../../lib/prisma';
import Stripe from 'stripe';
import * as jwt from 'jsonwebtoken';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

// Helper function to get user from request
async function getUserFromRequest(req: Request): Promise<{ id: string; role: string } | null> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'default-secret'
    ) as { userId: string; email: string; role: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.isActive) {
      return null;
    }

    return { id: user.id, role: user.role };
  } catch (error) {
    return null;
  }
}

export const paymentsRouter = router({
  // Create payment intent for a quote
  createPaymentIntent: publicProcedure
    .input(z.object({
      quoteId: z.string(),
      paymentMethodId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await getUserFromRequest(ctx.req);
        if (!user) {
          throw new Error('Authentication required');
        }

        // Get quote details
        const quote = await prisma.quote.findUnique({
          where: { id: input.quoteId },
          include: {
            job: {
              include: {
                customer: true,
                mechanic: true
              }
            }
          }
        });

        if (!quote) {
          throw new Error('Quote not found');
        }

        // Verify user is the customer
        if (quote.job.customerId !== user.id) {
          throw new Error('Unauthorized');
        }

        // Check if quote is still valid
        if (new Date() > quote.validUntil) {
          throw new Error('Quote has expired');
        }

        // Calculate amount in cents
        const amount = Math.round(quote.totalCost * 100);

        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: 'usd',
          payment_method: input.paymentMethodId,
          confirmation_method: 'manual',
          confirm: input.paymentMethodId ? true : false,
          metadata: {
            quoteId: quote.id,
            jobId: quote.jobId,
            customerId: user.id,
            mechanicId: quote.job.mechanicId || '',
          },
          description: `Payment for job: ${quote.job.title}`,
        });

        // Create payment record
        const payment = await prisma.payment.create({
          data: {
            userId: user.id,
            jobId: quote.jobId,
            amount: quote.totalCost,
            currency: 'USD',
            status: 'PENDING',
            paymentMethod: input.paymentMethodId ? 'card' : 'unknown',
            stripePaymentId: paymentIntent.id,
            stripeIntentId: paymentIntent.id,
          }
        });

        return {
          success: true,
          paymentIntent: {
            id: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
            status: paymentIntent.status,
          },
          payment: {
            id: payment.id,
            amount: payment.amount,
            status: payment.status,
          }
        };

      } catch (error) {
        console.error('Error creating payment intent:', error);
        throw error;
      }
    }),

  // Confirm payment intent
  confirmPaymentIntent: publicProcedure
    .input(z.object({
      paymentIntentId: z.string(),
      paymentMethodId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await getUserFromRequest(ctx.req);
        if (!user) {
          throw new Error('Authentication required');
        }

        // Confirm payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.confirm(input.paymentIntentId, {
          payment_method: input.paymentMethodId,
        });

        // Update payment record
        const payment = await prisma.payment.findFirst({
          where: { stripeIntentId: input.paymentIntentId }
        });

        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: paymentIntent.status === 'succeeded' ? 'COMPLETED' : 'PROCESSING',
              paymentMethod: paymentIntent.payment_method?.toString() || 'card',
            }
          });

          // If payment succeeded, update quote and job status
          if (paymentIntent.status === 'succeeded') {
            const quote = await prisma.quote.findFirst({
              where: { jobId: payment.jobId, status: 'PENDING' }
            });

            if (quote) {
              await prisma.quote.update({
                where: { id: quote.id },
                data: { status: 'ACCEPTED' }
              });

              await prisma.job.update({
                where: { id: payment.jobId },
                data: { status: 'ACCEPTED' }
              });

              // Create timeline entry
              await prisma.jobTimeline.create({
                data: {
                  jobId: payment.jobId,
                  event: 'QUOTE_ACCEPTED',
                  description: 'Payment processed and quote accepted',
                  metadata: { paymentId: payment.id }
                }
              });
            }
          }
        }

        return {
          success: paymentIntent.status === 'succeeded',
          status: paymentIntent.status,
          paymentIntent: {
            id: paymentIntent.id,
            status: paymentIntent.status,
          }
        };

      } catch (error) {
        console.error('Error confirming payment:', error);
        throw error;
      }
    }),

  // Get payment methods for user
  getPaymentMethods: publicProcedure
    .query(async ({ ctx }) => {
      try {
        const user = await getUserFromRequest(ctx.req);
        if (!user) {
          throw new Error('Authentication required');
        }

        // In a real app, you would store customer ID and retrieve their payment methods
        // For demo purposes, return mock data
        return {
          paymentMethods: [
            {
              id: 'pm_1234567890',
              type: 'card',
              card: {
                brand: 'visa',
                last4: '4242',
                expMonth: 12,
                expYear: 2025,
              },
              isDefault: true,
            }
          ]
        };

      } catch (error) {
        console.error('Error getting payment methods:', error);
        throw error;
      }
    }),

  // Process refund
  processRefund: publicProcedure
    .input(z.object({
      paymentId: z.string(),
      amount: z.number().optional(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await getUserFromRequest(ctx.req);
        if (!user) {
          throw new Error('Authentication required');
        }

        // Get payment record
        const payment = await prisma.payment.findUnique({
          where: { id: input.paymentId },
          include: {
            job: {
              include: {
                customer: true,
                mechanic: true
              }
            }
          }
        });

        if (!payment) {
          throw new Error('Payment not found');
        }

        // Verify user has permission (customer or admin)
        if (payment.userId !== user.id && user.role !== 'ADMIN') {
          throw new Error('Unauthorized');
        }

        if (!payment.stripePaymentId) {
          throw new Error('Stripe payment ID not found');
        }

        // Calculate refund amount
        const refundAmount = input.amount || payment.amount;
        const refundAmountCents = Math.round(refundAmount * 100);

        // Process refund with Stripe
        const refund = await stripe.refunds.create({
          payment_intent: payment.stripePaymentId,
          amount: refundAmountCents,
          reason: 'requested_by_customer',
          metadata: {
            paymentId: payment.id,
            jobId: payment.jobId,
            refundReason: input.reason || 'Customer requested refund',
          }
        });

        // Update payment record
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'REFUNDED',
            refundAmount: refundAmount,
            refundReason: input.reason || 'Customer requested refund',
          }
        });

        // Create timeline entry
        await prisma.jobTimeline.create({
          data: {
            jobId: payment.jobId,
            event: 'JOB_CANCELLED',
            description: `Refund processed: $${refundAmount.toFixed(2)}`,
            metadata: {
              refundId: refund.id,
              refundAmount: refundAmount,
              refundReason: input.reason
            }
          }
        });

        return {
          success: true,
          refund: {
            id: refund.id,
            amount: refundAmount,
            status: refund.status,
          }
        };

      } catch (error) {
        console.error('Error processing refund:', error);
        throw error;
      }
    }),

  // Get payment history
  getPaymentHistory: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const user = await getUserFromRequest(ctx.req);
        if (!user) {
          throw new Error('Authentication required');
        }

        const payments = await prisma.payment.findMany({
          where: { userId: user.id },
          include: {
            job: {
              select: {
                id: true,
                title: true,
                status: true,
                createdAt: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: input.limit,
          skip: input.offset,
        });

        const total = await prisma.payment.count({
          where: { userId: user.id }
        });

        return {
          payments: payments.map(payment => ({
            id: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            paymentMethod: payment.paymentMethod,
            createdAt: payment.createdAt,
            refundAmount: payment.refundAmount,
            job: payment.job,
          })),
          total,
          hasMore: (input.offset + input.limit) < total,
        };

      } catch (error) {
        console.error('Error getting payment history:', error);
        throw error;
      }
    }),

  // Generate invoice
  generateInvoice: publicProcedure
    .input(z.object({
      paymentId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const user = await getUserFromRequest(ctx.req);
        if (!user) {
          throw new Error('Authentication required');
        }

        const payment = await prisma.payment.findUnique({
          where: { id: input.paymentId },
          include: {
            job: {
              include: {
                customer: true,
                mechanic: true,
                quotes: {
                  where: { status: 'ACCEPTED' },
                  include: { parts: true }
                }
              }
            }
          }
        });

        if (!payment) {
          throw new Error('Payment not found');
        }

        if (payment.userId !== user.id && user.role !== 'ADMIN') {
          throw new Error('Unauthorized');
        }

        const quote = payment.job.quotes[0];

        return {
          invoice: {
            id: payment.id,
            invoiceNumber: `INV-${payment.id.substring(0, 8).toUpperCase()}`,
            date: payment.createdAt,
            dueDate: payment.createdAt,
            status: payment.status,
            
            // Customer info
            customer: {
              name: `${payment.job.customer.firstName} ${payment.job.customer.lastName}`,
              email: payment.job.customer.email,
              phone: payment.job.customer.phone,
            },

            // Mechanic info
            mechanic: payment.job.mechanic ? {
              name: `${payment.job.mechanic.firstName} ${payment.job.mechanic.lastName}`,
              email: payment.job.mechanic.email,
            } : null,

            // Job details
            job: {
              title: payment.job.title,
              description: payment.job.description,
              category: payment.job.category,
              location: payment.job.location,
            },

            // Line items
            lineItems: [
              {
                description: 'Labor',
                quantity: 1,
                unitPrice: quote?.laborCost || 0,
                total: quote?.laborCost || 0,
              },
              ...(quote?.parts.map(part => ({
                description: part.partName,
                quantity: part.quantity,
                unitPrice: part.unitPrice,
                total: part.totalPrice,
              })) || [])
            ],

            // Totals
            subtotal: payment.amount,
            tax: 0, // Add tax calculation if needed
            total: payment.amount,
            
            // Payment info
            paymentMethod: payment.paymentMethod,
            paidDate: payment.status === 'COMPLETED' ? payment.updatedAt : null,
          }
        };

      } catch (error) {
        console.error('Error generating invoice:', error);
        throw error;
      }
    }),

  // Webhook handler for Stripe events
  handleWebhook: publicProcedure
    .input(z.object({
      payload: z.string(),
      signature: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
          throw new Error('Webhook secret not configured');
        }

        // Verify webhook signature
        const event = stripe.webhooks.constructEvent(
          input.payload,
          input.signature,
          webhookSecret
        );

        // Handle the event
        switch (event.type) {
          case 'payment_intent.succeeded':
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            
            // Update payment status
            await prisma.payment.updateMany({
              where: { stripeIntentId: paymentIntent.id },
              data: { status: 'COMPLETED' }
            });

            console.log('Payment succeeded:', paymentIntent.id);
            break;

          case 'payment_intent.payment_failed':
            const failedPayment = event.data.object as Stripe.PaymentIntent;
            
            // Update payment status
            await prisma.payment.updateMany({
              where: { stripeIntentId: failedPayment.id },
              data: { status: 'FAILED' }
            });

            console.log('Payment failed:', failedPayment.id);
            break;

          default:
            console.log(`Unhandled event type: ${event.type}`);
        }

        return { success: true };

      } catch (error) {
        console.error('Webhook error:', error);
        throw error;
      }
    }),
});