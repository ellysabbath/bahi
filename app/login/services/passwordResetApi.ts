// services/passwordResetApi.ts
import axios from 'axios';

// Use your computer's IP address or localhost
const API_BASE_URL = 'https://AutoFix.pythonanywhere.com/'; // Update with your IP

// Create axios instance with proper configuration
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add request interceptor for debugging
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

// Add response interceptor for debugging
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} from ${response.config.url}`);
    console.log('📦 Response:', response.data);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    return Promise.reject(error);
  }
);

export interface PasswordStrength {
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export interface APIResponse {
  success: boolean;
  message: string;
  reset_token?: string;
  otp_expires_in?: number;
  next_step?: string;
  debug_otp?: string;
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
   * Test API connection
   */
  async testConnection(): Promise<APIResponse> {
    try {
      console.log('🔗 Testing API connection...');
      const response = await axiosInstance.get('test/');
      return {
        success: true,
        message: 'API is reachable',
        ...response.data,
      };
    } catch (error: any) {
      console.error('Connection test failed:', error.message);
      return {
        success: false,
        message: `Cannot connect to server: ${error.message}`,
      };
    }
  }

  /**
   * Request password reset OTP
   */
  async requestPasswordReset(email: string): Promise<APIResponse> {
    try {
      console.log('📧 Requesting password reset for:', email);
      
      const response = await axiosInstance.post(
        'auth/password-reset/request/',
        { email }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Password reset request failed:', error.message);
      
      // Return user-friendly error message
      if (error.response?.status === 404) {
        return {
          success: false,
          message: 'Password reset endpoint not found. Please check server configuration.',
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.error || `Failed to send OTP: ${error.message}`,
      };
    }
  }

  /**
   * Verify password reset OTP
   */
  async verifyOTP(resetToken: string, otp: string): Promise<APIResponse> {
    try {
      console.log('🔐 Verifying OTP with token:', resetToken.substring(0, 10) + '...');
      
      const response = await axiosInstance.post(
        'auth/password-reset/verify-otp/',
        { reset_token: resetToken, otp }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('OTP verification failed:', error.message);
      
      return {
        success: false,
        message: error.response?.data?.error || `Failed to verify OTP: ${error.message}`,
      };
    }
  }

  /**
   * Complete password reset
   */
  async resetPassword(
    resetToken: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<APIResponse> {
    try {
      console.log('🔄 Completing password reset...');
      
      const response = await axiosInstance.post(
        'auth/password-reset/complete/',
        {
          reset_token: resetToken,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Password reset failed:', error.message);
      
      return {
        success: false,
        message: error.response?.data?.error || `Failed to reset password: ${error.message}`,
      };
    }
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): PasswordStrength {
    return {
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
  }

  /**
   * Calculate password strength score
   */
  calculatePasswordStrength(requirements: PasswordStrength): number {
    return Object.values(requirements).filter(Boolean).length;
  }

  /**
   * Get password strength text
   */
  getPasswordStrengthText(score: number): string {
    if (score <= 1) return 'Very Weak';
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Strong';
    return 'Very Strong';
  }

  /**
   * Get password strength color
   */
  getPasswordStrengthColor(score: number): string {
    if (score <= 1) return '#EF4444';
    if (score <= 3) return '#F59E0B';
    return '#10B981';
  }

  /**
   * Check if OTP is valid format
   */
  isValidOTP(otp: string): boolean {
    return /^\d{6}$/.test(otp);
  }
}

// Export singleton instance
export const passwordResetAPI = PasswordResetAPI.getInstance();
export default passwordResetAPI;