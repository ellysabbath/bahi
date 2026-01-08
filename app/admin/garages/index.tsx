// app/admin/garages/index.tsx
import {
  FontAwesome5,
  Ionicons
} from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface Garage {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  rating: number | string;
  rating_count: number | string;
  is_open: boolean;
  delivery_available: boolean;
  estimated_time: string;
  services: string[];
  latitude?: string | null;
  longitude?: string | null;
  opening_hours?: any;
  is_verified: boolean;
  is_active: boolean;
  city: string;
  created_at: string;
  updated_at: string;
  owner?: number | null;
  total_bookings?: number;
}

interface GarageApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Garage[];
}

interface FormData {
  name: string;
  address: string;
  phone: string;
  email: string;
  rating: string;
  rating_count: string;
  is_open: boolean;
  delivery_available: boolean;
  estimated_time: string;
  services: string;
  latitude: string;
  longitude: string;
  opening_hours: string;
  city: string;
}

export default function GaragesManagement() {
  const [garages, setGarages] = useState<Garage[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingGarage, setEditingGarage] = useState<Garage | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState<number | null>(null);
  const [showConfirmStatus, setShowConfirmStatus] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<string>('');
  const [showActionMessage, setShowActionMessage] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalGarages, setTotalGarages] = useState(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: '',
    phone: '',
    email: '',
    rating: '0',
    rating_count: '0',
    is_open: true,
    delivery_available: false,
    estimated_time: '15-30 mins',
    services: '',
    latitude: '',
    longitude: '',
    opening_hours: JSON.stringify({
      monday: '9:00 AM - 6:00 PM',
      tuesday: '9:00 AM - 6:00 PM',
      wednesday: '9:00 AM - 6:00 PM',
      thursday: '9:00 AM - 6:00 PM',
      friday: '9:00 AM - 6:00 PM',
      saturday: '10:00 AM - 4:00 PM',
      sunday: 'Closed'
    }, null, 2),
    city: ''
  });

  const { theme } = useTheme();
  const router = useRouter();

  // Theme colors
  const isDark = theme === 'dark';
  const bgColor = isDark ? 'bg-gray-900' : 'bg-gray-50';
  const textColor = isDark ? 'text-gray-100' : 'text-gray-900';
  const textSecondaryColor = isDark ? 'text-gray-400' : 'text-gray-600';
  const cardColor = isDark ? 'bg-gray-800' : 'bg-white';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';
  const inputBgColor = isDark ? 'bg-gray-700' : 'bg-gray-100';
  const inputTextColor = isDark ? 'text-gray-100' : 'text-gray-800';
  const errorColor = isDark ? 'text-red-400' : 'text-red-600';
  const primaryColor = '#3b82f6';

  // Base URL - adjust to match your Django server
  const BASE_URL = 'https://AutoFix.pythonanywhere.com';

  // API endpoints - using your open endpoint
  const API_ENDPOINTS = {
    GARAGES: `${BASE_URL}/api/garages/`,
    GARAGE_DETAIL: (id: number) => `${BASE_URL}/api/garages/${id}/`,
  };

  // Enhanced fetch helper that handles different response types
  const apiFetch = async (url: string, options: RequestInit = {}) => {
    try {
      console.log(`🌐 ${options.method || 'GET'} ${url}`);
      
      const defaultHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      console.log(`📊 Response status: ${response.status}`);
      
      // Handle 204 No Content (DELETE success)
      if (response.status === 204) {
        console.log('✅ DELETE successful (204 No Content)');
        return {
          success: true,
          data: null,
          status: response.status,
          message: 'Successfully deleted'
        };
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error text:', errorText);
        
        // Try to parse error message
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          if (errorText) {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorJson.error || errorMessage;
          }
        } catch {}
        
        throw new Error(errorMessage);
      }

      // Try to parse JSON, but handle empty responses
      const text = await response.text();
      let data = null;
      
      if (text && text.trim() !== '') {
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error('❌ JSON Parse error:', parseError);
          console.log('📝 Raw response:', text);
          throw new Error('Invalid JSON response');
        }
      }
      
      return {
        success: true,
        data: data,
        status: response.status,
      };
    } catch (error: any) {
      console.error('❌ API Error:', error.message || error);
      return {
        success: false,
        message: error.message || 'Network error',
        error: error,
      };
    }
  };

  // Helper function to safely parse rating
  const parseRating = (rating: number | string | undefined): number => {
    if (rating === undefined || rating === null) return 0;
    
    if (typeof rating === 'string') {
      const parsed = parseFloat(rating);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    return rating;
  };

  // Fetch garages from API
  const fetchGarages = async (pageNum: number = 1, isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }
      
      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        page_size: '20', // Display more items per page
      });
      
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      
      const url = `${API_ENDPOINTS.GARAGES}?${queryParams}`;
      console.log('📡 Fetching garages from:', url);
      
      const response = await apiFetch(url);
      
      if (response.success && response.data) {
        const apiData = response.data as GarageApiResponse;
        const results = apiData.results || [];
        
        console.log(`📊 Found ${results.length} garages, total: ${apiData.count}`);
        
        if (!Array.isArray(results)) {
          console.error('❌ Results is not an array:', results);
          throw new Error('Invalid response format');
        }
        
        // Parse ratings from string to number when fetching
        const formattedGarages = results.map(garage => ({
          ...garage,
          services: garage.services || [],
          rating: parseRating(garage.rating),
          rating_count: typeof garage.rating_count === 'string' 
            ? parseInt(garage.rating_count) || 0 
            : garage.rating_count || 0,
          latitude: garage.latitude || '',
          longitude: garage.longitude || '',
          // Ensure city is always a string (not null or undefined)
          city: garage.city || 'Unknown',
        }));
        
        if (isRefresh || pageNum === 1) {
          setGarages(formattedGarages);
        } else {
          setGarages(prev => [...prev, ...formattedGarages]);
        }
        
        setTotalGarages(apiData.count || formattedGarages.length);
        setHasMore(!!apiData.next);
        setPage(pageNum);
        
      } else {
        throw new Error(response.message || 'Failed to fetch garages');
      }
    } catch (error: any) {
      console.error('❌ Error fetching garages:', error.message);
      Alert.alert('Error', error.message || 'Failed to load garages');
      
      // Reset to empty state on first load
      if (isRefresh || pageNum === 1) {
        setGarages([]);
        setTotalGarages(0);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Test API connection and load data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log('🔌 Testing API connection...');
        const response = await fetch(`${BASE_URL}/test/`);
        console.log('✅ API connection successful:', response.status);
        
        // Load garages after successful connection
        await fetchGarages(1, false);
      } catch (error: any) {
        console.error('❌ API connection failed:', error.message);
        Alert.alert(
          'Connection Error',
          `Unable to connect to server at ${BASE_URL}. Please check: \n1. Server is running\n2. Correct IP address\n3. Port 8000 is open`
        );
      }
    };
    
    initializeData();
  }, []);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    fetchGarages(1, true);
  }, [searchQuery]);

  // Search handler with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery !== '') {
        fetchGarages(1, true);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Toast message helpers
  const showToast = useCallback((message: string, type: 'action' | 'success' = 'action') => {
    if (type === 'success') {
      setSuccessMessage(message);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } else {
      setActionMessage(message);
      setShowActionMessage(true);
      setTimeout(() => setShowActionMessage(false), 3000);
    }
  }, []);

  // Handle edit garage
  const handleEdit = useCallback((garage: Garage) => {
    setEditingGarage(garage);
    setFormData({
      name: garage.name || '',
      address: garage.address || '',
      phone: garage.phone || '',
      email: garage.email || '',
      rating: parseRating(garage.rating).toString() || '0',
      rating_count: garage.rating_count?.toString() || '0',
      is_open: garage.is_open || true,
      delivery_available: garage.delivery_available || false,
      estimated_time: garage.estimated_time || '15-30 mins',
      services: garage.services?.join(', ') || '',
      latitude: garage.latitude || '',
      longitude: garage.longitude || '',
      opening_hours: garage.opening_hours 
        ? JSON.stringify(garage.opening_hours, null, 2)
        : JSON.stringify({
            monday: '9:00 AM - 6:00 PM',
            tuesday: '9:00 AM - 6:00 PM',
            wednesday: '9:00 AM - 6:00 PM',
            thursday: '9:00 AM - 6:00 PM',
            friday: '9:00 AM - 6:00 PM',
            saturday: '10:00 AM - 4:00 PM',
            sunday: 'Closed'
          }, null, 2),
      city: garage.city || ''
    });
    setFormErrors({});
    setShowModal(true);
  }, []);

  // Handle add new garage
  const handleAddNew = useCallback(() => {
    setEditingGarage(null);
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      rating: '0',
      rating_count: '0',
      is_open: true,
      delivery_available: false,
      estimated_time: '15-30 mins',
      services: '',
      latitude: '',
      longitude: '',
      opening_hours: JSON.stringify({
        monday: '9:00 AM - 6:00 PM',
        tuesday: '9:00 AM - 6:00 PM',
        wednesday: '9:00 AM - 6:00 PM',
        thursday: '9:00 AM - 6:00 PM',
        friday: '9:00 AM - 6:00 PM',
        saturday: '10:00 AM - 4:00 PM',
        sunday: 'Closed'
      }, null, 2),
      city: ''
    });
    setFormErrors({});
    setShowModal(true);
  }, []);

  // Form validation
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Garage name is required';
    }
    
    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-+()]{10,15}$/.test(formData.phone)) {
      errors.phone = 'Enter a valid phone number';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Enter a valid email address';
    }
    
    // City is optional (blank=True in Django model)
    // But we can add validation if needed
    if (formData.city && formData.city.length > 100) {
      errors.city = 'City name is too long (max 100 characters)';
    }
    
    if (formData.rating && isNaN(parseFloat(formData.rating))) {
      errors.rating = 'Rating must be a number';
    } else if (parseFloat(formData.rating) < 0 || parseFloat(formData.rating) > 5) {
      errors.rating = 'Rating must be between 0 and 5';
    }
    
    if (formData.rating_count && isNaN(parseInt(formData.rating_count))) {
      errors.rating_count = 'Rating count must be a number';
    }
    
    if (formData.opening_hours.trim()) {
      try {
        JSON.parse(formData.opening_hours.trim());
      } catch (e) {
        errors.opening_hours = 'Invalid JSON format for opening hours';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Prepare data for API - UPDATED to include city field
  const prepareGarageData = useCallback((data: FormData) => {
    const apiData: any = {
      name: data.name.trim(),
      address: data.address.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      is_open: data.is_open,
      delivery_available: data.delivery_available,
      estimated_time: data.estimated_time.trim(),
      // Include city field - send empty string if not provided
      city: data.city.trim() || '',
    };

    // Add numeric fields if provided
    if (data.rating && !isNaN(parseFloat(data.rating))) {
      apiData.rating = parseFloat(data.rating);
    } else {
      apiData.rating = 0.0; // Default value
    }
    
    if (data.rating_count && !isNaN(parseInt(data.rating_count))) {
      apiData.rating_count = parseInt(data.rating_count);
    } else {
      apiData.rating_count = 0; // Default value
    }
    
    // Add coordinates if provided
    if (data.latitude.trim()) {
      apiData.latitude = data.latitude.trim();
    } else {
      apiData.latitude = null; // Set to null if empty
    }
    
    if (data.longitude.trim()) {
      apiData.longitude = data.longitude.trim();
    } else {
      apiData.longitude = null; // Set to null if empty
    }
    
    // Parse opening hours
    if (data.opening_hours.trim()) {
      try {
        apiData.opening_hours = JSON.parse(data.opening_hours.trim());
      } catch (e) {
        console.warn('Invalid opening hours JSON, using default');
        apiData.opening_hours = {
          monday: '9:00 AM - 6:00 PM',
          tuesday: '9:00 AM - 6:00 PM',
          wednesday: '9:00 AM - 6:00 PM',
          thursday: '9:00 AM - 6:00 PM',
          friday: '9:00 AM - 6:00 PM',
          saturday: '10:00 AM - 4:00 PM',
          sunday: 'Closed'
        };
      }
    } else {
      apiData.opening_hours = {};
    }
    
    // Add services if provided
    if (data.services.trim()) {
      const servicesList = data.services.split(',').map(s => s.trim()).filter(s => s);
      if (servicesList.length > 0) {
        apiData.services = servicesList;
      } else {
        apiData.services = [];
      }
    } else {
      apiData.services = [];
    }

    return apiData;
  }, []);

  // Save garage - UPDATED to handle city field
  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    showToast(`${editingGarage ? 'Updating' : 'Adding'} garage...`, 'action');
    
    try {
      const apiData = prepareGarageData(formData);
      let url: string;
      let method: string;
      
      if (editingGarage) {
        url = API_ENDPOINTS.GARAGE_DETAIL(editingGarage.id);
        method = 'PUT'; // Using PUT for full update
      } else {
        url = API_ENDPOINTS.GARAGES;
        method = 'POST';
      }
      
      console.log(`📤 ${method} request to:`, url);
      console.log('📦 Request data:', apiData);
      
      const response = await apiFetch(url, {
        method: method,
        body: JSON.stringify(apiData),
      });
      
      if (response.success) {
        showToast(editingGarage ? '✅ Garage updated successfully!' : '✅ Garage added successfully!', 'success');
        fetchGarages(1, true); // Refresh the list
        setShowModal(false);
      } else {
        // Try to parse error details
        if (response.data && typeof response.data === 'object') {
          const errors: Record<string, string[]> = response.data;
          const formattedErrors: Record<string, string> = {};
          
          Object.keys(errors).forEach(key => {
            if (Array.isArray(errors[key])) {
              formattedErrors[key] = errors[key].join(', ');
            } else {
              formattedErrors[key] = String(errors[key]);
            }
          });
          
          setFormErrors(formattedErrors);
          Alert.alert('Validation Error', 'Please check the form for errors');
        } else {
          Alert.alert('Error', response.message || 'Failed to save garage');
        }
      }
    } catch (error: any) {
      console.error('❌ Error saving garage:', error);
      Alert.alert('Error', 'Failed to save garage. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete garage
  const executeDelete = async (garageId: number) => {
    setShowConfirmDelete(null);
    showToast('🗑️ Deleting garage...', 'action');
    
    try {
      const url = API_ENDPOINTS.GARAGE_DETAIL(garageId);
      console.log('🗑️ DELETE request to:', url);
      
      const response = await apiFetch(url, {
        method: 'DELETE',
      });
      
      if (response.success || response.status === 204) {
        showToast('✅ Garage deleted successfully!', 'success');
        // Update local state
        setGarages(prev => prev.filter(garage => garage.id !== garageId));
        setTotalGarages(prev => prev - 1);
        // Also refresh from server to ensure consistency
        setTimeout(() => fetchGarages(1, true), 500);
      } else {
        Alert.alert('Error', response.message || 'Failed to delete garage');
      }
    } catch (error: any) {
      console.error('❌ Error deleting garage:', error);
      Alert.alert('Error', 'Failed to delete garage. Please try again.');
    }
  };

  // Toggle garage status
  const executeStatusToggle = async (garageId: number) => {
    setShowConfirmStatus(null);
    const garage = garages.find(g => g.id === garageId);
    if (!garage) return;
    
    showToast(`🔄 ${garage.is_open ? 'Closing' : 'Opening'} garage...`, 'action');
    
    try {
      const url = API_ENDPOINTS.GARAGE_DETAIL(garageId);
      // Only send the fields that need to be updated
      const updatedData = { 
        is_open: !garage.is_open,
      };
      
      console.log('🔄 PATCH request to:', url);
      console.log('📦 Update data:', updatedData);
      
      const response = await apiFetch(url, {
        method: 'PATCH',
        body: JSON.stringify(updatedData),
      });
      
      if (response.success) {
        showToast(`✅ Garage ${!garage.is_open ? 'opened' : 'closed'} successfully!`, 'success');
        // Update local state
        setGarages(prev => prev.map(g =>
          g.id === garageId ? { ...g, is_open: !g.is_open } : g
        ));
      } else {
        Alert.alert('Error', response.message || 'Failed to update garage status');
      }
    } catch (error: any) {
      console.error('❌ Error updating garage status:', error);
      Alert.alert('Error', 'Failed to update garage status. Please try again.');
    }
  };

  // Render star rating
  const renderStars = useCallback((rating: number | string) => {
    const numRating = parseRating(rating);
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;
    
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Ionicons 
            key={i} 
            name="star" 
            size={14} 
            color="#fbbf24" 
          />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <Ionicons 
            key={i} 
            name="star-half" 
            size={14} 
            color="#fbbf24" 
          />
        );
      } else {
        stars.push(
          <Ionicons 
            key={i} 
            name="star-outline" 
            size={14} 
            color={isDark ? '#4b5563' : '#d1d5db'} 
          />
        );
      }
    }
    
    return <View className="flex-row">{stars}</View>;
  }, [isDark]);

  // Format date
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  }, []);

  // Helper function to format rating display
  const formatRatingDisplay = useCallback((rating: number | string) => {
    const numRating = parseRating(rating);
    return numRating.toFixed(1);
  }, []);

  // Filter garages for search
  const filteredGarages = garages.filter(garage =>
    garage.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    garage.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    garage.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    garage.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    garage.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView className={`flex-1 ${bgColor}`}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={primaryColor} />
          <Text className={`mt-4 ${textColor}`}>Loading garages...</Text>
          <Text className={`text-xs ${textSecondaryColor} mt-2`}>
            Connected to: {BASE_URL}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render garage card
  const renderGarageCard = ({ item: garage }: { item: Garage }) => (
    <View
      key={garage.id}
      className={`${cardColor} rounded-xl p-4 mb-4 shadow-sm ${borderColor} border`}
      style={{
        elevation: 2,
        shadowColor: isDark ? '#000' : '#9ca3af',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      }}
    >
      {/* Garage Header */}
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row items-center flex-1">
          <View className={`w-12 h-12 rounded-lg ${
            isDark ? 'bg-blue-900/30' : 'bg-blue-100'
          } items-center justify-center mr-3`}>
            <FontAwesome5 name="warehouse" size={20} color={primaryColor} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className={`font-bold ${textColor} text-lg flex-1`}>
                {garage.name}
              </Text>
              {garage.is_verified && (
                <Ionicons name="checkmark-circle" size={16} color="#10b981" style={{ marginLeft: 4 }} />
              )}
            </View>
            <Text className={`${textSecondaryColor} mt-1 text-sm`}>
              {garage.address}
              {garage.city && garage.city !== 'Unknown' && garage.city.trim() !== '' && `, ${garage.city}`}
            </Text>
          </View>
        </View>
        
        {/* Status Toggle */}
        {showConfirmStatus === garage.id ? (
          <View className="flex-row space-x-1 items-center">
            <Text className={`text-xs ${textColor} mr-1`}>Confirm?</Text>
            <TouchableOpacity
              onPress={() => executeStatusToggle(garage.id)}
              className="px-1.5 py-0.5 bg-green-600 rounded"
            >
              <Text className="text-white text-xs">Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowConfirmStatus(null)}
              className="px-1.5 py-0.5 bg-gray-500 rounded"
            >
              <Text className="text-white text-xs">No</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="items-center">
            <Switch
              value={garage.is_open}
              onValueChange={() => setShowConfirmStatus(garage.id)}
              trackColor={{ false: '#9ca3af', true: '#10b981' }}
              thumbColor={garage.is_open ? '#f9fafb' : '#f9fafb'}
            />
            <Text className={`text-xs mt-1 ${garage.is_open ? 'text-green-600' : 'text-red-600'}`}>
              {garage.is_open ? 'OPEN' : 'CLOSED'}
            </Text>
          </View>
        )}
      </View>

      {/* Rating */}
      <View className="flex-row items-center mb-3">
        {renderStars(garage.rating)}
        <Text className={`${textSecondaryColor} text-sm ml-2`}>
          {formatRatingDisplay(garage.rating)} ({garage.rating_count || 0} reviews)
        </Text>
      </View>

      {/* Tags */}
      <View className="flex-row flex-wrap gap-2 mb-4">
        <View className={`px-3 py-1 rounded-full ${
          garage.is_open 
            ? isDark ? 'bg-green-900/30' : 'bg-green-100'
            : isDark ? 'bg-red-900/30' : 'bg-red-100'
        }`}>
          <Text className={`text-xs font-semibold ${
            garage.is_open 
              ? isDark ? 'text-green-300' : 'text-green-800'
              : isDark ? 'text-red-300' : 'text-red-800'
          }`}>
            {garage.is_open ? 'OPEN NOW' : 'CLOSED'}
          </Text>
        </View>
        {garage.delivery_available && (
          <View className={`px-3 py-1 rounded-full ${
            isDark ? 'bg-blue-900/30' : 'bg-blue-100'
          }`}>
            <Text className={`text-xs font-semibold ${
              isDark ? 'text-blue-300' : 'text-blue-800'
            }`}>
              Delivery
            </Text>
          </View>
        )}
        {garage.estimated_time && (
          <View className={`px-3 py-1 rounded-full ${
            isDark ? 'bg-purple-900/30' : 'bg-purple-100'
          }`}>
            <Text className={`text-xs font-semibold ${
              isDark ? 'text-purple-300' : 'text-purple-800'
            }`}>
              {garage.estimated_time}
            </Text>
          </View>
        )}
        {garage.is_active && (
          <View className={`px-3 py-1 rounded-full ${
            isDark ? 'bg-emerald-900/30' : 'bg-emerald-100'
          }`}>
            <Text className={`text-xs font-semibold ${
              isDark ? 'text-emerald-300' : 'text-emerald-800'
            }`}>
              Active
            </Text>
          </View>
        )}
        {garage.city && garage.city.trim() !== '' && garage.city !== 'Unknown' && (
          <View className={`px-3 py-1 rounded-full ${
            isDark ? 'bg-indigo-900/30' : 'bg-indigo-100'
          }`}>
            <Text className={`text-xs font-semibold ${
              isDark ? 'text-indigo-300' : 'text-indigo-800'
            }`}>
              {garage.city}
            </Text>
          </View>
        )}
      </View>

      {/* Contact Info */}
      <View className="mb-4">
        {garage.phone && (
          <View className="flex-row items-center mb-2">
            <Ionicons name="call" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
            <Text className={`${textSecondaryColor} text-sm ml-2`}>
              {garage.phone}
            </Text>
          </View>
        )}
        {garage.email && (
          <View className="flex-row items-center mb-2">
            <Ionicons name="mail" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
            <Text className={`${textSecondaryColor} text-sm ml-2`}>
              {garage.email}
            </Text>
          </View>
        )}
        {garage.services && garage.services.length > 0 && (
          <View className="flex-row items-start">
            <Ionicons name="construct" size={16} color={isDark ? '#9ca3af' : '#6b7280'} style={{ marginTop: 2 }} />
            <Text className={`${textSecondaryColor} text-sm ml-2 flex-1`}>
              Services: {garage.services.slice(0, 3).join(', ')}
              {garage.services.length > 3 && '...'}
            </Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View className="flex-row justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
        <View className="flex-row space-x-3">
          <TouchableOpacity
            className="px-4 py-2 bg-blue-600 rounded-lg flex-row items-center"
            onPress={() => handleEdit(garage)}
          >
            <Ionicons name="pencil" size={16} color="white" />
            <Text className="text-white font-semibold text-sm ml-2">Edit</Text>
          </TouchableOpacity>
          
          {showConfirmDelete === garage.id ? (
            <View className="flex-row space-x-2 items-center">
              <Text className={`text-xs ${textColor} mr-1`}>Delete?</Text>
              <TouchableOpacity
                onPress={() => executeDelete(garage.id)}
                className="px-2 py-1 bg-red-600 rounded"
              >
                <Text className="text-white text-xs">Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowConfirmDelete(null)}
                className="px-2 py-1 bg-gray-500 rounded"
              >
                <Text className="text-white text-xs">No</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="px-4 py-2 bg-red-600 rounded-lg flex-row items-center"
              onPress={() => setShowConfirmDelete(garage.id)}
            >
              <Ionicons name="trash" size={16} color="white" />
              <Text className="text-white font-semibold text-sm ml-2">Delete</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Updated date */}
        {garage.updated_at && (
          <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Updated: {formatDate(garage.updated_at)}
          </Text>
        )}
      </View>
    </View>
  );

  // Empty state
  const renderEmptyState = () => (
    <View className={`${cardColor} rounded-xl p-8 items-center justify-center ${borderColor} border mt-8 mx-4`}>
      <Ionicons name="business-outline" size={64} color={isDark ? '#4b5563' : '#9ca3af'} />
      <Text className={`${textColor} text-lg font-bold mt-4`}>
        {searchQuery ? 'No garages found' : 'No garages yet'}
      </Text>
      <Text className={`${textSecondaryColor} text-sm mt-2 text-center mb-6`}>
        {searchQuery 
          ? 'Try a different search term' 
          : 'Add your first garage using the + button'
        }
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          className="px-5 py-3 bg-blue-500 rounded-lg shadow flex-row items-center"
          onPress={handleAddNew}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text className="text-white font-semibold text-sm ml-2">Add First Garage</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Action Message Toast */}
      {showActionMessage && (
        <View className="absolute top-16 left-5 right-5 z-50">
          <View className={`${cardColor} rounded-xl p-4 shadow-xl ${borderColor} border`}>
            <Text className={`${textColor} text-center font-medium`}>
              {actionMessage}
            </Text>
          </View>
        </View>
      )}

      {/* Success Message Toast */}
      {showSuccessMessage && (
        <View className="absolute top-20 left-5 right-5 z-50">
          <View className={`${cardColor} rounded-xl p-4 shadow-xl ${borderColor} border bg-green-50 dark:bg-green-900/30`}>
            <View className="flex-row items-center justify-center">
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <Text className={`ml-2 ${textColor} text-center font-medium`}>
                {successMessage}
              </Text>
            </View>
          </View>
        </View>
      )}
      
      {/* Main Content */}
      <View className="flex-1">
        {/* Header Section */}
        <View className={`p-5 ${cardColor} shadow-sm ${borderColor} border-b`}>
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className={`text-2xl font-bold ${textColor}`}>Garages Management</Text>
              <Text className={`${textSecondaryColor} mt-1 text-sm`}>
                {totalGarages} garage{totalGarages !== 1 ? 's' : ''} total
              </Text>
              <Text className={`text-xs ${textSecondaryColor} mt-1`}>
                Connected to: {BASE_URL}
              </Text>
            </View>
            <TouchableOpacity 
              className="p-3 rounded-full bg-blue-600 shadow"
              onPress={handleAddNew}
              style={{ elevation: 3 }}
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="relative">
            <TextInput
              className={`${inputBgColor} rounded-full px-4 py-3 pl-12 ${inputTextColor} font-medium ${borderColor} border text-base`}
              placeholder="Search garages by name, address, phone, city..."
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={handleRefresh}
            />
            <View className="absolute left-3.5 top-3.5">
              <Ionicons name="search" size={22} color={isDark ? '#9ca3af' : '#6b7280'} />
            </View>
            {searchQuery ? (
              <TouchableOpacity 
                className="absolute right-3.5 top-3.5"
                onPress={() => {
                  setSearchQuery('');
                  fetchGarages(1, true);
                }}
              >
                <Ionicons name="close-circle" size={22} color={isDark ? '#6b7280' : '#9ca3af'} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Scrollable Content with FlatList for better performance */}
        <FlatList
          data={filteredGarages}
          renderItem={renderGarageCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ 
            paddingTop: 16,
            paddingBottom: 32,
            paddingHorizontal: 16
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[primaryColor]}
              tintColor={isDark ? '#fff' : primaryColor}
            />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={
            hasMore && filteredGarages.length > 0 ? (
              <TouchableOpacity
                className={`py-4 ${cardColor} rounded-xl items-center justify-center ${borderColor} border mb-4`}
                onPress={() => fetchGarages(page + 1, false)}
                disabled={loading}
                style={{
                  elevation: 1,
                  shadowColor: isDark ? '#000' : '#9ca3af',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={primaryColor} />
                ) : (
                  <Text className={`${textColor} font-medium`}>
                    Load More ({Math.max(0, totalGarages - garages.length)} remaining)
                  </Text>
                )}
              </TouchableOpacity>
            ) : null
          }
        />
      </View>

      {/* Add/Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => !isSubmitting && setShowModal(false)}
      >
        <SafeAreaView className="flex-1 bg-black/50">
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <View className={`flex-1 ${cardColor} mt-10 rounded-t-3xl`} style={{ maxHeight: SCREEN_HEIGHT * 0.9 }}>
              {/* Modal Header */}
              <View className="p-5 border-b border-gray-200 dark:border-gray-700 flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className={`text-2xl font-bold ${textColor}`}>
                    {editingGarage ? 'Edit Garage' : 'Add New Garage'}
                  </Text>
                  <Text className={`${textSecondaryColor} text-sm mt-1`}>
                    {editingGarage ? 'Update garage information' : 'Register new garage'}
                  </Text>
                </View>
                
                <TouchableOpacity 
                  onPress={() => !isSubmitting && setShowModal(false)}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-800"
                  disabled={isSubmitting}
                >
                  <Ionicons name="close" size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
                </TouchableOpacity>
              </View>

              {/* Form Content */}
              <ScrollView 
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <View className="p-5 space-y-5">
                  {/* Name */}
                  <View>
                    <Text className={`font-medium mb-2 ${textColor} text-base`}>
                      Garage Name <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      className={`${inputBgColor} rounded-lg px-4 py-3.5 ${inputTextColor} ${borderColor} border text-base ${
                        formErrors.name ? 'border-red-500' : ''
                      }`}
                      placeholder="Enter garage name"
                      placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                      value={formData.name}
                      onChangeText={(text) => {
                        setFormData({...formData, name: text});
                        if (formErrors.name) setFormErrors({...formErrors, name: ''});
                      }}
                    />
                    {formErrors.name && (
                      <Text className={`text-sm mt-1.5 ${errorColor}`}>{formErrors.name}</Text>
                    )}
                  </View>

                  {/* Address */}
                  <View>
                    <Text className={`font-medium mb-2 ${textColor} text-base`}>
                      Address <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      className={`${inputBgColor} rounded-lg px-4 py-3.5 ${inputTextColor} ${borderColor} border text-base ${
                        formErrors.address ? 'border-red-500' : ''
                      }`}
                      placeholder="Enter full address"
                      placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                      value={formData.address}
                      onChangeText={(text) => {
                        setFormData({...formData, address: text});
                        if (formErrors.address) setFormErrors({...formErrors, address: ''});
                      }}
                      multiline
                      numberOfLines={2}
                    />
                    {formErrors.address && (
                      <Text className={`text-sm mt-1.5 ${errorColor}`}>{formErrors.address}</Text>
                    )}
                  </View>

                  {/* Phone */}
                  <View>
                    <Text className={`font-medium mb-2 ${textColor} text-base`}>
                      Phone Number <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      className={`${inputBgColor} rounded-lg px-4 py-3.5 ${inputTextColor} ${borderColor} border text-base ${
                        formErrors.phone ? 'border-red-500' : ''
                      }`}
                      placeholder="Enter phone number"
                      placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                      value={formData.phone}
                      onChangeText={(text) => {
                        setFormData({...formData, phone: text});
                        if (formErrors.phone) setFormErrors({...formErrors, phone: ''});
                      }}
                      keyboardType="phone-pad"
                    />
                    {formErrors.phone && (
                      <Text className={`text-sm mt-1.5 ${errorColor}`}>{formErrors.phone}</Text>
                    )}
                  </View>

                  {/* Email */}
                  <View>
                    <Text className={`font-medium mb-2 ${textColor} text-base`}>
                      Email <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      className={`${inputBgColor} rounded-lg px-4 py-3.5 ${inputTextColor} ${borderColor} border text-base ${
                        formErrors.email ? 'border-red-500' : ''
                      }`}
                      placeholder="Enter email address"
                      placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                      value={formData.email}
                      onChangeText={(text) => {
                        setFormData({...formData, email: text});
                        if (formErrors.email) setFormErrors({...formErrors, email: ''});
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    {formErrors.email && (
                      <Text className={`text-sm mt-1.5 ${errorColor}`}>{formErrors.email}</Text>
                    )}
                  </View>

                  {/* City - ADDED with proper handling */}
                  <View>
                    <Text className={`font-medium mb-2 ${textColor} text-base`}>
                      City
                      <Text className="text-xs text-gray-500 ml-1">(Optional)</Text>
                    </Text>
                    <TextInput
                      className={`${inputBgColor} rounded-lg px-4 py-3.5 ${inputTextColor} ${borderColor} border text-base ${
                        formErrors.city ? 'border-red-500' : ''
                      }`}
                      placeholder="Enter city (e.g., Dar es Salaam, Arusha)"
                      placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                      value={formData.city}
                      onChangeText={(text) => {
                        setFormData({...formData, city: text});
                        if (formErrors.city) setFormErrors({...formErrors, city: ''});
                      }}
                    />
                    {formErrors.city && (
                      <Text className={`text-sm mt-1.5 ${errorColor}`}>{formErrors.city}</Text>
                    )}
                    <Text className={`text-xs mt-1 ${textSecondaryColor}`}>
                      Leave empty to auto-extract from address
                    </Text>
                  </View>

                  {/* Rating & Rating Count */}
                  <View className="flex-row space-x-4">
                    <View className="flex-1">
                      <Text className={`font-medium mb-2 ${textColor} text-base`}>Rating (0-5)</Text>
                      <TextInput
                        className={`${inputBgColor} rounded-lg px-4 py-3.5 ${inputTextColor} ${borderColor} border text-base ${
                          formErrors.rating ? 'border-red-500' : ''
                        }`}
                        placeholder="0.0 - 5.0"
                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                        value={formData.rating}
                        onChangeText={(text) => {
                          setFormData({...formData, rating: text});
                          if (formErrors.rating) setFormErrors({...formErrors, rating: ''});
                        }}
                        keyboardType="decimal-pad"
                      />
                      {formErrors.rating && (
                        <Text className={`text-sm mt-1.5 ${errorColor}`}>{formErrors.rating}</Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className={`font-medium mb-2 ${textColor} text-base`}>Rating Count</Text>
                      <TextInput
                        className={`${inputBgColor} rounded-lg px-4 py-3.5 ${inputTextColor} ${borderColor} border text-base ${
                          formErrors.rating_count ? 'border-red-500' : ''
                        }`}
                        placeholder="Number of reviews"
                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                        value={formData.rating_count}
                        onChangeText={(text) => {
                          setFormData({...formData, rating_count: text});
                          if (formErrors.rating_count) setFormErrors({...formErrors, rating_count: ''});
                        }}
                        keyboardType="number-pad"
                      />
                      {formErrors.rating_count && (
                        <Text className={`text-sm mt-1.5 ${errorColor}`}>{formErrors.rating_count}</Text>
                      )}
                    </View>
                  </View>

                  {/* Estimated Time */}
                  <View>
                    <Text className={`font-medium mb-2 ${textColor} text-base`}>Estimated Time</Text>
                    <TextInput
                      className={`${inputBgColor} rounded-lg px-4 py-3.5 ${inputTextColor} ${borderColor} border text-base`}
                      placeholder="e.g., 15-30 mins"
                      placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                      value={formData.estimated_time}
                      onChangeText={(text) => setFormData({...formData, estimated_time: text})}
                    />
                  </View>

                  {/* Coordinates */}
                  <View className="flex-row space-x-4">
                    <View className="flex-1">
                      <Text className={`font-medium mb-2 ${textColor} text-base`}>Latitude</Text>
                      <TextInput
                        className={`${inputBgColor} rounded-lg px-4 py-3.5 ${inputTextColor} ${borderColor} border text-base`}
                        placeholder="Latitude (optional)"
                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                        value={formData.latitude}
                        onChangeText={(text) => setFormData({...formData, latitude: text})}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className={`font-medium mb-2 ${textColor} text-base`}>Longitude</Text>
                      <TextInput
                        className={`${inputBgColor} rounded-lg px-4 py-3.5 ${inputTextColor} ${borderColor} border text-base`}
                        placeholder="Longitude (optional)"
                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                        value={formData.longitude}
                        onChangeText={(text) => setFormData({...formData, longitude: text})}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>

                  {/* Services */}
                  <View>
                    <Text className={`font-medium mb-2 ${textColor} text-base`}>Services (comma separated)</Text>
                    <TextInput
                      className={`${inputBgColor} rounded-lg px-4 py-3.5 ${inputTextColor} ${borderColor} border text-base`}
                      placeholder="e.g., Oil Change, Brake Service, Tire Rotation"
                      placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                      value={formData.services}
                      onChangeText={(text) => setFormData({...formData, services: text})}
                    />
                  </View>

                  {/* Switches */}
                  <View className="space-y-4">
                    <View className="flex-row items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <View>
                        <Text className={`font-medium ${textColor} text-base`}>Currently Open</Text>
                        <Text className={`text-xs ${textSecondaryColor} mt-0.5`}>
                          Garage is accepting bookings
                        </Text>
                      </View>
                      <Switch
                        value={formData.is_open}
                        onValueChange={(value) => setFormData({...formData, is_open: value})}
                        trackColor={{ false: '#9ca3af', true: '#10b981' }}
                        thumbColor="#f9fafb"
                      />
                    </View>

                    <View className="flex-row items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <View>
                        <Text className={`font-medium ${textColor} text-base`}>Delivery Available</Text>
                        <Text className={`text-xs ${textSecondaryColor} mt-0.5`}>
                          Offers mobile service/delivery
                        </Text>
                      </View>
                      <Switch
                        value={formData.delivery_available}
                        onValueChange={(value) => setFormData({...formData, delivery_available: value})}
                        trackColor={{ false: '#9ca3af', true: primaryColor }}
                        thumbColor="#f9fafb"
                      />
                    </View>
                  </View>

                  {/* Opening Hours */}
                  <View>
                    <Text className={`font-medium mb-2 ${textColor} text-base`}>Opening Hours (JSON)</Text>
                    <TextInput
                      className={`${inputBgColor} rounded-lg px-4 py-3.5 ${inputTextColor} ${borderColor} border text-base ${
                        formErrors.opening_hours ? 'border-red-500' : ''
                      }`}
                      placeholder="Enter opening hours in JSON format"
                      placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                      value={formData.opening_hours}
                      onChangeText={(text) => {
                        setFormData({...formData, opening_hours: text});
                        if (formErrors.opening_hours) setFormErrors({...formErrors, opening_hours: ''});
                      }}
                      multiline
                      numberOfLines={6}
                      textAlignVertical="top"
                    />
                    {formErrors.opening_hours && (
                      <Text className={`text-sm mt-1.5 ${errorColor}`}>{formErrors.opening_hours}</Text>
                    )}
                    <Text className={`text-xs mt-2 ${textSecondaryColor}`}>
                      Format: {"{'monday': '9:00 AM - 6:00 PM', 'tuesday': '9:00 AM - 6:00 PM', ...}"}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="px-5 pb-5 space-y-3">
                  <TouchableOpacity 
                    className={`py-4 rounded-xl items-center justify-center ${
                      isSubmitting ? 'bg-blue-400' : 'bg-blue-600'
                    } ${isSubmitting ? 'opacity-70' : ''} shadow`}
                    onPress={handleSave}
                    disabled={isSubmitting}
                    style={{ elevation: 3 }}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-white font-bold text-lg">
                        {editingGarage ? 'UPDATE GARAGE' : 'SAVE GARAGE'}
                      </Text>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    className="py-3.5 rounded-xl items-center justify-center bg-gray-200 dark:bg-gray-800"
                    onPress={() => !isSubmitting && setShowModal(false)}
                    disabled={isSubmitting}
                  >
                    <Text className={`${textColor} font-medium text-base`}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}