// components/MapModal.tsx - CORRECTED AND STYLISH VERSION
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface MapModalProps {
  isVisible: boolean;
  userLocation: Coordinates | null;
  garage: any;
  theme: 'light' | 'dark';
  onClose: () => void;
  onGetDirections?: () => void;
}

const MapModal: React.FC<MapModalProps> = ({ 
  isVisible, 
  userLocation, 
  garage, 
  theme, 
  onClose,
  onGetDirections 
}) => {
  // Theme-based colors
  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-white';
  const cardBgColor = theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50';
  const textColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const textSecondaryColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';

  // Garage coordinates with fallback to Dar es Salaam
  const garageCoordinates = garage?.coordinates || {
    latitude: -6.7924,
    longitude: 39.2083,
  };

  // Map region configuration
  const mapRegion = {
    latitude: garageCoordinates.latitude,
    longitude: garageCoordinates.longitude,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  // Calculate distance if user location is available
  const distance = userLocation ? 
    calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      garageCoordinates.latitude,
      garageCoordinates.longitude
    ) : 'N/A';

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/70">
        <View className={`flex-1 ${bgColor} mt-16 rounded-t-3xl overflow-hidden`}>
          {/* Header with Gradient */}
          <View className={`relative ${theme === 'dark' ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-blue-50 to-indigo-50'} p-5 pb-4 border-b ${borderColor}`}>
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1 pr-4">
                <Text className={`text-2xl font-bold ${textColor} mb-1`}>
                  {garage?.name || 'Garage Location'}
                </Text>
                <Text className={`text-sm ${textSecondaryColor}`}>
                  {garage?.address || 'Dar es Salaam, Tanzania'}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={onClose}
                className={`w-10 h-10 rounded-full items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}
              >
                <Ionicons name="close" size={24} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
              </TouchableOpacity>
            </View>

            {/* Distance and Status Info */}
            <View className="flex-row space-x-4">
              <View className={`flex-1 p-3 rounded-xl ${cardBgColor} items-center`}>
                <View className="flex-row items-center mb-1">
                  <Ionicons name="navigate" size={16} color="#3b82f6" />
                  <Text className={`ml-2 font-bold ${textColor}`}>{distance} km</Text>
                </View>
                <Text className={`text-xs ${textSecondaryColor}`}>Distance</Text>
              </View>
              
              <View className={`flex-1 p-3 rounded-xl ${cardBgColor} items-center`}>
                <View className="flex-row items-center mb-1">
                  <MaterialIcons name="directions-car" size={16} color="#10b981" />
                  <Text className={`ml-2 font-bold ${textColor}`}>
                    {garage?.estimatedTime || '15-30 mins'}
                  </Text>
                </View>
                <Text className={`text-xs ${textSecondaryColor}`}>Travel Time</Text>
              </View>
              
              <View className={`flex-1 p-3 rounded-xl ${cardBgColor} items-center`}>
                <View className="flex-row items-center mb-1">
                  <Ionicons name="star" size={16} color="#fbbf24" />
                  <Text className={`ml-2 font-bold ${textColor}`}>
                    {garage?.rating || '4.5'}
                  </Text>
                </View>
                <Text className={`text-xs ${textSecondaryColor}`}>Rating</Text>
              </View>
            </View>
          </View>

          {/* Map Container */}
          <View className="flex-1 relative">
            <MapView
              style={StyleSheet.absoluteFillObject}
              provider={PROVIDER_GOOGLE}
              region={mapRegion}
              showsUserLocation={!!userLocation}
              showsMyLocationButton={true}
              showsCompass={true}
              toolbarEnabled={true}
            >
              {/* Garage Marker */}
              <Marker
                coordinate={garageCoordinates}
                title={garage?.name || 'Garage'}
                description={garage?.address || 'Service Location'}
                pinColor="#ef4444"
              >
                <View className="items-center">
                  <View className="w-12 h-12 bg-red-500 rounded-full items-center justify-center border-2 border-white shadow-lg">
                    <MaterialIcons name="garage" size={20} color="white" />
                  </View>
                  <View className="bg-red-500 px-2 py-1 rounded-lg mt-1">
                    <Text className="text-white text-xs font-bold">Garage</Text>
                  </View>
                </View>
              </Marker>
            </MapView>

            {/* Current Location Button */}
            {userLocation && (
              <View className="absolute bottom-4 right-4">
                <TouchableOpacity 
                  className={`w-12 h-12 rounded-full items-center justify-center shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
                >
                  <Ionicons name="locate" size={24} color="#3b82f6" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Action Buttons Panel */}
          <View className={`p-5 ${cardBgColor} border-t ${borderColor}`}>
            <View className="mb-4">
              <Text className={`font-semibold ${textColor} mb-2`}>Garage Information</Text>
              <View className={`p-4 rounded-xl ${bgColor} border ${borderColor}`}>
                <View className="flex-row items-center mb-2">
                  <Ionicons name="time" size={18} color="#6b7280" />
                  <Text className={`ml-3 ${textColor}`}>
                    {garage?.isOpen !== false ? 'Open Now' : 'Closed'}
                  </Text>
                  <View className={`ml-auto px-3 py-1 rounded-full ${garage?.isOpen !== false ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    <Text className={`text-xs font-semibold ${garage?.isOpen !== false ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                      {garage?.isOpen !== false ? 'OPEN' : 'CLOSED'}
                    </Text>
                  </View>
                </View>
                
                <View className="flex-row items-center mb-2">
                  <Ionicons name="call" size={18} color="#6b7280" />
                  <Text className={`ml-3 ${textColor}`}>
                    {garage?.phone || '+255 123 456 789'}
                  </Text>
                </View>
                
                <View className="flex-row items-center">
                  <Ionicons name="mail" size={18} color="#6b7280" />
                  <Text className={`ml-3 ${textSecondaryColor}`}>
                    {garage?.email || 'info@garage.com'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row space-x-3">
              <TouchableOpacity 
                className={`flex-1 py-3 rounded-xl items-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} border ${borderColor}`}
                onPress={() => {
                  // Call garage functionality
                  if (garage?.phone) {
                    // Implement calling logic here
                  }
                }}
              >
                <Ionicons name="call" size={22} color="#3b82f6" />
                <Text className={`mt-1 text-sm font-medium ${textColor}`}>Call</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className={`flex-1 py-3 rounded-xl items-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} border ${borderColor}`}
                onPress={() => {
                  // Message garage functionality
                }}
              >
                <Ionicons name="chatbubble" size={22} color="#3b82f6" />
                <Text className={`mt-1 text-sm font-medium ${textColor}`}>Message</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className={`flex-2 py-3 rounded-xl items-center bg-gradient-to-r from-blue-600 to-indigo-600`}
                onPress={onGetDirections}
              >
                <View className="flex-row items-center">
                  <Ionicons name="navigate" size={22} color="white" />
                  <Text className="ml-2 text-white font-bold">Get Directions</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Safety Note */}
            <View className={`mt-4 p-3 rounded-lg ${theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'} border border-blue-200 dark:border-blue-800`}>
              <View className="flex-row items-start">
                <Ionicons name="shield-checkmark" size={18} color="#3b82f6" className="mt-0.5" />
                <Text className={`ml-2 flex-1 text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-800'}`}>
                  For your safety, share your trip details with someone when visiting the garage.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default MapModal;