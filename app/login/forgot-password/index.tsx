// app/login/forgot-password.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { passwordResetService } from '../services/passwordResetService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [resetState, setResetState] = useState(passwordResetService.getState());
  const [loading, setLoading] = useState(false);
  const [autoRedirectTimer, setAutoRedirectTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Check if screen is small
  const isSmallScreen = SCREEN_HEIGHT < 700;
  
  // Get responsive scale factor
  const getScaleFactor = () => {
    if (SCREEN_HEIGHT < 600) return 0.8; // Very small screens
    if (SCREEN_HEIGHT < 700) return 0.85; // Small screens
    if (SCREEN_HEIGHT < 800) return 0.9; // Medium screens
    return 0.95; // Large screens
  };
  
  const scaleFactor = getScaleFactor();

  // Create animation function with proper dependencies
  const runSuccessAnimation = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  // Clear any existing timers
  const clearTimers = useCallback(() => {
    if (autoRedirectTimer) {
      clearTimeout(autoRedirectTimer);
      setAutoRedirectTimer(null);
    }
  }, [autoRedirectTimer]);

  const showSuccessMessage = useCallback(() => {
    setShowSuccessModal(true);
    runSuccessAnimation();

    // Clear any existing timers
    clearTimers();

    // Set up auto navigation after 5 seconds
    const timerId = setTimeout(() => {
      router.push({
        pathname: '/login/password-reset-otp-verify',
        params: { 
          email,
          resetToken: resetState.resetToken || '' 
        }
      });
    }, 5000); // 5 seconds auto-redirect

    setAutoRedirectTimer(timerId);
  }, [email, resetState.resetToken, runSuccessAnimation, clearTimers]);

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = passwordResetService.subscribe((state) => {
      setResetState(state);
    });

    // Dismiss keyboard on mount
    Keyboard.dismiss();

    // Cleanup on unmount
    return () => {
      unsubscribe();
      clearTimers();
    };
  }, [clearTimers]);

  // Check for successful OTP send
  useEffect(() => {
    if (resetState.otpSent && !showSuccessModal) {
      showSuccessMessage();
    }
  }, [resetState.otpSent, showSuccessModal, showSuccessMessage]);

  const handleSubmit = async () => {
    // Dismiss keyboard first
    Keyboard.dismiss();

    // Validation
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await passwordResetService.requestOTP(email);
      
      if (!response.success) {
        Alert.alert('Error', response.message || 'Failed to send OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    Keyboard.dismiss();
    router.back();
  };

  const handleManualNavigate = () => {
    // Just navigate without hiding the modal
    Keyboard.dismiss();
    
    // Clear auto-redirect timer since we're navigating manually
    clearTimers();
    
    // Navigate immediately
    router.push({
      pathname: '/login/password-reset-otp-verify',
      params: { 
        email,
        resetToken: resetState.resetToken || '' 
      }
    });
    
    // Don't hide the modal - let it stay visible during navigation
    // The modal will be automatically dismissed when component unmounts
  };

  const isFormValid = email.trim() !== '';
  const isLoading = loading || resetState.isLoading;

  // Responsive values based on screen height
  const getResponsiveSize = (base: number) => Math.round(base * scaleFactor);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#111827', paddingTop: Platform.OS === 'android' ? 10 : 0 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? (isSmallScreen ? 20 : 40) : 20}
          style={{ flex: 1 }}
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{ 
              flexGrow: 1,
              paddingHorizontal: 20,
              paddingVertical: 15,
              paddingBottom: 20,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Header - Compact */}
            <View style={{ marginBottom: getResponsiveSize(12) }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: getResponsiveSize(8) }}>
                <TouchableOpacity 
                  onPress={handleBack} 
                  style={{
                    width: getResponsiveSize(36),
                    height: getResponsiveSize(36),
                    borderRadius: getResponsiveSize(18),
                    backgroundColor: '#1F2937',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                  disabled={isLoading}
                >
                  <ArrowLeft size={getResponsiveSize(18)} color="#60A5FA" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: getResponsiveSize(20),
                    fontWeight: 'bold',
                    color: 'white',
                    marginBottom: 2,
                  }}>
                    Forgot Password
                  </Text>
                  <Text style={{
                    fontSize: getResponsiveSize(12),
                    color: '#9CA3AF',
                  }}>
                    Enter your email to reset your password
                  </Text>
                </View>
              </View>
            </View>

            {/* Form - Compact */}
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: getResponsiveSize(16),
                fontWeight: '600',
                color: 'white',
                marginBottom: 4,
              }}>
                Reset Your Password
              </Text>
              <Text style={{
                fontSize: getResponsiveSize(12),
                color: '#9CA3AF',
                marginBottom: getResponsiveSize(16),
              }}>
                We`ll send a verification code to your email
              </Text>

              {/* Email Input - Compact */}
              <View style={{ marginBottom: getResponsiveSize(12) }}>
                <Text style={{
                  fontSize: getResponsiveSize(12),
                  color: '#D1D5DB',
                  fontWeight: '500',
                  marginBottom: 6,
                }}>
                  Email Address
                </Text>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#1F2937',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: isLoading ? '#4B5563' : '#374151',
                }}>
                  <Mail size={getResponsiveSize(16)} color={isLoading ? "#6B7280" : "#9CA3AF"} />
                  <TextInput
                    placeholder="john.doe@example.com"
                    placeholderTextColor="#6B7280"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                    editable={!isLoading}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    style={{
                      flex: 1,
                      marginLeft: 10,
                      fontSize: getResponsiveSize(14),
                      color: "#FFFFFF",
                      paddingVertical: 0,
                    }}
                    cursorColor="#3B82F6"
                    selectionColor="#3B82F6"
                  />
                </View>
              </View>

              {/* Error Display - Compact */}
              {resetState.error && (
                <View style={{
                  backgroundColor: 'rgba(127, 29, 29, 0.3)',
                  borderWidth: 1,
                  borderColor: 'rgba(185, 28, 28, 0.5)',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: getResponsiveSize(12),
                }}>
                  <Text style={{ color: '#FCA5A5', fontSize: getResponsiveSize(12) }}>
                    {resetState.error}
                  </Text>
                </View>
              )}


                          {/* Button Section - Compact */}
            <View style={{ 
              paddingTop: getResponsiveSize(12),
              borderTopWidth: 1,
              borderTopColor: '#374151',
            }}>
              <TouchableOpacity
                style={{
                  borderRadius: 12,
                  paddingVertical: getResponsiveSize(14),
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isLoading || !isFormValid ? 'rgba(30, 64, 175, 0.5)' : '#3B82F6',
                }}
                onPress={handleSubmit}
                disabled={isLoading || !isFormValid}
                activeOpacity={0.8}
              >
                <Text style={{
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: getResponsiveSize(14),
                }}>
                  {isLoading ? 'Sending...' : 'Send Verification Code'}
                </Text>
                <Text style={{
                  color: '#D1D5DB',
                  fontSize: getResponsiveSize(11),
                  marginTop: 4,
                }}>
                  We`ll email you a 6-digit code
                </Text>
              </TouchableOpacity>

              {/* Back Button - Compact */}
              <TouchableOpacity
                style={{ paddingVertical: getResponsiveSize(12), alignItems: 'center', marginTop: 8 }}
                onPress={handleBack}
                disabled={isLoading}
              >
                <Text style={{
                  color: '#9CA3AF',
                  fontSize: getResponsiveSize(13),
                }}>
                  Back to Sign In
                </Text>
              </TouchableOpacity>
            </View>



              {/* Spacer */}
              <View style={{ flex: 1, minHeight: getResponsiveSize(20) }} />
            </View>


          </ScrollView>
        </KeyboardAvoidingView>

        {/* Success Modal - Compact */}
        <Modal
          visible={showSuccessModal}
          transparent={true}
          animationType="fade"
          statusBarTranslucent={true}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <Animated.View 
              style={{
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
                backgroundColor: '#1F2937',
                borderRadius: 20,
                padding: getResponsiveSize(20),
                alignItems: 'center',
                width: '100%',
                maxWidth: 400,
              }}
            >
              {/* Success Icon - Compact */}
              <View style={{
                width: getResponsiveSize(60),
                height: getResponsiveSize(60),
                backgroundColor: '#10B981',
                borderRadius: getResponsiveSize(30),
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: getResponsiveSize(12),
              }}>
                <CheckCircle size={getResponsiveSize(30)} color="#FFFFFF" />
              </View>

              {/* Success Message - Compact */}
              <Text style={{
                fontSize: getResponsiveSize(18),
                fontWeight: 'bold',
                color: 'white',
                marginBottom: 8,
                textAlign: 'center',
              }}>
                Code Sent Successfully!
              </Text>
              
              <Text style={{
                fontSize: getResponsiveSize(12),
                color: '#9CA3AF',
                textAlign: 'center',
                marginBottom: getResponsiveSize(12),
              }}>
                A 6-digit verification code has been sent to your email.
              </Text>

              {/* Email Display - Compact */}
              <View style={{
                backgroundColor: '#111827',
                borderRadius: 12,
                padding: 12,
                width: '100%',
                marginBottom: getResponsiveSize(12),
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={getResponsiveSize(14)} color="#60A5FA" style={{ marginRight: 8 }} />
                  <Text style={{ color: 'white', fontWeight: '500', fontSize: getResponsiveSize(13) }}>
                    {email}
                  </Text>
                </View>
              </View>

              {/* Manual Navigate Button - Compact */}
              <TouchableOpacity
                style={{
                  backgroundColor: '#3B82F6',
                  borderRadius: 12,
                  paddingVertical: getResponsiveSize(12),
                  paddingHorizontal: getResponsiveSize(16),
                  width: '100%',
                  alignItems: 'center',
                  marginBottom: getResponsiveSize(8),
                }}
                onPress={handleManualNavigate}
                activeOpacity={0.8}
              >
                <Text style={{
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: getResponsiveSize(14),
                }}>
                  Continue to Verification
                </Text>
                <Text style={{
                  color: '#93C5FD',
                  fontSize: getResponsiveSize(11),
                  marginTop: 4,
                }}>
                  Enter the verification code
                </Text>
              </TouchableOpacity>

              {/* Countdown - Compact */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{
                  fontSize: getResponsiveSize(11),
                  color: '#9CA3AF',
                }}>
                  Auto-redirecting in{' '}
                  <Text style={{ color: '#60A5FA', fontWeight: 'bold' }}>5</Text> seconds...
                </Text>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}