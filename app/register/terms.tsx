// app/register/terms.tsx - UPDATED FOR SECURITY/PASSWORD STEP
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, Eye, EyeOff, Lock, Shield } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SecurityData, registerApi } from '../../lib/api/registerApi';

export default function TermsScreen() {
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: '',
  });

  const validatePassword = (pass: string): string => {
    if (!pass) return 'Password is required';
    if (pass.length < 6) return 'Password must be at least 6 characters';
    if (!/(?=.*[a-zA-Z])/.test(pass)) return 'Password must contain letters';
    if (!/(?=.*\d)/.test(pass)) return 'Password must contain numbers';
    return '';
  };

  const validateConfirmPassword = (confirmPass: string): string => {
    if (!confirmPass) return 'Please confirm your password';
    if (confirmPass !== password) return 'Passwords do not match';
    return '';
  };

  const handleCompleteRegistration = async () => {
    // Validate terms acceptance
    if (!acceptedTerms || !acceptedPrivacy) {
      Alert.alert('Required', 'Please accept both Terms & Conditions and Privacy Policy to continue.');
      return;
    }

    // Validate passwords
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(confirmPassword);
    
    if (passwordError || confirmPasswordError) {
      setErrors({
        password: passwordError,
        confirmPassword: confirmPasswordError,
      });
      return;
    }

    // Clear errors
    setErrors({ password: '', confirmPassword: '' });

    setLoading(true);
    try {
      const requestData: SecurityData = {
        password: password,
        confirm_password: confirmPassword,
      };
      
      console.log('🔐 Submitting security details...');
      console.log('📦 Request data (password hidden)');
      console.log('👤 User params:', params);
      
      // Add user_id if available from params
      const userId = params.user_id as string;
      if (userId) {
        requestData.user_id = userId;
        console.log('👤 Using user_id from params:', userId);
      }

      const response = await registerApi.submitSecurity(requestData);
      console.log('📥 API Response:', response);
      
      if (response.success) {
        console.log('✅ Registration completed successfully!');
        console.log('📊 Response data:', response.data);
        
        // Check if tokens were received (user is logged in)
        if (response.tokens) {
          console.log('🔑 Received authentication tokens');
          // You might want to store tokens here
          // await storeTokens(response.tokens);
        }
        
        // Show success message
        Alert.alert(
          '🎉 Registration Complete!',
          'Your account has been created successfully. You can now login to your account.',
          [
            {
              text: 'Login Now',
              onPress: () => {
                // Navigate to login with email pre-filled
                router.replace({
                  pathname: '/login',
                  params: { 
                    email: params.email as string || '',
                    registration_complete: 'true',
                    message: 'Registration successful! Please login with your new password.'
                  }
                });
              }
            }
          ]
        );
      } else {
        console.error('❌ API Error Response:', response);
        
        // Handle specific errors
        if (response.error?.includes('password') || response.error?.includes('Password')) {
          setErrors(prev => ({ ...prev, password: response.error! }));
          Alert.alert('Password Error', response.error);
        } else if (response.error?.includes('match')) {
          setErrors(prev => ({ 
            ...prev, 
            password: 'Passwords do not match',
            confirmPassword: 'Passwords do not match'
          }));
          Alert.alert('Password Error', 'Passwords do not match');
        } else if (response.error?.includes('User not found') || response.error?.includes('Invalid user')) {
          Alert.alert(
            'Session Expired',
            'Your registration session has expired. Please start over.',
            [
              {
                text: 'Start Over',
                onPress: () => router.replace('/register')
              }
            ]
          );
        } else {
          Alert.alert('Error', response.error || 'Failed to complete registration. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('❌ Unexpected error:', error);
      Alert.alert(
        'Error',
        error.message || 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewTerms = () => {
    Alert.alert('Terms & Conditions', 
      'By creating an account, you agree to our Terms of Service and User Agreement.');
  };

  const handleViewPrivacy = () => {
    Alert.alert('Privacy Policy', 
      'We value your privacy. Your personal information is protected and will not be shared with third parties without your consent.');
  };

  const isFormValid = () => {
    return acceptedTerms && 
           acceptedPrivacy && 
           password.length >= 6 && 
           confirmPassword === password;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      {/* Header */}
      <View className="px-6 pt-6">
        <View className="flex-row items-center mb-8">
          <TouchableOpacity 
            onPress={() => router.back()} 
            disabled={loading}
            className="p-2"
          >
            <ArrowLeft size={20} color="#60A5FA" />
          </TouchableOpacity>
          <View className="ml-2">
            <Text className="text-2xl font-bold text-white">Security Setup</Text>
            <Text className="text-gray-400 text-sm">Step 5 of 5: Password & Terms</Text>
          </View>
        </View>
        
        {/* Progress Bar - All steps completed */}
        <View className="flex-row mb-10">
          {[1, 2, 3, 4, 5].map((step) => (
            <View key={step} className="items-center" style={{ width: '20%' }}>
              <View className={`w-8 h-8 rounded-full items-center justify-center ${
                step === 5 ? 'bg-blue-500' : 'bg-blue-500'
              }`}>
                <Text className="font-semibold text-white">
                  {step === 4 ? 'OTP' : step}
                </Text>
              </View>
              {step < 5 && (
                <View className="h-1 w-full mt-4 bg-blue-500" />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="mb-8">
          <Text className="text-white text-xl font-semibold mb-4">
            Create Your Password
          </Text>
          <Text className="text-gray-400 mb-8">
            Set a secure password and accept our terms to complete registration.
          </Text>

          {/* Account Summary */}
          <View className="mb-8 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <Text className="text-blue-300 text-sm font-medium mb-3">
              📋 Your Information
            </Text>
            <View className="space-y-2">
              <View className="flex-row">
                <Text className="text-gray-400 text-sm flex-1">Name:</Text>
                <Text className="text-white text-sm font-medium">
                  {params.firstName} {params.lastName}
                </Text>
              </View>
              <View className="flex-row">
                <Text className="text-gray-400 text-sm flex-1">Location:</Text>
                <Text className="text-white text-sm">
                  {params.city}, {params.state}
                </Text>
              </View>
              <View className="flex-row">
                <Text className="text-gray-400 text-sm flex-1">Email:</Text>
                <View className="flex-row items-center">
                  <Text className="text-white text-sm mr-2">{params.email}</Text>
                  <View className="px-2 py-1 bg-green-900/30 rounded">
                    <Text className="text-green-400 text-xs">✓ Verified</Text>
                  </View>
                </View>
              </View>
              <View className="flex-row">
                <Text className="text-gray-400 text-sm flex-1">Phone:</Text>
                <Text className="text-white text-sm">{params.phone}</Text>
              </View>
            </View>
          </View>

          {/* Password Field */}
          <View className="mb-4">
            <Text className="text-gray-300 text-sm font-medium mb-2">
              Password *
            </Text>
            <View className={`flex-row items-center rounded-xl px-4 py-4 border ${
              errors.password ? 'border-red-500 bg-red-900/20' : 'border-gray-700 bg-gray-800'
            }`}>
              <Lock size={20} color={errors.password ? "#EF4444" : "#9CA3AF"} />
              <TextInput
                className="flex-1 ml-3 text-white text-base"
                placeholder="Create a strong password"
                placeholderTextColor="#6B7280"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                }}
                secureTextEntry={!showPassword}
                editable={!loading}
                autoCapitalize="none"
                autoComplete="password-new"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="ml-2"
              >
                {showPassword ? (
                  <EyeOff size={20} color="#9CA3AF" />
                ) : (
                  <Eye size={20} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <Text className="text-red-400 text-xs mt-1 ml-1">{errors.password}</Text>
            ) : password ? (
              <Text className="text-gray-500 text-xs mt-1 ml-1">
                • At least 6 characters • Contains letters & numbers
              </Text>
            ) : null}
          </View>

          {/* Confirm Password Field */}
          <View className="mb-6">
            <Text className="text-gray-300 text-sm font-medium mb-2">
              Confirm Password *
            </Text>
            <View className={`flex-row items-center rounded-xl px-4 py-4 border ${
              errors.confirmPassword ? 'border-red-500 bg-red-900/20' : 'border-gray-700 bg-gray-800'
            }`}>
              <Lock size={20} color={errors.confirmPassword ? "#EF4444" : "#9CA3AF"} />
              <TextInput
                className="flex-1 ml-3 text-white text-base"
                placeholder="Confirm your password"
                placeholderTextColor="#6B7280"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                }}
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
                autoCapitalize="none"
                autoComplete="password-new"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                className="ml-2"
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#9CA3AF" />
                ) : (
                  <Eye size={20} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            </View>
            {errors.confirmPassword ? (
              <Text className="text-red-400 text-xs mt-1 ml-1">{errors.confirmPassword}</Text>
            ) : confirmPassword && confirmPassword === password ? (
              <Text className="text-green-400 text-xs mt-1 ml-1">✓ Passwords match</Text>
            ) : confirmPassword ? (
              <Text className="text-red-400 text-xs mt-1 ml-1">✗ Passwords do not match</Text>
            ) : null}
          </View>

          {/* Terms Checkbox */}
          <View className="mb-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <TouchableOpacity
              className="flex-row items-center mb-3"
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              disabled={loading}
            >
              <View className={`w-6 h-6 rounded-md border-2 items-center justify-center mr-3 ${
                acceptedTerms ? 'bg-blue-500 border-blue-500' : 'border-gray-600'
              }`}>
                {acceptedTerms && <Check size={14} color="#FFFFFF" />}
              </View>
              <Text className="text-white font-medium flex-1">
                I accept the Terms & Conditions
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleViewTerms} disabled={loading}>
              <Text className="text-blue-400 text-xs ml-9">
                View Terms & Conditions
              </Text>
            </TouchableOpacity>
          </View>

          {/* Privacy Checkbox */}
          <View className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <TouchableOpacity
              className="flex-row items-center mb-3"
              onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}
              disabled={loading}
            >
              <View className={`w-6 h-6 rounded-md border-2 items-center justify-center mr-3 ${
                acceptedPrivacy ? 'bg-blue-500 border-blue-500' : 'border-gray-600'
              }`}>
                {acceptedPrivacy && <Check size={14} color="#FFFFFF" />}
              </View>
              <Text className="text-white font-medium flex-1">
                I accept the Privacy Policy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleViewPrivacy} disabled={loading}>
              <Text className="text-blue-400 text-xs ml-9">
                View Privacy Policy
              </Text>
            </TouchableOpacity>
          </View>

          {/* Security Info */}
          <View className="mb-8 p-4 bg-blue-900/20 rounded-xl border border-blue-800/30">
            <View className="flex-row items-center mb-3">
              <Shield size={18} color="#60A5FA" />
              <Text className="text-blue-300 text-sm font-medium ml-2">
                Password Security Tips
              </Text>
            </View>
            <View className="space-y-2">
              <Text className="text-gray-400 text-xs">
                • Use at least 6 characters with letters and numbers
              </Text>
              <Text className="text-gray-400 text-xs">
                • Avoid common passwords like `123456`` or `password`
              </Text>
              <Text className="text-gray-400 text-xs">
                • Consider using a password manager
              </Text>
              <Text className="text-gray-400 text-xs">
                • Never share your password with anyone
              </Text>
            </View>
          </View>

          {/* Next Steps */}
          <View className="mb-8 p-4 bg-gray-800/30 rounded-xl border border-gray-700">
            <Text className="text-gray-300 text-sm font-medium mb-2">
              What happens next:
            </Text>
            <View className="space-y-1">
              <Text className="text-gray-400 text-xs">
                1. Account will be activated immediately
              </Text>
              <Text className="text-gray-400 text-xs">
                2. You`ll be redirected to login page
              </Text>
              <Text className="text-gray-400 text-xs">
                3. Login with your email and new password
              </Text>
              <Text className="text-gray-400 text-xs">
                4. Complete your profile (optional)
              </Text>
              <Text className="text-gray-400 text-xs">
                5. Start using all features
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Complete Button */}
      <View className="px-6 pb-8 pt-4 border-t border-gray-800">
        <TouchableOpacity
          className={`rounded-xl py-4 items-center justify-center ${
            loading || !isFormValid() ? 'bg-blue-800 opacity-50' : 'bg-blue-600'
          }`}
          onPress={handleCompleteRegistration}
          disabled={loading || !isFormValid()}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Text className="text-white font-bold text-lg">
                Complete Registration
              </Text>
              <Text className="text-gray-300 text-sm mt-1">
                Final Step - Will redirect to login
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        {/* Back Button */}
        <TouchableOpacity
          className="mt-4 py-3 items-center justify-center"
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text className="text-gray-400">Back to Email Verification</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}