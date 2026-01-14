// app/context/UserContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface User {
  // From CustomUser model
  id: string;
  mobile_number: string | null;
  email: string | null;
  fullname: string;
  membership_number: string | null;
  is_active: boolean;
  is_staff: boolean;
  is_verified: boolean;
  region: string | null;
  district: string | null;
  date_joined: string;
  last_login: string | null;
  updated_at: string;
}

interface UserContextType {
  user: User | null;
  token: string | null;
  setUser: (user: User | null, token?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  token: null,
  setUser: async () => {},
  logout: async () => {},
  updateUser: async () => {},
  isLoading: true,
});

export const useUser = () => useContext(UserContext);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user and token from storage on app start
  useEffect(() => {
    loadUserAndToken();
  }, []);

  const loadUserAndToken = async () => {
    try {
      // Use SAME keys as authApi.ts
      const [userJson, storedToken] = await Promise.all([
        AsyncStorage.getItem('quickfix_user_data'),      // Changed from '@autofix_user'
        AsyncStorage.getItem('quickfix_access_token'),   // Changed from '@autofix_token'
      ]);
      
      if (userJson) {
        setUserState(JSON.parse(userJson));
      }
      
      if (storedToken) {
        setTokenState(storedToken);
      }
    } catch (error) {
      console.error('Failed to load user/token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setUser = async (newUser: User | null, newToken?: string) => {
    try {
      setUserState(newUser);
      if (newToken) {
        setTokenState(newToken);
      }
      
      if (newUser) {
        // Use SAME key as authApi.ts
        await AsyncStorage.setItem('quickfix_user_data', JSON.stringify(newUser));
      } else {
        await AsyncStorage.removeItem('quickfix_user_data');
      }
      
      if (newToken) {
        // Use SAME key as authApi.ts
        await AsyncStorage.setItem('quickfix_access_token', newToken);
      } else {
        await AsyncStorage.removeItem('quickfix_access_token');
      }
    } catch (error) {
      console.error('Failed to save user/token:', error);
    }
  };

  const logout = async () => {
    try {
      setUserState(null);
      setTokenState(null);
      // Clear ALL auth-related keys
      await AsyncStorage.multiRemove([
        'quickfix_access_token',
        'quickfix_refresh_token',
        'quickfix_user_data',
        '@autofix_user',
        '@autofix_token',
        'access_token',
        'refresh_token',
      ]);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      const updatedUser = { ...user, ...updates };
      setUserState(updatedUser);
      // Use SAME key as authApi.ts
      await AsyncStorage.setItem('quickfix_user_data', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  };

  const value = {
    user,
    token,
    setUser,
    logout,
    updateUser,
    isLoading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}