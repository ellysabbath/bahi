// app/register/location.tsx
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin } from 'lucide-react-native';
import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LocationData, registerApi } from '../../lib/api/registerApi';

export default function LocationScreen() {
  // Use unknown type for params and cast as needed
  const rawParams = useLocalSearchParams();
  const params = rawParams as Record<string, string | undefined>;
  
  const [formData, setFormData] = useState({
    city: '',
    state: '',
  });
  const [loading, setLoading] = useState(false);
  
  // Refs for input fields
  const cityInputRef = useRef<TextInput>(null);
  const stateInputRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
    // Dismiss keyboard first
    Keyboard.dismiss();

    // Validate inputs
    if (!formData.city.trim()) {
      Alert.alert('Validation Error', 'Please enter your city');
      cityInputRef.current?.focus();
      return;
    }

    if (!formData.state.trim()) {
      Alert.alert('Validation Error', 'Please enter your state/province');
      stateInputRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      const requestData: LocationData = {
        city: formData.city.trim(),
        state: formData.state.trim(),
      };

      // Add user_id if available
      const userId = params.user_id as string | undefined;
      if (userId) {
        requestData.user_id = userId;
      }

      console.log('📍 Submitting location data...');
      
      const response = await registerApi.submitLocation(requestData);
      
      if (response.success) {
        console.log('✅ Location saved successfully');
        
        // Navigate to verify-otp screen (Step 4)
        const navigationParams: Record<string, string> = {};
        
        // Copy all existing params
        Object.keys(params).forEach(key => {
          if (params[key]) {
            navigationParams[key] = params[key] as string;
          }
        });
        
        // Add new data
        navigationParams.city = formData.city;
        navigationParams.state = formData.state;
        navigationParams.purpose = 'email_verification';
        
        // Use user_id from response or params
        const newUserId = response.user_id || userId;
        if (newUserId) {
          navigationParams.user_id = newUserId;
        }

        router.push({
          pathname: '/register/verify-otp',
          params: navigationParams,
        });
      } else {
        Alert.alert('Error', response.error || 'Failed to save location');
      }
    } catch (error: unknown) {
      console.error('❌ Location submission error:', error);
      
      let errorMessage = 'Failed to save location';
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

  const isFormValid = formData.city.trim() !== '' && formData.state.trim() !== '';

  const handleCitySubmit = () => {
    stateInputRef.current?.focus();
  };

  const handleStateSubmit = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView className="flex-1 bg-gray-900">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          className="flex-1"
        >
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
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
                  <Text className="text-gray-400 text-sm">Step 3 of 5: Location</Text>
                </View>
              </View>

              {/* Progress Indicator */}
              <View className="flex-row mb-10">
                {[1, 2, 3, 4, 5].map((step) => (
                  <View key={step} className="items-center" style={{ width: '20%' }}>
                    <View className={`w-8 h-8 rounded-full items-center justify-center ${
                      step <= 3 ? 'bg-blue-500' : 'bg-gray-800 border border-gray-700'
                    }`}>
                      <Text className={`font-semibold ${
                        step <= 3 ? 'text-white' : 'text-gray-400'
                      }`}>
                        {step === 4 ? 'OTP' : step}
                      </Text>
                    </View>
                    {step < 5 && (
                      <View className={`h-1 w-full mt-4 ${
                        step < 3 ? 'bg-blue-500' : 'bg-gray-800'
                      }`} />
                    )}
                  </View>
                ))}
              </View>
            </View>

            {/* Form Section */}
            <View className="px-6 flex-1">
              <Text className="text-white text-xl font-semibold mb-8">
                Where are you located?
              </Text>

              {/* City Field */}
              <View className="mb-6">
                <Text className="text-gray-300 text-sm font-medium mb-2">City</Text>
                <View className="flex-row items-center bg-gray-800 rounded-xl px-4 py-4 border border-gray-700">
                  <MapPin size={18} color="#9CA3AF" />
                  <TextInput
                    ref={cityInputRef}
                    className="flex-1 ml-3 text-white text-base"
                    placeholder="Enter your city"
                    placeholderTextColor="#6B7280"
                    value={formData.city}
                    onChangeText={(text) => setFormData({ ...formData, city: text })}
                    autoCapitalize="words"
                    editable={!loading}
                    returnKeyType="next"
                    onSubmitEditing={handleCitySubmit}
                    blurOnSubmit={false}
                  />
                </View>
              </View>

              {/* State Field */}
              <View className="mb-8">
                <Text className="text-gray-300 text-sm font-medium mb-2">State/Province</Text>
                <View className="flex-row items-center bg-gray-800 rounded-xl px-4 py-4 border border-gray-700">
                  <MapPin size={18} color="#9CA3AF" />
                  <TextInput
                    ref={stateInputRef}
                    className="flex-1 ml-3 text-white text-base"
                    placeholder="Enter your state or province"
                    placeholderTextColor="#6B7280"
                    value={formData.state}
                    onChangeText={(text) => setFormData({ ...formData, state: text })}
                    autoCapitalize="words"
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={handleStateSubmit}
                  />
                </View>
              </View>

              {/* Next Step Info */}
              <View className="mt-8 p-4 bg-blue-900/20 rounded-xl border border-blue-800/30">
                <Text className="text-blue-300 text-sm font-medium mb-1">
                  📧 Next: Email Verification
                </Text>
                <Text className="text-gray-400 text-xs">
                  After saving your location, you`ll verify your email address with a one-time code.
                </Text>
              </View>

              {/* Spacer to ensure form doesn't overlap with buttons */}
              <View className="flex-1 min-h-[100]" />
            </View>

            {/* Fixed Button Section */}
            <View className="px-6 pb-8 pt-6 border-t border-gray-800 bg-gray-900">
              <TouchableOpacity
                className={`rounded-xl py-5 items-center justify-center ${
                  loading || !isFormValid
                    ? 'bg-blue-800/50'
                    : 'bg-blue-600'
                }`}
                onPress={handleSubmit}
                disabled={loading || !isFormValid}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Text className="text-white font-bold text-lg">
                      Continue to Verification
                    </Text>
                    <Text className="text-gray-300 text-sm mt-1">
                      Step 3 of 5 - Next: Email Verification (OTP)
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Back Button */}
              <TouchableOpacity
                onPress={handleBack}
                className="mt-4 py-4 items-center"
                disabled={loading}
              >
                <Text className="text-gray-400 text-base">
                  Back to Contact Details
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}