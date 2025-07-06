import { User } from './auth';

export type VehicleType = 'car' | 'motorcycle' | 'scooter';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vehicleType: VehicleType;
  vin?: string;
  trim?: string;
  engine?: string;
  mileage: number;
  color?: string;
  licensePlate?: string;
  lastServiceDate?: Date;
  nextServiceDue?: Date;
  maintenanceHistory?: MaintenanceRecord[];
}

export interface VinData {
  vin: string;
  make: string;
  model: string;
  year: number;
  vehicleType: VehicleType;
  trim?: string;
  engine?: string;
  transmission?: string;
  bodyStyle?: string;
  fuelType?: string;
  driveType?: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export type ServiceType = 
  | 'oil_change'
  | 'brake_service'
  | 'tire_service'
  | 'battery_service'
  | 'engine_diagnostic'
  | 'transmission'
  | 'ac_service'
  | 'general_repair'
  | 'emergency_roadside'
  | 'motorcycle_oil_change'
  | 'motorcycle_brake_inspection'
  | 'motorcycle_tire_replacement'
  | 'motorcycle_chain_service'
  | 'motorcycle_battery_service'
  | 'motorcycle_diagnostic'
  | 'scooter_oil_change'
  | 'scooter_brake_inspection'
  | 'scooter_tire_replacement'
  | 'scooter_carburetor_clean'
  | 'scooter_battery_service'
  | 'scooter_diagnostic';

export type ServiceStatus = 
  | 'pending'
  | 'quoted'
  | 'accepted'
  | 'scheduled'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'cancelled';

export type QuoteStatus = 
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'deposit_paid'
  | 'paid';

export type MechanicVerificationStatus = 'pending' | 'approved' | 'rejected';

export interface MechanicVerification {
  id: string;
  userId: string;
  fullName: string;
  photoUri: string;
  idUri: string;
  status: MechanicVerificationStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface StatusTimestamp {
  status: ServiceStatus;
  timestamp: Date;
  mechanicId?: string;
  notes?: string;
}

export interface JobPhoto {
  id: string;
  url: string;
  type: 'before' | 'during' | 'after' | 'parts' | 'damage';
  caption?: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface ServiceTool {
  id: string;
  name: string;
  category: string;
  required: boolean;
  description?: string;
}

export interface ServiceRequest {
  id: string;
  type: ServiceType;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  status: ServiceStatus;
  createdAt: Date;
  updatedAt?: Date;
  photos?: string[];
  jobPhotos?: JobPhoto[];
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  vehicleId: string;
  vehicleType?: VehicleType;
  vinNumber?: string;
  aiDiagnosis?: DiagnosticResult;
  requiredTools?: string[];
  toolsChecked?: { [toolId: string]: boolean };
  toolsCheckCompletedAt?: Date;
  toolsNotes?: string;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancellationReason?: string;
  mechanicId?: string;
  claimedAt?: Date;
  scheduledAt?: Date;
  startedAt?: Date;
  pausedAt?: Date;
  resumedAt?: Date;
  completedAt?: Date;
  signatureData?: string;
  signatureCapturedAt?: Date;
  signatureCapturedBy?: string;
  statusTimeline?: StatusTimestamp[];
  estimatedDuration?: number; // in minutes
  actualDuration?: number; // in minutes
  startTime?: Date;
  endTime?: Date;
  durationMinutes?: number;
  photoUrls?: string[];
  statusChangeLog?: any;
  partsApproved?: boolean; // New field for parts approval toggle
  partsEstimate?: number; // Estimated parts cost
  partsActual?: number; // Actual parts cost
}

export interface Quote {
  id: string;
  serviceRequestId: string;
  laborCost: number;
  partsCost: number;
  travelCost: number;
  totalCost: number;
  estimatedDuration: number; // in hours
  validUntil: Date;
  status: QuoteStatus;
  createdAt: Date;
  updatedAt?: Date;
  acceptedAt?: Date;
  paidAt?: Date;
  notes?: string;
  breakdown?: {
    description: string;
    cost: number;
  }[];
  paymentMethod?: 'card' | 'cash' | 'check';
  stripePaymentIntentId?: string;
  vehicleType?: VehicleType;
  partsApproved?: boolean; // New field for parts approval
  partsBreakdown?: PartEstimate[]; // Detailed parts breakdown
}

export interface PartEstimate {
  id: string;
  name: string;
  partNumber?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  supplier?: 'autozone' | 'oreilly' | 'napa' | 'advance' | 'other';
  category?: string;
  description?: string;
}

export interface DiagnosticResult {
  id: string;
  vehicleInfo: {
    make: string;
    model: string;
    year: number;
    mileage?: number;
    engine?: string;
    vin?: string;
  };
  symptoms: string;
  additionalContext?: string;
  confidence: 'low' | 'medium' | 'high';
  likelyCauses: string[];
  diagnosticSteps: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  estimatedCost?: {
    min: number;
    max: number;
  };
  matchedServices: string[];
  recommendedServiceTypes?: string[];
  createdAt: Date;
}

export interface MaintenanceReminder {
  id: string;
  vehicleId: string;
  serviceType: ServiceType;
  description: string;
  dueDate: Date;
  dueMileage?: number;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  completedAt?: Date;
  reminderSent: boolean;
  createdAt: Date;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  serviceType: ServiceType;
  description: string;
  performedAt: Date;
  mileage?: number;
  cost: number;
  mechanicId?: string;
  parts?: string[];
  notes?: string;
  nextDueDate?: Date;
  nextDueMileage?: number;
  warrantyInfo?: {
    duration: number; // months
    mileage: number;
    description: string;
  };
}

export interface JobLog {
  id: string;
  jobId: string;
  mechanicId: string;
  mechanicName?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  activity?: string;
  description?: string;
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  createdAt: Date;
}

export interface ToolCheckItem {
  id: string;
  name: string;
  category: string;
  required: boolean;
  checked: boolean;
  condition?: 'excellent' | 'good' | 'fair' | 'needs_replacement';
  notes?: string;
}

// Service categories for UI
export interface ServiceCategory {
  id: ServiceType;
  title: string;
  description: string;
  icon: string;
  estimatedTime: string;
  priceRange: {
    min: number;
    max: number;
  };
  vehicleTypes: VehicleType[];
  requiredTools: ServiceTool[];
}

// Tool definitions
export interface Tool {
  id: string;
  name: string;
  category: string;
  description?: string;
  required: boolean;
  image?: string;
}

// Payment related types
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  clientSecret: string;
  quoteId: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}