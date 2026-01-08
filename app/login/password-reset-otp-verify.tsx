// app/login/password-reset-otp-verify.tsx
import { router, useLocalSearchParams } from 'expo-router';
import { AlertCircle, ArrowLeft, Clock, Mail } from 'lucide-react-native';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Alert, 
  Keyboard, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { passwordResetService } from './services/passwordResetService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PasswordResetOtpVerifyScreen() {
  const params = useLocalSearchParams();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetState, setResetState] = useState(passwordResetService.getState());
  const [loading, setLoading] = useState(false);
  
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const email = (params.email as string) || resetState.email || '';

  // Fixed ref callback function
  const setInputRef = useCallback((index: number) => (ref: TextInput | null) => {
    inputRefs.current[index] = ref;
  }, []);

  useEffect(() => {
    // Set email from params if available
    if (email && email !== resetState.email) {
      passwordResetService.requestOTP(email);
    }

    // Subscribe to state changes
    const unsubscribe = passwordResetService.subscribe((state) => {
      setResetState(state);
    });

    // Dismiss keyboard on mount
    Keyboard.dismiss();

    // Auto-focus first OTP input after a short delay
    const focusTimer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);

    return () => {
      unsubscribe();
      clearTimeout(focusTimer);
    };
  }, [email, resetState.email]);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    
    // If value is empty (backspace/delete), clear current field
    if (value === '') {
      newOtp[index] = '';
      setOtp(newOtp);
      
      // If current field is empty and we're at index > 0, go to previous field
      if (index > 0) {
        setTimeout(() => {
          inputRefs.current[index - 1]?.focus();
        }, 10);
      }
      return;
    }
    
    // Handle paste operation (multiple digits at once)
    if (value.length > 1) {
      const pastedOtp = value.split('').slice(0, 6);
      pastedOtp.forEach((char, i) => {
        if (index + i < 6) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      
      // Focus last filled input
      const lastIndex = Math.min(index + pastedOtp.length - 1, 5);
      setTimeout(() => {
        inputRefs.current[lastIndex]?.focus();
      }, 10);
      return;
    }
    
    // Single digit entry
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input if value entered and not at last index
    if (value && index < 5) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 10);
    }
    
    // Auto submit if all fields filled (reached last index)
    if (newOtp.every(digit => digit !== '') && index === 5) {
      // Small delay before auto-submit to ensure last digit is properly set
      setTimeout(() => {
        handleSubmit();
      }, 100);
    }
  };

  // Handle backspace key press for better navigation
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      // If current field is empty and we press backspace, go to previous field
      if (!otp[index] && index > 0) {
        setTimeout(() => {
          inputRefs.current[index - 1]?.focus();
        }, 10);
      }
    }
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert('Validation Error', 'Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);

    try {
      const response = await passwordResetService.verifyOTP(otpCode);
      
      if (response.success) {
        router.push({
          pathname: '/login/password-reset-confirm',
          params: { email, otp: otpCode }
        });
      } else {
        Alert.alert('Verification Failed', response.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resetState.countdown > 0) {
      Alert.alert('Wait', `Please wait ${resetState.countdown} seconds before resending.`);
      return;
    }

    Keyboard.dismiss();
    
    const response = await passwordResetService.resendOTP();
    
    if (response.success) {
      Alert.alert('OTP Resent', 'A new verification code has been sent to your email.');
      // Clear OTP and reset focus to first field
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
    } else {
      Alert.alert('Error', response.message);
    }
  };

  const handleBack = () => {
    Keyboard.dismiss();
    router.back();
  };

  // Clear all OTP fields
  const clearOtp = () => {
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  const isFormValid = otp.every(digit => digit !== '');
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

              </View>

              {/* Email Display */}
              <View className="bg-gray-800/50 rounded-xl p-4 mb-8 border border-gray-700/50">
                <View className="flex-row items-center">
                  <Mail size={18} color="#60A5FA" className="mr-3" />
                  <View className="flex-1">
                    <Text className="text-gray-400 text-sm mb-1">Verification sent to:</Text>
                    <Text className="text-white font-medium">{email}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* OTP Input Fields */}
            <View className="px-6 mb-10">
              <Text className="text-gray-300 text-sm font-medium mb-4 text-center">
                Enter 6-digit verification code
              </Text>
              
              <View className="flex-row justify-between mb-6">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <View
                    key={index}
                    className={`w-12 h-14 rounded-xl border-2 items-center justify-center ${
                      otp[index] 
                        ? 'border-blue-500 bg-blue-900/20' 
                        : 'border-gray-700 bg-gray-800'
                    }`}
                  >
                    <TextInput
                      ref={setInputRef(index)}
                      className="text-white text-2xl font-bold text-center w-full"
                      keyboardType="number-pad"
                      maxLength={1}
                      value={otp[index]}
                      onChangeText={(value) => handleOtpChange(value, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      editable={!isLoading}
                      selectTextOnFocus
                      onFocus={() => {
                        // Scroll to make OTP inputs visible above keyboard
                        scrollViewRef.current?.scrollTo({ y: 150, animated: true });
                      }}
                      contextMenuHidden={true}
                      // Important for iOS: Allows selection and proper cursor behavior
                      clearTextOnFocus={false}
                    />
                  </View>
                ))}
              </View>

              {/* Digits counter and clear button */}
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-gray-400 text-xs">
                  {otp.filter(digit => digit !== '').length}/6 digits entered
                </Text>
                <TouchableOpacity 
                  onPress={clearOtp}
                  disabled={isLoading}
                >
                  <Text className="text-blue-400 text-xs font-medium">
                    Clear All
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Countdown Timer */}
              <View className="flex-row items-center justify-center mb-2">
                <Clock size={16} color="#9CA3AF" className="mr-2" />
                <Text className="text-gray-400 text-sm">
                  Code expires in:{' '}
                  <Text className="text-amber-400 font-bold">
                    {Math.floor(resetState.countdown / 60)}:{String(resetState.countdown % 60).padStart(2, '0')}
                  </Text>
                </Text>
              </View>

              {/* Resend OTP */}
              <TouchableOpacity
                onPress={handleResendOtp}
                disabled={isLoading || resetState.countdown > 0}
                className="items-center"
              >
                <Text className={`text-sm ${
                  resetState.countdown > 0 
                    ? 'text-gray-600' 
                    : 'text-blue-400 font-bold'
                }`}>
                  {isLoading 
                    ? 'Sending new code...' 
                    : resetState.countdown > 0 
                      ? `Resend code in ${resetState.countdown}s` 
                      : 'Resend verification code'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Info Box */}
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
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="mt-4 py-4 items-center"
              onPress={handleBack}
              disabled={isLoading}
            >
              <Text className="text-gray-400 text-base">
                Back to Forgot Password
              </Text>
            </TouchableOpacity>
            <View>
                              <View>
                  <Text className="text-2xl font-bold text-white">Verify Code</Text>
                  <Text className="text-gray-400 text-sm">
                    Enter the 6-digit code from your email
                  </Text>
                </View>
            </View>


            {/* Error Display */}
            {resetState.error && (
              <View className="px-6 mb-8">
                <View className="bg-red-900/20 border border-red-800/30 rounded-xl p-4">
                  <Text className="text-red-300 text-sm">{resetState.error}</Text>
                </View>
              </View>
            )}

            {/* Spacer to ensure buttons don't overlap */}
            <View className="flex-1 min-h-[150]" />
          </ScrollView>

          {/* Fixed Button Section at Bottom */}
          <View className="px-6 pb-8 pt-6 border-t border-gray-800 bg-gray-900">


          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}