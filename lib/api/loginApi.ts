// lib/api/authApi.ts
import { API_CONFIG } from './_config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../context/UserContext';

// ==================== INTERFACES ====================
export interface LoginData {
  mobile_number: string;
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

export interface AuthStatusResponse {
  success: boolean;
  is_authenticated?: boolean;
  should_redirect_to_dashboard?: boolean;
  error?: string;
  user?: User;
  access?: string;
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
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
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
  
  // Create timeout promise
  const createTimeoutPromise = (timeout: number): Promise<never> => {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Request timeout after ${timeout}ms`)), timeout);
    });
  };

  try {
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
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

    // Create fetch promise
    const fetchPromise = fetch(url, {
      ...options,
      headers,
      method: options.method || 'GET',
    });

    // Race between fetch and timeout
    const response = await Promise.race([
      fetchPromise,
      createTimeoutPromise(API_CONFIG.TIMEOUT)
    ]) as Response;

    return handleResponse<T>(response);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error('Request timeout. Please check your connection.');
      }
      if (error.message.includes('Network request failed')) {
        throw new Error('Network request failed. Please check your internet connection.');
      }
    }
    
    logger.error('Network error:', error);
    throw new Error('Network error occurred');
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
      '/api/auth/token/refresh/',
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

// ==================== UTILITY FUNCTIONS ====================
const normalizeMobileNumber = (mobileNumber: string): string => {
  if (!mobileNumber || typeof mobileNumber !== 'string') {
    throw new Error('Mobile number is required');
  }
  
  // Remove any non-digit characters
  const cleaned = mobileNumber.replace(/\D/g, '');
  
  // Validate we have something
  if (cleaned.length === 0) {
    throw new Error('Please enter a valid mobile number');
  }
  
  // Convert to Django expected format: 255XXXXXXXXX
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '255' + cleaned.substring(1);
  } else if (cleaned.length === 9) {
    return '255' + cleaned;
  } else if (cleaned.startsWith('255') && cleaned.length === 12) {
    return cleaned; // Already in correct format
  }
  
  // If we get here, return as is and let backend validate
  return cleaned;
};

// ==================== HELPER TO MAP BACKEND USER TO FRONTEND USER ====================
const mapBackendUserToFrontendUser = (backendUser: any): User => {
  // Ensure all fields from CustomUser model are included
  return {
    id: String(backendUser.id || 'unknown'),
    mobile_number: backendUser.mobile_number || null,
    email: backendUser.email || null,
    fullname: backendUser.fullname || '',
    membership_number: backendUser.membership_number || null,
    is_active: backendUser.is_active !== undefined ? backendUser.is_active : true,
    is_staff: backendUser.is_staff !== undefined ? backendUser.is_staff : false,
    is_verified: backendUser.is_verified !== undefined ? backendUser.is_verified : false,
    region: backendUser.region || null,
    district: backendUser.district || null,
    date_joined: backendUser.date_joined || new Date().toISOString(),
    last_login: backendUser.last_login || null,
    updated_at: backendUser.updated_at || new Date().toISOString(),
  };
};

// ==================== API FUNCTIONS ====================
export const authApi = {
  // ========== LOGIN ==========
  login: async (credentials: LoginData): Promise<LoginResponse> => {
    try {
      logger.info('Attempting login...');

      // Validate credentials
      if (!credentials.mobile_number || !credentials.password) {
        throw new Error('Mobile number and password are required');
      }

      // Normalize mobile number
      const mobileNumber = normalizeMobileNumber(credentials.mobile_number);

      // Call Django login endpoint
      const data = await createFetch<{
        access: string;
        refresh: string;
        user?: any;
        message?: string;
      }>(
        '/api/auth/login/',
        {
          method: 'POST',
          body: JSON.stringify({
            mobile_number: mobileNumber,
            password: credentials.password,
          }),
        }
      );

      // Validate response
      if (!data.access || !data.refresh) {
        throw new Error('Invalid response from server');
      }

      // Store tokens
      await storage.setTokens(data.access, data.refresh);

      // Process user data - include ALL fields from CustomUser model
      let user: User;
      if (data.user) {
        user = mapBackendUserToFrontendUser(data.user);
      } else {
        // If user data not included, create minimal user object with all required fields
        user = {
          id: 'unknown',
          mobile_number: mobileNumber,
          email: null,
          fullname: 'User',
          membership_number: null,
          is_active: true,
          is_staff: false,
          is_verified: false,
          region: null,
          district: null,
          date_joined: new Date().toISOString(),
          last_login: null,
          updated_at: new Date().toISOString(),
        };
      }

      // Store user data
      await storage.setUser(user);

      return {
        success: true,
        access: data.access,
        refresh: data.refresh,
        user: user,
        message: data.message || 'Login successful',
      };
    } catch (error: unknown) {
      logger.error('Login failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  },

  // ========== CHECK AUTH STATUS ==========
  checkAuthStatus: async (): Promise<AuthStatusResponse> => {
    try {
      // Get all data from storage
      const [token, refreshTokenValue, storedUser] = await Promise.all([
        storage.getAccessToken(),
        storage.getRefreshToken(),
        storage.getUser(),
      ]);

      // Check if we have all required data
      if (!token || !refreshTokenValue || !storedUser) {
        return {
          success: false,
          is_authenticated: false,
          should_redirect_to_dashboard: false,
          error: 'No authentication data found',
        };
      }

      // Try to validate the token with a simple request
      try {
        // Use a simple endpoint to validate token
        await createFetch(
          '/api/auth/check-status/',
          { method: 'GET' },
          true
        );

        // Token is valid
        return {
          success: true,
          is_authenticated: true,
          should_redirect_to_dashboard: true,
          user: storedUser,
          access: token,
        };
      } catch (error) {
        logger.warn('Token validation failed:', error);
        
        // Try to refresh token
        const refreshed = await refreshToken();
        if (refreshed) {
          const newToken = await storage.getAccessToken();
          return {
            success: true,
            is_authenticated: true,
            should_redirect_to_dashboard: true,
            user: storedUser,
            access: newToken || token,
          };
        }
        
        // Clear invalid data
        await storage.clearAll();
        return {
          success: false,
          is_authenticated: false,
          should_redirect_to_dashboard: false,
          error: 'Session expired',
        };
      }
    } catch (error: unknown) {
      logger.error('Auth status check failed:', error);
      return {
        success: false,
        is_authenticated: false,
        should_redirect_to_dashboard: false,
        error: error instanceof Error ? error.message : 'Authentication check failed',
      };
    }
  },

  // ========== GET USER PROFILE ==========
  getUserProfile: async (token?: string): Promise<User> => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      // Use provided token or get from storage
      let authToken = token;
      if (!authToken) {
        authToken = await storage.getAccessToken();
      }

      if (!authToken) {
        throw new Error('No authentication token available');
      }

      headers['Authorization'] = `Bearer ${authToken}`;

      // Try different endpoints
      const endpoints = [
        '/api/auth/me/',
        '/api/auth/user/profile/',
        '/api/users/profile/',
        '/api/auth/user/',  // Additional endpoint
      ];

      let lastError: Error | null = null;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
            method: 'GET',
            headers,
          });

          if (response.ok) {
            const data = await response.json();
            const userData = data.user || data;
            
            // Map ALL fields from CustomUser model
            return mapBackendUserToFrontendUser(userData);
          }
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Profile fetch failed');
        }
      }

      throw lastError || new Error('Could not fetch user profile');
    } catch (error) {
      logger.error('Failed to fetch user profile:', error);
      throw error;
    }
  },

  // ========== UPDATE USER PROFILE ==========
  updateUserProfile: async (userData: Partial<User>): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const response = await createFetch<{ user: any; message?: string }>(
        '/api/auth/user/profile/',
        {
          method: 'PUT',
          body: JSON.stringify(userData),
        },
        true
      );

      if (response.user) {
        const updatedUser = mapBackendUserToFrontendUser(response.user);
        await storage.setUser(updatedUser);
        
        return {
          success: true,
          user: updatedUser,
          message: response.message || 'Profile updated successfully',
        };
      }

      throw new Error('No user data in response');
    } catch (error: unknown) {
      logger.error('Profile update failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Profile update failed',
      };
    }
  },

  // ========== LOGOUT ==========
  logout: async (): Promise<ApiResponse> => {
    try {
      await createFetch(
        '/api/auth/logout/',
        { method: 'POST' },
        true
      );
    } catch (error) {
      // Log but continue
      logger.warn('Logout API call failed:', error);
    }

    // Always clear local storage
    await storage.clearAll();

    return {
      success: true,
      message: 'Logged out successfully',
    };
  },

  // ========== CHECK AUTH (Legacy) ==========
  checkAuth: async (): Promise<LoginResponse> => {
    try {
      const status = await authApi.checkAuthStatus();
      
      if (status.success && status.is_authenticated && status.user) {
        return {
          success: true,
          access: status.access || '',
          user: status.user,
        };
      }
      
      return {
        success: false,
        error: status.error || 'Not authenticated',
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
      await createFetch('/api/test/', { method: 'GET' });
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