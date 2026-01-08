export interface Garage {
  id: number;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  rating?: number;
  rating_count?: number;
  is_open: boolean;
  delivery_available: boolean;
  estimated_time?: string;
  latitude?: string;
  longitude?: string;
  opening_hours?: Record<string, string> | string;
  services?: string[];
  created_at?: string;
  updated_at?: string;
  owner?: number;
  is_verified?: boolean;
  is_active?: boolean;
  city?: string;
  total_bookings?: number;
}

export interface GarageApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Garage[];
}

export interface CreateGarageDto {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  rating?: number;
  rating_count?: number;
  is_open?: boolean;
  delivery_available?: boolean;
  estimated_time?: string;
  latitude?: string;
  longitude?: string;
  opening_hours?: Record<string, string>;
}

// Fixed: Removed empty interface extending Partial
export type UpdateGarageDto = Partial<CreateGarageDto>;