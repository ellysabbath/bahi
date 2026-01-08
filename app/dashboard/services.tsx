// app/dashboard/services.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

// Base URL - CHANGE THIS BASED ON YOUR CONNECTION METHOD
const BASE_URL = 'https://AutoFix.pythonanywhere.com'; // For WiFi
// const BASE_URL = 'http://localhost:8000'; // For USB ADB reverse

interface GarageService {
  id: number;
  garage: number;
  service: number;
  price: string;
  duration: string;
  description: string;
  is_available: boolean;
  garage_name: string;
  service_name: string;
  created_at: string;
  service_details?: ServiceDetail[];
}

interface ServiceDetail {
  id: number;
  garage_service: number;
  name: string;
  description: string;
  price: string;
  duration: string;
  is_active: boolean;
  garage_name: string;
  service_name: string;
  created_at: string;
}

interface BookingData {
  service_id: number;
  service_name: string;
  price: string;
  duration: string;
  notes: string;
}

export default function ServicesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get garage info from params using useMemo to prevent dependency issues
  const garageId = useMemo(() => params.garageId as string, [params.garageId]);
  const garageName = useMemo(() => 
    params.garageName ? decodeURIComponent(params.garageName as string) : 'Garage',
    [params.garageName]
  );
  const servicesFromParams = useMemo(() => 
    params.services ? JSON.parse(params.services as string) : [],
    [params.services]
  );
  
  // State management
  const [loading, setLoading] = useState(true);
  const [garageServices, setGarageServices] = useState<GarageService[]>([]);
  const [serviceDetails, setServiceDetails] = useState<ServiceDetail[]>([]);
  const [selectedService, setSelectedService] = useState<GarageService | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData>({
    service_id: 0,
    service_name: '',
    price: '',
    duration: '',
    notes: '',
  });
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Colors based on theme
  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
  const cardColor = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const textSecondaryColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  const primaryColor = '#3b82f6';

  // API fetch helper
  const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    try {
      console.log(`🌐 ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
        status: response.status,
      };
    } catch (error: any) {
      console.error('❌ API Error:', error.message);
      return {
        success: false,
        message: error.message || 'Network error',
      };
    }
  }, []);

  // Fetch service details for a specific service
  const fetchServiceDetails = useCallback(async (serviceId: number) => {
    try {
      setLoadingDetails(true);
      
      const url = `${BASE_URL}/service-details/?garage_service=${serviceId}`;
      console.log('📡 Fetching service details:', url);
      
      const response = await apiFetch(url);
      
      if (response.success && response.data) {
        let details: ServiceDetail[] = [];
        
        if (Array.isArray(response.data)) {
          details = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          details = response.data.results;
        }
        
        setServiceDetails(details);
        console.log(`✅ Found ${details.length} details for service ${serviceId}`);
      }
    } catch (error: any) {
      console.error('❌ Error fetching service details:', error.message);
    } finally {
      setLoadingDetails(false);
    }
  }, [apiFetch]);

  // Fetch garage services
  const fetchGarageServices = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch services for this specific garage
      const url = `${BASE_URL}/garage-services/?garage=${garageId}`;
      console.log('📡 Fetching garage services:', url);
      
      const response = await apiFetch(url);
      
      if (response.success && response.data) {
        // Check if response is an array or has results property
        let servicesData: GarageService[] = [];
        
        if (Array.isArray(response.data)) {
          servicesData = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          servicesData = response.data.results;
        } else {
          servicesData = [response.data];
        }
        
        console.log(`✅ Found ${servicesData.length} services for garage ${garageId}`);
        
        // Fetch details for each service
        const servicesWithDetails = await Promise.all(
          servicesData.map(async (service) => {
            try {
              // Fetch service details
              const detailsUrl = `${BASE_URL}/service-details/?garage_service=${service.id}`;
              const detailsResponse = await apiFetch(detailsUrl);
              
              if (detailsResponse.success && detailsResponse.data) {
                let details: ServiceDetail[] = [];
                
                if (Array.isArray(detailsResponse.data)) {
                  details = detailsResponse.data;
                } else if (detailsResponse.data.results && Array.isArray(detailsResponse.data.results)) {
                  details = detailsResponse.data.results;
                }
                
                return {
                  ...service,
                  service_details: details,
                };
              }
            } catch (error) {
              console.error('Error fetching details for service:', service.id, error);
            }
            
            return service;
          })
        );
        
        setGarageServices(servicesWithDetails);
        
      } else {
        // Fallback: Use services from params if API fails
        console.log('⚠️ Using services from params');
        const fallbackServices: GarageService[] = servicesFromParams.map((serviceName: string, index: number) => ({
          id: index + 1,
          garage: parseInt(garageId),
          service: index + 100,
          price: '0.00',
          duration: '1 hour',
          description: `${serviceName} service`,
          is_available: true,
          garage_name: garageName,
          service_name: serviceName,
          created_at: new Date().toISOString(),
        }));
        setGarageServices(fallbackServices);
      }
    } catch (error: any) {
      console.error('❌ Error fetching garage services:', error.message);
      Alert.alert('Error', 'Failed to load services. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [garageId, garageName, servicesFromParams, apiFetch]);

  // Initialize data
  useEffect(() => {
    fetchGarageServices();
  }, [fetchGarageServices]);

  // Handle service selection
  const handleServicePress = useCallback((service: GarageService) => {
    setSelectedService(service);
    fetchServiceDetails(service.id);
  }, [fetchServiceDetails]);

  // Handle booking
  const handleBookService = useCallback((service: GarageService) => {
    setBookingData({
      service_id: service.id,
      service_name: service.service_name,
      price: service.price,
      duration: service.duration,
      notes: '',
    });
    setShowBookingModal(true);
  }, []);

  // Confirm booking
  const confirmBooking = useCallback(() => {
    if (!bookingData.service_id) {
      Alert.alert('Error', 'Please select a service first');
      return;
    }

    // Navigate to booking screen with data
    router.push({
      pathname: '/dashboard/bookings',
      params: {
        garageId: garageId,
        garageName: encodeURIComponent(garageName),
        serviceId: bookingData.service_id.toString(),
        serviceName: encodeURIComponent(bookingData.service_name),
        price: bookingData.price,
        duration: bookingData.duration,
        notes: encodeURIComponent(bookingData.notes),
      }
    });
    
    setShowBookingModal(false);
  }, [bookingData, garageId, garageName, router]);

  // Format price
  const formatPrice = useCallback((price: string) => {
    try {
      return `TSh ${parseFloat(price).toLocaleString()}`;
    } catch {
      return `TSh ${price}`;
    }
  }, []);

  // Render service card
  const renderServiceCard = useCallback((service: GarageService) => {
    const isAvailable = service.is_available;
    
    return (
      <View
        key={service.id}
        className={`${cardColor} rounded-xl p-4 mb-4 ${borderColor} border`}
        style={{
          opacity: isAvailable ? 1 : 0.6,
        }}
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className={`font-bold text-lg ${textColor} flex-1`}>
                {service.service_name}
              </Text>
              {!isAvailable && (
                <Text className="text-xs text-red-500 font-medium ml-2">Unavailable</Text>
              )}
            </View>
            <Text className={`text-sm ${textSecondaryColor} mt-1`}>
              {service.description || 'Professional service'}
            </Text>
          </View>
          <View className="items-end">
            <Text className={`font-bold text-lg ${textColor}`}>
              {formatPrice(service.price)}
            </Text>
            <Text className={`text-xs ${textSecondaryColor} mt-1`}>
              {service.duration}
            </Text>
          </View>
        </View>
        
        {/* Service Details Preview */}
        {service.service_details && service.service_details.length > 0 && (
          <View className="mb-3">
            <Text className={`text-sm font-medium ${textColor} mb-2`}>Includes:</Text>
            {service.service_details.slice(0, 3).map((detail) => (
              <View key={detail.id} className="flex-row items-center mb-1">
                <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                <Text className={`ml-2 text-sm ${textSecondaryColor}`}>
                  {detail.name} - {formatPrice(detail.price)}
                </Text>
              </View>
            ))}
            {service.service_details.length > 3 && (
              <Text className={`text-xs ${textSecondaryColor} mt-1`}>
                +{service.service_details.length - 3} more items
              </Text>
            )}
          </View>
        )}
        
        {/* Action Buttons */}
        <View className="flex-row space-x-2">
          <TouchableOpacity 
            className={`flex-1 py-3 rounded-lg items-center ${
              isAvailable ? 'bg-blue-600' : 'bg-gray-500'
            }`}
            onPress={() => isAvailable && handleBookService(service)}
            disabled={!isAvailable}
          >
            <Text className="text-white font-semibold">
              {isAvailable ? 'Book Now' : 'Not Available'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="py-3 px-4 bg-gray-200 dark:bg-gray-700 rounded-lg items-center"
            onPress={() => handleServicePress(service)}
          >
            <Ionicons name="information-circle" size={20} color={textSecondaryColor} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [
    cardColor, 
    borderColor, 
    textColor, 
    textSecondaryColor, 
    formatPrice, 
    handleBookService, 
    handleServicePress
  ]);

  // Render service detail item
  const renderServiceDetail = useCallback((detail: ServiceDetail) => (
    <View
      key={detail.id}
      className={`${cardColor} rounded-lg p-3 mb-2 ${borderColor} border`}
    >
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <Text className={`font-medium ${textColor}`}>{detail.name}</Text>
          {detail.description ? (
            <Text className={`text-xs ${textSecondaryColor} mt-1`}>
              {detail.description}
            </Text>
          ) : null}
        </View>
        <View className="items-end">
          <Text className={`font-medium ${textColor}`}>
            {formatPrice(detail.price)}
          </Text>
          <Text className={`text-xs ${textSecondaryColor} mt-1`}>
            {detail.duration}
          </Text>
        </View>
      </View>
    </View>
  ), [cardColor, borderColor, textColor, textSecondaryColor, formatPrice]);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${bgColor}`}>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={primaryColor} />
          <Text className={`mt-4 ${textColor}`}>Loading services...</Text>
          <Text className={`text-xs ${textSecondaryColor} mt-2`}>
            Garage: {garageName}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View className={`px-5 pt-5 pb-4 ${cardColor} shadow-sm ${borderColor} border-b`}>
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mr-4"
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={theme === 'dark' ? '#9ca3af' : '#6b7280'} 
            />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className={`text-2xl font-bold ${textColor}`}>{garageName}</Text>
            <Text className={`text-sm ${textSecondaryColor} mt-1`}>
              Available Services ({garageServices.length})
            </Text>
          </View>
        </View>
      </View>

      {/* Services List */}
      <ScrollView 
        className="flex-1 px-5 pt-5"
        showsVerticalScrollIndicator={false}
      >
        {garageServices.length === 0 ? (
          <View className={`${cardColor} rounded-2xl p-8 items-center justify-center ${borderColor} border mt-4`}>
            <Ionicons name="construct-outline" size={64} color={textSecondaryColor} />
            <Text className={`${textColor} text-lg font-bold mt-4`}>
              No Services Available
            </Text>
            <Text className={`${textSecondaryColor} text-sm mt-2 text-center`}>
              This garage doesn`t have any services listed yet.
            </Text>
            <TouchableOpacity
              className="mt-6 px-6 py-3 bg-blue-500 rounded-lg"
              onPress={fetchGarageServices}
            >
              <Text className="text-white font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {garageServices.map(renderServiceCard)}
            
            {/* Info Section */}
            <View className={`${cardColor} rounded-xl p-4 mb-8 ${borderColor} border`}>
              <Text className={`font-bold text-lg ${textColor} mb-2`}>
                Booking Information
              </Text>
              <View className="space-y-2">
                <View className="flex-row items-center">
                  <Ionicons name="information-circle" size={16} color={primaryColor} />
                  <Text className={`ml-2 text-sm ${textSecondaryColor}`}>
                    All prices include tax
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="time" size={16} color={primaryColor} />
                  <Text className={`ml-2 text-sm ${textSecondaryColor}`}>
                    Same-day booking available
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="shield-checkmark" size={16} color={primaryColor} />
                  <Text className={`ml-2 text-sm ${textSecondaryColor}`}>
                    100% satisfaction guarantee
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Service Details Modal */}
      <Modal
        visible={!!selectedService}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedService(null)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className={`${cardColor} rounded-t-3xl p-5 max-h-3/4`}>
            <View className="flex-row justify-between items-center mb-4">
              <Text className={`text-xl font-bold ${textColor}`}>
                {selectedService?.service_name} Details
              </Text>
              <TouchableOpacity onPress={() => setSelectedService(null)}>
                <Ionicons name="close" size={24} color={textSecondaryColor} />
              </TouchableOpacity>
            </View>
            
            {selectedService && (
              <>
                <View className="mb-4">
                  <Text className={`font-medium ${textColor}`}>
                    {selectedService.description || 'No description available'}
                  </Text>
                  <View className="flex-row justify-between items-center mt-3">
                    <Text className={`font-bold text-lg ${textColor}`}>
                      {formatPrice(selectedService.price)}
                    </Text>
                    <Text className={`text-sm ${textSecondaryColor}`}>
                      Duration: {selectedService.duration}
                    </Text>
                  </View>
                </View>
                
                <Text className={`font-bold text-lg ${textColor} mb-3`}>
                  Service Details
                </Text>
                
                {loadingDetails ? (
                  <ActivityIndicator size="small" color={primaryColor} />
                ) : serviceDetails.length > 0 ? (
                  <ScrollView className="max-h-48">
                    {serviceDetails.map(renderServiceDetail)}
                  </ScrollView>
                ) : (
                  <Text className={`${textSecondaryColor} text-center py-4`}>
                    No detailed breakdown available
                  </Text>
                )}
                
                <TouchableOpacity 
                  className={`mt-6 py-3 bg-blue-600 rounded-lg items-center ${
                    !selectedService.is_available && 'opacity-50'
                  }`}
                  onPress={() => {
                    if (selectedService.is_available) {
                      handleBookService(selectedService);
                      setSelectedService(null);
                    }
                  }}
                  disabled={!selectedService.is_available}
                >
                  <Text className="text-white font-bold text-lg">
                    {selectedService.is_available ? 'Book This Service' : 'Currently Unavailable'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Booking Modal */}
      <Modal
        visible={showBookingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBookingModal(false)}
      >
        <View className="flex-1 justify-center bg-black/50 p-5">
          <View className={`${cardColor} rounded-2xl p-5`}>
            <Text className={`text-xl font-bold ${textColor} mb-2`}>
              Book Service
            </Text>
            
            <View className="mb-4">
              <Text className={`font-medium ${textColor}`}>
                {bookingData.service_name}
              </Text>
              <View className="flex-row justify-between items-center mt-2">
                <Text className={`font-bold text-lg ${textColor}`}>
                  {formatPrice(bookingData.price)}
                </Text>
                <Text className={`text-sm ${textSecondaryColor}`}>
                  {bookingData.duration}
                </Text>
              </View>
            </View>
            
            <Text className={`font-medium ${textColor} mb-2`}>
              Additional Notes (Optional)
            </Text>
            <TextInput
              className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg px-4 py-3 ${textColor} border ${borderColor} mb-4`}
              placeholder="Any special requests or notes..."
              placeholderTextColor={textSecondaryColor}
              multiline
              numberOfLines={3}
              value={bookingData.notes}
              onChangeText={(text) => setBookingData({...bookingData, notes: text})}
            />
            
            <View className="flex-row space-x-3">
              <TouchableOpacity 
                className="flex-1 py-3 bg-gray-300 dark:bg-gray-700 rounded-lg items-center"
                onPress={() => setShowBookingModal(false)}
              >
                <Text className="font-semibold">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="flex-1 py-3 bg-blue-600 rounded-lg items-center"
                onPress={confirmBooking}
              >
                <Text className="text-white font-semibold">Confirm Booking</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}