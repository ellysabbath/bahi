// app/login/password-reset-confirm.tsx
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, Eye, EyeOff, Lock, X } from 'lucide-react-native';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
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
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { passwordResetAPI } from './services/passwordResetApi';
import { passwordResetService } from './services/passwordResetService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const [resetState, setResetState] = useState(passwordResetService.getState());
  const [loading, setLoading] = useState(false);
  
  const newPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const email = params.email as string || resetState.email || '';

  useEffect(() => {
    // Subscribe to state changes
    const unsubscribe = passwordResetService.subscribe((state) => {
      setResetState(state);
    });

    // Dismiss keyboard on mount
    Keyboard.dismiss();

    // Auto-focus new password field after a short delay
    const focusTimer = setTimeout(() => {
      newPasswordRef.current?.focus();
    }, 300);

    return () => {
      unsubscribe();
      clearTimeout(focusTimer);
    };
  }, []);

  const validatePassword = (password: string) => {
    passwordResetService.updatePassword(password);
  };

  const calculateStrengthScore = useCallback(() => {
    return passwordResetAPI.calculatePasswordStrength(resetState.passwordStrength);
  }, [resetState.passwordStrength]);

  const getStrengthColor = useCallback(() => {
    const score = calculateStrengthScore();
    if (score <= 1) return 'text-red-400';
    if (score <= 3) return 'text-amber-400';
    return 'text-green-400';
  }, [calculateStrengthScore]);

  const getStrengthText = useCallback(() => {
    const score = calculateStrengthScore();
    return passwordResetAPI.getPasswordStrengthText(score);
  }, [calculateStrengthScore]);

  const handlePasswordChange = (field: 'newPassword' | 'confirmPassword', value: string) => {
    setPasswords(prev => ({ ...prev, [field]: value }));
    
    if (field === 'newPassword') {
      validatePassword(value);
    } else {
      passwordResetService.updateConfirmPassword(value);
    }
  };

  const togglePasswordVisibility = (field: 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleNewPasswordSubmit = () => {
    confirmPasswordRef.current?.focus();
  };

  const handleConfirmPasswordSubmit = () => {
    Keyboard.dismiss();
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    
    // Validate passwords
    if (!passwords.newPassword || !passwords.confirmPassword) {
      Alert.alert('Validation Error', 'Please fill in both password fields');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return;
    }

    const score = calculateStrengthScore();
    if (score < 3) {
      Alert.alert(
        'Weak Password',
        'Please choose a stronger password. Your password should include:\n• At least 8 characters\n• Uppercase & lowercase letters\n• Numbers & special characters',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);

    try {
      const response = await passwordResetService.resetPassword(
        passwords.newPassword,
        passwords.confirmPassword
      );
      
      if (response.success) {
        router.push({
          pathname: '/login/password-reset-complete',
          params: { email }
        });
      } else {
        Alert.alert('Error', response.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    Keyboard.dismiss();
    router.back();
  };

  const isFormValid = passwords.newPassword.trim() !== '' && 
                     passwords.confirmPassword.trim() !== '' && 
                     passwords.newPassword === passwords.confirmPassword;
  
  const isLoading = loading || resetState.isLoading;

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
                  disabled={isLoading}
                >
                  <ArrowLeft size={20} color="#60A5FA" />
                </TouchableOpacity>
                <View>
                  <Text className="text-2xl font-bold text-white">New Password</Text>
                  <Text className="text-gray-400 text-sm">
                    Create a strong and secure password
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
                <View className="flex-row items-center bg-gray-800 rounded-xl px-4 py-4 border border-gray-700">
                  <Lock size={18} color="#9CA3AF" />
                  <TextInput
                    ref={newPasswordRef}
                    className="flex-1 ml-3 text-white text-base"
                    placeholder="Enter new password"
                    placeholderTextColor="#6B7280"
                    secureTextEntry={!showPasswords.new}
                    value={passwords.newPassword}
                    onChangeText={(value) => handlePasswordChange('newPassword', value)}
                    editable={!isLoading}
                    returnKeyType="next"
                    onSubmitEditing={handleNewPasswordSubmit}
                    blurOnSubmit={false}
                    onFocus={() => {
                      // Scroll to make input visible
                      scrollViewRef.current?.scrollTo({ y: 100, animated: true });
                    }}
                  />
                  <TouchableOpacity 
                    onPress={() => togglePasswordVisibility('new')}
                    disabled={isLoading}
                  >
                    {showPasswords.new ? (
                      <EyeOff size={18} color="#9CA3AF" />
                    ) : (
                      <Eye size={18} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Password Strength Meter */}
              {passwords.newPassword.length > 0 && (
                <View className="mb-8">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-gray-300 text-sm">Password Strength</Text>
                    <Text className={`text-sm font-bold ${getStrengthColor()}`}>
                      {getStrengthText()}
                    </Text>
                  </View>
                  
                  {/* Strength Bar */}
                  <View className="h-2 bg-gray-700 rounded-full mb-4">
                    <View 
                      className={`h-2 rounded-full ${
                        calculateStrengthScore() <= 1 ? 'bg-red-500' :
                        calculateStrengthScore() <= 3 ? 'bg-amber-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${(calculateStrengthScore() / 5) * 100}%` }}
                    />
                  </View>

                  {/* Password Requirements */}
                  <View className="space-y-2">
                    {[
                      { key: 'hasMinLength', text: 'At least 8 characters' },
                      { key: 'hasUpperCase', text: 'Uppercase letter (A-Z)' },
                      { key: 'hasLowerCase', text: 'Lowercase letter (a-z)' },
                      { key: 'hasNumber', text: 'Number (0-9)' },
                      { key: 'hasSpecialChar', text: 'Special character (!@#$%)' }
                    ].map((req) => (
                      <View key={req.key} className="flex-row items-center">
                        {resetState.passwordStrength[req.key as keyof typeof resetState.passwordStrength] ? (
                          <Check size={16} color="#10B981" className="mr-3" />
                        ) : (
                          <X size={16} color="#EF4444" className="mr-3" />
                        )}
                        <Text className={`text-sm ${
                          resetState.passwordStrength[req.key as keyof typeof resetState.passwordStrength]
                            ? 'text-green-400'
                            : 'text-gray-400'
                        }`}>
                          {req.text}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Confirm Password Field */}
              <View className="mb-8">
                <Text className="text-gray-300 text-sm font-medium mb-2">
                  Confirm New Password
                </Text>
                <View className="flex-row items-center bg-gray-800 rounded-xl px-4 py-4 border border-gray-700">
                  <Lock size={18} color="#9CA3AF" />
                  <TextInput
                    ref={confirmPasswordRef}
                    className="flex-1 ml-3 text-white text-base"
                    placeholder="Confirm new password"
                    placeholderTextColor="#6B7280"
                    secureTextEntry={!showPasswords.confirm}
                    value={passwords.confirmPassword}
                    onChangeText={(value) => handlePasswordChange('confirmPassword', value)}
                    editable={!isLoading}
                    returnKeyType="done"
                    onSubmitEditing={handleConfirmPasswordSubmit}
                    onFocus={() => {
                      // Scroll to make input visible
                      scrollViewRef.current?.scrollTo({ y: 250, animated: true });
                    }}
                  />
                  <TouchableOpacity 
                    onPress={() => togglePasswordVisibility('confirm')}
                    disabled={isLoading}
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
              {resetState.error && (
                <View className="bg-red-900/20 border border-red-800/30 rounded-xl p-4 mb-8">
                  <Text className="text-red-300 text-sm">{resetState.error}</Text>
                </View>
              )}

              {/* Password Tips */}
              <View className="bg-gray-800/50 rounded-xl p-4 mb-8">
                <Text className="text-gray-300 font-medium mb-2">Password Tips:</Text>
                <Text className="text-gray-400 text-sm">
                  • Use a mix of uppercase and lowercase letters
                  {'\n'}• Include numbers and special characters
                  {'\n'}• Avoid common words and personal information
                  {'\n'}• Don`t reuse passwords from other accounts
                </Text>
              </View>

              {/* Spacer to ensure buttons don't overlap */}
              <View className="flex-1 min-h-[150]" />
            </View>
          </ScrollView>

          {/* Fixed Button Section at Bottom */}
          <View className="px-6 pb-8 pt-6 border-t border-gray-800 bg-gray-900">
            <TouchableOpacity
              className={`rounded-xl py-5 items-center justify-center ${
                isLoading || !isFormValid
                  ? 'bg-blue-800/50'
                  : 'bg-blue-600'
              }`}
              onPress={handleSubmit}
              disabled={isLoading || !isFormValid}
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-lg">
                {isLoading ? 'Updating...' : 'Reset Password'}
              </Text>
              <Text className="text-gray-300 text-sm mt-1">
                Save your new password
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-4 py-4 items-center"
              onPress={handleBack}
              disabled={isLoading}
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