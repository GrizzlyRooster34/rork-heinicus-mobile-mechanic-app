import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region, Polyline } from 'react-native-maps';
import { useJobTracking } from '@/hooks/useJobTracking';
import { getRegionForCoordinates, openNavigation, formatETA, isValidCoordinates } from '@/utils/map-utils';

/**
 * JobMap Component
 *
 * Displays a map with job location and real-time mechanic tracking
 * Shows customer location, mechanic location, and ETA information
 */

interface JobMapProps {
  jobId: string;
  customerLocation?: {
    latitude: number;
    longitude: number;
  };
  showNavigationButton?: boolean;
  style?: any;
}

export function JobMap({
  jobId,
  customerLocation,
  showNavigationButton = false,
  style,
}: JobMapProps) {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const {
    isConnected,
    currentLocation: mechanicLocation,
    lastStatusUpdate,
  } = useJobTracking(jobId);

  // Update map region when locations change
  useEffect(() => {
    const points = [];

    if (customerLocation && isValidCoordinates(customerLocation)) {
      points.push(customerLocation);
    }

    if (mechanicLocation && isValidCoordinates(mechanicLocation)) {
      points.push({
        latitude: mechanicLocation.latitude,
        longitude: mechanicLocation.longitude,
      });
    }

    if (points.length > 0) {
      const newRegion = getRegionForCoordinates(points);
      setRegion(newRegion);

      // Animate to new region
      mapRef.current?.animateToRegion(newRegion, 500);
    }
  }, [customerLocation, mechanicLocation]);

  // Handle navigation button press
  const handleNavigate = () => {
    if (customerLocation && isValidCoordinates(customerLocation)) {
      openNavigation(customerLocation);
    }
  };

  if (!customerLocation || !isValidCoordinates(customerLocation)) {
    return (
      <View style={[styles.container, styles.centered, style]}>
        <Text style={styles.errorText}>Location not available</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={
          region || {
            latitude: customerLocation.latitude,
            longitude: customerLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }
        }
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
      >
        {/* Customer Location Marker */}
        <Marker
          coordinate={customerLocation}
          title="Job Location"
          description="Customer location"
          pinColor="red"
        />

        {/* Mechanic Location Marker */}
        {mechanicLocation && isValidCoordinates(mechanicLocation) && (
          <Marker
            coordinate={{
              latitude: mechanicLocation.latitude,
              longitude: mechanicLocation.longitude,
            }}
            title="Mechanic"
            description={mechanicLocation.eta ? `ETA: ${formatETA(mechanicLocation.eta)}` : 'En route'}
            pinColor="blue"
          />
        )}

        {/* Route Line */}
        {mechanicLocation &&
          isValidCoordinates(mechanicLocation) &&
          customerLocation &&
          isValidCoordinates(customerLocation) && (
            <Polyline
              coordinates={[
                {
                  latitude: mechanicLocation.latitude,
                  longitude: mechanicLocation.longitude,
                },
                customerLocation,
              ]}
              strokeColor="#2196F3"
              strokeWidth={3}
              lineDashPattern={[10, 5]}
            />
          )}
      </MapView>

      {/* Connection Status Badge */}
      {!isConnected && (
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, styles.disconnected]} />
          <Text style={styles.statusText}>Reconnecting...</Text>
        </View>
      )}

      {/* ETA Card */}
      {mechanicLocation && mechanicLocation.eta && (
        <View style={styles.etaCard}>
          <Text style={styles.etaLabel}>Estimated Arrival</Text>
          <Text style={styles.etaTime}>{formatETA(mechanicLocation.eta)}</Text>
        </View>
      )}

      {/* Status Card */}
      {lastStatusUpdate && (
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Status</Text>
          <Text style={styles.statusValue}>{lastStatusUpdate.status}</Text>
          {lastStatusUpdate.notes && (
            <Text style={styles.statusNotes}>{lastStatusUpdate.notes}</Text>
          )}
        </View>
      )}

      {/* Navigation Button */}
      {showNavigationButton && (
        <TouchableOpacity style={styles.navButton} onPress={handleNavigate}>
          <Text style={styles.navButtonText}>Navigate</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  map: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connected: {
    backgroundColor: '#4CAF50',
  },
  disconnected: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  etaCard: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(33, 150, 243, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  etaLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  etaTime: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusCard: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  statusLabel: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  statusValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  statusNotes: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 8,
  },
  navButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
