// app/login/forgot-password.tsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { passwordResetAPI } from '../services/passwordResetApi';
import { passwordResetService } from '../services/passwordResetService';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const emailInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    Keyboard.dismiss();
    emailInputRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError('');

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!passwordResetAPI.isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await passwordResetService.requestOTP(email);
      
      if (response.success) {
        setSuccess(true);
        Alert.alert('Success', response.message, [
          {
            text: 'Continue',
            onPress: () => {
              const displayEmail = passwordResetAPI.formatEmailForDisplay(email);
              router.push({
                pathname: '/login/password-reset-otp-verify',
                params: { 
                  email: email.toLowerCase().trim(),
                  display_email: displayEmail
                }
              });
            }
          }
        ]);
      } else {
        setError(response.message);
        Alert.alert('Error', response.message);
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Network error. Please try again.';
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    Keyboard.dismiss();
    router.back();
  };

  const isFormValid = email.trim() !== '' && passwordResetAPI.isValidEmail(email);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView className="flex-1 bg-gray-900">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            ref={scrollViewRef}
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
                <View className="flex-1">
                  <Text className="text-2xl font-bold text-white">Forgot Password</Text>
                  <Text className="text-gray-400 text-sm">
                    We`ll send a verification code to your email
                  </Text>
                </View>
              </View>
            </View>

            {/* Form */}
            <View className="px-6 flex-1">
              <View className="mb-6">
                <Text className="text-gray-300 text-sm font-medium mb-2">
                  Email Address
                </Text>
                <View className="flex-row items-center bg-gray-800 rounded-xl px-4 py-3 border border-gray-700">
                  <Mail size={18} color="#9CA3AF" />
                  <TextInput
                    ref={emailInputRef}
                    className="flex-1 ml-3 text-white text-base"
                    placeholder="Enter your email"
                    placeholderTextColor="#6B7280"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text.toLowerCase());
                      setError('');
                    }}
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                </View>
                <Text className="text-gray-500 text-xs mt-1 ml-1">
                  Enter your registered email address
                </Text>
              </View>

              {/* Error Display */}
              {error ? (
                <View className="bg-red-900/20 border border-red-800/30 rounded-xl p-3 mb-4">
                  <Text className="text-red-300 text-sm">{error}</Text>
                </View>
              ) : null}

              {/* Info Box */}
              <View className="bg-blue-900/20 border border-blue-800/30 rounded-xl p-4 mb-6">
                <Text className="text-blue-300 text-sm">
                  📧 A 6-digit verification code will be sent to your email address.
                </Text>
              </View>

              <View className="flex-1" />
            </View>
          </ScrollView>

          {/* Fixed Button Section */}
          <View className="px-6 pb-6 pt-4 border-t border-gray-800 bg-gray-900">
            <TouchableOpacity
              className={`rounded-xl py-4 items-center justify-center ${
                loading || !isFormValid ? 'bg-blue-800/50' : 'bg-blue-600'
              }`}
              onPress={handleSubmit}
              disabled={loading || !isFormValid}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-bold text-lg">
                  Send Verification Code
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-4 py-3 items-center"
              onPress={handleBack}
              disabled={loading}
            >
              <Text className="text-gray-400 text-base">
                Back to Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}