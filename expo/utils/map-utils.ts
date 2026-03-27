import { Platform, Linking } from 'react-native';

/**
 * Map Utilities
 *
 * Helper functions for working with maps and navigation
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

/**
 * Calculate region from two points (for map bounds)
 */
export function getRegionForCoordinates(points: Coordinates[]): Region {
  if (points.length === 0) {
    // Default to San Francisco
    return {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
  }

  if (points.length === 1) {
    return {
      latitude: points[0].latitude,
      longitude: points[0].longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLon = points[0].longitude;
  let maxLon = points[0].longitude;

  points.forEach((point) => {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLon = Math.min(minLon, point.longitude);
    maxLon = Math.max(maxLon, point.longitude);
  });

  const midLat = (minLat + maxLat) / 2;
  const midLon = (minLon + maxLon) / 2;

  const deltaLat = (maxLat - minLat) * 1.5; // Add 50% padding
  const deltaLon = (maxLon - minLon) * 1.5;

  return {
    latitude: midLat,
    longitude: midLon,
    latitudeDelta: Math.max(deltaLat, 0.01),
    longitudeDelta: Math.max(deltaLon, 0.01),
  };
}

/**
 * Open navigation app to coordinates
 */
export async function openNavigation(destination: Coordinates): Promise<boolean> {
  const { latitude, longitude } = destination;

  let url: string;

  if (Platform.OS === 'ios') {
    url = `maps://app?daddr=${latitude},${longitude}`;
  } else {
    url = `google.navigation:q=${latitude},${longitude}`;
  }

  try {
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
      return true;
    } else {
      // Fallback to Google Maps web
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      await Linking.openURL(webUrl);
      return true;
    }
  } catch (error) {
    console.error('Error opening navigation:', error);
    return false;
  }
}

/**
 * Format ETA for display
 */
export function formatETA(etaDate: Date | string): string {
  const now = new Date();
  const eta = typeof etaDate === 'string' ? new Date(etaDate) : etaDate;

  const diffMs = eta.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 1) {
    return 'Arriving now';
  } else if (diffMinutes === 1) {
    return '1 minute';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minutes`;
  } else {
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    if (minutes === 0) {
      return hours === 1 ? '1 hour' : `${hours} hours`;
    }

    return `${hours}h ${minutes}m`;
  }
}

/**
 * Get map style based on time of day
 */
export function getMapStyle(isDarkMode: boolean = false): any[] {
  if (!isDarkMode) {
    return []; // Use default map style
  }

  // Dark mode map style
  return [
    {
      elementType: 'geometry',
      stylers: [{ color: '#1a1a1a' }],
    },
    {
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#000000' }],
    },
    {
      elementType: 'labels.text.fill',
      stylers: [{ color: '#8a8a8a' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#2c2c2c' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#1f1f1f' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#0f0f0f' }],
    },
  ];
}

/**
 * Calculate bearing between two points
 * Returns angle in degrees (0-360)
 */
export function calculateBearing(start: Coordinates, end: Coordinates): number {
  const startLat = (start.latitude * Math.PI) / 180;
  const startLon = (start.longitude * Math.PI) / 180;
  const endLat = (end.latitude * Math.PI) / 180;
  const endLon = (end.longitude * Math.PI) / 180;

  const dLon = endLon - startLon;

  const y = Math.sin(dLon) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLon);

  const bearing = Math.atan2(y, x);
  const degrees = (bearing * 180) / Math.PI;

  return (degrees + 360) % 360;
}

/**
 * Check if coordinates are valid
 */
export function isValidCoordinates(coords: Coordinates | null | undefined): boolean {
  if (!coords) return false;

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
 * Format coordinates for display
 */
export function formatCoordinates(coords: Coordinates): string {
  return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
}

/**
 * Get default region (fallback when no coordinates available)
 */
export function getDefaultRegion(): Region {
  return {
    latitude: 37.78825, // San Francisco
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };
}
