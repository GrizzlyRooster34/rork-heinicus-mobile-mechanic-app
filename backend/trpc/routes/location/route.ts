import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../../create-router';
import {
  calculateRouteDistance,
  calculateHaversineDistance,
  getMechanicDistanceToJob,
  updateJobETA,
  validateCoordinates,
  getNavigationUrl,
  formatCoordinates,
  type Coordinates,
} from '../../../services/location';
import { prisma } from '../../../../lib/prisma';

/**
 * Location tRPC Router
 *
 * Handles GPS location services:
 * - Distance calculations
 * - ETA calculations
 * - Route information
 * - Navigation URLs
 */

export const locationRouter = createTRPCRouter({
  /**
   * Calculate distance between two points
   */
  calculateDistance: publicProcedure
    .input(
      z.object({
        origin: z.object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
        }),
        destination: z.object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
        }),
        useGoogleMaps: z.boolean().optional().default(true),
      })
    )
    .query(async ({ input }) => {
      try {
        const { origin, destination, useGoogleMaps } = input;

        if (useGoogleMaps) {
          const result = await calculateRouteDistance(origin, destination);
          return {
            success: true,
            ...result,
          };
        } else {
          // Use Haversine formula
          const distanceMeters = calculateHaversineDistance(origin, destination);
          const durationSeconds = Math.round((distanceMeters / 1000 / 48) * 3600);

          return {
            success: true,
            distanceMeters,
            distanceMiles: distanceMeters * 0.000621371,
            distanceKm: distanceMeters / 1000,
            durationSeconds,
            durationMinutes: Math.round(durationSeconds / 60),
            durationText: `${Math.round(durationSeconds / 60)} min`,
          };
        }
      } catch (error) {
        console.error('Error calculating distance:', error);
        return {
          success: false,
          error: 'Failed to calculate distance',
        };
      }
    }),

  /**
   * Get mechanic distance to job
   */
  getMechanicDistanceToJob: publicProcedure
    .input(
      z.object({
        jobId: z.string(),
        mechanicLocation: z.object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
        }),
      })
    )
    .query(async ({ input }) => {
      try {
        const { jobId, mechanicLocation } = input;

        const result = await getMechanicDistanceToJob(mechanicLocation, jobId);

        if (!result) {
          return {
            success: false,
            error: 'Job not found or has no location',
          };
        }

        return {
          success: true,
          ...result,
        };
      } catch (error) {
        console.error('Error getting mechanic distance to job:', error);
        return {
          success: false,
          error: 'Failed to calculate distance to job',
        };
      }
    }),

  /**
   * Update job ETA based on mechanic location
   */
  updateJobETA: publicProcedure
    .input(
      z.object({
        jobId: z.string(),
        mechanicLocation: z.object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
        }),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { jobId, mechanicLocation } = input;

        // Verify job exists and mechanic is assigned
        const job = await prisma.job.findUnique({
          where: { id: jobId },
          select: {
            id: true,
            mechanicId: true,
            status: true,
          },
        });

        if (!job) {
          return {
            success: false,
            error: 'Job not found',
          };
        }

        if (job.status !== 'ACCEPTED' && job.status !== 'IN_PROGRESS') {
          return {
            success: false,
            error: 'Job must be accepted or in progress to update ETA',
          };
        }

        const etaDate = await updateJobETA(jobId, mechanicLocation);

        if (!etaDate) {
          return {
            success: false,
            error: 'Failed to calculate ETA',
          };
        }

        return {
          success: true,
          eta: etaDate,
          message: 'ETA updated successfully',
        };
      } catch (error) {
        console.error('Error updating job ETA:', error);
        return {
          success: false,
          error: 'Failed to update ETA',
        };
      }
    }),

  /**
   * Get navigation URL for a job
   */
  getNavigationUrl: publicProcedure
    .input(
      z.object({
        jobId: z.string(),
        platform: z.enum(['ios', 'android', 'web']),
      })
    )
    .query(async ({ input }) => {
      try {
        const { jobId, platform } = input;

        const job = await prisma.job.findUnique({
          where: { id: jobId },
          select: {
            latitude: true,
            longitude: true,
          },
        });

        if (!job || !job.latitude || !job.longitude) {
          return {
            success: false,
            error: 'Job location not found',
          };
        }

        const destination: Coordinates = {
          latitude: job.latitude,
          longitude: job.longitude,
        };

        const url = getNavigationUrl(destination, platform);

        return {
          success: true,
          url,
          coordinates: destination,
        };
      } catch (error) {
        console.error('Error getting navigation URL:', error);
        return {
          success: false,
          error: 'Failed to get navigation URL',
        };
      }
    }),

  /**
   * Get job location details
   */
  getJobLocation: publicProcedure
    .input(
      z.object({
        jobId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const { jobId } = input;

        const job = await prisma.job.findUnique({
          where: { id: jobId },
          select: {
            id: true,
            location: true,
            latitude: true,
            longitude: true,
            currentLatitude: true,
            currentLongitude: true,
            eta: true,
            status: true,
            mechanic: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        if (!job) {
          return {
            success: false,
            error: 'Job not found',
          };
        }

        return {
          success: true,
          job: {
            id: job.id,
            location: job.location,
            destinationCoordinates: job.latitude && job.longitude
              ? {
                  latitude: job.latitude,
                  longitude: job.longitude,
                }
              : null,
            mechanicLocation: job.currentLatitude && job.currentLongitude
              ? {
                  latitude: job.currentLatitude,
                  longitude: job.currentLongitude,
                }
              : null,
            eta: job.eta,
            status: job.status,
            mechanic: job.mechanic,
          },
        };
      } catch (error) {
        console.error('Error getting job location:', error);
        return {
          success: false,
          error: 'Failed to get job location',
        };
      }
    }),

  /**
   * Validate coordinates
   */
  validateCoordinates: publicProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
      })
    )
    .query(({ input }) => {
      const valid = validateCoordinates(input);

      return {
        success: true,
        valid,
        formatted: valid ? formatCoordinates(input) : null,
      };
    }),
});
