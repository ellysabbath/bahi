// app/dashboard/bookings/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../context/ThemeContext';
import { useUser } from '../../../context/UserContext';

// API Configuration
const API_BASE_URL = 'https://AutoFix.pythonanywhere.com/api';

// Interfaces
interface Service {
  id: number;
  name: string;
  category: string;
  base_price: string;
  price?: string;
  description: string;
}

interface Garage {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
}

interface BookingData {
  garage_id: number;
  full_name: string;
  mobile_number: string;
  email: string;
  location: string;
  scheduled_date: string;
  notes: string;
  price: string;
  service_id?: number | null;
  custom_service_name?: string;
  custom_service_price?: string;
}

export default function BookingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const { user: contextUser, token: userToken, logout, isLoading: userLoading } = useUser();
  
  // Extract parameters
  const garageId = params.garageId as string || 
                   params.id as string || 
                   params.garage_id as string || '';
  const garageName = params.garageName ? decodeURIComponent(params.garageName as string) : 
                    params.name ? decodeURIComponent(params.name as string) : '';

  // Parse garage ID
  const parsedGarageId = parseInt(garageId);
  const isValidGarage = !isNaN(parsedGarageId) && parsedGarageId > 0;

  // State
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState({
    services: false,
    garage: false,
    auth: false
  });
  const [services, setServices] = useState<Service[]>([]);
  const [garage, setGarage] = useState<Garage | null>(null);
  const [user, setUser] = useState(contextUser);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(userToken);

  // Form fields
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [customService, setCustomService] = useState({
    name: '',
    price: ''
  });
  
  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
    location: '',
    scheduledDate: '',
    scheduledTime: '',
    notes: ''
  });

  // Modals
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookingNumber, setBookingNumber] = useState('');

  // Search
  const [serviceSearch, setServiceSearch] = useState('');

  // Theme colors
  const colors = {
    bg: theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50',
    card: theme === 'dark' ? 'bg-gray-800' : 'bg-white',
    text: theme === 'dark' ? 'text-gray-100' : 'text-gray-900',
    textSecondary: theme === 'dark' ? 'text-gray-400' : 'text-gray-600',
    border: theme === 'dark' ? 'border-gray-700' : 'border-gray-200',
    inputBg: theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50',
    placeholder: theme === 'dark' ? '#9ca3af' : '#6b7280',
  };

  // Check user and profile status
  useEffect(() => {
    if (contextUser) {
      setUser(contextUser);
      setIsAuthenticated(true);
      
      // Check if profile is complete
      const hasName = contextUser.first_name && contextUser.last_name;
      const hasPhone = contextUser.phone;
      const isComplete = Boolean(hasName && hasPhone);
      setIsProfileComplete(isComplete);
      
      // Set form data from user profile
      setFormData(prev => ({
        ...prev,
        fullName: hasName ? `${contextUser.first_name} ${contextUser.last_name}`.trim() : '',
        mobileNumber: contextUser.phone || '',
        email: contextUser.email || '',
      }));
    } else {
      setIsAuthenticated(false);
      setUser(null);
      setIsProfileComplete(false);
    }
  }, [contextUser]);

  // Update auth token from UserContext
  useEffect(() => {
    if (userToken) {
      setAuthToken(userToken);
      console.log('Token from UserContext:', userToken.substring(0, 20) + '...');
    }
  }, [userToken]);

  // Get auth token from multiple sources
  const getAuthToken = async (): Promise<string | null> => {
    try {
      // First, use the token from UserContext
      if (authToken && authToken.trim() !== '') {
        console.log('Using token from UserContext state');
        return authToken;
      }

      // Check UserContext token
      if (userToken && userToken.trim() !== '') {
        console.log('Using token from useUser hook');
        return userToken;
      }

      // Check AsyncStorage (fallback)
      const possibleKeys = ['@autofix_token', 'userToken', 'token', 'authToken'];
      
      for (const key of possibleKeys) {
        const token = await AsyncStorage.getItem(key);
        if (token && token.trim() !== '' && token !== 'null' && token !== 'undefined') {
          console.log(`Found token in storage key: ${key}`);
          return token;
        }
      }

      console.log('No auth token found in any source');
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  // Fetch garage details
  const fetchGarageDetails = useCallback(async () => {
    if (!isValidGarage) return;
    
    try {
      setFetching(prev => ({ ...prev, garage: true }));
      const response = await fetch(`${API_BASE_URL}/garages/${parsedGarageId}/`);
      
      if (response.ok) {
        const data = await response.json();
        setGarage(data);
      } else {
        Alert.alert('Error', 'Failed to load garage details.');
      }
    } catch (error) {
      console.error('Error fetching garage:', error);
      Alert.alert('Error', 'Network error loading garage details.');
    } finally {
      setFetching(prev => ({ ...prev, garage: false }));
    }
  }, [isValidGarage, parsedGarageId]);

  // Fetch services
  const fetchServices = useCallback(async () => {
    try {
      setFetching(prev => ({ ...prev, services: true }));
      const response = await fetch(`${API_BASE_URL}/services/`);
      
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      } else {
        Alert.alert('Error', 'Failed to load services.');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      Alert.alert('Error', 'Network error loading services.');
    } finally {
      setFetching(prev => ({ ...prev, services: false }));
    }
  }, []);

  // Initial load
  useEffect(() => {
    const initialize = async () => {
      if (!isValidGarage) {
        Alert.alert(
          'Garage Required',
          'Please select a garage first.',
          [
            { text: 'Browse Garages', onPress: () => router.push('/dashboard/garages') },
            { text: 'Go Back', style: 'cancel', onPress: () => router.back() }
          ]
        );
        return;
      }

      await fetchGarageDetails();
      await fetchServices();
    };

    initialize();
  }, [isValidGarage, router, fetchGarageDetails, fetchServices]);

  // Format currency
  const formatCurrency = (amount: string | number, showSymbol = true): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return showSymbol ? 'Tzs/= 0.00' : '0.00';
    
    const formatted = new Intl.NumberFormat('en-TZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
    
    return showSymbol ? `Tzs/= ${formatted}` : formatted;
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!isValidGarage) {
      Alert.alert('Error', 'No garage selected.');
      return false;
    }

    if (!isAuthenticated || !user) {
      setShowAuthModal(true);
      return false;
    }

    if (!isProfileComplete) {
      Alert.alert(
        'Profile Incomplete',
        'Please complete your profile information before booking.',
        [
          { text: 'Complete Profile', onPress: () => router.push('/dashboard/profile') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return false;
    }

    if (!formData.fullName.trim()) {
      Alert.alert('Error', 'Full name is required.');
      return false;
    }

    if (!formData.mobileNumber.trim()) {
      Alert.alert('Error', 'Mobile number is required.');
      return false;
    }

    // Phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(formData.mobileNumber.replace(/\s/g, ''))) {
      Alert.alert('Error', 'Please enter a valid phone number.');
      return false;
    }

    if (!selectedService && !customService.name.trim()) {
      Alert.alert('Error', 'Please select or describe a service.');
      return false;
    }

    // Email validation
    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return false;
    }

    // Date validation
    if (formData.scheduledDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.scheduledDate)) {
        Alert.alert('Error', 'Please enter date in YYYY-MM-DD format.');
        return false;
      }

      const selectedDate = new Date(formData.scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        Alert.alert('Error', 'Please select a future date.');
        return false;
      }
    }

    // Time validation
    if (formData.scheduledTime) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(formData.scheduledTime)) {
        Alert.alert('Error', 'Please enter time in HH:MM format (24-hour).');
        return false;
      }
    }

    return true;
  };

  // Prepare booking data
  const prepareBookingData = (): BookingData => {
    const scheduledDateTime = new Date();
    
    if (formData.scheduledDate) {
      scheduledDateTime.setTime(new Date(formData.scheduledDate).getTime());
      if (formData.scheduledTime) {
        const [hours, minutes] = formData.scheduledTime.split(':').map(Number);
        scheduledDateTime.setHours(hours, minutes, 0, 0);
      } else {
        scheduledDateTime.setHours(9, 0, 0, 0);
      }
    } else {
      scheduledDateTime.setDate(scheduledDateTime.getDate() + 1);
      scheduledDateTime.setHours(9, 0, 0, 0);
    }

    const bookingData: BookingData = {
      garage_id: parsedGarageId,
      full_name: formData.fullName.trim(),
      mobile_number: formData.mobileNumber.trim(),
      email: formData.email.trim(),
      location: formData.location.trim(),
      scheduled_date: scheduledDateTime.toISOString(),
      notes: formData.notes.trim(),
      price: '0.00',
    };

    if (selectedService) {
      bookingData.service_id = selectedService.id;
      bookingData.price = selectedService.price || selectedService.base_price;
    } else {
      bookingData.service_id = null;
      bookingData.custom_service_name = customService.name.trim();
      if (customService.price.trim()) {
        const price = parseFloat(customService.price);
        if (!isNaN(price)) {
          bookingData.custom_service_price = price.toFixed(2);
          bookingData.price = price.toFixed(2);
        }
      }
    }

    return bookingData;
  };

  // Submit booking
  const submitBooking = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Get auth token
      const token = await getAuthToken();
      
      if (!token) {
        Alert.alert(
          'Authentication Required',
          'Please login to book a service.',
          [
            { text: 'Login', onPress: () => router.push('/login') },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        setLoading(false);
        return;
      }

      const bookingData = prepareBookingData();
      
      console.log('Submitting booking with token:', token.substring(0, 20) + '...');
      console.log('Booking data:', bookingData);

      const response = await fetch(`${API_BASE_URL}/bookings/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      // Handle response
      if (response.status === 401) {
        // Token expired or invalid
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [
            { 
              text: 'Login', 
              onPress: async () => {
                await logout();
                router.push('/login');
              }
            }
          ]
        );
        setLoading(false);
        return;
      }

      let responseData;
      try {
        responseData = await response.json();
      } catch {
        responseData = { error: 'Invalid response from server' };
      }

      if (response.ok) {
        const bookingNum = responseData.booking_number || 
                          responseData.booking?.booking_number || 
                          `BK-${Date.now()}`;
        
        setBookingNumber(bookingNum);
        setShowSuccessModal(true);
      } else {
        let errorMsg = 'Booking failed. Please try again.';
        
        if (responseData.detail) {
          errorMsg = responseData.detail;
        } else if (responseData.error) {
          errorMsg = responseData.error;
        } else if (responseData.non_field_errors) {
          errorMsg = Array.isArray(responseData.non_field_errors) 
            ? responseData.non_field_errors.join(', ') 
            : responseData.non_field_errors;
        }
        
        Alert.alert('Booking Error', errorMsg);
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      
      if (error.message?.includes('Network request failed')) {
        Alert.alert('Network Error', 'Please check your internet connection and try again.');
      } else {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedService(null);
    setCustomService({ name: '', price: '' });
    setFormData({
      fullName: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '',
      mobileNumber: user?.phone || '',
      email: user?.email || '',
      location: '',
      scheduledDate: '',
      scheduledTime: '',
      notes: ''
    });
  };

  // Navigation handlers
  const handleAddAnother = () => {
    resetForm();
    setShowSuccessModal(false);
    setBookingNumber('');
  };

  const handleDone = () => {
    resetForm();
    setShowSuccessModal(false);
    router.back();
  };

  const handleLogin = () => {
    setShowAuthModal(false);
    router.push('/login');
  };

  const handleRegister = () => {
    setShowAuthModal(false);
    router.push('/register');
  };

  const handleCompleteProfile = () => {
    setShowAuthModal(false);
    router.push('/dashboard/profile');
  };

  // Filter services
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
    service.category.toLowerCase().includes(serviceSearch.toLowerCase()) ||
    (service.description && service.description.toLowerCase().includes(serviceSearch.toLowerCase()))
  );

  // Get tomorrow's date for placeholder
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return 'Guest';
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    if (user.first_name) return user.first_name;
    if (user.last_name) return user.last_name;
    return user.email?.split('@')[0] || 'User';
  };

  // Get user status color
  const getUserStatusColor = () => {
    if (!isAuthenticated) return '#ef4444';
    if (!isProfileComplete) return '#f59e0b';
    return '#10b981';
  };

  // Get user status text
  const getUserStatusText = () => {
    if (!isAuthenticated) return 'Login Required';
    if (!isProfileComplete) return 'Complete Profile';
    return 'Ready to Book';
  };

  // Render service modal
  const renderServiceModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showServiceModal}
      onRequestClose={() => setShowServiceModal(false)}
    >
      <SafeAreaView className="flex-1 bg-black/50">
        <TouchableWithoutFeedback onPress={() => setShowServiceModal(false)}>
          <View className="flex-1 justify-end">
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View className={`max-h-3/4 ${colors.card} rounded-t-3xl overflow-hidden`}>
                <View className="p-5 border-b border-gray-200 dark:border-gray-700">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className={`text-xl font-bold ${colors.text}`}>
                      Select Service
                    </Text>
                    <TouchableOpacity onPress={() => setShowServiceModal(false)}>
                      <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                  
                  <View className="relative">
                    <TextInput
                      className={`${colors.inputBg} rounded-xl px-4 py-3 pl-10 ${colors.text} border ${colors.border}`}
                      placeholder="Search services..."
                      placeholderTextColor={colors.placeholder}
                      value={serviceSearch}
                      onChangeText={setServiceSearch}
                    />
                    <Ionicons 
                      name="search" 
                      size={20} 
                      color={colors.placeholder} 
                      style={{ position: 'absolute', left: 12, top: 14 }}
                    />
                    {serviceSearch.length > 0 && (
                      <TouchableOpacity
                        style={{ position: 'absolute', right: 12, top: 14 }}
                        onPress={() => setServiceSearch('')}
                      >
                        <Ionicons name="close-circle" size={20} color={colors.placeholder} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <ScrollView className="p-4">
                  {fetching.services ? (
                    <View className="py-8 items-center">
                      <ActivityIndicator size="large" color="#3b82f6" />
                      <Text className={`${colors.text} mt-4`}>Loading services...</Text>
                    </View>
                  ) : filteredServices.length > 0 ? (
                    <View className="space-y-3">
                      {filteredServices.map(service => (
                        <TouchableOpacity
                          key={service.id}
                          className={`p-4 rounded-xl border ${colors.border} ${
                            selectedService?.id === service.id
                              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500'
                              : 'bg-transparent'
                          }`}
                          onPress={() => {
                            setSelectedService(service);
                            setCustomService({ name: '', price: '' });
                            setShowServiceModal(false);
                          }}
                        >
                          <View className="flex-row justify-between items-start">
                            <View style={{ flex: 1, marginRight: 16 }}>
                              <Text className={`font-bold ${colors.text}`}>
                                {service.name}
                              </Text>
                              <Text className={`text-sm ${colors.textSecondary} mt-1`}>
                                {service.category}
                              </Text>
                              {service.description && (
                                <Text className={`text-sm ${colors.textSecondary} mt-1`}>
                                  {service.description.length > 80
                                    ? `${service.description.substring(0, 80)}...`
                                    : service.description
                                  }
                                </Text>
                              )}
                            </View>
                            <Text className={`font-bold ${colors.text}`}>
                              {formatCurrency(service.price || service.base_price)}
                            </Text>
                          </View>
                          {selectedService?.id === service.id && (
                            <View className="flex-row items-center mt-2">
                              <Ionicons name="checkmark-circle" size={16} color="#3b82f6" />
                              <Text className="text-blue-500 text-sm ml-1">Selected</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}

                      <TouchableOpacity
                        className={`p-4 rounded-xl border ${colors.border} ${
                          customService.name
                            ? 'bg-green-50 dark:bg-green-900/30 border-green-500'
                            : 'bg-transparent'
                        }`}
                        onPress={() => {
                          setSelectedService(null);
                          setShowServiceModal(false);
                        }}
                      >
                        <View className="flex-row items-center">
                          <Ionicons
                            name="add-circle"
                            size={24}
                            color={customService.name ? '#10b981' : colors.textSecondary}
                          />
                          <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text className={`font-bold ${colors.text}`}>
                              Custom Service
                            </Text>
                            <Text className={`text-sm ${colors.textSecondary} mt-1`}>
                              Request a service not listed above
                            </Text>
                          </View>
                          {customService.name && (
                            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                          )}
                        </View>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View className="py-8 items-center">
                      <Ionicons name="construct-outline" size={64} color={colors.textSecondary} />
                      <Text className={`${colors.text} text-lg mt-4`}>
                        {serviceSearch ? 'No services found' : 'No services available'}
                      </Text>
                      <Text className={`${colors.textSecondary} text-center mt-2`}>
                        {serviceSearch
                          ? 'Try a different search term'
                          : 'Enter a custom service below'
                        }
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </Modal>
  );

  // Render auth modal
  const renderAuthModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showAuthModal}
      onRequestClose={() => setShowAuthModal(false)}
    >
      <View className="flex-1 bg-black/70 justify-center items-center p-4">
        <View className={`${colors.card} rounded-2xl p-6 w-full max-w-md`}>
          <View className="items-center mb-6">
            <View 
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: isAuthenticated ? '#f59e0b20' : '#ef444420' }}
            >
              <Ionicons 
                name={isAuthenticated ? "person-circle-outline" : "log-in-outline"} 
                size={48} 
                color={isAuthenticated ? "#f59e0b" : "#ef4444"} 
              />
            </View>
            <Text className={`text-2xl font-bold ${colors.text} mb-2`}>
              {isAuthenticated ? 'Complete Profile' : 'Login Required'}
            </Text>
            <Text className={`text-sm ${colors.textSecondary} text-center`}>
              {isAuthenticated 
                ? 'Please complete your profile information to book services'
                : 'You need to log in to book a service'
              }
            </Text>
          </View>

          <View className="space-y-3">
            {isAuthenticated ? (
              <TouchableOpacity
                className="bg-blue-600 rounded-xl py-4 items-center"
                onPress={handleCompleteProfile}
              >
                <Text className="text-white font-bold text-lg">Complete Profile</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  className="bg-blue-600 rounded-xl py-4 items-center"
                  onPress={handleLogin}
                >
                  <Text className="text-white font-bold text-lg">Login</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-green-600 rounded-xl py-4 items-center"
                  onPress={handleRegister}
                >
                  <Text className="text-white font-bold text-lg">Create Account</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              className="bg-gray-200 dark:bg-gray-700 rounded-xl py-4 items-center"
              onPress={() => {
                setShowAuthModal(false);
                router.back();
              }}
            >
              <Text className="text-gray-800 dark:text-gray-200 font-bold text-lg">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render success modal
  const renderSuccessModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showSuccessModal}
      onRequestClose={handleDone}
    >
      <View className="flex-1 bg-black/70 justify-center items-center p-4">
        <View className={`${colors.card} rounded-2xl p-6 w-full max-w-md`}>
          <View className="items-center mb-6">
            <View className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mb-4">
              <Ionicons name="checkmark-circle" size={48} color="#10b981" />
            </View>
            <Text className={`text-2xl font-bold ${colors.text} mb-2`}>
              Booking Confirmed!
            </Text>
            <Text className={`text-sm ${colors.textSecondary} text-center`}>
              Your booking has been successfully submitted
            </Text>
          </View>

          <View className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} rounded-xl p-4 mb-6`}>
            <View className="flex-row justify-between mb-3">
              <Text className={`text-sm ${colors.textSecondary}`}>Booking #:</Text>
              <Text className={`font-bold ${colors.text}`}>{bookingNumber}</Text>
            </View>
            <View className="flex-row justify-between mb-3">
              <Text className={`text-sm ${colors.textSecondary}`}>Garage:</Text>
              <Text className={`font-bold ${colors.text}`}>{garage?.name || garageName}</Text>
            </View>
            <View className="flex-row justify-between mb-3">
              <Text className={`text-sm ${colors.textSecondary}`}>Service:</Text>
              <Text className={`font-bold ${colors.text}`}>
                {selectedService ? selectedService.name : customService.name}
              </Text>
            </View>
            {selectedService && (
              <View className="flex-row justify-between mb-3">
                <Text className={`text-sm ${colors.textSecondary}`}>Price:</Text>
                <Text className={`font-bold ${colors.text}`}>
                  {formatCurrency(selectedService.price || selectedService.base_price)}
                </Text>
              </View>
            )}
            {customService.price && !selectedService && (
              <View className="flex-row justify-between mb-3">
                <Text className={`text-sm ${colors.textSecondary}`}>Estimated:</Text>
                <Text className={`font-bold ${colors.text}`}>
                  {formatCurrency(customService.price)}
                </Text>
              </View>
            )}
          </View>

          <View className="space-y-3">
            <TouchableOpacity
              className="bg-blue-600 rounded-xl py-4 items-center"
              onPress={handleAddAnother}
            >
              <View className="flex-row items-center">
                <Ionicons name="add-circle-outline" size={24} color="white" />
                <Text className="text-white font-bold text-lg ml-2">Add Another</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-gray-200 dark:bg-gray-700 rounded-xl py-4 items-center"
              onPress={handleDone}
            >
              <Text className="text-gray-800 dark:text-gray-200 font-bold text-lg">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Loading state
  if (userLoading) {
    return (
      <SafeAreaView className={`flex-1 ${colors.bg} pt-10`}>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className={`${colors.text} mt-4`}>Loading user data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Invalid garage state
  if (!isValidGarage) {
    return (
      <SafeAreaView className={`flex-1 ${colors.bg} pt-10`}>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
        <View className="flex-1 justify-center items-center p-6">
          <Ionicons name="car-outline" size={64} color={colors.textSecondary} />
          <Text className={`text-xl font-bold ${colors.text} mt-4 mb-2`}>
            No Garage Selected
          </Text>
          <Text className={`${colors.textSecondary} text-center mb-6`}>
            Please select a garage to book a service.
          </Text>
          <TouchableOpacity
            className="px-6 py-3 bg-blue-600 rounded-lg mb-3"
            onPress={() => router.push('/dashboard/garages')}
          >
            <Text className="text-white font-bold">Browse Garages</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg"
            onPress={() => router.back()}
          >
            <Text className={colors.text}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={`flex-1 ${colors.bg}`}
    >
      <SafeAreaView className="flex-1 pt-10">
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

        {/* Header */}
        <View className={`px-4 pt-6 pb-4 border-b ${colors.border}`}>
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
              <Ionicons 
                name="arrow-back" 
                size={24} 
                color={theme === 'dark' ? '#fff' : '#000'} 
              />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className={`text-xl font-bold ${colors.text}`}>
                Book Service
              </Text>
              {fetching.garage ? (
                <View className="flex-row items-center mt-1">
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                  <Text className={`text-sm ${colors.textSecondary} ml-2`}>
                    Loading garage...
                  </Text>
                </View>
              ) : (
                <Text className={`text-sm ${colors.textSecondary} mt-1`}>
                  {garage?.name || garageName}
                </Text>
              )}
            </View>
            
            {/* User Status */}
            <TouchableOpacity
              className="px-3 py-1 rounded-full"
              style={{ 
                backgroundColor: isAuthenticated 
                  ? isProfileComplete 
                    ? '#10b98120' 
                    : '#f59e0b20'
                  : '#ef444420'
              }}
              onPress={() => router.push('/dashboard/profile')}
            >
              <Text 
                className="text-sm font-medium"
                style={{ 
                  color: isAuthenticated 
                    ? isProfileComplete 
                      ? '#10b981' 
                      : '#f59e0b'
                    : '#ef4444'
                }}
              >
                {getUserStatusText()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Warning */}
        {(!isAuthenticated || !isProfileComplete) && (
          <View 
            className="px-4 py-3"
            style={{ 
              backgroundColor: theme === 'dark' 
                ? (!isAuthenticated ? '#ef444420' : '#f59e0b20')
                : (!isAuthenticated ? '#fee2e2' : '#fef3c7')
            }}
          >
            <View className="flex-row items-center">
              <Ionicons 
                name="alert-circle" 
                size={20} 
                color={!isAuthenticated ? '#ef4444' : '#f59e0b'} 
              />
              <Text 
                className="ml-2 flex-1"
                style={{ 
                  color: theme === 'dark' 
                    ? (!isAuthenticated ? '#fca5a5' : '#fbbf24')
                    : (!isAuthenticated ? '#dc2626' : '#92400e')
                }}
              >
                {!isAuthenticated 
                  ? 'Login required to book. '
                  : 'Complete your profile to book. '
                }
                <Text 
                  className="font-semibold"
                  onPress={() => {
                    if (!isAuthenticated) setShowAuthModal(true);
                    else router.push('/dashboard/profile');
                  }}
                  style={{ color: '#3b82f6' }}
                >
                  {!isAuthenticated ? 'Login Now' : 'Complete Profile'}
                </Text>
              </Text>
            </View>
          </View>
        )}

        {/* Form */}
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className={`${colors.card} rounded-xl p-6 border ${colors.border} mb-6`}>
            <Text className={`text-xl font-bold ${colors.text} mb-6`}>
              Booking Details
            </Text>

            {/* User Status Card */}
            <View 
              className="mb-6 p-4 rounded-lg"
              style={{ 
                backgroundColor: theme === 'dark' 
                  ? (isAuthenticated && isProfileComplete ? '#10b98120' : '#f59e0b20')
                  : (isAuthenticated && isProfileComplete ? '#d1fae5' : '#fef3c7')
              }}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name={isAuthenticated 
                    ? (isProfileComplete ? "checkmark-circle" : "information-circle")
                    : "alert-circle"
                  }
                  size={20}
                  color={isAuthenticated 
                    ? (isProfileComplete ? "#10b981" : "#f59e0b")
                    : "#ef4444"
                  }
                />
                <Text 
                  className="ml-3 flex-1"
                  style={{ 
                    color: isAuthenticated 
                      ? (isProfileComplete ? '#065f46' : '#92400e')
                      : '#991b1b'
                  }}
                >
                  {isAuthenticated 
                    ? (isProfileComplete
                      ? `Booking as: ${getUserDisplayName()}`
                      : 'Please complete your profile information')
                    : 'Please login to book services'
                  }
                </Text>
                {!isAuthenticated ? (
                  <TouchableOpacity onPress={() => setShowAuthModal(true)}>
                    <Text className="text-blue-600 dark:text-blue-400 font-semibold">
                      Login
                    </Text>
                  </TouchableOpacity>
                ) : !isProfileComplete && (
                  <TouchableOpacity onPress={() => router.push('/dashboard/profile')}>
                    <Text className="text-blue-600 dark:text-blue-400 font-semibold">
                      Complete
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Full Name */}
            <View className="mb-5">
              <View className="flex-row justify-between items-center mb-2">
                <Text className={`text-sm font-medium ${colors.text}`}>
                  Full Name *
                </Text>
                {!isProfileComplete && (
                  <TouchableOpacity onPress={() => router.push('/dashboard/profile')}>
                    <Text className="text-blue-600 dark:text-blue-400 text-xs">
                      Update in Profile
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View 
                className={`border ${colors.border} rounded-xl px-4 py-3 ${colors.inputBg} ${
                  !(isAuthenticated && isProfileComplete) ? 'opacity-50' : ''
                }`}
              >
                <Text className={`${colors.text} ${!formData.fullName ? 'opacity-70 italic' : ''}`}>
                  {formData.fullName || 'Not set in profile'}
                </Text>
              </View>
              {!formData.fullName && (
                <Text className="text-red-500 text-xs mt-1">
                  Please complete your name in your profile
                </Text>
              )}
            </View>

            {/* Mobile Number */}
            <View className="mb-5">
              <View className="flex-row justify-between items-center mb-2">
                <Text className={`text-sm font-medium ${colors.text}`}>
                  Mobile Number *
                </Text>
                {!isProfileComplete && (
                  <TouchableOpacity onPress={() => router.push('/dashboard/profile')}>
                    <Text className="text-blue-600 dark:text-blue-400 text-xs">
                      Update in Profile
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View 
                className={`border ${colors.border} rounded-xl px-4 py-3 ${colors.inputBg} ${
                  !(isAuthenticated && isProfileComplete) ? 'opacity-50' : ''
                }`}
              >
                <Text className={`${colors.text} ${!formData.mobileNumber ? 'opacity-70 italic' : ''}`}>
                  {formData.mobileNumber || 'Not set in profile'}
                </Text>
              </View>
              {!formData.mobileNumber && (
                <Text className="text-red-500 text-xs mt-1">
                  Please add your phone number in your profile
                </Text>
              )}
            </View>

            {/* Email */}
            <View className="mb-5">
              <View className="flex-row justify-between items-center mb-2">
                <Text className={`text-sm font-medium ${colors.text}`}>
                  Email
                </Text>
                {!isProfileComplete && (
                  <TouchableOpacity onPress={() => router.push('/dashboard/profile')}>
                    <Text className="text-blue-600 dark:text-blue-400 text-xs">
                      Update in Profile
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View 
                className={`border ${colors.border} rounded-xl px-4 py-3 ${colors.inputBg} ${
                  !(isAuthenticated && isProfileComplete) ? 'opacity-50' : ''
                }`}
              >
                <Text className={`${colors.text} ${!formData.email ? 'opacity-70 italic' : ''}`}>
                  {formData.email || 'Not set in profile'}
                </Text>
              </View>
            </View>

            {/* Service Selection */}
            <View className="mb-5">
              <Text className={`text-sm font-medium ${colors.text} mb-2`}>
                Service *
              </Text>
              <TouchableOpacity
                className={`border ${colors.border} rounded-xl px-4 py-3 flex-row justify-between items-center ${colors.inputBg} ${
                  !(isAuthenticated && isProfileComplete && !fetching.services) ? 'opacity-50' : ''
                }`}
                onPress={() => {
                  if (isAuthenticated && isProfileComplete && !fetching.services) {
                    setShowServiceModal(true);
                  }
                }}
                disabled={!(isAuthenticated && isProfileComplete && !fetching.services)}
              >
                <View className="flex-1">
                  {selectedService ? (
                    <>
                      <Text className={`font-medium ${colors.text}`}>
                        {selectedService.name}
                      </Text>
                      <Text className={`text-sm ${colors.textSecondary}`}>
                        {formatCurrency(selectedService.price || selectedService.base_price)}
                      </Text>
                    </>
                  ) : customService.name ? (
                    <>
                      <Text className={`font-medium ${colors.text}`}>
                        {customService.name}
                      </Text>
                      {customService.price && (
                        <Text className={`text-sm ${colors.textSecondary}`}>
                          {formatCurrency(customService.price)}
                        </Text>
                      )}
                    </>
                  ) : (
                    <Text style={{ color: colors.placeholder }}>
                      {fetching.services ? 'Loading services...' : 'Select service'}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Custom Service Fields */}
              {!selectedService && isAuthenticated && isProfileComplete && (
                <View style={{ marginTop: 16, gap: 16 }}>
                  <View>
                    <Text className={`text-sm font-medium ${colors.text} mb-2`}>
                      Custom Service Description
                    </Text>
                    <TextInput
                      className={`border ${colors.border} rounded-xl px-4 py-3 ${colors.text} ${colors.inputBg}`}
                      placeholder="Describe your service needs"
                      placeholderTextColor={colors.placeholder}
                      value={customService.name}
                      onChangeText={(text) => setCustomService(prev => ({ ...prev, name: text }))}
                    />
                  </View>

                  <View>
                    <Text className={`text-sm font-medium ${colors.text} mb-2`}>
                      Estimated Price (Optional)
                    </Text>
                    <TextInput
                      className={`border ${colors.border} rounded-xl px-4 py-3 ${colors.text} ${colors.inputBg}`}
                      placeholder="Enter estimated price"
                      placeholderTextColor={colors.placeholder}
                      value={customService.price}
                      onChangeText={(text) => setCustomService(prev => ({ ...prev, price: text }))}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Location */}
            <View className="mb-5">
              <Text className={`text-sm font-medium ${colors.text} mb-2`}>
                Location
              </Text>
              <TextInput
                className={`border ${colors.border} rounded-xl px-4 py-3 ${colors.text} ${colors.inputBg} ${
                  !(isAuthenticated && isProfileComplete) ? 'opacity-50' : ''
                }`}
                placeholder="Where do you need the service?"
                placeholderTextColor={colors.placeholder}
                value={formData.location}
                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                editable={isAuthenticated && isProfileComplete}
              />
            </View>

            {/* Date & Time */}
            <View className="mb-5">
              <Text className={`text-sm font-medium ${colors.text} mb-2`}>
                Preferred Date & Time
              </Text>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    className={`border ${colors.border} rounded-xl px-4 py-3 ${colors.text} ${colors.inputBg} ${
                      !(isAuthenticated && isProfileComplete) ? 'opacity-50' : ''
                    }`}
                    placeholder={getTomorrowDate()}
                    placeholderTextColor={colors.placeholder}
                    value={formData.scheduledDate}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, scheduledDate: text }))}
                    editable={isAuthenticated && isProfileComplete}
                  />
                  <Text className={`text-xs ${colors.textSecondary} mt-1`}>Date (YYYY-MM-DD)</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    className={`border ${colors.border} rounded-xl px-4 py-3 ${colors.text} ${colors.inputBg} ${
                      !(isAuthenticated && isProfileComplete) ? 'opacity-50' : ''
                    }`}
                    placeholder="09:00"
                    placeholderTextColor={colors.placeholder}
                    value={formData.scheduledTime}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, scheduledTime: text }))}
                    editable={isAuthenticated && isProfileComplete}
                  />
                  <Text className={`text-xs ${colors.textSecondary} mt-1`}>Time (HH:MM)</Text>
                </View>
              </View>
            </View>

            {/* Notes */}
            <View className="mb-6">
              <Text className={`text-sm font-medium ${colors.text} mb-2`}>
                Additional Notes
              </Text>
              <TextInput
                className={`border ${colors.border} rounded-xl px-4 py-3 ${colors.text} ${colors.inputBg} min-h-[100px] ${
                  !(isAuthenticated && isProfileComplete) ? 'opacity-50' : ''
                }`}
                placeholder="Any special instructions or requirements"
                placeholderTextColor={colors.placeholder}
                value={formData.notes}
                onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                multiline
                textAlignVertical="top"
                editable={isAuthenticated && isProfileComplete}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              className={`rounded-xl py-4 items-center ${
                isAuthenticated && isProfileComplete && !loading
                  ? 'bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-700'
              }`}
              onPress={() => {
                if (isAuthenticated && isProfileComplete && !loading) {
                  submitBooking();
                } else if (!isAuthenticated) {
                  setShowAuthModal(true);
                } else {
                  router.push('/dashboard/profile');
                }
              }}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className={`font-bold text-lg ${
                  isAuthenticated && isProfileComplete && !loading 
                    ? 'text-white' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {isAuthenticated 
                    ? (isProfileComplete 
                      ? 'Submit Booking' 
                      : 'Complete Profile to Book'
                      )
                    : 'Login to Book'
                  }
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Info Note */}
          <View className="mb-8 px-2">
            <Text className={`text-sm ${colors.textSecondary} text-center`}>
              This is a booking request. The garage will contact you for confirmation.
            </Text>
          </View>
        </ScrollView>

        {/* Modals */}
        {renderServiceModal()}
        {renderAuthModal()}
        {renderSuccessModal()}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}