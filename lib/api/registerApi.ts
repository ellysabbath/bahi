// api/registerApi.ts
import { API_CONFIG } from './_config';

export interface PersonalInfoData {
  first_name: string;
  last_name: string;
}

export interface ContactDetailsData {
  email: string;
  phone: string;
}

export interface LocationData {
  city: string;
  state: string;
  user_id?: string; // Added for session fallback
}

export interface SecurityData {
  password: string;
  confirm_password: string;
  user_id?: string; // Added for session fallback
}

export interface OTPData {
  otp: string;
  purpose: 'email_verification' | 'phone_verification';
  user_id?: string;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  requires_otp?: boolean;
  user_id?: string;
  tokens?: {
    access: string;
    refresh: string;
  };
  next_step?: string;
}

// Use the centralized config
const API_BASE_URL = API_CONFIG.BASE_URL;

console.log('📱 Using API URL:', API_BASE_URL);

// Session storage for user_id (fallback if cookies don't work)
let sessionUserId: string | null = null;

// Export as a named export (single object)
export const registerApi = {
  // Store user_id for session fallback
  setUserId: (userId: string) => {
    sessionUserId = userId;
    console.log('💾 Saved user_id in memory:', userId);
  },

  getUserId: (): string | null => {
    return sessionUserId;
  },

  // Clear session
  clearSession: () => {
    sessionUserId = null;
    console.log('🧹 Cleared session data');
  },

  submitPersonalInfo: async (data: PersonalInfoData): Promise<ApiResponse> => {
    try {
      const ENDPOINT = '/auth/stage1/personal-info/';
      const FULL_URL = `${API_BASE_URL}${ENDPOINT}`;
      
      console.log('📤 POST:', FULL_URL);
      console.log('📦 Data:', data);
      
      const response = await fetch(FULL_URL, {
        method: 'POST',
        headers: API_CONFIG.DEFAULT_HEADERS,
        body: JSON.stringify(data),
        credentials: 'include', // CRITICAL: For session cookies
      });

      console.log('📥 Status:', response.status);
      
      const responseData = await response.json();
      console.log('📥 Response:', responseData);
      
      if (!response.ok) {
        // Handle Django validation errors
        if (responseData.first_name) {
          throw new Error(Array.isArray(responseData.first_name) ? responseData.first_name[0] : responseData.first_name);
        }
        if (responseData.last_name) {
          throw new Error(Array.isArray(responseData.last_name) ? responseData.last_name[0] : responseData.last_name);
        }
        if (responseData.error) {
          throw new Error(responseData.error);
        }
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(responseData)}`);
      }

      return {
        success: true,
        ...responseData,
      };
    } catch (error: any) {
      console.error('❌ Personal Info API Error:', error);
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  },

  submitContactDetails: async (data: ContactDetailsData): Promise<ApiResponse> => {
    try {
      const ENDPOINT = '/auth/stage2/contact-details/';
      const FULL_URL = `${API_BASE_URL}${ENDPOINT}`;
      
      console.log('📤 POST Contact Details:', FULL_URL);
      console.log('📦 Data:', data);
      
      const response = await fetch(FULL_URL, {
        method: 'POST',
        headers: API_CONFIG.DEFAULT_HEADERS,
        body: JSON.stringify(data),
        credentials: 'include', // CRITICAL: For session cookies
      });

      console.log('📥 Status:', response.status);
      
      const responseData = await response.json();
      console.log('📥 Response:', responseData);
      
      if (!response.ok) {
        // Handle Django validation errors
        if (responseData.email) {
          if (typeof responseData.email === 'string') {
            throw new Error(responseData.email);
          } else if (Array.isArray(responseData.email)) {
            throw new Error(responseData.email[0]);
          }
        }
        if (responseData.phone) {
          if (typeof responseData.phone === 'string') {
            throw new Error(responseData.phone);
          } else if (Array.isArray(responseData.phone)) {
            throw new Error(responseData.phone[0]);
          }
        }
        if (responseData.error) {
          throw new Error(responseData.error);
        }
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(responseData)}`);
      }

      // Save user_id from response for session fallback
      if (responseData.user_id) {
        registerApi.setUserId(responseData.user_id);
      }

      return {
        success: true,
        ...responseData,
      };
    } catch (error: any) {
      console.error('❌ Contact Details API Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to save contact details',
      };
    }
  },

  submitLocation: async (data: LocationData): Promise<ApiResponse> => {
    try {
      const ENDPOINT = '/auth/stage3/location/';
      const FULL_URL = `${API_BASE_URL}${ENDPOINT}`;
      
      // Prepare request data with user_id if available
      const requestData: any = {
        city: data.city,
        state: data.state,
      };
      
      // Add user_id to request body as fallback if session doesn't work
      if (data.user_id) {
        requestData.user_id = data.user_id;
        console.log('👤 Adding user_id to request body:', data.user_id);
      } else if (sessionUserId) {
        requestData.user_id = sessionUserId;
        console.log('👤 Using session user_id:', sessionUserId);
      }
      
      console.log('📤 POST Location:', FULL_URL);
      console.log('📦 Request Data:', requestData);
      
      const response = await fetch(FULL_URL, {
        method: 'POST',
        headers: API_CONFIG.DEFAULT_HEADERS,
        body: JSON.stringify(requestData),
        credentials: 'include', // CRITICAL: For session cookies
      });

      console.log('📥 Status:', response.status);
      
      const responseData = await response.json();
      console.log('📥 Response:', responseData);
      
      if (!response.ok) {
        if (responseData.city) {
          throw new Error(Array.isArray(responseData.city) ? responseData.city[0] : responseData.city);
        }
        if (responseData.state) {
          throw new Error(Array.isArray(responseData.state) ? responseData.state[0] : responseData.state);
        }
        if (responseData.error) {
          throw new Error(responseData.error);
        }
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(responseData)}`);
      }

      return {
        success: true,
        ...responseData,
      };
    } catch (error: any) {
      console.error('❌ Location API Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to save location',
      };
    }
  },

  submitSecurity: async (data: SecurityData): Promise<ApiResponse> => {
    try {
      const ENDPOINT = '/auth/stage4/security/';
      const FULL_URL = `${API_BASE_URL}${ENDPOINT}`;
      
      // Prepare request data with user_id if available
      const requestData: any = {
        password: data.password,
        confirm_password: data.confirm_password,
      };
      
      // Add user_id to request body as fallback if session doesn't work
      if (data.user_id) {
        requestData.user_id = data.user_id;
        console.log('👤 Adding user_id to security request:', data.user_id);
      } else if (sessionUserId) {
        requestData.user_id = sessionUserId;
        console.log('👤 Using session user_id for security:', sessionUserId);
      }
      
      console.log('📤 POST Security:', FULL_URL);
      console.log('📦 Request Data (password hidden)');
      
      const response = await fetch(FULL_URL, {
        method: 'POST',
        headers: API_CONFIG.DEFAULT_HEADERS,
        body: JSON.stringify(requestData),
        credentials: 'include', // CRITICAL: For session cookies
      });

      console.log('📥 Status:', response.status);
      
      const responseData = await response.json();
      console.log('📥 Response:', responseData);
      
      if (!response.ok) {
        if (responseData.password) {
          throw new Error(Array.isArray(responseData.password) ? responseData.password[0] : responseData.password);
        }
        if (responseData.confirm_password) {
          throw new Error(Array.isArray(responseData.confirm_password) ? responseData.confirm_password[0] : responseData.confirm_password);
        }
        if (responseData.non_field_errors) {
          throw new Error(Array.isArray(responseData.non_field_errors) ? responseData.non_field_errors[0] : responseData.non_field_errors);
        }
        if (responseData.error) {
          throw new Error(responseData.error);
        }
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(responseData)}`);
      }

      // Clear session after successful security submission
      registerApi.clearSession();

      return {
        success: true,
        ...responseData,
      };
    } catch (error: any) {
      console.error('❌ Security API Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to set password',
      };
    }
  },

  verifyOTP: async (data: OTPData): Promise<ApiResponse> => {
    try {
      const ENDPOINT = '/auth/verify-otp/';
      const FULL_URL = `${API_BASE_URL}${ENDPOINT}`;
      
      // Prepare request data
      const requestData: any = {
        otp: data.otp,
        purpose: data.purpose,
      };
      
      // Add user_id if provided
      if (data.user_id) {
        requestData.user_id = data.user_id;
        console.log('👤 Adding user_id to OTP verification:', data.user_id);
      } else if (sessionUserId) {
        requestData.user_id = sessionUserId;
        console.log('👤 Using session user_id for OTP:', sessionUserId);
      }
      
      console.log('📤 POST OTP Verification:', FULL_URL);
      console.log('📦 Data (OTP hidden)');
      
      const response = await fetch(FULL_URL, {
        method: 'POST',
        headers: API_CONFIG.DEFAULT_HEADERS,
        body: JSON.stringify(requestData),
        credentials: 'include', // CRITICAL: For session cookies
      });

      console.log('📥 Status:', response.status);
      
      const responseData = await response.json();
      console.log('📥 Response:', responseData);
      
      if (!response.ok) {
        if (responseData.otp) {
          throw new Error(Array.isArray(responseData.otp) ? responseData.otp[0] : responseData.otp);
        }
        if (responseData.purpose) {
          throw new Error(Array.isArray(responseData.purpose) ? responseData.purpose[0] : responseData.purpose);
        }
        if (responseData.error) {
          throw new Error(responseData.error);
        }
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(responseData)}`);
      }

      return {
        success: true,
        ...responseData,
      };
    } catch (error: any) {
      console.error('❌ OTP Verification API Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to verify OTP',
      };
    }
  },

  testBackend: async (): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/test/`, {
        headers: API_CONFIG.DEFAULT_HEADERS,
        credentials: 'include', // Include for consistency
      });
      const data = await response.json();
      console.log('✅ Backend test response:', data);
      return {
        success: response.ok,
        data,
      };
    } catch (error: any) {
      console.error('❌ Backend test error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Helper to check session status
  checkSession: async (): Promise<boolean> => {
    try {
      // Try to access a protected endpoint or test with current session
      const response = await fetch(`${API_BASE_URL}/test/`, {
        headers: API_CONFIG.DEFAULT_HEADERS,
        credentials: 'include',
      });
      return response.ok;
    } catch (error) {
      console.error('❌ Session check error:', error);
      return false;
    }
  },

  // Helper to resend OTP
  resendOTP: async (purpose: string, user_id?: string): Promise<ApiResponse> => {
    try {
      const ENDPOINT = '/auth/resend-otp/'; // You'll need to create this endpoint
      const FULL_URL = `${API_BASE_URL}${ENDPOINT}`;
      
      const requestData: any = { purpose };
      if (user_id) requestData.user_id = user_id;
      else if (sessionUserId) requestData.user_id = sessionUserId;
      
      const response = await fetch(FULL_URL, {
        method: 'POST',
        headers: API_CONFIG.DEFAULT_HEADERS,
        body: JSON.stringify(requestData),
        credentials: 'include',
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || `Failed to resend OTP`);
      }
      
      return {
        success: true,
        ...responseData,
      };
    } catch (error: any) {
      console.error('❌ Resend OTP Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to resend OTP',
      };
    }
  },
};

// Also export as default for convenience
export default registerApi;