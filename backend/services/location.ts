import { prisma } from '../../lib/prisma';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DistanceResult {
  distanceMeters: number;
  distanceMiles: number;
  distanceKm: number;
  durationSeconds: number;
  durationMinutes: number;
  durationText: string;
}

export function calculateHaversineDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  const earthRadiusMeters = 6371e3;
  const lat1 = (point1.latitude * Math.PI) / 180;
  const lat2 = (point2.latitude * Math.PI) / 180;
  const deltaLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const deltaLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  }

  if (minutes > 0) {
    return `${minutes} min`;
  }

  return '< 1 min';
}

export function validateCoordinates(coords: Coordinates): boolean {
  return (
    typeof coords.latitude === 'number' &&
    typeof coords.longitude === 'number' &&
    coords.latitude >= -90 &&
    coords.latitude <= 90 &&
    coords.longitude >= -180 &&
    coords.longitude <= 180
  );
}

export async function calculateRouteDistance(
  origin: Coordinates,
  destination: Coordinates
): Promise<DistanceResult> {
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

    if (!job?.latitude || !job?.longitude) {
      return null;
    }

    return calculateRouteDistance(mechanicLocation, {
      latitude: job.latitude,
      longitude: job.longitude,
    });
  } catch (error) {
    console.error('Error getting mechanic distance to job:', error);
    return null;
  }
}

export async function updateJobETA(
  jobId: string,
  mechanicLocation: Coordinates,
  etaMinutes?: number
): Promise<Date | null> {
  try {
    const distanceResult = await getMechanicDistanceToJob(mechanicLocation, jobId);

    const etaDate = etaMinutes
      ? new Date(Date.now() + etaMinutes * 60 * 1000)
      : distanceResult
        ? new Date(Date.now() + distanceResult.durationSeconds * 1000)
        : null;

    await prisma.job.update({
      where: { id: jobId },
      data: {
        currentLatitude: mechanicLocation.latitude,
        currentLongitude: mechanicLocation.longitude,
        eta: etaDate,
      },
    });

    return etaDate;
  } catch (error) {
    console.error('Error updating job ETA:', error);
    return null;
  }
}
