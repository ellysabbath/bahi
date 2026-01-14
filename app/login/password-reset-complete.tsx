// app/login/password-reset-complete.tsx
import { router } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { 
  Animated, 
  Text, 
  View,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { passwordResetService } from './services/passwordResetService';

export default function PasswordResetCompleteScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Clear service data
    passwordResetService.clear();

    // Animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto redirect after 5 seconds
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    router.replace('/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <View className="flex-1 items-center justify-center px-6">
        <Animated.View 
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
          className="items-center w-full max-w-sm"
        >
          {/* Success Icon */}
          <View className="w-24 h-24 bg-green-500/20 rounded-full items-center justify-center mb-8 border-4 border-green-500/30">
            <CheckCircle size={48} color="#10B981" />
          </View>

          {/* Success Message */}
          <Text className="text-3xl font-bold text-white mb-4 text-center">
            Password Reset Successful!
          </Text>
          
          <Text className="text-gray-400 text-lg text-center mb-8">
            Your password has been updated successfully
          </Text>

          {/* Info Box */}
          <View className="bg-green-900/20 border border-green-800/30 rounded-xl p-4 mb-8 w-full">
            <Text className="text-green-300 text-center">
              ✅ You can now login with your new password
            </Text>
          </View>

          {/* Redirect Timer */}
          <View className="mb-8">
            <Text className="text-gray-500 text-sm text-center mb-2">
              Redirecting to login in:
            </Text>
            <View className="flex-row justify-center">
              <View className="w-10 h-10 bg-blue-500/20 rounded-full items-center justify-center mx-1">
                <Text className="text-blue-400 font-bold text-lg">5</Text>
              </View>
              <Text className="text-gray-400 text-lg self-center mx-2">seconds</Text>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            className="bg-blue-600 rounded-xl py-4 px-8 w-full items-center mb-4"
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-lg">
              Go to Login
            </Text>
            <Text className="text-blue-200 text-sm mt-1">
              Sign in with your new password
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}