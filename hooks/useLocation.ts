import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

/**
 * Location data interface
 */
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

/**
 * Location error types
 */
export type LocationError =
  | 'PERMISSION_DENIED'
  | 'LOCATION_UNAVAILABLE'
  | 'TIMEOUT'
  | 'UNKNOWN';

/**
 * Location permission status
 */
export type PermissionStatus =
  | 'granted'
  | 'denied'
  | 'undetermined'
  | 'restricted';

/**
 * useLocation Hook
 *
 * Provides GPS location access with automatic permission handling
 *
 * @param options - Configuration options
 * @returns Location state and methods
 */
export function useLocation(options?: {
  enableHighAccuracy?: boolean;
  watch?: boolean; // Enable continuous location updates
  distanceFilter?: number; // Minimum distance (meters) between updates
}) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('undetermined');
  const [error, setError] = useState<LocationError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Request location permissions
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Check current permission status
      const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();

      if (foregroundStatus === 'granted') {
        setPermissionStatus('granted');
        setIsLoading(false);
        return true;
      }

      // Request foreground permission
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        setPermissionStatus('granted');
        setIsLoading(false);
        return true;
      }

      setPermissionStatus(status as PermissionStatus);
      setError('PERMISSION_DENIED');
      setIsLoading(false);
      return false;
    } catch (err) {
      console.error('Error requesting location permission:', err);
      setError('UNKNOWN');
      setPermissionStatus('denied');
      setIsLoading(false);
      return false;
    }
  }, []);

  /**
   * Request background location permissions (for mechanics)
   */
  const requestBackgroundPermission = useCallback(async (): Promise<boolean> => {
    try {
      // First ensure foreground permission is granted
      const foregroundGranted = await requestPermission();
      if (!foregroundGranted) {
        return false;
      }

      // Request background permission
      const { status } = await Location.requestBackgroundPermissionsAsync();

      if (status === 'granted') {
        return true;
      }

      setError('PERMISSION_DENIED');
      return false;
    } catch (err) {
      console.error('Error requesting background location permission:', err);
      setError('UNKNOWN');
      return false;
    }
  }, [requestPermission]);

  /**
   * Get current location (single reading)
   */
  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Ensure permission is granted
      if (permissionStatus !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setIsLoading(false);
          return null;
        }
      }

      const result = await Location.getCurrentPositionAsync({
        accuracy: options?.enableHighAccuracy
          ? Location.Accuracy.High
          : Location.Accuracy.Balanced,
      });

      const locationData: LocationData = {
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        accuracy: result.coords.accuracy,
        altitude: result.coords.altitude,
        heading: result.coords.heading,
        speed: result.coords.speed,
        timestamp: result.timestamp,
      };

      setLocation(locationData);
      setIsLoading(false);
      return locationData;
    } catch (err: any) {
      console.error('Error getting current location:', err);

      if (err.code === 'E_LOCATION_UNAVAILABLE') {
        setError('LOCATION_UNAVAILABLE');
      } else if (err.code === 'E_LOCATION_TIMEOUT') {
        setError('TIMEOUT');
      } else {
        setError('UNKNOWN');
      }

      setIsLoading(false);
      return null;
    }
  }, [permissionStatus, requestPermission, options?.enableHighAccuracy]);

  /**
   * Watch location changes
   */
  const watchLocation = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Ensure permission is granted
      if (permissionStatus !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setIsLoading(false);
          return null;
        }
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: options?.enableHighAccuracy
            ? Location.Accuracy.High
            : Location.Accuracy.Balanced,
          distanceInterval: options?.distanceFilter || 10, // Update every 10 meters by default
          timeInterval: 5000, // Update every 5 seconds
        },
        (result) => {
          const locationData: LocationData = {
            latitude: result.coords.latitude,
            longitude: result.coords.longitude,
            accuracy: result.coords.accuracy,
            altitude: result.coords.altitude,
            heading: result.coords.heading,
            speed: result.coords.speed,
            timestamp: result.timestamp,
          };

          setLocation(locationData);
        }
      );

      setIsLoading(false);
      return subscription;
    } catch (err: any) {
      console.error('Error watching location:', err);
      setError('UNKNOWN');
      setIsLoading(false);
      return null;
    }
  }, [
    permissionStatus,
    requestPermission,
    options?.enableHighAccuracy,
    options?.distanceFilter,
  ]);

  /**
   * Get address from coordinates (reverse geocoding)
   */
  const getAddressFromCoordinates = useCallback(
    async (latitude: number, longitude: number): Promise<string | null> => {
      try {
        const results = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        if (results.length > 0) {
          const address = results[0];
          const parts = [
            address.street,
            address.city,
            address.region,
            address.postalCode,
          ].filter(Boolean);

          return parts.join(', ');
        }

        return null;
      } catch (err) {
        console.error('Error reverse geocoding:', err);
        return null;
      }
    },
    []
  );

  /**
   * Check if location services are enabled
   */
  const checkLocationEnabled = useCallback(async (): Promise<boolean> => {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (err) {
      console.error('Error checking location services:', err);
      return false;
    }
  }, []);

  // Auto-request permission on mount
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // Auto-watch location if enabled
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    if (options?.watch && permissionStatus === 'granted') {
      watchLocation().then((sub) => {
        if (sub) {
          subscription = sub;
        }
      });
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [options?.watch, permissionStatus, watchLocation]);

  return {
    // State
    location,
    permissionStatus,
    error,
    isLoading,

    // Methods
    requestPermission,
    requestBackgroundPermission,
    getCurrentLocation,
    watchLocation,
    getAddressFromCoordinates,
    checkLocationEnabled,
  };
}

/**
 * Calculate distance between two coordinates in meters
 * Uses Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  const km = meters / 1000;
  if (km < 10) {
    return `${km.toFixed(1)} km`;
  }

  return `${Math.round(km)} km`;
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}
