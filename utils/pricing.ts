import { UrgencyLevel, VehicleType } from '@/types/service';

/**
 * Shared logic for calculating a quote based on the Master Blueprint.
 */

interface PricingInput {
  serviceId?: string;
  serviceType?: string;
  parts?: { price: number }[];
  vehicleYear?: number;
  vehicleMake?: string;
  urgency?: UrgencyLevel;
  distanceMiles?: number;
}

const LUXURY_BRANDS = ['BMW', 'Audi', 'Mercedes', 'Porsche', 'Lexus', 'Land Rover', 'Cadillac', 'Infiniti', 'Acura'];

/**
 * AI Studio Port: Core Pricing Engine
 */
export const calculateQuoteLogic = (data: PricingInput) => {
  const { parts, vehicleYear, vehicleMake, urgency, distanceMiles } = data;
  const currentYear = new Date().getFullYear();
  const vehicleAge = vehicleYear ? currentYear - vehicleYear : 0;

  // 1. Base Labor Cost
  // In the Rork app, we often have specific labor hours and rates. 
  // This engine provides a simplified logic that can be integrated.
  let baseLaborRate = 95; // $95/hr base rate
  let laborCost = baseLaborRate; // default to 1 hour if not specified

  // 2. Vehicle Age Multiplier
  if (vehicleAge > 15) {
    laborCost *= 1.30; // +30% for >15 years
  } else if (vehicleAge > 10) {
    laborCost *= 1.15; // +15% for >10 years
  }

  // 3. Parts Cost & Luxury Tax
  let partsCost = parts?.reduce((sum, part) => sum + part.price, 0) || 0;
  if (vehicleMake && LUXURY_BRANDS.some(brand => vehicleMake.toLowerCase().includes(brand.toLowerCase()))) {
      partsCost *= 1.30; // +30% Markup on parts for luxury
  }

  // 4. Urgency Multiplier
  let subtotal = laborCost + partsCost;
  let urgencyMultiplier = 1.0;
  
  if (urgency === 'emergency') {
      urgencyMultiplier = 1.5; // 1.5x for Emergency
  } else if (urgency === 'high') {
      urgencyMultiplier = 1.25; // 1.25x for High Priority
  }
  
  let total = subtotal * urgencyMultiplier;

  // 5. Travel Fee (handled via tiers in constants/serviceAreas.ts)
  let travelFee = 0;
  if (distanceMiles !== undefined) {
    if (distanceMiles > 20) {
      travelFee = 70;
    } else if (distanceMiles > 10) {
      travelFee = 45;
    } else {
      travelFee = 25;
    }
  }

  return {
    laborCost: Math.round(laborCost),
    partsCost: Math.round(partsCost),
    travelFee,
    total: Math.round(total + travelFee),
    urgencyMultiplier,
  };
};
