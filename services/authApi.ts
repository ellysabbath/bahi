// services/authApi.ts
import axios from 'axios';

const API_BASE_URL = 'http://192.168.137.1:8000/api/auth';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
    if (config.data) {
      console.log('📦 Request data:', config.data);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} from ${response.config.url}`);
    console.log('📦 Response:', response.data);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export interface APIResponse {
  success?: boolean;
  message: string;
  user_id?: number;
  mobile_number?: string;
  email?: string;
  sms_sent?: boolean;
  email_sent?: boolean;
  access_token?: string;
  refresh_token?: string;
  user?: any;
  error?: string;
}

export interface RegistrationData {
  mobile_number: string;
  email: string;
  fullname: string;
  membership_number: string;
  password: string;
  confirm_password: string;
  region: string;
  district: string;
}

class AuthAPI {
  private static instance: AuthAPI;

  static getInstance(): AuthAPI {
    if (!AuthAPI.instance) {
      AuthAPI.instance = new AuthAPI();
    }
    return AuthAPI.instance;
  }

  /**
   * Register new user
   */
  async registerUser(data: RegistrationData): Promise<APIResponse> {
    try {
      console.log('👤 Registering user...');
      
      // Format mobile number to 255 format
      const formattedData = {
        ...data,
        mobile_number: this.normalizePhoneNumber(data.mobile_number),
        email: data.email.toLowerCase().trim()
      };
      
      const response = await axiosInstance.post('/register/', formattedData);
      
      return {
        success: true,
        message: response.data.message || 'Registration successful',
        user_id: response.data.user_id,
        mobile_number: response.data.mobile_number,
        email: response.data.email,
        sms_sent: response.data.sms_sent,
        email_sent: response.data.email_sent,
        ...response.data,
      };
    } catch (error: any) {
      console.error('Registration failed:', error.response?.data || error.message);
      
      const errorData = error.response?.data || {};
      let errorMessage = 'Registration failed';
      
      // Extract first error message
      if (errorData) {
        const errors = Object.values(errorData).flat();
        if (errors.length > 0) {
          errorMessage = Array.isArray(errors[0]) ? errors[0][0] : errors[0];
        }
      }
      
      return {
        success: false,
        message: errorMessage,
        error: errorMessage,
      };
    }
  }

  /**
   * Verify account with OTP
   */
  async verifyAccount(mobileNumber: string, otp: string): Promise<APIResponse> {
    try {
      console.log('🔐 Verifying account...');
      
      const normalizedPhone = this.normalizePhoneNumber(mobileNumber);
      
      const response = await axiosInstance.post('/verify-account/', {
        mobile_number: normalizedPhone,
        otp
      });
      
      return {
        success: true,
        message: response.data.message || 'Account verified successfully',
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        user: response.data.user,
        ...response.data,
      };
    } catch (error: any) {
      console.error('Verification failed:', error.response?.data || error.message);
      
      const errorMessage = error.response?.data?.error || 
                         error.response?.data?.message || 
                         'Verification failed';
      
      return {
        success: false,
        message: errorMessage,
        error: errorMessage,
      };
    }
  }

  /**
   * Normalize Tanzanian phone number to 255 format
   */
  normalizePhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      return '255' + cleaned.substring(1);
    } else if (cleaned.length === 9) {
      return '255' + cleaned;
    } else if (cleaned.startsWith('255') && cleaned.length === 12) {
      return cleaned;
    } else if (cleaned.startsWith('+255') && cleaned.length === 13) {
      return cleaned.substring(1);
    }
    
    return cleaned;
  }

  /**
   * Validate Tanzanian phone number
   */
  isValidTanzanianPhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    
    // Tanzanian numbers start with 2557, 07, or 7
    if (cleaned.startsWith('2557') && cleaned.length === 12) {
      return true;
    } else if (cleaned.startsWith('07') && cleaned.length === 10) {
      return true;
    } else if (cleaned.startsWith('7') && cleaned.length === 9) {
      return true;
    }
    
    return false;
  }

  /**
   * Validate email address
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.toLowerCase().trim());
  }

  /**
   * Validate password strength (min 8 chars)
   */
  isValidPassword(password: string): boolean {
    return password.length >= 8;
  }

  /**
   * Format phone number for display
   */
  formatPhoneForDisplay(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('255') && cleaned.length === 12) {
      const localPart = cleaned.substring(3);
      return `0${localPart.substring(0,3)} ${localPart.substring(3,6)} ${localPart.substring(6)}`;
    }
    
    return phone;
  }

  /**
   * Format email for display
   */
  formatEmailForDisplay(email: string): string {
    if (!email) return '';
    
    const [localPart, domain] = email.toLowerCase().trim().split('@');
    if (localPart && domain) {
      if (localPart.length <= 3) {
        return `${localPart}@${domain}`;
      }
      return `${localPart.substring(0, 3)}***@${domain}`;
    }
    
    return email;
  }
}

export const authAPI = AuthAPI.getInstance();
export default authAPI;