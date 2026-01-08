// app/admin/services/index.tsx
import {
  FontAwesome5,
  Ionicons,
  MaterialIcons,
} from '@expo/vector-icons';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

// API Configuration
const API_BASE_URL = 'https://AutoFix.pythonanywhere.com';
const SERVICES_ENDPOINT = `${API_BASE_URL}/api/services/`;
const GARAGES_ENDPOINT = `${API_BASE_URL}/api/garages/`;

interface ServiceType {
  id: number;
  name: string;
  description: string;
  category: string;
  base_price: number | string;
  price: number | string;
  icon: string;
  color: string;
  garage: number | null; // Garage ID
  garage_name?: string; // Optional garage name from serializer
  created_at: string;
  updated_at: string;
}

interface GarageType {
  id: number;
  name: string;
  address: string;
  city: string;
}

// Success Modal Component
const SuccessModal = ({ visible, message, onClose }: { 
  visible: boolean; 
  message: string;
  onClose: () => void;
}) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [checkOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.elastic(1.2),
          useNativeDriver: true,
        }),
        Animated.timing(checkOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        onClose();
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      scaleAnim.setValue(0);
      checkOpacity.setValue(0);
    }
  }, [visible, scaleAnim, checkOpacity, onClose]); // Fixed: Added all dependencies

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View className="flex-1 bg-black/50 justify-center items-center">
        <View className="bg-white dark:bg-gray-800 rounded-3xl p-8 items-center mx-6 shadow-2xl">
          <Animated.View 
            className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full justify-center items-center mb-6"
            style={{ transform: [{ scale: scaleAnim }] }}
          >
            <Animated.View style={{ opacity: checkOpacity }}>
              <View className="w-12 h-12 bg-green-500 rounded-full justify-center items-center">
                <Ionicons name="checkmark" size={32} color="white" />
              </View>
            </Animated.View>
          </Animated.View>
          
          <Text className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Success!
          </Text>
          <Text className="text-gray-600 dark:text-gray-300 text-center text-base">
            {message}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

// Confirmation Modal Component
const ConfirmationModal = ({ 
  visible, 
  title, 
  message, 
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm, 
  onCancel,
  isDestructive = false,
}: { 
  visible: boolean; 
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}) => {
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
          <View className="items-center mb-6">
            <View className={`w-16 h-16 rounded-full ${isDestructive ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'} justify-center items-center mb-4`}>
              <Ionicons 
                name={isDestructive ? "warning" : "help-circle"} 
                size={32} 
                color={isDestructive ? "#ef4444" : "#3b82f6"} 
              />
            </View>
            <Text className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              {title}
            </Text>
            <Text className="text-gray-600 dark:text-gray-300 text-center">
              {message}
            </Text>
          </View>

          <View className="flex-row space-x-3">
            <TouchableOpacity 
              className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl"
              onPress={onCancel}
            >
              <Text className="text-gray-700 dark:text-gray-300 font-semibold text-center">
                {cancelText}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className={`flex-1 py-3 ${isDestructive ? 'bg-red-600' : 'bg-blue-600'} rounded-xl`}
              onPress={onConfirm}
            >
              <Text className="text-white font-semibold text-center">
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ColorCircle Component
const ColorCircle = ({ 
  color, 
  isSelected, 
  onPress, 
  disabled 
}: { 
  color: string; 
  isSelected: boolean; 
  onPress: () => void; 
  disabled: boolean;
}) => {
  return (
    <TouchableOpacity
      style={{ 
        backgroundColor: color,
        width: 40,
        height: 40,
        borderRadius: 8,
        margin: 4,
        ...(isSelected ? {
          borderWidth: 2,
          borderColor: '#3b82f6',
        } : {})
      }}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    />
  );
};

// IconSelector Component
const IconSelector = ({ 
  selectedIcon, 
  onSelect, 
  disabled,
  theme 
}: { 
  selectedIcon: string; 
  onSelect: (icon: string) => void; 
  disabled: boolean;
  theme: string;
}) => {
  const icons = ['build', 'car', 'tools', 'oil-can', 'tire', 'battery', 'filter'];
  const iconColor = '#ffffff';

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'oil-can':
        return <FontAwesome5 name="oil-can" size={20} color={iconColor} />;
      case 'tire':
        return <FontAwesome5 name="tire" size={20} color={iconColor} />;
      case 'tools':
        return <FontAwesome5 name="tools" size={20} color={iconColor} />;
      case 'car':
        return <FontAwesome5 name="car" size={20} color={iconColor} />;
      case 'battery':
        return <FontAwesome5 name="car-battery" size={20} color={iconColor} />;
      case 'filter':
        return <FontAwesome5 name="filter" size={20} color={iconColor} />;
      default:
        return <MaterialIcons name="build" size={20} color={iconColor} />;
    }
  };

  return (
    <View className="flex-row flex-wrap">
      {icons.map((icon) => (
        <TouchableOpacity
          key={`icon-${icon}`}
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: selectedIcon === icon 
              ? '#3b82f6' 
              : theme === 'dark' 
                ? '#374151' 
                : '#e5e7eb',
            margin: 4,
          }}
          onPress={() => onSelect(icon)}
          disabled={disabled}
          activeOpacity={0.7}
        >
          {renderIcon(icon)}
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Helper function to format currency with Tzs/=
const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return 'Tzs/= 0.00';
  
  // Format with thousand separators
  const formatted = new Intl.NumberFormat('en-TZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
  
  return `Tzs/= ${formatted}`;
};

// REMOVED: formatCurrencyNumber function since it's not used

export default function ServicesManagement() {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [garages, setGarages] = useState<GarageType[]>([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [apiLoading, setApiLoading] = useState(true);
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form state for services
  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    description: '',
    category: 'General',
    base_price: '',
    price: '',
    icon: 'build',
    color: '#3b82f6',
    garage: '', // Garage ID as string
  });

  const { theme } = useTheme();
  // REMOVED: const router = useRouter(); // Not used in this component

  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
  const textColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const cardColor = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  const inputBgColor = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100';
  const inputTextColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-800';

  // Color options for selector
  const colorOptions = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'];

  // Fetch services from API
  const fetchServices = async () => {
    try {
      setApiLoading(true);
      console.log('Fetching services from:', SERVICES_ENDPOINT);
      const response = await fetch(SERVICES_ENDPOINT);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Services API response:', data);
      
      // Handle pagination if response has 'results' field
      const servicesList = data.results || data;
      
      // Ensure all fields are properly formatted
      const formattedServices = (Array.isArray(servicesList) ? servicesList : []).map((service: any) => ({
        ...service,
        base_price: service.base_price || 0,
        price: service.price || service.base_price || 0,
        icon: service.icon || 'build',
        color: service.color || '#3b82f6',
        category: service.category || 'General',
        garage: service.garage || null,
        garage_name: service.garage_name || null,
      }));
      
      setServices(formattedServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      Alert.alert('Error', 'Failed to load services. Please try again.');
    } finally {
      setApiLoading(false);
    }
  };

  // Fetch garages from API
  const fetchGarages = async () => {
    try {
      console.log('Fetching garages from:', GARAGES_ENDPOINT);
      const response = await fetch(GARAGES_ENDPOINT);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Garages API response:', data);
      
      // Handle pagination if response has 'results' field
      const garagesList = data.results || data;
      
      setGarages(Array.isArray(garagesList) ? garagesList : []);
    } catch (error) {
      console.error('Error fetching garages:', error);
      Alert.alert('Error', 'Failed to load garages.');
    }
  };

  useEffect(() => {
    fetchGarages();
    fetchServices();
  }, []);

  const filteredServices = services.filter(service =>
    service.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.garage_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Service CRUD Operations
  const handleEditService = (service: ServiceType) => {
    setEditingService(service);
    setServiceFormData({
      name: service.name || '',
      description: service.description || '',
      category: service.category || 'General',
      base_price: service.base_price?.toString() || '',
      price: service.price?.toString() || service.base_price?.toString() || '',
      icon: service.icon || 'build',
      color: service.color || '#3b82f6',
      garage: service.garage?.toString() || '',
    });
    setShowServiceModal(true);
  };

  const handleAddService = () => {
    setEditingService(null);
    setServiceFormData({
      name: '',
      description: '',
      category: 'General',
      base_price: '',
      price: '',
      icon: 'build',
      color: '#3b82f6',
      garage: '',
    });
    setShowServiceModal(true);
  };

  // Custom fetch function
  const apiFetch = async (url: string, options: any = {}) => {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);
      return response;
    } catch (error) {
      console.error('API fetch error:', error);
      throw error;
    }
  };

  const handleSaveService = async () => {
    if (!serviceFormData.name || !serviceFormData.description || !serviceFormData.category || !serviceFormData.base_price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    const serviceData: any = {
      name: serviceFormData.name,
      description: serviceFormData.description,
      category: serviceFormData.category,
      base_price: parseFloat(serviceFormData.base_price) || 0,
      icon: serviceFormData.icon,
      color: serviceFormData.color,
    };

    // Add price if provided
    if (serviceFormData.price) {
      serviceData.price = parseFloat(serviceFormData.price) || 0;
    }

    // Add garage if selected
    if (serviceFormData.garage) {
      serviceData.garage = parseInt(serviceFormData.garage);
    }

    console.log('Saving service data:', serviceData);

    try {
      let response;
      
      if (editingService) {
        // Update existing service
        response = await apiFetch(`${SERVICES_ENDPOINT}${editingService.id}/`, {
          method: 'PUT',
          body: JSON.stringify(serviceData),
        });
      } else {
        // Add new service
        response = await apiFetch(SERVICES_ENDPOINT, {
          method: 'POST',
          body: JSON.stringify(serviceData),
        });
      }
      
      console.log('Save response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Save error response:', errorData);
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Save successful:', result);
      
      setSuccessMessage(editingService ? 'Service updated successfully' : 'Service added successfully');
      setShowSuccessModal(true);
      setShowServiceModal(false);
      
      // Refresh the services list
      await fetchServices();
    } catch (error: any) {
      console.error('Error saving service:', error);
      Alert.alert('Error', error.message || 'Failed to save service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = (serviceId: number) => {
    setItemToDelete(serviceId);
    setShowDeleteModal(true);
  };

  const confirmDeleteService = async () => {
    if (!itemToDelete) return;
    
    try {
      setLoading(true);
      
      console.log('Deleting service ID:', itemToDelete);
      const response = await apiFetch(`${SERVICES_ENDPOINT}${itemToDelete}/`, {
        method: 'DELETE',
      });
      
      console.log('Delete response status:', response.status);
      
      if (!response.ok && response.status !== 204) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setSuccessMessage('Service deleted successfully');
      setShowSuccessModal(true);
      
      // Refresh services list
      await fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      Alert.alert('Error', 'Failed to delete service. Please try again.');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  // Helper function to render service icon
  const renderServiceIcon = (iconName: string, size: number = 20) => {
    const iconColor = '#ffffff';
    
    switch (iconName) {
      case 'oil-can':
        return <FontAwesome5 name="oil-can" size={size} color={iconColor} />;
      case 'tire':
        return <FontAwesome5 name="tire" size={size} color={iconColor} />;
      case 'tools':
        return <FontAwesome5 name="tools" size={size} color={iconColor} />;
      case 'car':
        return <FontAwesome5 name="car" size={size} color={iconColor} />;
      case 'battery':
        return <FontAwesome5 name="car-battery" size={size} color={iconColor} />;
      case 'filter':
        return <FontAwesome5 name="filter" size={size} color={iconColor} />;
      default:
        return <MaterialIcons name="build" size={size} color={iconColor} />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch  {
      return 'Invalid date';
    }
  };

  // Helper function to get garage name
  const getGarageName = (service: ServiceType): string => {
    if (service.garage_name) return service.garage_name;
    if (service.garage) {
      const garage = garages.find(g => g.id === service.garage);
      return garage ? `${garage.name} - ${garage.city}` : `Garage #${service.garage}`;
    }
    return 'No garage assigned';
  };

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Main container with 20vh top padding */}
      <View className="flex-1 pt-20 p-5">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className={`text-2xl font-bold ${textColor}`}>Services Management</Text>
            <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              Manage all services and their garage assignments
            </Text>
                      <TouchableOpacity 
            className="p-3 rounded-full bg-blue-600"
            onPress={handleAddService}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
          </View>

        </View>

        {/* Search Bar */}
        <View className="relative mb-6">
          <TextInput
            className={`${inputBgColor} rounded-full px-5 py-3 pl-12 ${inputTextColor} font-medium ${borderColor} border`}
            placeholder="Search services..."
            placeholderTextColor={theme === 'dark' ? '#9ca3af' : '#6b7280'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <View className="absolute left-4 top-3">
            <Ionicons name="search" size={20} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
          </View>
        </View>

        {/* Content */}
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {apiLoading ? (
            <View className="flex-1 justify-center items-center py-20">
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text className={`${textColor} mt-4`}>Loading services...</Text>
            </View>
          ) : filteredServices.length === 0 ? (
            <View className="flex-1 justify-center items-center py-20">
              <Ionicons name="construct-outline" size={64} color={theme === 'dark' ? '#4b5563' : '#9ca3af'} />
              <Text className={`${textColor} text-lg font-medium mt-4`}>
                {searchQuery ? 'No services found' : 'No services available'}
              </Text>
              <Text className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} text-center mt-2 px-10`}>
                {searchQuery ? 'Try a different search term' : 'Add your first service to get started'}
              </Text>
            </View>
          ) : (
            <View className="space-y-4">
              {filteredServices.map((service) => (
                <View
                  key={`service-${service.id}`}
                  className={`${cardColor} rounded-2xl p-5 shadow-sm ${borderColor} border`}
                >
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-row items-center flex-1">
                      <View 
                        style={{ 
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: service.color || '#3b82f6',
                          marginRight: 16,
                        }}
                      >
                        {renderServiceIcon(service.icon)}
                      </View>
                      <View className="flex-1">
                        <Text className={`font-bold ${textColor} text-lg`}>
                          {service.name || 'Unnamed Service'}
                        </Text>
                        <View className="flex-row items-center mt-1">
                          <View className="px-3 py-1 bg-blue-500 rounded-full">
                            <Text className="text-white text-xs font-semibold">
                              {service.category || 'General'}
                            </Text>
                          </View>
                          <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} ml-2 text-sm`}>
                            {formatCurrency(service.price || service.base_price || 0)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <Text className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                    {service.description || 'No description'}
                  </Text>

                  {/* Garage Info */}
                  <View className="mb-3">
                    <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm font-medium mb-1`}>
                      Assigned Garage:
                    </Text>
                    <Text className={`${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'} font-medium`}>
                      {getGarageName(service)}
                    </Text>
                  </View>

                  {/* Price Comparison */}
                  {service.price !== undefined && service.price !== null && 
                   parseFloat(service.price.toString()) !== parseFloat(service.base_price.toString()) && (
                    <View className="mb-3">
                      <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm font-medium mb-1`}>
                        Price Details:
                      </Text>
                      <View className="flex-row items-center">
                        <Text className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} text-sm mr-3`}>
                          Base: {formatCurrency(service.base_price)}
                        </Text>
                        <Text className={`${theme === 'dark' ? 'text-green-300' : 'text-green-600'} text-sm font-medium`}>
                          Garage: {formatCurrency(service.price)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Action buttons inside the card */}
                  <View className="flex-row justify-between items-center mt-4">
                    <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                      Created: {formatDate(service.created_at)}
                    </Text>
                    
                    <View className="flex-row space-x-2">
                      <TouchableOpacity
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          backgroundColor: '#3b82f6',
                          borderRadius: 8,
                        }}
                        onPress={() => handleEditService(service)}
                        disabled={loading}
                      >
                        <Text className="text-white font-semibold">Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          backgroundColor: '#ef4444',
                          borderRadius: 8,
                        }}
                        onPress={() => handleDeleteService(service.id)}
                        disabled={loading}
                      >
                        <Text className="text-white font-semibold">Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Service Add/Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showServiceModal}
        onRequestClose={() => !loading && setShowServiceModal(false)}
      >
        <SafeAreaView className="flex-1 bg-black/50">
          <View className={`flex-1 ${cardColor} mt-20 rounded-t-3xl`}>
            <ScrollView 
              className="flex-1" 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 30 }}
            >
              <View className="p-5">
                {/* Header with Save button on right */}
                <View className="flex-row justify-between items-center mb-6">
                  <View className="flex-1">
                    <Text className={`text-2xl font-bold ${textColor} mb-2`}>
                      {editingService ? 'Edit Service' : 'Add New Service'}
                    </Text>
                    <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {editingService ? 'Update service details' : 'Create a new service'}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <TouchableOpacity 
                      className="p-3 bg-blue-600 rounded-lg ml-2"
                      onPress={handleSaveService}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text className="text-white font-semibold">
                          {editingService ? 'Update' : 'Save'}
                        </Text>
                      )}
                    </TouchableOpacity>
                    {!loading && (
                      <TouchableOpacity 
                        className="p-2 ml-2"
                        onPress={() => setShowServiceModal(false)}
                      >
                        <Ionicons name="close" size={24} color={theme === 'dark' ? '#9ca3af' : '#4b5563'} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View className="space-y-4">
                  <View>
                    <Text className={`font-medium mb-2 ${textColor}`}>
                      Service Name <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      className={`${inputBgColor} rounded-xl px-4 py-3 ${inputTextColor} border border-gray-300 dark:border-gray-600`}
                      placeholder="Enter service name"
                      placeholderTextColor={theme === 'dark' ? '#6b7280' : '#9ca3af'}
                      value={serviceFormData.name}
                      onChangeText={(text) => setServiceFormData({...serviceFormData, name: text})}
                      editable={!loading}
                    />
                  </View>

                  <View>
                    <Text className={`font-medium mb-2 ${textColor}`}>
                      Description <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      className={`${inputBgColor} rounded-xl px-4 py-3 ${inputTextColor} border border-gray-300 dark:border-gray-600`}
                      placeholder="Enter service description"
                      placeholderTextColor={theme === 'dark' ? '#6b7280' : '#9ca3af'}
                      value={serviceFormData.description}
                      onChangeText={(text) => setServiceFormData({...serviceFormData, description: text})}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      editable={!loading}
                    />
                  </View>

                  <View>
                    <Text className={`font-medium mb-2 ${textColor}`}>
                      Category <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      className={`${inputBgColor} rounded-xl px-4 py-3 ${inputTextColor} border border-gray-300 dark:border-gray-600`}
                      placeholder="e.g., Maintenance, Repair, Cleaning"
                      placeholderTextColor={theme === 'dark' ? '#6b7280' : '#9ca3af'}
                      value={serviceFormData.category}
                      onChangeText={(text) => setServiceFormData({...serviceFormData, category: text})}
                      editable={!loading}
                    />
                  </View>

                  <View>
                    <Text className={`font-medium mb-2 ${textColor}`}>
                      Base Price (Tzs/=) <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      className={`${inputBgColor} rounded-xl px-4 py-3 ${inputTextColor} border border-gray-300 dark:border-gray-600`}
                      placeholder="10000"
                      placeholderTextColor={theme === 'dark' ? '#6b7280' : '#9ca3af'}
                      value={serviceFormData.base_price}
                      onChangeText={(text) => setServiceFormData({...serviceFormData, base_price: text})}
                      keyboardType="decimal-pad"
                      editable={!loading}
                    />
                    {serviceFormData.base_price && (
                      <Text className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {formatCurrency(serviceFormData.base_price)}
                      </Text>
                    )}
                  </View>

                  <View>
                    <Text className={`font-medium mb-2 ${textColor}`}>
                      Garage Price (Tzs/=)
                    </Text>
                    <TextInput
                      className={`${inputBgColor} rounded-xl px-4 py-3 ${inputTextColor} border border-gray-300 dark:border-gray-600`}
                      placeholder="Leave empty to use base price"
                      placeholderTextColor={theme === 'dark' ? '#6b7280' : '#9ca3af'}
                      value={serviceFormData.price}
                      onChangeText={(text) => setServiceFormData({...serviceFormData, price: text})}
                      keyboardType="decimal-pad"
                      editable={!loading}
                    />
                    {serviceFormData.price && (
                      <Text className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {formatCurrency(serviceFormData.price)}
                      </Text>
                    )}
                  </View>

                  <View>
                    <Text className={`font-medium mb-2 ${textColor}`}>
                      Assign to Garage (Optional)
                    </Text>
                    <View className={`${inputBgColor} rounded-xl border border-gray-300 dark:border-gray-600`}>
                      <TouchableOpacity
                        className={`px-4 py-3 ${!serviceFormData.garage ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}
                        onPress={() => setServiceFormData({...serviceFormData, garage: ''})}
                        disabled={loading}
                      >
                        <Text className={!serviceFormData.garage ? 'text-blue-600 dark:text-blue-400 font-medium' : inputTextColor}>
                          No garage assigned
                        </Text>
                      </TouchableOpacity>
                      {garages.map((garage) => (
                        <TouchableOpacity
                          key={`garage-${garage.id}`}
                          className={`px-4 py-3 ${serviceFormData.garage === garage.id.toString() ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}
                          onPress={() => setServiceFormData({...serviceFormData, garage: garage.id.toString()})}
                          disabled={loading}
                        >
                          <Text className={serviceFormData.garage === garage.id.toString() ? 'text-blue-600 dark:text-blue-400 font-medium' : inputTextColor}>
                            {garage.name} - {garage.city}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View>
                    <Text className={`font-medium mb-2 ${textColor}`}>
                      Icon
                    </Text>
                    <IconSelector
                      selectedIcon={serviceFormData.icon}
                      onSelect={(icon) => setServiceFormData({...serviceFormData, icon})}
                      disabled={loading}
                      theme={theme}
                    />
                  </View>

                  <View>
                    <Text className={`font-medium mb-2 ${textColor}`}>
                      Color
                    </Text>
                    <View className="flex-row flex-wrap">
                      {colorOptions.map((color) => (
                        <ColorCircle
                          key={`color-${color}`}
                          color={color}
                          isSelected={serviceFormData.color === color}
                          onPress={() => setServiceFormData({...serviceFormData, color})}
                          disabled={loading}
                        />
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Service Delete Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteModal}
        title="Delete Service"
        message="Are you sure you want to delete this service? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteService}
        onCancel={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
        isDestructive={true}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
      />
    </SafeAreaView>
  );
}