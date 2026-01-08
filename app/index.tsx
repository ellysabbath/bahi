import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Clock, MapPin, Search, Star, Menu } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  useColorScheme
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

interface Service {
  id: number;
  name: string;
  description: string;
  base_price: string;
  duration: string;
  garage: number;
  garage_name?: string;
  rating?: number;
  category?: string;
}

interface Garage {
  id: number;
  name: string;
}

const API_BASE_URL = 'https://AutoFix.pythonanywhere.com';

// Theme colors configuration
const themeColors = {
  light: {
    background: '#f9fafb',
    cardBackground: '#ffffff',
    cardBorder: '#e5e7eb',
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',
    headerBackground: '#ffffff',
    headerBorder: '#e5e7eb',
    searchBackground: '#f3f4f6',
    buttonPrimary: '#2563eb',
    buttonSecondary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    iconPrimary: '#374151',
    iconSecondary: '#6b7280',
    overlay: 'rgba(0, 0, 0, 0.5)',
    mapBackground: '#ffffff',
    mapControls: '#ffffff',
  },
  dark: {
    background: '#111827',
    cardBackground: '#1f2937',
    cardBorder: '#374151',
    textPrimary: '#f9fafb',
    textSecondary: '#d1d5db',
    textTertiary: '#9ca3af',
    headerBackground: '#1f2937',
    headerBorder: '#374151',
    searchBackground: '#374151',
    buttonPrimary: '#3b82f6',
    buttonSecondary: '#60a5fa',
    success: '#34d399',
    warning: '#fbbf24',
    danger: '#f87171',
    iconPrimary: '#f3f4f6',
    iconSecondary: '#d1d5db',
    overlay: 'rgba(0, 0, 0, 0.7)',
    mapBackground: '#1f2937',
    mapControls: '#1f2937',
  }
};

export default function ServicesGridScreen() {
  const { theme, toggleTheme } = useTheme();
  const colors = themeColors[theme];
  const systemTheme = useColorScheme();
  
  const [services, setServices] = useState<Service[]>([]);
  const [garages, setGarages] = useState<Garage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [showMapModal, setShowMapModal] = useState(false);
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [heading, setHeading] = useState<number | null>(null);
  const [mapRegion, setMapRegion] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  
  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    fetchAllData();
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const servicesResponse = await fetch(`${API_BASE_URL}/services/`);
      if (!servicesResponse.ok) throw new Error('Failed to fetch services');
      const servicesData = await servicesResponse.json();
      const servicesList = servicesData.results || servicesData;
      
      const garagesResponse = await fetch(`${API_BASE_URL}/garages/`);
      if (!garagesResponse.ok) throw new Error('Failed to fetch garages');
      const garagesData = await garagesResponse.json();
      const garagesList = garagesData.results || garagesData;
      setGarages(garagesList);
      
      const processedServices = servicesList.map((service: any) => {
        const garage = garagesList.find((g: any) => g.id === service.garage);
        
        let category = 'General';
        const serviceName = (service.name || '').toLowerCase();
        if (serviceName.includes('oil') || serviceName.includes('change')) category = 'Maintenance';
        if (serviceName.includes('wash') || serviceName.includes('clean')) category = 'Cleaning';
        if (serviceName.includes('tire') || serviceName.includes('wheel')) category = 'Tires';
        if (serviceName.includes('repair') || serviceName.includes('fix')) category = 'Repair';
        if (serviceName.includes('ac') || serviceName.includes('cool')) category = 'AC';
        if (serviceName.includes('brake')) category = 'Brakes';
        if (serviceName.includes('battery')) category = 'Battery';
        
        return {
          id: service.id,
          name: service.name || 'Service',
          description: service.description || 'Professional service',
          base_price: service.base_price || '0',
          duration: service.duration || '1-2 hours',
          garage: service.garage,
          garage_name: garage?.name || 'Partner Garage',
          rating: service.rating || 4.0 + Math.random() * 1.0,
          category: category,
        };
      });
      
      setServices(processedServices);
      
      const uniqueCategories = ['all', ...new Set(processedServices.map((s: Service) => s.category))] as string[];
      setCategories(uniqueCategories);
      
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setServices([]);
      setGarages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      setShowMenu(false);
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Permission', 'Please enable location services to see your current position on the map.');
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        distanceInterval: 10,
      });
      
      const currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setUserLocation(currentLocation);
      setLocationAccuracy(location.coords.accuracy);
      
      const address = await Location.reverseGeocodeAsync(currentLocation);
      if (address.length > 0) {
        const addr = address[0];
        const addressParts = [
          addr.name,
          addr.street,
          addr.district,
          addr.city,
          addr.region,
          addr.country
        ].filter(Boolean);
        setLocationAddress(addressParts.join(', ') || 'Your current location');
      }
      
      const region = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      setMapRegion(region);
      setShowMapModal(true);
      
      startWatchingLocation();
      
    } catch (error: any) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Could not get your current location. Please ensure GPS is enabled.');
    } finally {
      setLocationLoading(false);
    }
  };

  const startWatchingLocation = async () => {
    try {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
          timeInterval: 1000,
        },
        (newLocation) => {
          setUserLocation({
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          });
          setLocationAccuracy(newLocation.coords.accuracy);
          setHeading(newLocation.coords.heading);
          
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }, 1000);
          }
        }
      );
    } catch (error) {
      console.error('Error watching location:', error);
    }
  };

  const handleGetDirections = async () => {
    if (!userLocation) return;
    
    const latLng = `${userLocation.latitude},${userLocation.longitude}`;
    const label = 'My Current Location';
    
    let url = '';
    
    if (Platform.OS === 'ios') {
      url = `maps://?q=${encodeURIComponent(label)}&ll=${latLng}`;
    } else {
      url = `geo:${latLng}?q=${latLng}(${encodeURIComponent(label)})`;
    }
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${latLng}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Error opening maps:', error);
      Alert.alert('Error', 'Could not open maps application');
    }
  };

  const centerMapOnUser = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const resetMapView = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = searchQuery === '' || 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.garage_name && service.garage_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
      service.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const formatPrice = (price: string) => {
    const amount = parseFloat(price);
    return isNaN(amount) ? '0' : amount.toLocaleString('en-TZ');
  };

  const renderServiceCard = ({ item }: { item: Service }) => (
    <TouchableOpacity
      onPress={() => {
        // FIXED: Using the same format as login navigation in dropdown
        router.push('/dashboard/garages' as any);
      }}
      style={{
        backgroundColor: colors.cardBackground,
        borderColor: colors.cardBorder,
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        marginHorizontal: 4,
        width: CARD_WIDTH,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      {/* Service Icon */}
      <View style={{
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
      }}>
        {getCategoryIcon(item.category || 'General')}
      </View>
      
      {/* Service Name */}
      <Text style={{
        color: colors.textPrimary,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
        lineHeight: 20,
      }} numberOfLines={2}>
        {item.name}
      </Text>
      
      {/* Garage Name */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <MapPin size={12} color={colors.iconSecondary} />
        <Text style={{
          marginLeft: 4,
          color: colors.textSecondary,
          fontSize: 12,
        }} numberOfLines={1}>
          {item.garage_name}
        </Text>
      </View>
      
      {/* Rating */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Star size={12} color="#f59e0b" fill="#f59e0b" />
        <Text style={{
          marginLeft: 4,
          color: colors.textPrimary,
          fontSize: 12,
          fontWeight: '500',
        }}>
          {item.rating?.toFixed(1) || '4.5'}
        </Text>
      </View>
      
      {/* Duration */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Clock size={12} color={colors.iconSecondary} />
        <Text style={{
          marginLeft: 4,
          color: colors.textTertiary,
          fontSize: 12,
        }}>
          {item.duration}
        </Text>
      </View>
      
      {/* Price and Action */}
      <View style={{ 
        borderTopWidth: 1, 
        borderTopColor: colors.cardBorder,
        paddingTop: 12 
      }}>
        <Text style={{
          color: '#10b981',
          fontSize: 16,
          fontWeight: '700',
          marginBottom: 8,
        }}>
          Tsh {formatPrice(item.base_price)}
        </Text>
        
        <TouchableOpacity 
          style={{
            backgroundColor: colors.buttonPrimary,
            paddingVertical: 10,
            borderRadius: 8,
          }}
          onPress={() => {
            // FIXED: Using the same format as login navigation in dropdown
            router.push('/dashboard/garages' as any);
          }}
        >
          <Text style={{
            color: '#ffffff',
            textAlign: 'center',
            fontSize: 14,
            fontWeight: '500',
          }}>
            Book
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const getCategoryIcon = (category: string) => {
    const iconColor = theme === 'dark' ? '#60a5fa' : '#2563eb';
    switch(category.toLowerCase()) {
      case 'maintenance':
        return <Ionicons name="construct-outline" size={24} color={iconColor} />;
      case 'cleaning':
        return <Ionicons name="water-outline" size={24} color={iconColor} />;
      case 'tires':
        return <Ionicons name="car-outline" size={24} color={iconColor} />;
      case 'repair':
        return <Ionicons name="build-outline" size={24} color={iconColor} />;
      case 'ac':
        return <Ionicons name="snow-outline" size={24} color={iconColor} />;
      case 'brakes':
        return <Ionicons name="disc-outline" size={24} color={iconColor} />;
      case 'battery':
        return <Ionicons name="battery-charging-outline" size={24} color={iconColor} />;
      default:
        return <Ionicons name="car-sport-outline" size={24} color={iconColor} />;
    }
  };

  const MapModal = () => {
    if (!showMapModal) return null;

    return (
      <View style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: colors.mapBackground,
        zIndex: 1000 
      }}>
        {/* Header */}
        <View style={{
          backgroundColor: colors.headerBackground,
          paddingHorizontal: 16,
          paddingTop: 60, // Increased for status bar
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.headerBorder,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => setShowMapModal(false)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.searchBackground,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.iconPrimary} />
            </TouchableOpacity>
            
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: colors.textPrimary,
            }}>
              Your Current Location
            </Text>
            
            <TouchableOpacity
              onPress={handleGetDirections}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.buttonPrimary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="navigate" size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Location Info */}
          <View style={{
            backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
            padding: 12,
            borderRadius: 8,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: colors.textPrimary,
                  fontWeight: '500',
                  marginBottom: 4,
                }}>
                  {locationAddress || 'Your current location'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="location-outline" size={14} color={colors.buttonPrimary} />
                  <Text style={{
                    color: colors.textSecondary,
                    fontSize: 12,
                    marginLeft: 4,
                  }}>
                    {userLocation ? 
                      `${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)}` : 
                      'No location data'
                    }
                  </Text>
                </View>
                {locationAccuracy && (
                  <Text style={{
                    color: colors.textTertiary,
                    fontSize: 12,
                    marginTop: 4,
                  }}>
                    Accuracy: {locationAccuracy.toFixed(1)} meters
                  </Text>
                )}
              </View>
              
              <TouchableOpacity
                onPress={centerMapOnUser}
                style={{
                  marginLeft: 16,
                  padding: 8,
                  backgroundColor: colors.buttonPrimary,
                  borderRadius: 8,
                }}
              >
                <Ionicons name="locate" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Map Container */}
        <View style={{ flex: 1 }}>
          {userLocation && mapRegion ? (
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              provider={PROVIDER_GOOGLE}
              region={mapRegion}
              showsUserLocation={true}
              showsMyLocationButton={false}
              showsCompass={true}
              showsScale={true}
              showsBuildings={true}
              showsTraffic={false}
              showsIndoors={false}
              showsPointsOfInterest={true}
              zoomEnabled={true}
              zoomControlEnabled={true}
              scrollEnabled={true}
              rotateEnabled={true}
              pitchEnabled={true}
              toolbarEnabled={true}
              mapType="standard"
            >
              <Marker
                coordinate={userLocation}
                tracksViewChanges={false}
              >
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  {heading !== null && (
                    <View style={{
                      transform: [{ rotate: `${heading}deg` }],
                      marginBottom: 4
                    }}>
                      <Ionicons name="arrow-up" size={20} color={colors.buttonPrimary} />
                    </View>
                  )}
                  
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.buttonPrimary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: 'white',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 5,
                  }}>
                    <Ionicons name="person" size={16} color="white" />
                  </View>
                  
                  {locationAccuracy && (
                    <View 
                      style={{
                        position: 'absolute',
                        borderWidth: 2,
                        borderColor: 'rgba(59, 130, 246, 0.3)',
                        borderRadius: 9999,
                        width: Math.min((locationAccuracy * 2) / 5, 100),
                        height: Math.min((locationAccuracy * 2) / 5, 100),
                      }}
                    />
                  )}
                </View>
              </Marker>
            </MapView>
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
              <ActivityIndicator size="large" color={colors.buttonPrimary} />
              <Text style={{ color: colors.textSecondary, marginTop: 16 }}>Loading map...</Text>
            </View>
          )}
        </View>
        
        {/* Bottom Controls */}
        <View style={{ position: 'absolute', bottom: 16, left: 0, right: 0, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  if (mapRef.current && mapRegion) {
                    mapRef.current.animateToRegion({
                      latitude: mapRegion.latitude,
                      longitude: mapRegion.longitude,
                      latitudeDelta: mapRegion.latitudeDelta * 0.5,
                      longitudeDelta: mapRegion.longitudeDelta * 0.5,
                    }, 500);
                  }
                }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.mapControls,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Ionicons name="add" size={24} color={colors.iconPrimary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  if (mapRef.current && mapRegion) {
                    mapRef.current.animateToRegion({
                      latitude: mapRegion.latitude,
                      longitude: mapRegion.longitude,
                      latitudeDelta: mapRegion.latitudeDelta * 2,
                      longitudeDelta: mapRegion.longitudeDelta * 2,
                    }, 500);
                  }
                }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.mapControls,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Ionicons name="remove" size={24} color={colors.iconPrimary} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              onPress={resetMapView}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.mapControls,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Ionicons name="compass" size={24} color={colors.iconPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const MenuDropdown = () => {
    if (!showMenu) return null;

    return (
      <Modal
        transparent={true}
        visible={showMenu}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: colors.overlay }}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={{ 
            position: 'absolute', 
            right: 16, 
            top: 100, // Adjusted position for better visibility
            width: 200, 
            backgroundColor: colors.cardBackground,
            borderRadius: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
            borderWidth: 1,
            borderColor: colors.cardBorder,
          }}>
            {/* Theme Toggle */}
            <TouchableOpacity
              onPress={() => {
                toggleTheme();
                setShowMenu(false);
              }}
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingHorizontal: 16, 
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.cardBorder,
              }}
            >
              {theme === 'dark' ? (
                <Ionicons name="sunny-outline" size={20} color="#f59e0b" />
              ) : (
                <Ionicons name="moon-outline" size={20} color={colors.iconPrimary} />
              )}
              <Text style={{ 
                marginLeft: 12, 
                color: colors.textPrimary, 
                fontWeight: '500',
                fontSize: 14,
              }}>
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </Text>
            </TouchableOpacity>

            {/* Location */}
            <TouchableOpacity
              onPress={getCurrentLocation}
              disabled={locationLoading}
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingHorizontal: 16, 
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.cardBorder,
              }}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color={colors.buttonPrimary} />
              ) : (
                <Ionicons name="map-outline" size={20} color={colors.buttonPrimary} />
              )}
              <Text style={{ 
                marginLeft: 12, 
                color: colors.textPrimary, 
                fontWeight: '500',
                fontSize: 14,
              }}>
                {locationLoading ? 'Getting Location...' : 'Show My Location'}
              </Text>
            </TouchableOpacity>

            {/* Sign In */}
            <TouchableOpacity
              onPress={() => {
                setShowMenu(false);
                // FIXED: Using the same format as in dropdown
                router.push('/login' as any);
              }}
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingHorizontal: 16, 
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.cardBorder,
              }}
            >
              <Ionicons name="log-in-outline" size={20} color={colors.success} />
              <Text style={{ 
                marginLeft: 12, 
                color: colors.textPrimary, 
                fontWeight: '500',
                fontSize: 14,
              }}>Sign In</Text>
            </TouchableOpacity>

            {/* Register */}
            <TouchableOpacity
              onPress={() => {
                setShowMenu(false);
                // FIXED: Using the same format as in dropdown
                router.push('/register' as any);
              }}
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingHorizontal: 16, 
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.cardBorder,
              }}
            >
              <Ionicons name="person-add-outline" size={20} color="#8b5cf6" />
              <Text style={{ 
                marginLeft: 12, 
                color: colors.textPrimary, 
                fontWeight: '500',
                fontSize: 14,
              }}>Register</Text>
            </TouchableOpacity>

            {/* Help */}
            <TouchableOpacity
              onPress={() => {
                setShowMenu(false);
                // FIXED: Using the same format as in dropdown
                router.push('/dashboard/help' as any);
              }}
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingHorizontal: 16, 
                paddingVertical: 12,
              }}
            >
              <Ionicons name="help-circle-outline" size={20} color={colors.warning} />
              <Text style={{ 
                marginLeft: 12, 
                color: colors.textPrimary, 
                fontWeight: '500',
                fontSize: 14,
              }}>Help & Support</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header with increased padding top */}
      <View style={{
        backgroundColor: colors.headerBackground,
        paddingHorizontal: 16,
        paddingTop: 60, // Increased padding top for status bar
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.headerBorder,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={require('../assets/images/QUICKFIXAUTOMOTIVELOGOWHT.png')}
              style={{ width: 40, height: 40 }}
              resizeMode="contain"
            />
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: colors.textPrimary,
              marginLeft: 8,
            }}>
              QuickFix 
            </Text>
          </View>
          
          {/* Menu Button */}
          <TouchableOpacity
            onPress={() => setShowMenu(true)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.searchBackground,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Menu size={20} color={colors.iconPrimary} />
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View style={{ position: 'relative' }}>
          <View style={{ position: 'absolute', left: 12, top: 12, zIndex: 10 }}>
            <Search size={20} color={colors.iconSecondary} />
          </View>
          <TextInput
            style={{
              backgroundColor: colors.searchBackground,
              borderRadius: 8,
              paddingLeft: 44,
              paddingRight: searchQuery ? 44 : 16,
              paddingVertical: 12,
              color: colors.textPrimary,
              fontSize: 16,
            }}
            placeholder="Search services, garages..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity 
              style={{ position: 'absolute', right: 12, top: 12, zIndex: 10 }}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={20} color={colors.iconSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      
      {/* Categories Filter */}
      {categories.length > 0 && (
        <View style={{
          backgroundColor: colors.headerBackground,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.headerBorder,
        }}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedCategory(item)}
                style={{
                  marginRight: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: selectedCategory === item 
                    ? colors.buttonPrimary 
                    : colors.searchBackground,
                }}
              >
                <Text style={{
                  fontSize: 14,
                  color: selectedCategory === item 
                    ? '#ffffff' 
                    : colors.textPrimary,
                  fontWeight: selectedCategory === item ? '600' : '400',
                }}>
                  {item === 'all' ? 'All' : item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
      
      {/* Services Grid with increased padding top */}
      <FlatList
        data={filteredServices}
        renderItem={renderServiceCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
        contentContainerStyle={{ 
          paddingTop: 20, // Increased padding top
          paddingBottom: 20,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: colors.textPrimary,
              marginTop: 8,
            }}>
              Available Services
              {filteredServices.length > 0 && (
                <Text style={{
                  fontSize: 16,
                  fontWeight: '400',
                  color: colors.textSecondary,
                }}>
                  {' '}({filteredServices.length} found)
                </Text>
              )}
            </Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
              <ActivityIndicator size="large" color={colors.buttonPrimary} />
              <Text style={{ color: colors.textSecondary, marginTop: 16 }}>Loading services...</Text>
            </View>
          ) : (
            <View style={{ paddingVertical: 40, alignItems: 'center', minHeight: 300 }}>
              <Ionicons name="car-outline" size={64} color={colors.textTertiary} />
              <Text style={{
                color: colors.textPrimary,
                fontSize: 18,
                fontWeight: '500',
                marginTop: 16,
              }}>
                {searchQuery ? 'No matching services' : 'No services available'}
              </Text>
              <Text style={{
                color: colors.textSecondary,
                textAlign: 'center',
                marginTop: 8,
                paddingHorizontal: 32,
              }}>
                {searchQuery 
                  ? 'Try a different search term'
                  : 'Check back later for available services'
                }
              </Text>
              {searchQuery && (
                <TouchableOpacity 
                  onPress={() => setSearchQuery('')}
                  style={{
                    marginTop: 16,
                    backgroundColor: colors.buttonPrimary,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '500' }}>Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.buttonPrimary]}
            tintColor={theme === 'dark' ? colors.textSecondary : undefined}
          />
        }
        showsVerticalScrollIndicator={false}
      />
      
      {/* Security Notice */}
      <View style={{
        backgroundColor: colors.headerBackground,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: colors.headerBorder,
      }}>
        <Text style={{
          color: '#f59e0b',
          textAlign: 'center',
          fontSize: 14,
          lineHeight: 20,
        }}>
          ⚠️ For security cases, Use this app, we provide re-fund for incompleted services, honestly provide submission within the App

        </Text>
              {/* Footer */}
      <View style={{
        backgroundColor: colors.headerBackground,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: colors.headerBorder,
      }}>
        <Text style={{
          color: colors.textTertiary,
          textAlign: 'center',
          fontSize: 12,
          marginBottom: 8,
        }}>
          @QuickFix Services 2025. All rights reserved.
        </Text>
      </View>

      </View>
      

      {/* Map Modal */}
      <MapModal />

      {/* Menu Dropdown */}
      <MenuDropdown />
    </View>
  );
}