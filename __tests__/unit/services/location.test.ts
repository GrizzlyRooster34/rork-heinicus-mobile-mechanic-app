import { calculateHaversineDistance } from '@/backend/services/location';

describe('location service', () => {
  it('calculates haversine distance for known coordinate pairs', () => {
    const chicago = { latitude: 41.8781, longitude: -87.6298 };
    const milwaukee = { latitude: 43.0389, longitude: -87.9065 };

    const distanceMeters = calculateHaversineDistance(chicago, milwaukee);

    expect(distanceMeters).toBeGreaterThan(130000);
    expect(distanceMeters).toBeLessThan(135000);
  });

  it('returns zero distance for identical coordinates', () => {
    const point = { latitude: 30.2672, longitude: -97.7431 };

    expect(calculateHaversineDistance(point, point)).toBe(0);
  });
});
