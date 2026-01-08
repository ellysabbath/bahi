// app/api/profileApi.ts
import axiosInstance from './axiosInstance';

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  city?: string;
  state?: string;
}

export const profileApi = {
  updateProfile: async (data: UpdateProfileData) => {
    try {
      const response = await axiosInstance.put('/auth/profile/', data);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  getProfile: async () => {
    try {
      const response = await axiosInstance.get('/auth/profile/');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },
};