import { z } from 'zod';
import { publicProcedure, router } from '../../trpc';
import { DiagnosticResult } from '@/types/service';

const vehicleInfoSchema = z.object({
  make: z.string(),
  model: z.string(),
  year: z.number(),
  mileage: z.number().optional(),
  engine: z.string().optional(),
  vin: z.string().optional(),
});

const diagnosisInputSchema = z.object({
  vehicleInfo: vehicleInfoSchema,
  symptoms: z.string().min(10, 'Please provide more detailed symptoms'),
  additionalContext: z.string().optional(),
});

// Mock AI diagnosis service - in production, this would call OpenAI or similar
async function generateAIDiagnosis(input: z.infer<typeof diagnosisInputSchema>): Promise<DiagnosticResult> {
  const { vehicleInfo, symptoms, additionalContext } = input;
  
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock AI analysis based on symptoms
  const symptomsLower = symptoms.toLowerCase();
  
  let likelyCauses: string[] = [];
  let diagnosticSteps: string[] = [];
  let urgencyLevel: 'low' | 'medium' | 'high' | 'emergency' = 'medium';
  let confidence: 'low' | 'medium' | 'high' = 'medium';
  let matchedServices: string[] = [];
  let recommendedServiceTypes: string[] = [];
  let estimatedCost: { min: number; max: number } | undefined;
  
  // Engine-related symptoms
  if (symptomsLower.includes('engine') || symptomsLower.includes('noise') || symptomsLower.includes('grinding')) {
    likelyCauses = [
      'Worn engine bearings or connecting rod bearings',
      'Timing chain or belt issues',
      'Low oil pressure or oil pump failure',
      'Carbon buildup in combustion chambers'
    ];
    diagnosticSteps = [
      'Perform comprehensive engine diagnostic scan',
      'Check oil level and quality',
      'Listen to engine with stethoscope to isolate noise source',
      'Inspect timing components and belt/chain tension'
    ];
    urgencyLevel = symptomsLower.includes('grinding') ? 'high' : 'medium';
    confidence = 'high';
    matchedServices = ['Engine Diagnostic', 'Oil Change', 'Engine Repair'];
    recommendedServiceTypes = ['engine_diagnostic'];
    estimatedCost = { min: 150, max: 800 };
  }
  
  // Brake-related symptoms
  else if (symptomsLower.includes('brake') || symptomsLower.includes('squeal') || symptomsLower.includes('stopping')) {
    likelyCauses = [
      'Worn brake pads requiring replacement',
      'Warped brake rotors causing vibration',
      'Low brake fluid or brake fluid leak',
      'Brake caliper sticking or malfunction'
    ];
    diagnosticSteps = [
      'Visual inspection of brake pads and rotors',
      'Check brake fluid level and color',
      'Test brake pedal feel and travel',
      'Measure rotor thickness and runout'
    ];
    urgencyLevel = 'high';
    confidence = 'high';
    matchedServices = ['Brake Service', 'Brake Pad Replacement', 'Brake Inspection'];
    recommendedServiceTypes = ['brake_service'];
    estimatedCost = { min: 200, max: 600 };
  }
  
  // Transmission symptoms
  else if (symptomsLower.includes('transmission') || symptomsLower.includes('shifting') || symptomsLower.includes('gear')) {
    likelyCauses = [
      'Low transmission fluid or fluid leak',
      'Worn transmission bands or clutches',
      'Faulty transmission solenoids',
      'Torque converter issues'
    ];
    diagnosticSteps = [
      'Check transmission fluid level and condition',
      'Perform transmission diagnostic scan',
      'Road test to evaluate shift quality',
      'Inspect for external leaks'
    ];
    urgencyLevel = 'medium';
    confidence = 'medium';
    matchedServices = ['Transmission Service', 'Transmission Repair', 'Fluid Change'];
    recommendedServiceTypes = ['transmission'];
    estimatedCost = { min: 300, max: 1200 };
  }
  
  // Battery/electrical symptoms
  else if (symptomsLower.includes('battery') || symptomsLower.includes('start') || symptomsLower.includes('electrical')) {
    likelyCauses = [
      'Weak or failing battery',
      'Corroded battery terminals',
      'Faulty alternator not charging properly',
      'Parasitic electrical drain'
    ];
    diagnosticSteps = [
      'Test battery voltage and load capacity',
      'Check alternator charging rate',
      'Inspect battery terminals for corrosion',
      'Perform parasitic draw test if needed'
    ];
    urgencyLevel = symptomsLower.includes('won\'t start') ? 'emergency' : 'medium';
    confidence = 'high';
    matchedServices = ['Battery Service', 'Electrical Diagnostic', 'Alternator Service'];
    recommendedServiceTypes = ['battery_service'];
    estimatedCost = { min: 100, max: 400 };
  }
  
  // A/C symptoms
  else if (symptomsLower.includes('air conditioning') || symptomsLower.includes('a/c') || symptomsLower.includes('cooling')) {
    likelyCauses = [
      'Low refrigerant due to leak in system',
      'Faulty A/C compressor',
      'Clogged cabin air filter',
      'Electrical issues with A/C controls'
    ];
    diagnosticSteps = [
      'Check A/C system pressures',
      'Inspect for refrigerant leaks',
      'Test A/C compressor operation',
      'Replace cabin air filter if dirty'
    ];
    urgencyLevel = 'low';
    confidence = 'medium';
    matchedServices = ['A/C Service', 'A/C Repair', 'Refrigerant Recharge'];
    recommendedServiceTypes = ['ac_service'];
    estimatedCost = { min: 150, max: 500 };
  }
  
  // Tire symptoms
  else if (symptomsLower.includes('tire') || symptomsLower.includes('vibration') || symptomsLower.includes('alignment')) {
    likelyCauses = [
      'Uneven tire wear due to misalignment',
      'Tire imbalance causing vibration',
      'Low tire pressure',
      'Worn suspension components'
    ];
    diagnosticSteps = [
      'Inspect tire tread depth and wear patterns',
      'Check tire pressure in all tires',
      'Perform wheel balance check',
      'Inspect suspension components'
    ];
    urgencyLevel = 'medium';
    confidence = 'high';
    matchedServices = ['Tire Service', 'Wheel Alignment', 'Tire Rotation'];
    recommendedServiceTypes = ['tire_service'];
    estimatedCost = { min: 80, max: 300 };
  }
  
  // General/unknown symptoms
  else {
    likelyCauses = [
      'Multiple potential causes require diagnostic testing',
      'Intermittent issue requiring detailed inspection',
      'Age-related wear requiring comprehensive evaluation'
    ];
    diagnosticSteps = [
      'Perform comprehensive vehicle diagnostic scan',
      'Visual inspection of major systems',
      'Road test to reproduce symptoms',
      'Consult technical service bulletins'
    ];
    urgencyLevel = 'medium';
    confidence = 'low';
    matchedServices = ['General Diagnostic', 'Multi-Point Inspection'];
    recommendedServiceTypes = ['general_repair'];
    estimatedCost = { min: 100, max: 500 };
  }
  
  // Adjust based on vehicle age
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - vehicleInfo.year;
  
  if (vehicleAge > 15) {
    urgencyLevel = urgencyLevel === 'low' ? 'medium' : urgencyLevel;
    if (estimatedCost) {
      estimatedCost.min = Math.round(estimatedCost.min * 1.2);
      estimatedCost.max = Math.round(estimatedCost.max * 1.3);
    }
  }
  
  // Adjust based on mileage
  if (vehicleInfo.mileage && vehicleInfo.mileage > 150000) {
    if (estimatedCost) {
      estimatedCost.min = Math.round(estimatedCost.min * 1.1);
      estimatedCost.max = Math.round(estimatedCost.max * 1.2);
    }
  }
  
  return {
    id: Date.now().toString(),
    vehicleInfo,
    symptoms,
    additionalContext,
    likelyCauses,
    diagnosticSteps,
    urgencyLevel,
    confidence,
    matchedServices,
    recommendedServiceTypes: recommendedServiceTypes.length > 0 ? recommendedServiceTypes : undefined,
    estimatedCost,
    createdAt: new Date(),
  };
}

export const diagnoseProcedure = publicProcedure
  .input(diagnosisInputSchema)
  .mutation(async ({ input }) => {
    try {
      // In production, this would call a real AI service
      const diagnosis = await generateAIDiagnosis(input);
      
      // Log the diagnosis for analytics
      console.log('AI Diagnosis Generated:', {
        vehicleMake: input.vehicleInfo.make,
        vehicleModel: input.vehicleInfo.model,
        symptomsLength: input.symptoms.length,
        urgencyLevel: diagnosis.urgencyLevel,
        confidence: diagnosis.confidence,
        recommendedServices: diagnosis.recommendedServiceTypes?.length || 0,
      });
      
      return diagnosis;
    } catch (error) {
      console.error('AI Diagnosis Error:', error);
      throw new Error('Failed to generate AI diagnosis. Please try again or contact support.');
    }
  });

// Export the diagnosis router
export const diagnosisRouter = router({
  diagnose: diagnoseProcedure,
});