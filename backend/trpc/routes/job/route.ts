import { z } from 'zod';
import { publicProcedure, router } from '../../trpc';
import { prisma } from '../../../../lib/prisma';
import { TRPCError } from '@trpc/server';

/**
 * Job Management Router
 * Handles job lifecycle, time tracking, photos, and updates
 *
 * Note: Jobs are created from accepted Quotes.
 * This router manages existing jobs, not job creation.
 */
export const jobRouter = router({
  /**
   * Create a job from an accepted quote
   * This is typically called when a customer accepts a quote
   */
  createFromQuote: publicProcedure
    .input(z.object({
      quoteId: z.string(),
      urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']),
      title: z.string().optional(),
      scheduledDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Get the quote
        const quote = await prisma.quote.findUnique({
          where: { id: input.quoteId },
          include: {
            customer: true,
            vehicle: true,
            service: true,
          }
        });

        if (!quote) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Quote not found',
          });
        }

        // Check if job already exists for this quote
        const existingJob = await prisma.job.findUnique({
          where: { quoteId: input.quoteId }
        });

        if (existingJob) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Job already exists for this quote',
          });
        }

        // Check quote status
        if (quote.status !== 'ACCEPTED') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Quote must be accepted before creating a job',
          });
        }

        // Prepare schedule JSON
        const schedule = input.scheduledDate ? {
          start: input.scheduledDate,
          requested: new Date().toISOString(),
        } : null;

        // Create the job
        const job = await prisma.job.create({
          data: {
            quoteId: quote.id,
            customerId: quote.customerId,
            urgency: input.urgency,
            title: input.title || `${quote.service.name} - ${quote.vehicle.make} ${quote.vehicle.model}`,
            category: quote.service.category,
            status: 'PENDING',
            schedule: schedule || {},
            location: {
              address: 'To be determined',
              lat: 0,
              lng: 0,
            },
            photos: [],
            partsUsed: [],
            timers: [],
            totals: {
              labor: 0,
              parts: 0,
              fees: quote.travelFee,
              discounts: 0,
              grand_total: 0,
            },
          },
          include: {
            quote: {
              include: {
                service: true,
                vehicle: true,
              }
            },
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              }
            },
          }
        });

        // Create job timeline event
        await prisma.jobTimeline.create({
          data: {
            jobId: job.id,
            eventType: 'CREATED',
            description: 'Job created from accepted quote',
            actorId: quote.customerId,
            metadata: {
              quoteId: quote.id,
              urgency: input.urgency,
            }
          }
        });

        console.log('Job created from quote:', job.id);

        return { success: true, job };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error creating job from quote:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create job from quote',
        });
      }
    }),

  /**
   * Get all jobs (with optional filters)
   */
  getAll: publicProcedure
    .input(z.object({
      status: z.enum(['PENDING', 'QUOTED', 'ACCEPTED', 'ACTIVE', 'COMPLETED', 'CANCELED']).optional(),
      customerId: z.string().optional(),
      mechanicId: z.string().optional(),
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
        if (input?.mechanicId) {
          where.mechanicId = input.mechanicId;
        }

        const jobs = await prisma.job.findMany({
          where,
          include: {
            quote: {
              include: {
                service: true,
                vehicle: true,
              }
            },
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              }
            },
            mechanic: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              }
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: input?.limit || 50,
          skip: input?.offset || 0,
        });

        const total = await prisma.job.count({ where });

        return { jobs, total, hasMore: (input?.offset || 0) + jobs.length < total };
      } catch (error) {
        console.error('Error fetching jobs:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch jobs',
        });
      }
    }),

  /**
   * Get a single job by ID
   */
  getById: publicProcedure
    .input(z.object({
      jobId: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const job = await prisma.job.findUnique({
          where: { id: input.jobId },
          include: {
            quote: {
              include: {
                service: true,
                vehicle: true,
              }
            },
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              }
            },
            mechanic: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                mechanicProfile: true,
              }
            },
            timelines: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 20,
            },
            payments: {
              orderBy: {
                createdAt: 'desc',
              }
            },
            reviews: true,
          },
        });

        if (!job) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Job not found',
          });
        }

        return { job };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error fetching job:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch job',
        });
      }
    }),

  /**
   * Update job status
   */
  updateStatus: publicProcedure
    .input(z.object({
      jobId: z.string(),
      status: z.enum(['PENDING', 'QUOTED', 'ACCEPTED', 'ACTIVE', 'COMPLETED', 'CANCELED']),
      actorId: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const job = await prisma.job.update({
          where: { id: input.jobId },
          data: {
            status: input.status,
            updatedAt: new Date(),
          },
          include: {
            quote: true,
            customer: true,
            mechanic: true,
          }
        });

        // Create timeline event
        await prisma.jobTimeline.create({
          data: {
            jobId: job.id,
            eventType: input.status,
            description: `Job status changed to ${input.status}`,
            actorId: input.actorId,
            metadata: {
              previousStatus: job.status,
              notes: input.notes,
            }
          }
        });

        console.log('Job status updated:', input.jobId, input.status);

        return { success: true, job };
      } catch (error) {
        console.error('Error updating job status:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update job status',
        });
      }
    }),

  /**
   * Assign mechanic to job
   */
  assignMechanic: publicProcedure
    .input(z.object({
      jobId: z.string(),
      mechanicId: z.string(),
      actorId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const job = await prisma.job.update({
          where: { id: input.jobId },
          data: {
            mechanicId: input.mechanicId,
            updatedAt: new Date(),
          },
          include: {
            mechanic: true,
          }
        });

        // Create timeline event
        await prisma.jobTimeline.create({
          data: {
            jobId: job.id,
            eventType: 'ACCEPTED',
            description: `Mechanic assigned: ${job.mechanic?.firstName} ${job.mechanic?.lastName}`,
            actorId: input.actorId,
            metadata: {
              mechanicId: input.mechanicId,
            }
          }
        });

        return { success: true, job };
      } catch (error) {
        console.error('Error assigning mechanic:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to assign mechanic',
        });
      }
    }),

  /**
   * Update job location
   */
  updateLocation: publicProcedure
    .input(z.object({
      jobId: z.string(),
      location: z.object({
        address: z.string(),
        lat: z.number(),
        lng: z.number(),
      }),
    }))
    .mutation(async ({ input }) => {
      try {
        const job = await prisma.job.update({
          where: { id: input.jobId },
          data: {
            location: input.location,
            updatedAt: new Date(),
          },
        });

        return { success: true, job };
      } catch (error) {
        console.error('Error updating job location:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update job location',
        });
      }
    }),

  /**
   * Update time log and add timer entry
   */
  updateTimeLog: publicProcedure
    .input(z.object({
      jobId: z.string(),
      mechanicId: z.string(),
      action: z.enum(['start', 'pause', 'resume', 'end']),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const job = await prisma.job.findUnique({
          where: { id: input.jobId },
        });

        if (!job) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Job not found',
          });
        }

        const timers = (job.timers as any[]) || [];
        const timestamp = new Date().toISOString();

        let newTimer: any = {
          action: input.action,
          timestamp,
          mechanicId: input.mechanicId,
          notes: input.notes,
        };

        timers.push(newTimer);

        // Update job with new timer
        const updatedJob = await prisma.job.update({
          where: { id: input.jobId },
          data: {
            timers: timers,
            updatedAt: new Date(),
          },
        });

        // Create timeline event
        await prisma.jobTimeline.create({
          data: {
            jobId: job.id,
            eventType: input.action === 'start' ? 'IN_PROGRESS' : 'COMPLETED',
            description: `Time log updated: ${input.action}`,
            actorId: input.mechanicId,
            metadata: {
              action: input.action,
              notes: input.notes,
            }
          }
        });

        console.log('Job time log updated:', input.jobId, input.action);

        return { success: true, job: updatedJob };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error updating time log:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update time log',
        });
      }
    }),

  /**
   * Add photo to job
   */
  addPhoto: publicProcedure
    .input(z.object({
      jobId: z.string(),
      photoUrl: z.string(),
      description: z.string().optional(),
      mechanicId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const job = await prisma.job.findUnique({
          where: { id: input.jobId },
        });

        if (!job) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Job not found',
          });
        }

        const photos = [...job.photos, input.photoUrl];

        const updatedJob = await prisma.job.update({
          where: { id: input.jobId },
          data: {
            photos: photos,
            updatedAt: new Date(),
          },
        });

        // Create timeline event
        await prisma.jobTimeline.create({
          data: {
            jobId: job.id,
            eventType: 'IN_PROGRESS',
            description: 'Photo added to job',
            actorId: input.mechanicId,
            metadata: {
              photoUrl: input.photoUrl,
              description: input.description,
            }
          }
        });

        console.log('Photo added to job:', input.jobId);

        return { success: true, job: updatedJob };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error adding photo:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add photo',
        });
      }
    }),

  /**
   * Add parts used to job
   */
  addParts: publicProcedure
    .input(z.object({
      jobId: z.string(),
      parts: z.array(z.object({
        name: z.string(),
        qty: z.number(),
        unit_cost: z.number(),
      })),
      mechanicId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const job = await prisma.job.findUnique({
          where: { id: input.jobId },
        });

        if (!job) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Job not found',
          });
        }

        const existingParts = (job.partsUsed as any[]) || [];
        const newParts = [...existingParts, ...input.parts];

        // Calculate new totals
        const totals = job.totals as any;
        const partsTotal = newParts.reduce((sum, part) => sum + (part.qty * part.unit_cost), 0);

        const updatedTotals = {
          ...totals,
          parts: partsTotal,
          grand_total: (totals.labor || 0) + partsTotal + (totals.fees || 0) - (totals.discounts || 0),
        };

        const updatedJob = await prisma.job.update({
          where: { id: input.jobId },
          data: {
            partsUsed: newParts,
            totals: updatedTotals,
            updatedAt: new Date(),
          },
        });

        // Create timeline event
        await prisma.jobTimeline.create({
          data: {
            jobId: job.id,
            eventType: 'IN_PROGRESS',
            description: `Added ${input.parts.length} part(s) to job`,
            actorId: input.mechanicId,
            metadata: {
              parts: input.parts,
              partsTotal,
            }
          }
        });

        return { success: true, job: updatedJob };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error adding parts:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add parts',
        });
      }
    }),

  /**
   * Update job totals (labor, parts, fees, discounts)
   */
  updateTotals: publicProcedure
    .input(z.object({
      jobId: z.string(),
      labor: z.number().optional(),
      parts: z.number().optional(),
      fees: z.number().optional(),
      discounts: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const job = await prisma.job.findUnique({
          where: { id: input.jobId },
        });

        if (!job) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Job not found',
          });
        }

        const currentTotals = job.totals as any;
        const updatedTotals = {
          labor: input.labor ?? currentTotals.labor ?? 0,
          parts: input.parts ?? currentTotals.parts ?? 0,
          fees: input.fees ?? currentTotals.fees ?? 0,
          discounts: input.discounts ?? currentTotals.discounts ?? 0,
          grand_total: 0,
        };

        updatedTotals.grand_total =
          updatedTotals.labor +
          updatedTotals.parts +
          updatedTotals.fees -
          updatedTotals.discounts;

        const updatedJob = await prisma.job.update({
          where: { id: input.jobId },
          data: {
            totals: updatedTotals,
            updatedAt: new Date(),
          },
        });

        return { success: true, job: updatedJob };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error updating totals:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update totals',
        });
      }
    }),

  /**
   * Update parts approval status for a job
   * Allows customers to pre-approve parts cost to streamline the service process
   */
  updatePartsApproval: publicProcedure
    .input(z.object({
      jobId: z.string(),
      partsApproved: z.boolean(),
      estimatedPartsCost: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const job = await prisma.job.findUnique({
          where: { id: input.jobId },
          include: {
            customer: true,
          }
        });

        if (!job) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Job not found',
          });
        }

        // Update job with parts approval status
        const updatedJob = await prisma.job.update({
          where: { id: input.jobId },
          data: {
            partsApproved: input.partsApproved,
            estimatedPartsCost: input.estimatedPartsCost,
            updatedAt: new Date(),
          },
          include: {
            customer: true,
            mechanic: true,
            quote: {
              include: {
                service: true,
                vehicle: true,
              }
            },
          }
        });

        // Create timeline event
        await prisma.jobTimeline.create({
          data: {
            jobId: job.id,
            eventType: 'IN_PROGRESS',
            description: input.partsApproved
              ? `Parts pre-approved${input.estimatedPartsCost ? ` (Est. $${input.estimatedPartsCost.toFixed(2)})` : ''}`
              : 'Parts pre-approval removed',
            actorId: job.customerId,
            metadata: {
              partsApproved: input.partsApproved,
              estimatedPartsCost: input.estimatedPartsCost,
            }
          }
        });

        console.log('Parts approval updated:', input.jobId, input.partsApproved);

        return { success: true, job: updatedJob };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error updating parts approval:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update parts approval',
        });
      }
    }),
});
