// lib/config.ts
export const API_CONFIG = {
  // ✅ Environment variable for production, fallback for development
  BASE_URL: process.env.API_KEY || 'https://mhazini.pythonanywhere.com',
  
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  FETCH_OPTIONS: {
    credentials: 'omit' as RequestCredentials,
  },
  
  TIMEOUT: 15000, // Reduced from 30000 for better UX
  
  // Debug settings
  DEBUG_MODE: __DEV__,
  LOG_NETWORK: true,
  
  // Endpoints
  ENDPOINTS: {
    LOGIN: '/api/auth/login/',
    TOKEN_REFRESH: '/api/auth/token/refresh/',
    USER_PROFILE: '/api/auth/me/',
    LOGOUT: '/api/auth/logout/',
    TEST: '/api/test/'
  }
};