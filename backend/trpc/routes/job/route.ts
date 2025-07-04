import { z } from 'zod';
import { publicProcedure, createTRPCRouter } from '../../create-context';

// Mock job storage - in production this would be a database
const jobStorage = new Map();

export const jobRouter = createTRPCRouter({
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
      const jobId = `job-${Date.now()}`;
      const job = {
        id: jobId,
        ...input,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        timeStarted: null,
        timePaused: null,
        timeEnded: null,
        totalDuration: 0,
      };
      
      jobStorage.set(jobId, job);
      console.log('Job created:', jobId);
      
      return { success: true, job };
    }),

  getAll: publicProcedure
    .query(async () => {
      const jobs = Array.from(jobStorage.values());
      return { jobs };
    }),

  getById: publicProcedure
    .input(z.object({
      jobId: z.string(),
    }))
    .query(async ({ input }) => {
      const job = jobStorage.get(input.jobId);
      if (!job) {
        throw new Error('Job not found');
      }
      return { job };
    }),

  updateStatus: publicProcedure
    .input(z.object({
      jobId: z.string(),
      status: z.enum(['pending', 'accepted', 'in-progress', 'completed', 'cancelled']),
    }))
    .mutation(async ({ input }) => {
      const job = jobStorage.get(input.jobId);
      if (!job) {
        throw new Error('Job not found');
      }
      
      job.status = input.status;
      job.updatedAt = new Date();
      jobStorage.set(input.jobId, job);
      
      console.log('Job status updated:', input.jobId, input.status);
      return { success: true, job };
    }),

  updatePartsApproval: publicProcedure
    .input(z.object({
      jobId: z.string(),
      partsApproved: z.boolean(),
      estimatedPartsCost: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const job = jobStorage.get(input.jobId);
      if (!job) {
        throw new Error('Job not found');
      }
      
      job.partsApproved = input.partsApproved;
      if (input.estimatedPartsCost !== undefined) {
        job.estimatedPartsCost = input.estimatedPartsCost;
      }
      job.updatedAt = new Date();
      jobStorage.set(input.jobId, job);
      
      console.log('Job parts approval updated:', input.jobId, input.partsApproved);
      return { success: true, job };
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
      const job = jobStorage.get(input.jobId);
      if (!job) {
        throw new Error('Job not found');
      }
      
      // Update time tracking fields
      if (input.timeStarted) {
        job.timeStarted = input.timeStarted;
      }
      if (input.timePaused) {
        job.timePaused = input.timePaused;
      }
      if (input.timeEnded) {
        job.timeEnded = input.timeEnded;
      }
      if (input.duration !== undefined) {
        job.totalDuration = input.duration;
      }
      
      // Add to activity log
      if (!job.activityLog) {
        job.activityLog = [];
      }
      
      job.activityLog.push({
        timestamp: new Date(),
        mechanicId: input.mechanicId,
        activity: input.activity || 'Time updated',
        notes: input.notes,
        duration: input.duration,
      });
      
      job.updatedAt = new Date();
      jobStorage.set(input.jobId, job);
      
      console.log('Job time log updated:', input.jobId, input.activity);
      return { success: true, job };
    }),

  addPhoto: publicProcedure
    .input(z.object({
      jobId: z.string(),
      photoUrl: z.string(),
      description: z.string().optional(),
      mechanicId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const job = jobStorage.get(input.jobId);
      if (!job) {
        throw new Error('Job not found');
      }
      
      if (!job.photos) {
        job.photos = [];
      }
      
      job.photos.push({
        id: `photo-${Date.now()}`,
        url: input.photoUrl,
        description: input.description,
        mechanicId: input.mechanicId,
        timestamp: new Date(),
      });
      
      job.updatedAt = new Date();
      jobStorage.set(input.jobId, job);
      
      console.log('Photo added to job:', input.jobId);
      return { success: true, job };
    }),
});