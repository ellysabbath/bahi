
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

// Base URL
const BASE_URL = 'https://AutoFix.pythonanywhere.com';

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

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface OpeningHours {
  [key: string]: {
    open: string;
    close: string;
    closed?: boolean;
  };
}

export default function GaragesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  
  // State management
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingLocation, setLoadingLocation] = useState<boolean>(false);
  const [garages, setGarages] = useState<Garage[]>([]);
  const [filteredGarages, setFilteredGarages] = useState<Garage[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [locationPermissionDenied, setLocationPermissionDenied] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalGarages, setTotalGarages] = useState(0);
  
  // Colors based on theme
  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
  const cardColor = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const textSecondaryColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  const inputBgColor = theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100';
  const inputTextColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-800';
  const primaryColor = '#3b82f6';

  // Helper function to safely parse rating
  const parseRating = (rating: number | string | undefined): number => {
    if (rating === undefined || rating === null) return 0;
    
    if (typeof rating === 'string') {
      const parsed = parseFloat(rating);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    return rating;
  };

  // API fetch helper
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
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error text:', errorText);
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          if (errorText) {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorJson.error || errorMessage;
          }
        } catch {}
        
        throw new Error(errorMessage);
      }

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

  // Fetch garages directly from your API
  const fetchGarages = async (pageNum: number = 1, isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }
      
      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        page_size: '20',
      });
      
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      
      const url = `${BASE_URL}/garages/?${queryParams}`;
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
        
        // Format garages for display
        const formattedGarages = results.map(garage => ({
          ...garage,
          services: garage.services || [],
          rating: parseRating(garage.rating),
          rating_count: typeof garage.rating_count === 'string' 
            ? parseInt(garage.rating_count) || 0 
            : garage.rating_count || 0,
          latitude: garage.latitude || '',
          longitude: garage.longitude || '',
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
      
      if (page === 1) {
        setGarages([]);
        setTotalGarages(0);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculate distance between coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  // Format distance for display
  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  };

  // Get distance from user to garage
  const getGarageDistance = (garage: Garage): string => {
    if (!userLocation || !garage.latitude || !garage.longitude) {
      return 'N/A';
    }
    
    try {
      const lat = typeof garage.latitude === 'string' ? parseFloat(garage.latitude) : garage.latitude;
      const lng = typeof garage.longitude === 'string' ? parseFloat(garage.longitude) : garage.longitude;
      
      if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
        return 'N/A';
      }
      
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        lat,
        lng
      );
      return formatDistance(distance);
    } catch (error) {
      console.error('Error calculating distance:', error);
      return 'N/A';
    }
  };

  // Get current opening status
  const getOpeningStatus = (garage: Garage): { status: string; color: string } => {
    if (!garage.is_open) {
      return { status: 'Closed', color: 'text-red-500' };
    }
    
    // Simple check if garage is marked as open in database
    if (garage.is_open) {
      return { status: 'Open Now', color: 'text-green-500' };
    }
    
    return { status: 'Closed', color: 'text-red-500' };
  };

  // Get user location with permission handling
  const getUserLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLocationPermissionDenied(true);
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to see distances to garages.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => Linking.openSettings()
            }
          ]
        );
        setLoadingLocation(false);
        return null;
      }

      setLocationPermissionDenied(false);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: Coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(coords);
      return coords;
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Unable to get your location. Please try again.');
      return null;
    } finally {
      setLoadingLocation(false);
    }
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        fetchGarages(1, false),
        getUserLocation()
      ]);
    };
    
    initializeData();
  }, []);

  // Filter garages based on search and active filter
  useEffect(() => {
    let filtered = garages;
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(garage =>
        garage.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        garage.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (garage.phone && garage.phone.includes(searchQuery)) ||
        (garage.city && garage.city.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply status filter
    switch (activeFilter) {
      case 'open':
        filtered = filtered.filter(garage => garage.is_open);
        break;
      case 'delivery':
        filtered = filtered.filter(garage => garage.delivery_available);
        break;
      case 'nearby':
        if (userLocation) {
          // Sort by actual distance
          filtered = [...filtered].sort((a, b) => {
            try {
              const latA = a.latitude ? (typeof a.latitude === 'string' ? parseFloat(a.latitude) : a.latitude) : null;
              const lngA = a.longitude ? (typeof a.longitude === 'string' ? parseFloat(a.longitude) : a.longitude) : null;
              const latB = b.latitude ? (typeof b.latitude === 'string' ? parseFloat(b.latitude) : b.latitude) : null;
              const lngB = b.longitude ? (typeof b.longitude === 'string' ? parseFloat(b.longitude) : b.longitude) : null;
              
              const distA = latA && lngA 
                ? calculateDistance(userLocation.latitude, userLocation.longitude, latA, lngA)
                : Infinity;
              const distB = latB && lngB 
                ? calculateDistance(userLocation.latitude, userLocation.longitude, latB, lngB)
                : Infinity;
              return distA - distB;
            } catch  {
              return 0;
            }
          });
         
          filtered = filtered.slice(0, 10);
        }
        break;
      case 'top_rated':
        filtered = filtered.filter(garage => {
          const rating = parseRating(garage.rating);
          return rating >= 4.0;
        });
        break;
      case 'all':
      default:
        break;
    }
    
    setFilteredGarages(filtered);
  }, [searchQuery, activeFilter, garages, userLocation]);

  
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      fetchGarages(1, true),
      getUserLocation()
    ]).finally(() => setRefreshing(false));
  }, [searchQuery]);

  
  const handleGaragePress = (garage: Garage) => {
router.push({
  pathname: '/dashboard/garage-details/[id]',
  params: { 
    id: garage.id.toString(),
    garage: JSON.stringify(garage),
    garageId: garage.id.toString(),
  }
} as any);
  };

 
  const handleGetDirections = async (garage: Garage) => {
    if (!garage.latitude || !garage.longitude) {
     
      if (garage.address) {
        const encodedAddress = encodeURIComponent(garage.address);
        const url = Platform.select({
          ios: `maps://?q=${encodedAddress}`,
          android: `geo:0,0?q=${encodedAddress}`,
          default: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
        });
        
        try {
          const canOpen = await Linking.canOpenURL(url!);
          if (canOpen) {
            await Linking.openURL(url!);
          } else {
           
            await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
          }
        } catch (error) {
          console.error('Error opening directions:', error);
          Alert.alert('Error', 'Could not open maps. Please try again.');
        }
      } else {
        Alert.alert('Error', 'This garage does not have location information.');
      }
      return;
    }

    try {
      const lat = typeof garage.latitude === 'string' ? parseFloat(garage.latitude) : garage.latitude;
      const lng = typeof garage.longitude === 'string' ? parseFloat(garage.longitude) : garage.longitude;
      
      if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
        Alert.alert('Error', 'Invalid location data for this garage.');
        return;
      }
      
     
      const label = encodeURIComponent(garage.name || garage.address);
      
      const url = Platform.select({
        ios: `maps://?ll=${lat},${lng}&q=${label}`,
        android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
        default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      });

      const canOpen = await Linking.canOpenURL(url!);
      if (canOpen) {
        await Linking.openURL(url!);
      } else {
        await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
      }
    } catch (error) {
      console.error('Error opening directions:', error);
      Alert.alert('Error', 'Could not open maps. Please try again.');
    }
  };

 
  const handleCallGarage = (garage: Garage) => {
    if (!garage.phone || garage.phone.trim() === '') {
      Alert.alert('No Phone', 'This garage does not have a phone number listed.');
      return;
    }

  
    let phoneNumber = garage.phone.trim();
    
   
    phoneNumber = phoneNumber.replace(/[^\d+]/g, '');
    
   
    if (!phoneNumber.startsWith('+') && !phoneNumber.startsWith('00')) {
     
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '+255' + phoneNumber.substring(1);
      } else if (phoneNumber.length === 9) {
        
        phoneNumber = '+255' + phoneNumber;
      }
    }
    
    const url = `tel:${phoneNumber}`;
    
    // Directly attempt to open the phone app
    Linking.openURL(url).catch(err => {
      console.error('Error calling garage:', err);
      Alert.alert('Error', 'Could not make the call. Please try again or check your phone settings.');
    });
  };

  // Handle view services - UPDATED to redirect to /services/index
  const handleViewServices = (garage: Garage) => {
    router.push({
      pathname: '/services/index',
      params: { 
        garageId: garage.id.toString(),
        garageName: encodeURIComponent(garage.name),
        services: JSON.stringify(garage.services || [])
      }
    } as any);
  };

  // Handle view on map - FIXED to show exact location
  const handleViewOnMap = (garage: Garage) => {
    // If garage has coordinates, use them
    if (garage.latitude && garage.longitude) {
      const lat = typeof garage.latitude === 'string' ? parseFloat(garage.latitude) : garage.latitude;
      const lng = typeof garage.longitude === 'string' ? parseFloat(garage.longitude) : garage.longitude;
      
      if (!isNaN(lat) && !isNaN(lng)) {
        router.push({
          pathname: '/dashboard/map',
          params: {
            garageId: garage.id.toString(),
            garageName: encodeURIComponent(garage.name),
            address: encodeURIComponent(garage.address || ''),
            latitude: lat.toString(),
            longitude: lng.toString(),
            userLatitude: userLocation?.latitude?.toString(),
            userLongitude: userLocation?.longitude?.toString(),
            hasExactLocation: 'true',
          }
        } as any);
        return;
      }
    }
    
    // If no coordinates but has address, geocode the address
    if (garage.address) {
      router.push({
        pathname: '/dashboard/map',
        params: {
          garageId: garage.id.toString(),
          garageName: encodeURIComponent(garage.name),
          address: encodeURIComponent(garage.address),
          userLatitude: userLocation?.latitude?.toString(),
          userLongitude: userLocation?.longitude?.toString(),
          hasExactLocation: 'false',
        }
      }  as any);
    } else {
      Alert.alert('No Location', 'This garage does not have location information.');
    }
  };

  // Handle book service
  const handleBookService = (garage: Garage) => {
    router.push({
      pathname: '/dashboard/booking',
      params: {
        garageId: garage.id.toString(),
        garageName: encodeURIComponent(garage.name),
      }
    } as any);
  };

  // Render star ratings
  const renderStars = (garage: Garage) => {
    const stars = [];
    const rating = parseRating(garage.rating);
    const ratingCount = garage.rating_count;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
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
            color={theme === 'dark' ? '#4b5563' : '#d1d5db'} 
          />
        );
      }
    }
    
    return (
      <View className="flex-row items-center">
        {stars}
        <Text className={`ml-1 text-xs ${textSecondaryColor}`}>
          ({ratingCount || 0})
        </Text>
      </View>
    );
  };

  // Render garage card
  const renderGarageCard = ({ item: garage }: { item: Garage }) => {
    const openingStatus = getOpeningStatus(garage);
    const distance = getGarageDistance(garage);
    
    return (
      <View
        key={garage.id}
        className={`${cardColor} rounded-xl p-4 mb-4 ${borderColor} border`}
        style={{
          elevation: 2,
          shadowColor: theme === 'dark' ? '#000' : '#9ca3af',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        }}
      >
        <TouchableOpacity 
          onPress={() => handleGaragePress(garage)}
          activeOpacity={0.7}
        >
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className={`font-bold text-lg ${textColor} flex-1`}>
                  {garage.name}
                </Text>
                {garage.is_verified && (
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" style={{ marginLeft: 4 }} />
                )}
              </View>
              <Text className={`text-sm ${textSecondaryColor} mt-1`}>
                {garage.address}
                {garage.city && garage.city !== 'Unknown' && `, ${garage.city}`}
              </Text>
            </View>
            <View className="items-end">
              {renderStars(garage)}
              <Text className={`text-xs ${textSecondaryColor} mt-1`}>
                {garage.estimated_time || '15-30 mins'}
              </Text>
            </View>
          </View>
          
          {/* Status & Info Row */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Ionicons 
                name="time" 
                size={14} 
                color={openingStatus.color.includes('green') ? '#10b981' : 
                       openingStatus.color.includes('red') ? '#ef4444' : textSecondaryColor} 
              />
              <Text className={`ml-1 text-sm font-medium ${openingStatus.color}`}>
                {openingStatus.status}
              </Text>
            </View>
            
            <View className="flex-row items-center">
              <Ionicons name="location" size={14} color={textSecondaryColor} />
              <Text className={`ml-1 text-sm ${textSecondaryColor}`}>
                {distance}
              </Text>
            </View>
            
            <View className="flex-row items-center">
              <FontAwesome5 
                name="shipping-fast" 
                size={12} 
                color={garage.delivery_available ? '#10b981' : textSecondaryColor} 
              />
              <Text className={`ml-1 text-sm ${textSecondaryColor}`}>
                {garage.delivery_available ? 'Delivery' : 'No Delivery'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        
        {/* Services Preview */}
        {garage.services && garage.services.length > 0 && (
          <View className="mb-4">
            <Text className={`text-sm font-medium ${textColor} mb-1`}>Services:</Text>
            <Text className={`text-xs ${textSecondaryColor}`}>
              {garage.services.slice(0, 3).join(', ')}
              {garage.services.length > 3 && '...'}
            </Text>
          </View>
        )}
        
        {/* Action Buttons */}
        <View className="flex-row space-x-2">
  <TouchableOpacity 
    className="flex-1 py-2.5 bg-blue-600 rounded-lg items-center flex-row justify-center"
    onPress={() => {
      try {
        router.push({
          pathname: '/dashboard/bookings',
          params: { garageId: garage.id.toString() }
        });
      } catch (error) {
        console.error('Navigation error:', error);
        Alert.alert('Error', 'Unable to navigate to bookings. Please try again later.');
      }
    }}
  >
    <Ionicons name="calendar" size={16} color="white" />
    <Text className="text-white font-semibold text-sm ml-2">Book Now</Text>
  </TouchableOpacity>
          
          <TouchableOpacity 
            className="py-2.5 px-3 bg-green-600 rounded-lg items-center"
            onPress={() => handleGetDirections(garage)}
          >
            <Ionicons name="navigate" size={16} color="white" />
          </TouchableOpacity>
          
          {garage.phone && garage.phone.trim() !== '' && (
            <TouchableOpacity 
              className="py-2.5 px-3 bg-blue-500 rounded-lg items-center"
              onPress={() => handleCallGarage(garage)}
            >
              <Ionicons name="call" size={16} color="white" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Secondary Action Buttons */}
        <View className="flex-row space-x-2 mt-2">
          {/* <TouchableOpacity 
            className="flex-1 py-2 bg-purple-600 rounded-lg items-center"
            onPress={() => handleViewServices(garage)}
          >
            <Text className="text-white font-semibold text-xs">View All Services</Text>
          </TouchableOpacity> */}
          
          <TouchableOpacity 
            className="flex-1 py-2 bg-gray-600 rounded-lg items-center"
            onPress={() => handleGetDirections(garage)}
          >
            <Text className="text-white font-semibold text-xs">View on Map</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Filter options
  const filterOptions = [
    { id: 'all', label: 'All Garages', icon: 'grid' },
    { id: 'open', label: 'Open Now', icon: 'time' },
    { id: 'nearby', label: 'Nearby', icon: 'location' },
    { id: 'delivery', label: 'Delivery', icon: 'car' },
    { id: 'top_rated', label: 'Top Rated', icon: 'star' },
  ];

  // Empty state
  const renderEmptyState = () => (
    <View className={`${cardColor} rounded-2xl p-8 items-center justify-center ${borderColor} border mt-4`}>
      <Ionicons name="build-outline" size={64} color={theme === 'dark' ? '#4b5563' : '#9ca3af'} />
      <Text className={`${textColor} text-lg font-bold mt-4`}>
        No garages found
      </Text>
      <Text className={`${textSecondaryColor} text-sm mt-2 text-center`}>
        {searchQuery ? 'Try a different search term' : 'No garages available at the moment'}
      </Text>
      {(searchQuery || activeFilter !== 'all') && (
        <TouchableOpacity
          className="mt-4 px-6 py-2 bg-blue-500 rounded-lg"
          onPress={() => {
            setSearchQuery('');
            setActiveFilter('all');
          }}
        >
          <Text className="text-white font-semibold text-sm">Clear Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView className={`flex-1 ${bgColor}`}>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
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

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View className="px-5 pt-5 pb-4">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className={`text-2xl font-bold ${textColor}`}>QuickFix</Text>
            <Text className={`text-sm ${textSecondaryColor} mt-1`}>
              Find professional auto services near you
            </Text>
          </View>
          <TouchableOpacity 
            className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}
            onPress={handleRefresh}
          >
            <Ionicons 
              name="refresh" 
              size={20} 
              color={theme === 'dark' ? '#9ca3af' : '#6b7280'} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View className="relative mb-4">
          <TextInput
            className={`${inputBgColor} rounded-xl px-5 py-3 pl-12 ${inputTextColor} font-medium ${borderColor} border text-base`}
            placeholder="Search garages by name, address..."
            placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#6b7280'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <View className="absolute left-4 top-3">
            <Ionicons name="search" size={20} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
          </View>
          {searchQuery ? (
            <TouchableOpacity 
              className="absolute right-4 top-3"
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={20} color={theme === 'dark' ? '#6b7280' : '#9ca3af'} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Location Action Button */}
        <TouchableOpacity 
          className={`flex-row items-center justify-between py-3 px-4 mb-4 rounded-xl ${borderColor} border ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
          }`}
          onPress={getUserLocation}
          disabled={loadingLocation}
        >
          <View className="flex-row items-center">
            <Ionicons 
              name={locationPermissionDenied ? "location-off" : "location"} 
              size={20} 
              color={loadingLocation ? textSecondaryColor : locationPermissionDenied ? '#ef4444' : primaryColor} 
            />
            <Text className={`ml-2 font-medium ${
              loadingLocation ? textSecondaryColor : 
              locationPermissionDenied ? 'text-red-500' : 'text-blue-500'
            }`}>
              {loadingLocation ? 'Getting location...' : 
               locationPermissionDenied ? 'Location Permission Required' :
               userLocation ? 'Location Active' : 'Enable Location'}
            </Text>
          </View>
          {userLocation && (
            <Text className="text-xs text-gray-500">
              ✓ Active
            </Text>
          )}
        </TouchableOpacity>

        {/* Stats Summary */}
        <View className="flex-row justify-between mb-6">
          <View className="items-center">
            <Text className={`text-lg font-bold ${textColor}`}>{totalGarages}</Text>
            <Text className={`text-xs ${textSecondaryColor}`}>Total</Text>
          </View>
          <View className="items-center">
            <Text className={`text-lg font-bold ${textColor}`}>
              {garages.filter(g => g.is_open).length}
            </Text>
            <Text className={`text-xs ${textSecondaryColor}`}>Open Now</Text>
          </View>
          <View className="items-center">
            <Text className={`text-lg font-bold ${textColor}`}>
              {garages.filter(g => g.delivery_available).length}
            </Text>
            <Text className={`text-xs ${textSecondaryColor}`}>Delivery</Text>
          </View>
          <View className="items-center">
            <Text className={`text-lg font-bold ${textColor}`}>
              {garages.filter(g => parseRating(g.rating) >= 4.0).length}
            </Text>
            <Text className={`text-xs ${textSecondaryColor}`}>Top Rated</Text>
          </View>
        </View>

        {/* Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="mb-6"
        >
          <View className="flex-row space-x-2">
            {filterOptions.map((filter) => (
              <TouchableOpacity 
                key={filter.id}
                className={`px-4 py-2 rounded-full flex-row items-center ${
                  activeFilter === filter.id
                    ? theme === 'dark' ? 'bg-blue-700' : 'bg-blue-600'
                    : theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                }`}
                onPress={() => setActiveFilter(filter.id)}
              >
                <Ionicons 
                  name={filter.icon as any} 
                  size={14} 
                  color={activeFilter === filter.id ? 'white' : textSecondaryColor} 
                />
                <Text className={`ml-1.5 font-medium text-sm ${
                  activeFilter === filter.id ? 'text-white' : textSecondaryColor
                }`}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Garages List */}
      <View className="px-5 flex-1">
        <Text className={`text-xl font-bold ${textColor} mb-4`}>
          {activeFilter === 'all' ? 'All Garages' : 
           filterOptions.find(f => f.id === activeFilter)?.label} ({filteredGarages.length})
        </Text>
        
        <FlatList
          data={filteredGarages}
          renderItem={renderGarageCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[primaryColor]}
              tintColor={theme === 'dark' ? '#fff' : primaryColor}
            />
          }
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={
            hasMore && filteredGarages.length > 0 ? (
              <TouchableOpacity
                className={`py-4 ${cardColor} rounded-xl items-center justify-center ${borderColor} border mb-4`}
                onPress={() => fetchGarages(page + 1, false)}
                disabled={loading}
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
    </SafeAreaView>
  );
}