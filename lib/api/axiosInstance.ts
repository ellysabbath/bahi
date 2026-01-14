// api/axiosInstance.ts
import axios from 'axios';
import { API_CONFIG } from './_config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...API_CONFIG.DEFAULT_HEADERS,
  },
  timeout: API_CONFIG.TIMEOUT,
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Get token from AsyncStorage using SAME key as authApi
    const token = await AsyncStorage.getItem('quickfix_access_token'); // Changed from 'access_token'
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem('quickfix_refresh_token'); // Changed from 'refresh_token'
        if (refreshToken) {
          // Try to refresh token
          const response = await axios.post(
            `${API_CONFIG.BASE_URL}/auth/token/refresh/`,
            { refresh: refreshToken }
          );
          
          const { access } = response.data;
          await AsyncStorage.setItem('quickfix_access_token', access); // Changed from 'access_token'
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch {
        // Refresh failed, clear all auth data
        await AsyncStorage.multiRemove([
          'quickfix_access_token',
          'quickfix_refresh_token',
          'quickfix_user_data',
          'access_token',
          'refresh_token',
        ]);
        // You might want to navigate to login screen here
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;