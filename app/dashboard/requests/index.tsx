import React, { useState, useEffect } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardTypeOptions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define TypeScript interfaces
interface Garage {
  id: number;
  name: string;
  address: string;
  rating: number;
  is_verified: boolean;
  location?: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  state: string;
  role: string;
}

interface FormData {
  first_name: string;
  middle_name: string;
  last_name: string;
  location: string;
  garage_id: number | null;
  experience: string;
  agreed_to_terms: boolean;
  email: string;
  phone: string;
  vehicle_year?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  service_type?: string;
  vehicle_type?: string;
}

interface FormErrors {
  first_name?: string;
  last_name?: string;
  location?: string;
  garage_id?: string;
  experience?: string;
  agreed_to_terms?: string;
  email?: string;
  phone?: string;
  [key: string]: string | undefined;
}

interface APIData {
  request_id?: string;
  data?: {
    request_id?: string;
  };
  [key: string]: any;
}

// Base URL for your Django backend
const API_BASE_URL = 'https://autofix.pythonanywhere.com';

const RequestFormScreen = () => {
  // User state
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    middle_name: '',
    last_name: '',
    location: '',
    garage_id: null,
    experience: '',
    agreed_to_terms: false,
    email: '',
    phone: '',
  });

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingGarages, setLoadingGarages] = useState(true);
  
  // Data states
  const [garages, setGarages] = useState<Garage[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  
  // Character counter state
  const [characterCount, setCharacterCount] = useState(0);
  const maxCharacters = 500;

  // Form validation errors
  const [errors, setErrors] = useState<FormErrors>({});

  // Load user data from AsyncStorage
  useEffect(() => {
    loadUserData();
  }, []);

  // Auto-populate form when user data is loaded
  useEffect(() => {
    if (user && isLoggedIn) {
      // Populate form with user data
      setFormData(prev => ({
        ...prev,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.city || '',
      }));
    }
  }, [user, isLoggedIn]);

  const loadUserData = async () => {
    try {
      setLoadingUser(true);
      const userJson = await AsyncStorage.getItem('@autofix_user');
      
      if (userJson) {
        const userData: User = JSON.parse(userJson);
        setUser(userData);
        setIsLoggedIn(true);
        console.log('User loaded from storage:', userData);
      } else {
        console.log('No user found in storage');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoadingUser(false);
    }
  };

  // Fetch garages from API
  const fetchGarages = async () => {
    try {
      setLoadingGarages(true);
      const response = await fetch(`${API_BASE_URL}/garage-select/`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch garages');
      }
      
      const data = await response.json();
      setGarages(data);
    } catch (error) {
      console.error('Error fetching garages:', error);
      Alert.alert('Error', 'Failed to load garages. Please try again.');
    } finally {
      setLoadingGarages(false);
    }
  };

  // Fetch cities from API
  const fetchCities = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/garage-select/cities/`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch cities');
      }
      
      const data = await response.json();
      setCities(data.cities || []);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  useEffect(() => {
    fetchGarages();
    fetchCities();
  }, []);

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string | number | boolean | null) => {
    // For experience field, update character count
    if (field === 'experience' && typeof value === 'string') {
      setCharacterCount(value.length);
      
      // Truncate if exceeds max characters
      if (value.length > maxCharacters) {
        value = value.substring(0, maxCharacters);
      }
    }
    
    // Don't allow editing of auto-populated fields for logged-in users
    if (isLoggedIn && user) {
      const autoPopulatedFields = ['first_name', 'last_name', 'email', 'phone'];
      if (autoPopulatedFields.includes(field)) {
        // Show message that this field is auto-populated
        Alert.alert(
          'Auto-populated Field',
          'This field is automatically filled from your profile. To change it, please update your profile information.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    
    setFormData({
      ...formData,
      [field]: value,
    });
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'City/Location is required';
    }

    if (!formData.garage_id) {
      newErrors.garage_id = 'Please select a garage';
    }

    if (!formData.experience.trim()) {
      newErrors.experience = 'Please describe your experience';
    } else if (formData.experience.trim().length < 10) {
      newErrors.experience = 'Please provide a more detailed description (minimum 10 characters)';
    }

    if (!formData.agreed_to_terms) {
      newErrors.agreed_to_terms = 'You must agree to the terms and policies';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-+()]{10,}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number (at least 10 digits)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission to API
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Get auth token if user is logged in
      let authHeader = {};
      if (isLoggedIn) {
        const token = await AsyncStorage.getItem('@autofix_token');
        if (token) {
          authHeader = {
            'Authorization': `Bearer ${token}`,
          };
        }
      }

      // Prepare data for API
      const submissionData: any = {
        first_name: formData.first_name.trim(),
        middle_name: formData.middle_name.trim() || undefined,
        last_name: formData.last_name.trim(),
        location: formData.location.trim(),
        garage_id: formData.garage_id,
        experience: formData.experience.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        agreed_to_terms: formData.agreed_to_terms,
      };

      // Add optional vehicle fields if provided
      if (formData.vehicle_year) submissionData.vehicle_year = formData.vehicle_year;
      if (formData.vehicle_make) submissionData.vehicle_make = formData.vehicle_make.trim();
      if (formData.vehicle_model) submissionData.vehicle_model = formData.vehicle_model.trim();
      if (formData.service_type) submissionData.service_type = formData.service_type.trim();
      if (formData.vehicle_type) submissionData.vehicle_type = formData.vehicle_type.trim();

      console.log('Submitting data:', submissionData);

      const response = await fetch(`${API_BASE_URL}/service-requests/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify(submissionData),
      });

      const responseData: APIData = await response.json();

      if (!response.ok) {
        // Handle API validation errors
        if (responseData) {
          const apiErrors: FormErrors = {};
          Object.keys(responseData).forEach(key => {
            if (Array.isArray(responseData[key])) {
              apiErrors[key] = responseData[key][0];
            } else {
              apiErrors[key] = responseData[key];
            }
          });
          setErrors(apiErrors);
          throw new Error('Please check the form for errors');
        }
        throw new Error(`Server error: ${response.status}`);
      }

      // Success - show success message with request ID
      const requestId = responseData.request_id || responseData.data?.request_id;
      const successMessage = requestId 
        ? `Your service request has been submitted successfully!\n\nRequest ID: ${requestId}`
        : 'Your service request has been submitted successfully!';

      Alert.alert(
        'Success!',
        successMessage,
        [
          {
            text: 'View Request',
            onPress: () => {
              // Navigate to request detail if you have navigation
              console.log('Navigate to request detail:', requestId);
            },
          },
          {
            text: 'OK',
            onPress: () => {
              // Reset form but keep user data if logged in
              setFormData(prev => ({
                ...prev,
                middle_name: '',
                location: '',
                garage_id: null,
                experience: '',
                agreed_to_terms: false,
                vehicle_year: '',
                vehicle_make: '',
                vehicle_model: '',
                service_type: '',
                vehicle_type: '',
              }));
              setCharacterCount(0);
              setErrors({});
            },
          },
        ]
      );

      console.log('Form submitted successfully:', responseData);

    } catch (error) {
      console.error('Submission error:', error);
      Alert.alert(
        'Submission Failed',
        error instanceof Error ? error.message : 'Failed to submit service request. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Render the form field with label and error
  const renderFormField = (
    label: string, 
    field: keyof FormData, 
    placeholder: string, 
    isRequired: boolean = true, 
    keyboardType: KeyboardTypeOptions = 'default',
    isAutoPopulated: boolean = false
  ) => (
    <View className="mb-5">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-gray-700 font-medium">
          {label} {isRequired && <Text className="text-red-500">*</Text>}
        </Text>
        {isAutoPopulated && isLoggedIn && (
          <View className="flex-row items-center bg-blue-100 px-2 py-1 rounded">
            <Text className="text-blue-700 text-xs font-medium">
              ✓ Auto-filled
            </Text>
          </View>
        )}
      </View>
      <TextInput
        className={`border rounded-lg px-4 py-3 text-base ${
          errors[field] 
            ? 'border-red-500 bg-red-50' 
            : isAutoPopulated && isLoggedIn
            ? 'border-blue-300 bg-blue-50'
            : 'border-gray-300 bg-white'
        }`}
        placeholder={placeholder}
        value={String(formData[field] || '')}
        onChangeText={(value) => handleInputChange(field, value)}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        editable={!isAutoPopulated || !isLoggedIn}
        selectTextOnFocus={!isAutoPopulated || !isLoggedIn}
      />
      {errors[field] && (
        <Text className="text-red-500 text-sm mt-1">{errors[field]}</Text>
      )}
      {isAutoPopulated && isLoggedIn && field === 'email' && (
        <Text className="text-blue-600 text-xs mt-1">
          This will be used for service request notifications
        </Text>
      )}
    </View>
  );

  // Get selected garage name
  const getSelectedGarageName = () => {
    if (!formData.garage_id) return '';
    const selectedGarage = garages.find(g => g.id === formData.garage_id);
    return selectedGarage ? selectedGarage.name : '';
  };

  // Render user info banner
  const renderUserInfoBanner = () => {
    if (!isLoggedIn || !user) return null;

    return (
      <View className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
        <View className="flex-row items-center mb-2">
          <View className="w-8 h-8 bg-blue-600 rounded-full items-center justify-center mr-3">
            <Text className="text-white font-bold">✓</Text>
          </View>
          <View className="flex-1">
            <Text className="text-blue-800 font-bold text-base">
              Welcome back, {user.first_name}!
            </Text>
            <Text className="text-blue-600 text-sm">
              Your information has been auto-filled from your profile
            </Text>
          </View>
        </View>
        
        <View className="mt-3 space-y-2">
          <View className="flex-row">
            <Text className="text-blue-700 font-medium w-24">Name:</Text>
            <Text className="text-gray-800 flex-1">{user.first_name} {user.last_name}</Text>
          </View>
          <View className="flex-row">
            <Text className="text-blue-700 font-medium w-24">Email:</Text>
            <Text className="text-gray-800 flex-1">{user.email}</Text>
          </View>
          <View className="flex-row">
            <Text className="text-blue-700 font-medium w-24">Phone:</Text>
            <Text className="text-gray-800 flex-1">{user.phone || 'Not provided'}</Text>
          </View>
          {user.city && (
            <View className="flex-row">
              <Text className="text-blue-700 font-medium w-24">Location:</Text>
              <Text className="text-gray-800 flex-1">{user.city}</Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity 
          className="mt-3 flex-row items-center"
          onPress={() => console.log('Navigate to profile')}
        >
          <Text className="text-blue-600 text-sm font-medium">
            Update profile information
          </Text>
          <Text className="text-blue-600 ml-1">→</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render login prompt for non-logged in users
  const renderLoginPrompt = () => {
    if (isLoggedIn || loadingUser) return null;

    return (
      <View className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
        <View className="flex-row items-center mb-2">
          <View className="w-8 h-8 bg-amber-500 rounded-full items-center justify-center mr-3">
            <Text className="text-white font-bold">!</Text>
          </View>
          <View className="flex-1">
            <Text className="text-amber-800 font-bold text-base">
              Create an account for faster service
            </Text>
            <Text className="text-amber-600 text-sm">
              Save time by auto-filling your information
            </Text>
          </View>
        </View>
        
        <View className="mt-3">
          <Text className="text-gray-700 text-sm mb-2">
            Benefits of creating an account:
          </Text>
          <View className="space-y-1">
            <Text className="text-gray-600 text-xs">• Auto-fill your information for future requests</Text>
            <Text className="text-gray-600 text-xs">• Track all your service requests in one place</Text>
            <Text className="text-gray-600 text-xs">• Receive status updates via email/SMS</Text>
            <Text className="text-gray-600 text-xs">• Get personalized service recommendations</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          className="mt-4 bg-amber-600 rounded-lg py-3 px-4 items-center"
          onPress={() => console.log('Navigate to login/signup')}
        >
          <Text className="text-white font-semibold">Sign up or Log in</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render loading state
  if (loadingUser) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 mt-4">Loading user information...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      
      {/* Fixed Header Section - Does NOT scroll */}
      <View className="bg-white px-6 py-6 border-b border-gray-200">
        <Text className="text-3xl font-bold text-gray-800">Auto Service Request Form</Text>
        <Text className="text-gray-600 mt-2">
          Fill out the form below to submit your service request
        </Text>
      </View>

      {/* Scrollable Form Content */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Main Form Container */}
          <View className="p-5">
            {/* User Info Banner */}
            {renderUserInfoBanner()}
            
            {/* Login Prompt */}
            {renderLoginPrompt()}

            {/* Personal Information Section */}
            <View className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
              <Text className="text-xl font-semibold text-gray-800 mb-5">
                Personal Information
              </Text>
              
              {/* First Name */}
              {renderFormField(
                'First Name', 
                'first_name', 
                'Enter your first name',
                true,
                'default',
                true // Auto-populated
              )}
              
              {/* Middle Name */}
              <View className="mb-5">
                <Text className="text-gray-700 font-medium mb-2">
                  Middle Name
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white"
                  placeholder="Enter your middle name (optional)"
                  value={formData.middle_name}
                  onChangeText={(value) => handleInputChange('middle_name', value)}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              {/* Last Name */}
              {renderFormField(
                'Last Name', 
                'last_name', 
                'Enter your last name',
                true,
                'default',
                true // Auto-populated
              )}
              
              {/* Email */}
              {renderFormField(
                'Email', 
                'email', 
                'Enter your email',
                true,
                'email-address',
                true // Auto-populated
              )}
              
              {/* Phone */}
              {renderFormField(
                'Phone', 
                'phone', 
                'Enter your phone number',
                true,
                'phone-pad',
                true // Auto-populated
              )}
              
              {/* City/Location */}
              <View className="mb-5">
                <Text className="text-gray-700 font-medium mb-2">
                  City/Location <Text className="text-red-500">*</Text>
                </Text>
                
                {/* Show cities dropdown if available */}
                {cities.length > 0 ? (
                  <View className="border border-gray-300 rounded-lg bg-white">
                    <TextInput
                      className={`px-4 py-3 text-base ${
                        isLoggedIn && user?.city ? 'bg-blue-50 border-blue-300' : ''
                      }`}
                      placeholder="Select or type your city"
                      value={formData.location}
                      onChangeText={(value) => handleInputChange('location', value)}
                      placeholderTextColor="#9CA3AF"
                    />
                    
                    {/* Show city suggestions when typing */}
                    {formData.location && (
                      <View className="border-t border-gray-100">
                        {cities
                          .filter(city => 
                            city.toLowerCase().includes(formData.location.toLowerCase())
                          )
                          .slice(0, 5)
                          .map((city, index) => (
                            <TouchableOpacity
                              key={index}
                              className="px-4 py-3 border-b border-gray-100 last:border-b-0 bg-white active:bg-gray-50"
                              onPress={() => handleInputChange('location', city)}
                            >
                              <Text className="text-gray-700">{city}</Text>
                            </TouchableOpacity>
                          ))}
                      </View>
                    )}
                  </View>
                ) : (
                  <TextInput
                    className={`border rounded-lg px-4 py-3 text-base ${
                      errors.location 
                        ? 'border-red-500 bg-red-50' 
                        : isLoggedIn && user?.city
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-300 bg-white'
                    }`}
                    placeholder="Enter your city or location"
                    value={formData.location}
                    onChangeText={(value) => handleInputChange('location', value)}
                    placeholderTextColor="#9CA3AF"
                  />
                )}
                
                {errors.location && (
                  <Text className="text-red-500 text-sm mt-1">{errors.location}</Text>
                )}
                {isLoggedIn && user?.city && formData.location === user.city && (
                  <Text className="text-blue-600 text-xs mt-1">
                    ✓ Auto-filled from your profile
                  </Text>
                )}
              </View>
            </View>

            {/* Vehicle Information Section (Optional) */}
            <View className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
              <Text className="text-xl font-semibold text-gray-800 mb-5">
                Vehicle Information (Optional)
              </Text>
              
              <View className="grid grid-cols-2 gap-4 mb-4">
                <View>
                  <Text className="text-gray-700 font-medium mb-2">Vehicle Year</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white"
                    placeholder="e.g., 2020"
                    value={formData.vehicle_year || ''}
                    onChangeText={(value) => handleInputChange('vehicle_year', value)}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                  />
                </View>
                
                <View>
                  <Text className="text-gray-700 font-medium mb-2">Vehicle Make</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white"
                    placeholder="e.g., Toyota"
                    value={formData.vehicle_make || ''}
                    onChangeText={(value) => handleInputChange('vehicle_make', value)}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
              
              <View className="grid grid-cols-2 gap-4 mb-4">
                <View>
                  <Text className="text-gray-700 font-medium mb-2">Vehicle Model</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white"
                    placeholder="e.g., Camry"
                    value={formData.vehicle_model || ''}
                    onChangeText={(value) => handleInputChange('vehicle_model', value)}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                
                <View>
                  <Text className="text-gray-700 font-medium mb-2">Vehicle Type</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white"
                    placeholder="e.g., Sedan, SUV"
                    value={formData.vehicle_type || ''}
                    onChangeText={(value) => handleInputChange('vehicle_type', value)}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
              
              <View>
                <Text className="text-gray-700 font-medium mb-2">Service Type</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white"
                  placeholder="e.g., Oil Change, Brake Repair"
                  value={formData.service_type || ''}
                  onChangeText={(value) => handleInputChange('service_type', value)}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Service Selection Section */}
            <View className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
              <Text className="text-xl font-semibold text-gray-800 mb-5">
                Service Details
              </Text>
              
              {/* Garage Selection */}
              <View className="mb-6">
                <Text className="text-gray-700 font-medium mb-2">
                  Select Garage <Text className="text-red-500">*</Text>
                </Text>
                
                {loadingGarages ? (
                  <View className="border border-gray-300 rounded-lg bg-white p-5 items-center">
                    <ActivityIndicator size="small" color="#3B82F6" />
                    <Text className="text-gray-500 mt-2">Loading garages...</Text>
                  </View>
                ) : garages.length === 0 ? (
                  <View className="border border-gray-300 rounded-lg bg-white p-5">
                    <Text className="text-gray-500 text-center">No garages available</Text>
                  </View>
                ) : (
                  <View className="border border-gray-300 rounded-lg bg-white">
                    {/* Default "Select a garage" option */}
                    <TouchableOpacity
                      className={`px-4 py-4 border-b border-gray-100 ${
                        !formData.garage_id ? 'bg-blue-50' : ''
                      } active:opacity-80`}
                      onPress={() => handleInputChange('garage_id', null)}
                    >
                      <View className="flex-row items-center">
                        <View className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                          !formData.garage_id 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-gray-300'
                        }`}>
                          {!formData.garage_id && (
                            <View className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </View>
                        <Text className="text-gray-400">Select a garage</Text>
                      </View>
                    </TouchableOpacity>
                    
                    {/* Garage options */}
                    {garages.map((garage) => (
                      <TouchableOpacity
                        key={garage.id}
                        className={`px-4 py-4 border-b border-gray-100 last:border-b-0 ${
                          formData.garage_id === garage.id ? 'bg-blue-50' : ''
                        } active:opacity-80`}
                        onPress={() => handleInputChange('garage_id', garage.id)}
                      >
                        <View className="flex-row items-center">
                          <View className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                            formData.garage_id === garage.id 
                              ? 'border-blue-500 bg-blue-500' 
                              : 'border-gray-300'
                          }`}>
                            {formData.garage_id === garage.id && (
                              <View className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </View>
                          <View className="flex-1">
                            <Text className={`font-medium ${
                              formData.garage_id === garage.id 
                                ? 'text-blue-700' 
                                : 'text-gray-700'
                            }`}>
                              {garage.name}
                            </Text>
                            <Text className="text-gray-500 text-sm mt-1">
                              {garage.address}
                            </Text>
                            <View className="flex-row items-center mt-1">
                              {garage.rating > 0 && (
                                <Text className="text-yellow-600 text-sm">
                                  ★ {garage.rating}
                                </Text>
                              )}
                              {garage.is_verified && (
                                <Text className="text-green-600 text-sm ml-2">
                                  ✓ Verified
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                
                {errors.garage_id && (
                  <Text className="text-red-500 text-sm mt-2">{errors.garage_id}</Text>
                )}
                
                {/* Refresh button for garages */}
                <TouchableOpacity
                  className="mt-3 self-start"
                  onPress={fetchGarages}
                  disabled={loadingGarages}
                >
                  <Text className={`text-sm ${loadingGarages ? 'text-gray-400' : 'text-blue-600'}`}>
                    {loadingGarages ? 'Refreshing...' : 'Refresh garage list'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Experience Explanation Textarea */}
              <View className="mb-5">
                <Text className="text-gray-700 font-medium mb-2">
                  Describe Your Experience <Text className="text-red-500">*</Text>
                </Text>
                
                <View className={`border rounded-lg ${
                  errors.experience 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-300 bg-white'
                }`}>
                  <TextInput
                    className="px-4 py-3 text-base min-h-[120px]"
                    placeholder="Please describe your experience with garage services, what work you need done, or any specific issues with your vehicle..."
                    value={formData.experience}
                    onChangeText={(value) => handleInputChange('experience', value)}
                    placeholderTextColor="#9CA3AF"
                    multiline
                    textAlignVertical="top"
                    numberOfLines={5}
                    maxLength={maxCharacters}
                  />
                  
                  {/* Character counter */}
                  <View className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                    <Text className={`text-right text-sm ${
                      characterCount > maxCharacters * 0.9 
                        ? 'text-red-500' 
                        : 'text-gray-500'
                    }`}>
                      {characterCount}/{maxCharacters} characters
                    </Text>
                  </View>
                </View>
                
                {/* Help text */}
                <Text className="text-gray-500 text-sm mt-2">
                  Provide details about: Vehicle issues, previous repairs needed, specific services required, or any concerns.
                </Text>
                
                {errors.experience && (
                  <Text className="text-red-500 text-sm mt-2">{errors.experience}</Text>
                )}
              </View>
              
              {/* Selected Garage Preview */}
              {formData.garage_id && (
                <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5">
                  <Text className="text-blue-800 font-semibold mb-1">Selected Garage:</Text>
                  <Text className="text-blue-700 font-medium">{getSelectedGarageName()}</Text>
                  <Text className="text-blue-600 text-sm mt-1">
                    Your request will be sent to this garage for review
                  </Text>
                </View>
              )}
            </View>

            {/* Terms and Conditions Section */}
            <View className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
              <Text className="text-xl font-semibold text-gray-800 mb-5">
                Terms & Policies
              </Text>
              
              <TouchableOpacity
                className="flex-row items-start active:opacity-80"
                onPress={() => handleInputChange('agreed_to_terms', !formData.agreed_to_terms)}
                activeOpacity={0.7}
              >
                <View className={`w-6 h-6 border-2 rounded mr-3 mt-1 flex items-center justify-center ${
                  formData.agreed_to_terms 
                    ? 'bg-blue-500 border-blue-500' 
                    : 'border-gray-300'
                }`}>
                  {formData.agreed_to_terms && (
                    <Text className="text-white font-bold">✓</Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-gray-700">
                    I agree to the{' '}
                    <Text className="text-blue-600 font-medium">Terms of Service</Text>
                    {' '}and{' '}
                    <Text className="text-blue-600 font-medium">Privacy Policy</Text>
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    By checking this box, you acknowledge that you have read and agree to our terms and conditions.
                  </Text>
                </View>
              </TouchableOpacity>
              
              {errors.agreed_to_terms && (
                <Text className="text-red-500 text-sm mt-3">{errors.agreed_to_terms}</Text>
              )}
            </View>

            {/* Form Preview Section */}
            {(formData.first_name || formData.last_name || formData.location || formData.garage_id || formData.experience) && (
              <View className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6">
                <Text className="text-lg font-semibold text-gray-800 mb-4">
                  Form Preview
                </Text>
                
                <View className="space-y-3">
                  {formData.first_name && (
                    <View className="flex-row">
                      <Text className="text-gray-600 font-medium w-32">First Name:</Text>
                      <Text className="text-gray-800 flex-1">
                        {formData.first_name}
                        {isLoggedIn && <Text className="text-blue-600 text-xs ml-2">(Auto-filled)</Text>}
                      </Text>
                    </View>
                  )}
                  
                  {formData.middle_name && (
                    <View className="flex-row">
                      <Text className="text-gray-600 font-medium w-32">Middle Name:</Text>
                      <Text className="text-gray-800 flex-1">{formData.middle_name}</Text>
                    </View>
                  )}
                  
                  {formData.last_name && (
                    <View className="flex-row">
                      <Text className="text-gray-600 font-medium w-32">Last Name:</Text>
                      <Text className="text-gray-800 flex-1">
                        {formData.last_name}
                        {isLoggedIn && <Text className="text-blue-600 text-xs ml-2">(Auto-filled)</Text>}
                      </Text>
                    </View>
                  )}
                  
                  {formData.email && (
                    <View className="flex-row">
                      <Text className="text-gray-600 font-medium w-32">Email:</Text>
                      <Text className="text-gray-800 flex-1">
                        {formData.email}
                        {isLoggedIn && <Text className="text-blue-600 text-xs ml-2">(Auto-filled)</Text>}
                      </Text>
                    </View>
                  )}
                  
                  {formData.phone && (
                    <View className="flex-row">
                      <Text className="text-gray-600 font-medium w-32">Phone:</Text>
                      <Text className="text-gray-800 flex-1">
                        {formData.phone}
                        {isLoggedIn && <Text className="text-blue-600 text-xs ml-2">(Auto-filled)</Text>}
                      </Text>
                    </View>
                  )}
                  
                  {formData.location && (
                    <View className="flex-row">
                      <Text className="text-gray-600 font-medium w-32">Location:</Text>
                      <Text className="text-gray-800 flex-1">
                        {formData.location}
                        {isLoggedIn && user?.city && formData.location === user.city && (
                          <Text className="text-blue-600 text-xs ml-2">(Auto-filled)</Text>
                        )}
                      </Text>
                    </View>
                  )}
                  
                  {formData.garage_id && (
                    <View className="flex-row">
                      <Text className="text-gray-600 font-medium w-32">Selected Garage:</Text>
                      <Text className="text-gray-800 flex-1">{getSelectedGarageName()}</Text>
                    </View>
                  )}
                  
                  {formData.experience && (
                    <View>
                      <Text className="text-gray-600 font-medium mb-1">Experience:</Text>
                      <Text className="text-gray-800 text-sm bg-white p-3 rounded-lg border border-gray-200">
                        {formData.experience.length > 100 
                          ? `${formData.experience.substring(0, 100)}...` 
                          : formData.experience}
                      </Text>
                    </View>
                  )}
                  
                  <View className="flex-row">
                    <Text className="text-gray-600 font-medium w-32">Terms Agreed:</Text>
                    <Text className={`font-medium ${formData.agreed_to_terms ? 'text-green-600' : 'text-red-600'}`}>
                      {formData.agreed_to_terms ? 'Yes' : 'No'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              className="bg-blue-600 rounded-xl py-4 items-center shadow-lg mb-8 active:opacity-90"
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text className="text-white font-bold text-lg">Submit Service Request</Text>
                  <Text className="text-blue-200 text-sm mt-1">
                    {isLoggedIn 
                      ? 'Your information is auto-filled from your profile' 
                      : 'Review your information before submitting'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Required Fields Note */}
            <View className="bg-gray-100 rounded-lg p-4 mb-6">
              <Text className="text-gray-600 text-center text-sm">
                Fields marked with <Text className="text-red-500">*</Text> are required
              </Text>
              <Text className="text-gray-500 text-center text-xs mt-1">
                {isLoggedIn 
                  ? 'Logged-in users benefit from auto-filled information' 
                  : 'Your data will be securely transmitted to the selected garage'}
              </Text>
            </View>

            {/* Footer Information */}
            <View className="items-center pb-10">
              <Text className="text-gray-500 text-center text-sm">
                Need help? Contact support at qfix910@gmail.com
              </Text>
              <Text className="text-gray-400 text-center text-xs mt-2">
                Connected to QuickFix Service Network
              </Text>
              <Text className="text-gray-400 text-center text-xs mt-1">
                © 2025 Auto Service Request System. All rights reserved.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RequestFormScreen;