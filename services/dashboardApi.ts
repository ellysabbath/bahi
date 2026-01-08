// services/dashboardApi.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://AutoFix.pythonanywhere.com';

// Type Definitions
export interface ServiceType {
  id: number;
  name: string;
  icon: string;
  color: string;
  description: string;
  category: string;
  base_price: string; // Comes as string from API
  created_at: string;
  updated_at: string;
}

export interface GarageType {
  id: number;
  name: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
  phone: string;
  email: string;
  rating: string;
  rating_count: number;
  is_open: boolean;
  delivery_available: boolean;
  estimated_time: string;
  opening_hours: Record<string, any>;
  created_at: string;
  updated_at: string;
  services?: number[];
}

// Frontend-specific interface that extends GarageType
export interface GarageTypeFrontend extends Omit<GarageType, 'estimated_time' | 'delivery_available'> {
  distance?: string;
  estimatedTime?: string;
  delivery?: boolean;
}

export interface ServiceDetailType {
  id: number;
  garage_service: number;
  name: string;
  description: string;
  price: string;
  duration: string;
  garage_name: string;
  service_name: string;
  created_at: string;
  garage_id?: number;
}

export interface BookingType {
  id?: number;
  garage: number;
  service_detail: number;
  scheduled_date: string;
  total_price: string;
  notes?: string;
  status?: string;
  created_at?: string;
}

export interface UserProfileType {
  id?: number;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  is_active?: boolean;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface AuthResponse {
  access?: string;
  refresh?: string;
  user?: UserProfileType;
}

// Create axios instance with auth token handling
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token if available
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/token/refresh/`, {
            refresh: refreshToken
          });
          
          const { access } = response.data;
          await AsyncStorage.setItem('auth_token', access);
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Clear tokens and redirect to login
        await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
        // You can use an event emitter or navigation context here
      }
    }
    
    return Promise.reject(error);
  }
);

// API Service Class
class DashboardAPI {
  // Authentication methods
  async login(credentials: { username: string; password: string }): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await api.post('/api/token/', credentials);
      const data = response.data;
      
      if (data.access) {
        await AsyncStorage.setItem('auth_token', data.access);
        if (data.refresh) {
          await AsyncStorage.setItem('refresh_token', data.refresh);
        }
      }
      
      return { success: true, data };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Login failed'
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return false;

      // Optionally verify token with backend
      const response = await api.get('/api/user/profile/');
      return response.status === 200;
    } catch  {
      return false;
    }
  }

  async getUserProfile(): Promise<ApiResponse<UserProfileType>> {
    try {
      const response = await api.get('/api/user/profile/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Get profile error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch user profile'
      };
    }
  }

  async checkAdminAccess(): Promise<boolean> {
    try {
      const response = await this.getUserProfile();
      if (response.success && response.data) {
        return response.data.is_staff === true || response.data.is_superuser === true;
      }
      return false;
    } catch (error) {
      console.error('Admin check error:', error);
      return false;
    }
  }

  // Services endpoints
  async getServices(params?: {
    category?: string;
    search?: string;
    ordering?: string;
  }): Promise<ApiResponse<ServiceType[]>> {
    try {
      const response = await api.get('/services/', { params });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Error fetching services:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch services'
      };
    }
  }

  async getFeaturedServices(): Promise<ApiResponse<ServiceType[]>> {
    try {
      const response = await api.get('/services/featured/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Error fetching featured services:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch featured services'
      };
    }
  }

  async getServiceById(id: number): Promise<ApiResponse<ServiceType>> {
    try {
      const response = await api.get(`/services/${id}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Error fetching service:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch service'
      };
    }
  }

  // Garage endpoints
  async getGarages(params?: {
    is_open?: boolean;
    delivery_available?: boolean;
    search?: string;
    ordering?: string;
  }): Promise<ApiResponse<GarageType[]>> {
    try {
      const response = await api.get('/garages/', { params });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Error fetching garages:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch garages'
      };
    }
  }

  async getNearbyGarages(): Promise<ApiResponse<GarageType[]>> {
    try {
      const response = await api.get('/garages/nearby/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Error fetching nearby garages:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch nearby garages'
      };
    }
  }

  async getGarageById(id: number): Promise<ApiResponse<GarageType>> {
    try {
      const response = await api.get(`/garages/${id}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Error fetching garage:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch garage'
      };
    }
  }

  async getGarageServices(garageId: number): Promise<ApiResponse<ServiceDetailType[]>> {
    try {
      const response = await api.get('/service-details/', {
        params: { garage_id: garageId }
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Error fetching garage services:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch garage services'
      };
    }
  }

  async getGarageDetails(id: number): Promise<ApiResponse<GarageType & { allServices: ServiceDetailType[] }>> {
    try {
      const [garageResponse, servicesResponse] = await Promise.all([
        this.getGarageById(id),
        this.getGarageServices(id)
      ]);

      if (garageResponse.success && garageResponse.data && 
          servicesResponse.success && servicesResponse.data) {
        return {
          success: true,
          data: {
            ...garageResponse.data,
            allServices: servicesResponse.data
          }
        };
      }
      return {
        success: false,
        message: garageResponse.message || servicesResponse.message || 'Failed to fetch garage details'
      };
    } catch (error: any) {
      console.error('Error fetching garage details:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch garage details'
      };
    }
  }

  // Service Details endpoints
  async getServiceDetails(params?: {
    garage_id?: number;
    garage_service_id?: number;
  }): Promise<ApiResponse<ServiceDetailType[]>> {
    try {
      const response = await api.get('/service-details/', { params });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Error fetching service details:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch service details'
      };
    }
  }

  // Booking endpoints
  async createBooking(bookingData: BookingType): Promise<ApiResponse<BookingType>> {
    try {
      const response = await api.post('/bookings/', bookingData);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Error creating booking:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create booking'
      };
    }
  }

  async getBookings(): Promise<ApiResponse<BookingType[]>> {
    try {
      const response = await api.get('/bookings/');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch bookings'
      };
    }
  }

  // Helper functions
  formatGarageForFrontend(garage: GarageType, index: number): GarageTypeFrontend {
    const garageFrontend: GarageTypeFrontend = {
      id: garage.id,
      name: garage.name,
      address: garage.address,
      latitude: garage.latitude,
      longitude: garage.longitude,
      phone: garage.phone,
      email: garage.email,
      rating: garage.rating,
      rating_count: garage.rating_count,
      is_open: garage.is_open,
      opening_hours: garage.opening_hours,
      created_at: garage.created_at,
      updated_at: garage.updated_at,
      services: garage.services,
      distance: this.calculateDistance(index),
      estimatedTime: garage.estimated_time,
      delivery: garage.delivery_available
    };
    
    return garageFrontend;
  }

  formatServiceForFrontend(service: ServiceType): ServiceType & { 
    desc: string; 
    formatted_price: number; 
    formatted_price_string: string;
  } {
    const price = parseFloat(service.base_price);
    return {
      ...service,
      desc: service.description,
      formatted_price: price,
      formatted_price_string: price.toFixed(2)
    };
  }

  // Utility functions
  calculateDistance(index: number): string {
    const distances = ['0.5 km', '1.2 km', '2.3 km', '3.1 km', '4.5 km', '5.2 km'];
    return distances[index % distances.length];
  }

  getServiceColor(service: ServiceType, theme: string = 'light'): string {
    const colors: Record<string, string> = {
      Maintenance: theme === 'dark' ? 'bg-orange-600' : 'bg-orange-500',
      Safety: theme === 'dark' ? 'bg-red-600' : 'bg-red-500',
      Diagnostics: theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500',
      Electrical: theme === 'dark' ? 'bg-yellow-600' : 'bg-yellow-500',
      Comfort: theme === 'dark' ? 'bg-blue-400' : 'bg-blue-400',
      Cleaning: theme === 'dark' ? 'bg-blue-500' : 'bg-blue-500',
      default: theme === 'dark' ? 'bg-gray-600' : 'bg-gray-500'
    };
    return colors[service.category] || colors.default;
  }

  formatPrice(price: string): string {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return '0.00';
    return numPrice.toFixed(2);
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch  {
      return dateString;
    }
  }

  // Check if user has admin access
  async validateAdminAccess(): Promise<ApiResponse<boolean>> {
    try {
      const isAdmin = await this.checkAdminAccess();
      return { success: true, data: isAdmin };
    } catch (error: any) {
      console.error('Admin validation error:', error);
      return {
        success: false,
        message: error.message || 'Failed to validate admin access'
      };
    }
  }
}

// Export singleton instance
export const dashboardAPI = new DashboardAPI();
export default dashboardAPI;