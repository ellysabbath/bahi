// app/login/password-reset-complete.tsx
import { router } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';
import React, { useEffect, useRef, useCallback } from 'react';
import { 
  Animated, 
  Text, 
  View, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { passwordResetService } from './services/passwordResetService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PasswordResetCompleteScreen() {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const fadeInAnim = useRef(new Animated.Value(0)).current;

  // Create animation function to avoid dependency issues
  const runSuccessAnimations = useCallback(() => {
    // Sequential animations for better effect
    Animated.sequence([
      // First: Scale and opacity of check icon
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
      ]),
      // Then: Fade in the text content
      Animated.timing(fadeInAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim, fadeInAnim]);

  // Cleanup function for redirect timer
  const setupRedirect = useCallback(() => {
    const redirectTimer = setTimeout(() => {
      router.replace('/login');
    }, 3000);

    return () => clearTimeout(redirectTimer);
  }, []);

  useEffect(() => {
    // Dismiss any open keyboard when screen loads
    Keyboard.dismiss();

    // Run success animations
    runSuccessAnimations();

    // Reset service state
    passwordResetService.reset();

    // Setup redirect timer
    const cleanupRedirect = setupRedirect();

    // Cleanup function
    return () => {
      cleanupRedirect();
    };
  }, [runSuccessAnimations, setupRedirect]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView className="flex-1 bg-gray-900">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ 
              flexGrow: 1,
              minHeight: SCREEN_HEIGHT,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View className="flex-1 items-center justify-center px-6">
              {/* Animated Icon Container */}
              <Animated.View 
                style={{
                  transform: [{ scale: scaleAnim }],
                  opacity: opacityAnim,
                }}
                className="items-center"
              >
                {/* Success Icon */}
                <View className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full items-center justify-center mb-8">
                  <CheckCircle size={48} color="#FFFFFF" />
                </View>
              </Animated.View>

              {/* Animated Content Container */}
              <Animated.View
                style={{
                  opacity: fadeInAnim,
                  transform: [
                    {
                      translateY: fadeInAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                }}
                className="w-full items-center"
              >
                {/* Success Message */}
                <Text className="text-3xl font-bold text-white mb-4 text-center">
                  Password Reset Successful!
                </Text>
                
                <Text className="text-gray-400 text-lg text-center mb-6">
                  Your password has been reset successfully
                </Text>

                {/* Security Note */}
                <View className="bg-green-900/20 border border-green-800/30 rounded-xl p-4 mb-6 w-full">
                  <Text className="text-green-300 text-sm text-center">
                    ✅ You can now login with your new password
                  </Text>
                  <Text className="text-green-200 text-xs text-center mt-1">
                    Please use your updated credentials to sign in
                  </Text>
                </View>

                {/* Action Steps */}
                <View className="bg-gray-800/50 rounded-xl p-4 mb-8 w-full">
                  <Text className="text-gray-300 text-sm font-medium mb-2">
                    Next Steps:
                  </Text>
                  <View className="space-y-2">
                    <View className="flex-row items-start">
                      <Text className="text-green-400 mr-2">1.</Text>
                      <Text className="text-gray-400 text-sm flex-1">
                        Go to login screen
                      </Text>
                    </View>
                    <View className="flex-row items-start">
                      <Text className="text-green-400 mr-2">2.</Text>
                      <Text className="text-gray-400 text-sm flex-1">
                        Enter your email and new password
                      </Text>
                    </View>
                    <View className="flex-row items-start">
                      <Text className="text-green-400 mr-2">3.</Text>
                      <Text className="text-gray-400 text-sm flex-1">
                        Access your account securely
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Countdown Timer */}
                <View className="items-center mb-8">
                  <Text className="text-gray-500 text-sm text-center mb-2">
                    Auto-redirect in:
                  </Text>
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-blue-500/20 rounded-full items-center justify-center mx-1">
                      <Text className="text-blue-400 font-bold text-lg">3</Text>
                    </View>
                    <Text className="text-gray-400 mx-2">seconds</Text>
                  </View>
                </View>

                {/* Manual Login Button */}
                <TouchableWithoutFeedback
                  onPress={() => router.replace('/login')}
                >
                  <View className="bg-blue-600 rounded-xl py-4 px-8 mb-4 w-full items-center">
                    <Text className="text-white font-bold text-lg">
                      Go to Login
                    </Text>
                    <Text className="text-blue-200 text-sm mt-1">
                      Continue to sign in page
                    </Text>
                  </View>
                </TouchableWithoutFeedback>

                {/* Spacer for keyboard */}
                <View className="h-20" />
              </Animated.View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}