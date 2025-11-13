import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../../create-router';
import { uploadPhoto, getJobPhotos, deletePhoto } from '../../../services/storage';

export const photosRouter = createTRPCRouter({
  uploadPhoto: publicProcedure
    .input(z.object({
      jobId: z.string(),
      uploaderId: z.string(),
      base64Data: z.string(),
      type: z.enum(['BEFORE', 'AFTER', 'DIAGNOSTIC', 'PARTS', 'GENERAL']).optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => uploadPhoto(input)),

  getJobPhotos: publicProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input }) => ({ success: true, photos: await getJobPhotos(input.jobId) })),

  deletePhoto: publicProcedure
    .input(z.object({ photoId: z.string(), userId: z.string() }))
    .mutation(async ({ input }) => deletePhoto(input.photoId, input.userId)),
});
