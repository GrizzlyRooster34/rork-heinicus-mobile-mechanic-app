/**
 * Store validation utilities
 */

import { User } from '@/types/auth';
import { Vehicle, Contact, ServiceRequest } from '@/types/service';

/**
 * Validation functions for store data
 */

export function validateUser(user: User): boolean {
  return !!(
    user &&
    user.id &&
    user.email &&
    user.firstName &&
    user.lastName &&
    ['customer', 'mechanic', 'admin'].includes(user.role)
  );
}

export function validateVehicle(vehicle: Vehicle): boolean {
  return !!(
    vehicle &&
    vehicle.id &&
    vehicle.make &&
    vehicle.model &&
    vehicle.year &&
    vehicle.year >= 1900 &&
    vehicle.year <= new Date().getFullYear() + 2
  );
}

export function validateContact(contact: Contact): boolean {
  return !!(
    contact &&
    contact.id &&
    contact.firstName &&
    contact.lastName &&
    contact.email &&
    contact.phone &&
    validateEmail(contact.email)
  );
}

export function validateServiceRequest(request: ServiceRequest): boolean {
  return !!(
    request &&
    request.id &&
    request.type &&
    request.description &&
    request.urgency &&
    ['low', 'medium', 'high', 'emergency'].includes(request.urgency) &&
    request.customerId &&
    request.vehicleId
  );
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  // Basic phone validation - can be enhanced
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Sanitization functions
 */

export function sanitizeUser(user: Partial<User>): Partial<User> {
  return {
    ...user,
    email: user.email?.toLowerCase().trim(),
    firstName: user.firstName?.trim(),
    lastName: user.lastName?.trim(),
    phone: user.phone?.trim(),
  };
}

export function sanitizeVehicle(vehicle: Partial<Vehicle>): Partial<Vehicle> {
  return {
    ...vehicle,
    make: vehicle.make?.trim(),
    model: vehicle.model?.trim(),
    color: vehicle.color?.trim(),
    vin: vehicle.vin?.toUpperCase().trim(),
  };
}

export function sanitizeContact(contact: Partial<Contact>): Partial<Contact> {
  return {
    ...contact,
    firstName: contact.firstName?.trim(),
    lastName: contact.lastName?.trim(),
    email: contact.email?.toLowerCase()?.trim(),
    phone: contact.phone?.trim(),
    address: contact.address,
  };
}

/**
 * Store state validation
 */

export function validateStoreState(storeName: string, state: any): boolean {
  try {
    switch (storeName) {
      case 'auth':
        return validateAuthState(state);
      case 'app':
        return validateAppState(state);
      case 'settings':
        return validateSettingsState(state);
      case 'adminSettings':
        return validateAdminSettingsState(state);
      default:
        console.warn(`Unknown store name for validation: ${storeName}`);
        return true;
    }
  } catch (error) {
    console.error(`Store validation error for ${storeName}:`, error);
    return false;
  }
}

function validateAuthState(state: any): boolean {
  return !!(
    state &&
    typeof state.isLoading === 'boolean' &&
    typeof state.isAuthenticated === 'boolean' &&
    (state.user === null || validateUser(state.user))
  );
}

function validateAppState(state: any): boolean {
  return !!(
    state &&
    Array.isArray(state.vehicles) &&
    Array.isArray(state.serviceRequests) &&
    Array.isArray(state.quotes) &&
    Array.isArray(state.maintenanceReminders) &&
    Array.isArray(state.maintenanceHistory) &&
    Array.isArray(state.jobLogs) &&
    typeof state.jobParts === 'object'
  );
}

function validateSettingsState(state: any): boolean {
  return !!(
    state &&
    state.availability &&
    state.notifications &&
    state.pricing &&
    state.tools &&
    typeof state.availability.isAvailable === 'boolean' &&
    typeof state.notifications.pushNotifications === 'boolean' &&
    typeof state.pricing.laborRate === 'number' &&
    typeof state.tools.availableTools === 'object'
  );
}

function validateAdminSettingsState(state: any): boolean {
  return !!(
    state &&
    state.system &&
    state.notifications &&
    state.security &&
    state.dataBackup &&
    typeof state.system.maintenanceMode === 'boolean' &&
    typeof state.security.requireTwoFactor === 'boolean' &&
    typeof state.dataBackup.autoBackup === 'boolean'
  );
}