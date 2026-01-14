// services/passwordResetApi.ts
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
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
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
  verified?: boolean;
  email?: string;
  email_sent?: boolean;
  error?: string;
}

class PasswordResetAPI {
  private static instance: PasswordResetAPI;

  static getInstance(): PasswordResetAPI {
    if (!PasswordResetAPI.instance) {
      PasswordResetAPI.instance = new PasswordResetAPI();
    }
    return PasswordResetAPI.instance;
  }

  /**
   * Request password reset OTP via email
   */
  async requestPasswordReset(email: string): Promise<APIResponse> {
    try {
      console.log('📧 Requesting password reset for:', email);
      
      const response = await axiosInstance.post('/password-reset/request/', {
        email: email.toLowerCase().trim()
      });
      
      return {
        success: true,
        message: response.data.message || 'OTP sent successfully',
        email: response.data.email,
        email_sent: response.data.email_sent,
        ...response.data,
      };
    } catch (error: any) {
      console.error('Password reset request failed:', error.response?.data || error.message);
      
      const errorMessage = error.response?.data?.error || 
                         error.response?.data?.email?.[0] || 
                         error.message;
      
      return {
        success: false,
        message: errorMessage || 'Failed to send OTP',
      };
    }
  }

  /**
   * Verify password reset OTP
   */
  async verifyOTP(email: string, otp: string): Promise<APIResponse> {
    try {
      console.log('🔐 Verifying OTP for:', email);
      
      const response = await axiosInstance.post('/password-reset/verify-otp/', {
        email: email.toLowerCase().trim(),
        otp
      });
      
      return {
        success: true,
        message: response.data.message || 'OTP verified',
        verified: response.data.verified,
        email: response.data.email,
        ...response.data,
      };
    } catch (error: any) {
      console.error('OTP verification failed:', error.response?.data || error.message);
      
      const errorMessage = error.response?.data?.error || 
                         error.response?.data?.otp?.[0] || 
                         error.message;
      
      return {
        success: false,
        message: errorMessage || 'Failed to verify OTP',
      };
    }
  }

  /**
   * Complete password reset
   */
  async resetPassword(email: string, otp: string, newPassword: string): Promise<APIResponse> {
    try {
      console.log('🔄 Completing password reset...');
      
      const response = await axiosInstance.post('/password-reset/confirm/', {
        email: email.toLowerCase().trim(),
        otp,
        new_password: newPassword,
      });
      
      return {
        success: true,
        message: response.data.message || 'Password reset successfully',
        ...response.data,
      };
    } catch (error: any) {
      console.error('Password reset failed:', error.response?.data || error.message);
      
      const errorMessage = error.response?.data?.error || 
                         error.response?.data?.new_password?.[0] || 
                         error.message;
      
      return {
        success: false,
        message: errorMessage || 'Failed to reset password',
      };
    }
  }

  /**
   * Validate email address
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.toLowerCase().trim());
  }

  /**
   * Check if OTP is valid format
   */
  isValidOTP(otp: string): boolean {
    return /^\d{6}$/.test(otp);
  }

  /**
   * Check if password meets minimum requirements (8+ characters)
   */
  isValidPassword(password: string): boolean {
    return password.length >= 8;
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

export const passwordResetAPI = PasswordResetAPI.getInstance();
export default passwordResetAPI;