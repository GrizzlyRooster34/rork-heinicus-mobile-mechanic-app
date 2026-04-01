import { TRPCError } from '@trpc/server';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createJobPhotoRecord, deleteJobPhoto, getJobPhotos } from '@/backend/services/storage';
import { protectedProcedure, router } from '../../trpc';

const canAccessJobPhotos = async (jobId: string, actorId: string, actorRole: UserRole) => {
  if (actorRole === UserRole.ADMIN) {
    return true;
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      customerId: true,
      mechanicId: true,
    },
  });

  if (!job) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Job not found',
    });
  }

  if (actorRole === UserRole.CUSTOMER && job.customerId === actorId) {
    return true;
  }

  if (actorRole === UserRole.MECHANIC && job.mechanicId === actorId) {
    return true;
  }

  throw new TRPCError({
    code: 'FORBIDDEN',
    message: 'You do not have access to these photos',
  });
};

export const photosRouter = router({
  uploadPhoto: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
        photoUrl: z.string().url(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      if (ctx.user.role !== UserRole.ADMIN && ctx.user.role !== UserRole.MECHANIC) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only mechanics can upload job photos',
        });
      }

      await canAccessJobPhotos(input.jobId, ctx.user.id, ctx.user.role);

      try {
        const photo = await createJobPhotoRecord({
          jobId: input.jobId,
          mechanicId: ctx.user.id,
          photoUrl: input.photoUrl,
          description: input.description,
        });

        return {
          success: true,
          photo,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to save job photo',
        });
      }
    }),

  getJobPhotos: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      await canAccessJobPhotos(input.jobId, ctx.user.id, ctx.user.role);

      return {
        success: true,
        photos: await getJobPhotos(input.jobId),
      };
    }),

  deletePhoto: protectedProcedure
    .input(
      z.object({
        photoId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      try {
        return await deleteJobPhoto(input.photoId, ctx.user.id, ctx.user.role);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete photo';
        if (message === 'Photo not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message,
          });
        }

        if (message === 'You do not have permission to delete this photo') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message,
          });
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message,
        });
      }
    }),
});
