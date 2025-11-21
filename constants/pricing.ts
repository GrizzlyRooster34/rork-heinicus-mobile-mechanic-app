import { ServiceType } from '@/types/service';

export interface ServicePricing {
  basePrice: number;
  laborRate: number; // per hour
  estimatedHours: number;
  commonParts: {
    name: string;
    price: number;
  }[];
  priceRange: {
    min: number;
    max: number;
  };
}

export const SERVICE_PRICING: Record<ServiceType, ServicePricing> = {
  oil_change: {
    basePrice: 45,
    laborRate: 75,
    estimatedHours: 0.5,
    commonParts: [
      { name: 'Conventional Oil (5qt)', price: 25 },
      { name: 'Synthetic Oil (5qt)', price: 45 },
      { name: 'Oil Filter', price: 15 },
    ],
    priceRange: { min: 75, max: 95 },
  },
  brake_service: {
    basePrice: 150,
    laborRate: 85,
    estimatedHours: 2,
    commonParts: [
      { name: 'Brake Pads (Front)', price: 80 },
      { name: 'Brake Pads (Rear)', price: 70 },
      { name: 'Brake Rotors (Pair)', price: 120 },
      { name: 'Brake Fluid', price: 15 },
    ],
    priceRange: { min: 150, max: 400 },
  },
  tire_service: {
    basePrice: 80,
    laborRate: 75,
    estimatedHours: 1,
    commonParts: [
      { name: 'Tire (Each)', price: 100 },
      { name: 'Valve Stem', price: 5 },
      { name: 'Wheel Weight', price: 3 },
    ],
    priceRange: { min: 80, max: 500 },
  },
  battery_service: {
    basePrice: 120,
    laborRate: 75,
    estimatedHours: 0.75,
    commonParts: [
      { name: 'Car Battery', price: 120 },
      { name: 'Battery Terminal', price: 15 },
      { name: 'Battery Cable', price: 25 },
    ],
    priceRange: { min: 120, max: 200 },
  },
  engine_diagnostic: {
    basePrice: 100,
    laborRate: 85,
    estimatedHours: 1.5,
    commonParts: [
      { name: 'Diagnostic Fee', price: 100 },
      { name: 'Computer Scan', price: 50 },
    ],
    priceRange: { min: 100, max: 250 },
  },
  transmission: {
    basePrice: 200,
    laborRate: 95,
    estimatedHours: 3,
    commonParts: [
      { name: 'Transmission Fluid', price: 35 },
      { name: 'Transmission Filter', price: 45 },
      { name: 'Gasket Set', price: 60 },
    ],
    priceRange: { min: 200, max: 800 },
  },
  ac_service: {
    basePrice: 90,
    laborRate: 85,
    estimatedHours: 1.5,
    commonParts: [
      { name: 'Refrigerant (R134a)', price: 40 },
      { name: 'AC Filter', price: 25 },
      { name: 'AC Compressor Oil', price: 20 },
    ],
    priceRange: { min: 90, max: 300 },
  },
  general_repair: {
    basePrice: 75,
    laborRate: 85,
    estimatedHours: 2,
    commonParts: [
      { name: 'Miscellaneous Parts', price: 50 },
    ],
    priceRange: { min: 75, max: 500 },
  },
  emergency_roadside: {
    basePrice: 65,
    laborRate: 95,
    estimatedHours: 1,
    commonParts: [
      { name: 'Emergency Service Fee', price: 65 },
      { name: 'Towing (per mile)', price: 3 },
    ],
    priceRange: { min: 65, max: 200 },
  },
  
  // Motorcycle Services
  motorcycle_oil_change: {
    basePrice: 35,
    laborRate: 70,
    estimatedHours: 0.5,
    commonParts: [
      { name: 'Motorcycle Oil (1qt)', price: 18 },
      { name: 'Oil Filter', price: 12 },
    ],
    priceRange: { min: 50, max: 75 },
  },
  motorcycle_brake_inspection: {
    basePrice: 45,
    laborRate: 70,
    estimatedHours: 0.75,
    commonParts: [
      { name: 'Brake Pads (Front)', price: 40 },
      { name: 'Brake Pads (Rear)', price: 35 },
      { name: 'Brake Fluid', price: 12 },
    ],
    priceRange: { min: 45, max: 150 },
  },
  motorcycle_tire_replacement: {
    basePrice: 60,
    laborRate: 70,
    estimatedHours: 1,
    commonParts: [
      { name: 'Motorcycle Tire (Front)', price: 85 },
      { name: 'Motorcycle Tire (Rear)', price: 95 },
      { name: 'Valve Stem', price: 4 },
    ],
    priceRange: { min: 60, max: 250 },
  },
  motorcycle_chain_service: {
    basePrice: 55,
    laborRate: 70,
    estimatedHours: 1,
    commonParts: [
      { name: 'Chain Lube', price: 15 },
      { name: 'Chain Cleaner', price: 12 },
      { name: 'Sprocket Set', price: 85 },
    ],
    priceRange: { min: 55, max: 180 },
  },
  motorcycle_battery_service: {
    basePrice: 40,
    laborRate: 70,
    estimatedHours: 0.5,
    commonParts: [
      { name: 'Motorcycle Battery', price: 65 },
      { name: 'Battery Terminals', price: 8 },
    ],
    priceRange: { min: 40, max: 120 },
  },
  motorcycle_diagnostic: {
    basePrice: 85,
    laborRate: 80,
    estimatedHours: 1.5,
    commonParts: [
      { name: 'Diagnostic Fee', price: 85 },
      { name: 'Various Parts', price: 50 },
    ],
    priceRange: { min: 85, max: 300 },
  },
  
  // Scooter Services  
  scooter_oil_change: {
    basePrice: 30,
    laborRate: 65,
    estimatedHours: 0.5,
    commonParts: [
      { name: 'Scooter Oil (1qt)', price: 15 },
      { name: 'Oil Filter', price: 10 },
    ],
    priceRange: { min: 45, max: 65 },
  },
  scooter_brake_inspection: {
    basePrice: 40,
    laborRate: 65,
    estimatedHours: 0.75,
    commonParts: [
      { name: 'Brake Pads', price: 25 },
      { name: 'Brake Fluid', price: 10 },
    ],
    priceRange: { min: 40, max: 100 },
  },
  scooter_tire_replacement: {
    basePrice: 45,
    laborRate: 65,
    estimatedHours: 0.75,
    commonParts: [
      { name: 'Scooter Tire (Front)', price: 45 },
      { name: 'Scooter Tire (Rear)', price: 50 },
      { name: 'Valve Stem', price: 3 },
    ],
    priceRange: { min: 45, max: 150 },
  },
  scooter_carburetor_clean: {
    basePrice: 65,
    laborRate: 65,
    estimatedHours: 1.5,
    commonParts: [
      { name: 'Carburetor Cleaner', price: 15 },
      { name: 'Gasket Kit', price: 25 },
    ],
    priceRange: { min: 65, max: 150 },
  },
  scooter_battery_service: {
    basePrice: 35,
    laborRate: 65,
    estimatedHours: 0.5,
    commonParts: [
      { name: 'Scooter Battery', price: 45 },
      { name: 'Battery Terminals', price: 6 },
    ],
    priceRange: { min: 35, max: 95 },
  },
  scooter_diagnostic: {
    basePrice: 75,
    laborRate: 75,
    estimatedHours: 1,
    commonParts: [
      { name: 'Diagnostic Fee', price: 75 },
      { name: 'Various Parts', price: 40 },
    ],
    priceRange: { min: 75, max: 250 },
  },
};