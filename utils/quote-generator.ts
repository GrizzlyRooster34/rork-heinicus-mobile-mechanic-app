import { ServiceType, DiagnosticResult, MaintenanceInterval, Vehicle } from '@/types/service';
import { SERVICE_PRICING } from '@/constants/pricing';
import { Quote } from '@/types/service';

export interface QuoteOptions {
  serviceType: ServiceType;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  description: string;
  selectedParts?: string[];
  customLaborHours?: number;
  discountPercent?: number;
  aiDiagnosis?: DiagnosticResult;
  vehicle?: Vehicle;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export function generateSmartQuote(
  serviceRequestId: string,
  options: QuoteOptions
): Quote {
  const pricing = SERVICE_PRICING[options.serviceType];
  
  // Calculate labor cost
  let laborHours = options.customLaborHours || pricing.estimatedHours;
  let laborRate = pricing.laborRate;
  
  // AI diagnosis can affect labor time and complexity
  if (options.aiDiagnosis) {
    // If AI suggests complex diagnosis, increase labor time
    if (options.aiDiagnosis.confidence === 'low' || 
        options.aiDiagnosis.diagnosticSteps.length > 3) {
      laborHours *= 1.2;
    }
    
    // Emergency AI diagnosis gets priority pricing
    if (options.aiDiagnosis.urgencyLevel === 'emergency') {
      laborRate *= 1.5;
    }
    
    // High confidence diagnosis might reduce time
    if (options.aiDiagnosis.confidence === 'high') {
      laborHours *= 0.9;
    }
  }
  
  // Vehicle age factor - older vehicles may need more time
  if (options.vehicle) {
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - options.vehicle.year;
    if (vehicleAge > 15) {
      laborHours *= 1.3; // 30% more time for very old vehicles
    } else if (vehicleAge > 10) {
      laborHours *= 1.15; // 15% more time for older vehicles
    }
    
    // High mileage factor
    if (options.vehicle.mileage && options.vehicle.mileage > 150000) {
      laborHours *= 1.1; // 10% more time for high mileage vehicles
    }
  }
  
  // Location-based travel fee
  let travelFee = 0;
  if (options.location) {
    // Mock calculation - in production, calculate distance from mechanic location
    // For now, add a base travel fee
    travelFee = 25; // Base $25 travel fee
    
    // Add distance-based fee (mock calculation)
    const mockDistance = Math.random() * 20; // 0-20 miles
    if (mockDistance > 10) {
      travelFee += (mockDistance - 10) * 2; // $2 per mile over 10 miles
    }
  }
  
  // Urgency multiplier
  switch (options.urgency) {
    case 'emergency':
      laborRate *= 1.5;
      travelFee *= 1.5; // Emergency travel fee
      break;
    case 'high':
      laborRate *= 1.25;
      travelFee *= 1.2;
      break;
    case 'medium':
      laborRate *= 1.1;
      break;
    default:
      // Low urgency might get a small discount
      laborRate *= 0.95;
      break;
  }
  
  const laborCost = Math.round(laborHours * laborRate);
  
  // Calculate parts cost
  let partsCost = 0;
  if (options.selectedParts && options.selectedParts.length > 0) {
    partsCost = options.selectedParts.reduce((total, partName) => {
      const part = pricing.commonParts.find(p => p.name === partName);
      return total + (part?.price || 0);
    }, 0);
  } else {
    // Use AI diagnosis to estimate parts cost
    if (options.aiDiagnosis?.estimatedCost) {
      partsCost = Math.round((options.aiDiagnosis.estimatedCost.min + options.aiDiagnosis.estimatedCost.max) / 2);
    } else {
      // Use average parts cost for the service type
      const avgPartsCost = pricing.commonParts.reduce((sum, part) => sum + part.price, 0) / pricing.commonParts.length;
      partsCost = Math.round(avgPartsCost);
    }
  }
  
  // Vehicle-specific parts markup
  if (options.vehicle) {
    // Luxury brands typically have higher parts costs
    const luxuryBrands = ['BMW', 'Mercedes', 'Audi', 'Lexus', 'Acura', 'Infiniti', 'Cadillac'];
    if (luxuryBrands.includes(options.vehicle.make)) {
      partsCost *= 1.3;
    }
    
    // Import brands might have higher parts costs
    const importBrands = ['Toyota', 'Honda', 'Nissan', 'Subaru', 'Mazda', 'Mitsubishi'];
    if (importBrands.includes(options.vehicle.make)) {
      partsCost *= 1.1;
    }
  }
  
  // Apply discount if any
  let subtotal = laborCost + partsCost + travelFee;
  if (options.discountPercent && options.discountPercent > 0) {
    subtotal = Math.round(subtotal * (1 - options.discountPercent / 100));
  }
  
  const totalCost = Math.round(subtotal);
  
  // Generate quote description with AI insights
  const description = generateQuoteDescription(
    options.serviceType, 
    options.description, 
    laborHours, 
    options.aiDiagnosis,
    options.vehicle,
    travelFee
  );
  
  return {
    id: Date.now().toString(),
    serviceRequestId,
    description,
    laborCost,
    partsCost,
    travelFee,
    totalCost,
    estimatedDuration: laborHours,
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    status: 'pending',
  };
}

function generateQuoteDescription(
  serviceType: ServiceType, 
  customerDescription: string, 
  hours: number,
  aiDiagnosis?: DiagnosticResult,
  vehicle?: Vehicle,
  travelFee?: number
): string {
  const serviceNames: Record<ServiceType, string> = {
    oil_change: 'Oil Change Service',
    brake_service: 'Brake System Service',
    tire_service: 'Tire Service',
    battery_service: 'Battery Service',
    engine_diagnostic: 'Engine Diagnostic',
    transmission: 'Transmission Service',
    ac_service: 'A/C System Service',
    general_repair: 'General Automotive Repair',
    emergency_roadside: 'Emergency Roadside Assistance',
  };
  
  let description = `Professional ${serviceNames[serviceType]}`;
  
  if (vehicle) {
    description += ` for ${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  }
  
  description += ` including comprehensive inspection, ${customerDescription.toLowerCase()}, and expert recommendations.`;
  
  if (aiDiagnosis) {
    description += ` AI analysis indicates: ${aiDiagnosis.likelyCauses[0]}.`;
    if (aiDiagnosis.diagnosticSteps.length > 0) {
      description += ` Diagnostic approach: ${aiDiagnosis.diagnosticSteps[0]}.`;
    }
    
    if (aiDiagnosis.confidence === 'high') {
      description += ` High-confidence diagnosis allows for efficient service delivery.`;
    }
  }
  
  description += ` Estimated completion time: ${hours.toFixed(1)} hour${hours !== 1 ? 's' : ''}.`;
  
  if (travelFee && travelFee > 0) {
    description += ` Includes mobile service travel fee for on-location convenience.`;
  }
  
  return description;
}

export function calculateMaintenanceDue(
  lastServiceDate: Date, 
  serviceType: ServiceType, 
  currentMileage?: number
): Date | null {
  const intervals = getMaintenanceIntervals();
  const interval = intervals.find(i => i.serviceType === serviceType);
  
  if (!interval) return null;
  
  return new Date(lastServiceDate.getTime() + interval.intervalDays * 24 * 60 * 60 * 1000);
}

export function getMaintenanceIntervals(): MaintenanceInterval[] {
  return [
    {
      serviceType: 'oil_change',
      intervalDays: 90, // 3 months
      intervalMiles: 3000,
      description: 'Oil Change & Filter',
      priority: 'high',
      category: 'routine',
    },
    {
      serviceType: 'brake_service',
      intervalDays: 365 * 2, // 2 years
      intervalMiles: 25000,
      description: 'Brake Inspection & Service',
      priority: 'high',
      category: 'safety',
    },
    {
      serviceType: 'tire_service',
      intervalDays: 180, // 6 months
      intervalMiles: 6000,
      description: 'Tire Rotation & Inspection',
      priority: 'medium',
      category: 'routine',
    },
    {
      serviceType: 'battery_service',
      intervalDays: 365 * 3, // 3 years
      description: 'Battery Test & Service',
      priority: 'medium',
      category: 'preventive',
    },
    {
      serviceType: 'engine_diagnostic',
      intervalDays: 365, // 1 year
      intervalMiles: 12000,
      description: 'Engine Diagnostic Scan',
      priority: 'medium',
      category: 'preventive',
    },
    {
      serviceType: 'transmission',
      intervalDays: 365 * 2, // 2 years
      intervalMiles: 30000,
      description: 'Transmission Service',
      priority: 'high',
      category: 'preventive',
    },
    {
      serviceType: 'ac_service',
      intervalDays: 365, // 1 year
      description: 'A/C System Service',
      priority: 'low',
      category: 'routine',
    },
  ];
}

// Helper function to determine if maintenance is overdue
export function isMaintenanceOverdue(
  lastServiceDate: Date,
  serviceType: ServiceType,
  currentMileage?: number
): boolean {
  const dueDate = calculateMaintenanceDue(lastServiceDate, serviceType, currentMileage);
  if (!dueDate) return false;
  
  return new Date() > dueDate;
}

// Helper function to get days until maintenance is due
export function getDaysUntilMaintenance(
  lastServiceDate: Date,
  serviceType: ServiceType
): number | null {
  const dueDate = calculateMaintenanceDue(lastServiceDate, serviceType);
  if (!dueDate) return null;
  
  const today = new Date();
  const diffTime = dueDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Live cost calculator for real-time estimates
export function calculateLiveCost(
  serviceType: ServiceType,
  urgency: 'low' | 'medium' | 'high' | 'emergency',
  vehicle?: Vehicle,
  location?: { latitude: number; longitude: number },
  selectedParts?: string[]
): { min: number; max: number; breakdown: any } {
  const pricing = SERVICE_PRICING[serviceType];
  
  let baseLaborCost = pricing.estimatedHours * pricing.laborRate;
  let basePartsCost = selectedParts?.reduce((total, partName) => {
    const part = pricing.commonParts.find(p => p.name === partName);
    return total + (part?.price || 0);
  }, 0) || pricing.commonParts[0]?.price || 0;
  
  // Apply urgency multiplier
  const urgencyMultipliers = {
    low: 0.95,
    medium: 1.1,
    high: 1.25,
    emergency: 1.5
  };
  
  baseLaborCost *= urgencyMultipliers[urgency];
  
  // Vehicle age factor
  if (vehicle) {
    const age = new Date().getFullYear() - vehicle.year;
    if (age > 15) {
      baseLaborCost *= 1.3;
      basePartsCost *= 1.2;
    } else if (age > 10) {
      baseLaborCost *= 1.15;
      basePartsCost *= 1.1;
    }
  }
  
  // Travel fee
  let travelFee = 25; // Base fee
  if (location) {
    // Mock distance calculation
    const mockDistance = Math.random() * 15;
    if (mockDistance > 10) {
      travelFee += (mockDistance - 10) * 2;
    }
  }
  
  const total = baseLaborCost + basePartsCost + travelFee;
  
  return {
    min: Math.round(total * 0.85),
    max: Math.round(total * 1.15),
    breakdown: {
      labor: Math.round(baseLaborCost),
      parts: Math.round(basePartsCost),
      travel: Math.round(travelFee),
      urgencyMultiplier: urgencyMultipliers[urgency]
    }
  };
}