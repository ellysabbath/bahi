// screens/DashboardScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { 
  Ionicons, 
  MaterialIcons, 
  FontAwesome5, 
  Feather,
  MaterialCommunityIcons,
  FontAwesome
} from '@expo/vector-icons';

interface ServiceType {
  id: number;
  name: string;
  icon: string;
  color: string;
  desc: string;
  category: string;
}

interface GarageType {
  id: number;
  name: string;
  distance: string;
  rating: number;
  ratingCount: number;
  services: number[];
  isOpen: boolean;
  delivery: boolean;
  address: string;
  estimatedTime: string;
}

interface ServiceDetail {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: string;
  garageId: number;
}

const DashboardScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [selectedGarage, setSelectedGarage] = useState<GarageType | null>(null);
  const [showGarageModal, setShowGarageModal] = useState<boolean>(false);
  const [showServiceModal, setShowServiceModal] = useState<boolean>(false);
  const [selectedGarageServices, setSelectedGarageServices] = useState<ServiceDetail[]>([]);
  const [selectedGarageDetails, setSelectedGarageDetails] = useState<any>(null);

  const services: ServiceType[] = [
    { 
      id: 1, 
      name: 'Oil Change', 
      icon: 'oil', 
      color: 'bg-orange-500', 
      desc: 'Engine oil replacement',
      category: 'Maintenance'
    },
    { 
      id: 2, 
      name: 'Brake Service', 
      icon: 'car-brake-parking', 
      color: 'bg-red-500', 
      desc: 'Brake pads & disc check',
      category: 'Safety'
    },
    { 
      id: 3, 
      name: 'Diagnostics', 
      icon: 'search', 
      color: 'bg-purple-500', 
      desc: 'Full vehicle scan',
      category: 'Diagnostics'
    },
    { 
      id: 4, 
      name: 'Tire Service', 
      icon: 'tire', 
      color: 'bg-yellow-500', 
      desc: 'Repair & Replacement',
      category: 'Maintenance'
    },
    { 
      id: 5, 
      name: 'Battery Service', 
      icon: 'car-battery', 
      color: 'bg-green-500', 
      desc: 'Jumpstart & Replace',
      category: 'Electrical'
    },
    { 
      id: 6, 
      name: 'AC Repair', 
      icon: 'snowflake', 
      color: 'bg-blue-500', 
      desc: 'AC system repair',
      category: 'Comfort'
    },
    { 
      id: 7, 
      name: 'Car Wash', 
      icon: 'water', 
      color: 'bg-indigo-500', 
      desc: 'Premium cleaning',
      category: 'Cleaning'
    },
    { 
      id: 8, 
      name: 'Engine Repair', 
      icon: 'engine', 
      color: 'bg-red-600', 
      desc: 'Major engine work',
      category: 'Repair'
    },
  ];

  const nearbyGarages: GarageType[] = [
    { 
      id: 1, 
      name: 'Speedy Auto Fix', 
      distance: '1.2 km', 
      rating: 4.8, 
      ratingCount: 245,
      services: [1, 2, 3, 7],
      isOpen: true,
      delivery: true,
      address: '123 Main Street',
      estimatedTime: '15-30 mins'
    },
    { 
      id: 2, 
      name: 'Pro Mechanics Hub', 
      distance: '2.5 km', 
      rating: 4.9, 
      ratingCount: 189,
      services: [1, 2, 3, 4, 5, 6],
      isOpen: true,
      delivery: false,
      address: '456 Auto Lane',
      estimatedTime: '20-40 mins'
    },
    { 
      id: 3, 
      name: '24/7 Emergency Garage', 
      distance: '3.1 km', 
      rating: 4.6, 
      ratingCount: 342,
      services: [1, 3, 5, 8],
      isOpen: true,
      delivery: true,
      address: '789 Service Road',
      estimatedTime: '30-45 mins'
    },
    { 
      id: 4, 
      name: 'Premium Car Care', 
      distance: '4.3 km', 
      rating: 4.7, 
      ratingCount: 167,
      services: [2, 4, 6, 7],
      isOpen: true,
      delivery: true,
      address: '321 Luxury Ave',
      estimatedTime: '25-35 mins'
    },
  ];

  const serviceDetails: ServiceDetail[] = [
    { id: 1, name: 'Standard Oil Change', description: 'Synthetic oil change with filter', price: 49.99, duration: '30 mins', garageId: 1 },
    { id: 2, name: 'Premium Oil Change', description: 'Full synthetic premium oil', price: 69.99, duration: '45 mins', garageId: 1 },
    { id: 3, name: 'Brake Pad Replacement', description: 'Front brake pads replacement', price: 89.99, duration: '1 hour', garageId: 1 },
    { id: 4, name: 'Full Diagnostic Scan', description: 'Complete vehicle computer scan', price: 39.99, duration: '30 mins', garageId: 2 },
    { id: 5, name: 'Tire Rotation', description: 'Four tire rotation service', price: 29.99, duration: '25 mins', garageId: 2 },
    { id: 6, name: 'Battery Replacement', description: 'New battery installation', price: 129.99, duration: '45 mins', garageId: 3 },
    { id: 7, name: 'AC Recharge', description: 'AC system recharge', price: 79.99, duration: '1 hour', garageId: 3 },
    { id: 8, name: 'Premium Car Wash', description: 'Full interior & exterior cleaning', price: 39.99, duration: '45 mins', garageId: 4 },
  ];

  const onRefresh = (): void => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const handleServicePress = (service: ServiceType): void => {
    setSelectedService(service);
    setShowServiceModal(true);
  };

  const handleGaragePress = (garage: GarageType): void => {
    setSelectedGarage(garage);
    
    // Filter services for this garage
    const garageServices = serviceDetails.filter(service => 
      garage.services.includes(service.id)
    );
    setSelectedGarageServices(garageServices);
    
    // Get garage details
    setSelectedGarageDetails({
      ...garage,
      allServices: garageServices
    });
    
    setShowGarageModal(true);
  };

  const handleBookService = (service: ServiceDetail) => {
    Alert.alert(
      'Book Service',
      `Book ${service.name} at ${selectedGarage?.name} for $${service.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm Booking', 
          onPress: () => {
            Alert.alert('Success', 'Service booked successfully!');
            setShowGarageModal(false);
          }
        }
      ]
    );
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'oil':
        return <FontAwesome5 name="oil-can" size={24} color="white" />;
      case 'car-brake-parking':
        return <MaterialCommunityIcons name="car-brake-parking" size={28} color="white" />;
      case 'search':
        return <Ionicons name="search" size={28} color="white" />;
      case 'tire':
        return <FontAwesome5 name="tire" size={24} color="white" />;
      case 'car-battery':
        return <FontAwesome5 name="car-battery" size={24} color="white" />;
      case 'snowflake':
        return <FontAwesome5 name="snowflake" size={24} color="white" />;
      case 'water':
        return <MaterialCommunityIcons name="water" size={28} color="white" />;
      case 'engine':
        return <MaterialCommunityIcons name="engine" size={28} color="white" />;
      default:
        return <MaterialIcons name="build" size={28} color="white" />;
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons 
          key={i} 
          name={i <= rating ? "star" : "star-outline"} 
          size={16} 
          color={i <= rating ? "#fbbf24" : "#d1d5db"} 
        />
      );
    }
    return stars;
  };

  const filteredServices = searchQuery 
    ? services.filter(service => 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : services;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      {/* Header Section */}
      <View className="px-5 pt-5 pb-3 bg-white shadow-sm">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 items-center justify-center mr-3 shadow">
              <FontAwesome5 name="tools" size={22} color="white" />
            </View>
            <View>
              <Text className="text-2xl font-bold text-gray-900">Quick Fix Auto</Text>
              <Text className="text-gray-600 text-sm">Find nearby garages instantly</Text>
            </View>
          </View>
          <View className="flex-row space-x-3">
            <TouchableOpacity className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center shadow-sm">
              <Ionicons name="location" size={22} color="#4b5563" />
            </TouchableOpacity>
            <TouchableOpacity className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center shadow-sm relative">
              <Ionicons name="notifications-outline" size={22} color="#4b5563" />
              <View className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center border border-white">
                <Text className="text-xs text-white font-bold">3</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View className="relative">
          <TextInput
            className="bg-gray-100 rounded-2xl px-5 py-4 pl-14 text-gray-800 font-medium"
            placeholder="Search services, garages, or mechanics..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <View className="absolute left-5 top-4">
            <Ionicons name="search" size={20} color="#6b7280" />
          </View>
          {searchQuery ? (
            <TouchableOpacity 
              className="absolute right-5 top-4"
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#3b82f6"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Featured Services */}
        <View className="mx-5 mt-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-900">Featured Services</Text>
            <TouchableOpacity>
              <Text className="text-blue-600 font-semibold">View All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="space-x-4"
          >
            {services.slice(0, 5).map((service) => (
              <TouchableOpacity 
                key={service.id}
                className="bg-white rounded-2xl p-5 shadow-md w-40"
                onPress={() => handleServicePress(service)}
              >
                <View className={`w-12 h-12 ${service.color} rounded-2xl items-center justify-center mb-4`}>
                  {renderIcon(service.icon)}
                </View>
                <Text className="font-bold text-gray-900 text-lg mb-1">{service.name}</Text>
                <Text className="text-gray-500 text-sm mb-3">{service.desc}</Text>
                <View className="flex-row items-center">
                  <Text className="text-blue-600 font-bold">Book Now</Text>
                  <MaterialIcons name="arrow-forward-ios" size={14} color="#3b82f6" className="ml-1" />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Nearby Garages */}
        <View className="mx-5 mt-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-900">Nearby Garages</Text>
            <TouchableOpacity>
              <Text className="text-blue-600 font-semibold">View All</Text>
            </TouchableOpacity>
          </View>
          
          <View className="space-y-4">
            {nearbyGarages.map((garage) => (
              <TouchableOpacity 
                key={garage.id}
                className="bg-white rounded-2xl p-5 shadow-md border border-gray-100"
                onPress={() => handleGaragePress(garage)}
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <Text className="font-bold text-gray-900 text-lg mr-2">{garage.name}</Text>
                      {garage.delivery && (
                        <View className="bg-green-100 px-2 py-1 rounded-full">
                          <Text className="text-green-800 text-xs font-semibold">Delivery</Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="location" size={16} color="#6b7280" />
                      <Text className="text-gray-600 text-sm ml-2">{garage.address}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="time" size={16} color="#6b7280" />
                      <Text className="text-gray-600 text-sm ml-2">{garage.distance} • {garage.estimatedTime}</Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <View className="flex-row items-center mb-1">
                      {renderStars(garage.rating)}
                    </View>
                    <Text className="text-gray-500 text-xs">{garage.rating} ({garage.ratingCount})</Text>
                    <View className={`px-3 py-1 rounded-full mt-2 ${
                      garage.isOpen ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <Text className={`text-xs font-semibold ${
                        garage.isOpen ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {garage.isOpen ? 'OPEN NOW' : 'CLOSED'}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View className="flex-row flex-wrap gap-2">
                  {garage.services.slice(0, 4).map((serviceId, index) => {
                    const service = services.find(s => s.id === serviceId);
                    return service ? (
                      <View key={index} className={`${service.color} px-3 py-1 rounded-full`}>
                        <Text className="text-white text-xs font-semibold">{service.name}</Text>
                      </View>
                    ) : null;
                  })}
                  {garage.services.length > 4 && (
                    <View className="bg-gray-200 px-3 py-1 rounded-full">
                      <Text className="text-gray-700 text-xs font-semibold">+{garage.services.length - 4} more</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* All Services Grid */}
        <View className="mx-5 mt-8 mb-10">
          <Text className="text-xl font-bold text-gray-900 mb-5">All Services</Text>
          <View className="flex-row flex-wrap justify-between">
            {filteredServices.map((service) => (
              <TouchableOpacity
                key={service.id}
                className="w-[48%] bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100"
                onPress={() => handleServicePress(service)}
              >
                <View className={`w-14 h-14 ${service.color} rounded-2xl items-center justify-center mb-4`}>
                  {renderIcon(service.icon)}
                </View>
                <Text className="font-bold text-gray-900 text-base mb-1">{service.name}</Text>
                <Text className="text-gray-500 text-xs mb-2">{service.category}</Text>
                <Text className="text-gray-600 text-sm">{service.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Service Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showServiceModal}
        onRequestClose={() => setShowServiceModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-gray-900">Service Details</Text>
              <TouchableOpacity onPress={() => setShowServiceModal(false)}>
                <Ionicons name="close" size={28} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            {selectedService && (
              <>
                <View className={`w-20 h-20 ${selectedService.color} rounded-2xl items-center justify-center mb-6 self-center`}>
                  {renderIcon(selectedService.icon)}
                </View>
                <Text className="text-3xl font-bold text-gray-900 text-center mb-2">{selectedService.name}</Text>
                <Text className="text-gray-600 text-center mb-6">{selectedService.desc}</Text>
                
                <View className="bg-gray-50 rounded-2xl p-5 mb-6">
                  <Text className="font-semibold text-gray-900 mb-3">Available at these garages:</Text>
                  <View className="space-y-3">
                    {nearbyGarages.filter(g => g.services.includes(selectedService.id)).map(garage => (
                      <TouchableOpacity 
                        key={garage.id}
                        className="flex-row items-center justify-between bg-white p-3 rounded-xl"
                        onPress={() => {
                          setShowServiceModal(false);
                          handleGaragePress(garage);
                        }}
                      >
                        <View>
                          <Text className="font-semibold text-gray-900">{garage.name}</Text>
                          <Text className="text-gray-500 text-sm">{garage.distance} away</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Text className="text-blue-600 font-bold mr-2">View</Text>
                          <MaterialIcons name="arrow-forward-ios" size={16} color="#3b82f6" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <TouchableOpacity 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 py-4 rounded-2xl items-center"
                  onPress={() => {
                    setShowServiceModal(false);
                    Alert.alert('Book Service', 'Please select a garage to continue');
                  }}
                >
                  <Text className="text-white font-bold text-lg">Book This Service</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Garage Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showGarageModal}
        onRequestClose={() => setShowGarageModal(false)}
      >
        <SafeAreaView className="flex-1 bg-black/50">
          <View className="flex-1 bg-white mt-20 rounded-t-3xl">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {selectedGarageDetails && (
                <>
                  {/* Garage Header */}
                  <View className="p-5">
                    <TouchableOpacity 
                      className="absolute top-5 right-5 z-10"
                      onPress={() => setShowGarageModal(false)}
                    >
                      <Ionicons name="close" size={28} color="#4b5563" />
                    </TouchableOpacity>
                    
                    <View className="flex-row items-start mb-4">
                      <View className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl items-center justify-center mr-4">
                        <FontAwesome5 name="warehouse" size={28} color="white" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-2xl font-bold text-gray-900">{selectedGarageDetails.name}</Text>
                        <View className="flex-row items-center mt-1">
                          <View className="flex-row items-center mr-4">
                            {renderStars(selectedGarageDetails.rating)}
                          </View>
                          <Text className="text-gray-600">{selectedGarageDetails.rating} ({selectedGarageDetails.ratingCount})</Text>
                        </View>
                        <View className="flex-row items-center mt-2">
                          <Ionicons name="location" size={16} color="#6b7280" />
                          <Text className="text-gray-600 ml-2">{selectedGarageDetails.address}</Text>
                        </View>
                      </View>
                    </View>

                    <View className="flex-row space-x-3 mb-6">
                      <View className="flex-1 bg-blue-50 p-3 rounded-xl">
                        <Text className="text-blue-800 font-bold text-center">{selectedGarageDetails.distance}</Text>
                        <Text className="text-gray-600 text-xs text-center">Distance</Text>
                      </View>
                      <View className="flex-1 bg-green-50 p-3 rounded-xl">
                        <Text className="text-green-800 font-bold text-center">{selectedGarageDetails.estimatedTime}</Text>
                        <Text className="text-gray-600 text-xs text-center">Wait Time</Text>
                      </View>
                      <View className="flex-1 bg-purple-50 p-3 rounded-xl">
                        <Text className="text-purple-800 font-bold text-center">{selectedGarageDetails.services.length}+</Text>
                        <Text className="text-gray-600 text-xs text-center">Services</Text>
                      </View>
                    </View>
                  </View>

                  {/* Services Section */}
                  <View className="px-5 mb-8">
                    <Text className="text-xl font-bold text-gray-900 mb-4">Available Services</Text>
                    <View className="space-y-3">
                      {selectedGarageServices.map((service) => (
                        <TouchableOpacity 
                          key={service.id}
                          className="bg-gray-50 rounded-2xl p-4 border border-gray-200"
                          onPress={() => handleBookService(service)}
                        >
                          <View className="flex-row justify-between items-center mb-2">
                            <Text className="font-bold text-gray-900 text-lg">{service.name}</Text>
                            <Text className="text-blue-600 font-bold text-lg">${service.price}</Text>
                          </View>
                          <Text className="text-gray-600 mb-3">{service.description}</Text>
                          <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center">
                              <Ionicons name="time" size={16} color="#6b7280" />
                              <Text className="text-gray-600 ml-2">{service.duration}</Text>
                            </View>
                            <TouchableOpacity className="bg-blue-600 px-4 py-2 rounded-xl">
                              <Text className="text-white font-semibold">Book Now</Text>
                            </TouchableOpacity>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Contact Section */}
                  <View className="px-5 mb-8">
                    <Text className="text-xl font-bold text-gray-900 mb-4">Contact & Info</Text>
                    <View className="bg-gray-50 rounded-2xl p-4">
                      <View className="flex-row items-center mb-3">
                        <Ionicons name="call" size={20} color="#3b82f6" />
                        <Text className="text-gray-900 ml-3 font-medium">Call Garage</Text>
                        <Text className="text-blue-600 ml-auto font-semibold">Tap to call</Text>
                      </View>
                      <View className="flex-row items-center mb-3">
                        <Ionicons name="chatbubble" size={20} color="#3b82f6" />
                        <Text className="text-gray-900 ml-3 font-medium">Message Mechanic</Text>
                        <Text className="text-blue-600 ml-auto font-semibold">Send message</Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons name="navigate" size={20} color="#3b82f6" />
                        <Text className="text-gray-900 ml-3 font-medium">Get Directions</Text>
                        <Text className="text-blue-600 ml-auto font-semibold">Open maps</Text>
                      </View>
                    </View>
                  </View>

                  {/* Book All Services Button */}
                  <View className="px-5 pb-10">
                    <TouchableOpacity 
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 py-4 rounded-2xl items-center"
                      onPress={() => {
                        Alert.alert('Book All Services', 'Select multiple services to book?', [
                          { text: 'Later', style: 'cancel' },
                          { text: 'Continue', onPress: () => {
                            Alert.alert('Success', 'Booking request sent!');
                            setShowGarageModal(false);
                          }}
                        ]);
                      }}
                    >
                      <Text className="text-white font-bold text-lg">Book Multiple Services</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Bottom Navigation */}
      <View className="bg-white border-t border-gray-200 px-6 pt-3 pb-5 shadow-lg">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity className="items-center">
            <Ionicons name="home" size={26} color="#3b82f6" />
            <Text className="text-blue-600 text-xs font-semibold mt-1">Home</Text>
          </TouchableOpacity>
          <TouchableOpacity className="items-center">
            <MaterialIcons name="bookmarks" size={26} color="#9ca3af" />
            <Text className="text-gray-500 text-xs font-semibold mt-1">Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity className="items-center -mt-8">
            <View className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 items-center justify-center shadow-lg">
              <MaterialCommunityIcons name="car-wrench" size={32} color="white" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity className="items-center">
            <MaterialCommunityIcons name="garage" size={26} color="#9ca3af" />
            <Text className="text-gray-500 text-xs font-semibold mt-1">Garages</Text>
          </TouchableOpacity>
          <TouchableOpacity className="items-center">
            <Ionicons name="person" size={26} color="#9ca3af" />
            <Text className="text-gray-500 text-xs font-semibold mt-1">Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default DashboardScreen;