import { z } from 'zod';
import { publicProcedure, router } from '../../trpc';
import { prisma } from '@/lib/prisma';
import { UrgencyLevel } from '@prisma/client';
import { TRPCError } from '@trpc/server';

// Input schemas
const vehicleInfoSchema = z.object({
  make: z.string(),
  model: z.string(),
  year: z.number(),
  mileage: z.number().optional(),
  engine: z.string().optional(),
  vin: z.string().optional(),
});

const diagnosisInputSchema = z.object({
  userId: z.string(), // In production, from ctx.user
  vehicleInfo: vehicleInfoSchema,
  symptoms: z.string().min(10, 'Please provide more detailed symptoms'),
  additionalContext: z.string().optional(),
});

// Mock AI service
async function generateAIDiagnosis(input: z.infer<typeof diagnosisInputSchema>) {
  // Simulate AI processing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const symptomsLower = input.symptoms.toLowerCase();
  let urgency: UrgencyLevel = UrgencyLevel.MEDIUM;
  
  if (symptomsLower.includes('brake') || symptomsLower.includes('smoke')) urgency = UrgencyLevel.HIGH;
  if (symptomsLower.includes('wont start') || symptomsLower.includes('won\'t start')) urgency = UrgencyLevel.EMERGENCY;
  if (symptomsLower.includes('scratch') || symptomsLower.includes('wiper')) urgency = UrgencyLevel.LOW;

  return {
    likelyCauses: ['Potential issue A', 'Potential issue B'],
    diagnosticSteps: ['Step 1: Check X', 'Step 2: Verify Y'],
    urgencyLevel: urgency,
    confidence: 'High',
    matchedServices: ['General Diagnostic'],
    recommendedServiceTypes: ['diagnostic'],
    estimatedCostMin: 100,
    estimatedCostMax: 300,
  };
}

export const diagnosisRouter = createTRPCRouter({
  diagnose: publicProcedure
    .input(diagnosisInputSchema)
    .mutation(async ({ input }) => {
      try {
        // Generate diagnosis (Mock AI)
        const aiResult = await generateAIDiagnosis(input);
        
        // Save to database
        const diagnosis = await prisma.diagnosisResult.create({
          data: {
            userId: input.userId,
            vehicleMake: input.vehicleInfo.make,
            vehicleModel: input.vehicleInfo.model,
            vehicleYear: input.vehicleInfo.year,
            vehicleMileage: input.vehicleInfo.mileage,
            vehicleEngine: input.vehicleInfo.engine,
            vehicleVin: input.vehicleInfo.vin,
            symptoms: input.symptoms,
            additionalContext: input.additionalContext,
            
            likelyCauses: aiResult.likelyCauses,
            diagnosticSteps: aiResult.diagnosticSteps,
            urgencyLevel: aiResult.urgencyLevel,
            confidence: aiResult.confidence,
            matchedServices: aiResult.matchedServices,
            recommendedServiceTypes: aiResult.recommendedServiceTypes,
            
            estimatedCostMin: aiResult.estimatedCostMin,
            estimatedCostMax: aiResult.estimatedCostMax,
          }
        });
        
        return diagnosis;
      } catch (error) {
        console.error('Diagnosis error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate diagnosis',
        });
      }
    }),

  getHistory: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const history = await prisma.diagnosisResult.findMany({
        where: { userId: input.userId },
        orderBy: { createdAt: 'desc' }
      });
      return { history };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const diagnosis = await prisma.diagnosisResult.findUnique({
        where: { id: input.id },
        include: { quotes: true }
      });
      
      if (!diagnosis) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Diagnosis not found' });
      }
      return diagnosis;
    }),
});
