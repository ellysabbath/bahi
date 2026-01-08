// app/admin/bookings/index.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
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
import { useTheme } from '../../../context/ThemeContext';
import MapViewModal from '../../Mechanic/bookings/MapViewModal';

// API Configuration
const API_BASE_URL = 'https://AutoFix.pythonanywhere.com/api/bookings';

// Google Maps API key
const GOOGLE_API_KEY = 'AIzaSyDbEqwyQiqgSpPn-A0IIU-TACRZU47To6k';

// Types
interface BookingType {
  id: number;
  booking_number: string;
  full_name: string;
  mobile_number: string;
  garage_name: string;
  garage_city: string;
  service_name: string;
  location: string;
  scheduled_date: string;
  notes: string;
  created_at: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  price?: string;
  total_price?: string;
}

interface MapCoordinates {
  latitude: number;
  longitude: number;
}

interface APIBooking {
  id: number;
  booking_number: string;
  full_name?: string;
  mobile_number?: string;
  garage_name?: string;
  garage_address?: string;
  garage_city?: string;
  service_name?: string;
  custom_service_name?: string;
  location?: string;
  scheduled_date?: string;
  notes?: string;
  created_at?: string;
  status: string;
  price?: string | number;
  total_price?: string | number;
  user?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    email?: string;
  };
  garage?: {
    name?: string;
    address?: string;
    city?: string;
  };
  service?: {
    name?: string;
  };
}

// Tanzanian locations with coordinates
const TANZANIA_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  'dar es salaam': { lat: -6.7924, lng: 39.2083 },
  'dodoma': { lat: -6.1630, lng: 35.7516 },
  'arusha': { lat: -3.3869, lng: 36.6831 },
  'mwanza': { lat: -2.5167, lng: 32.9000 },
  'mbeya': { lat: -8.9000, lng: 33.4500 },
  'morogoro': { lat: -6.8248, lng: 37.6590 },
  'tanga': { lat: -5.0667, lng: 39.1000 },
  'zanzibar': { lat: -6.1650, lng: 39.1990 },
  'moshi': { lat: -3.3346, lng: 37.3404 },
};

const BookingsManagement = () => {
  // State
  const [bookings, setBookings] = useState<BookingType[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingType[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [updatingBooking, setUpdatingBooking] = useState<number | null>(null);
  const [customerCoordinates, setCustomerCoordinates] = useState<MapCoordinates | null>(null);
  const [geocodingCache, setGeocodingCache] = useState<Record<string, MapCoordinates>>({});
  const [geocodingProgress, setGeocodingProgress] = useState<Record<number, boolean>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showMessage, setShowMessage] = useState(false);
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    mobile_number: '',
    scheduled_date: '',
    location: '',
    notes: '',
  });

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Theme colors
  const bgColor = isDark ? 'bg-gray-900' : 'bg-gray-50';
  const cardColor = isDark ? 'bg-gray-800' : 'bg-white';
  const textColor = isDark ? 'text-gray-100' : 'text-gray-900';
  const textSecondaryColor = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';
  const inputBgColor = isDark ? 'bg-gray-700' : 'bg-gray-100';
  const placeholderColor = isDark ? '#9ca3af' : '#6b7280';

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending', icon: 'time-outline' as const, color: 'yellow' },
    { value: 'confirmed', label: 'Confirmed', icon: 'checkmark-circle-outline' as const, color: 'blue' },
    { value: 'in_progress', label: 'In Progress', icon: 'build-outline' as const, color: 'purple' },
    { value: 'completed', label: 'Completed', icon: 'checkmark-done-outline' as const, color: 'green' },
    { value: 'cancelled', label: 'Cancelled', icon: 'close-circle-outline' as const, color: 'red' },
  ];

  // ============ HELPER FUNCTIONS ============

  const showNotification = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setShowMessage(true);
    setTimeout(() => {
      setShowMessage(false);
      setMessage(null);
    }, 3000);
  };

  const formatCurrency = (amount: string | number): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    if (isNaN(numAmount)) return 'Tzs/= 0.00';

    const formatted = new Intl.NumberFormat('en-TZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);

    return `Tzs/= ${formatted}`;
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Not scheduled';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;

      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  const convertToISOString = (dateString: string): string => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch (error) {
      console.error('Date conversion error:', error);
    }

    return dateString;
  };

  const getStatusColor = (status: string): string => {
    const colors = {
      pending: isDark ? 'bg-yellow-900/30' : 'bg-yellow-100',
      confirmed: isDark ? 'bg-blue-900/30' : 'bg-blue-100',
      in_progress: isDark ? 'bg-purple-900/30' : 'bg-purple-100',
      completed: isDark ? 'bg-green-900/30' : 'bg-green-100',
      cancelled: isDark ? 'bg-red-900/30' : 'bg-red-100',
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getStatusTextColor = (status: string): string => {
    const colors = {
      pending: isDark ? 'text-yellow-300' : 'text-yellow-800',
      confirmed: isDark ? 'text-blue-300' : 'text-blue-800',
      in_progress: isDark ? 'text-purple-300' : 'text-purple-800',
      completed: isDark ? 'text-green-300' : 'text-green-800',
      cancelled: isDark ? 'text-red-300' : 'text-red-800',
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const formatStatus = (status: string): string => {
    return status.replace('_', ' ').toUpperCase();
  };

  const countByStatus = (status: string): number => {
    if (status === 'all') return bookings.length;
    return bookings.filter(booking => booking.status === status).length;
  };

  const getTotalRevenue = (): number => {
    return bookings
      .filter(booking => booking.status === 'completed')
      .reduce((sum, booking) => sum + parseFloat(booking.total_price || '0'), 0);
  };

  // ============ GEOCODING FUNCTION ============

  const geocodeAddress = async (address: string, bookingId?: number): Promise<MapCoordinates | null> => {
    try {
      if (bookingId) {
        setGeocodingProgress(prev => ({ ...prev, [bookingId]: true }));
      }

      // Check cache first
      if (geocodingCache[address]) {
        return geocodingCache[address];
      }

      if (!address || address.trim() === '') {
        return null;
      }

      const cleanAddress = address.trim().toLowerCase();
      
      // Check known Tanzanian locations
      for (const [locationName, coords] of Object.entries(TANZANIA_LOCATIONS)) {
        if (cleanAddress.includes(locationName.toLowerCase())) {
          const result = { latitude: coords.lat, longitude: coords.lng };
          setGeocodingCache(prev => ({ ...prev, [address]: result }));
          return result;
        }
      }

      // Try Google Geocoding
      const encodedAddress = encodeURIComponent(`${address}, Tanzania`);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_API_KEY}&region=tz`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding API failed');
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        const result = {
          latitude: location.lat,
          longitude: location.lng,
        };
        
        setGeocodingCache(prev => ({ ...prev, [address]: result }));
        return result;
      }

      // Default to Dar es Salaam if no results
      const defaultCoords = { latitude: -6.7924, longitude: 39.2083 };
      setGeocodingCache(prev => ({ ...prev, [address]: defaultCoords }));
      return defaultCoords;
      
    } catch (error) {
      console.error('Geocoding error:', error);
      return { latitude: -6.7924, longitude: 39.2083 };
    } finally {
      if (bookingId) {
        setGeocodingProgress(prev => ({ ...prev, [bookingId]: false }));
      }
    }
  };

  // ============ API FUNCTIONS ============

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching bookings...');
      
      const response = await fetch(API_BASE_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: APIBooking[] = await response.json();
      console.log(`Received ${data.length} bookings`);
      
      // Map API response to BookingType with proper error handling
      const mappedBookings: BookingType[] = data.map((booking) => {
        // Extract full name
        let fullName = 'Customer';
        if (booking.full_name && booking.full_name.trim()) {
          fullName = booking.full_name;
        } else if (booking.user) {
          const firstName = booking.user.first_name || '';
          const lastName = booking.user.last_name || '';
          const name = `${firstName} ${lastName}`.trim();
          if (name) fullName = name;
        }

        // Extract mobile number (with multiple fallbacks)
        let mobileNumber = '';
        if (booking.mobile_number && booking.mobile_number.trim()) {
          mobileNumber = booking.mobile_number;
        } else if (booking.user?.phone && booking.user.phone.trim()) {
          mobileNumber = booking.user.phone;
        }

        // Extract garage name
        let garageName = 'Unknown Garage';
        if (booking.garage_name && booking.garage_name.trim()) {
          garageName = booking.garage_name;
        } else if (booking.garage?.name && booking.garage.name.trim()) {
          garageName = booking.garage.name;
        }

        // Extract garage city
        let garageCity = '';
        if (booking.garage_city && booking.garage_city.trim()) {
          garageCity = booking.garage_city;
        } else if (booking.garage_address) {
          const address = booking.garage_address.toLowerCase();
          if (address.includes('dar es salaam') || address.includes('dar')) {
            garageCity = 'Dar es Salaam';
          } else if (address.includes('dodoma')) {
            garageCity = 'Dodoma';
          } else if (address.includes('arusha')) {
            garageCity = 'Arusha';
          }
        }

        // Extract service name
        let serviceName = 'Custom Service';
        if (booking.service_name && booking.service_name.trim()) {
          serviceName = booking.service_name;
        } else if (booking.custom_service_name && booking.custom_service_name.trim()) {
          serviceName = booking.custom_service_name;
        } else if (booking.service?.name && booking.service.name.trim()) {
          serviceName = booking.service.name;
        }

        // Extract prices
        const price = booking.price ? String(booking.price) : '0.00';
        const totalPrice = booking.total_price ? String(booking.total_price) : price;

        return {
          id: booking.id,
          booking_number: booking.booking_number || `BK-${booking.id}`,
          full_name: fullName,
          mobile_number: mobileNumber,
          garage_name: garageName,
          garage_city: garageCity,
          service_name: serviceName,
          location: booking.location || '',
          scheduled_date: booking.scheduled_date || '',
          notes: booking.notes || '',
          created_at: booking.created_at || '',
          status: (booking.status as BookingType['status']) || 'pending',
          price: price,
          total_price: totalPrice,
        };
      });

      setBookings(mappedBookings);
      setFilteredBookings(mappedBookings);
      
    } catch (error) {
      console.error('Error fetching bookings:', error);
      showNotification('error', 'Failed to load bookings. Please try again.');
      
      // Set empty arrays to prevent undefined errors
      setBookings([]);
      setFilteredBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const updateBooking = async (bookingId: number, updatedFields: Partial<BookingType>) => {
    try {
      setUpdatingBooking(bookingId);

      // Prepare API data
      const apiData: any = {};
      
      if (updatedFields.status !== undefined) {
        apiData.status = updatedFields.status;
      }
      
      // Note: full_name and mobile_number might not be editable directly
      // They should come from the user object in the backend
      
      if (updatedFields.location !== undefined) {
        apiData.location = updatedFields.location;
      }
      
      if (updatedFields.scheduled_date !== undefined) {
        apiData.scheduled_date = convertToISOString(updatedFields.scheduled_date);
      }
      
      if (updatedFields.notes !== undefined) {
        apiData.notes = updatedFields.notes;
      }

      console.log('Updating booking with data:', apiData);

      const response = await fetch(`${API_BASE_URL}/${bookingId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update failed:', errorText);
        throw new Error(`Update failed: ${response.status}`);
      }

      // Refresh bookings to get updated data
      await fetchBookings();
      
      showNotification('success', 'Booking updated successfully');
      return true;

    } catch (error) {
      console.error('Error updating booking:', error);
      showNotification('error', 'Failed to update booking');
      return false;
    } finally {
      setUpdatingBooking(null);
    }
  };

  const deleteBooking = async (bookingId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${bookingId}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete booking');
      }

      // Remove from local state
      setBookings(prev => prev.filter(booking => booking.id !== bookingId));
      setFilteredBookings(prev => prev.filter(booking => booking.id !== bookingId));
      
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking(null);
        setShowModal(false);
      }

      showNotification('success', 'Booking deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting booking:', error);
      showNotification('error', 'Failed to delete booking');
      return false;
    }
  };

  // ============ EVENT HANDLERS ============

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleViewDetails = (booking: BookingType) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleEditBooking = (booking: BookingType) => {
    setSelectedBooking(booking);
    setEditFormData({
      full_name: booking.full_name,
      mobile_number: booking.mobile_number,
      scheduled_date: formatDateForInput(booking.scheduled_date),
      location: booking.location,
      notes: booking.notes,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedBooking) return;

    const success = await updateBooking(selectedBooking.id, {
      location: editFormData.location,
      scheduled_date: editFormData.scheduled_date,
      notes: editFormData.notes,
    });

    if (success) {
      setShowEditModal(false);
    }
  };

  const handleUpdateStatus = (bookingId: number, newStatus: BookingType['status']) => {
    Alert.alert(
      'Update Status',
      `Change booking status to "${formatStatus(newStatus)}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          style: 'default',
          onPress: async () => {
            const success = await updateBooking(bookingId, { status: newStatus });
            if (success) {
              showNotification('success', `Status updated to ${formatStatus(newStatus)}`);
            }
          },
        },
      ]
    );
  };

  const handleDeleteBooking = (bookingId: number) => {
    Alert.alert(
      'Delete Booking',
      'Are you sure you want to permanently delete this booking? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteBooking(bookingId);
            if (success) {
              setShowModal(false);
            }
          },
        },
      ]
    );
  };

  const handleShowMap = async (booking: BookingType) => {
    if (!booking.location) {
      Alert.alert('No Location', 'This booking does not have a location specified.');
      return;
    }
    
    setSelectedBooking(booking);
    
    try {
      const coords = await geocodeAddress(booking.location, booking.id);
      setCustomerCoordinates(coords);
      setShowMapModal(true);
    } catch (error) {
      console.error('Error handling map:', error);
      Alert.alert('Location Error', 'Could not find the location. Showing default map.');
      setCustomerCoordinates({ latitude: -6.7924, longitude: 39.2083 });
      setShowMapModal(true);
    }
  };

  const handleCall = (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber.trim() === '') {
      Alert.alert('No Phone Number', 'This customer has not provided a phone number.');
      return;
    }

    // Clean the phone number
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    if (!cleanNumber || cleanNumber.length < 9) {
      Alert.alert('Invalid Phone Number', 'The phone number format is invalid.');
      return;
    }

    const phoneUrl = `tel:${cleanNumber}`;
    
    Linking.canOpenURL(phoneUrl)
      .then(supported => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Call Not Supported', 'Your device does not support making phone calls.');
        }
      })
      .catch(err => {
        console.error('Error opening phone app:', err);
        Alert.alert('Error', 'Could not open phone app. Please try again.');
      });
  };

  const handleMessage = (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber.trim() === '') {
      Alert.alert('No Phone Number', 'This customer has not provided a phone number.');
      return;
    }

    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    const bookingNumber = selectedBooking?.booking_number || '';
    const message = `Hello, this is regarding your booking #${bookingNumber}.`;

    Alert.alert(
      'Contact Customer',
      'Choose how you would like to contact the customer:',
      [
        {
          text: 'Send SMS',
          onPress: () => {
            let smsUrl;
            if (Platform.OS === 'ios') {
              smsUrl = `sms:${cleanNumber}&body=${encodeURIComponent(message)}`;
            } else {
              smsUrl = `sms:${cleanNumber}?body=${encodeURIComponent(message)}`;
            }

            Linking.canOpenURL(smsUrl)
              .then(supported => {
                if (supported) {
                  Linking.openURL(smsUrl);
                } else {
                  Alert.alert('SMS Not Available', 'No SMS app found on your device.');
                }
              })
              .catch(err => {
                console.error('Error opening SMS app:', err);
                Alert.alert('Error', 'Could not open messaging app.');
              });
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const getStatusActions = (status: string) => {
    switch (status) {
      case 'pending':
        return [
          { label: 'Confirm', status: 'confirmed' as const, icon: 'checkmark-circle-outline' as const },
          { label: 'Cancel', status: 'cancelled' as const, icon: 'close-circle-outline' as const },
        ];
      case 'confirmed':
        return [
          { label: 'Start', status: 'in_progress' as const, icon: 'play-outline' as const },
          { label: 'Cancel', status: 'cancelled' as const, icon: 'close-circle-outline' as const },
        ];
      case 'in_progress':
        return [
          { label: 'Complete', status: 'completed' as const, icon: 'checkmark-done-outline' as const },
        ];
      default:
        return [];
    }
  };

  // ============ USE EFFECTS ============

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    let filtered = [...bookings];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(booking =>
        booking.full_name.toLowerCase().includes(query) ||
        booking.service_name.toLowerCase().includes(query) ||
        booking.garage_name.toLowerCase().includes(query) ||
        booking.booking_number.toLowerCase().includes(query) ||
        booking.mobile_number.toLowerCase().includes(query) ||
        booking.location.toLowerCase().includes(query)
      );
    }

    setFilteredBookings(filtered);
  }, [bookings, searchQuery, statusFilter]);

  // ============ RENDER FUNCTIONS ============

  const renderNotification = () => {
    if (!showMessage || !message) return null;

    const bgColors = {
      success: isDark ? 'bg-green-900/30' : 'bg-green-100',
      error: isDark ? 'bg-red-900/30' : 'bg-red-100',
      info: isDark ? 'bg-blue-900/30' : 'bg-blue-100',
    };

    const icons = {
      success: { name: 'checkmark-circle-outline' as const, color: '#10b981' },
      error: { name: 'close-circle-outline' as const, color: '#ef4444' },
      info: { name: 'information-circle-outline' as const, color: '#3b82f6' },
    };

    return (
      <View className="absolute top-16 left-5 right-5 z-50">
        <View className={`${bgColors[message.type]} rounded-xl p-3 shadow-xl ${borderColor} border`}>
          <View className="flex-row items-center justify-center">
            <Ionicons name={icons[message.type].name} size={20} color={icons[message.type].color} />
            <Text className={`ml-2 ${textColor} text-center font-medium text-sm`}>
              {message.text}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEditModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showEditModal}
      onRequestClose={() => setShowEditModal(false)}
    >
      <SafeAreaView className="flex-1 bg-black/50">
        <View className="flex-1 mt-20">
          <View className={`flex-1 ${cardColor} rounded-t-3xl overflow-hidden`}>
            <View className="p-5 border-b border-gray-200 dark:border-gray-700 flex-row justify-between items-center">
              <View className="flex-1">
                <Text className={`text-xl font-bold ${textColor}`}>
                  Edit Booking
                </Text>
                <Text className={`${textSecondaryColor} text-sm mt-1`}>
                  Update booking details
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                className="p-2"
              >
                <Ionicons name="close-outline" size={24} color={textColor} />
              </TouchableOpacity>
            </View>

            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 30 }}
              keyboardShouldPersistTaps="handled"
            >
              <View className="p-5 space-y-4">
                <View>
                  <Text className={`font-bold ${textColor} mb-2`}>Customer Name</Text>
                  <TextInput
                    className={`${inputBgColor} rounded-xl px-4 py-3 ${textColor} border border-gray-300 dark:border-gray-600`}
                    value={editFormData.full_name}
                    onChangeText={(text) => setEditFormData({ ...editFormData, full_name: text })}
                    placeholder="Enter customer name"
                    placeholderTextColor={placeholderColor}
                    editable={false}
                  />
                  <Text className={`${textSecondaryColor} text-xs mt-1`}>
                    Note: Name is linked to user account and cannot be changed here
                  </Text>
                </View>

                <View>
                  <Text className={`font-bold ${textColor} mb-2`}>Mobile Number</Text>
                  <TextInput
                    className={`${inputBgColor} rounded-xl px-4 py-3 ${textColor} border border-gray-300 dark:border-gray-600`}
                    value={editFormData.mobile_number}
                    onChangeText={(text) => setEditFormData({ ...editFormData, mobile_number: text })}
                    placeholder="Enter mobile number"
                    placeholderTextColor={placeholderColor}
                    keyboardType="phone-pad"
                    editable={false}
                  />
                  <Text className={`${textSecondaryColor} text-xs mt-1`}>
                    Note: Phone number is linked to user account
                  </Text>
                </View>

                <View>
                  <Text className={`font-bold ${textColor} mb-2`}>Scheduled Date</Text>
                  <TextInput
                    className={`${inputBgColor} rounded-xl px-4 py-3 ${textColor} border border-gray-300 dark:border-gray-600`}
                    value={editFormData.scheduled_date}
                    onChangeText={(text) => setEditFormData({ ...editFormData, scheduled_date: text })}
                    placeholder="YYYY-MM-DDTHH:mm"
                    placeholderTextColor={placeholderColor}
                  />
                  <Text className={`${textSecondaryColor} text-xs mt-1`}>
                    Format: YYYY-MM-DDTHH:mm (e.g., 2024-01-15T14:30)
                  </Text>
                </View>

                <View>
                  <Text className={`font-bold ${textColor} mb-2`}>Location</Text>
                  <TextInput
                    className={`${inputBgColor} rounded-xl px-4 py-3 ${textColor} border border-gray-300 dark:border-gray-600`}
                    value={editFormData.location}
                    onChangeText={(text) => setEditFormData({ ...editFormData, location: text })}
                    placeholder="Enter location"
                    placeholderTextColor={placeholderColor}
                    multiline
                  />
                </View>

                <View>
                  <Text className={`font-bold ${textColor} mb-2`}>Notes</Text>
                  <TextInput
                    className={`${inputBgColor} rounded-xl px-4 py-3 ${textColor} border border-gray-300 dark:border-gray-600 min-h-[100px]`}
                    value={editFormData.notes}
                    onChangeText={(text) => setEditFormData({ ...editFormData, notes: text })}
                    placeholder="Add notes..."
                    placeholderTextColor={placeholderColor}
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <View className="flex-row space-x-3 pt-4">
                  <TouchableOpacity
                    className="flex-1 py-3.5 bg-gray-300 dark:bg-gray-700 rounded-xl items-center"
                    onPress={() => setShowEditModal(false)}
                  >
                    <Text className="font-bold text-gray-800 dark:text-gray-200">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 py-3.5 bg-blue-500 rounded-xl items-center"
                    onPress={handleSaveEdit}
                    disabled={updatingBooking === selectedBooking?.id}
                  >
                    {updatingBooking === selectedBooking?.id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-white font-bold">Save Changes</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderBookingItem = (booking: BookingType) => {
    const statusActions = getStatusActions(booking.status);
    const isUpdating = updatingBooking === booking.id;

    return (
      <View
        key={booking.id}
        className={`${cardColor} rounded-xl p-4 shadow-sm ${borderColor} border mb-3`}
      >
        {/* Header Row */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <View className="flex-row items-center">
              <Ionicons name="person-circle-outline" size={20} color={placeholderColor} />
              <Text className={`ml-2 font-bold ${textColor} text-base`}>
                {booking.full_name}
              </Text>
            </View>
            <Text className={`mt-1 text-sm ${textColor}`}>
              {booking.service_name}
            </Text>
            <Text className={`mt-1 text-xs ${textSecondaryColor}`}>
              {booking.garage_name} • {booking.garage_city}
            </Text>
            <Text className={`mt-1 text-xs ${textSecondaryColor}`}>
              #{booking.booking_number}
            </Text>
          </View>
          <View className={`px-3 py-1.5 rounded-full ${getStatusColor(booking.status)}`}>
            <Text className={`text-xs font-bold ${getStatusTextColor(booking.status)}`}>
              {formatStatus(booking.status)}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View className="space-y-2 mb-3">
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={14} color={textSecondaryColor} />
            <Text className={`ml-2 text-xs ${textSecondaryColor}`}>
              {formatDate(booking.scheduled_date)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="call-outline" size={14} color={textSecondaryColor} />
            <Text className={`ml-2 text-xs ${textSecondaryColor}`}>
              {booking.mobile_number || 'No phone provided'}
            </Text>
          </View>
          {booking.location && (
            <View className="flex-row items-center">
              <Ionicons name="location-outline" size={14} color={textSecondaryColor} />
              <Text className={`ml-2 text-xs ${textSecondaryColor}`} numberOfLines={2}>
                {booking.location}
              </Text>
            </View>
          )}
          {booking.total_price && (
            <View className="flex-row items-center">
              <Ionicons name="cash-outline" size={14} color={textSecondaryColor} />
              <Text className={`ml-2 font-bold text-sm ${textColor}`}>
                {formatCurrency(booking.total_price)}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View className="flex-row space-x-2">
          <TouchableOpacity
            className="flex-1 py-2.5 bg-blue-500 rounded-lg items-center flex-row justify-center"
            onPress={() => handleViewDetails(booking)}
            disabled={isUpdating}
          >
            <Ionicons name="eye-outline" size={16} color="white" />
            <Text className="text-white font-semibold text-sm ml-2">Details</Text>
          </TouchableOpacity>

          {booking.location && (
            <TouchableOpacity
              className="flex-1 py-2.5 bg-purple-500 rounded-lg items-center flex-row justify-center"
              onPress={() => handleShowMap(booking)}
              disabled={isUpdating || geocodingProgress[booking.id]}
            >
              {geocodingProgress[booking.id] ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="map-outline" size={16} color="white" />
              )}
              <Text className="text-white font-semibold text-sm ml-2">
                {geocodingProgress[booking.id] ? 'Finding...' : 'Map'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="flex-1 py-2.5 bg-green-500 rounded-lg items-center flex-row justify-center"
            onPress={() => handleEditBooking(booking)}
            disabled={isUpdating}
          >
            <Ionicons name="create-outline" size={16} color="white" />
            <Text className="text-white font-semibold text-sm ml-2">Edit</Text>
          </TouchableOpacity>

          {statusActions.map((action, index) => (
            <TouchableOpacity
              key={`${action.label}-${index}`}
              className="flex-1 py-2.5 bg-indigo-500 rounded-lg items-center flex-row justify-center"
              onPress={() => handleUpdateStatus(booking.id, action.status)}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name={action.icon} size={16} color="white" />
                  <Text className="text-white font-semibold text-sm ml-2">{action.label}</Text>
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // ============ MAIN RENDER ============

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {renderNotification()}

      {/* Main Content */}
      <View className="flex-1">
        {/* Fixed Header */}
        <View className={`p-4 ${cardColor} shadow-sm ${borderColor} border-b`}>
          <View className="mb-4">
            <Text className={`text-2xl font-bold ${textColor}`}>Bookings</Text>
            <Text className={`${textSecondaryColor} mt-1 text-sm`}>
              Manage all customer appointments
            </Text>
          </View>

          {/* Stats Summary */}
          <View className="flex-row justify-between mb-4">
            <View className="items-center">
              <Text className={`text-lg font-bold ${textColor}`}>{bookings.length}</Text>
              <Text className={`${textSecondaryColor} text-xs`}>Total</Text>
            </View>
            <View className="items-center">
              <Text className={`text-lg font-bold text-green-500`}>
                {formatCurrency(getTotalRevenue())}
              </Text>
              <Text className={`${textSecondaryColor} text-xs`}>Revenue</Text>
            </View>
            <View className="items-center">
              <Text className={`text-lg font-bold ${textColor}`}>{countByStatus('completed')}</Text>
              <Text className={`${textSecondaryColor} text-xs`}>Completed</Text>
            </View>
            <View className="items-center">
              <Text className={`text-lg font-bold ${textColor}`}>{countByStatus('pending')}</Text>
              <Text className={`${textSecondaryColor} text-xs`}>Pending</Text>
            </View>
          </View>

          {/* Search Bar */}
          <View className="relative mb-3">
            <TextInput
              className={`${inputBgColor} rounded-full px-4 py-3 pl-12 ${textColor} font-medium ${borderColor} border text-sm`}
              placeholder="Search bookings..."
              placeholderTextColor={placeholderColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <View className="absolute left-4 top-3">
              <Ionicons name="search-outline" size={20} color={placeholderColor} />
            </View>
            {searchQuery.length > 0 && (
              <TouchableOpacity
                className="absolute right-4 top-3"
                onPress={() => setSearchQuery('')}
              >
                <Ionicons name="close-circle-outline" size={20} color={placeholderColor} />
              </TouchableOpacity>
            )}
          </View>

          {/* Status Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-2"
          >
            <View className="flex-row space-x-2">
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  className={`px-4 py-2 rounded-full flex-row items-center ${
                    statusFilter === option.value
                      ? isDark ? 'bg-blue-700' : 'bg-blue-600'
                      : isDark ? 'bg-gray-700' : 'bg-gray-200'
                  }`}
                  onPress={() => setStatusFilter(option.value)}
                >
                  {option.value !== 'all' && (
                    <Ionicons
                      name={option.icon}
                      size={16}
                      color={statusFilter === option.value ? 'white' : placeholderColor}
                    />
                  )}
                  <Text className={`font-medium text-sm ml-1 ${
                    statusFilter === option.value ? 'text-white' : textColor
                  }`}>
                    {option.value === 'all' ? option.label : `${option.label} (${countByStatus(option.value)})`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Bookings List */}
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#3b82f6']}
              tintColor={isDark ? '#fff' : '#3b82f6'}
            />
          }
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: 32,
            paddingHorizontal: 16,
          }}
        >
          {loading && bookings.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text className={`${textColor} text-lg mt-4`}>
                Loading bookings...
              </Text>
            </View>
          ) : bookings.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="calendar-outline" size={64} color={placeholderColor} />
              <Text className={`${textColor} text-xl font-bold mt-4`}>
                No bookings yet
              </Text>
              <Text className={`${textSecondaryColor} text-sm mt-2 text-center`}>
                Customer bookings will appear here
              </Text>
              <TouchableOpacity
                className="mt-4 px-6 py-2 bg-blue-500 rounded-lg"
                onPress={fetchBookings}
              >
                <Text className="text-white font-semibold text-sm">Refresh</Text>
              </TouchableOpacity>
            </View>
          ) : filteredBookings.length === 0 ? (
            <View className={`${cardColor} rounded-xl p-8 items-center justify-center ${borderColor} border mt-8`}>
              <Ionicons name="search-outline" size={64} color={placeholderColor} />
              <Text className={`${textColor} text-xl font-bold mt-4`}>
                No bookings found
              </Text>
              <Text className={`${textSecondaryColor} text-sm mt-2 text-center`}>
                {searchQuery ? 'Try a different search term' : 'No bookings match the current filter'}
              </Text>
              {(searchQuery || statusFilter !== 'all') && (
                <TouchableOpacity
                  className="mt-4 px-6 py-2 bg-blue-500 rounded-lg"
                  onPress={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                >
                  <Text className="text-white font-semibold text-sm">Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View>
              {filteredBookings.map(renderBookingItem)}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Edit Booking Modal */}
      {renderEditModal()}

      {/* Booking Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView className="flex-1 bg-black/50">
          <View className="flex-1 mt-16">
            <View className={`flex-1 ${cardColor} rounded-t-3xl overflow-hidden`}>
              <View className="p-5 border-b border-gray-200 dark:border-gray-700 flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className={`text-xl font-bold ${textColor}`}>
                    Booking Details
                  </Text>
                  {selectedBooking && (
                    <View className="flex-row items-center mt-1">
                      <View className={`px-3 py-1 rounded-full ${getStatusColor(selectedBooking.status)}`}>
                        <Text className={`text-xs font-bold ${getStatusTextColor(selectedBooking.status)}`}>
                          {formatStatus(selectedBooking.status)}
                        </Text>
                      </View>
                      <Text className={`ml-2 text-xs ${textSecondaryColor}`}>
                        #{selectedBooking.booking_number}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => setShowModal(false)}
                  className="w-10 h-10 rounded-full items-center justify-center bg-gray-200 dark:bg-gray-700"
                >
                  <Ionicons name="close-outline" size={20} color={textColor} />
                </TouchableOpacity>
              </View>

              <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 30 }}
              >
                {selectedBooking && (
                  <View className="p-5">
                    {/* Service Card */}
                    <View className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="construct-outline" size={20} color="#3b82f6" />
                        <Text className={`ml-2 font-bold ${textColor} text-lg`}>
                          {selectedBooking.service_name}
                        </Text>
                      </View>
                      <View className="flex-row justify-between items-center">
                        <View>
                          <Text className={`${textSecondaryColor} text-sm`}>Total Amount</Text>
                          <Text className={`${textColor} font-bold text-2xl mt-1`}>
                            {formatCurrency(selectedBooking.total_price || '0.00')}
                          </Text>
                        </View>
                        <View className={`px-4 py-2 rounded-full ${getStatusColor(selectedBooking.status)}`}>
                          <Text className={`font-bold ${getStatusTextColor(selectedBooking.status)}`}>
                            {formatStatus(selectedBooking.status)}
                          </Text>
                        </View>
                      </View>
                      <Text className={`${textSecondaryColor} text-sm mt-2`}>
                        {selectedBooking.garage_name} • {selectedBooking.garage_city}
                      </Text>
                    </View>

                    {/* Customer Information */}
                    <View className="mb-4">
                      <Text className={`font-bold ${textColor} text-lg mb-3`}>Customer Information</Text>
                      <View className={`${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl p-4`}>
                        <View className="flex-row items-center mb-3">
                          <View className="w-12 h-12 rounded-full bg-blue-500 items-center justify-center">
                            <Text className="text-white font-bold text-lg">
                              {selectedBooking.full_name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View className="ml-3">
                            <Text className={`font-bold ${textColor}`}>
                              {selectedBooking.full_name}
                            </Text>
                            <Text className={`${textSecondaryColor} text-sm`}>
                              Customer
                            </Text>
                            <View className="flex-row items-center mt-2 space-x-3">
                              {selectedBooking.mobile_number && selectedBooking.mobile_number.trim() !== '' && (
                                <>
                                  <TouchableOpacity
                                    onPress={() => handleCall(selectedBooking.mobile_number)}
                                    className="w-10 h-10 rounded-full bg-green-500 items-center justify-center"
                                  >
                                    <Ionicons name="call-outline" size={20} color="white" />
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={() => handleMessage(selectedBooking.mobile_number)}
                                    className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center"
                                  >
                                    <Ionicons name="chatbubble-outline" size={20} color="white" />
                                  </TouchableOpacity>
                                </>
                              )}
                            </View>
                          </View>
                        </View>

                        <View className="space-y-3">
                          <View className="flex-row items-center">
                            <Ionicons name="call-outline" size={16} color={textSecondaryColor} />
                            <Text className={`ml-3 ${textColor}`}>
                              {selectedBooking.mobile_number || 'Not provided'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Schedule Information */}
                    <View className="mb-4">
                      <Text className={`font-bold ${textColor} text-lg mb-3`}>Schedule</Text>
                      <View className={`${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl p-4`}>
                        <View className="flex-row items-center justify-between mb-2">
                          <View className="flex-row items-center">
                            <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
                            <Text className={`ml-2 font-bold ${textColor}`}>
                              Appointment Date
                            </Text>
                          </View>
                          <Text className={`${textColor}`}>
                            {formatDate(selectedBooking.scheduled_date)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Location */}
                    {selectedBooking.location && (
                      <View className="mb-4">
                        <View className="flex-row justify-between items-center mb-3">
                          <Text className={`font-bold ${textColor} text-lg`}>Location</Text>
                          <TouchableOpacity
                            onPress={() => {
                              setShowModal(false);
                              setTimeout(() => handleShowMap(selectedBooking), 300);
                            }}
                            className="bg-purple-500 px-4 py-2 rounded-full flex-row items-center"
                          >
                            <Ionicons name="map-outline" size={16} color="white" />
                            <Text className="text-white font-semibold text-sm ml-2">
                              Trace on Map
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <View className={`${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl p-4`}>
                          <View className="flex-row items-start">
                            <Ionicons name="location-outline" size={20} color="#3b82f6" style={{ marginTop: 2 }} />
                            <Text className={`ml-3 flex-1 ${textColor}`}>
                              {selectedBooking.location}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Notes */}
                    <View className="mb-4">
                      <Text className={`font-bold ${textColor} text-lg mb-3`}>Notes</Text>
                      <View className={`${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl p-4`}>
                        <Text className={`${textColor} text-sm`}>
                          {selectedBooking.notes || 'No notes'}
                        </Text>
                      </View>
                    </View>

                    {/* Update Status Section */}
                    <View className="mb-4">
                      <Text className={`font-bold ${textColor} text-lg mb-3`}>Update Status</Text>
                      <Text className={`${textSecondaryColor} text-sm mb-3`}>
                        Current status: <Text className={`font-bold ${getStatusTextColor(selectedBooking.status)}`}>
                          {formatStatus(selectedBooking.status)}
                        </Text>
                      </Text>

                      <View className="space-y-2">
                        {statusOptions
                          .filter(option => option.value !== 'all')
                          .map((option) => (
                            <TouchableOpacity
                              key={option.value}
                              className={`p-4 rounded-xl flex-row items-center justify-between ${
                                selectedBooking.status === option.value
                                  ? isDark ? 'bg-blue-700' : 'bg-blue-600'
                                  : isDark ? 'bg-gray-800' : 'bg-gray-100'
                              }`}
                              onPress={() => {
                                setShowModal(false);
                                setTimeout(() => {
                                  handleUpdateStatus(selectedBooking.id, option.value as BookingType['status']);
                                }, 300);
                              }}
                              disabled={updatingBooking === selectedBooking.id}
                            >
                              <View className="flex-row items-center">
                                {updatingBooking === selectedBooking.id ? (
                                  <ActivityIndicator size="small" color={selectedBooking.status === option.value ? 'white' : textColor} />
                                ) : (
                                  <Ionicons
                                    name={option.icon}
                                    size={24}
                                    color={selectedBooking.status === option.value ? 'white' : placeholderColor}
                                  />
                                )}
                                <Text className={`ml-3 text-lg ${
                                  selectedBooking.status === option.value
                                    ? 'text-white font-bold'
                                    : textColor
                                }`}>
                                  {option.label}
                                </Text>
                              </View>
                              {selectedBooking.status === option.value && (
                                <Ionicons name="checkmark-circle-outline" size={24} color="white" />
                              )}
                            </TouchableOpacity>
                          ))}
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row space-x-3">
                      <TouchableOpacity
                        className="flex-1 py-3.5 bg-red-500 rounded-xl items-center"
                        onPress={() => handleDeleteBooking(selectedBooking.id)}
                        disabled={updatingBooking === selectedBooking.id}
                      >
                        {updatingBooking === selectedBooking.id ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Text className="text-white font-bold text-base">Delete Booking</Text>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="flex-1 py-3.5 bg-green-500 rounded-xl items-center"
                        onPress={() => {
                          setShowModal(false);
                          setTimeout(() => {
                            handleEditBooking(selectedBooking);
                          }, 300);
                        }}
                        disabled={updatingBooking === selectedBooking.id}
                      >
                        <Text className="text-white font-bold text-base">Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="flex-1 py-3.5 bg-blue-500 rounded-xl items-center"
                        onPress={() => setShowModal(false)}
                        disabled={updatingBooking === selectedBooking.id}
                      >
                        <Text className="text-white font-bold text-base">Close</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Map Modal */}
      <MapViewModal
        visible={showMapModal}
        onClose={() => {
          setShowMapModal(false);
          setCustomerCoordinates(null);
        }}
        customerLocation={selectedBooking?.location || ''}
        customerCoords={customerCoordinates}
        showRoute={true}
      />
    </SafeAreaView>
  );
};

export default BookingsManagement;