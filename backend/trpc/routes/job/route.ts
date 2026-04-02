import { z } from 'zod';
import { publicProcedure, router } from '../../trpc';

const isAdminOrMechanic = (role: UserRole) => role === UserRole.ADMIN || role === UserRole.MECHANIC;
const isAdminOrCustomer = (role: UserRole) => role === UserRole.ADMIN || role === UserRole.CUSTOMER;

export const jobRouter = router({
  create: publicProcedure
    .input(z.object({
      serviceType: z.string(),
      description: z.string(),
      photos: z.array(z.string().url()).optional(),
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
    .mutation(async ({ ctx, input }) => {
      try {
        if (!ctx.user || (ctx.user.role !== UserRole.CUSTOMER && ctx.user.role !== UserRole.ADMIN)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only customers can create jobs',
          });
        }

        const job = await prisma.job.create({
          data: {
            customerId: ctx.user.id,
            serviceType: input.serviceType,
            description: input.description,
            customerPhotos: input.photos ?? [],
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

  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      if (ctx.user.role === UserRole.CUSTOMER) {
        const jobs = await prisma.job.findMany({
          where: { customerId: ctx.user.id },
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: { firstName: true, lastName: true, email: true }
            },
            mechanic: {
              select: { firstName: true, lastName: true }
            },
            photos: true,
            activityLog: true,
            quotes: true
          }
        });
        return { jobs };
      }

      if (ctx.user.role === UserRole.MECHANIC) {
        const jobs = await prisma.job.findMany({
          where: {
            OR: [
              { mechanicId: ctx.user.id },
              { mechanicId: null },
            ],
          },
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: { firstName: true, lastName: true, email: true }
            },
            mechanic: {
              select: { firstName: true, lastName: true }
            },
            photos: true,
            activityLog: true,
            quotes: true
          }
        });
        return { jobs };
      }

      const jobs = await prisma.job.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { firstName: true, lastName: true, email: true }
          },
          mechanic: {
            select: { firstName: true, lastName: true }
          },
          photos: true,
          activityLog: true,
          quotes: true
        }
      });
      return { jobs };
    }),

  getById: protectedProcedure
    .input(z.object({
      jobId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

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

      if (ctx.user.role === UserRole.CUSTOMER && job.customerId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this job',
        });
      }

      await ensureMechanicCanReadJob(input.jobId, ctx.user.id, ctx.user.role);

      return { job };
    }),

  claim: protectedProcedure
    .input(z.object({
      jobId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      if (!isAdminOrMechanic(ctx.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only mechanics can claim jobs',
        });
      }

      const existingJob = await prisma.job.findUnique({
        where: { id: input.jobId },
        select: {
          id: true,
          mechanicId: true,
          status: true,
        },
      });

      if (!existingJob) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found',
        });
      }

      if (
        ctx.user.role === UserRole.MECHANIC &&
        existingJob.mechanicId &&
        existingJob.mechanicId !== ctx.user.id
      ) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Job is already claimed by another mechanic',
        });
      }

      const job = await prisma.job.update({
        where: { id: input.jobId },
        data: {
          mechanicId: ctx.user.id,
          status: existingJob.status === JobStatus.PENDING ? JobStatus.ACCEPTED : existingJob.status,
          activityLog: {
            create: {
              mechanicId: ctx.user.id,
              activity: 'Job claimed',
              notes: 'Job claimed by mechanic',
            },
          },
        },
      });

      return { success: true, job };
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      jobId: z.string(),
      status: z.enum(['pending', 'accepted', 'in-progress', 'completed', 'cancelled']),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      if (!isAdminOrMechanic(ctx.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only mechanics can update job status',
        });
      }

      await ensureMechanicCanMutateJob(input.jobId, ctx.user.id, ctx.user.role);

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

        emitToJobRoom(input.jobId, 'job:status-updated', {
          jobId: input.jobId,
          status: job.status,
          job,
          updatedBy: {
            userId: ctx.user.id,
            email: ctx.user.email,
            role: ctx.user.role,
          },
          timestamp: new Date().toISOString(),
        });
        
        return { success: true, job };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update job status',
        });
      }
    }),

  schedule: protectedProcedure
    .input(z.object({
      jobId: z.string(),
      scheduledDate: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      if (!isAdminOrCustomer(ctx.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only customers can schedule jobs',
        });
      }

      const job = await prisma.job.findUnique({
        where: { id: input.jobId },
        select: { customerId: true },
      });

      if (!job) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
      }

      if (ctx.user.role === UserRole.CUSTOMER && job.customerId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this job',
        });
      }

      try {
        const updatedJob = await prisma.job.update({
          where: { id: input.jobId },
          data: {
            scheduledDate: new Date(input.scheduledDate),
            status: JobStatus.ACCEPTED,
          },
        });

        return { success: true, job: updatedJob };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to schedule job',
        });
      }
    }),

  captureSignature: protectedProcedure
    .input(z.object({
      jobId: z.string(),
      signatureUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      if (!isAdminOrMechanic(ctx.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only mechanics can capture signatures',
        });
      }

      await ensureMechanicCanMutateJob(input.jobId, ctx.user.id, ctx.user.role);

      try {
        const job = await prisma.job.update({
          where: { id: input.jobId },
          data: {
            signatureUrl: input.signatureUrl,
            signatureCapturedAt: new Date(),
            signatureCapturedBy: ctx.user.id,
          },
        });

        return { success: true, job };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to capture signature',
        });
      }
    }),

  updatePartsApproval: protectedProcedure
    .input(z.object({
      jobId: z.string(),
      partsApproved: z.boolean(),
      estimatedPartsCost: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      if (!isAdminOrMechanic(ctx.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only mechanics can approve parts',
        });
      }

      await ensureMechanicCanMutateJob(input.jobId, ctx.user.id, ctx.user.role);

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

  updateTimeLog: protectedProcedure
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
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      if (!isAdminOrMechanic(ctx.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only mechanics can update time logs',
        });
      }

      await ensureMechanicCanMutateJob(input.jobId, ctx.user.id, ctx.user.role);

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

  addPhoto: protectedProcedure
    .input(z.object({
      jobId: z.string(),
      photoUrl: z.string(),
      description: z.string().optional(),
      mechanicId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      if (!isAdminOrMechanic(ctx.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only mechanics can add photos',
        });
      }

      await ensureMechanicCanMutateJob(input.jobId, ctx.user.id, ctx.user.role);

      try {
        const photo = await createJobPhotoRecord({
          jobId: input.jobId,
          mechanicId: input.mechanicId,
          photoUrl: input.photoUrl,
          description: input.description,
        });
        
        return { success: true, photo };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add photo',
        });
      }
    }),
});
