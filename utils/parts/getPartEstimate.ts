// Parts pricing estimation utility
// This is a mock implementation - in production this would integrate with AutoZone/O'Reilly APIs

interface PartEstimate {
  partName: string;
  estimatedPrice: number;
  confidence: 'high' | 'medium' | 'low';
  source: string;
  availability: 'in-stock' | 'order-required' | 'unknown';
}

// Mock parts database with common automotive parts
const mockPartsDatabase: Record<string, PartEstimate> = {
  // Engine parts
  'oil filter': {
    partName: 'Oil Filter',
    estimatedPrice: 12.99,
    confidence: 'high',
    source: 'AutoZone',
    availability: 'in-stock',
  },
  'air filter': {
    partName: 'Air Filter',
    estimatedPrice: 19.99,
    confidence: 'high',
    source: 'AutoZone',
    availability: 'in-stock',
  },
  'spark plugs': {
    partName: 'Spark Plugs (Set of 4)',
    estimatedPrice: 32.99,
    confidence: 'high',
    source: 'O\'Reilly',
    availability: 'in-stock',
  },
  'alternator': {
    partName: 'Alternator',
    estimatedPrice: 189.99,
    confidence: 'medium',
    source: 'AutoZone',
    availability: 'order-required',
  },
  'starter': {
    partName: 'Starter Motor',
    estimatedPrice: 159.99,
    confidence: 'medium',
    source: 'O\'Reilly',
    availability: 'order-required',
  },
  
  // Battery and electrical
  'battery': {
    partName: 'Car Battery',
    estimatedPrice: 129.99,
    confidence: 'high',
    source: 'AutoZone',
    availability: 'in-stock',
  },
  'battery cables': {
    partName: 'Battery Cables',
    estimatedPrice: 24.99,
    confidence: 'high',
    source: 'O\'Reilly',
    availability: 'in-stock',
  },
  
  // Brakes
  'brake pads': {
    partName: 'Brake Pads (Front)',
    estimatedPrice: 45.99,
    confidence: 'high',
    source: 'AutoZone',
    availability: 'in-stock',
  },
  'brake rotors': {
    partName: 'Brake Rotors (Pair)',
    estimatedPrice: 89.99,
    confidence: 'medium',
    source: 'O\'Reilly',
    availability: 'in-stock',
  },
  'brake fluid': {
    partName: 'Brake Fluid',
    estimatedPrice: 8.99,
    confidence: 'high',
    source: 'AutoZone',
    availability: 'in-stock',
  },
  
  // Tires and wheels
  'tire': {
    partName: 'Tire (Each)',
    estimatedPrice: 85.00,
    confidence: 'low',
    source: 'Estimate',
    availability: 'order-required',
  },
  'wheel bearing': {
    partName: 'Wheel Bearing',
    estimatedPrice: 67.99,
    confidence: 'medium',
    source: 'AutoZone',
    availability: 'order-required',
  },
  
  // Fluids
  'motor oil': {
    partName: 'Motor Oil (5 Quarts)',
    estimatedPrice: 24.99,
    confidence: 'high',
    source: 'O\'Reilly',
    availability: 'in-stock',
  },
  'coolant': {
    partName: 'Engine Coolant',
    estimatedPrice: 16.99,
    confidence: 'high',
    source: 'AutoZone',
    availability: 'in-stock',
  },
  'transmission fluid': {
    partName: 'Transmission Fluid',
    estimatedPrice: 19.99,
    confidence: 'high',
    source: 'O\'Reilly',
    availability: 'in-stock',
  },
  
  // Belts and hoses
  'serpentine belt': {
    partName: 'Serpentine Belt',
    estimatedPrice: 29.99,
    confidence: 'medium',
    source: 'AutoZone',
    availability: 'in-stock',
  },
  'timing belt': {
    partName: 'Timing Belt',
    estimatedPrice: 89.99,
    confidence: 'medium',
    source: 'O\'Reilly',
    availability: 'order-required',
  },
  'radiator hose': {
    partName: 'Radiator Hose',
    estimatedPrice: 34.99,
    confidence: 'medium',
    source: 'AutoZone',
    availability: 'in-stock',
  },
};

export async function getPartEstimate(partName: string): Promise<PartEstimate | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const normalizedPartName = partName.toLowerCase().trim();
  
  // Direct match
  if (mockPartsDatabase[normalizedPartName]) {
    return mockPartsDatabase[normalizedPartName];
  }
  
  // Fuzzy matching for partial matches
  const partKeys = Object.keys(mockPartsDatabase);
  const fuzzyMatch = partKeys.find(key => 
    key.includes(normalizedPartName) || normalizedPartName.includes(key)
  );
  
  if (fuzzyMatch) {
    const estimate = mockPartsDatabase[fuzzyMatch];
    return {
      ...estimate,
      confidence: 'low', // Lower confidence for fuzzy matches
    };
  }
  
  // Generic fallback estimate
  if (normalizedPartName.length > 2) {
    return {
      partName: partName,
      estimatedPrice: 50.00, // Generic estimate
      confidence: 'low',
      source: 'Generic Estimate',
      availability: 'unknown',
    };
  }
  
  return null;
}

export async function getMultiplePartEstimates(partNames: string[]): Promise<PartEstimate[]> {
  const estimates = await Promise.all(
    partNames.map(partName => getPartEstimate(partName))
  );
  
  return estimates.filter((estimate): estimate is PartEstimate => estimate !== null);
}

export function calculatePartsTotal(estimates: PartEstimate[]): number {
  return estimates.reduce((total, estimate) => total + estimate.estimatedPrice, 0);
}

// Motorcycle/Scooter specific parts
const motorcyclePartsDatabase: Record<string, PartEstimate> = {
  'motorcycle oil': {
    partName: 'Motorcycle Oil (1 Quart)',
    estimatedPrice: 18.99,
    confidence: 'high',
    source: 'AutoZone',
    availability: 'in-stock',
  },
  'motorcycle battery': {
    partName: 'Motorcycle Battery',
    estimatedPrice: 89.99,
    confidence: 'high',
    source: 'O\'Reilly',
    availability: 'in-stock',
  },
  'motorcycle tire': {
    partName: 'Motorcycle Tire',
    estimatedPrice: 120.00,
    confidence: 'medium',
    source: 'Estimate',
    availability: 'order-required',
  },
  'chain': {
    partName: 'Motorcycle Chain',
    estimatedPrice: 45.99,
    confidence: 'medium',
    source: 'AutoZone',
    availability: 'order-required',
  },
  'sprocket': {
    partName: 'Motorcycle Sprocket',
    estimatedPrice: 35.99,
    confidence: 'medium',
    source: 'O\'Reilly',
    availability: 'order-required',
  },
};

export async function getMotorcyclePartEstimate(partName: string): Promise<PartEstimate | null> {
  const normalizedPartName = partName.toLowerCase().trim();
  
  // Check motorcycle-specific parts first
  if (motorcyclePartsDatabase[normalizedPartName]) {
    return motorcyclePartsDatabase[normalizedPartName];
  }
  
  // Fall back to general parts database
  return getPartEstimate(partName);
}