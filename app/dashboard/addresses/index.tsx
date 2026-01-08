// app/dashboard/addresses/index.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  Ionicons,
  MaterialIcons,
  FontAwesome,
  FontAwesome5,
} from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';

// Type definition
interface Address {
  id: string;
  name: string;
  type: 'home' | 'work' | 'other';
  address_line1: string;
  address_line2?: string;
  city: string;
  region: string;
  country: string;
  postal_code: string;
  phone_number: string;
  is_default: boolean;
  notes?: string;
}

export default function AddressesScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  
  // Static addresses data
  const addresses: Address[] = [
    {
      id: '1',
      name: 'Home Address',
      type: 'home',
      address_line1: '123 Main Street',
      address_line2: 'Mikocheni Area',
      city: 'Dar es Salaam',
      region: 'Ilala',
      country: 'Tanzania',
      postal_code: '14112',
      phone_number: '0765 123 456',
      is_default: true,
      notes: 'Near Mikocheni Police Station',
    },
    {
      id: '2',
      name: 'Work Office',
      type: 'work',
      address_line1: '456 Business Avenue',
      address_line2: 'Plot No. 78',
      city: 'Dar es Salaam',
      region: 'Kinondoni',
      country: 'Tanzania',
      postal_code: '14110',
      phone_number: '0754 987 654',
      is_default: false,
      notes: 'Third floor, Quick Fix Auto Services',
    },
    {
      id: '3',
      name: 'Parents House',
      type: 'home',
      address_line1: '789 Family Road',
      city: 'Arusha',
      region: 'Arusha',
      country: 'Tanzania',
      postal_code: '23101',
      phone_number: '0789 456 123',
      is_default: false,
    },
    {
      id: '4',
      name: 'Weekend Garage',
      type: 'other',
      address_line1: '321 Service Lane',
      address_line2: 'Industrial Area',
      city: 'Mwanza',
      region: 'Ilemela',
      country: 'Tanzania',
      postal_code: '33201',
      phone_number: '0768 321 987',
      is_default: false,
      notes: 'For weekend car maintenance',
    },
  ];

  // Theme colors
  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
  const cardColor = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const textSecondaryColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  const primaryColor = '#3b82f6';
  const homeColor = '#10b981';
  const workColor = '#8b5cf6';
  const otherColor = '#f59e0b';

  // Get address type icon and color
  const getAddressTypeInfo = (type: string) => {
    switch (type) {
      case 'home':
        return {
          icon: 'home',
          iconType: 'fontawesome5',
          color: homeColor,
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          textColor: 'text-green-800 dark:text-green-300',
          label: 'Home',
        };
      case 'work':
        return {
          icon: 'briefcase',
          iconType: 'fontawesome5',
          color: workColor,
          bgColor: 'bg-purple-100 dark:bg-purple-900/30',
          textColor: 'text-purple-800 dark:text-purple-300',
          label: 'Work',
        };
      default:
        return {
          icon: 'location-pin',
          iconType: 'material',
          color: otherColor,
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
          textColor: 'text-yellow-800 dark:text-yellow-300',
          label: 'Other',
        };
    }
  };

  // Get address type icon component
  const getAddressIcon = (type: string) => {
    const info = getAddressTypeInfo(type);
    
    if (info.iconType === 'fontawesome5') {
      return <FontAwesome5 name={info.icon as any} size={24} color={info.color} />;
    } else {
      return <MaterialIcons name={info.icon as any} size={24} color={info.color} />;
    }
  };

  // Format phone number
  const formatPhoneNumber = (phone: string) => {
    return phone.replace(/(\d{4}) (\d{3}) (\d{3})/, '$1 $2 $3');
  };

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View className={`px-6 pt-8 pb-4 ${cardColor} shadow-sm ${borderColor} border-b`}>
        <View className="flex-row items-center mb-4">
          <TouchableOpacity 
            className="mr-4"
            onPress={() => router.back()}
          >
            <Ionicons 
              name="arrow-back" 
              size={28} 
              color={theme === 'dark' ? '#fff' : '#000'} 
            />
          </TouchableOpacity>
          
          <View className="flex-1">
            <Text className={`text-2xl font-bold ${textColor}`}>
              Address Book
            </Text>
            <Text className={`${textSecondaryColor} mt-1`}>
              Your saved delivery addresses
            </Text>
          </View>
          
          <TouchableOpacity 
            className={`w-10 h-10 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} items-center justify-center`}
            onPress={() => router.push('/dashboard')}
          >
            <Ionicons 
              name="map" 
              size={22} 
              color={primaryColor} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Info Card */}
        <View className={`mx-6 mt-6 p-5 ${cardColor} rounded-2xl shadow-sm ${borderColor} border`}>
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center mr-3">
              <Ionicons name="information-circle" size={22} color={primaryColor} />
            </View>
            <Text className={`font-bold text-lg ${textColor}`}>
              Address Information
            </Text>
          </View>
          
          <Text className={`${textSecondaryColor} leading-6`}>
            Your saved addresses are displayed here. Services can be delivered to any of these locations.
            The default address is used for all new bookings.
          </Text>
        </View>

        {/* Addresses List */}
        <View className="mx-6 mt-6">
          <Text className={`text-lg font-semibold mb-4 ${textColor}`}>
            Saved Addresses ({addresses.length})
          </Text>
          
          {addresses.map((address) => {
            const typeInfo = getAddressTypeInfo(address.type);
            
            return (
              <View 
                key={address.id}
                className={`${cardColor} rounded-2xl p-5 mb-4 shadow-sm ${borderColor} border ${
                  address.is_default ? 'border-blue-300 dark:border-blue-700 border-2' : ''
                }`}
              >
                {/* Address Header */}
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-row items-start">
                    <View className={`w-12 h-12 rounded-xl ${typeInfo.bgColor} items-center justify-center mr-4`}>
                      {getAddressIcon(address.type)}
                    </View>
                    
                    <View className="flex-1">
                      <View className="flex-row items-center flex-wrap">
                        <Text className={`font-bold text-lg ${textColor} mr-2`}>
                          {address.name}
                        </Text>
                        <View className={`px-2 py-1 rounded-full ${typeInfo.bgColor}`}>
                          <Text className={`text-xs font-medium ${typeInfo.textColor}`}>
                            {typeInfo.label}
                          </Text>
                        </View>
                      </View>
                      
                      {/* Default Badge */}
                      {address.is_default && (
                        <View className="mt-2">
                          <View className="flex-row items-center">
                            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                            <Text className="ml-1 text-green-600 dark:text-green-400 text-sm font-medium">
                              Default Delivery Address
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                
                {/* Address Details */}
                <View className="space-y-3 ml-16">
                  {/* Full Address */}
                  <View>
                    <Text className={`font-medium ${textColor}`}>
                      {address.address_line1}
                    </Text>
                    {address.address_line2 && (
                      <Text className={`${textColor}`}>
                        {address.address_line2}
                      </Text>
                    )}
                    <Text className={`${textColor}`}>
                      {address.city}, {address.region}
                    </Text>
                    <Text className={`${textColor}`}>
                      {address.country} - {address.postal_code}
                    </Text>
                  </View>
                  
                  {/* Contact & Location Info */}
                  <View className="space-y-2 pt-3 border-t ${borderColor}">
                    {/* Phone */}
                    <View className="flex-row items-center">
                      <Ionicons 
                        name="call" 
                        size={18} 
                        color={textSecondaryColor} 
                      />
                      <Text className={`ml-3 ${textColor}`}>
                        {formatPhoneNumber(address.phone_number)}
                      </Text>
                    </View>
                    
                    {/* Location */}
                    <View className="flex-row items-center">
                      <Ionicons 
                        name="location" 
                        size={18} 
                        color={textSecondaryColor} 
                      />
                      <Text className={`ml-3 ${textColor}`}>
                        {address.city}, {address.region}
                      </Text>
                    </View>
                    
                    {/* Notes */}
                    {address.notes && (
                      <View className="mt-2 pt-3 border-t ${borderColor}">
                        <Text className={`text-sm ${textSecondaryColor} mb-1`}>
                          Notes:
                        </Text>
                        <Text className={`${textColor} italic`}>
                          {address.notes}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Address Types Legend */}
        <View className={`mx-6 mt-8 p-5 ${cardColor} rounded-2xl shadow-sm ${borderColor} border`}>
          <Text className={`font-bold text-lg mb-4 ${textColor}`}>
            Address Types
          </Text>
          
          <View className="space-y-3">
            {/* Home */}
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 items-center justify-center mr-4">
                <FontAwesome5 name="home" size={20} color={homeColor} />
              </View>
              <View className="flex-1">
                <Text className={`font-medium ${textColor}`}>
                  Home Address
                </Text>
                <Text className={`text-sm ${textSecondaryColor}`}>
                  Personal residence for deliveries
                </Text>
              </View>
            </View>
            
            {/* Work */}
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 items-center justify-center mr-4">
                <FontAwesome5 name="briefcase" size={20} color={workColor} />
              </View>
              <View className="flex-1">
                <Text className={`font-medium ${textColor}`}>
                  Work Address
                </Text>
                <Text className={`text-sm ${textSecondaryColor}`}>
                  Office or business location
                </Text>
              </View>
            </View>
            
            {/* Other */}
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 items-center justify-center mr-4">
                <MaterialIcons name="location-pin" size={20} color={otherColor} />
              </View>
              <View className="flex-1">
                <Text className={`font-medium ${textColor}`}>
                  Other Addresses
                </Text>
                <Text className={`text-sm ${textSecondaryColor}`}>
                  Garages, family, or other locations
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Map View Section */}
        <View className={`mx-6 mt-8 p-5 ${cardColor} rounded-2xl shadow-sm ${borderColor} border`}>
          <View className="flex-row items-center mb-4">
            <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center mr-3">
              <Ionicons name="map-outline" size={22} color={primaryColor} />
            </View>
            <View className="flex-1">
              <Text className={`font-bold text-lg ${textColor}`}>
                View on Map
              </Text>
              <Text className={`${textSecondaryColor}`}>
                See all your addresses on a map
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            className={`flex-row items-center justify-between p-4 bg-blue-600 rounded-xl mt-2`}
            onPress={() => router.push('/dashboard/garages')}
          >
            <View className="flex-row items-center">
              <Ionicons name="map" size={24} color="white" />
              <Text className="ml-3 text-white font-bold text-lg">
                Open Map View
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}