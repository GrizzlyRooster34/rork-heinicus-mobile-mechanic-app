import { TRPCError } from '@trpc/server';
import { UserRole, VehicleType as PrismaVehicleType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { protectedProcedure, router } from '../../trpc';

const customerOrAdmin = (role: UserRole) => role === UserRole.CUSTOMER || role === UserRole.ADMIN;
const vehicleTypeInputSchema = z.enum(['car', 'motorcycle', 'scooter']);

const toPrismaVehicleType = (vehicleType: z.infer<typeof vehicleTypeInputSchema>): PrismaVehicleType => {
  switch (vehicleType) {
    case 'motorcycle':
      return PrismaVehicleType.MOTORCYCLE;
    case 'scooter':
      return PrismaVehicleType.SCOOTER;
    case 'car':
    default:
      return PrismaVehicleType.CAR;
  }
};

export const customerRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    const profile = await prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        role: true,
        vehicles: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!profile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User profile not found',
      });
    }

    return { profile };
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        firstName: z.string().trim().min(1),
        lastName: z.string().trim().min(1),
        email: z.string().trim().email(),
        phone: z.string().trim().optional(),
        address: z.string().trim().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      if (!customerOrAdmin(ctx.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only customers can update this profile',
        });
      }

      try {
        const user = await prisma.user.update({
          where: { id: ctx.user.id },
          data: {
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email.toLowerCase(),
            phone: input.phone || null,
            address: input.address || null,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            address: true,
            role: true,
            createdAt: true,
          },
        });

        return { success: true, user };
      } catch (error: any) {
        if (error?.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email is already in use',
          });
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update profile',
        });
      }
    }),

  addVehicle: protectedProcedure
    .input(
      z.object({
        make: z.string().trim().min(1),
        model: z.string().trim().min(1),
        year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
        vehicleType: vehicleTypeInputSchema.default('car'),
        vin: z.string().trim().optional(),
        licensePlate: z.string().trim().optional(),
        mileage: z.number().int().nonnegative().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      if (!customerOrAdmin(ctx.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only customers can manage vehicles',
        });
      }

      const vehicle = await prisma.vehicle.create({
        data: {
          userId: ctx.user.id,
          make: input.make,
          model: input.model,
          year: input.year,
          vehicleType: toPrismaVehicleType(input.vehicleType),
          vin: input.vin || null,
          licensePlate: input.licensePlate || null,
          mileage: input.mileage ?? 0,
        },
      });

      return { success: true, vehicle };
    }),

  removeVehicle: protectedProcedure
    .input(
      z.object({
        vehicleId: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      if (!customerOrAdmin(ctx.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only customers can manage vehicles',
        });
      }

      const vehicle = await prisma.vehicle.findUnique({
        where: { id: input.vehicleId },
        select: { id: true, userId: true },
      });

      if (!vehicle) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Vehicle not found',
        });
      }

      if (vehicle.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this vehicle',
        });
      }

      await prisma.vehicle.delete({
        where: { id: input.vehicleId },
      });

      return { success: true };
    }),
});
