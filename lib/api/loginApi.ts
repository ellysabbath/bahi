// lib/api/authApi.ts
import { API_CONFIG } from './_config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../context/UserContext';

// ==================== INTERFACES ====================
export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  error?: string;
  access?: string;
  refresh?: string;
  user?: User;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

// ==================== STORAGE KEYS ====================
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'quickfix_access_token',
  REFRESH_TOKEN: 'quickfix_refresh_token',
  USER_DATA: 'quickfix_user_data',
};

// ==================== LOGGER ====================
const logger = {
  info: (message: string, data?: any) => {
    if (API_CONFIG.DEBUG_MODE) {
      console.log(`🔵 [${new Date().toISOString()}] ${message}`, data || '');
    }
  },
  warn: (message: string, data?: any) => {
    if (API_CONFIG.DEBUG_MODE) {
      console.warn(`🟡 [${new Date().toISOString()}] ${message}`, data || '');
    }
  },
  error: (message: string, data?: any) => {
    console.error(`🔴 [${new Date().toISOString()}] ${message}`, data || '');
  }
};

// ==================== STORAGE HELPERS ====================
const storage = {
  setTokens: async (access: string, refresh: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
      logger.info('Tokens stored successfully');
    } catch (error) {
      logger.error('Failed to store tokens:', error);
      throw error;
    }
  },

  setUser: async (user: User): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      logger.info('User data stored');
    } catch (error) {
      logger.error('Failed to store user data:', error);
    }
  },

  getAccessToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch {
      return null;
    }
  },

  getRefreshToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch {
      return null;
    }
  },

  getUser: async (): Promise<User | null> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  clearAll: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
      logger.info('All auth data cleared');
    } catch (error) {
      logger.error('Failed to clear auth data:', error);
    }
  }
};

// ==================== NETWORK CORE ====================
const createFetch = async <T>(
  endpoint: string,
  options: RequestInit = {},
  requireAuth: boolean = false
): Promise<T> => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    // Prepare headers as Record<string, string> to avoid TypeScript errors
    const headers: Record<string, string> = {
      ...(API_CONFIG.DEFAULT_HEADERS as Record<string, string>),
      ...(options.headers as Record<string, string> || {}),
    };

    // Add auth token if required
    if (requireAuth) {
      const token = await storage.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        throw new Error('No authentication token available');
      }
    }

    logger.info(`🌐 ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
      ...API_CONFIG.FETCH_OPTIONS,
    });

    clearTimeout(timeoutId);

    // Handle token expiration
    if (response.status === 401 && requireAuth) {
      logger.warn('Token expired, attempting refresh...');
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry with new token
        const newToken = await storage.getAccessToken();
        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
            signal: controller.signal,
          });
          return handleResponse<T>(retryResponse);
        }
      }
      throw new Error('Authentication failed. Please login again.');
    }

    return handleResponse<T>(response);
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your connection.');
    }
    throw error;
  }
};

// ==================== RESPONSE HANDLER ====================
const handleResponse = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get('content-type');
  
  if (!contentType?.includes('application/json')) {
    const text = await response.text();
    logger.warn('Non-JSON response:', text.substring(0, 200));
    throw new Error(`Invalid response format: ${response.status}`);
  }

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data.detail || 
                        data.error || 
                        data.message || 
                        data.non_field_errors?.[0] || 
                        `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return data as T;
};

// ==================== TOKEN REFRESH ====================
const refreshToken = async (): Promise<boolean> => {
  try {
    const refreshTokenValue = await storage.getRefreshToken();
    if (!refreshTokenValue) {
      logger.warn('No refresh token available');
      return false;
    }

    logger.info('Refreshing access token...');
    
    const data = await createFetch<{ access: string }>(
      '/api/auth/token/refresh/',  // Fixed: Remove API_CONFIG.ENDPOINTS reference
      {
        method: 'POST',
        body: JSON.stringify({ refresh: refreshTokenValue }),
      }
    );

    if (data.access) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access);
      logger.info('Token refreshed successfully');
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Token refresh failed:', error);
    await storage.clearAll();
    return false;
  }
};

// ==================== API FUNCTIONS ====================
export const authApi = {
  // ========== LOGIN ==========
  login: async (credentials: LoginData): Promise<LoginResponse> => {
    try {
      logger.info('Attempting login...');

      const data = await createFetch<{
        access: string;
        refresh: string;
        user?: any;
      }>(
        '/api/auth/login/',  // Fixed: Direct endpoint
        {
          method: 'POST',
          body: JSON.stringify({
            email: credentials.email.trim().toLowerCase(),
            password: credentials.password,
          }),
        }
      );

      // Store tokens
      await storage.setTokens(data.access, data.refresh);

      // Process user data
      let user: User;
      if (data.user) {
        user = {
          id: data.user.id || 'unknown',
          email: data.user.email || credentials.email,
          first_name: data.user.first_name || '',
          last_name: data.user.last_name || '',
          phone: data.user.phone || '',
          city: data.user.city || '',
          state: data.user.state || '',
          role: data.user.role || 'customer',
          is_email_verified: data.user.is_email_verified || false,
          registration_stage: data.user.registration_stage || 0,
          role_display: data.user.role_display || 'Customer',
          is_admin: data.user.is_admin || false,
          is_mechanic: data.user.is_mechanic || false,
          is_garage_owner: data.user.is_garage_owner || false,
          is_customer: data.user.is_customer || true,
        };
      } else {
        // Fetch user profile if not included
        const userProfile = await authApi.getUserProfile(data.access);
        user = userProfile;
      }

      await storage.setUser(user);

      return {
        success: true,
        access: data.access,
        refresh: data.refresh,
        user: user,
        message: 'Login successful',
      };
    } catch (error: unknown) {
      logger.error('Login failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  },

  // ========== GET USER PROFILE ==========
  getUserProfile: async (token?: string): Promise<User> => {
    try {
      const headers: Record<string, string> = {
        ...(API_CONFIG.DEFAULT_HEADERS as Record<string, string>),
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        const storedToken = await storage.getAccessToken();
        if (storedToken) {
          headers['Authorization'] = `Bearer ${storedToken}`;
        }
      }

      const data = await createFetch<any>(
        '/api/auth/me/',  // Fixed: Direct endpoint
        { headers },
        !!headers['Authorization']
      );

      return {
        id: data.id || 'unknown',
        email: data.email || '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || '',
        city: data.city || '',
        state: data.state || '',
        role: data.role || 'customer',
        is_email_verified: data.is_email_verified || false,
        registration_stage: data.registration_stage || 0,
        role_display: data.role_display || 'Customer',
        is_admin: data.is_admin || false,
        is_mechanic: data.is_mechanic || false,
        is_garage_owner: data.is_garage_owner || false,
        is_customer: data.is_customer || true,
      };
    } catch (error) {
      logger.error('Failed to fetch user profile:', error);
      throw error;
    }
  },

  // ========== LOGOUT ==========
  logout: async (): Promise<ApiResponse> => {
    try {
      await createFetch(
        '/api/auth/logout/',  // Fixed: Direct endpoint
        { method: 'POST' },
        true
      );
    } catch (error) {
      // Continue even if logout API call fails
      logger.warn('Logout API call failed:', error);
    }

    // Always clear local storage
    await storage.clearAll();

    return {
      success: true,
      message: 'Logged out successfully',
    };
  },

  // ========== CHECK AUTH STATUS ==========
  checkAuth: async (): Promise<LoginResponse> => {
    try {
      const token = await storage.getAccessToken();
      const user = await storage.getUser();

      if (!token || !user) {
        return {
          success: false,
          error: 'Not authenticated',
        };
      }

      // Validate token by fetching fresh user data
      const freshUser = await authApi.getUserProfile(token);

      return {
        success: true,
        access: token,
        user: freshUser,
      };
    } catch (error) {
      logger.error('Auth check failed:', error);
      return {
        success: false,
        error: 'Session expired',
      };
    }
  },

  // ========== TEST CONNECTION ==========
  testConnection: async (): Promise<ApiResponse> => {
    try {
      await createFetch('/api/test/', { method: 'GET' });  // Fixed: Direct endpoint
      return {
        success: true,
        message: 'Backend connection successful',
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  },

  // ========== DEBUG INFO ==========
  getDebugInfo: async () => ({
    baseUrl: API_CONFIG.BASE_URL,
    hasAccessToken: !!(await storage.getAccessToken()),
    hasRefreshToken: !!(await storage.getRefreshToken()),
    hasUserData: !!(await storage.getUser()),
  }),
};

export default authApi;