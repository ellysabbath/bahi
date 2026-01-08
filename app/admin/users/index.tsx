// app/admin/users/index.tsx
import {
  Ionicons
} from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

interface UserType {
  id: number;
  name: string;
  email: string;
  phone: string;
  bookings: number;
  status: 'active' | 'inactive' | 'suspended';
  registered_date: string;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<UserType[]>([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 (555) 123-4567',
      bookings: 12,
      status: 'active',
      registered_date: '2024-01-01',
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1 (555) 987-6543',
      bookings: 5,
      status: 'active',
      registered_date: '2024-01-05',
    },
    {
      id: 3,
      name: 'Bob Johnson',
      email: 'bob@example.com',
      phone: '+1 (555) 456-7890',
      bookings: 3,
      status: 'inactive',
      registered_date: '2024-01-10',
    },
    {
      id: 4,
      name: 'Alice Brown',
      email: 'alice@example.com',
      phone: '+1 (555) 789-0123',
      bookings: 8,
      status: 'suspended',
      registered_date: '2024-01-12',
    },
  ]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { theme } = useTheme();

  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
  const textColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const cardColor = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  const inputBgColor = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100';
  const inputTextColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-800';

  const statusOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      active: theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100',
      inactive: theme === 'dark' ? 'bg-yellow-900/30' : 'bg-yellow-100',
      suspended: theme === 'dark' ? 'bg-red-900/30' : 'bg-red-100',
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  const getStatusTextColor = (status: string) => {
    const colors = {
      active: theme === 'dark' ? 'text-green-300' : 'text-green-800',
      inactive: theme === 'dark' ? 'text-yellow-300' : 'text-yellow-800',
      suspended: theme === 'dark' ? 'text-red-300' : 'text-red-800',
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = (userId: number, newStatus: UserType['status']) => {
    Alert.alert(
      'Update User Status',
      `Change user status to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: () => {
            setUsers(users.map(user =>
              user.id === userId
                ? { ...user, status: newStatus }
                : user
            ));
            Alert.alert('Success', 'User status updated');
          },
        },
      ]
    );
  };

  const handleViewBookings = (user: UserType) => {
    Alert.alert(
      `${user.name}'s Bookings`,
      `Total bookings: ${user.bookings}\n\nStatus: ${user.status}\nRegistered: ${user.registered_date}`,
      [
        { text: 'OK', style: 'default' },
        { 
          text: 'View Details', 
          onPress: () => {
            // In a real app, navigate to user's booking details
            Alert.alert('Bookings', `Showing ${user.bookings} bookings for ${user.name}`);
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      <View className="p-5">
        {/* Header */}
        <View className="mb-6">
          <Text className={`text-2xl font-bold ${textColor}`}>Users Management</Text>
          <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            Manage registered users
          </Text>
        </View>

        {/* Search Bar */}
        <View className="relative mb-4">
          <TextInput
            className={`${inputBgColor} rounded-full px-5 py-3 pl-12 ${inputTextColor} font-medium ${borderColor} border`}
            placeholder="Search users..."
            placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#6b7280'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <View className="absolute left-4 top-3">
            <Ionicons name="search" size={20} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
          </View>
        </View>

        {/* Status Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="mb-6"
        >
          <View className="flex-row space-x-3">
            {statusOptions.map((option) => (
              <TouchableOpacity 
                key={option.value}
                className={`px-4 py-2 rounded-full ${
                  statusFilter === option.value
                    ? theme === 'dark' ? 'bg-blue-700' : 'bg-blue-600'
                    : theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                }`}
                onPress={() => setStatusFilter(option.value)}
              >
                <Text className={`font-medium ${
                  statusFilter === option.value ? 'text-white' : textColor
                }`}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Users List */}
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="space-y-4">
            {filteredUsers.map((user) => (
              <View
                key={user.id}
                className={`${cardColor} rounded-2xl p-5 shadow-sm ${borderColor} border`}
              >
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-row items-center flex-1">
                    <View className={`w-12 h-12 rounded-full ${
                      theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
                    } items-center justify-center mr-4`}>
                      <Ionicons name="person" size={24} color="#3b82f6" />
                    </View>
                    <View className="flex-1">
                      <Text className={`font-bold ${textColor} text-lg`}>
                        {user.name}
                      </Text>
                      <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                        {user.email}
                      </Text>
                    </View>
                  </View>
                  
                  <View className={`px-3 py-1 rounded-full ${getStatusColor(user.status)}`}>
                    <Text className={`text-xs font-semibold ${getStatusTextColor(user.status)}`}>
                      {user.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <Ionicons name="call" size={16} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                    <Text className={`ml-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {user.phone}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="calendar" size={16} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                    <Text className={`ml-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {user.registered_date}
                    </Text>
                  </View>
                </View>

                <View className="flex-row justify-between items-center">
                  <TouchableOpacity
                    className="px-4 py-2 bg-blue-600 rounded-lg"
                    onPress={() => handleViewBookings(user)}
                  >
                    <Text className="text-white font-semibold">
                      {user.bookings} Bookings
                    </Text>
                  </TouchableOpacity>
                  
                  <View className="flex-row space-x-2">
                    {user.status === 'active' && (
                      <>
                        <TouchableOpacity
                          className="px-4 py-2 bg-yellow-600 rounded-lg"
                          onPress={() => handleUpdateStatus(user.id, 'inactive')}
                        >
                          <Text className="text-white font-semibold">Deactivate</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="px-4 py-2 bg-red-600 rounded-lg"
                          onPress={() => handleUpdateStatus(user.id, 'suspended')}
                        >
                          <Text className="text-white font-semibold">Suspend</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {user.status === 'inactive' && (
                      <>
                        <TouchableOpacity
                          className="px-4 py-2 bg-green-600 rounded-lg"
                          onPress={() => handleUpdateStatus(user.id, 'active')}
                        >
                          <Text className="text-white font-semibold">Activate</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="px-4 py-2 bg-red-600 rounded-lg"
                          onPress={() => handleUpdateStatus(user.id, 'suspended')}
                        >
                          <Text className="text-white font-semibold">Suspend</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {user.status === 'suspended' && (
                      <TouchableOpacity
                        className="px-4 py-2 bg-green-600 rounded-lg"
                        onPress={() => handleUpdateStatus(user.id, 'active')}
                      >
                        <Text className="text-white font-semibold">Reinstate</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
          
          <View className="h-20" /> {/* Bottom padding */}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}