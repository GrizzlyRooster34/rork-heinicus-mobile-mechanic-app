import { z } from 'zod';
import { publicProcedure, router } from '../../trpc';
import { prisma } from '@/lib/prisma';
import { JobStatus } from '@prisma/client';
import { TRPCError } from '@trpc/server';

export const jobRouter = router({
  create: publicProcedure
    .input(z.object({
      customerId: z.string(),
      serviceType: z.string(),
      description: z.string(),
      vehicleInfo: z.object({
        make: z.string(),
        model: z.string(),
        year: z.number(),
        vin: z.string().optional(),
      }),
      location: z.object({
        address: z.string(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      }),
      scheduledDate: z.string().optional(),
      partsApproved: z.boolean().default(false),
      estimatedCost: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const job = await prisma.job.create({
          data: {
            customerId: input.customerId,
            serviceType: input.serviceType,
            description: input.description,
            vehicleMake: input.vehicleInfo.make,
            vehicleModel: input.vehicleInfo.model,
            vehicleYear: input.vehicleInfo.year,
            vehicleVin: input.vehicleInfo.vin,
            address: input.location.address,
            latitude: input.location.latitude,
            longitude: input.location.longitude,
            scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : null,
            partsApproved: input.partsApproved,
            estimatedCost: input.estimatedCost,
            status: JobStatus.PENDING,
          },
        });
        
        return { success: true, job };
      } catch (error) {
        console.error('Job creation error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create job',
        });
      }
    }),

  getAll: publicProcedure
    .query(async () => {
      const jobs = await prisma.job.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { firstName: true, lastName: true, email: true }
          },
          mechanic: {
            select: { firstName: true, lastName: true }
          }
        }
      });
      return { jobs };
    }),

  getById: publicProcedure
    .input(z.object({
      jobId: z.string(),
    }))
    .query(async ({ input }) => {
      const job = await prisma.job.findUnique({
        where: { id: input.jobId },
        include: {
          customer: true,
          mechanic: true,
          activityLog: true,
          photos: true,
          quotes: true,
        }
      });
      
      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found',
        });
      }
      return { job };
    }),

  updateStatus: publicProcedure
    .input(z.object({
      jobId: z.string(),
      status: z.enum(['pending', 'accepted', 'in-progress', 'completed', 'cancelled']),
    }))
    .mutation(async ({ input }) => {
      const statusMap: Record<string, JobStatus> = {
        'pending': JobStatus.PENDING,
        'accepted': JobStatus.ACCEPTED,
        'in-progress': JobStatus.IN_PROGRESS,
        'completed': JobStatus.COMPLETED,
        'cancelled': JobStatus.CANCELLED,
      };

      try {
        const job = await prisma.job.update({
          where: { id: input.jobId },
          data: {
            status: statusMap[input.status],
          },
        });
        
        return { success: true, job };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update job status',
        });
      }
    }),

  updatePartsApproval: publicProcedure
    .input(z.object({
      jobId: z.string(),
      partsApproved: z.boolean(),
      estimatedPartsCost: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const job = await prisma.job.update({
          where: { id: input.jobId },
          data: {
            partsApproved: input.partsApproved,
            estimatedPartsCost: input.estimatedPartsCost,
          },
        });
        
        return { success: true, job };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update parts approval',
        });
      }
    }),

  updateTimeLog: publicProcedure
    .input(z.object({
      jobId: z.string(),
      mechanicId: z.string(),
      timeStarted: z.date().optional(),
      timePaused: z.date().optional(),
      timeEnded: z.date().optional(),
      duration: z.number().optional(),
      activity: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const updateData: any = {};
        if (input.timeStarted) updateData.timeStarted = input.timeStarted;
        if (input.timePaused) updateData.timePaused = input.timePaused;
        if (input.timeEnded) updateData.timeEnded = input.timeEnded;
        if (input.duration !== undefined) updateData.totalDuration = input.duration;

        const job = await prisma.job.update({
          where: { id: input.jobId },
          data: {
            ...updateData,
            activityLog: {
              create: {
                mechanicId: input.mechanicId,
                activity: input.activity || 'Time updated',
                notes: input.notes,
                duration: input.duration,
              }
            }
          },
        });
        
        return { success: true, job };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update time log',
        });
      }
    }),

  addPhoto: publicProcedure
    .input(z.object({
      jobId: z.string(),
      photoUrl: z.string(),
      description: z.string().optional(),
      mechanicId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const job = await prisma.job.update({
          where: { id: input.jobId },
          data: {
            photos: {
              create: {
                url: input.photoUrl,
                description: input.description,
                mechanicId: input.mechanicId,
              }
            }
          },
        });
        
        return { success: true, job };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add photo',
        });
      }
    }),
});
