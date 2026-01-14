// app/dashboard/profile/index.tsx
import { Feather, FontAwesome5, MaterialIcons, Ionicons, Entypo } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../../context/UserContext';

// Format date for display
const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format phone number for display
const formatPhoneNumber = (phone: string | null) => {
  if (!phone) return 'Not provided';
  // Display with Tanzanian format
  const cleaned = phone.replace('255', '0');
  return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
};

// Format membership number for display
const formatMembershipNumber = (membership: string | null) => {
  if (!membership) return 'Not provided';
  return membership.toUpperCase();
};

export default function ProfileScreen() {
  const { user, updateUser, logout } = useUser();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullname: '',
    mobile_number: '',
    email: '',
    membership_number: '',
    region: '',
    district: '',
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        fullname: user.fullname || '',
        mobile_number: user.mobile_number || '',
        email: user.email || '',
        membership_number: user.membership_number || '',
        region: user.region || '',
        district: user.district || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    // Validate form
    if (!formData.fullname.trim()) {
      Alert.alert('Error', 'Full name is required');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update user context
      updateUser(formData);
      
      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
      console.error('Update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        fullname: user.fullname || '',
        mobile_number: user.mobile_number || '',
        email: user.email || '',
        membership_number: user.membership_number || '',
        region: user.region || '',
        district: user.district || '',
      });
    }
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          }
        }
      ]
    );
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-700' : 'text-red-700';
  };

  const getStatusText = (status: boolean) => {
    return status ? 'Yes' : 'No';
  };

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="mt-3 text-gray-600 text-base font-medium">Loading profile...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'My Profile',
          headerShown: false,
        }}
      />
      
      <SafeAreaView className="flex-1 bg-gray-50">
        <KeyboardAvoidingView 
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-200">
              <TouchableOpacity 
                onPress={() => router.back()}
                className="p-1"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="arrow-left" size={24} color="#333" />
              </TouchableOpacity>
              <Text className="text-lg font-bold text-gray-900 flex-1 text-center mx-2">My Profile</Text>
              <View className="w-20 items-end">
                {isEditing ? (
                  <View className="flex-row items-center">
                    <TouchableOpacity 
                      onPress={handleCancel}
                      className="px-3 py-1.5 mr-2"
                      disabled={isLoading}
                    >
                      <Text className="text-gray-600 text-sm font-medium">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={handleSave}
                      className={`px-4 py-2 rounded-lg min-w-[60px] items-center ${isLoading ? 'bg-blue-300' : 'bg-blue-500'}`}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text className="text-white text-sm font-semibold">Save</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    onPress={() => setIsEditing(true)}
                    className="p-2"
                  >
                    <Feather name="edit-2" size={20} color="#007AFF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Profile Header */}
            <View className="bg-white px-5 py-6 mt-px">
              <View className="flex-row items-start">
                <View className="w-16 h-16 rounded-full bg-blue-100 justify-center items-center mr-4">
                  <FontAwesome5 name="user" size={22} color="#007AFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-bold text-gray-900 mb-1">
                    {user.fullname}
                  </Text>
                  <Text className="text-gray-600 text-sm font-medium mb-3">
                    {user.email || 'No email provided'}
                  </Text>
                  
                  {/* User ID */}
                  <View className="flex-row items-center mb-2">
                    <Feather name="hash" size={12} color="#666" />
                    <Text className="text-gray-500 text-xs font-medium ml-1">
                      ID: {user.id}
                    </Text>
                  </View>

                  {/* Status Badges Row 1 */}
                  <View className="flex-row flex-wrap gap-2 mb-2">
                    <View className={`px-3 py-1.5 rounded-full ${user.is_active ? 'bg-green-50' : 'bg-red-50'}`}>
                      <View className="flex-row items-center">
                        <Ionicons 
                          name={user.is_active ? 'checkmark-circle' : 'close-circle'} 
                          size={12} 
                          color={user.is_active ? '#34C759' : '#FF3B30'} 
                        />
                        <Text className={`text-xs font-semibold ml-1.5 ${user.is_active ? 'text-green-700' : 'text-red-700'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                    
                    <View className={`px-3 py-1.5 rounded-full ${user.is_verified ? 'bg-green-50' : 'bg-amber-50'}`}>
                      <View className="flex-row items-center">
                        <Ionicons 
                          name={user.is_verified ? 'checkmark-circle' : 'close-circle'} 
                          size={12} 
                          color={user.is_verified ? '#34C759' : '#FF9500'} 
                        />
                        <Text className={`text-xs font-semibold ml-1.5 ${user.is_verified ? 'text-green-700' : 'text-amber-700'}`}>
                          {user.is_verified ? 'Verified' : 'Not Verified'}
                        </Text>
                      </View>
                    </View>
                    
                    {user.is_staff && (
                      <View className="px-3 py-1.5 rounded-full bg-purple-50">
                        <View className="flex-row items-center">
                          <Feather name="shield" size={12} color="#AF52DE" />
                          <Text className="text-purple-700 text-xs font-semibold ml-1.5">Staff</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {/* Personal Information Section */}
            <View className="bg-white mx-4 mt-4 rounded-xl p-5 shadow-sm">
              <View className="flex-row items-center mb-5">
                <FontAwesome5 name="user-circle" size={16} color="#666" />
                <Text className="text-gray-900 text-base font-semibold ml-3">Personal Information</Text>
              </View>

              {/* Full Name */}
              <View className="flex-row items-center min-h-11 mb-3">
                <View className="flex-1">
                  <Text className="text-gray-600 text-base font-medium">Full Name</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    className="flex-1 text-right text-gray-900 text-base font-medium py-2 px-3 border border-gray-300 rounded-lg bg-gray-50"
                    value={formData.fullname}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, fullname: text }))}
                    placeholder="Enter full name"
                    autoCapitalize="words"
                  />
                ) : (
                  <Text className="text-gray-900 text-base font-medium flex-1 text-right">
                    {user.fullname}
                  </Text>
                )}
              </View>

              <View className="h-px bg-gray-100 my-3" />

              {/* Mobile Number */}
              <View className="flex-row items-center min-h-11 mb-3">
                <View className="flex-row items-center flex-1">
                  <FontAwesome5 name="phone-alt" size={12} color="#666" className="mr-2" />
                  <Text className="text-gray-600 text-base font-medium">Mobile Number</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    className="flex-1 text-right text-gray-900 text-base font-medium py-2 px-3 border border-gray-300 rounded-lg bg-gray-50"
                    value={formData.mobile_number || ''}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, mobile_number: text }))}
                    placeholder="255XXXXXXXXX"
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text className="text-gray-900 text-base font-medium flex-1 text-right">
                    {formatPhoneNumber(user.mobile_number)}
                  </Text>
                )}
              </View>

              <View className="h-px bg-gray-100 my-3" />

              {/* Email Address */}
              <View className="flex-row items-center min-h-11 mb-3">
                <View className="flex-row items-center flex-1">
                  <Feather name="mail" size={12} color="#666" className="mr-2" />
                  <Text className="text-gray-600 text-base font-medium">Email Address</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    className="flex-1 text-right text-gray-900 text-base font-medium py-2 px-3 border border-gray-300 rounded-lg bg-gray-50"
                    value={formData.email || ''}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                    placeholder="Enter email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                ) : (
                  <Text className="text-gray-900 text-base font-medium flex-1 text-right">
                    {user.email || 'Not provided'}
                  </Text>
                )}
              </View>

              <View className="h-px bg-gray-100 my-3" />

              {/* Membership Number */}
              <View className="flex-row items-center min-h-11">
                <View className="flex-row items-center flex-1">
                  <FontAwesome5 name="id-card-alt" size={12} color="#666" className="mr-2" />
                  <Text className="text-gray-600 text-base font-medium">Membership Number</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    className="flex-1 text-right text-gray-900 text-base font-medium py-2 px-3 border border-gray-300 rounded-lg bg-gray-50"
                    value={formData.membership_number || ''}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, membership_number: text }))}
                    placeholder="Enter membership number"
                  />
                ) : (
                  <Text className="text-gray-900 text-base font-medium flex-1 text-right">
                    {formatMembershipNumber(user.membership_number)}
                  </Text>
                )}
              </View>
            </View>

            {/* Location Information */}
            <View className="bg-white mx-4 mt-4 rounded-xl p-5 shadow-sm">
              <View className="flex-row items-center mb-5">
                <FontAwesome5 name="map-marker-alt" size={16} color="#666" />
                <Text className="text-gray-900 text-base font-semibold ml-3">Location Information</Text>
              </View>

              {/* Region */}
              <View className="flex-row items-center min-h-11 mb-3">
                <View className="flex-row items-center flex-1">
                  <Entypo name="location" size={12} color="#666" className="mr-2" />
                  <Text className="text-gray-600 text-base font-medium">Region</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    className="flex-1 text-right text-gray-900 text-base font-medium py-2 px-3 border border-gray-300 rounded-lg bg-gray-50"
                    value={formData.region || ''}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, region: text }))}
                    placeholder="Enter region"
                  />
                ) : (
                  <Text className="text-gray-900 text-base font-medium flex-1 text-right">
                    {user.region || 'Not provided'}
                  </Text>
                )}
              </View>

              <View className="h-px bg-gray-100 my-3" />

              {/* District */}
              <View className="flex-row items-center min-h-11">
                <View className="flex-row items-center flex-1">
                  <Feather name="map-pin" size={12} color="#666" className="mr-2" />
                  <Text className="text-gray-600 text-base font-medium">District</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    className="flex-1 text-right text-gray-900 text-base font-medium py-2 px-3 border border-gray-300 rounded-lg bg-gray-50"
                    value={formData.district || ''}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, district: text }))}
                    placeholder="Enter district"
                  />
                ) : (
                  <Text className="text-gray-900 text-base font-medium flex-1 text-right">
                    {user.district || 'Not provided'}
                  </Text>
                )}
              </View>
            </View>

            {/* Account Status Section */}
            <View className="bg-white mx-4 mt-4 rounded-xl p-5 shadow-sm">
              <View className="flex-row items-center mb-5">
                <Feather name="shield" size={16} color="#666" />
                <Text className="text-gray-900 text-base font-semibold ml-3">Account Status</Text>
              </View>

              {/* Account Active */}
              <View className="flex-row items-center justify-between min-h-11 mb-3">
                <View className="flex-row items-center flex-1">
                  <Ionicons name="power" size={14} color="#666" className="mr-2" />
                  <Text className="text-gray-600 text-base font-medium">Account Active</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons 
                    name={user.is_active ? 'checkmark-circle' : 'close-circle'} 
                    size={16} 
                    color={user.is_active ? '#34C759' : '#FF3B30'} 
                  />
                  <Text className={`text-base font-semibold ml-2 ${getStatusColor(user.is_active)}`}>
                    {getStatusText(user.is_active)}
                  </Text>
                </View>
              </View>

              <View className="h-px bg-gray-100 my-3" />

              {/* Account Verified */}
              <View className="flex-row items-center justify-between min-h-11 mb-3">
                <View className="flex-row items-center flex-1">
                  <Ionicons name="checkmark-circle" size={14} color="#666" className="mr-2" />
                  <Text className="text-gray-600 text-base font-medium">Account Verified</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons 
                    name={user.is_verified ? 'checkmark-circle' : 'close-circle'} 
                    size={16} 
                    color={user.is_verified ? '#34C759' : '#FF9500'} 
                  />
                  <Text className={`text-base font-semibold ml-2 ${getStatusColor(user.is_verified)}`}>
                    {getStatusText(user.is_verified)}
                  </Text>
                </View>
              </View>

              <View className="h-px bg-gray-100 my-3" />

              {/* Staff Status */}
              <View className="flex-row items-center justify-between min-h-11">
                <View className="flex-row items-center flex-1">
                  <Feather name="users" size={14} color="#666" className="mr-2" />
                  <Text className="text-gray-600 text-base font-medium">Staff Member</Text>
                </View>
                <View className="flex-row items-center">
                  <Feather 
                    name={user.is_staff ? 'user-check' : 'user-x'} 
                    size={16} 
                    color={user.is_staff ? '#AF52DE' : '#666'} 
                  />
                  <Text className={`text-base font-semibold ml-2 ${getStatusColor(user.is_staff)}`}>
                    {getStatusText(user.is_staff)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Account Timestamps */}
            <View className="bg-white mx-4 mt-4 rounded-xl p-5 shadow-sm">
              <View className="flex-row items-center mb-5">
                <Feather name="clock" size={16} color="#666" />
                <Text className="text-gray-900 text-base font-semibold ml-3">Account Timestamps</Text>
              </View>

              {/* Date Joined */}
              <View className="flex-row items-center min-h-11 mb-3">
                <View className="flex-row items-center flex-1">
                  <Feather name="calendar" size={14} color="#666" className="mr-2" />
                  <View>
                    <Text className="text-gray-600 text-base font-medium">Date Joined</Text>
                    <Text className="text-gray-400 text-xs">When account was created</Text>
                  </View>
                </View>
                <Text className="text-gray-900 text-base font-medium flex-1 text-right">
                  {formatDate(user.date_joined)}
                </Text>
              </View>

              <View className="h-px bg-gray-100 my-3" />

              {/* Last Login */}
              <View className="flex-row items-center min-h-11 mb-3">
                <View className="flex-row items-center flex-1">
                  <Feather name="log-in" size={14} color="#666" className="mr-2" />
                  <View>
                    <Text className="text-gray-600 text-base font-medium">Last Login</Text>
                    <Text className="text-gray-400 text-xs">Most recent login time</Text>
                  </View>
                </View>
                <Text className="text-gray-900 text-base font-medium flex-1 text-right">
                  {formatDate(user.last_login)}
                </Text>
              </View>

              <View className="h-px bg-gray-100 my-3" />

              {/* Last Updated */}
              <View className="flex-row items-center min-h-11">
                <View className="flex-row items-center flex-1">
                  <Feather name="refresh-cw" size={14} color="#666" className="mr-2" />
                  <View>
                    <Text className="text-gray-600 text-base font-medium">Last Updated</Text>
                    <Text className="text-gray-400 text-xs">Profile last updated</Text>
                  </View>
                </View>
                <Text className="text-gray-900 text-base font-medium flex-1 text-right">
                  {formatDate(user.updated_at)}
                </Text>
              </View>
            </View>

            {/* Account Summary */}
            <View className="bg-white mx-4 mt-4 rounded-xl p-5 shadow-sm">
              <View className="flex-row items-center mb-5">
                <Feather name="info" size={16} color="#666" />
                <Text className="text-gray-900 text-base font-semibold ml-3">Account Summary</Text>
              </View>

              <View className="space-y-3">
                {/* User ID */}
                <View className="flex-row items-center">
                  <Feather name="hash" size={14} color="#666" className="mr-2" />
                  <Text className="text-gray-600 text-base font-medium flex-1">User ID:</Text>
                  <Text className="text-gray-900 text-base font-medium">{user.id}</Text>
                </View>

                {/* Account Age */}
                <View className="flex-row items-center">
                  <Feather name="clock" size={14} color="#666" className="mr-2" />
                  <Text className="text-gray-600 text-base font-medium flex-1">Account Age:</Text>
                  <Text className="text-gray-900 text-base font-medium">
                    {(() => {
                      const joined = new Date(user.date_joined);
                      const now = new Date();
                      const diffTime = Math.abs(now.getTime() - joined.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
                    })()}
                  </Text>
                </View>

                {/* Contact Info Status */}
                <View className="flex-row items-center">
                  <Feather name="phone" size={14} color="#666" className="mr-2" />
                  <Text className="text-gray-600 text-base font-medium flex-1">Mobile Number:</Text>
                  <Text className={`text-base font-medium ${user.mobile_number ? 'text-green-700' : 'text-amber-700'}`}>
                    {user.mobile_number ? 'Provided' : 'Not Provided'}
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Feather name="mail" size={14} color="#666" className="mr-2" />
                  <Text className="text-gray-600 text-base font-medium flex-1">Email:</Text>
                  <Text className={`text-base font-medium ${user.email ? 'text-green-700' : 'text-amber-700'}`}>
                    {user.email ? 'Provided' : 'Not Provided'}
                  </Text>
                </View>

                {/* Location Info Status */}
                <View className="flex-row items-center">
                  <Feather name="map-pin" size={14} color="#666" className="mr-2" />
                  <Text className="text-gray-600 text-base font-medium flex-1">Location:</Text>
                  <Text className={`text-base font-medium ${user.region || user.district ? 'text-green-700' : 'text-amber-700'}`}>
                    {user.region || user.district ? 'Provided' : 'Not Provided'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Account Settings */}
            <View className="bg-white mx-4 mt-4 rounded-xl p-5 shadow-sm">
              <View className="flex-row items-center mb-5">
                <Feather name="settings" size={16} color="#666" />
                <Text className="text-gray-900 text-base font-semibold ml-3">Account Settings</Text>
              </View>

              <View className="flex-row items-center justify-between min-h-11 mb-4">
                <View className="flex-1">
                  <Text className="text-gray-900 text-base font-medium mb-1">Email Notifications</Text>
                  <Text className="text-gray-500 text-sm">Receive updates about your account</Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View className="flex-row items-center justify-between min-h-11">
                <View className="flex-1">
                  <Text className="text-gray-900 text-base font-medium mb-1">Push Notifications</Text>
                  <Text className="text-gray-500 text-sm">Receive app notifications</Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View className="mx-4 mt-6 mb-4">
              <TouchableOpacity 
                className="flex-row items-center bg-white px-5 py-4 rounded-xl mb-3 shadow-sm border-l-4 border-blue-500"
                onPress={() => router.push('/dashboard/help' as any)}
              >
                <Feather name="help-circle" size={18} color="#007AFF" />
                <Text className="text-blue-600 text-base font-semibold ml-3 flex-1">Help & Support</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                className="flex-row items-center bg-white px-5 py-4 rounded-xl mb-3 shadow-sm border-l-4 border-green-500"
                onPress={() => router.push('/dashboard/settings' as any)}
              >
                <Feather name="shield" size={18} color="#34C759" />
                <Text className="text-green-600 text-base font-semibold ml-3 flex-1">Privacy & Security</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                className="flex-row items-center bg-white px-5 py-4 rounded-xl mb-3 shadow-sm border-l-4 border-amber-500"
                onPress={() => router.push('/dashboard/account' as any)}
              >
                <Feather name="credit-card" size={18} color="#FF9500" />
                <Text className="text-amber-600 text-base font-semibold ml-3 flex-1">Billing & Subscription</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                className="flex-row items-center bg-white px-5 py-4 rounded-xl shadow-sm border-l-4 border-red-500"
                onPress={handleLogout}
              >
                <MaterialIcons name="logout" size={18} color="#FF3B30" />
                <Text className="text-red-600 text-base font-semibold ml-3 flex-1">Logout</Text>
              </TouchableOpacity>
            </View>

            {/* App Info */}
            <View className="items-center py-6">
              <Text className="text-gray-400 text-sm font-medium">mhaziniApi v1.0.0</Text>
              <Text className="text-gray-400 text-xs mt-1">User ID: {user.id}</Text>
              <Text className="text-gray-400 text-xs mt-1">
                Profile loaded: {new Date().toLocaleTimeString()}
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}