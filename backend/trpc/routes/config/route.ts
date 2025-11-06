import { router, publicProcedure } from '../../trpc';
import { z } from 'zod';
import { prisma } from '../../../../lib/prisma';
import { TRPCError } from '@trpc/server';

/**
 * Configuration Router
 * Handles system-wide configuration and settings
 * Uses SystemSettings table for persistence
 */
export const configRouter = router({
  /**
   * Get all configuration settings
   */
  getAll: publicProcedure
    .input(z.object({
      category: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      try {
        const where: any = {};

        if (input?.category) {
          where.category = input.category;
        }

        const settings = await prisma.systemSettings.findMany({
          where,
          orderBy: {
            category: 'asc',
          },
        });

        // If no settings exist, return defaults
        if (settings.length === 0) {
          return getDefaultSettings();
        }

        return settings;
      } catch (error) {
        console.error('Error fetching config:', error);
        // Return defaults on error
        return getDefaultSettings();
      }
    }),

  /**
   * Get a single configuration value by key
   */
  get: publicProcedure
    .input(z.object({
      key: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const setting = await prisma.systemSettings.findUnique({
          where: { key: input.key }
        });

        if (!setting) {
          // Return default value if setting doesn't exist
          const defaults = getDefaultSettings();
          const defaultSetting = defaults.find(s => s.key === input.key);

          if (defaultSetting) {
            return defaultSetting;
          }

          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Setting '${input.key}' not found`,
          });
        }

        return setting;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error fetching config setting:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch setting',
        });
      }
    }),

  /**
   * Set or update a configuration value
   */
  set: publicProcedure
    .input(z.object({
      key: z.string(),
      value: z.union([z.string(), z.boolean(), z.number(), z.object({}).passthrough()]),
      type: z.enum(['string', 'number', 'boolean', 'object']).optional(),
      category: z.string().optional(),
      label: z.string().optional(),
      description: z.string().optional(),
      updatedBy: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Determine type if not provided
        const type = input.type || inferType(input.value);

        // Upsert the setting
        const setting = await prisma.systemSettings.upsert({
          where: { key: input.key },
          update: {
            value: input.value,
            type,
            category: input.category,
            label: input.label,
            description: input.description,
            updatedBy: input.updatedBy,
          },
          create: {
            key: input.key,
            value: input.value,
            type,
            category: input.category || 'general',
            label: input.label || input.key,
            description: input.description,
            updatedBy: input.updatedBy,
          },
        });

        console.log(`Config updated: ${input.key} = ${JSON.stringify(input.value)}`);

        return { success: true, setting };
      } catch (error) {
        console.error('Error updating config:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update setting',
        });
      }
    }),

  /**
   * Delete a configuration setting
   */
  delete: publicProcedure
    .input(z.object({
      key: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        await prisma.systemSettings.delete({
          where: { key: input.key }
        });

        console.log(`Config deleted: ${input.key}`);

        return { success: true };
      } catch (error) {
        console.error('Error deleting config:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete setting',
        });
      }
    }),

  /**
   * Reset all settings to defaults
   */
  resetToDefaults: publicProcedure
    .mutation(async () => {
      try {
        // Delete all existing settings
        await prisma.systemSettings.deleteMany({});

        // Create default settings
        const defaults = getDefaultSettings();

        await prisma.systemSettings.createMany({
          data: defaults.map(setting => ({
            ...setting,
            value: setting.value,
          })),
        });

        console.log('Config reset to defaults');

        return { success: true, settings: defaults };
      } catch (error) {
        console.error('Error resetting config:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reset settings',
        });
      }
    }),
});

/**
 * Get default configuration settings
 */
function getDefaultSettings() {
  return [
    {
      key: 'isProduction',
      value: false,
      type: 'boolean',
      category: 'general',
      label: 'Production Mode',
      description: 'Whether the app is running in production mode',
    },
    {
      key: 'enableChatbot',
      value: true,
      type: 'boolean',
      category: 'features',
      label: 'Enable Chatbot',
      description: 'Enable AI chatbot assistant',
    },
    {
      key: 'enableVINCheck',
      value: true,
      type: 'boolean',
      category: 'features',
      label: 'Enable VIN Check',
      description: 'Enable VIN lookup and validation',
    },
    {
      key: 'showScooterSupport',
      value: true,
      type: 'boolean',
      category: 'features',
      label: 'Scooter Support',
      description: 'Show scooter service options',
    },
    {
      key: 'showMotorcycleSupport',
      value: true,
      type: 'boolean',
      category: 'features',
      label: 'Motorcycle Support',
      description: 'Show motorcycle service options',
    },
    {
      key: 'maintenanceMode',
      value: false,
      type: 'boolean',
      category: 'general',
      label: 'Maintenance Mode',
      description: 'Put the app in maintenance mode',
    },
    {
      key: 'maxJobsPerDay',
      value: 10,
      type: 'number',
      category: 'limits',
      label: 'Max Jobs Per Day',
      description: 'Maximum number of jobs per mechanic per day',
    },
    {
      key: 'defaultTravelRadius',
      value: 25,
      type: 'number',
      category: 'limits',
      label: 'Default Travel Radius',
      description: 'Default travel radius in miles',
    },
    {
      key: 'notificationRetentionDays',
      value: 30,
      type: 'number',
      category: 'notifications',
      label: 'Notification Retention',
      description: 'Days to keep notifications before deletion',
    },
  ];
}

/**
 * Infer the type of a value
 */
function inferType(value: any): string {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') return 'string';
  return 'object';
}
