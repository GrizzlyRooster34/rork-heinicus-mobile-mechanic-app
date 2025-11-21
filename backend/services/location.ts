import { Client, TravelMode } from '@googlemaps/google-maps-services-js';
import { prisma } from '../../lib/prisma';

/**
 * Location Service
 *
 * Handles GPS location calculations, distance, and ETA estimations
 * Uses Google Maps API for accurate route calculations
 */

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
const googleMapsClient = new Client({});

/**
 * Coordinates interface
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Distance result interface
 */
export interface DistanceResult {
  distanceMeters: number;
  distanceMiles: number;
  distanceKm: number;
  durationSeconds: number;
  durationMinutes: number;
  durationText: string;
}

/**
 * Calculate distance between two points using Haversine formula
 * This is a fallback for when Google Maps API is not available
 */
export function calculateHaversineDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (point1.latitude * Math.PI) / 180;
  const φ2 = (point2.latitude * Math.PI) / 180;
  const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanceMeters = R * c;
  return distanceMeters;
}

/**
 * Calculate distance and duration using Google Maps Distance Matrix API
 * Provides accurate road distance and ETA
 */
export async function calculateRouteDistance(
  origin: Coordinates,
  destination: Coordinates
): Promise<DistanceResult> {
  // If no API key, use Haversine formula as fallback
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('Google Maps API key not configured, using Haversine distance');
    const distanceMeters = calculateHaversineDistance(origin, destination);

    // Estimate duration (assuming average speed of 30 mph / 48 km/h in city)
    const durationSeconds = Math.round((distanceMeters / 1000 / 48) * 3600);

    return {
      distanceMeters,
      distanceMiles: distanceMeters * 0.000621371,
      distanceKm: distanceMeters / 1000,
      durationSeconds,
      durationMinutes: Math.round(durationSeconds / 60),
      durationText: formatDuration(durationSeconds),
    };
  }

  try {
    const response = await googleMapsClient.distancematrix({
      params: {
        origins: [`${origin.latitude},${origin.longitude}`],
        destinations: [`${destination.latitude},${destination.longitude}`],
        mode: TravelMode.driving,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    const element = response.data.rows[0]?.elements[0];

    if (!element || element.status !== 'OK') {
      throw new Error('Unable to calculate route distance');
    }

    const distanceMeters = element.distance.value;
    const durationSeconds = element.duration.value;

    return {
      distanceMeters,
      distanceMiles: distanceMeters * 0.000621371,
      distanceKm: distanceMeters / 1000,
      durationSeconds,
      durationMinutes: Math.round(durationSeconds / 60),
      durationText: element.duration.text,
    };
  } catch (error) {
    console.error('Error calculating route distance with Google Maps:', error);

    // Fallback to Haversine
    const distanceMeters = calculateHaversineDistance(origin, destination);
    const durationSeconds = Math.round((distanceMeters / 1000 / 48) * 3600);

    return {
      distanceMeters,
      distanceMiles: distanceMeters * 0.000621371,
      distanceKm: distanceMeters / 1000,
      durationSeconds,
      durationMinutes: Math.round(durationSeconds / 60),
      durationText: formatDuration(durationSeconds),
    };
  }
}

/**
 * Format duration in seconds to human-readable text
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  } else if (minutes > 0) {
    return `${minutes} min`;
  } else {
    return '< 1 min';
  }
}

/**
 * Get distance from mechanic to job location
 */
export async function getMechanicDistanceToJob(
  mechanicLocation: Coordinates,
  jobId: string
): Promise<DistanceResult | null> {
  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        latitude: true,
        longitude: true,
      },
    });

    if (!job || !job.latitude || !job.longitude) {
      return null;
    }

    const jobLocation: Coordinates = {
      latitude: job.latitude,
      longitude: job.longitude,
    };

    return await calculateRouteDistance(mechanicLocation, jobLocation);
  } catch (error) {
    console.error('Error getting mechanic distance to job:', error);
    return null;
  }
}

/**
 * Calculate ETA and update job
 */
export async function updateJobETA(
  jobId: string,
  mechanicLocation: Coordinates
): Promise<Date | null> {
  try {
    const distanceResult = await getMechanicDistanceToJob(mechanicLocation, jobId);

    if (!distanceResult) {
      return null;
    }

    const etaDate = new Date(Date.now() + distanceResult.durationSeconds * 1000);

    await prisma.job.update({
      where: { id: jobId },
      data: {
        eta: etaDate,
        currentLatitude: mechanicLocation.latitude,
        currentLongitude: mechanicLocation.longitude,
      },
    });

    return etaDate;
  } catch (error) {
    console.error('Error updating job ETA:', error);
    return null;
  }
}

/**
 * Validate coordinates
 */
export function validateCoordinates(coords: Coordinates): boolean {
  const { latitude, longitude } = coords;

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return false;
  }

  if (latitude < -90 || latitude > 90) {
    return false;
  }

  if (longitude < -180 || longitude > 180) {
    return false;
  }

  return true;
}

/**
 * Get directions URL for navigation apps
 */
export function getNavigationUrl(
  destination: Coordinates,
  platform: 'ios' | 'android' | 'web'
): string {
  const { latitude, longitude } = destination;

  if (platform === 'ios') {
    return `maps://maps.apple.com/?daddr=${latitude},${longitude}`;
  } else if (platform === 'android') {
    return `google.navigation:q=${latitude},${longitude}`;
  } else {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  }
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(coords: Coordinates): string {
  return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
}
