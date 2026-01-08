// app/dashboard/services/index.tsx
import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
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
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import Sidebar from '../../components/Sidebar';
import { useTheme } from '../../context/ThemeContext';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// Type definitions
interface ServiceType {
  id: number;
  name: string;
  description?: string;
  base_price: string;
  duration: string;
  garage: number;
  garage_name?: string;
  service_name?: string;
  price?: string;
  garage_id?: number;
}

interface GarageType {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  latitude?: string | number;
  longitude?: string | number;
  description?: string;
  opening_hours?: string;
  services?: number[];
}

interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface UserInfo {
  role?: string;
  username?: string;
  email?: string;
}

// Icon types for MaterialIcons
type MaterialIconName = 'build' | 'business' | 'receipt' | 'person' | 'settings' | 'search' | 'admin-panel-settings' | 'arrow-forward-ios';

// Navigation path type
type AppRoute = 
  | '/admin/services'
  | '/admin/garages'
  | '/admin/bookings'
  | '/dashboard/profile'
  | '/dashboard/bookings'
  | '/dashboard/settings'
  | '/dashboard/garages'
  | '/login';

const API_BASE_URL = 'https://AutoFix.pythonanywhere.com';

// Navigation helper with proper typing
const useAppNavigation = () => {
  const router = useRouter();
  
  const push = (path: AppRoute) => {
    router.push(path as any);
  };
  
  const replace = (path: AppRoute) => {
    router.replace(path as any);
  };
  
  return { push, replace };
};

// Menu action interface
interface MenuAction {
  label: string;
  icon: MaterialIconName;
  action: () => void;
}

export default function ServicesScreen() {
  // State declarations
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [services, setServices] = useState<ServiceType[]>([]);
  const [garages, setGarages] = useState<GarageType[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState<'services' | 'map'>('services');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  
  const mapRef = useRef<MapView>(null);
  const { theme } = useTheme();
  const params = useLocalSearchParams();
  const { push, replace } = useAppNavigation();
  
  const garageName = typeof params.garageName === 'string' ? params.garageName : null;

  // Theme colors - All icons will be blue (#3b82f6)
  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
  const cardColor = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const textSecondaryColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  const inputBgColor = theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100';
  const inputTextColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-800';
  const tabActiveColor = theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500';
  const tabInactiveColor = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200';
  const tabActiveText = 'text-white';
  const tabInactiveTextColor = theme === 'dark' ? 'text-gray-300' : 'text-gray-600';

  const isAdmin = userInfo?.role?.toLowerCase() === 'admin';

  // Get user location
  const getUserLocation = useCallback(async (): Promise<UserLocation | null> => {
    setLoadingLocation(true);
    try {
      let { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        
        if (newStatus !== 'granted') {
          setLocationPermissionDenied(true);
          setLoadingLocation(false);
          return null;
        }
        status = newStatus;
      }

      setLocationPermissionDenied(false);
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const userLocationData: UserLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy ?? undefined,
      };

      setUserLocation(userLocationData);
      
      setMapRegion({
        latitude: userLocationData.latitude,
        longitude: userLocationData.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      return userLocationData;
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationPermissionDenied(true);
      return null;
    } finally {
      setLoadingLocation(false);
    }
  }, []);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [servicesResponse, garagesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/services/`),
        fetch(`${API_BASE_URL}/garages/`)
      ]);

      if (!servicesResponse.ok) throw new Error('Failed to fetch services');
      if (!garagesResponse.ok) throw new Error('Failed to fetch garages');
      
      const servicesData = await servicesResponse.json();
      const garagesData = await garagesResponse.json();
      
      const servicesArray = servicesData.results || servicesData;
      const garagesArray = garagesData.results || garagesData;
      
      // Process services with garage info
      const processedServices = servicesArray.map((service: any) => {
        const foundGarage = garagesArray.find((g: any) => g.id === service.garage);
        return {
          ...service,
          garage_id: service.garage,
          garage_name: foundGarage?.name || 'Unknown Garage',
          price: service.base_price || service.price || '0.00',
          service_name: service.name?.split(' ')[0] || service.name || 'Service',
          duration: service.duration || '1 hour',
        };
      });
      
      setServices(processedServices);
      setGarages(garagesArray);
      
      // Apply filters
      let filtered = processedServices;
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(
          (service: ServiceType) => 
            service.name?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
            service.description?.toLowerCase().includes(selectedCategory.toLowerCase())
        );
      }
      
      if (searchQuery.trim() !== '') {
        filtered = filtered.filter(
          (service: ServiceType) => 
            service.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.garage_name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      setFilteredServices(filtered);
      
    } catch (error: any) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', `Failed to load services: ${error.message}`);
      setServices([]);
      setGarages([]);
      setFilteredServices([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  // Initialize data
  const initializeData = useCallback(async () => {
    await Promise.all([getUserLocation(), fetchData()]);
  }, [getUserLocation, fetchData]);

  // Load user info and initialize data
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const userInfoString = await AsyncStorage.getItem('userInfo');
        if (userInfoString) {
          const userData = JSON.parse(userInfoString);
          setUserInfo(userData);
        }
      } catch (error) {
        console.error('Error loading user info:', error);
      }
    };

    loadUserInfo();
    initializeData();
  }, [initializeData]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await initializeData();
    setRefreshing(false);
  }, [initializeData]);

  // Calculate distance between two points
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Format distance for display
  const formatDistance = useCallback((distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  }, []);

  // Get service distance from user
  const getServiceDistance = useCallback((service: ServiceType): string => {
    if (!userLocation) return 'Distance N/A';

    try {
      const foundGarage = garages.find(g => g.id === service.garage);
      if (!foundGarage || !foundGarage.latitude || !foundGarage.longitude) return 'Distance N/A';

      const lat = parseFloat(foundGarage.latitude as string);
      const lng = parseFloat(foundGarage.longitude as string);
      
      if (isNaN(lat) || isNaN(lng)) return 'Distance N/A';
      
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        lat,
        lng
      );
      return formatDistance(distance);
    } catch (error) {
      console.error('Error calculating distance:', error);
      return 'Distance N/A';
    }
  }, [userLocation, garages, calculateDistance, formatDistance]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userInfo');
              replace('/login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  }, [replace]);

  // Admin menu actions
  const adminActions: MenuAction[] = [
    { 
      label: 'Manage Services', 
      icon: 'build', 
      action: () => {
        setShowAdminMenu(false);
        push('/admin/services');
      }
    },
    { 
      label: 'Manage Garages', 
      icon: 'business', 
      action: () => {
        setShowAdminMenu(false);
        push('/admin/garages');
      }
    },
    { 
      label: 'View Bookings', 
      icon: 'receipt', 
      action: () => {
        setShowAdminMenu(false);
        push('/admin/bookings');
      }
    },
  ];

  // Profile menu actions
  const profileMenuActions: MenuAction[] = [
    { 
      label: 'My Profile', 
      icon: 'person', 
      action: () => {
        setShowProfileMenu(false);
        push('/dashboard/profile');
      }
    },
    { 
      label: 'My Bookings', 
      icon: 'receipt', 
      action: () => {
        setShowProfileMenu(false);
        push('/dashboard/bookings');
      }
    },
    { 
      label: 'Settings', 
      icon: 'settings', 
      action: () => {
        setShowProfileMenu(false);
        push('/dashboard/settings');
      }
    },
    { 
      label: 'Logout', 
      icon: 'build', 
      action: () => {
        setShowProfileMenu(false);
        handleLogout();
      }
    },
  ];

  // Handle view garages
  const handleViewGarages = useCallback(() => {
    push('/dashboard/garages');
  }, [push]);

  // Get service icon based on service name
  const getServiceIcon = useCallback((service: ServiceType) => {
    const serviceName = service.name?.toLowerCase() || '';
    const iconColor = '#3b82f6'; // Blue color
    
    if (serviceName.includes('oil') || serviceName.includes('lubrication')) {
      return <MaterialCommunityIcons name="oil" size={28} color={iconColor} />;
    } else if (serviceName.includes('brake')) {
      return <MaterialCommunityIcons name="car-brake-abs" size={28} color={iconColor} />;
    } else if (serviceName.includes('diagnostic') || serviceName.includes('scan')) {
      return <MaterialIcons name="search" size={28} color={iconColor} />;
    } else if (serviceName.includes('clean') || serviceName.includes('wash')) {
      return <MaterialCommunityIcons name="car-wash" size={28} color={iconColor} />;
    } else if (serviceName.includes('tire') || serviceName.includes('wheel')) {
      return <FontAwesome5 name="cog" size={24} color={iconColor} />;
    } else if (serviceName.includes('ac') || serviceName.includes('cool')) {
      return <FontAwesome5 name="snowflake" size={24} color={iconColor} />;
    } else if (serviceName.includes('engine')) {
      return <MaterialCommunityIcons name="engine" size={28} color={iconColor} />;
    } else {
      return <MaterialIcons name="build" size={28} color={iconColor} />;
    }
  }, []);

  // Loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView className={`flex-1 ${bgColor}`}>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className={`mt-4 ${textColor}`}>
            {garageName ? `Loading services for ${garageName}...` : 'Loading services...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Sidebar Component */}
      <Sidebar 
        isVisible={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      {/* Admin Menu Modal */}
      {isAdmin && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={showAdminMenu}
          onRequestClose={() => setShowAdminMenu(false)}
        >
          <TouchableOpacity 
            className="flex-1 bg-black/50"
            activeOpacity={1}
            onPress={() => setShowAdminMenu(false)}
          >
            <View className="flex-1" style={{ paddingTop: SCREEN_HEIGHT * 0.1 }}>
              <View className="absolute top-16 right-4 w-56">
                <View className={`${cardColor} rounded-2xl shadow-2xl ${borderColor} border overflow-hidden`}>
                  {adminActions.map((action, index) => (
                    <TouchableOpacity
                      key={index}
                      className={`flex-row items-center px-4 py-3 ${
                        index !== adminActions.length - 1 ? `border-b ${borderColor}` : ''
                      }`}
                      onPress={action.action}
                    >
                      <MaterialIcons 
                        name={action.icon} 
                        size={20} 
                        color="#3b82f6"
                      />
                      <Text className={`ml-3 ${textColor} font-medium text-base`}>
                        {action.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Profile Menu Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showProfileMenu}
        onRequestClose={() => setShowProfileMenu(false)}
      >
        <TouchableOpacity 
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={() => setShowProfileMenu(false)}
        >
          <View className="flex-1" style={{ paddingTop: SCREEN_HEIGHT * 0.1 }}>
            <View className="absolute top-16 right-4 w-56">
              <View className={`${cardColor} rounded-2xl shadow-2xl ${borderColor} border overflow-hidden`}>
                {profileMenuActions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    className={`flex-row items-center px-4 py-3 ${
                      index !== profileMenuActions.length - 1 ? `border-b ${borderColor}` : ''
                    }`}
                    onPress={action.action}
                  >
                    <MaterialIcons 
                      name={action.icon} 
                      size={20} 
                      color="#3b82f6"
                    />
                    <Text className={`ml-3 ${textColor} font-medium text-base`}>
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Main Content */}
      <View className="flex-1" style={{ paddingTop: Platform.OS === 'ios' ? 0 : 30 }}>
        {/* Header Section */}
        <View className={`px-4 pt-4 pb-3 ${cardColor} shadow-lg ${borderColor} border-b`}>
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <TouchableOpacity 
                className={`w-12 h-12 rounded-full ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                } items-center justify-center mr-3 shadow-md`}
                onPress={() => setShowSidebar(true)}
              >
                <Ionicons name="menu" size={28} color="#3b82f6" />
              </TouchableOpacity>
              
              <View className={`w-14 h-14 rounded-full ${
                theme === 'dark' 
                  ? 'bg-gray-800' 
                  : 'bg-gray-200'
              } items-center justify-center mr-3 shadow-lg`}>
                <FontAwesome5 name="tools" size={24} color="blue" />
              </View>
              
              <View>
                <Text className={`font-bold ${textColor} text-2xl`}>
                  {garageName || 'Quick Fix'}
                </Text>
                <Text className={`${textSecondaryColor} text-sm`}>
                  {garageName ? 'Available Services' : 'Find & Book Services'}
                </Text>
              </View>
            </View>
            
            <View className="flex-row space-x-3 items-center">
              {isAdmin && (
                <TouchableOpacity 
                  className={`w-12 h-12 rounded-full ${
                    theme === 'dark' 
                      ? 'bg-gray-800' 
                      : 'bg-gray-200'
                  } items-center justify-center shadow-md`}
                  onPress={() => setShowAdminMenu(true)}
                >
                  <MaterialIcons name="admin-panel-settings" size={24} color="blue" />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                className={`w-12 h-12 rounded-full ${
                  theme === 'dark' 
                    ? 'bg-gray-800' 
                    : 'bg-gray-200'
                } items-center justify-center shadow-md`}
                onPress={() => setShowProfileMenu(true)}
              >
                <Ionicons name="person" size={24} color="blue" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                className={`w-12 h-12 rounded-full ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-r from-orange-700 to-red-700' 
                    : 'bg-gradient-to-r from-orange-500 to-red-500'
                } items-center justify-center shadow-md`}
                onPress={() => push('/dashboard/bookings')}
              >
                <Ionicons name="calendar" size={24} color="blue" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View className="relative mb-4">
            <TextInput
              className={`${inputBgColor} rounded-full px-5 py-4 pl-12 ${inputTextColor} font-medium ${borderColor} border text-base`}
              placeholder="Search services, garages, parts..."
              placeholderTextColor={textSecondaryColor}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                let filtered = services;
                if (selectedCategory !== 'all') {
                  filtered = filtered.filter(
                    (service: ServiceType) => 
                      service.name?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
                      service.description?.toLowerCase().includes(selectedCategory.toLowerCase())
                  );
                }
                
                if (text.trim() !== '') {
                  filtered = filtered.filter(
                    (service: ServiceType) => 
                      service.name?.toLowerCase().includes(text.toLowerCase()) ||
                      service.description?.toLowerCase().includes(text.toLowerCase()) ||
                      service.garage_name?.toLowerCase().includes(text.toLowerCase())
                  );
                }
                setFilteredServices(filtered);
              }}
            />
            <View className="absolute left-4 top-4">
              <Ionicons name="search" size={20} color="grey" />
            </View>
            {searchQuery && (
              <TouchableOpacity 
                className="absolute right-4 top-4"
                onPress={() => {
                  setSearchQuery('');
                  setFilteredServices(services);
                }}
              >
                <Ionicons name="close-circle" size={20} color={textSecondaryColor} />
              </TouchableOpacity>
            )}
          </View>

          {/* Browse All Garages Button */}
          {!garageName && (
            <TouchableOpacity
              className={`flex-row items-center justify-center py-3.5 rounded-xl ${
                theme === 'dark' 
                  ? 'bg-gray-800' 
                  : 'bg-gray-200'
              } shadow-lg`}
              onPress={handleViewGarages}
            >
              <View className="w-10 h-10 rounded-full bg-gray/20 items-center justify-center mr-3">
                <Ionicons name="business" size={22} color="grey" />
              </View>
              <Text className="text-gray-700 font-bold text-lg flex-1">
                Browse All Garages
              </Text>
              <View className="flex-row items-center">
                <Text className="text-gray-700 text-sm mr-3">
                  {garages.length} available
                </Text>
                <MaterialIcons name="arrow-forward-ios" size={16} color="grey" />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View className={`flex-row px-4 py-3 ${cardColor} ${borderColor} border-b shadow-sm`}>
          <TouchableOpacity 
            className={`flex-1 py-3 rounded-xl mr-2 items-center ${activeTab === 'services' ? tabActiveColor : tabInactiveColor}`}
            onPress={() => setActiveTab('services')}
          >
            <View className="flex-row items-center">
              <Ionicons 
                name="grid" 
                size={20} 
                color={activeTab === 'services' ? 'white' : '#3b82f6'}
              />
              <Text className={`font-semibold text-base ml-2 ${activeTab === 'services' ? tabActiveText : tabInactiveTextColor}`}>
                Services ({filteredServices.length})
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            className={`flex-1 py-3 rounded-xl ml-2 items-center ${activeTab === 'map' ? tabActiveColor : tabInactiveColor}`}
            onPress={() => setActiveTab('map')}
          >
            <View className="flex-row items-center">
              <Ionicons 
                name="map" 
                size={20} 
                color={activeTab === 'map' ? 'white' : '#3b82f6'}
              />
              <Text className={`font-semibold text-base ml-2 ${activeTab === 'map' ? tabActiveText : tabInactiveTextColor}`}>
                Map View
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Services Tab Content */}
        {activeTab === 'services' ? (
          <ScrollView 
            className="flex-1"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#3b82f6']}
                tintColor="#3b82f6"
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ 
              paddingBottom: 100,
              backgroundColor: theme === 'dark' ? '#111827' : '#f9fafb'
            }}
          >
            <View className="px-4 py-4">
              {/* Location Status Card */}
              <TouchableOpacity 
                className={`flex-row items-center justify-between py-4 px-5 rounded-xl ${borderColor} border ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                } shadow-sm mb-6`}
                onPress={() => getUserLocation()}
                disabled={loadingLocation}
              >
                <View className="flex-row items-center">
                  <View className={`w-10 h-10 rounded-full ${
                    loadingLocation ? 'bg-gray-500' : 
                    locationPermissionDenied ? 'bg-red-500' : 
                    'bg-blue-500'
                  } items-center justify-center mr-3`}>
                    <Ionicons 
                      name="location" 
                      size={22} 
                      color="white" 
                    />
                  </View>
                  <View>
                    <Text className={`font-bold ${textColor} text-base`}>
                      {loadingLocation ? 'Getting Location...' : 
                       locationPermissionDenied ? 'Location Disabled' :
                       userLocation ? 'Location Active' : 'Enable Location'}
                    </Text>
                    <Text className={`${textSecondaryColor} text-sm`}>
                      {loadingLocation ? 'Please wait...' : 
                       locationPermissionDenied ? 'Tap to enable location services' :
                       userLocation ? '✓ Using your current location' : 'Tap to enable location access'}
                    </Text>
                  </View>
                </View>
                {userLocation && !loadingLocation && (
                  <View className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold">ACTIVE</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Services List */}
              <View>
                {filteredServices.length === 0 ? (
                  <View className={`${cardColor} rounded-2xl p-8 items-center justify-center ${borderColor} border shadow-sm`}>
                    <Ionicons name="construct-outline" size={72} color="#3b82f6" />
                    <Text className={`${textColor} text-xl font-bold mt-4`}>No Services Found</Text>
                    <Text className={`${textSecondaryColor} text-sm mt-2 text-center mb-6`}>
                      {searchQuery 
                        ? 'No services match your search. Try different keywords.'
                        : 'No services available in this category.'
                      }
                    </Text>
                    {(searchQuery || selectedCategory !== 'all') && (
                      <TouchableOpacity
                        className="px-5 py-3 bg-blue-500 rounded-lg shadow"
                        onPress={() => {
                          setSearchQuery('');
                          setSelectedCategory('all');
                          setFilteredServices(services);
                        }}
                      >
                        <Text className="text-white font-semibold text-sm">Show All Services</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View className="space-y-4">
                    {filteredServices.map((service) => {
                      const distanceText = getServiceDistance(service);
                      
                      return (
                        <TouchableOpacity
                          key={service.id}
                          className={`${cardColor} rounded-2xl p-5 shadow-lg ${borderColor} border`}
                          onPress={() => setSelectedService(service)}
                          activeOpacity={0.7}
                        >
                          <View className="flex-row items-start">
                            <View className={`w-16 h-16 rounded-xl ${
                              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                            } items-center justify-center mr-4 shadow-sm`}>
                              {getServiceIcon(service)}
                            </View>
                            
                            <View className="flex-1">
                              <Text className={`text-xl font-bold ${textColor} mb-2`} numberOfLines={1}>
                                {service.name || 'Unnamed Service'}
                              </Text>
                              
                              {!garageName && service.garage_name && (
                                <View className="flex-row items-center mb-2">
                                  <Ionicons name="business" size={14} color="#3b82f6" />
                                  <Text className={`ml-2 text-sm ${textSecondaryColor}`}>
                                    {service.garage_name}
                                  </Text>
                                </View>
                              )}
                              
                              {service.description && (
                                <Text className={`mb-3 ${textSecondaryColor}`} numberOfLines={2}>
                                  {service.description}
                                </Text>
                              )}
                              
                              <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center space-x-4">
                                  <View className="flex-row items-center">
                                    <Ionicons name="time" size={16} color="#3b82f6" />
                                    <Text className={`ml-1 ${textSecondaryColor}`}>{service.duration}</Text>
                                  </View>
                                  
                                  <View className="flex-row items-center">
                                    <Ionicons name="location" size={14} color="#3b82f6" />
                                    <Text className={`ml-1 text-sm ${textSecondaryColor}`}>
                                      {distanceText}
                                    </Text>
                                  </View>
                                </View>
                                
                                <View>
                                  <Text className="text-blue-500">
                                    {parseFloat(service.base_price || '0').toFixed(2)} Tsh
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        ) : (
          /* Map View Tab Content */
          <View className="flex-1">
            {mapRegion ? (
              <MapView
                ref={mapRef}
                style={{ width: '100%', height: '100%' }}
                provider={PROVIDER_GOOGLE}
                region={mapRegion}
                showsUserLocation={true}
                showsMyLocationButton={true}
                showsCompass={true}
                showsScale={true}
              >
                {/* User Location Marker */}
                {userLocation && (
                  <Marker
                    coordinate={{
                      latitude: userLocation.latitude,
                      longitude: userLocation.longitude,
                    }}
                    title="Your Location"
                    description="You are here"
                    pinColor="#3b82f6"
                  >
                    <View className="items-center justify-center">
                      <View className="w-12 h-12 bg-blue-500/20 rounded-full items-center justify-center">
                        <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center">
                          <Ionicons name="person" size={16} color="white" />
                        </View>
                      </View>
                    </View>
                  </Marker>
                )}
                
                {/* Service Location Markers */}
                {filteredServices.map((service) => {
                  const foundGarage = garages.find(g => g.id === service.garage);
                  if (!foundGarage || !foundGarage.latitude || !foundGarage.longitude) return null;
                  
                  const lat = parseFloat(foundGarage.latitude as string);
                  const lng = parseFloat(foundGarage.longitude as string);
                  if (isNaN(lat) || isNaN(lng)) return null;
                  
                  return (
                    <Marker
                      key={service.id}
                      coordinate={{
                        latitude: lat,
                        longitude: lng,
                      }}
                      title={service.name || 'Service'}
                      description={`${foundGarage.name} - Tsh${parseFloat(service.base_price || '0').toFixed(2)}`}
                      onPress={() => setSelectedService(service)}
                    >
                      <View className="items-center justify-center">
                        <View className={`w-14 h-14 rounded-full ${
                          service.id === selectedService?.id ? 'bg-orange-500/30' : 'bg-blue-500/30'
                        } items-center justify-center`}>
                          <View className={`w-10 h-10 rounded-full ${
                            service.id === selectedService?.id ? 'bg-orange-500' : 'bg-blue-500'
                          } items-center justify-center`}>
                            <Ionicons name="build" size={20} color="white" />
                          </View>
                        </View>
                      </View>
                    </Marker>
                  );
                })}
              </MapView>
            ) : (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className={`mt-4 ${textColor}`}>Loading map...</Text>
              </View>
            )}
          </View>
        )}
        
        {/* Footer Spacer */}
        <View className={`absolute bottom-0 left-0 right-0 h-32 ${
          theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
           <View className="flex-row justify-center items-center">
            <Text className={`text-sm ${textSecondaryColor}`}>
              @QuickFix 2025 • Vol 0.0.1
            </Text>
         
        </View>
          </View>
       
        
      </View>

      {/* Service Detail Modal */}
      {selectedService && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={!!selectedService}
          onRequestClose={() => setSelectedService(null)}
        >
          <TouchableOpacity 
            className="flex-1 bg-black/70 justify-center items-center"
            activeOpacity={1}
            onPress={() => setSelectedService(null)}
          >
            <TouchableOpacity 
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              className={`${cardColor} rounded-3xl p-6 m-5 w-[90%] max-w-md shadow-2xl`}
            >
              <View className="flex-row justify-between items-center mb-4">
                <Text className={`text-2xl font-bold ${textColor}`}>Service Details</Text>
                <TouchableOpacity 
                  className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center"
                  onPress={() => setSelectedService(null)}
                >
                  <Ionicons name="close" size={24} color="#3b82f6" />
                </TouchableOpacity>
              </View>
              
              <View className="flex-row items-center mb-4">
                <View className={`w-16 h-16 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} items-center justify-center mr-4 shadow`}>
                  {getServiceIcon(selectedService)}
                </View>
                <View className="flex-1">
                  <Text className={`text-xl font-bold ${textColor}`}>{selectedService.name || 'Service'}</Text>
                  <Text className={`text-sm ${textSecondaryColor}`}>
                    {selectedService.garage_name || 'Available at multiple garages'}
                  </Text>
                </View>
              </View>
              
              <Text className="text-3xl font-bold text-blue-500 mb-2">
                {parseFloat(selectedService.base_price || '0').toFixed(2)} Tsh
              </Text>
              
              <View className="flex-row items-center mb-4">
                <Ionicons name="time" size={16} color="#3b82f6" />
                <Text className={`ml-2 ${textSecondaryColor}`}>{selectedService.duration}</Text>
                <View className="ml-4 flex-row items-center">
                  <Ionicons name="location" size={14} color="#3b82f6" />
                  <Text className={`ml-1 text-sm ${textSecondaryColor}`}>
                    {getServiceDistance(selectedService)}
                  </Text>
                </View>
              </View>
              
              {selectedService.description && (
                <Text className={`${textColor} mb-6`}>{selectedService.description}</Text>
              )}
              
              <View className="space-y-3">
                <TouchableOpacity
                  className="py-3 bg-blue-500 rounded-xl items-center shadow"
                  onPress={() => {
                    setSelectedService(null);
                    handleViewGarages();
                  }}
                >
                  <Text className="text-white font-bold text-base">Get Directions</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="py-3 bg-blue-600 rounded-xl items-center shadow"
                  onPress={() => {
                    setSelectedService(null);
                    push('/dashboard/bookings');
                  }}
                >
                  <Text className="text-white font-bold text-base">Book Service</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="py-3 bg-gray-200 dark:bg-gray-800 rounded-xl items-center"
                  onPress={() => setSelectedService(null)}
                >
                  <Text className={textColor}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </SafeAreaView>
  );
}