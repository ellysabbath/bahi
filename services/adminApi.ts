// services/adminApi.ts
import api from './api';

// ========== TYPES ==========
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

export interface Service {
  id: number;
  name: string;
  icon: string;
  color: string;
  description: string;
  category: string;
  base_price: string;
  created_at?: string;
  updated_at?: string;
}

export interface GarageService {
  id: number;
  garage: number;
  service: number;
  price: string;
  duration: string;
  description?: string;
  created_at?: string;
  garage_name?: string;
  service_name?: string;
}

export interface ServiceDetail {
  id: number;
  garage_service: number;
  name: string;
  description?: string;
  price: string;
  duration: string;
  created_at?: string;
  garage_name?: string;
  service_name?: string;
}

export interface Booking {
  id: number;
  user: number;
  garage: number;
  service_detail: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date: string;
  total_price: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  user_email?: string;
  garage_name?: string;
  service_name?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[] | string>;
}

export interface DashboardStats {
  overview: {
    total_garages: number;
    total_services: number;
    total_bookings: number;
    active_users: number;
  };
  bookings_by_status: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  revenue: {
    total: number;
    today: number;
    this_month: number;
    average_per_booking: number;
  };
  today: {
    bookings: number;
    revenue: number;
    new_garages: number;
  };
  top_performing_garages: Array<{
    id: number;
    name: string;
    bookings: number;
    revenue: number;
    rating: number;
  }>;
}

export interface BookingStats {
  date_range: {
    start_date: string;
    end_date: string;
    days: number;
  };
  daily_bookings: Array<{
    date: string;
    count: number;
    revenue: number;
  }>;
  monthly_revenue: Array<{
    month: string;
    revenue: number;
    count: number;
  }>;
  status_distribution: Record<string, { count: number; revenue: number }>;
  summary: {
    total_bookings: number;
    total_revenue: number;
    avg_booking_value: number;
  };
}

// ========== API CLASS ==========
class AdminApi {
  // ===== GARAGES =====
  async getGarages(
    page: number = 1,
    pageSize: number = 10,
    search?: string
  ): Promise<ApiResponse<PaginatedResponse<Garage>>> {
    try {
      const params: Record<string, any> = {
        page,
        page_size: pageSize,
      };

      if (search) params.search = search;

      const response = await api.get('/admin/garages/', { params });
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Error fetching garages:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to fetch garages',
        errors: error.response?.data,
      };
    }
  }

  async getGarage(id: number): Promise<ApiResponse<Garage>> {
    try {
      const response = await api.get(`/admin/garages/${id}/`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error(`Error fetching garage ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to fetch garage',
      };
    }
  }

  async createGarage(data: Partial<Garage>): Promise<ApiResponse<Garage>> {
    try {
      const formattedData: any = { ...data };

      if (formattedData.opening_hours && typeof formattedData.opening_hours === 'string') {
        try {
          formattedData.opening_hours = JSON.parse(formattedData.opening_hours);
        } catch (e) {
          console.warn('Invalid JSON for opening_hours');
        }
      }

      const response = await api.post('/admin/garages/', formattedData);
      return {
        success: true,
        data: response.data,
        message: 'Garage created successfully',
      };
    } catch (error: any) {
      console.error('Error creating garage:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to create garage',
        errors: error.response?.data,
      };
    }
  }

  async updateGarage(id: number, data: Partial<Garage>): Promise<ApiResponse<Garage>> {
    try {
      const formattedData: any = { ...data };

      if (formattedData.opening_hours && typeof formattedData.opening_hours === 'string') {
        try {
          formattedData.opening_hours = JSON.parse(formattedData.opening_hours);
        } catch (e) {
          console.warn('Invalid JSON for opening_hours');
        }
      }

      const response = await api.put(`/admin/garages/${id}/`, formattedData);
      return {
        success: true,
        data: response.data,
        message: 'Garage updated successfully',
      };
    } catch (error: any) {
      console.error(`Error updating garage ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to update garage',
        errors: error.response?.data,
      };
    }
  }

  async patchGarage(id: number, data: Partial<Garage>): Promise<ApiResponse<Garage>> {
    try {
      const response = await api.patch(`/admin/garages/${id}/`, data);
      return {
        success: true,
        data: response.data,
        message: 'Garage updated successfully',
      };
    } catch (error: any) {
      console.error(`Error patching garage ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to update garage',
        errors: error.response?.data,
      };
    }
  }

  async deleteGarage(id: number): Promise<ApiResponse<void>> {
    try {
      await api.delete(`/admin/garages/${id}/`);
      return {
        success: true,
        message: 'Garage deleted successfully',
      };
    } catch (error: any) {
      console.error(`Error deleting garage ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to delete garage',
      };
    }
  }

  async toggleGarageVerification(id: number): Promise<ApiResponse<Garage>> {
    try {
      const response = await api.post(`/admin/garages/${id}/toggle_verification/`);
      return {
        success: true,
        data: response.data.garage,
        message: response.data.message || 'Verification status updated',
      };
    } catch (error: any) {
      console.error(`Error toggling garage verification ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to toggle verification',
      };
    }
  }

  async toggleGarageActive(id: number): Promise<ApiResponse<Garage>> {
    try {
      const response = await api.post(`/admin/garages/${id}/toggle_active/`);
      return {
        success: true,
        data: response.data.garage,
        message: response.data.message || 'Active status updated',
      };
    } catch (error: any) {
      console.error(`Error toggling garage active status ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to toggle active status',
      };
    }
  }

  // ===== SERVICES =====
  async getServices(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    category?: string
  ): Promise<ApiResponse<PaginatedResponse<Service>>> {
    try {
      const params: Record<string, any> = {
        page,
        page_size: pageSize,
      };

      if (search) params.search = search;
      if (category) params.category = category;

      const response = await api.get('/admin/services/', { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Error fetching services:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to fetch services',
      };
    }
  }

  async createService(data: Partial<Service>): Promise<ApiResponse<Service>> {
    try {
      const response = await api.post('/admin/services/', data);
      return {
        success: true,
        data: response.data,
        message: 'Service created successfully',
      };
    } catch (error: any) {
      console.error('Error creating service:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to create service',
        errors: error.response?.data,
      };
    }
  }

  async updateService(id: number, data: Partial<Service>): Promise<ApiResponse<Service>> {
    try {
      const response = await api.put(`/admin/services/${id}/`, data);
      return {
        success: true,
        data: response.data,
        message: 'Service updated successfully',
      };
    } catch (error: any) {
      console.error(`Error updating service ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to update service',
        errors: error.response?.data,
      };
    }
  }

  async deleteService(id: number): Promise<ApiResponse<void>> {
    try {
      await api.delete(`/admin/services/${id}/`);
      return {
        success: true,
        message: 'Service deleted successfully',
      };
    } catch (error: any) {
      console.error(`Error deleting service ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to delete service',
      };
    }
  }

  // ===== GARAGE SERVICES =====
  async getGarageServices(
    page: number = 1,
    pageSize: number = 10,
    garageId?: number,
    serviceId?: number
  ): Promise<ApiResponse<PaginatedResponse<GarageService>>> {
    try {
      const params: Record<string, any> = {
        page,
        page_size: pageSize,
      };

      if (garageId) params.garage = garageId;
      if (serviceId) params.service = serviceId;

      const response = await api.get('/admin/garage-services/', { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Error fetching garage services:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to fetch garage services',
      };
    }
  }

  async createGarageService(data: Partial<GarageService>): Promise<ApiResponse<GarageService>> {
    try {
      const response = await api.post('/admin/garage-services/', data);
      return {
        success: true,
        data: response.data,
        message: 'Garage service created successfully',
      };
    } catch (error: any) {
      console.error('Error creating garage service:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to create garage service',
        errors: error.response?.data,
      };
    }
  }

  async updateGarageService(id: number, data: Partial<GarageService>): Promise<ApiResponse<GarageService>> {
    try {
      const response = await api.put(`/admin/garage-services/${id}/`, data);
      return {
        success: true,
        data: response.data,
        message: 'Garage service updated successfully',
      };
    } catch (error: any) {
      console.error(`Error updating garage service ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to update garage service',
        errors: error.response?.data,
      };
    }
  }

  async deleteGarageService(id: number): Promise<ApiResponse<void>> {
    try {
      await api.delete(`/admin/garage-services/${id}/`);
      return {
        success: true,
        message: 'Garage service deleted successfully',
      };
    } catch (error: any) {
      console.error(`Error deleting garage service ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to delete garage service',
      };
    }
  }

  // ===== SERVICE DETAILS =====
  async getServiceDetails(
    page: number = 1,
    pageSize: number = 10,
    garageServiceId?: number
  ): Promise<ApiResponse<PaginatedResponse<ServiceDetail>>> {
    try {
      const params: Record<string, any> = {
        page,
        page_size: pageSize,
      };

      if (garageServiceId) params.garage_service = garageServiceId;

      const response = await api.get('/admin/service-details/', { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Error fetching service details:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to fetch service details',
      };
    }
  }

  async createServiceDetail(data: Partial<ServiceDetail>): Promise<ApiResponse<ServiceDetail>> {
    try {
      const response = await api.post('/admin/service-details/', data);
      return {
        success: true,
        data: response.data,
        message: 'Service detail created successfully',
      };
    } catch (error: any) {
      console.error('Error creating service detail:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to create service detail',
        errors: error.response?.data,
      };
    }
  }

  async updateServiceDetail(id: number, data: Partial<ServiceDetail>): Promise<ApiResponse<ServiceDetail>> {
    try {
      const response = await api.put(`/admin/service-details/${id}/`, data);
      return {
        success: true,
        data: response.data,
        message: 'Service detail updated successfully',
      };
    } catch (error: any) {
      console.error(`Error updating service detail ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to update service detail',
        errors: error.response?.data,
      };
    }
  }

  async toggleServiceDetailActive(id: number): Promise<ApiResponse<ServiceDetail>> {
    try {
      const response = await api.post(`/admin/service-details/${id}/toggle_active/`);
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Service detail status updated',
      };
    } catch (error: any) {
      console.error(`Error toggling service detail active status ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to toggle active status',
      };
    }
  }

  async deleteServiceDetail(id: number): Promise<ApiResponse<void>> {
    try {
      await api.delete(`/admin/service-details/${id}/`);
      return {
        success: true,
        message: 'Service detail deleted successfully',
      };
    } catch (error: any) {
      console.error(`Error deleting service detail ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to delete service detail',
      };
    }
  }

  // ===== BOOKINGS =====
  async getBookings(
    page: number = 1,
    pageSize: number = 10,
    filters?: {
      status?: string;
      garage?: number;
      user?: number;
      start_date?: string;
      end_date?: string;
      search?: string;
    }
  ): Promise<ApiResponse<PaginatedResponse<Booking>>> {
    try {
      const params: Record<string, any> = {
        page,
        page_size: pageSize,
      };

      if (filters?.status) params.status = filters.status;
      if (filters?.garage) params.garage = filters.garage;
      if (filters?.user) params.user = filters.user;
      if (filters?.start_date) params.start_date = filters.start_date;
      if (filters?.end_date) params.end_date = filters.end_date;
      if (filters?.search) params.search = filters.search;

      const response = await api.get('/admin/bookings/', { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to fetch bookings',
      };
    }
  }

  async getBooking(id: number): Promise<ApiResponse<Booking>> {
    try {
      const response = await api.get(`/admin/bookings/${id}/`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error(`Error fetching booking ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to fetch booking',
      };
    }
  }

  async updateBookingStatus(id: number, status: Booking['status']): Promise<ApiResponse<Booking>> {
    try {
      const response = await api.post(`/admin/bookings/${id}/update_status/`, { status });
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Booking status updated',
      };
    } catch (error: any) {
      console.error(`Error updating booking status ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to update booking status',
        errors: error.response?.data,
      };
    }
  }

  async updateBooking(id: number, data: Partial<Booking>): Promise<ApiResponse<Booking>> {
    try {
      const response = await api.put(`/admin/bookings/${id}/`, data);
      return {
        success: true,
        data: response.data,
        message: 'Booking updated successfully',
      };
    } catch (error: any) {
      console.error(`Error updating booking ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to update booking',
        errors: error.response?.data,
      };
    }
  }

  async deleteBooking(id: number): Promise<ApiResponse<void>> {
    try {
      await api.delete(`/admin/bookings/${id}/`);
      return {
        success: true,
        message: 'Booking deleted successfully',
      };
    } catch (error: any) {
      console.error(`Error deleting booking ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to delete booking',
      };
    }
  }

  // ===== STATISTICS =====
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      const response = await api.get('/admin/bookings/dashboard_stats/');
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to fetch dashboard statistics',
      };
    }
  }

  async getBookingStats(days: number = 30): Promise<ApiResponse<BookingStats>> {
    try {
      const response = await api.get('/admin/bookings/stats/', {
        params: { days },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Error fetching booking stats:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to fetch booking statistics',
      };
    }
  }

  async exportBookings(filters?: {
    start_date?: string;
    end_date?: string;
    status?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await api.get('/admin/bookings/export/', {
        params: filters,
      });
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Bookings exported successfully',
      };
    } catch (error: any) {
      console.error('Error exporting bookings:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to export bookings',
      };
    }
  }

  // ===== UTILITY METHODS =====
  async testConnection(): Promise<ApiResponse<any>> {
    try {
      const response = await api.get('/garages/');
      return {
        success: true,
        data: response.data,
        message: 'API connection successful',
      };
    } catch (error: any) {
      console.error('API connection test failed:', error);
      return {
        success: false,
        message: error.response?.data?.detail || error.message || 'API connection failed',
      };
    }
  }

  async testAdminEndpoint(): Promise<ApiResponse<any>> {
    try {
      const response = await api.get('/admin/garages/');
      return {
        success: true,
        data: response.data,
        message: 'Admin endpoint accessible',
      };
    } catch (error: any) {
      console.error('Admin endpoint test failed:', error);
      
      if (error.response?.status === 401) {
        return {
          success: false,
          message: 'Authentication required. Please login with admin credentials.',
        };
      }
      
      if (error.response?.status === 403) {
        return {
          success: false,
          message: 'Access forbidden. Admin permissions required.',
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.detail || error.message || 'Admin endpoint not accessible',
      };
    }
  }
}

// Export a singleton instance
export default new AdminApi();

// Also export types for use in other files
export type {
  Garage,
  Service,
  GarageService,
  ServiceDetail,
  Booking,
  PaginatedResponse,
  ApiResponse,
  DashboardStats,
  BookingStats,
};