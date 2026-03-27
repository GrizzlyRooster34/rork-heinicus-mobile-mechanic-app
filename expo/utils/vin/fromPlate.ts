/**
 * License Plate to VIN Decoding Utility
 * Currently uses mock data, can be replaced with real DMV/CarFax API later
 */

export interface PlateDecodeResult {
  vin?: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  state: string;
  plateNumber: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'dmv' | 'carfax' | 'mock';
  error?: string;
}

// Mock database for demo purposes
const MOCK_PLATE_DATABASE: Record<string, Omit<PlateDecodeResult, 'state' | 'plateNumber' | 'source'>> = {
  'ABC123': {
    vin: 'WVWZZZ3BZWE689725',
    make: 'Volkswagen',
    model: 'Passat',
    year: 2008,
    color: 'Silver',
    confidence: 'high',
  },
  'XYZ789': {
    vin: '1HGBH41JXMN109186',
    make: 'Honda',
    model: 'Civic',
    year: 2021,
    color: 'Blue',
    confidence: 'high',
  },
  'DEF456': {
    vin: '1FTFW1ET5DFC10312',
    make: 'Ford',
    model: 'F-150',
    year: 2013,
    color: 'Red',
    confidence: 'medium',
  },
  'GHI012': {
    vin: '1G1ZT53806F109149',
    make: 'Chevrolet',
    model: 'Malibu',
    year: 2006,
    color: 'White',
    confidence: 'high',
  },
  'JKL345': {
    vin: 'JTDKN3DU8A0123456',
    make: 'Toyota',
    model: 'Prius',
    year: 2010,
    color: 'Green',
    confidence: 'medium',
  },
  'MNO678': {
    vin: '1N4AL3AP8DC123456',
    make: 'Nissan',
    model: 'Altima',
    year: 2013,
    color: 'Black',
    confidence: 'high',
  },
};

/**
 * Decode VIN information from license plate
 * @param plate - License plate number
 * @param state - State abbreviation (e.g., 'CA', 'NY', 'TX')
 * @returns Promise with vehicle information or error
 */
export async function decodePlateToVIN(plate: string, state: string): Promise<PlateDecodeResult> {
  const normalizedPlate = plate.toUpperCase().trim();
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check mock database
  const mockResult = MOCK_PLATE_DATABASE[normalizedPlate];
  
  if (mockResult) {
    return {
      ...mockResult,
      state: state.toUpperCase(),
      plateNumber: normalizedPlate,
      source: 'mock',
    };
  }
  
  // If not found in mock database, return partial info
  return {
    state: state.toUpperCase(),
    plateNumber: normalizedPlate,
    confidence: 'low',
    source: 'mock',
    error: 'Vehicle information not found for this license plate',
  };
}

/**
 * Validate license plate format
 * @param plate - License plate number
 * @param state - State abbreviation
 * @returns boolean indicating if format is valid
 */
export function validatePlateFormat(plate: string, state?: string): boolean {
  const normalizedPlate = plate.toUpperCase().trim();
  
  // Basic validation - alphanumeric, 2-8 characters
  const basicPattern = /^[A-Z0-9\s\-]{2,8}$/;
  
  if (!basicPattern.test(normalizedPlate)) {
    return false;
  }
  
  // State-specific validation (simplified)
  const statePatterns: Record<string, RegExp> = {
    'CA': /^[A-Z0-9]{2,7}$/, // California format
    'NY': /^[A-Z0-9]{2,8}$/, // New York format
    'TX': /^[A-Z0-9]{2,7}$/, // Texas format
    'FL': /^[A-Z0-9]{2,7}$/, // Florida format
    // Add more states as needed
  };
  
  if (state && statePatterns[state.toUpperCase()]) {
    return statePatterns[state.toUpperCase()].test(normalizedPlate);
  }
  
  return true; // Default to valid if no state-specific pattern
}

/**
 * Get supported states for plate lookup
 * @returns Array of state abbreviations
 */
export function getSupportedStates(): string[] {
  return [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    'DC' // District of Columbia
  ];
}

/**
 * Get state name from abbreviation
 * @param stateCode - State abbreviation
 * @returns Full state name
 */
export function getStateName(stateCode: string): string {
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