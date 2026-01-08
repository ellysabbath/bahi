// app/context/UserContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type UserRole = 'mechanic' | 'garage_owner' | 'customer' | 'admin';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  state: string;
  role: UserRole;
  role_display?: string;
  is_email_verified: boolean;
  registration_stage: number;
  is_admin?: boolean;
  is_mechanic?: boolean;
  is_garage_owner?: boolean;
  is_customer?: boolean;
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
      const [userJson, storedToken] = await Promise.all([
        AsyncStorage.getItem('@autofix_user'),
        AsyncStorage.getItem('@autofix_token'),
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
        await AsyncStorage.setItem('@autofix_user', JSON.stringify(newUser));
      } else {
        await AsyncStorage.removeItem('@autofix_user');
      }
      
      if (newToken) {
        await AsyncStorage.setItem('@autofix_token', newToken);
      } else {
        await AsyncStorage.removeItem('@autofix_token');
      }
    } catch (error) {
      console.error('Failed to save user/token:', error);
    }
  };

  const logout = async () => {
    try {
      setUserState(null);
      setTokenState(null);
      await AsyncStorage.multiRemove(['@autofix_user', '@autofix_token', '@autofix_csrf_token']);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      const updatedUser = { ...user, ...updates };
      setUserState(updatedUser);
      await AsyncStorage.setItem('@autofix_user', JSON.stringify(updatedUser));
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