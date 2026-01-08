import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  Linking,
  Platform,
  Animated,
  Easing,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  MaterialCommunityIcons,
  Feather,
} from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// API Configuration
const API_BASE_URL = 'https://AutoFix.pythonanywhere.com/api';

interface OpeningHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

interface GarageType {
  id: number;
  name: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
  phone: string;
  email: string;
  rating: string;
  rating_count: number;
  is_open: boolean;
  delivery_available: boolean;
  estimated_time: string;
  opening_hours: OpeningHours;
  is_verified: boolean;
  is_active: boolean;
  city: string;
  created_at: string;
  updated_at: string;
  owner: null;
}

interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: GarageType[];
}

interface ContactMethod {
  id: number;
  title: string;
  value: string;
  icon: string;
  action: () => void;
  color: string;
  gradient: string[];
}

export default function ContactScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [garage, setGarage] = useState<GarageType | null>(null);
  const [garages, setGarages] = useState<GarageType[]>([]);
  const { theme } = useTheme();
  const router = useRouter();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const formSlideAnim = useRef(new Animated.Value(30)).current;

  // Fetch garage data
  useEffect(() => {
    fetchGarageData();
    
    // Start animations after a delay
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(slideUpAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.back(1)),
          useNativeDriver: true,
        }),
        Animated.timing(formSlideAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.out(Easing.back(1)),
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation for emergency contact
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Rotate animation for contact icons
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 30000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }, 500);
  }, []);

  const fetchGarageData = async () => {
    try {
      setLoading(true);
      console.log('🌐 Fetching garage data from:', `${API_BASE_URL}/garages/`);
      
      const response = await fetch(`${API_BASE_URL}/garages/`);
      const responseText = await response.text();
      console.log('📥 Raw API response:', responseText);
      
      let data: ApiResponse;
      try {
        data = JSON.parse(responseText);
        console.log('📊 Parsed API data:', data);
      } catch (e) {
        console.error('❌ Failed to parse JSON:', e);
        Alert.alert('Error', 'Failed to parse garage data. Please try again.');
        return;
      }
      
      if (response.ok) {
        if (data.results && data.results.length > 0) {
          setGarages(data.results);
          // Select the first garage with rating or the first one
          const selectedGarage = data.results.find(g => parseFloat(g.rating) > 0) || data.results[0];
          setGarage(selectedGarage);
          console.log('✅ Selected garage:', selectedGarage);
          console.log('📋 Total garages loaded:', data.results.length);
        } else {
          console.warn('⚠️ No garages found in API response');
          Alert.alert('No Garages', 'No garages available at the moment.');
        }
      } else {
        console.error('❌ API error:', data);
        Alert.alert('Error', 'Failed to load garage information.');
      }
    } catch (error) {
      console.error('🌐 Network error fetching garage:', error);
      Alert.alert('Network Error', 'Could not load garage information. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Generate contact methods based on garage data
  const getContactMethods = (): ContactMethod[] => {
    if (!garage) return [];
    
    return [
      {
        id: 1,
        title: 'Emergency Call',
        value: garage.phone || '+255 742 578 691',
        icon: 'phone-in-talk',
        action: () => garage.phone ? Linking.openURL(`tel:${garage.phone}`) : Alert.alert('No Phone', 'Phone number not available'),
        color: '#EF4444',
        gradient: ['#EF4444', '#F97316'],
      },
      {
        id: 2,
        title: 'Email Support',
        value: garage.email || 'support@example.com',
        icon: 'email-fast',
        action: () => garage.email ? Linking.openURL(`mailto:${garage.email}`) : Alert.alert('No Email', 'Email not available'),
        color: '#3B82F6',
        gradient: ['#3B82F6', '#8B5CF6'],
      },
      {
        id: 3,
        title: 'Live Chat',
        value: 'Available 24/7',
        icon: 'chat-processing',
        action: () => router.push('/dashboard/chat/index'),
        color: '#10B981',
        gradient: ['#10B981', '#34D399'],
      },
      {
        id: 4,
        title: 'Visit Workshop',
        value: garage.address || 'Dodoma Tz',
        icon: 'map-marker-radius',
        action: () => {
          if (garage.latitude && garage.longitude) {
            const url = `https://www.google.com/maps?q=${garage.latitude},${garage.longitude}`;
            Linking.openURL(url).catch(() => {
              Linking.openURL('https://maps.google.com').catch(console.error);
            });
          } else if (garage.address) {
            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(garage.address)}`;
            Linking.openURL(url).catch(() => {
              Linking.openURL('https://maps.google.com').catch(console.error);
            });
          } else {
            Alert.alert('Location Unavailable', 'Address information is not available');
          }
        },
        color: '#8B5CF6',
        gradient: ['#8B5CF6', '#EC4899'],
      },
    ];
  };

  const contactMethods = getContactMethods();

  const categories = [
    { id: 1, name: 'Emergency Repair', icon: 'alert-circle' },
    { id: 2, name: 'Service Booking', icon: 'calendar-clock' },
    { id: 3, name: 'Technical Support', icon: 'tools' },
    { id: 4, name: 'Feedback', icon: 'message-text' },
    { id: 5, name: 'Parts Inquiry', icon: 'car-wrench' },
    { id: 6, name: 'Other', icon: 'dots-horizontal-circle' },
  ];

  const faqItems = [
    {
      q: 'How quickly can you service my vehicle?',
      a: 'Most services are completed within 2-4 hours. Emergency repairs within 1 hour.',
      icon: 'clock-fast',
    },
    {
      q: 'Do you offer mobile repair services?',
      a: 'Yes! Our mobile mechanics can come to your location for most repairs.',
      icon: 'truck-check',
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept all major credit cards, digital wallets, and insurance claims.',
      icon: 'credit-card-check',
    },
    {
      q: 'Do you provide loaner vehicles?',
      a: 'Yes, complimentary loaner cars available for major repairs.',
      icon: 'car-convertible',
    },
  ];

  // Theme colors
  const themeColors = {
    dark: {
      bg: 'bg-gray-900',
      card: 'bg-gray-800',
      cardBorder: 'border-gray-700',
      text: {
        primary: 'text-gray-100',
        secondary: 'text-gray-400',
        tertiary: 'text-gray-500',
      },
      input: 'bg-gray-800/50 border-gray-700',
      placeholder: 'text-gray-500',
      shadow: 'shadow-black/50',
    },
    light: {
      bg: 'bg-gradient-to-b from-blue-50/30 via-white to-white',
      card: 'bg-white',
      cardBorder: 'border-gray-200',
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        tertiary: 'text-gray-500',
      },
      input: 'bg-gray-50/80 border-gray-300',
      placeholder: 'text-gray-400',
      shadow: 'shadow-gray-400/20',
    },
  };

  const colors = themeColors[theme];

  const handleSubmit = () => {
    if (!name || !email || !message || !category) {
      Alert.alert('Missing Information', 'Please fill all fields to continue');
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call with animation
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        '🎉 Message Sent Successfully!',
        'Our team will respond within 24 hours. Check your email for confirmation.',
        [{ text: 'OK', onPress: () => {
          setName('');
          setEmail('');
          setMessage('');
          setCategory('');
        }}]
      );
    }, 2000);
  };

  const handleEmergencyCall = () => {
    if (garage?.phone) {
      Linking.openURL(`tel:${garage.phone}`).catch(() => {
        Alert.alert('Error', 'Could not make the call. Please dial manually.');
      });
    } else {
      Alert.alert('Phone Unavailable', 'Emergency phone number is not available.');
    }
  };

  const EmergencyContactCard = () => (
    <Animated.View
      style={{
        transform: [{ scale: pulseAnim }],
      }}
      className="absolute top-6 right-5 z-10"
    >
      <TouchableOpacity
        className="bg-gradient-to-r from-red-500 to-orange-500 px-5 py-3 rounded-full flex-row items-center shadow-2xl"
        style={{
          shadowColor: '#EF4444',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        }}
        onPress={handleEmergencyCall}
      >
        <MaterialCommunityIcons name="phone-in-talk" size={20} color="white" />
        <Text className="text-white font-bold ml-2">Emergency Call</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const ContactMethodCard = ({ method, index }: { method: ContactMethod; index: number }) => {
    const cardSlideAnim = useRef(new Animated.Value(100)).current;
    
    useEffect(() => {
      Animated.spring(cardSlideAnim, {
        toValue: 0,
        delay: index * 100,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        style={{
          transform: [{ translateX: cardSlideAnim }],
          opacity: fadeAnim,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={method.action}
          className="w-44 h-52 rounded-3xl overflow-hidden mx-2"
          style={{
            shadowColor: method.color,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 15,
          }}
        >
          <View
            className="h-24"
            style={{
              backgroundColor: method.color,
              backgroundImage: `linear-gradient(135deg, ${method.gradient[0]}, ${method.gradient[1]})`,
            }}
          >
            <View className="p-4">
              <View className="w-12 h-12 rounded-xl bg-white/20 items-center justify-center mb-2">
                <MaterialCommunityIcons name={method.icon as any} size={28} color="white" />
              </View>
              <Text className="text-white text-lg font-bold">{method.title}</Text>
            </View>
          </View>
          <View className={`flex-1 p-4 ${colors.card}`}>
            <Text className={`text-sm font-medium mb-3 ${colors.text.secondary}`}>
              {method.value}
            </Text>
            <View className="flex-row items-center mt-auto">
              <Text className="text-blue-500 font-semibold text-sm">Contact Now</Text>
              <MaterialIcons name="arrow-forward-ios" size={14} color="#3b82f6" />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const CategoryPill = ({ categoryItem, isSelected }: { categoryItem: any; isSelected: boolean }) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: categoryItem.id * 50,
        tension: 150,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          className={`px-5 py-3 rounded-xl flex-row items-center space-x-2 ${
            isSelected 
              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg' 
              : `${colors.card} ${colors.shadow}`
          }`}
          onPress={() => setCategory(categoryItem.name)}
          style={{
            shadowColor: isSelected ? '#3B82F6' : '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isSelected ? 0.3 : 0.1,
            shadowRadius: isSelected ? 12 : 6,
            elevation: isSelected ? 8 : 4,
          }}
        >
          <MaterialCommunityIcons
            name={categoryItem.icon as any}
            size={20}
            color={isSelected ? 'white' : theme === 'dark' ? '#9CA3AF' : '#6B7280'}
          />
          <Text className={`font-semibold ${
            isSelected ? 'text-white' : colors.text.primary
          }`}>
            {categoryItem.name}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const FAQItem = ({ item, index }: { item: any; index: number }) => {
    const [expanded, setExpanded] = useState(false);
    const rotateValue = useRef(new Animated.Value(0)).current;
    
    const toggleExpand = () => {
      Animated.spring(rotateValue, {
        toValue: expanded ? 0 : 1,
        useNativeDriver: true,
      }).start();
      setExpanded(!expanded);
    };
    
    const rotate = rotateValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    });

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }],
        }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={toggleExpand}
          className={`${colors.card} rounded-2xl p-5 mb-4 ${colors.shadow}`}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 items-center justify-center mr-4">
              <MaterialCommunityIcons name={item.icon as any} size={24} color="#4F46E5" />
            </View>
            <View className="flex-1">
              <Text className={`text-lg font-bold mb-1 ${colors.text.primary}`}>
                {item.q}
              </Text>
            </View>
            <Animated.View style={{ transform: [{ rotate }] }}>
              <MaterialCommunityIcons
                name="chevron-down"
                size={24}
                color={colors.text.secondary}
              />
            </Animated.View>
          </View>
          
          {expanded && (
            <Animated.View
              className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
              style={{
                opacity: fadeAnim,
              }}
            >
              <Text className={`leading-relaxed ${colors.text.secondary}`}>
                {item.a}
              </Text>
            </Animated.View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${colors.bg}`}>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="#1E40AF" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className={`mt-4 ${colors.text.primary}`}>Loading garage information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // No garage data state
  if (!garage) {
    return (
      <SafeAreaView className={`flex-1 ${colors.bg}`}>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="#1E40AF" />
        <View className="flex-1 justify-center items-center p-5">
          <MaterialCommunityIcons name="garage-alert" size={80} color="#9CA3AF" />
          <Text className={`text-2xl font-bold mt-6 ${colors.text.primary}`}>No Garage Available</Text>
          <Text className={`text-center mt-3 ${colors.text.secondary}`}>
            Could not load garage information. Please try again later.
          </Text>
          <TouchableOpacity
            className="mt-8 bg-blue-600 px-8 py-4 rounded-xl"
            onPress={fetchGarageData}
          >
            <Text className="text-white font-bold text-lg">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${colors.bg}`}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="#1E40AF" />
      
      {/* Floating Particles Background */}
      <Animated.View
        style={{
          transform: [{ rotate: rotateInterpolate }],
          opacity: 0.1,
        }}
        className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none"
      >
        {[...Array(20)].map((_, i) => (
          <View
            key={i}
            className="absolute w-1 h-1 bg-blue-500 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </Animated.View>

      {/* Header with Gradient */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }],
        }}
        className="relative"
      >
        <View className="h-60 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-b-3xl">
          <View className="p-5 pt-10">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-green-900 text-4xl font-black">Contact Us</Text>
                <Text className="text-green-900 text-lg mt-2">
                  {garage.name}
                </Text>
                {garage.city && (
                  <Text className="text-orange-900 text-sm mt-1">
                    📍 {garage.city}
                  </Text>
                )}
              </View>
              <TouchableOpacity 
                className="bg-white/20 p-3 rounded-full active:scale-95"
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color="green" />
              </TouchableOpacity>
            </View>
            
            <View className="mt-6 flex-row items-center bg-white/10 rounded-2xl p-4">
              <View className="w-12 h-12 rounded-xl bg-white/20 items-center justify-center mr-4">
                <Ionicons name="shield-checkmark" size={28} color="green" />
              </View>
              <View className="flex-1">
                <Text className="text-green-900 font-bold">
                  {garage.is_open ? '✅ Open Now' : '❌ Closed Now'}
                  {garage.estimated_time && ` • ${garage.estimated_time}`}
                </Text>
                <Text className="textgreen-900 text-sm">
                  ⭐ {parseFloat(garage.rating).toFixed(1)}/5 ({garage.rating_count} reviews)
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <EmergencyContactCard />
      </Animated.View>

      {/* Contact Methods */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        className="px-5 -mt-8 mb-6"
      >
        <View className="flex-row py-2">
          {contactMethods.map((method, index) => (
            <ContactMethodCard key={method.id} method={method} index={index} />
          ))}
        </View>
      </ScrollView>

      {/* Main Content */}
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Contact Form */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: formSlideAnim }],
          }}
          className={`rounded-3xl overflow-hidden ${colors.shadow} mb-8`}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.15,
            shadowRadius: 30,
            elevation: 20,
          }}
        >
          <View className={`${colors.card} overflow-hidden rounded-3xl`}>
            {/* Form Header */}
            <View className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-xl bg-white/20 items-center justify-center mr-4">
                  <Feather name="send" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-green-900 text-2xl font-bold">Send Message</Text>
                  <Text className="text-green-900 text-sm mt-1">
                    We`ll respond within 24 hours
                  </Text>
                </View>
              </View>
            </View>

            {/* Form Content */}
            <View className="p-6">
              {/* Name & Email Row */}
              <View className="flex-row mb-5 space-x-4">
                <View className="flex-1">
                  <Text className={`font-semibold mb-2 ${colors.text.primary}`}>
                    Full Name *
                  </Text>
                  <TextInput
                    className={`${colors.input} rounded-xl px-4 py-4 ${colors.text.primary} border ${colors.cardBorder}`}
                    placeholder="John Doe"
                    placeholderTextColor={colors.placeholder}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
                <View className="flex-1">
                  <Text className={`font-semibold mb-2 ${colors.text.primary}`}>
                    Email *
                  </Text>
                  <TextInput
                    className={`${colors.input} rounded-xl px-4 py-4 ${colors.text.primary} border ${colors.cardBorder}`}
                    placeholder="john@example.com"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              {/* Category Selection */}
              <View className="mb-6">
                <Text className={`font-semibold mb-3 ${colors.text.primary}`}>
                  What do you need help with? *
                </Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  className="pb-2"
                >
                  <View className="flex-row space-x-3">
                    {categories.map((cat) => (
                      <CategoryPill 
                        key={cat.id} 
                        categoryItem={cat} 
                        isSelected={category === cat.name}
                      />
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Message */}
              <View className="mb-8">
                <Text className={`font-semibold mb-2 ${colors.text.primary}`}>
                  Message *
                </Text>
                <TextInput
                  className={`${colors.input} rounded-2xl px-4 py-4 ${colors.text.primary} border ${colors.cardBorder} min-h-[150px]`}
                  placeholder="Describe your issue or inquiry..."
                  placeholderTextColor={colors.placeholder}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  value={message}
                  onChangeText={setMessage}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                className={`py-5 rounded-xl items-center shadow-xl active:scale-95 ${
                  isSubmitting 
                    ? 'bg-gradient-to-r from-gray-400 to-gray-500' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                }`}
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={{
                  shadowColor: '#3B82F6',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 12,
                }}
              >
                {isSubmitting ? (
                  <View className="flex-row items-center">
                    <Animated.View
                      style={{
                        transform: [{ rotate: rotateInterpolate }],
                      }}
                    >
                      <Ionicons name="refresh" size={24} color="white" />
                    </Animated.View>
                    <Text className="text-white font-bold text-lg ml-3">Sending...</Text>
                  </View>
                ) : (
                  <View className="flex-row items-center">
                    <Ionicons name="send" size={24} color="white" />
                    <Text className="text-white font-bold text-lg ml-3">Send Message Now</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* FAQ Section */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className={`text-3xl font-black ${colors.text.primary}`}>
                📚 FAQ Center
              </Text>
              <Text className={`text-sm ${colors.text.secondary} mt-1`}>
                Quick answers to common questions
              </Text>
            </View>
            <TouchableOpacity className="flex-row items-center">
              <Text className="text-blue-500 font-bold mr-2">View All</Text>
              <MaterialIcons name="arrow-forward-ios" size={16} color="#3b82f6" />
            </TouchableOpacity>
          </View>
          
          {faqItems.map((item, index) => (
            <FAQItem key={index} item={item} index={index} />
          ))}
        </View>

        {/* Office Hours & Location */}
        <View className={`rounded-3xl overflow-hidden ${colors.card} ${colors.shadow} mb-10`}>
          <View className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6">
            <Text className="text-white text-2xl font-bold">📍 Visit Our Workshop</Text>
            <Text className="text-white/90 mt-2">
              {garage.address}
            </Text>
            {garage.city && (
              <Text className="text-white/80 text-sm mt-1">
                {garage.city}
              </Text>
            )}
          </View>
          
          <View className="p-6">
            {/* Opening Hours from API */}
            {garage.opening_hours && (
              <View className="space-y-5 mb-6">
                <Text className={`text-lg font-bold ${colors.text.primary} mb-4`}>
                  Opening Hours
                </Text>
                {Object.entries(garage.opening_hours).map(([day, hours]) => (
                  <View key={day} className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 items-center justify-center mr-3">
                        <Text className="text-xs font-bold text-blue-600">
                          {day.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text className={`font-medium ${colors.text.primary}`}>
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </Text>
                    </View>
                    <Text className={
                      hours === 'Closed' 
                        ? 'text-red-500 font-medium' 
                        : colors.text.secondary
                    }>
                      {hours}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            
            <TouchableOpacity
              className="mt-8 bg-gradient-to-r from-emerald-500 to-teal-500 py-4 rounded-xl items-center active:scale-95"
              onPress={() => {
                if (garage.address) {
                  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(garage.address)}`;
                  Linking.openURL(url).catch(() => {
                    Linking.openURL('https://maps.google.com').catch(console.error);
                  });
                } else {
                  Alert.alert('Location Unavailable', 'Address information is not available');
                }
              }}
            >
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="google-maps" size={24} color="white" />
                <Text className="text-white font-bold text-lg ml-3">Open in Maps</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Spacer */}
        <View className="h-20" />
      </ScrollView>

      {/* Bottom Emergency Banner */}
      <View className={`absolute bottom-0 left-0 right-0 p-5 ${colors.card} border-t ${colors.cardBorder}`}>
        <View className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-5">
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-xl bg-white/20 items-center justify-center mr-4">
              <MaterialCommunityIcons name="car-emergency" size={28} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-bold">🚨 Emergency Roadside Assistance</Text>
              <Text className="text-white/90 text-sm">
                {garage.phone ? `Call: ${garage.phone}` : 'Available 24/7 • Immediate Response'}
              </Text>
            </View>
            <TouchableOpacity
              className="bg-white px-6 py-3 rounded-full active:scale-95"
              onPress={handleEmergencyCall}
            >
              <Text className="text-red-600 font-bold">CALL NOW</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}