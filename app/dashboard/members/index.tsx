import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, UserPlus, Edit2, Trash2, Phone, Mail, MapPin, User, Calendar, CheckCircle, XCircle } from 'lucide-react-native';

const API_URL = 'https://mhazini.pythonanywhere.com/api/auth/users/';

const App = () => {
  const navigation = useNavigation();
  // States
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Form states - Only fullname is required
  const [mobile_number, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [membership_number, setMembershipNumber] = useState('');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [is_active, setIsActive] = useState(true);
  const [is_verified, setIsVerified] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  // Tanzanian country code
  const COUNTRY_CODE = '255';

  // Validate Tanzanian phone number (only if provided)
  const validatePhoneNumber = (phone) => {
    if (!phone) return true; // Optional, so empty is valid
    
    const fullNumber = COUNTRY_CODE + phone;
    const tzRegex = /^255[0-9]{9}$/;
    return tzRegex.test(fullNumber);
  };

  // Get full phone number with country code (only if mobile number provided)
  const getFullPhoneNumber = () => {
    if (!mobile_number) return '';
    return COUNTRY_CODE + mobile_number;
  };

  // Validate password (only if provided)
  const validatePassword = (pass) => {
    if (!pass) return true; // Optional, so empty is valid
    return pass.length >= 6;
  };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      setUsers(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Format phone number input - user only enters last 9 digits
  const handlePhoneInput = (text) => {
    let cleanText = text.replace(/\D/g, '');
    
    if (cleanText.length > 9) {
      cleanText = cleanText.substring(0, 9);
    }
    
    setMobileNumber(cleanText);
  };

  // Create user - Only fullname is required, all others optional
  const createUser = async () => {
    const fullPhoneNumber = getFullPhoneNumber();
    
    // VALIDATION - Only fullname is required
    if (!fullname) {
      Alert.alert('Validation Error', 'Full name is required');
      return;
    }

    // Validate phone if provided
    if (mobile_number && mobile_number.length !== 9) {
      Alert.alert('Validation Error', 'Phone number must be exactly 9 digits (after 255)');
      return;
    }

    // Validate password if provided
    if (password && !validatePassword(password)) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters');
      return;
    }

    if (password && password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return;
    }

    try {
      const userData = {
        mobile_number: fullPhoneNumber || '',  // Can be empty
        fullname,  // REQUIRED
        email: email || '',  // Can be empty
        membership_number: membership_number || '',  // Can be empty
        region: region || '',
        district: district || '',
        is_active,
        is_verified,
      };

      // Only add password if provided
      if (password) {
        userData.password = password;
      }

      await axios.post(API_URL, userData);
      Alert.alert('Success', 'User created successfully');
      resetForm();
      setModalVisible(false);
      fetchUsers();
    } catch (error) {
      if (error.response?.data) {
        const errors = error.response.data;
        let errorMessage = '';
        
        for (const key in errors) {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        }
        
        Alert.alert('API Error', errorMessage);
      } else {
        Alert.alert('Error', 'Failed to create user');
      }
      console.error(error.response?.data || error);
    }
  };

  // Update user - Only fullname is required, all others optional
  const updateUser = async () => {
    if (!currentUserId) return;

    const fullPhoneNumber = getFullPhoneNumber();
    
    // Validation - Only fullname is required
    if (!fullname) {
      Alert.alert('Validation Error', 'Full name is required');
      return;
    }

    // Validate phone if provided
    if (mobile_number && mobile_number.length !== 9) {
      Alert.alert('Validation Error', 'Phone number must be exactly 9 digits (after 255)');
      return;
    }

    try {
      const userData = {
        mobile_number: fullPhoneNumber || '',
        fullname,
        email: email || '',
        membership_number: membership_number || '',
        region: region || '',
        district: district || '',
        is_active,
        is_verified,
      };

      // Only add password if provided
      if (password) {
        if (!validatePassword(password)) {
          Alert.alert('Validation Error', 'Password must be at least 6 characters');
          return;
        }
        if (password !== confirmPassword) {
          Alert.alert('Validation Error', 'Passwords do not match');
          return;
        }
        userData.password = password;
      }

      await axios.put(`${API_URL}${currentUserId}/`, userData);
      Alert.alert('Success', 'User updated successfully');
      resetForm();
      setModalVisible(false);
      fetchUsers();
    } catch (error) {
      if (error.response?.data) {
        const errors = error.response.data;
        let errorMessage = '';
        
        for (const key in errors) {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        }
        
        Alert.alert('API Error', errorMessage);
      } else {
        Alert.alert('Error', 'Failed to update user');
      }
      console.error(error.response?.data || error);
    }
  };

  // Delete user
  const deleteUser = async (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}${id}/`);
              Alert.alert('Success', 'User deleted successfully');
              fetchUsers();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  // Edit user - Extract last 9 digits from full number
  const editUser = (user) => {
    setCurrentUserId(user.id);
    
    // Extract last 9 digits from mobile number if exists
    if (user.mobile_number) {
      const phone = user.mobile_number;
      const lastNineDigits = phone.startsWith('255') ? phone.substring(3) : phone;
      setMobileNumber(lastNineDigits);
    } else {
      setMobileNumber('');
    }
    
    setFullname(user.fullname);
    setEmail(user.email || '');
    setMembershipNumber(user.membership_number || '');
    setRegion(user.region || '');
    setDistrict(user.district || '');
    setIsActive(user.is_active);
    setIsVerified(user.is_verified);
    setPassword('');
    setConfirmPassword('');
    setEditing(true);
    setModalVisible(true);
  };

  // Reset form
  const resetForm = () => {
    setMobileNumber('');
    setPassword('');
    setConfirmPassword('');
    setFullname('');
    setEmail('');
    setMembershipNumber('');
    setRegion('');
    setDistrict('');
    setIsActive(true);
    setIsVerified(false);
    setCurrentUserId(null);
    setEditing(false);
  };

  // Handle submit
  const handleSubmit = () => {
    if (editing) {
      updateUser();
    } else {
      createUser();
    }
  };

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Render user item
  const renderUserItem = ({ item }) => (
    <View className="bg-white mx-4 my-2 p-4 rounded-xl shadow-sm border border-gray-100">
      <View className="mb-3">
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-lg font-bold text-gray-800 flex-1">{item.fullname}</Text>
          <View className="flex-row space-x-1">
            {item.is_active ? (
              <View className="bg-green-50 px-2 py-1 rounded-full flex-row items-center">
                <CheckCircle size={14} color="#10B981" />
                <Text className="text-green-700 text-xs ml-1 font-medium">Active</Text>
              </View>
            ) : (
              <View className="bg-red-50 px-2 py-1 rounded-full flex-row items-center">
                <XCircle size={14} color="#EF4444" />
                <Text className="text-red-700 text-xs ml-1 font-medium">Inactive</Text>
              </View>
            )}
            {item.is_verified && (
              <View className="bg-blue-50 px-2 py-1 rounded-full flex-row items-center">
                <CheckCircle size={14} color="#3B82F6" />
                <Text className="text-blue-700 text-xs ml-1 font-medium">Verified</Text>
              </View>
            )}
          </View>
        </View>
        
        <View className="space-y-1">
          {item.mobile_number && (
            <View className="flex-row items-center">
              <Phone size={14} color="#6B7280" />
              <Text className="text-gray-600 text-sm ml-2">
                <Text className="font-medium">+255</Text> {item.mobile_number.substring(3)}
              </Text>
            </View>
          )}
          
          {item.email && (
            <View className="flex-row items-center">
              <Mail size={14} color="#6B7280" />
              <Text className="text-gray-600 text-sm ml-2">{item.email}</Text>
            </View>
          )}
          
          {item.membership_number && (
            <View className="flex-row items-center">
              <User size={14} color="#6B7280" />
              <Text className="text-gray-600 text-sm ml-2">ID: {item.membership_number}</Text>
            </View>
          )}
          
          {(item.region || item.district) && (
            <View className="flex-row items-center">
              <MapPin size={14} color="#6B7280" />
              <Text className="text-gray-600 text-sm ml-2">
                {item.region}{item.district ? `, ${item.district}` : ''}
              </Text>
            </View>
          )}
          
          <View className="flex-row items-center">
            <Calendar size={14} color="#6B7280" />
            <Text className="text-gray-500 text-xs ml-2 italic">
              Joined: {new Date(item.date_joined).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
      
      <View className="flex-row border-t border-gray-100 pt-3 mt-2">
        <TouchableOpacity
          className="flex-1 bg-amber-500 py-2 rounded-lg mx-1 flex-row justify-center items-center"
          onPress={() => editUser(item)}>
          <Edit2 size={16} color="white" />
          <Text className="text-white font-medium ml-2">Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="flex-1 bg-red-500 py-2 rounded-lg mx-1 flex-row justify-center items-center"
          onPress={() => deleteUser(item.id)}>
          <Trash2 size={16} color="white" />
          <Text className="text-white font-medium ml-2">Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="bg-blue-600 pt-10 pb-5 px-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity 
            className="mr-4"
            onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-white">User Management</Text>
            <Text className="text-blue-100 text-sm mt-1">Only Full Name is required</Text>
          </View>
        </View>
      </View>

      {/* Add User Button */}
      <TouchableOpacity
        className="bg-green-500 mx-5 my-4 p-4 rounded-xl shadow-md flex-row justify-center items-center"
        onPress={() => {
          resetForm();
          setModalVisible(true);
        }}>
        <UserPlus size={20} color="white" />
        <Text className="text-white text-lg font-semibold ml-2">Add New User</Text>
      </TouchableOpacity>

      {/* Users List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-600 text-base mt-4">Loading users...</Text>
        </View>
      ) : users.length === 0 ? (
        <View className="flex-1 justify-center items-center px-10">
          <View className="bg-blue-50 p-6 rounded-2xl items-center">
            <User size={48} color="#93C5FD" />
            <Text className="text-gray-700 text-xl font-bold mt-4">No users found</Text>
            <Text className="text-gray-500 text-center mt-2">
              Tap "Add New User" to create your first user
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerClassName="pb-6"
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal for Add/Edit User */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
          resetForm();
        }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end">
          <View className="bg-gray-900/50 flex-1 justify-end">
            <View className="bg-white rounded-t-3xl max-h-[90%]">
              <ScrollView showsVerticalScrollIndicator={false} className="p-6">
                <View className="flex-row justify-between items-center mb-6">
                  <Text className="text-2xl font-bold text-gray-800">
                    {editing ? 'Edit User' : 'Add New User'}
                  </Text>
                  <TouchableOpacity 
                    className="p-2"
                    onPress={() => {
                      setModalVisible(false);
                      resetForm();
                    }}>
                    <Text className="text-gray-500 text-lg">✕</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Full Name - REQUIRED */}
                <View className="mb-5">
                  <Text className="text-gray-700 font-medium mb-2">
                    Full Name <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
                    value={fullname}
                    onChangeText={setFullname}
                    placeholder="Enter full name (required)"
                  />
                </View>

                {/* Phone Number - OPTIONAL */}
                <View className="mb-5">
                  <Text className="text-gray-700 font-medium mb-2">Mobile Number</Text>
                  <View className="flex-row">
                    <View className="bg-gray-100 px-4 py-3 border border-gray-300 border-r-0 rounded-l-lg">
                      <Text className="text-gray-800 font-semibold">+255</Text>
                    </View>
                    <TextInput
                      className={`flex-1 border border-gray-300 rounded-r-lg px-4 py-3 bg-white ${
                        mobile_number.length > 0 && mobile_number.length !== 9 ? 'border-red-500 bg-red-50' : ''
                      }`}
                      value={mobile_number}
                      onChangeText={handlePhoneInput}
                      placeholder="712345678 (optional)"
                      keyboardType="phone-pad"
                      maxLength={9}
                    />
                  </View>
                  {mobile_number.length > 0 && mobile_number.length !== 9 && (
                    <Text className="text-red-500 text-sm mt-1">
                      Must be exactly 9 digits (e.g., 712345678)
                    </Text>
                  )}
                  <Text className="text-gray-500 text-sm mt-1">
                    Enter 9 digits after +255 (optional)
                  </Text>
                </View>

                {/* Email - OPTIONAL */}
                <View className="mb-5">
                  <Text className="text-gray-700 font-medium mb-2">Email</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter email (optional)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Membership Number - OPTIONAL */}
                <View className="mb-5">
                  <Text className="text-gray-700 font-medium mb-2">Membership Number</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
                    value={membership_number}
                    onChangeText={setMembershipNumber}
                    placeholder="Enter membership number (optional)"
                  />
                </View>

                {/* Password Fields - OPTIONAL */}
                <View className="mb-5">
                  <Text className="text-gray-700 font-medium mb-2">
                    Password {editing ? '(Optional)' : ''}
                  </Text>
                  <TextInput
                    className={`border border-gray-300 rounded-lg px-4 py-3 bg-white ${
                      password && !validatePassword(password) ? 'border-red-500 bg-red-50' : ''
                    }`}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={editing ? "Leave blank to keep current" : "Minimum 6 characters (optional)"}
                    secureTextEntry
                  />
                  {password && !validatePassword(password) && (
                    <Text className="text-red-500 text-sm mt-1">Password must be at least 6 characters</Text>
                  )}
                </View>

                <View className="mb-5">
                  <Text className="text-gray-700 font-medium mb-2">
                    Confirm Password {editing ? '(Optional)' : ''}
                  </Text>
                  <TextInput
                    className={`border border-gray-300 rounded-lg px-4 py-3 bg-white ${
                      confirmPassword && password !== confirmPassword ? 'border-red-500 bg-red-50' : ''
                    }`}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm password (optional)"
                    secureTextEntry
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <Text className="text-red-500 text-sm mt-1">Passwords do not match</Text>
                  )}
                </View>

                {/* Region and District */}
                <View className="flex-row mb-5">
                  <View className="flex-1 mr-2">
                    <Text className="text-gray-700 font-medium mb-2">Region</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
                      value={region}
                      onChangeText={setRegion}
                      placeholder="Region"
                    />
                  </View>
                  <View className="flex-1 ml-2">
                    <Text className="text-gray-700 font-medium mb-2">District</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
                      value={district}
                      onChangeText={setDistrict}
                      placeholder="District"
                    />
                  </View>
                </View>

                {/* Toggle Switches */}
                <View className="mb-8">
                  <Text className="text-gray-700 font-medium mb-4">Account Status</Text>
                  <View className="flex-row justify-between">
                    <View className="items-center">
                      <Text className="text-gray-600 mb-2">Active User</Text>
                      <TouchableOpacity
                        className={`w-20 py-2 rounded-full ${is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                        onPress={() => setIsActive(!is_active)}>
                        <Text className="text-white font-semibold text-center">
                          {is_active ? 'Yes' : 'No'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View className="items-center">
                      <Text className="text-gray-600 mb-2">Verified</Text>
                      <TouchableOpacity
                        className={`w-20 py-2 rounded-full ${is_verified ? 'bg-blue-500' : 'bg-gray-300'}`}
                        onPress={() => setIsVerified(!is_verified)}>
                        <Text className="text-white font-semibold text-center">
                          {is_verified ? 'Yes' : 'No'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row mb-6">
                  <TouchableOpacity
                    className="flex-1 bg-gray-200 py-4 rounded-xl mr-2"
                    onPress={() => {
                      setModalVisible(false);
                      resetForm();
                    }}>
                    <Text className="text-gray-700 font-semibold text-center">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className={`flex-1 py-4 rounded-xl ml-2 ${
                      !fullname 
                        ? 'bg-blue-300' 
                        : 'bg-blue-600'
                    }`}
                    onPress={handleSubmit}
                    disabled={!fullname}>
                    <Text className="text-white font-semibold text-center">
                      {editing ? 'Update' : 'Create'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default App;