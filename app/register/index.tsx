// app/register/index.tsx - PersonalInfoScreen.tsx
import { router } from 'expo-router';
import { ArrowLeft, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PersonalInfoData, registerApi } from '../../lib/api/registerApi';

export default function PersonalInfoScreen() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Validation Error', 'Please enter both first and last name');
      return;
    }
    
    setLoading(true);
    try {
      const requestData: PersonalInfoData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
      };
      
      const response = await registerApi.submitPersonalInfo(requestData);
      
      if (response.success) {
        // Navigate to CONTACT (Step 2) - Django expects this flow
        router.push({
          pathname: '/register/contact',
          params: { 
            firstName: formData.firstName,
            lastName: formData.lastName 
          }
        });
      } else {
        Alert.alert('Error', response.error || 'Failed to save personal information');
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.error || error.message || 'Failed to save personal information'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      {/* Header */}
      <View className="px-6 pt-6">
        <View className="flex-row items-center mb-8">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center mr-4"
            disabled={loading}
          >
            <ArrowLeft size={20} color="#60A5FA" />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-bold text-white">Create Account</Text>
            <Text className="text-gray-400 text-sm">Step 1 of 5: Personal Info</Text>
          </View>
        </View>

        {/* Progress Indicator */}
        <View className="flex-row mb-10">
          {[1, 2, 3, 4, 5].map((step) => (
            <View key={step} className="items-center" style={{ width: '20%' }}>
              <View className={`w-8 h-8 rounded-full items-center justify-center ${
                step === 1 ? 'bg-blue-500' : 'bg-gray-800 border border-gray-700'
              }`}>
                <Text className={`font-semibold ${
                  step === 1 ? 'text-white' : 'text-gray-400'
                }`}>
                  {step === 4 ? 'OTP' : step}
                </Text>
              </View>
              {step < 5 && (
                <View className={`h-1 w-full mt-4 ${
                  step === 1 ? 'bg-blue-500' : 'bg-gray-800'
                }`} />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Form */}
      <View className="px-6 flex-1">
        <Text className="text-white text-xl font-semibold mb-8">
          What`s your name?
        </Text>

        {/* Grid Layout */}
        <View className="flex-row space-x-4 mb-6">
          <View className="flex-1">
            <Text className="text-gray-300 text-sm font-medium mb-2">First Name</Text>
            <View className="flex-row items-center bg-gray-800 rounded-xl px-4 py-4 border border-gray-700">
              <User size={18} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-white text-base"
                placeholder="John"
                placeholderTextColor="#6B7280"
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>
          </View>

          <View className="flex-1">
            <Text className="text-gray-300 text-sm font-medium mb-2">Last Name</Text>
            <View className="flex-row items-center bg-gray-800 rounded-xl px-4 py-4 border border-gray-700">
              <User size={18} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-white text-base"
                placeholder="Doe"
                placeholderTextColor="#6B7280"
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>
          </View>
        </View>

        <Text className="text-gray-400 text-sm mt-4">
          This is how it will appear in your profile
        </Text>
      </View>

      {/* Continue Button */}
      <View className="px-6 pb-8 pt-4 border-t border-gray-800">
        <TouchableOpacity
          className="bg-blue-600 rounded-xl py-4 items-center justify-center"
          onPress={handleNext}
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Text className="text-white font-bold text-lg">Continue</Text>
              <Text className="text-gray-300 text-sm mt-1">Step 1 of 5 - Next: Contact Details</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}