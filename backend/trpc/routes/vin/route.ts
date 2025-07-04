import { z } from 'zod';
import { publicProcedure, router } from '../../trpc';
import { decodePlateToVIN, validatePlateFormat, getSupportedStates } from '@/utils/vin/fromPlate';

// VIN decoding from license plate
export const decodeFromPlateProcedure = publicProcedure
  .input(z.object({
    plate: z.string().min(2).max(8),
    state: z.string().length(2),
  }))
  .query(async ({ input }) => {
    try {
      // Validate plate format
      if (!validatePlateFormat(input.plate, input.state)) {
        throw new Error('Invalid license plate format for the specified state');
      }

      // Decode VIN from plate
      const result = await decodePlateToVIN(input.plate, input.state);
      
      console.log('License Plate Decode:', {
        plate: input.plate,
        state: input.state,
        found: !!result.vin,
        confidence: result.confidence,
      });

      return result;
    } catch (error) {
      console.error('License Plate Decode Error:', error);
      throw new Error('Failed to decode license plate. Please try again or enter VIN manually.');
    }
  });

// Get supported states for plate lookup
export const getSupportedStatesProcedure = publicProcedure
  .query(() => {
    return getSupportedStates().map(code => ({
      code,
      name: getStateName(code),
    }));
  });

// Validate plate format
export const validatePlateProcedure = publicProcedure
  .input(z.object({
    plate: z.string(),
    state: z.string().optional(),
  }))
  .query(({ input }) => {
    return {
      isValid: validatePlateFormat(input.plate, input.state),
      normalizedPlate: input.plate.toUpperCase().trim(),
    };
  });

// Helper function for state names (could be moved to utils)
function getStateName(stateCode: string): string {
  const stateNames: Record<string, string> = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
    'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
    'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
    'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
    'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
    'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
    'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
    'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
    'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
    'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
    'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
  };
  
  return stateNames[stateCode.toUpperCase()] || stateCode;
}

// Export the VIN router
export const vinRouter = router({
  decodeFromPlate: decodeFromPlateProcedure,
  getSupportedStates: getSupportedStatesProcedure,
  validatePlate: validatePlateProcedure,
});