// app/login/password-reset-confirm.tsx
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, Lock, Check, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { passwordResetService } from './services/passwordResetService';

export default function PasswordResetConfirmScreen() {
  const params = useLocalSearchParams();
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const newPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const email = params.email as string || '';
  const otp = params.otp as string || '';

  useEffect(() => {
    if (email && otp) {
      passwordResetService.setEmail(email);
    }

    Keyboard.dismiss();

    const focusTimer = setTimeout(() => {
      newPasswordRef.current?.focus();
    }, 300);

    return () => clearTimeout(focusTimer);
  }, []);

  const handlePasswordChange = (field: 'newPassword' | 'confirmPassword', value: string) => {
    setPasswords(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const togglePasswordVisibility = (field: 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError('');

    if (!passwords.newPassword || !passwords.confirmPassword) {
      Alert.alert('Error', 'Please fill in both password fields');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (passwords.newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await passwordResetService.resetPassword(
        passwords.newPassword,
        passwords.confirmPassword
      );
      
      if (response.success) {
        router.replace('/login/password-reset-complete');
      } else {
        setError(response.message);
        Alert.alert('Error', response.message);
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to reset password';
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

  const isFormValid = passwords.newPassword.length >= 8 && 
                     passwords.confirmPassword.length >= 8 &&
                     passwords.newPassword === passwords.confirmPassword;

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
                <View>
                  <Text className="text-2xl font-bold text-white">New Password</Text>
                  <Text className="text-gray-400 text-sm">
                    Create your new password
                  </Text>
                </View>
              </View>
            </View>

            {/* Form */}
            <View className="px-6 flex-1">
              {/* New Password Field */}
              <View className="mb-6">
                <Text className="text-gray-300 text-sm font-medium mb-2">
                  New Password
                </Text>
                <View className="flex-row items-center bg-gray-800 rounded-xl px-4 py-3 border border-gray-700">
                  <Lock size={18} color="#9CA3AF" />
                  <TextInput
                    ref={newPasswordRef}
                    className="flex-1 ml-3 text-white text-base"
                    placeholder="Enter new password"
                    placeholderTextColor="#6B7280"
                    secureTextEntry={!showPasswords.new}
                    value={passwords.newPassword}
                    onChangeText={(value) => handlePasswordChange('newPassword', value)}
                    editable={!loading}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                  <TouchableOpacity 
                    onPress={() => togglePasswordVisibility('new')}
                    disabled={loading}
                  >
                    {showPasswords.new ? (
                      <EyeOff size={18} color="#9CA3AF" />
                    ) : (
                      <Eye size={18} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Password Length Check */}
              {passwords.newPassword.length > 0 && (
                <View className="mb-6">
                  <View className="flex-row items-center mb-2">
                    {passwords.newPassword.length >= 8 ? (
                      <Check size={16} color="#10B981" className="mr-2" />
                    ) : (
                      <X size={16} color="#EF4444" className="mr-2" />
                    )}
                    <Text className={`text-sm ${
                      passwords.newPassword.length >= 8 ? 'text-green-400' : 'text-gray-400'
                    }`}>
                      At least 8 characters
                    </Text>
                  </View>
                  
                  <View className="h-2 bg-gray-700 rounded-full">
                    <View 
                      className="h-2 rounded-full bg-green-500"
                      style={{ 
                        width: `${Math.min((passwords.newPassword.length / 8) * 100, 100)}%` 
                      }}
                    />
                  </View>
                </View>
              )}

              {/* Confirm Password Field */}
              <View className="mb-8">
                <Text className="text-gray-300 text-sm font-medium mb-2">
                  Confirm New Password
                </Text>
                <View className="flex-row items-center bg-gray-800 rounded-xl px-4 py-3 border border-gray-700">
                  <Lock size={18} color="#9CA3AF" />
                  <TextInput
                    ref={confirmPasswordRef}
                    className="flex-1 ml-3 text-white text-base"
                    placeholder="Confirm new password"
                    placeholderTextColor="#6B7280"
                    secureTextEntry={!showPasswords.confirm}
                    value={passwords.confirmPassword}
                    onChangeText={(value) => handlePasswordChange('confirmPassword', value)}
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                  <TouchableOpacity 
                    onPress={() => togglePasswordVisibility('confirm')}
                    disabled={loading}
                  >
                    {showPasswords.confirm ? (
                      <EyeOff size={18} color="#9CA3AF" />
                    ) : (
                      <Eye size={18} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
                </View>
                
                {/* Password Match Indicator */}
                {passwords.confirmPassword.length > 0 && (
                  <View className="flex-row items-center mt-2 ml-1">
                    {passwords.newPassword === passwords.confirmPassword ? (
                      <>
                        <Check size={16} color="#10B981" className="mr-2" />
                        <Text className="text-green-400 text-sm">Passwords match</Text>
                      </>
                    ) : (
                      <>
                        <X size={16} color="#EF4444" className="mr-2" />
                        <Text className="text-red-400 text-sm">Passwords do not match</Text>
                      </>
                    )}
                  </View>
                )}
              </View>

              {/* Error Display */}
              {error ? (
                <View className="bg-red-900/20 border border-red-800/30 rounded-xl p-3 mb-8">
                  <Text className="text-red-300 text-sm">{error}</Text>
                </View>
              ) : null}

              {/* Password Tip */}
              <View className="bg-blue-900/20 border border-blue-800/30 rounded-xl p-4 mb-8">
                <Text className="text-blue-300 text-sm">
                  🔒 Your password must be at least 8 characters long.
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
                  Reset Password
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-4 py-3 items-center"
              onPress={handleBack}
              disabled={loading}
            >
              <Text className="text-gray-400 text-base">
                Back to Verification
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}