// app/register/contact.tsx - ContactScreen.tsx
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Mail, Phone } from 'lucide-react-native';
import React, { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContactDetailsData, registerApi } from '../../lib/api/registerApi';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ContactScreen() {
  const rawParams = useLocalSearchParams();
  const params = rawParams as Record<string, string | undefined>;
  
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Refs for input fields and scrollview
  const emailInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Keyboard listeners
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate phone number (basic validation)
  const isValidPhone = (phone: string): boolean => {
    // Basic phone validation - at least 10 digits
    const cleanedPhone = phone.replace(/\D/g, '');
    return cleanedPhone.length >= 10;
  };

  // Scroll to input when focused
  const handleInputFocus = (inputName: 'email' | 'phone') => {
    if (scrollViewRef.current) {
      // Scroll based on which input is focused
      const scrollPosition = inputName === 'email' ? 100 : 150;
      scrollViewRef.current.scrollTo({ y: scrollPosition, animated: true });
    }
  };

  const handleNext = async () => {
    // Dismiss keyboard first
    Keyboard.dismiss();

    // Validation
    if (!formData.email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email address');
      emailInputRef.current?.focus();
      return;
    }

    if (!isValidEmail(formData.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      emailInputRef.current?.focus();
      return;
    }

    if (!formData.phone.trim()) {
      Alert.alert('Validation Error', 'Please enter your phone number');
      phoneInputRef.current?.focus();
      return;
    }

    if (!isValidPhone(formData.phone)) {
      Alert.alert('Validation Error', 'Please enter a valid phone number (at least 10 digits)');
      phoneInputRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      const requestData: ContactDetailsData = {
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      };

      console.log('📤 Submitting contact details:', requestData);
      
      const response = await registerApi.submitContactDetails(requestData);
      
      console.log('📥 Contact details response:', response);

      if (response.success) {
        // Navigate to LOCATION (Step 3)
        const navigationParams: Record<string, string> = {};
        
        // Copy all existing params
        Object.keys(params).forEach(key => {
          if (params[key]) {
            navigationParams[key] = params[key] as string;
          }
        });
        
        // Add new data
        navigationParams.email = formData.email;
        navigationParams.phone = formData.phone;
        
        // Add user_id from response if available
        if (response.user_id) {
          navigationParams.user_id = response.user_id;
        }

        router.push({
          pathname: '/register/location',
          params: navigationParams,
        });
      } else {
        Alert.alert(
          'Error',
          response.error || 'Failed to save contact details'
        );
      }
    } catch (error: unknown) {
      console.error('❌ Contact details submission error:', error);
      
      let errorMessage = 'Failed to save contact details';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (!loading) {
      Keyboard.dismiss();
      router.back();
    }
  };

  const handleEmailSubmit = () => {
    phoneInputRef.current?.focus();
  };

  const handlePhoneSubmit = () => {
    Keyboard.dismiss();
  };

  const isFormValid = formData.email.trim() !== '' && formData.phone.trim() !== '';

  // Calculate dynamic padding based on keyboard
  const buttonPadding = keyboardVisible ? Math.max(keyboardHeight - 20, 0) : 0;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView className="flex-1 bg-gray-900">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
          className="flex-1"
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{ 
              flexGrow: 1,
              minHeight: SCREEN_HEIGHT,
              paddingBottom: buttonPadding,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Header */}
            <View className="px-6 pt-6">
              <View className="flex-row items-center mb-8">
                <TouchableOpacity
                  onPress={handleBack}
                  className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center mr-4"
                  disabled={loading}
                >
                  <ArrowLeft size={20} color="#60A5FA" />
                </TouchableOpacity>
                <View>
                  <Text className="text-2xl font-bold text-white">Create Account</Text>
                  <Text className="text-gray-400 text-sm">Step 2 of 5: Contact Details</Text>
                </View>
              </View>

              {/* Progress Indicator */}
              <View className="flex-row mb-10">
                {[1, 2, 3, 4, 5].map((step) => (
                  <View key={step} className="items-center" style={{ width: '20%' }}>
                    <View
                      className={`w-8 h-8 rounded-full items-center justify-center ${
                        step <= 2 ? 'bg-blue-500' : 'bg-gray-800 border border-gray-700'
                      }`}
                    >
                      <Text
                        className={`font-semibold ${
                          step <= 2 ? 'text-white' : 'text-gray-400'
                        }`}
                      >
                        {step === 4 ? 'OTP' : step}
                      </Text>
                    </View>
                    {step < 5 && (
                      <View
                        className={`h-1 w-full mt-4 ${
                          step < 2 ? 'bg-blue-500' : 'bg-gray-800'
                        }`}
                      />
                    )}
                  </View>
                ))}
              </View>
            </View>

            {/* Form */}
            <View className="px-6 flex-1">
              <Text className="text-white text-xl font-semibold mb-2">
                How can we reach you?
              </Text>
              <Text className="text-gray-400 text-sm mb-8">
                We`ll use this to verify your account and send important updates
              </Text>

              {/* Email Input */}
              <View className="mb-6">
                <Text className="text-gray-300 text-sm font-medium mb-2">
                  Email Address
                </Text>
                <View className="flex-row items-center bg-gray-800 rounded-xl px-4 py-4 border border-gray-700">
                  <Mail size={18} color="#9CA3AF" />
                  <TextInput
                    ref={emailInputRef}
                    className="flex-1 ml-3 text-white text-base"
                    placeholder="john.doe@example.com"
                    placeholderTextColor="#6B7280"
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    returnKeyType="next"
                    onSubmitEditing={handleEmailSubmit}
                    blurOnSubmit={false}
                    onFocus={() => handleInputFocus('email')}
                  />
                </View>
                {formData.email && !isValidEmail(formData.email) && (
                  <Text className="text-red-400 text-xs mt-1">
                    Please enter a valid email address
                  </Text>
                )}
              </View>

              {/* Phone Input */}
              <View className="mb-8">
                <Text className="text-gray-300 text-sm font-medium mb-2">
                  Phone Number
                </Text>
                <View className="flex-row items-center bg-gray-800 rounded-xl px-4 py-4 border border-gray-700">
                  <Phone size={18} color="#9CA3AF" />
                  <TextInput
                    ref={phoneInputRef}
                    className="flex-1 ml-3 text-white text-base"
                    placeholder="(123) 456-7890"
                    placeholderTextColor="#6B7280"
                    value={formData.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                    keyboardType="phone-pad"
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={handlePhoneSubmit}
                    onFocus={() => handleInputFocus('phone')}
                  />
                </View>
                {formData.phone && !isValidPhone(formData.phone) && (
                  <Text className="text-red-400 text-xs mt-1">
                    Please enter a valid phone number (at least 10 digits)
                  </Text>
                )}
                <Text className="text-gray-400 text-xs mt-1">
                  Include country code if outside the US
                </Text>
              </View>

              {/* Privacy Note */}
              <View className="mt-8 p-4 bg-gray-800/50 rounded-xl">
                <Text className="text-gray-300 text-sm mb-1">
                  🔒 Your information is secure
                </Text>
                <Text className="text-gray-400 text-xs">
                  We use encryption to protect your personal data. Your email and phone will only be used for account verification and important notifications.
                </Text>
              </View>

              {/* Dynamic spacer based on keyboard */}
              <View className="flex-1 min-h-[150]" />
            </View>

            {/* Continue Button - Fixed with dynamic padding */}
            <View 
              className="px-6 pt-6 border-t border-gray-800 bg-gray-900"
              style={{
                paddingBottom: Platform.OS === 'ios' 
                  ? Math.max(keyboardHeight + 20, 30) 
                  : 30
              }}
            >
              <TouchableOpacity
                className={`rounded-xl py-5 items-center justify-center ${
                  loading || !isFormValid
                    ? 'bg-blue-800/50'
                    : 'bg-blue-600'
                }`}
                onPress={handleNext}
                disabled={loading || !isFormValid}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Text className="text-white font-bold text-lg">
                      Continue
                    </Text>
                    <Text className="text-gray-300 text-sm mt-1">
                      Step 2 of 5 - Next: Location Details
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Back Button for accessibility */}
              <TouchableOpacity
                onPress={handleBack}
                className="mt-4 py-4 items-center"
                disabled={loading}
              >
                <Text className="text-gray-400 text-base">
                  Back to Personal Info
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}