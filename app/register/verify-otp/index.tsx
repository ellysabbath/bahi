// app/register/verify-otp.tsx
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Mail, RefreshCw } from 'lucide-react-native';
import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { registerApi } from '../../../lib/api/registerApi';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function OTPVerificationScreen() {
  const rawParams = useLocalSearchParams();
  const params = rawParams as Record<string, string | undefined>;
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  const inputsRef = useRef<(TextInput | null)[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  // Fixed ref callback function
  const setInputRef = useCallback((index: number) => (ref: TextInput | null) => {
    inputsRef.current[index] = ref;
  }, []);

  useEffect(() => {
    console.log('🔍 OTP Screen params:', params);
    
    // Keyboard listeners
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
        // Scroll to make OTP inputs visible
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: 150, animated: true });
        }, 100);
      }
    );
    
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => {
        clearInterval(interval);
        showSubscription.remove();
        hideSubscription.remove();
      };
    }

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [timer, params]);

  // Auto-focus first OTP input when component mounts
  useEffect(() => {
    const timeout = setTimeout(() => {
      inputsRef.current[0]?.focus();
    }, 500);
    
    return () => clearTimeout(timeout);
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedOtp = value.split('').slice(0, 6);
      const newOtp = [...otp];
      pastedOtp.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      
      // Focus on last input
      const lastIndex = Math.min(pastedOtp.length - 1, 5);
      setTimeout(() => {
        inputsRef.current[lastIndex]?.focus();
      }, 50);
      return;
    }
    
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input if value entered
    if (value && index < 5) {
      setTimeout(() => {
        inputsRef.current[index + 1]?.focus();
      }, 50);
    }
    
    // If deleting and current field is empty, focus previous
    if (!value && index > 0) {
      setTimeout(() => {
        inputsRef.current[index - 1]?.focus();
      }, 50);
    }
  };

  const handleVerify = async () => {
    Keyboard.dismiss(); // Dismiss keyboard first
    
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Validation Error', 'Please enter the 6-digit OTP');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🔐 Verifying OTP...');
      console.log('📦 OTP Code:', otpCode);
      console.log('👤 User ID:', params.user_id);
      console.log('🎯 Purpose:', params.purpose);
      
      const purpose = params.purpose as "email_verification" | "phone_verification" | undefined;
      
      const response = await registerApi.verifyOTP({
        otp: otpCode,
        purpose: purpose || 'email_verification',
        user_id: params.user_id as string,
      });
      
      console.log('📥 OTP Verification Response:', response);
      
      if (response.success) {
        console.log('✅ OTP verified successfully!');
        console.log('📍 Navigating to Terms screen...');
        
        // Clear OTP inputs
        setOtp(['', '', '', '', '', '']);
        
        // Navigate directly to Terms screen
        const navigationParams: Record<string, string> = {};
        Object.keys(params).forEach(key => {
          if (params[key]) {
            navigationParams[key] = params[key] as string;
          }
        });
        navigationParams.email_verified = 'true';
        navigationParams.verification_time = new Date().toISOString();

        router.push({
          pathname: '/register/terms',
          params: navigationParams,
        });
      } else {
        Alert.alert(
          'Verification Failed',
          response.error || 'Invalid OTP. Please try again.'
        );
      }
    } catch (error: unknown) {
      console.error('❌ OTP Verification Error:', error);
      
      let errorMessage = 'Invalid OTP. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      Alert.alert('Verification Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setResendLoading(true);
    Keyboard.dismiss(); // Dismiss keyboard if open
    
    try {
      // Prepare resend OTP data
      const purpose = params.purpose as "email_verification" | "phone_verification" | undefined;
      const userId = params.user_id as string;
      
      // Call resend OTP API with correct signature
      const response = await registerApi.resendOTP(
        purpose || 'email_verification',
        userId
      );
      
      if (response.success) {
        // Reset timer
        setTimer(60);
        setCanResend(false);
        Alert.alert('Success', 'New OTP sent to your email.');
      } else {
        Alert.alert('Error', response.error || 'Failed to resend OTP. Please try again.');
      }
    } catch (error: unknown) {
      console.error('❌ Resend OTP error:', error);
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const purpose = params.purpose as string | undefined;
  const target = purpose === 'email_verification' 
    ? params.email 
    : params.phone;

  const isFormValid = otp.join('').length === 6;

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
              paddingBottom: keyboardVisible ? keyboardHeight + 20 : 0
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Header */}
            <View className="px-6 pt-6">
              <View className="flex-row items-center mb-8">
                <TouchableOpacity 
                  onPress={() => {
                    Keyboard.dismiss();
                    router.back();
                  }} 
                  disabled={loading}
                  className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center mr-4"
                >
                  <ArrowLeft size={20} color="#60A5FA" />
                </TouchableOpacity>
                <View>
                  <Text className="text-2xl font-bold text-white">Email Verification</Text>
                  <Text className="text-gray-400 text-sm">Step 4 of 5: Verify Email</Text>
                </View>
              </View>
              
              {/* Progress Bar */}
              <View className="flex-row mb-10">
                {[1, 2, 3, 4, 5].map((step) => (
                  <View key={step} className="items-center" style={{ width: '20%' }}>
                    <View className={`w-8 h-8 rounded-full items-center justify-center ${
                      step === 4 ? 'bg-blue-500' : step < 4 ? 'bg-blue-500' : 'bg-gray-800 border border-gray-700'
                    }`}>
                      <Text className={`font-semibold ${
                        step === 4 || step < 4 ? 'text-white' : 'text-gray-400'
                      }`}>
                        {step === 4 ? 'OTP' : step}
                      </Text>
                    </View>
                    {step < 5 && (
                      <View className={`h-1 w-full mt-4 ${
                        step < 4 ? 'bg-blue-500' : 'bg-gray-800'
                      }`} />
                    )}
                  </View>
                ))}
              </View>
            </View>

            {/* Content - Added proper spacing to prevent overlap */}
            <View className="px-6 flex-1">
              <View className="items-center mb-8">
                <View className="w-20 h-20 rounded-full bg-blue-900/30 items-center justify-center mb-4">
                  <Mail size={40} color="#60A5FA" />
                </View>
                
                <Text className="text-white text-xl font-bold mb-2">
                  Verify Your Email
                </Text>
                <Text className="text-gray-400 text-center mb-1">
                  We`ve sent a 6-digit code to
                </Text>
                <Text className="text-blue-400 font-semibold text-center">
                  {target}
                </Text>
                <Text className="text-gray-500 text-xs mt-2 text-center">
                  Check your spam folder if you don`t see it
                </Text>
              </View>

              {/* OTP Inputs - with extra margin */}
              <View className="mb-10">
                <Text className="text-gray-300 text-sm font-medium mb-4">
                  Enter Verification Code
                </Text>
                <View className="flex-row justify-between mx-2">
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
                        value={otp[index]}
                        onChangeText={(value) => handleOtpChange(index, value)}
                        keyboardType="number-pad"
                        maxLength={1}
                        textContentType="oneTimeCode"
                        editable={!loading}
                        selectTextOnFocus
                        onFocus={() => {
                          // Scroll to ensure OTP inputs are visible above keyboard
                          scrollViewRef.current?.scrollTo({ y: 180, animated: true });
                        }}
                        contextMenuHidden={true}
                        caretHidden={false}
                      />
                    </View>
                  ))}
                </View>
                
                <Text className="text-gray-400 text-xs text-center mt-4">
                  {otp.join('').length}/6 digits entered
                </Text>
              </View>

              {/* Resend OTP */}
              <View className="items-center mb-8">
                <Text className="text-gray-400 mb-2">
                  Didn`t receive the code?
                </Text>
                
                <TouchableOpacity
                  onPress={handleResendOTP}
                  disabled={!canResend || resendLoading || loading}
                  className={`flex-row items-center p-3 rounded-lg ${
                    canResend ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-gray-800/50'
                  }`}
                >
                  <RefreshCw 
                    size={16} 
                    color={canResend ? "#60A5FA" : "#9CA3AF"} 
                    style={resendLoading ? { transform: [{ rotate: '360deg' }] } : undefined}
                  />
                  <Text className={`ml-2 font-medium ${
                    canResend ? 'text-blue-400' : 'text-gray-400'
                  }`}>
                    {resendLoading ? 'Sending...' : `Resend OTP ${!canResend ? `(${timer}s)` : ''}`}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Large spacer to ensure buttons don't overlap content */}
              <View className="flex-1 min-h-[150]" />
            </View>

            {/* Verify Button - Fixed at bottom with dynamic padding */}
            <View 
              className="px-6 pt-6 border-t border-gray-800 bg-gray-900"
              style={{
                paddingBottom: Platform.OS === 'ios' 
                  ? Math.max(keyboardHeight + 30, 30) 
                  : 30
              }}
            >
              <TouchableOpacity
                className={`rounded-xl py-5 items-center justify-center ${
                  loading || !isFormValid
                    ? 'bg-blue-800/50'
                    : 'bg-blue-600'
                }`}
                onPress={handleVerify}
                disabled={loading || !isFormValid}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text className="text-white font-bold text-lg">
                      Verify & Continue
                    </Text>
                    <Text className="text-gray-300 text-sm mt-1">
                      Step 4 of 5 - Next: Terms & Security
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              
              {/* Back Button */}
              <TouchableOpacity
                className="mt-4 py-4 items-center justify-center"
                onPress={() => {
                  Keyboard.dismiss();
                  router.back();
                }}
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