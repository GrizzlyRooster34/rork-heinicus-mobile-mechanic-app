export interface Location {
    latitude: number;
    longitude: number;
}

export interface TravelTier {
    name: string;
    minDistanceMiles: number;
    maxDistanceMiles: number;
    fee: number;
}

// The central location of the business (Placeholder: Downtown LA)
export const MOCK_COMPANY_LOCATION: Location = {
    latitude: 34.052235,
    longitude: -118.243683,
};

// AI Studio Port: Tiers are defined by distance from the company location
export const TRAVEL_TIERS: TravelTier[] = [
    {
        name: 'Tier 1',
        minDistanceMiles: 0,
        maxDistanceMiles: 10,
        fee: 25,
    },
    {
        name: 'Tier 2',
        minDistanceMiles: 10,
        maxDistanceMiles: 20,
        fee: 45,
    },
    {
        name: 'Tier 3',
        minDistanceMiles: 20,
        maxDistanceMiles: 35,
        fee: 70,
    },
];

/**
 * Calculate travel fee based on distance
 */
export function calculateTravelFee(distanceMiles: number): number {
  const tier = TRAVEL_TIERS.find(
    t => distanceMiles >= t.minDistanceMiles && distanceMiles < t.maxDistanceMiles
  );
  return tier ? tier.fee : (distanceMiles >= 35 ? 100 : 25);
}
