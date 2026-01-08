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
  Animated,
  Dimensions,
} from 'react-native';
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function HelpScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const { theme } = useTheme();
  const navigation = useNavigation();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const searchSlideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(searchSlideAnim, {
        toValue: 0,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Theme colors
  const themeColors = {
    dark: {
      bg: 'bg-gray-900',
      card: 'bg-gray-800',
      input: 'bg-gray-700',
      text: {
        primary: 'text-gray-100',
        secondary: 'text-gray-400',
        tertiary: 'text-gray-500',
      },
      border: 'border-gray-700',
      shadow: 'shadow-black/50',
    },
    light: {
      bg: 'bg-gradient-to-b from-blue-50/20 via-white to-white',
      card: 'bg-white',
      input: 'bg-gray-100',
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        tertiary: 'text-gray-500',
      },
      border: 'border-gray-200',
      shadow: 'shadow-gray-400/20',
    },
  };

  const colors = themeColors[theme];

  // Password Reset Steps Data
  const passwordResetSteps = [
    {
      id: 1,
      step: "Step 1",
      title: "Tap 'Forgot Password'",
      description: "On the login screen, tap the 'Forgot Password?' link below the password field.",
      icon: "account-key",
      color: "#8B5CF6",
      gradient: ['#8B5CF6', '#EC4899'],
      tip: "Make sure you're using the email registered with your account"
    },
    {
      id: 2,
      step: "Step 2",
      title: "Enter Your Email",
      description: "Enter the email address associated with your QuickFix Automotive account.",
      icon: "email-outline",
      color: "#3B82F6",
      gradient: ['#3B82F6', '#06B6D4'],
      tip: "Check for typos in your email address"
    },
    {
      id: 3,
      step: "Step 3",
      title: "Check Your Inbox",
      description: `Open your email inbox (check spam/junk folder too) for a verification email from qfix910@gmail.com.`,
      icon: "email-check",
      color: "#10B981",
      gradient: ['#10B981', '#34D399'],
      tip: "The email contains a 6-digit OTP code valid for 10 minutes"
    },
    {
      id: 4,
      step: "Step 4",
      title: "Enter OTP Code",
      description: "Return to the app and enter the 6-digit OTP code from the email.",
      icon: "numeric",
      color: "#F59E0B",
      gradient: ['#F59E0B', '#EF4444'],
      tip: "Codes are case-sensitive and time-limited"
    },
    {
      id: 5,
      step: "Step 5",
      title: "Create New Password",
      description: "Once verified, create a strong new password and confirm it.",
      icon: "shield-check",
      color: "#6366F1",
      gradient: ['#6366F1', '#8B5CF6'],
      tip: "Use at least 8 characters with letters, numbers, and symbols"
    },
    {
      id: 6,
      step: "Step 6",
      title: "Login With New Password",
      description: "Return to login screen and use your email with the new password to access your account.",
      icon: "login",
      color: "#DC2626",
      gradient: ['#DC2626', '#F97316'],
      tip: "You're now ready to book services with your new credentials"
    },
  ];

  // Visual flow components
  const StepCard = ({ step, index, totalSteps }: { step: any; index: number; totalSteps: number }) => {
    const isEven = index % 2 === 0;
    
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
        className="mb-8"
      >
        {/* Connection Line (except for last step) */}
        {index < totalSteps - 1 && (
          <View className={`absolute left-6 top-20 bottom-0 w-0.5 ${isEven ? 'bg-purple-300' : 'bg-blue-300'}`} />
        )}
        
        {/* Step Card */}
        <View className="flex-row items-start">
          {/* Step Number Circle */}
          <View 
            className="w-12 h-12 rounded-full items-center justify-center z-10"
            style={{
              backgroundColor: step.color,
              shadowColor: step.color,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <MaterialCommunityIcons name={step.icon as any} size={24} color="white" />
          </View>
          
          {/* Step Content */}
          <View 
            className={`flex-1 ml-4 rounded-2xl p-5 ${colors.card}`}
            style={{
              shadowColor: step.color,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
              elevation: 6,
              borderLeftWidth: 4,
              borderLeftColor: step.color,
            }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className={`px-3 py-1 rounded-full`} style={{ backgroundColor: `${step.color}20` }}>
                  <Text className="font-bold text-sm" style={{ color: step.color }}>
                    {step.step}
                  </Text>
                </View>
                <Text className={`text-lg font-bold ml-3 ${colors.text.primary}`}>
                  {step.title}
                </Text>
              </View>
              <View className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 px-3 py-1 rounded-full">
                <Text className="text-blue-600 dark:text-blue-400 text-sm font-semibold">
                  {index + 1}/{totalSteps}
                </Text>
              </View>
            </View>
            
            <Text className={`leading-relaxed mb-4 ${colors.text.secondary}`}>
              {step.description}
            </Text>
            
            {/* Pro Tip */}
            <View className={`bg-gradient-to-r ${isEven ? 'from-purple-50 to-pink-50' : 'from-blue-50 to-cyan-50'} dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-4 border-l-4`} style={{ borderLeftColor: step.color }}>
              <View className="flex-row items-center mb-2">
                <Ionicons name="bulb-outline" size={20} color={step.color} />
                <Text className={`ml-2 font-bold ${colors.text.primary}`}>
                  Pro Tip:
                </Text>
              </View>
              <Text className={`text-sm ${colors.text.secondary}`}>
                {step.tip}
              </Text>
            </View>
            
            {/* Visual Indicators */}
            {index === 2 && (
              <View className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4">
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="email-fast" size={24} color="#10B981" />
                  <Text className={`ml-3 flex-1 ${colors.text.primary}`}>
                    <Text className="font-bold">Contact Email:</Text> qfix910@gmail.com
                  </Text>
                  <TouchableOpacity 
                    className="bg-green-500 px-4 py-2 rounded-lg"
                    onPress={() => Linking.openURL('mailto:qfix910@gmail.com?subject=QuickFix Password Reset Help')}
                  >
                    <Text className="text-white font-semibold">Contact</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  // Timeline flow visualization
  const FlowTimeline = () => {
    return (
      <Animated.View 
        style={{ opacity: fadeAnim }}
        className="mb-8"
      >
        <View className={`rounded-2xl overflow-hidden ${colors.card} p-6`}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          <View className="flex-row items-center mb-6">
            <MaterialCommunityIcons name="timeline-clock-outline" size={28} color="#8B5CF6" />
            <Text className={`text-xl font-bold ml-3 ${colors.text.primary}`}>
              Password Reset Timeline
            </Text>
          </View>
          
          <View className="space-y-4">
            {[
              { time: "0-2 min", action: "Request OTP", icon: "send", color: "#8B5CF6" },
              { time: "1-3 min", action: "Receive Email", icon: "email-receive", color: "#3B82F6" },
              { time: "10 min", action: "OTP Valid Period", icon: "clock-alert", color: "#F59E0B" },
              { time: "2 min", action: "Create New Password", icon: "lock-reset", color: "#10B981" },
              { time: "Instant", action: "Account Ready", icon: "check-circle", color: "#6366F1" },
            ].map((item, index) => (
              <View key={index} className="flex-row items-center py-3">
                <View className="w-20">
                  <Text className={`font-bold ${colors.text.primary}`} style={{ color: item.color }}>
                    {item.time}
                  </Text>
                </View>
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-4`} style={{ backgroundColor: `${item.color}20` }}>
                  <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text className={`flex-1 ${colors.text.primary}`}>
                  {item.action}
                </Text>
                {index < 4 && (
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.text.secondary} />
                )}
              </View>
            ))}
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className={`flex-1 ${colors.bg}`}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
        className="relative"
      >
        <View className="h-56 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-b-3xl">
          <View className="p-5 pt-10">
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-1">
                <Text className="text-green-900 text-4xl font-black">Help Center</Text>
                <Text className="text-green-900 text-lg mt-2">
                  Password Reset Guide
                </Text>
              </View>
              <TouchableOpacity 
                className="bg-white/20 p-3 rounded-full active:scale-95"
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <Animated.View style={{ transform: [{ translateX: searchSlideAnim }] }}>
              <View className="relative">
                <TextInput
                  className={`${colors.card} rounded-2xl px-5 py-4 pl-14 ${colors.text.primary} shadow-2xl`}
                  placeholder="Search help articles..."
                  placeholderTextColor={colors.text.tertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <View className="absolute left-5 top-4">
                  <Ionicons name="search" size={24} color={colors.text.tertiary} />
                </View>
              </View>
            </Animated.View>
          </View>
        </View>
      </Animated.View>

      {/* Main Content */}
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Guide Header */}
        <Animated.View
          style={{ opacity: fadeAnim }}
          className="mt-8 mb-10"
        >
          <View className={`rounded-2xl overflow-hidden ${colors.card} p-6`}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.1,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <View className="flex-row items-center mb-6">
              <View className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 items-center justify-center mr-4">
                <MaterialCommunityIcons name="lock-reset" size={32} color="white" />
              </View>
              <View className="flex-1">
                <Text className={`text-2xl font-black ${colors.text.primary}`}>
                  Forgot Password Guide
                </Text>
                <Text className={`${colors.text.secondary} mt-2`}>
                  Follow these 6 simple steps to reset your password and regain access to your QuickFix Automotive account
                </Text>
              </View>
            </View>
            
            <View className="flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4">
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="shield-check" size={24} color="#10B981" />
                <Text className={`ml-3 font-bold ${colors.text.primary}`}>
                  Secure & Verified Process
                </Text>
              </View>
              <View className="bg-green-500 px-4 py-2 rounded-lg">
                <Text className="text-white font-bold">6 STEPS</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Step-by-Step Guide */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-6">
            <Text className={`text-2xl font-black ${colors.text.primary}`}>
              🔄 Step-by-Step Process
            </Text>
            <View className="bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 rounded-full">
              <Text className="text-white font-bold">Easy to Follow</Text>
            </View>
          </View>
          
          {passwordResetSteps.map((step, index) => (
            <StepCard 
              key={step.id} 
              step={step} 
              index={index} 
              totalSteps={passwordResetSteps.length} 
            />
          ))}
        </View>

        {/* Timeline Visualization */}
        <FlowTimeline />

        {/* Troubleshooting Section */}
        <Animated.View 
          style={{ opacity: fadeAnim }}
          className="mb-10"
        >
          <View className={`rounded-2xl overflow-hidden ${colors.card} p-6`}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.1,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <View className="flex-row items-center mb-6">
              <MaterialCommunityIcons name="help-circle-outline" size={28} color="#F59E0B" />
              <Text className={`text-xl font-bold ml-3 ${colors.text.primary}`}>
                Common Issues & Solutions
              </Text>
            </View>
            
            <View className="space-y-4">
              {[
                {
                  problem: "Didn't receive OTP email?",
                  solution: "Check spam/junk folder. Whitelist qfix910@gmail.com. Wait 5 minutes and request again.",
                  icon: "email-alert"
                },
                {
                  problem: "OTP code expired?",
                  solution: "Request a new OTP. Codes are valid for 10 minutes only.",
                  icon: "clock-alert-outline"
                },
                {
                  problem: "Wrong email entered?",
                  solution: "Use the correct email registered with QuickFix Automotive.",
                  icon: "account-alert"
                },
                {
                  problem: "Still having issues?",
                  solution: "Contact our support team immediately at qfix910@gmail.com",
                  icon: "headset"
                },
              ].map((item, index) => (
                <TouchableOpacity
                  key={index}
                  className={`p-4 rounded-xl ${expandedFaq === index ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}
                  onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  activeOpacity={0.8}
                >
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name={item.icon as any} size={24} color="#3B82F6" />
                    <Text className={`flex-1 ml-3 font-semibold ${colors.text.primary}`}>
                      {item.problem}
                    </Text>
                    <MaterialCommunityIcons 
                      name={expandedFaq === index ? "chevron-up" : "chevron-down"} 
                      size={24} 
                      color={colors.text.secondary} 
                    />
                  </View>
                  
                  {expandedFaq === index && (
                    <View className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Text className={`${colors.text.secondary}`}>
                        {item.solution}
                      </Text>
                      {index === 3 && (
                        <TouchableOpacity 
                          className="mt-3 bg-blue-500 py-3 rounded-lg items-center"
                          onPress={() => Linking.openURL('mailto:qfix910@gmail.com?subject=Urgent Password Reset Help')}
                        >
                          <Text className="text-white font-bold">Contact Support Now</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Bottom Spacer */}
        <View className="h-20" />
      </ScrollView>

      {/* Bottom Contact Banner */}
      <View className={`absolute bottom-0 left-0 right-0 p-5 ${colors.card} border-t ${colors.border}`}>
        <View className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl p-6">
          <View className="flex-row items-center mb-4">
            <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center mr-4">
              <MaterialCommunityIcons name="email-fast" size={28} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-xl font-bold">
                Need More Help?
              </Text>
              <Text className="text-white/80 text-sm mt-1">
                Contact our support team directly
              </Text>
            </View>
          </View>
          
       
        </View>
      </View>
    </SafeAreaView>
  );
}