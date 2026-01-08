import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  
  Easing,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface Offer {
  id: number;
  title: string;
  description: string;
  discount: string;
  code: string;
  expiryDate: string;
  icon: string;
  color: string;
  gradient: string[];
  isFeatured: boolean;
  tag?: string;
  remaining?: number;
}

export default function OffersScreen() {
  const [selectedTab, setSelectedTab] = useState('all');
  const { theme } = useTheme();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for featured badge
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Slide in animation
    Animated.spring(slideAnim, {
      toValue: 1,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [pulseAnim, slideAnim]);

  // Theme-based colors
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
      input: 'bg-gray-900 border-gray-700',
      shadow: 'shadow-black/50',
    },
    light: {
      bg: 'bg-gradient-to-b from-gray-50 to-white',
      card: 'bg-white',
      cardBorder: 'border-gray-200',
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        tertiary: 'text-gray-500',
      },
      input: 'bg-gray-100 border-gray-300',
      shadow: 'shadow-gray-400/30',
    }
  };

  const colors = themeColors[theme];

  const offers: Offer[] = [
    {
      id: 1,
      title: 'FREE DELIVERY',
      description: 'Free pickup & delivery for all auto services',
      discount: 'FREE DELIVERY',
      code: 'FREESHIP',
      expiryDate: 'Limited time offer',
      icon: 'truck-fast',
      color: '#FF6B6B',
      gradient: theme === 'dark' ? ['#FF6B6B', '#FF8E53'] : ['#FF6B6B', '#FF8E53'],
      isFeatured: true,
      tag: 'POPULAR',
      remaining: 12,
    },
    {
      id: 2,
      title: 'First Service Discount',
      description: 'Get 30% off on your first auto service with free delivery',
      discount: '30% OFF',
      code: 'FIRST30',
      expiryDate: 'Expires in 7 days',
      icon: 'gift',
      color: theme === 'dark' ? '#BA68C8' : '#9C27B0',
      gradient: theme === 'dark' ? ['#BA68C8', '#F06292'] : ['#9C27B0', '#E91E63'],
      isFeatured: true,
      tag: 'NEW',
    },
    {
      id: 3,
      title: 'Weekend Special',
      description: 'Flat 25% off + free delivery this weekend',
      discount: '25% OFF',
      code: 'WEEKEND25',
      expiryDate: 'Valid this weekend only',
      icon: 'calendar-weekend',
      color: theme === 'dark' ? '#64B5F6' : '#2196F3',
      gradient: theme === 'dark' ? ['#64B5F6', '#4DD0E1'] : ['#2196F3', '#21CBF3'],
      isFeatured: true,
      remaining: 48,
    },
    {
      id: 4,
      title: 'Emergency Service',
      description: '24/7 emergency service with free delivery',
      discount: '20% OFF',
      code: 'EMERGENCY20',
      expiryDate: 'No expiry',
      icon: 'ambulance',
      color: theme === 'dark' ? '#81C784' : '#4CAF50',
      gradient: theme === 'dark' ? ['#81C784', '#AED581'] : ['#4CAF50', '#8BC34A'],
      isFeatured: false,
    },
    {
      id: 5,
      title: 'Bundle Deal',
      description: 'Oil change + car wash + free delivery',
      discount: '40% OFF',
      code: 'BUNDLE40',
      expiryDate: 'Expires in 3 days',
      icon: 'package-variant',
      color: theme === 'dark' ? '#FFB74D' : '#FF9800',
      gradient: theme === 'dark' ? ['#FFB74D', '#FF8A65'] : ['#FF9800', '#FF5722'],
      isFeatured: true,
      tag: 'HOT',
    },
    {
      id: 6,
      title: 'Loyalty Rewards',
      description: 'Every 5th service is 50% off with free delivery',
      discount: '50% OFF',
      code: 'LOYAL50',
      expiryDate: 'For members only',
      icon: 'crown',
      color: theme === 'dark' ? '#FFD54F' : '#FFC107',
      gradient: theme === 'dark' ? ['#FFD54F', '#FFB74D'] : ['#FFC107', '#FF9800'],
      isFeatured: false,
    },
  ];

  const news = [
    {
      id: 1,
      title: 'New: Contactless Service',
      description: 'Book online, we handle everything with safety protocols',
      icon: 'shield-check',
      color: theme === 'dark' ? '#64B5F6' : '#2196F3',
    },
    {
      id: 2,
      title: 'Real-time Tracking',
      description: 'Track your vehicle in real-time during service',
      icon: 'map-marker-path',
      color: theme === 'dark' ? '#81C784' : '#4CAF50',
    },
    {
      id: 3,
      title: 'Extended Warranty',
      description: 'Get 2 years extended warranty on all major repairs',
      icon: 'certificate',
      color: theme === 'dark' ? '#BA68C8' : '#9C27B0',
    },
  ];

  const tabs = [
    { id: 'all', label: 'All Offers', icon: 'apps' },
    { id: 'featured', label: 'Featured', icon: 'star' },
    { id: 'delivery', label: 'Free Delivery', icon: 'truck' },
    { id: 'expiring', label: 'Expiring', icon: 'clock' },
    { id: 'personal', label: 'For You', icon: 'account' },
  ];

  const handleOfferPress = (offerId: number) => {
    Vibration.vibrate(50);
    router.push(`/dashboard/offer/${offerId}` as any);
  };

  const copyToClipboard = (code: string) => {
    Vibration.vibrate([0, 50, 100, 50]);
    console.log('Copied to clipboard:', code);
    alert(`Code "${code}" copied to clipboard!`);
  };

  const claimOffer = (offerId: number) => {
    Vibration.vibrate(100);
    console.log('Claiming offer:', offerId);
    alert('🎉 Offer claimed successfully!');
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    scrollY.setValue(y);
  };

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const fabTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 200],
    extrapolate: 'clamp',
  });

  const renderOfferCard = (offer: Offer, index: number) => {
    const translateX = slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [100, 0],
    });

    const animatedStyle = {
      transform: [{ translateX }],
      opacity: slideAnim,
    };

    return (
      <Animated.View
        key={offer.id}
        style={animatedStyle}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleOfferPress(offer.id)}
          className="mb-6"
        >
          {/* Offer Card */}
          <View
            className={`rounded-3xl overflow-hidden border ${colors.cardBorder} ${colors.card}`}
            style={{
              shadowColor: offer.color,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 15,
            }}
          >
            {/* Top Ribbon */}
            {offer.isFeatured && (
              <Animated.View
                style={{
                  transform: [{ scale: pulseAnim }],
                  position: 'absolute',
                  top: 15,
                  right: -30,
                  zIndex: 10,
                  backgroundColor: offer.color,
                  paddingHorizontal: 40,
                  paddingVertical: 6,
                }}
              >
                <Text className="text-white font-bold text-xs" style={{ transform: [{ rotate: '45deg' }] }}>FEATURED</Text>
              </Animated.View>
            )}

            {/* Offer Tag */}
            {offer.tag && (
              <View
                className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full"
                style={{ backgroundColor: `${offer.color}20` }}
              >
                <Text
                  className="font-bold text-xs"
                  style={{ color: offer.color }}
                >
                  {offer.tag}
                </Text>
              </View>
            )}

            {/* Offer Header with Gradient */}
            <View
              className="h-40"
              style={{
                backgroundColor: offer.color,
                backgroundImage: `linear-gradient(135deg, ${offer.gradient[0]}, ${offer.gradient[1]})`,
              }}
            >
              <View className="p-6 h-full justify-between">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="text-white text-3xl font-black">
                      {offer.discount}
                    </Text>
                    <Text className="text-white/90 text-xl font-bold mt-1">
                      {offer.title}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name={offer.icon as any}
                    size={50}
                    color="white"
                  />
                </View>

                {/* Remaining counter */}
                {offer.remaining && (
                  <View className="flex-row items-center bg-white/20 rounded-full px-4 py-2 self-start">
                    <Ionicons name="time-outline" size={14} color="white" />
                    <Text className="text-white text-sm font-semibold ml-2">
                      Only {offer.remaining} left
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Offer Details */}
            <View className={`p-6 ${colors.card}`}>
              <Text className={`text-lg font-bold mb-3 ${colors.text.primary}`}>
                {offer.description}
              </Text>

              {/* Progress bar for limited offers */}
              {offer.remaining && (
                <View className="mb-4">
                  <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${(offer.remaining / 100) * 100}%`,
                        backgroundColor: offer.color,
                      }}
                    />
                  </View>
                  <Text className={`text-xs mt-1 ${colors.text.secondary}`}>
                    {offer.remaining} offers remaining
                  </Text>
                </View>
              )}

              {/* Promo Code */}
              <View className="mb-5">
                <Text className={`text-sm font-medium mb-2 ${colors.text.secondary}`}>
                  USE PROMO CODE
                </Text>
                <View className="flex-row items-center">
                  <View
                    className={`flex-1 p-4 rounded-2xl border-2 border-dashed ${colors.input}`}
                  >
                    <Text
                      className={`text-center font-mono text-2xl font-black ${colors.text.primary}`}
                    >
                      {offer.code}
                    </Text>
                  </View>
                  <TouchableOpacity
                    className="ml-4 px-6 py-4 rounded-2xl active:scale-95"
                    style={{ backgroundColor: offer.color }}
                    onPress={() => copyToClipboard(offer.code)}
                  >
                    <Ionicons name="copy" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bottom Actions */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons
                    name="time"
                    size={20}
                    color={theme === 'dark' ? '#ef4444' : '#dc2626'}
                  />
                  <Text className={`ml-2 font-bold ${colors.text.secondary}`}>
                    {offer.expiryDate}
                  </Text>
                </View>
                <TouchableOpacity
                  className="px-6 py-3 rounded-full active:scale-95"
                  style={{
                    backgroundColor: offer.color,
                    shadowColor: offer.color,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                  onPress={() => claimOffer(offer.id)}
                >
                  <Text className="text-white font-bold text-lg">
                    CLAIM OFFER
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className={`flex-1 ${colors.bg}`}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="#7C3AED" />

      {/* Animated Header */}
      <Animated.View
        style={{
          transform: [{ translateY: headerTranslateY }],
          opacity: headerOpacity,
        }}
        className="absolute top-0 left-0 right-0 z-50"
      >
        <View className="h-48 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 rounded-b-3xl">
          <View className="p-5 pt-10">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-green-900 text-4xl font-black">
                  Special Offers
                </Text>
                <Text className="text-orange-400 text-lg mt-1">
                  Exclusive deals just for you
                </Text>
              </View>
              <TouchableOpacity
                className="bg-white/20 p-3 rounded-full active:scale-95"
                onPress={() => Vibration.vibrate(50)}
              >
                <Ionicons name="notifications" size={28} color="green" />
              </TouchableOpacity>
            </View>

            {/* Stats */}
            <View className="flex-row justify-between items-center mt-6 bg-white/10 rounded-2xl p-4">
              <View className="items-center">
                <Text className="text-green-900 text-2xl font-black">
                  {offers.length}
                </Text>
                <Text className="text-green-900 text-sm">Total Offers</Text>
              </View>
              <View className="h-8 w-px bg-white/30" />
              <View className="items-center">
                <Text className="text-green-900 text-2xl font-black">3</Text>
                <Text className="text-green-900 text-sm">Free Delivery</Text>
              </View>
              <View className="h-8 w-px bg-white/30" />
              <View className="items-center">
                <Text className="text-green-900 text-2xl font-black">
                  {offers.filter(o => o.isFeatured).length}
                </Text>
                <Text className="text-green-900 text-sm">Featured</Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View className="pt-48 px-5">
          {/* Search Bar */}
          <View className={`mb-8 ${colors.card} rounded-2xl p-4 shadow-lg ${colors.shadow}`}>
            <View className="flex-row items-center">
              <Ionicons name="search" size={24} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              <Text className={`ml-3 flex-1 ${colors.text.secondary}`}>
                Search offers...
              </Text>
              <TouchableOpacity className="p-2">
                <Ionicons name="options" size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* News Section */}
          <View className="mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className={`text-2xl font-black ${colors.text.primary}`}>
                📢 Latest News
              </Text>
              <TouchableOpacity>
                <Text className="text-purple-600 font-bold">View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
              <View className="flex-row space-x-4">
                {news.map((item, index) => (
                  <Animated.View
                    key={item.id}
                    style={{
                      transform: [
                        {
                          translateX: slideAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [50 * (index + 1), 0],
                          }),
                        },
                      ],
                      opacity: slideAnim,
                    }}
                  >
                    <View
                      className={`w-64 rounded-2xl p-5 ${colors.card} border ${colors.cardBorder} shadow-lg ${colors.shadow}`}
                    >
                      <View className="flex-row items-center mb-3">
                        <View
                          className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                          style={{ backgroundColor: `${item.color}20` }}
                        >
                          <MaterialCommunityIcons
                            name={item.icon as any}
                            size={24}
                            color={item.color}
                          />
                        </View>
                        <Text className={`text-lg font-bold flex-1 ${colors.text.primary}`}>
                          {item.title}
                        </Text>
                      </View>
                      <Text className={colors.text.secondary}>
                        {item.description}
                      </Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
          >
            <View className="flex-row space-x-3">
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  className={`px-6 py-3 rounded-xl flex-row items-center space-x-2 active:scale-95 ${
                    selectedTab === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg'
                      : `${colors.card} shadow ${colors.shadow}`
                  }`}
                  onPress={() => {
                    Vibration.vibrate(50);
                    setSelectedTab(tab.id);
                  }}
                >
                  <MaterialCommunityIcons
                    name={tab.icon as any}
                    size={20}
                    color={selectedTab === tab.id ? 'white' : theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                  />
                  <Text
                    className={`font-bold ${
                      selectedTab === tab.id
                        ? 'text-white'
                        : colors.text.primary
                    }`}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Free Delivery Banner */}
          <View
            className="mb-8 rounded-3xl overflow-hidden"
            style={{
              shadowColor: '#FF6B6B',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 15,
            }}
          >
            <View
              className="p-6"
              style={{
                backgroundColor: '#FF6B6B',
                backgroundImage: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
              }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white text-3xl font-black">
                    🚚 FREE DELIVERY
                  </Text>
                  <Text className="text-white/90 text-xl font-bold mt-2">
                    On All Auto Services
                  </Text>
                  <Text className="text-white/80 mt-3">
                    Book any service and enjoy free pickup & delivery. No hidden charges!
                  </Text>
                  <View className="flex-row items-center mt-4 space-x-4">
                    <View className="flex-row items-center">
                      <Ionicons name="checkmark-circle" size={20} color="white" />
                      <Text className="text-white ml-2">Same Day Service</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="checkmark-circle" size={20} color="white" />
                      <Text className="text-white ml-2">Free Pickup</Text>
                    </View>
                  </View>
                </View>
                <FontAwesome5 name="shipping-fast" size={60} color="white" />
              </View>
              <TouchableOpacity
                className="mt-6 bg-white px-6 py-4 rounded-full self-start active:scale-95"
              >
                <Text className="text-black font-bold text-lg">
                  BOOK NOW
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Offers List */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className={`text-2xl font-black ${colors.text.primary}`}>
              🎁 Available Offers
            </Text>
            <TouchableOpacity className="flex-row items-center">
              <Text className="text-purple-600 font-bold mr-2">Sort By</Text>
              <Ionicons name="chevron-down" size={20} color="#7C3AED" />
            </TouchableOpacity>
          </View>
          
          {offers.map((offer, index) => renderOfferCard(offer, index))}

          {/* Special Offer Banner */}
          <View className={`mb-8 rounded-3xl p-6 ${colors.card} border ${colors.cardBorder} shadow-xl ${colors.shadow}`}>
            <View className="flex-row items-center">
              <View className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 items-center justify-center mr-4">
                <Ionicons name="flash" size={30} color="white" />
              </View>
              <View className="flex-1">
                <Text className={`text-xl font-bold ${colors.text.primary}`}>
                  Flash Sale Today Only!
                </Text>
                <Text className={`mt-1 ${colors.text.secondary}`}>
                  50% off on all premium services with free delivery
                </Text>
              </View>
            </View>
            <TouchableOpacity className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-full self-start active:scale-95">
              <Text className="text-white font-bold">GRAB DEAL →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Spacer */}
        <View className="h-40" />
      </ScrollView>

      {/* Floating Action Button */}
      <Animated.View
        style={{
          transform: [{ translateY: fabTranslateY }],
        }}
        className="absolute bottom-6 right-6 z-40"
      >
        <TouchableOpacity
          className="w-16 h-16 rounded-full items-center justify-center shadow-2xl active:scale-95"
          style={{
            backgroundColor: '#7C3AED',
            shadowColor: '#7C3AED',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 10,
          }}
          onPress={() => {
            Vibration.vibrate(100);
            alert('🎉 Sharing all offers with friends!');
          }}
        >
          <Ionicons name="share-social" size={28} color="white" />
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom Banner */}
      <View
        className={`absolute bottom-0 left-0 right-0 p-5 ${colors.card} border-t ${colors.cardBorder}`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -5 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 10,
        }}
      >
        <View className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-5">
          <View className="flex-row items-center">
            <Ionicons name="notifications-circle" size={40} color="white" />
            <View className="ml-4 flex-1">
              <Text className="text-white text-lg font-bold">
                Don`t miss out!
              </Text>
              <Text className="text-white/80 text-sm mt-1">
                Turn on notifications for exclusive offers
              </Text>
            </View>
          </View>
          <TouchableOpacity className="mt-4 bg-white/20 px-6 py-3 rounded-full self-center active:scale-95">
            <Text className="text-white font-bold">Enable Notifications</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}