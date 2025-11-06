import { z } from 'zod';
import { publicProcedure, router } from '../../trpc';
import { prisma } from '../../../../lib/prisma';
import { TRPCError } from '@trpc/server';

/**
 * Quote Management Router
 * Handles quote creation, retrieval, and status updates
 */
export const quoteRouter = router({
  /**
   * Create a new quote
   * Typically called by a mechanic after reviewing a service request
   */
  create: publicProcedure
    .input(z.object({
      customerId: z.string(),
      vehicleId: z.string(),
      serviceId: z.string(),
      lineItems: z.array(z.object({
        label: z.string(),
        amount: z.number(),
      })),
      laborRate: z.number(),
      estHours: z.number(),
      laborCost: z.number(),
      partsCost: z.number(),
      travelFee: z.number(),
      discountsApplied: z.array(z.object({
        type: z.string(),
        pct: z.number(),
        amount: z.number(),
      })).default([]),
      subtotal: z.number(),
      taxes: z.number().optional(),
      total: z.number(),
      validUntil: z.date().optional(),
      estimatedDuration: z.number().optional(),
      notes: z.string().optional(),
      parts: z.array(z.object({
        name: z.string(),
        cost: z.number(),
        qty: z.number(),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Verify customer exists
        const customer = await prisma.user.findUnique({
          where: { id: input.customerId }
        });

        if (!customer) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Customer not found',
          });
        }

        // Verify vehicle exists and belongs to customer
        const vehicle = await prisma.vehicle.findUnique({
          where: { id: input.vehicleId }
        });

        if (!vehicle || vehicle.userId !== input.customerId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid vehicle for this customer',
          });
        }

        // Verify service exists
        const service = await prisma.service.findUnique({
          where: { id: input.serviceId }
        });

        if (!service) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Service not found',
          });
        }

        // Create the quote
        const quote = await prisma.quote.create({
          data: {
            customerId: input.customerId,
            vehicleId: input.vehicleId,
            serviceId: input.serviceId,
            lineItems: input.lineItems,
            laborRate: input.laborRate,
            estHours: input.estHours,
            laborCost: input.laborCost,
            partsCost: input.partsCost,
            travelFee: input.travelFee,
            discountsApplied: input.discountsApplied,
            subtotal: input.subtotal,
            taxes: input.taxes,
            total: input.total,
            totalCost: input.total,
            validUntil: input.validUntil,
            estimatedDuration: input.estimatedDuration,
            notes: input.notes,
            parts: input.parts || [],
            status: 'PENDING',
          },
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              }
            },
            vehicle: true,
            service: true,
          }
        });

        // Create notification for customer
        await prisma.notification.create({
          data: {
            userId: input.customerId,
            type: 'QUOTE_RECEIVED',
            title: 'New Quote Received',
            message: `You have received a quote for ${service.name}`,
            data: {
              quoteId: quote.id,
              total: quote.total,
              serviceId: service.id,
            }
          }
        });

        console.log('Quote created:', quote.id);

        return {
          success: true,
          quote,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error creating quote:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create quote',
        });
      }
    }),

  /**
   * Get all quotes with optional filtering
   */
  listAll: publicProcedure
    .input(z.object({
      status: z.enum(['PENDING', 'APPROVED', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
      customerId: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      try {
        const where: any = {};

        if (input?.status) {
          where.status = input.status;
        }

        if (input?.customerId) {
          where.customerId = input.customerId;
        }

        // Filter out expired quotes
        const now = new Date();
        if (!input?.status || input.status !== 'EXPIRED') {
          where.OR = [
            { validUntil: null },
            { validUntil: { gte: now } },
            { status: { not: 'PENDING' } }, // Keep non-pending even if expired
          ];
        }

        const quotes = await prisma.quote.findMany({
          where,
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            },
            vehicle: {
              select: {
                id: true,
                make: true,
                model: true,
                year: true,
                vin: true,
              }
            },
            service: {
              select: {
                id: true,
                name: true,
                category: true,
              }
            },
            job: {
              select: {
                id: true,
                status: true,
              }
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: input?.limit || 50,
          skip: input?.offset || 0,
        });

        const total = await prisma.quote.count({ where });

        return {
          quotes,
          total,
          hasMore: (input?.offset || 0) + quotes.length < total,
        };
      } catch (error) {
        console.error('Error fetching quotes:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch quotes',
        });
      }
    }),

  /**
   * Get quotes for a specific user (customer's quotes)
   */
  listMine: publicProcedure
    .input(z.object({
      userId: z.string(),
      status: z.enum(['PENDING', 'APPROVED', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
    }))
    .query(async ({ input }) => {
      try {
        const where: any = {
          customerId: input.userId,
        };

        if (input.status) {
          where.status = input.status;
        }

        const quotes = await prisma.quote.findMany({
          where,
          include: {
            vehicle: true,
            service: true,
            job: {
              select: {
                id: true,
                status: true,
              }
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return { quotes };
      } catch (error) {
        console.error('Error fetching user quotes:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user quotes',
        });
      }
    }),

  /**
   * Get a single quote by ID
   */
  getById: publicProcedure
    .input(z.object({
      quoteId: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const quote = await prisma.quote.findUnique({
          where: { id: input.quoteId },
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              }
            },
            vehicle: true,
            service: true,
            job: true,
            payments: true,
            reviews: true,
          },
        });

        if (!quote) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Quote not found',
          });
        }

        return { quote };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error fetching quote:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch quote',
        });
      }
    }),

  /**
   * Update quote status
   */
  updateStatus: publicProcedure
    .input(z.object({
      quoteId: z.string(),
      status: z.enum(['PENDING', 'APPROVED', 'ACCEPTED', 'REJECTED', 'EXPIRED']),
      userId: z.string(), // Who is performing the action
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const quote = await prisma.quote.update({
          where: { id: input.quoteId },
          data: {
            status: input.status,
          },
          include: {
            customer: true,
            service: true,
          }
        });

        // Create notification based on status
        let notificationType: any = 'QUOTE_RECEIVED';
        let title = 'Quote Status Updated';
        let message = `Quote status changed to ${input.status}`;

        if (input.status === 'ACCEPTED') {
          notificationType = 'QUOTE_RECEIVED';
          title = 'Quote Accepted';
          message = 'Your quote has been accepted by the customer';
        } else if (input.status === 'REJECTED') {
          title = 'Quote Rejected';
          message = 'Unfortunately, the customer has declined your quote';
        }

        await prisma.notification.create({
          data: {
            userId: quote.customerId,
            type: notificationType,
            title,
            message,
            data: {
              quoteId: quote.id,
              status: input.status,
              notes: input.notes,
            }
          }
        });

        console.log('Quote status updated:', input.quoteId, input.status);

        return {
          success: true,
          quote,
          message: `Quote status updated to ${input.status}`,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error updating quote status:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update quote status',
        });
      }
    }),

  /**
   * Approve a quote (typically by customer)
   * This changes status to APPROVED and can be followed by ACCEPTED when payment is confirmed
   */
  approve: publicProcedure
    .input(z.object({
      quoteId: z.string(),
      userId: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const quote = await prisma.quote.findUnique({
          where: { id: input.quoteId },
          include: {
            customer: true,
            service: true,
          }
        });

        if (!quote) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Quote not found',
          });
        }

        // Verify the user is the customer
        if (quote.customerId !== input.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only the customer can approve this quote',
          });
        }

        // Update quote status
        const updatedQuote = await prisma.quote.update({
          where: { id: input.quoteId },
          data: {
            status: 'APPROVED',
          },
        });

        // Create notification
        await prisma.notification.create({
          data: {
            userId: quote.customerId,
            type: 'QUOTE_RECEIVED',
            title: 'Quote Approved',
            message: `Quote for ${quote.service.name} has been approved`,
            data: {
              quoteId: quote.id,
              notes: input.notes,
            }
          }
        });

        console.log('Quote approved:', input.quoteId);

        return {
          success: true,
          quote: updatedQuote,
          message: 'Quote approved successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error approving quote:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to approve quote',
        });
      }
    }),

  /**
   * Accept a quote (typically after payment)
   * This creates a job from the quote
   */
  accept: publicProcedure
    .input(z.object({
      quoteId: z.string(),
      userId: z.string(),
      scheduledDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const quote = await prisma.quote.findUnique({
          where: { id: input.quoteId },
          include: {
            customer: true,
            service: true,
            vehicle: true,
          }
        });

        if (!quote) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Quote not found',
          });
        }

        // Verify the user is the customer
        if (quote.customerId !== input.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only the customer can accept this quote',
          });
        }

        // Check if quote is expired
        if (quote.validUntil && new Date() > quote.validUntil) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Quote has expired',
          });
        }

        // Update quote status
        await prisma.quote.update({
          where: { id: input.quoteId },
          data: {
            status: 'ACCEPTED',
          },
        });

        console.log('Quote accepted and ready for job creation:', input.quoteId);

        return {
          success: true,
          message: 'Quote accepted successfully. You can now create a job.',
          quoteId: quote.id,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error accepting quote:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to accept quote',
        });
      }
    }),

  /**
   * Reject a quote
   */
  reject: publicProcedure
    .input(z.object({
      quoteId: z.string(),
      userId: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const quote = await prisma.quote.findUnique({
          where: { id: input.quoteId }
        });

        if (!quote) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Quote not found',
          });
        }

        // Verify the user is the customer
        if (quote.customerId !== input.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only the customer can reject this quote',
          });
        }

        // Update quote status
        await prisma.quote.update({
          where: { id: input.quoteId },
          data: {
            status: 'REJECTED',
          },
        });

        console.log('Quote rejected:', input.quoteId, input.reason);

        return {
          success: true,
          message: 'Quote rejected',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error rejecting quote:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reject quote',
        });
      }
    }),

  /**
   * Update quote details
   */
  update: publicProcedure
    .input(z.object({
      quoteId: z.string(),
      laborCost: z.number().optional(),
      partsCost: z.number().optional(),
      travelFee: z.number().optional(),
      estimatedDuration: z.number().optional(),
      validUntil: z.date().optional(),
      notes: z.string().optional(),
      parts: z.array(z.object({
        name: z.string(),
        cost: z.number(),
        qty: z.number(),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const quote = await prisma.quote.findUnique({
          where: { id: input.quoteId }
        });

        if (!quote) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Quote not found',
          });
        }

        // Can only update PENDING quotes
        if (quote.status !== 'PENDING') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Can only update pending quotes',
          });
        }

        // Calculate new totals
        const laborCost = input.laborCost ?? quote.laborCost ?? 0;
        const partsCost = input.partsCost ?? quote.partsCost ?? 0;
        const travelFee = input.travelFee ?? quote.travelFee;
        const subtotal = laborCost + partsCost + travelFee;
        const taxes = subtotal * 0.08; // 8% tax rate
        const total = subtotal + taxes;

        const updatedQuote = await prisma.quote.update({
          where: { id: input.quoteId },
          data: {
            laborCost,
            partsCost,
            travelFee,
            subtotal,
            taxes,
            total,
            totalCost: total,
            estimatedDuration: input.estimatedDuration,
            validUntil: input.validUntil,
            notes: input.notes,
            parts: input.parts,
          },
        });

        console.log('Quote updated:', input.quoteId);

        return {
          success: true,
          quote: updatedQuote,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error updating quote:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update quote',
        });
      }
    }),
});

// Export with expected name for backward compatibility
export const quoteProcedures = quoteRouter;
