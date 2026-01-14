// app/register/verify.tsx
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Clock, Phone, Mail, CheckCircle } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
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
  ActivityIndicator,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authAPI } from '../../services/authApi';

export default function VerifyAccountScreen() {
  const params = useLocalSearchParams();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 minutes
  const [verificationMethod, setVerificationMethod] = useState<'sms' | 'email'>('sms');
  
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const mobileNumber = params.mobile_number as string || '';
  const displayMobile = params.display_mobile as string || mobileNumber;

  useEffect(() => {
    Keyboard.dismiss();

    // Auto-focus first OTP input
    const focusTimer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);

    // Start countdown
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(focusTimer);
      clearInterval(interval);
    };
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    
    // Handle backspace
    if (value === '') {
      newOtp[index] = '';
      setOtp(newOtp);
      if (index > 0) {
        setTimeout(() => {
          inputRefs.current[index - 1]?.focus();
        }, 10);
      }
      return;
    }
    
    // Handle paste
    if (value.length > 1) {
      const pastedOtp = value.split('').slice(0, 6);
      pastedOtp.forEach((char, i) => {
        if (index + i < 6) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      
      const lastIndex = Math.min(index + pastedOtp.length - 1, 5);
      setTimeout(() => {
        inputRefs.current[lastIndex]?.focus();
      }, 10);
      return;
    }
    
    // Single digit entry
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 10);
    }
    
    // Auto submit if all fields filled
    if (newOtp.every(digit => digit !== '') && index === 5) {
      setTimeout(() => {
        handleSubmit();
      }, 100);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        setTimeout(() => {
          inputRefs.current[index - 1]?.focus();
        }, 10);
      }
    }
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError('');
    
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    if (!/^\d{6}$/.test(otpCode)) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.verifyAccount(mobileNumber, otpCode);
      
      if (response.success) {
        setSuccess(true);
        
        // Animate success
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
        
        // Auto redirect after 3 seconds
        setTimeout(() => {
          router.replace({
            pathname: '/dashboard',
            params: { 
              access_token: response.access_token,
              user: JSON.stringify(response.user)
            }
          });
        }, 3000);
      } else {
        setError(response.message);
        Alert.alert('Error', response.message);
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to verify account';
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

  const clearOtp = () => {
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  const isFormValid = otp.every(digit => digit !== '');

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

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
                  <Text className="text-2xl font-bold text-white">Verify Account</Text>
                  <Text className="text-gray-400 text-sm">
                    Enter the code sent to your mobile/email
                  </Text>
                </View>
              </View>

              {/* Mobile Number Display */}
              <View className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700/50">
                <View className="flex-row items-center mb-3">
                  <Phone size={18} color="#60A5FA" className="mr-3" />
                  <View className="flex-1">
                    <Text className="text-gray-400 text-sm mb-1">Mobile Number:</Text>
                    <Text className="text-white font-medium">{displayMobile}</Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <Mail size={18} color="#60A5FA" className="mr-3" />
                  <View className="flex-1">
                    <Text className="text-gray-400 text-sm mb-1">Verification Code sent via:</Text>
                    <View className="flex-row space-x-4">
                      <TouchableOpacity 
                        className={`px-3 py-1 rounded-lg ${verificationMethod === 'sms' ? 'bg-blue-600' : 'bg-gray-700'}`}
                        onPress={() => setVerificationMethod('sms')}
                        disabled={loading}
                      >
                        <Text className="text-white text-sm">SMS</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        className={`px-3 py-1 rounded-lg ${verificationMethod === 'email' ? 'bg-blue-600' : 'bg-gray-700'}`}
                        onPress={() => setVerificationMethod('email')}
                        disabled={loading}
                      >
                        <Text className="text-white text-sm">Email</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Success Animation */}
            {success && (
              <Animated.View 
                style={{ opacity: fadeAnim }}
                className="px-6 mb-6"
              >
                <View className="bg-green-900/20 border border-green-800/30 rounded-xl p-4 items-center">
                  <CheckCircle size={40} color="#10B981" className="mb-2" />
                  <Text className="text-green-300 text-lg font-bold mb-1">Account Verified!</Text>
                  <Text className="text-green-200 text-center">
                    Your account has been successfully verified. Redirecting...
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* OTP Input Fields */}
            {!success && (
              <View className="px-6 mb-6">
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
                        ref={(ref) => { inputRefs.current[index] = ref; }}
                        className="text-white text-2xl font-bold text-center w-full"
                        keyboardType="number-pad"
                        maxLength={1}
                        value={otp[index]}
                        onChangeText={(value) => handleOtpChange(value, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        editable={!loading && !success}
                        selectTextOnFocus
                        contextMenuHidden={true}
                      />
                    </View>
                  ))}
                </View>

                {/* Clear Button */}
                <TouchableOpacity 
                  onPress={clearOtp}
                  disabled={loading || success}
                  className="self-end mb-4"
                >
                  <Text className="text-blue-400 text-sm font-medium">
                    Clear All
                  </Text>
                </TouchableOpacity>

                {/* Countdown Timer */}
                <View className="flex-row items-center justify-center mb-2">
                  <Clock size={16} color="#9CA3AF" className="mr-2" />
                  <Text className="text-gray-400 text-sm">
                    Code expires in:{' '}
                    <Text className="text-amber-400 font-bold">
                      {formatTime(countdown)}
                    </Text>
                  </Text>
                </View>
              </View>
            )}

            {/* Error Display */}
            {error ? (
              <View className="px-6 mb-8">
                <View className="bg-red-900/20 border border-red-800/30 rounded-xl p-3">
                  <Text className="text-red-300 text-sm">{error}</Text>
                </View>
              </View>
            ) : null}

            {/* Info Box */}
            {!success && (
              <View className="px-6 mb-8">
                <View className="bg-blue-900/20 border border-blue-800/30 rounded-xl p-4">
                  <Text className="text-blue-300 text-sm">
                    📱 The verification code was sent to both your mobile number and email address.
                  </Text>
                  <Text className="text-blue-200 text-xs mt-2">
                    Check both SMS and email for the code.
                  </Text>
                </View>
              </View>
            )}

            <View className="flex-1" />
          </ScrollView>

          {/* Fixed Button Section */}
          {!success && (
            <View className="px-6 pb-6 pt-4 border-t border-gray-800 bg-gray-900">
              <TouchableOpacity
                className={`rounded-xl py-4 items-center justify-center ${
                  loading || !isFormValid ? 'bg-blue-800/50' : 'bg-blue-600'
                }`}
                onPress={handleSubmit}
                disabled={loading || !isFormValid || success}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-bold text-lg">
                    Verify Account
                  </Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                className="mt-4 py-3 items-center"
                onPress={handleBack}
                disabled={loading || success}
              >
                <Text className="text-gray-400 text-base">
                  Back to Registration
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Success Redirect Timer */}
          {success && (
            <View className="px-6 pb-6 pt-4 border-t border-green-800/30 bg-gray-900">
              <View className="items-center">
                <Text className="text-gray-400 text-sm mb-2">
                  Redirecting to home page in:
                </Text>
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-green-500/20 rounded-full items-center justify-center mx-1">
                    <Text className="text-green-400 font-bold text-lg">3</Text>
                  </View>
                  <Text className="text-gray-400 mx-2">seconds</Text>
                </View>
                
                <TouchableOpacity
                  className="mt-6 bg-green-600 rounded-xl py-3 px-8 w-full items-center"
                  onPress={() => router.replace('/dashboard')}
                >
                  <Text className="text-white font-bold">Go to Home Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}