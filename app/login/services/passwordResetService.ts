// services/passwordResetService.ts
import passwordResetAPI, { APIResponse } from './passwordResetApi';

class PasswordResetService {
  private email: string = '';
  private otp: string = '';

  /**
   * Request password reset OTP via email
   */
  async requestOTP(email: string): Promise<APIResponse> {
    if (!email.trim()) {
      return { success: false, message: 'Email address is required' };
    }

    if (!passwordResetAPI.isValidEmail(email)) {
      return { success: false, message: 'Please enter a valid email address' };
    }

    this.email = email.toLowerCase().trim();
    return await passwordResetAPI.requestPasswordReset(this.email);
  }

  /**
   * Verify OTP
   */
  async verifyOTP(otp: string): Promise<APIResponse> {
    if (!this.email) {
      return { success: false, message: 'Email address is required' };
    }

    if (!passwordResetAPI.isValidOTP(otp)) {
      return { success: false, message: 'Please enter a valid 6-digit OTP' };
    }

    this.otp = otp;
    return await passwordResetAPI.verifyOTP(this.email, otp);
  }

  /**
   * Reset password
   */
  async resetPassword(password: string, confirmPassword: string): Promise<APIResponse> {
    if (!this.email) {
      return { success: false, message: 'Email address is required' };
    }

    if (!this.otp) {
      return { success: false, message: 'OTP is required' };
    }

    if (password !== confirmPassword) {
      return { success: false, message: 'Passwords do not match' };
    }

    if (!passwordResetAPI.isValidPassword(password)) {
      return { success: false, message: 'Password must be at least 8 characters long' };
    }

    return await passwordResetAPI.resetPassword(this.email, this.otp, password);
  }

  /**
   * Get stored email
   */
  getEmail(): string {
    return this.email;
  }

  /**
   * Set email
   */
  setEmail(email: string) {
    this.email = email.toLowerCase().trim();
  }

  /**
   * Clear stored data
   */
  clear() {
    this.email = '';
    this.otp = '';
  }
}

export const passwordResetService = new PasswordResetService();
export default passwordResetService;