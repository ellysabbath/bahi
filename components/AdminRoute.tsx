// components/AdminRoute.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { dashboardAPI } from '../services/dashboardApi';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const router = useRouter();

  const checkAdminAccess = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      
      if (!token) {
        router.replace('/login');
        return;
      }

      // Assuming dashboardAPI returns a boolean for authentication check
      // You might need to adjust this based on your actual API implementation
      const isAuthenticated = await dashboardAPI.isAuthenticated();
      
      if (!isAuthenticated) {
        router.replace('/login');
        return;
      }

      // TODO: Implement proper admin role check with your backend
      // For demo purposes, we'll check if authenticated
      // In a real app, you would call an API to check user role
      
      // Example: const userRole = await dashboardAPI.getUserRole();
      // setIsAdmin(userRole === 'admin');
      
      setIsAdmin(true); // Temporary: allow access if authenticated
    } catch (error) {
      console.error('Admin check error:', error);
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    checkAdminAccess();
  }, [checkAdminAccess]);

  if (isAdmin === null) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Checking admin access...</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-5">
        <Text className="text-xl font-bold text-red-500 mb-2">Access Denied</Text>
        <Text className="text-center text-gray-600 mb-4">
          You don`t have permission to access the admin panel.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}