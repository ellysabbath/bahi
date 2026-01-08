// app/dashboard/profile/index.tsx
import { Feather, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserRole, useUser } from '../../../context/UserContext';

const ROLE_OPTIONS = [
  { value: 'customer', label: 'Customer', icon: 'user', color: '#007AFF' },
  { value: 'mechanic', label: 'Mechanic', icon: 'tools', color: '#FF9500' },
  { value: 'garage_owner', label: 'Garage Owner', icon: 'warehouse', color: '#34C759' },
  { value: 'admin', label: 'Admin', icon: 'shield', color: '#FF3B30' },
] as const;

export default function ProfileScreen() {
  const { user, updateUser, logout } = useUser();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    city: '',
    state: '',
    role: 'customer' as UserRole,
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        city: user.city || '',
        state: user.state || '',
        role: user.role || 'customer',
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    // Validate form
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
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
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        city: user.city || '',
        state: user.state || '',
        role: user.role || 'customer',
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

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'mechanic':
        return 'tools';
      case 'garage_owner':
        return 'warehouse';
      case 'admin':
        return 'shield';
      default:
        return 'user';
    }
  };

  const getRoleColor = (role: UserRole) => {
    const roleOption = ROLE_OPTIONS.find(r => r.value === role);
    return roleOption?.color || '#007AFF';
  };

  const getRoleDisplay = (role: UserRole) => {
    const roleOption = ROLE_OPTIONS.find(r => r.value === role);
    return roleOption?.label || role;
  };

  const selectRole = (role: UserRole) => {
    setFormData(prev => ({ ...prev, role }));
    setShowRoleModal(false);
  };

  // Handle role-specific navigation
  const handleRoleNavigation = () => {
    if (user?.role === 'mechanic') {
      router.push('/dashboard/mechanic/tasks' as any);
    } else if (user?.role === 'garage_owner') {
      router.push('/dashboard/garage/manage' as any);
    } else if (user?.role === 'admin') {
      router.push('/dashboard/admin/panel' as any);
    }
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

            {/* Profile Section */}
            <View className="bg-white px-5 py-6 mt-px items-center">
              <View className="flex-row items-center mb-4">
                <View 
                  className="w-16 h-16 rounded-full justify-center items-center mr-4"
                  style={{ backgroundColor: getRoleColor(user.role) }}
                >
                  <FontAwesome5 
                    name={getRoleIcon(user.role)} 
                    size={20} 
                    color="white" 
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-bold text-gray-900 mb-1">
                    {user.first_name} {user.last_name}
                  </Text>
                  <Text className="text-gray-600 text-sm font-medium mb-2">{user.email}</Text>
                  <View className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-full self-start">
                    <FontAwesome5 
                      name={getRoleIcon(user.role)} 
                      size={10} 
                      color={getRoleColor(user.role)} 
                    />
                    <Text className="text-xs font-semibold uppercase tracking-wider ml-1.5" style={{ color: getRoleColor(user.role) }}>
                      {getRoleDisplay(user.role)}
                    </Text>
                  </View>
                </View>
              </View>

              {user.is_email_verified ? (
                <View className="flex-row items-center bg-green-50 px-4 py-2 rounded-full">
                  <Feather name="check-circle" size={14} color="#34C759" />
                  <Text className="text-green-700 text-sm font-semibold ml-2">Verified Account</Text>
                </View>
              ) : (
                <TouchableOpacity className="flex-row items-center bg-amber-50 px-4 py-2 rounded-full">
                  <Feather name="alert-circle" size={14} color="#FF9500" />
                  <Text className="text-amber-700 text-sm font-semibold ml-2">Verify Email</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Personal Information */}
            <View className="bg-white mx-4 mt-4 rounded-xl p-5 shadow-sm">
              <View className="flex-row items-center mb-5">
                <FontAwesome5 name="user-circle" size={16} color="#666" />
                <Text className="text-gray-900 text-base font-semibold ml-3">Personal Information</Text>
              </View>

              <View className="flex-row items-center min-h-11">
                <View className="flex-row items-center flex-1">
                  <Text className="text-gray-600 text-base font-medium">First Name</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    className="flex-1 text-right text-gray-900 text-base font-medium py-2 px-3 border border-gray-300 rounded-lg bg-gray-50"
                    value={formData.first_name}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, first_name: text }))}
                    placeholder="Enter first name"
                    autoCapitalize="words"
                  />
                ) : (
                  <Text className="text-gray-900 text-base font-medium flex-1 text-right">{user.first_name}</Text>
                )}
              </View>

              <View className="h-px bg-gray-100 my-3" />

              <View className="flex-row items-center min-h-11">
                <View className="flex-row items-center flex-1">
                  <Text className="text-gray-600 text-base font-medium">Last Name</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    className="flex-1 text-right text-gray-900 text-base font-medium py-2 px-3 border border-gray-300 rounded-lg bg-gray-50"
                    value={formData.last_name}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, last_name: text }))}
                    placeholder="Enter last name"
                    autoCapitalize="words"
                  />
                ) : (
                  <Text className="text-gray-900 text-base font-medium flex-1 text-right">{user.last_name}</Text>
                )}
              </View>

              <View className="h-px bg-gray-100 my-3" />

              <View className="flex-row items-center min-h-11">
                <View className="flex-row items-center flex-1">
                  <FontAwesome5 name="phone" size={12} color="#666" className="mr-2" />
                  <Text className="text-gray-600 text-base font-medium">Phone</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    className="flex-1 text-right text-gray-900 text-base font-medium py-2 px-3 border border-gray-300 rounded-lg bg-gray-50"
                    value={formData.phone}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text className="text-gray-900 text-base font-medium flex-1 text-right">
                    {user.phone ? formatPhoneNumber(user.phone) : 'Not provided'}
                  </Text>
                )}
              </View>

              <View className="h-px bg-gray-100 my-3" />

              <View className="flex-row items-center min-h-11">
                <View className="flex-row items-center flex-1">
                  <FontAwesome5 name="map-marker-alt" size={12} color="#666" className="mr-2" />
                  <Text className="text-gray-600 text-base font-medium">Location</Text>
                </View>
                {isEditing ? (
                  <View className="flex-1 flex-row justify-between">
                    <TextInput
                      className="w-[48%] text-gray-900 text-base font-medium py-2 px-3 border border-gray-300 rounded-lg bg-gray-50"
                      value={formData.city}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
                      placeholder="City"
                    />
                    <TextInput
                      className="w-[48%] text-gray-900 text-base font-medium py-2 px-3 border border-gray-300 rounded-lg bg-gray-50"
                      value={formData.state}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, state: text }))}
                      placeholder="State"
                    />
                  </View>
                ) : (
                  <Text className="text-gray-900 text-base font-medium flex-1 text-right">
                    {user.city || user.state 
                      ? `${user.city || ''}${user.city && user.state ? ', ' : ''}${user.state || ''}`.trim()
                      : 'Not provided'
                    }
                  </Text>
                )}
              </View>

              <View className="h-px bg-gray-100 my-3" />

              <View className="flex-row items-center min-h-11">
                <View className="flex-row items-center flex-1">
                  <FontAwesome5 name="user-tag" size={12} color="#666" className="mr-2" />
                  <Text className="text-gray-600 text-base font-medium">Account Role</Text>
                </View>
                {isEditing ? (
                  <TouchableOpacity 
                    className="flex-1"
                    onPress={() => setShowRoleModal(true)}
                  >
                    <View className="flex-row items-center justify-end py-2 px-3 border border-gray-300 rounded-lg bg-gray-50">
                      <FontAwesome5 
                        name={getRoleIcon(formData.role)} 
                        size={12} 
                        color={getRoleColor(formData.role)} 
                      />
                      <Text className="text-base font-semibold mx-2 capitalize" style={{ color: getRoleColor(formData.role) }}>
                        {getRoleDisplay(formData.role)}
                      </Text>
                      <Feather name="chevron-down" size={14} color="#666" />
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View className="flex-row items-center justify-end flex-1">
                    <FontAwesome5 
                      name={getRoleIcon(user.role)} 
                      size={12} 
                      color={getRoleColor(user.role)} 
                    />
                    <Text className="text-base font-semibold ml-2 capitalize" style={{ color: getRoleColor(user.role) }}>
                      {getRoleDisplay(user.role)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Account Settings */}
            <View className="bg-white mx-4 mt-4 rounded-xl p-5 shadow-sm">
              <View className="flex-row items-center mb-5">
                <Feather name="settings" size={16} color="#666" />
                <Text className="text-gray-900 text-base font-semibold ml-3">Account Settings</Text>
              </View>

              <View className="flex-row items-center justify-between min-h-11">
                <View className="flex-1">
                  <Text className="text-gray-900 text-base font-medium mb-1">Email Notifications</Text>
                  <Text className="text-gray-500 text-sm">Receive updates about your bookings</Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View className="h-px bg-gray-100 my-3" />

              <View className="flex-row items-center justify-between min-h-11">
                <View className="flex-1">
                  <Text className="text-gray-900 text-base font-medium mb-1">Account Status</Text>
                  <Text className="text-gray-500 text-sm">Registration progress</Text>
                </View>
                <View className={`px-3 py-1.5 rounded-full ${user.registration_stage === 4 ? 'bg-green-50' : 'bg-amber-50'}`}>
                  <Text className={`text-sm font-semibold ${user.registration_stage === 4 ? 'text-green-700' : 'text-amber-700'}`}>
                    {user.registration_stage === 4 ? 'Complete' : `Stage ${user.registration_stage}`}
                  </Text>
                </View>
              </View>

              <View className="h-px bg-gray-100 my-3" />

              <View className="flex-row items-center justify-between min-h-11">
                <View className="flex-1">
                  <Text className="text-gray-900 text-base font-medium mb-1">Account Type</Text>
                  <Text className="text-gray-500 text-sm">
                    {user.role === 'customer' ? 'Personal customer account' : 
                     user.role === 'mechanic' ? 'Professional mechanic account' :
                     user.role === 'garage_owner' ? 'Business garage owner account' :
                     'Administrator account'}
                  </Text>
                </View>
                <View 
                  className="w-7 h-7 rounded-full justify-center items-center"
                  style={{ backgroundColor: `${getRoleColor(user.role)}20` }}
                >
                  <FontAwesome5 
                    name={getRoleIcon(user.role)} 
                    size={10} 
                    color={getRoleColor(user.role)} 
                  />
                </View>
              </View>
            </View>

            {/* Role-specific Actions */}
            {user.role !== 'customer' && (
              <View className="bg-white mx-4 mt-4 rounded-xl p-5 shadow-sm">
                <View className="flex-row items-center mb-5">
                  <FontAwesome5 
                    name={user.role === 'mechanic' ? 'tools' : user.role === 'garage_owner' ? 'warehouse' : 'shield'}
                    size={16} 
                    color={getRoleColor(user.role)} 
                  />
                  <Text className="text-base font-semibold ml-3" style={{ color: getRoleColor(user.role) }}>
                    {getRoleDisplay(user.role)} Tools
                  </Text>
                </View>
                
                <TouchableOpacity 
                  className="bg-gray-50 rounded-xl overflow-hidden"
                  onPress={handleRoleNavigation}
                >
                  <View className="flex-row items-center p-4">
                    <View 
                      className="w-10 h-10 rounded-full justify-center items-center mr-3"
                      style={{ backgroundColor: `${getRoleColor(user.role)}20` }}
                    >
                      <FontAwesome5 
                        name={user.role === 'mechanic' ? 'wrench' : user.role === 'garage_owner' ? 'cogs' : 'chart-line'}
                        size={14} 
                        color={getRoleColor(user.role)} 
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 text-base font-semibold mb-1">
                        {user.role === 'mechanic' ? 'View My Tasks' : 
                         user.role === 'garage_owner' ? 'Manage Garage' : 
                         'Admin Dashboard'}
                      </Text>
                      <Text className="text-gray-500 text-sm leading-tight">
                        {user.role === 'mechanic' ? 'Check assigned repairs and jobs' : 
                         user.role === 'garage_owner' ? 'Manage your garage and staff' : 
                         'View system analytics and manage users'}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={18} color="#666" />
                  </View>
                </TouchableOpacity>
              </View>
            )}

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
                className="flex-row items-center bg-white px-5 py-4 rounded-xl mb-3 shadow-sm border-l-4 border-gray-500"
                onPress={() => router.push('/dashboard/settings' as any)}
              >
                <Feather name="shield" size={18} color="#666" />
                <Text className="text-gray-600 text-base font-semibold ml-3 flex-1">Privacy & Security</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                className="flex-row items-center bg-white px-5 py-4 rounded-xl shadow-sm border-l-4 border-red-500"
                onPress={handleLogout}
              >
                <MaterialIcons name="logout" size={18} color="#FF3B30" />
                <Text className="text-red-600 text-base font-semibold ml-3 flex-1">Logout</Text>
              </TouchableOpacity>
            </View>

            {/* App Version */}
            <View className="items-center py-6">
              <Text className="text-gray-400 text-sm font-medium">AutoFix v1.0.0</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Role Selection Modal */}
      <Modal
        visible={showRoleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setShowRoleModal(false)}>
          <View className="bg-white rounded-t-2xl p-5 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-xl font-bold text-gray-900">Select Account Role</Text>
              <TouchableOpacity onPress={() => setShowRoleModal(false)}>
                <Feather name="x" size={22} color="#666" />
              </TouchableOpacity>
            </View>
            
            {ROLE_OPTIONS.map((role) => (
              <TouchableOpacity
                key={role.value}
                className={`flex-row items-center p-4 rounded-xl mb-2 border ${formData.role === role.value ? 'bg-gray-50 border-blue-500' : 'border-gray-200'}`}
                onPress={() => selectRole(role.value as UserRole)}
              >
                <View 
                  className="w-10 h-10 rounded-full justify-center items-center mr-3"
                  style={{ backgroundColor: `${role.color}20` }}
                >
                  <FontAwesome5 name={role.icon} size={16} color={role.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold mb-1" style={{ color: role.color }}>
                    {role.label}
                  </Text>
                  <Text className="text-gray-500 text-sm leading-tight">
                    {role.value === 'customer' ? 'Personal customer account for booking services' :
                     role.value === 'mechanic' ? 'Professional mechanic for performing repairs' :
                     role.value === 'garage_owner' ? 'Business owner managing a garage' :
                     'System administrator with full access'}
                  </Text>
                </View>
                {formData.role === role.value && (
                  <Feather name="check-circle" size={18} color={role.color} />
                )}
              </TouchableOpacity>
            ))}
            
            <View className="mt-5 p-3 bg-amber-50 rounded-lg">
              <Text className="text-amber-700 text-sm italic leading-tight">
                Note: Changing your role may affect access to certain features. Admin approval may be required for professional roles.
              </Text>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}