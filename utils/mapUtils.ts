// utils/mapUtils.ts
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GarageCoordinates {
  id: number;
  name: string;
  coordinates: Coordinates;
}

// Mock garage coordinates (replace with actual coordinates from your database)
export const garageCoordinates: GarageCoordinates[] = [
  { id: 1, name: 'Speedy Auto Fix', coordinates: { latitude: -6.7924, longitude: 39.2083 } },
  { id: 2, name: 'Pro Mechanics Hub', coordinates: { latitude: -6.7865, longitude: 39.2101 } },
  { id: 3, name: 'Elite Auto Care', coordinates: { latitude: -6.8001, longitude: 39.2150 } },
  { id: 4, name: 'Budget Auto Repairs', coordinates: { latitude: -6.7952, longitude: 39.2055 } },
  { id: 5, name: 'Family Auto Shop', coordinates: { latitude: -6.8123, longitude: 39.2220 } },
];

/**
 * Calculate distance between two coordinates using Haversine formula
 * [citation:1]
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

/**
 * Format distance for display
 */
export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${(distance * 1000).toFixed(0)} m`; // Convert to meters
  }
  return `${distance.toFixed(1)} km`;
};