// services/passwordResetService.ts
import passwordResetAPI, { APIResponse, PasswordStrength } from './passwordResetApi';

export interface ResetState {
  email: string;
  otp: string;
  resetToken: string | null;
  password: string;
  confirmPassword: string;
  isLoading: boolean;
  otpSent: boolean;
  otpVerified: boolean;
  passwordReset: boolean;
  error: string | null;
  passwordStrength: PasswordStrength;
  countdown: number;
}

class PasswordResetService {
  private state: ResetState = {
    email: '',
    otp: '',
    resetToken: null,
    password: '',
    confirmPassword: '',
    isLoading: false,
    otpSent: false,
    otpVerified: false,
    passwordReset: false,
    error: null,
    passwordStrength: {
      hasMinLength: false,
      hasUpperCase: false,
      hasLowerCase: false,
      hasNumber: false,
      hasSpecialChar: false,
    },
    countdown: 0,
  };

  private listeners: ((state: ResetState) => void)[] = [];
  private countdownInterval: NodeJS.Timeout | null = null;

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: ResetState) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private notify() {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  /**
   * Get current state
   */
  getState(): ResetState {
    return { ...this.state };
  }

  /**
   * Request OTP for password reset
   */
  async requestOTP(email: string): Promise<APIResponse> {
    // Validate email
    if (!email.trim()) {
      this.setState({ error: 'Email is required' });
      return { success: false, message: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.setState({ error: 'Please enter a valid email address' });
      return { success: false, message: 'Invalid email format' };
    }

    this.setState({ 
      email, 
      isLoading: true, 
      error: null,
      otpSent: false,
      otpVerified: false,
      resetToken: null,
    });

    try {
      const response = await passwordResetAPI.requestPasswordReset(email);
      
      if (response.success && response.reset_token) {
        this.setState({
          isLoading: false,
          otpSent: true,
          resetToken: response.reset_token,
          error: null,
        });

        // Start countdown (15 minutes)
        this.startCountdown(response.otp_expires_in || 900);
      } else {
        this.setState({
          isLoading: false,
          error: response.message || 'Failed to send OTP',
        });
      }

      return response;
    } catch (error: any) {
      this.setState({
        isLoading: false,
        error: 'Network error. Please check your connection.',
      });
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(otp: string): Promise<APIResponse> {
    if (!this.state.resetToken) {
      this.setState({ error: 'Reset session expired. Please start over.' });
      return { success: false, message: 'Reset session expired' };
    }

    if (!passwordResetAPI.isValidOTP(otp)) {
      this.setState({ error: 'Please enter a valid 6-digit OTP' });
      return { success: false, message: 'Invalid OTP format' };
    }

    this.setState({ 
      otp, 
      isLoading: true, 
      error: null 
    });

    try {
      const response = await passwordResetAPI.verifyOTP(this.state.resetToken, otp);
      
      if (response.success) {
        this.setState({
          isLoading: false,
          otpVerified: true,
          error: null,
        });
      } else {
        this.setState({
          isLoading: false,
          error: response.message || 'Invalid OTP',
        });
      }

      return response;
    } catch (error: any) {
      this.setState({
        isLoading: false,
        error: 'Failed to verify OTP. Please try again.',
      });
      return {
        success: false,
        message: 'Failed to verify OTP',
      };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(password: string, confirmPassword: string): Promise<APIResponse> {
    if (!this.state.resetToken) {
      this.setState({ error: 'Reset session expired. Please start over.' });
      return { success: false, message: 'Reset session expired' };
    }

    if (password !== confirmPassword) {
      this.setState({ error: 'Passwords do not match' });
      return { success: false, message: 'Passwords do not match' };
    }

    const strength = passwordResetAPI.validatePasswordStrength(password);
    const score = passwordResetAPI.calculatePasswordStrength(strength);
    
    if (score < 3) {
      this.setState({ 
        error: 'Password is too weak. Please choose a stronger password.',
        passwordStrength: strength,
      });
      return { 
        success: false, 
        message: 'Password is too weak. Please include uppercase, lowercase, numbers, and special characters.' 
      };
    }

    this.setState({ 
      password, 
      confirmPassword, 
      isLoading: true, 
      error: null,
      passwordStrength: strength,
    });

    try {
      const response = await passwordResetAPI.resetPassword(
        this.state.resetToken,
        password,
        confirmPassword
      );
      
      if (response.success) {
        this.setState({
          isLoading: false,
          passwordReset: true,
          error: null,
        });
        
        this.stopCountdown();
      } else {
        this.setState({
          isLoading: false,
          error: response.message,
        });
      }

      return response;
    } catch (error: any) {
      this.setState({
        isLoading: false,
        error: 'Failed to reset password. Please try again.',
      });
      return {
        success: false,
        message: 'Failed to reset password',
      };
    }
  }

  /**
   * Resend OTP
   */
  async resendOTP(): Promise<APIResponse> {
    if (!this.state.email) {
      return { success: false, message: 'Email is required' };
    }

    return this.requestOTP(this.state.email);
  }

  /**
   * Update password and validate strength
   */
  updatePassword(password: string) {
    const strength = passwordResetAPI.validatePasswordStrength(password);
    this.setState({ 
      password, 
      passwordStrength: strength,
      error: null,
    });
  }

  /**
   * Update confirm password
   */
  updateConfirmPassword(confirmPassword: string) {
    this.setState({ 
      confirmPassword,
      error: null,
    });
  }

  /**
   * Update OTP
   */
  updateOTP(otp: string) {
    this.setState({ 
      otp,
      error: null,
    });
  }

  /**
   * Start countdown timer
   */
  private startCountdown(seconds: number) {
    this.stopCountdown();
    
    this.setState({ countdown: seconds });
    
    this.countdownInterval = setInterval(() => {
      this.setState(prev => {
        const newCountdown = prev.countdown - 1;
        if (newCountdown <= 0) {
          this.stopCountdown();
          return { ...prev, countdown: 0 };
        }
        return { ...prev, countdown: newCountdown };
      });
    }, 1000);
  }

  /**
   * Stop countdown timer
   */
  private stopCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  /**
   * Get formatted countdown (MM:SS)
   */
  getFormattedCountdown(): string {
    const minutes = Math.floor(this.state.countdown / 60);
    const seconds = this.state.countdown % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Reset service state
   */
  reset() {
    this.stopCountdown();
    this.state = {
      email: '',
      otp: '',
      resetToken: null,
      password: '',
      confirmPassword: '',
      isLoading: false,
      otpSent: false,
      otpVerified: false,
      passwordReset: false,
      error: null,
      passwordStrength: {
        hasMinLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false,
      },
      countdown: 0,
    };
    this.notify();
  }

  /**
   * Set state and notify listeners
   */
  private setState(updates: Partial<ResetState>) {
    this.state = { ...this.state, ...updates };
    this.notify();
  }
}

// Export singleton instance
export const passwordResetService = new PasswordResetService();
export default passwordResetService;