// lib/config.ts
export const API_CONFIG = {
  // ✅ For development, use your computer's IP address
  // On Windows: Run ipconfig to get your IPv4 address
  // On Mac: Run ifconfig | grep "inet "
  BASE_URL:'https://mhazini.pythonanywhere.com',
  
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  FETCH_OPTIONS: {
    credentials: 'omit' as RequestCredentials,
  },
  
  TIMEOUT: 10000, // 10 seconds
  
  // Debug settings
  DEBUG_MODE: __DEV__,
  
  // Endpoints
  ENDPOINTS: {
    LOGIN: '/api/auth/login/',
    TOKEN_REFRESH: '/api/auth/token/refresh/',
    USER_PROFILE: '/api/auth/me/',
    LOGOUT: '/api/auth/logout/',
    TEST: '/api/test/'
  }
};