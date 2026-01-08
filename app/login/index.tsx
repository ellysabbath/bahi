// app/login/index.tsx
import { Link, router, useLocalSearchParams } from "expo-router";
import { Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useUser } from "../../context/UserContext";
import { authApi, type LoginData, type LoginResponse } from "../../lib/api/loginApi";

export default function LoginScreen() {
  const params = useLocalSearchParams();
  const { setUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [formData, setFormData] = useState({
    email: (params.email as string) || "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Check if screen is small
  const isSmallScreen = screenHeight < 700;
  const isVerySmallScreen = screenHeight < 600;
  
  // Get responsive scale factor
  const getScaleFactor = () => {
    if (screenHeight < 600) return 0.8;
    if (screenHeight < 700) return 0.9;
    if (screenHeight < 800) return 0.95;
    return 1;
  };
  
  const scaleFactor = getScaleFactor();

  // Refs
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Fixed useEffect dependencies
  useEffect(() => {
    // Show registration success message if redirected from registration
    if (params.registration_complete === 'true') {
      Alert.alert(
        '✅ Registration Complete!',
        (params.message as string) || 'Your account has been created successfully. Please login.',
        [{ text: 'OK' }]
      );
    }

    // Keyboard listeners
    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      // Scroll to input when keyboard appears
      setTimeout(() => {
        if (passwordInputRef.current?.isFocused()) {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }
      }, 100);
    });
    
    const keyboardDidHide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });

    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, [params.message, params.registration_complete]);

  const validateEmail = (email: string): string => {
    if (!email.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const validateForm = (): boolean => {
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    
    setErrors({
      email: emailError,
      password: passwordError,
    });

    return !emailError && !passwordError;
  };

  // JWT Login Handler - USING NEW AUTH API
  const handleLogin = async () => {
    Keyboard.dismiss();
    
    // Clear previous errors
    setErrors({ email: '', password: '' });
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const requestData: LoginData = {
        email: formData.email.trim(),
        password: formData.password,
      };
      
      console.log('🔐 Attempting JWT login...');
      
      const response: LoginResponse = await authApi.login(requestData);
      console.log('📥 Login Response:', response);
      
      if (response.success && response.access && response.user) {
        console.log('✅ JWT Login successful!');
        console.log('🔑 Access Token:', response.access.substring(0, 20) + '...');
        
        // Store the JWT token in UserContext
        await setUser(response.user, response.access);
        
        // Navigate to dashboard based on role - USING CORRECT NESTED LAYOUT PATHS
        if (response.user.is_admin || response.user.role === 'admin') {
          // Navigate to admin dashboard
          router.replace('/dashboard');
        } else if (response.user.is_mechanic) {
          // Navigate to mechanic bookings
          router.replace('/dashboard');
        } else if (response.user.is_garage_owner) {
          // Navigate to dashboard services
          router.replace('/dashboard');
        } else {
          // Navigate to dashboard services for regular users
          router.replace('/dashboard');
        }
        
        // Clear password field
        setFormData(prev => ({ ...prev, password: '' }));
        
      } else {
        console.error('❌ Login failed:', response.error);
        
        // Update error states
        if (response.error?.toLowerCase().includes('email') || 
            response.error?.toLowerCase().includes('not found')) {
          setErrors(prev => ({ ...prev, email: response.error! }));
        } else if (response.error?.toLowerCase().includes('password') || 
                   response.error?.toLowerCase().includes('invalid') ||
                   response.error?.toLowerCase().includes('incorrect')) {
          setErrors(prev => ({ ...prev, password: response.error! }));
        }
        
        // Show appropriate alert
        if (response.error?.includes('Email not registered')) {
          Alert.alert(
            'Account Not Found',
            'This email is not registered. Would you like to create an account?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Sign Up', 
                onPress: () => router.push('/register') 
              }
            ]
          );
        } else if (response.error?.includes('Email not verified')) {
          Alert.alert(
            'Email Not Verified',
            'Please verify your email before logging in.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Resend Verification', 
                onPress: () => handleResendVerification() 
              }
            ]
          );
        } else {
          Alert.alert('Login Failed', response.error || 'Invalid email or password. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('❌ Unexpected login error:', error);
      Alert.alert(
        'Connection Error',
        'Unable to connect to the server. Please check your internet connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    Alert.alert('Info', 'Verification email functionality coming soon.');
  };

  const handleEmailChange = (text: string) => {
    setFormData({ ...formData, email: text });
    if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
  };

  const handlePasswordChange = (text: string) => {
    setFormData({ ...formData, password: text });
    if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleEmailSubmit = () => {
    passwordInputRef.current?.focus();
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Responsive values based on screen height
  const getResponsiveSize = (base: number) => Math.round(base * scaleFactor);

  return (
    <SafeAreaView className="flex-1 bg-gray-900 pt-safe">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? (isSmallScreen ? 20 : 40) : 20}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View className="flex-1">
            {/* Animated Background */}
            <View className="absolute inset-0 bg-gray-900" />
            
            <ScrollView
              ref={scrollViewRef}
              contentContainerClassName="flex-grow px-5 pb-6"
              contentContainerStyle={{
                paddingTop: isSmallScreen ? 20 : 30,
                paddingBottom: keyboardVisible ? 30 : 20,
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
              keyboardDismissMode="on-drag"
            >
              {/* Header Section */}
              <Animated.View 
                entering={FadeIn.delay(100)}
                className="items-center mb-8"
              >
                <View className="mb-6">
                  <View 
                    className={`
                      ${isVerySmallScreen ? 'w-24 h-24 rounded-full' : 
                        isSmallScreen ? 'w-28 h-28 rounded-full' : 
                        'w-32 h-32 rounded-full'}
                      bg-white justify-center items-center overflow-hidden
                      border-4 border-white/20
                      shadow-lg shadow-blue-500/30
                    `}
                    style={{
                      elevation: 8,
                    }}
                  >
                    <Image
                      source={require('../../assets/images/QUICKFIXAUTOMOTIVELOGOWHT.png')}
                      className={`
                        ${isVerySmallScreen ? 'w-20 h-20' : 
                          isSmallScreen ? 'w-24 h-24' : 
                          'w-28 h-28'}
                      `}
                      resizeMode="contain"
                    />
                  </View>
                </View>
                
                <Animated.Text 
                  entering={FadeInDown.delay(200)}
                  className={`
                    ${isSmallScreen ? 'text-2xl' : 'text-3xl'}
                    font-bold text-white mb-2 text-center
                  `}
                >
                  Welcome Back
                </Animated.Text>
                <Animated.Text
                  entering={FadeInDown.delay(300)}
                  className={`
                    ${isSmallScreen ? 'text-sm' : 'text-base'}
                    text-gray-300 text-center
                  `}
                >
                  Sign in to access your account
                </Animated.Text>
              </Animated.View>

              {/* Login Card - ENLARGED */}
              <Animated.View
                entering={FadeInDown.delay(400)}
                className={`
                  bg-gray-800/90 rounded-2xl
                  ${isSmallScreen ? 'p-5 mb-6' : 'p-6 mb-8'}
                  border border-gray-700/50
                  shadow-xl shadow-black/30
                `}
                style={{
                  elevation: 8,
                }}
              >
                {/* Email Field - ENLARGED */}
                <Animated.View 
                  entering={FadeInDown.delay(500)}
                  className={`
                    ${isSmallScreen ? 'mb-5' : 'mb-6'}
                  `}
                >
                  <Text className={`
                    ${isSmallScreen ? 'text-xs' : 'text-sm'}
                    text-gray-300 font-semibold mb-2 ml-1
                  `}>
                    Email Address
                  </Text>
                  <View
                    className={`
                      flex-row items-center rounded-xl px-4
                      border-2
                      ${errors.email ? 'border-red-500 bg-red-500/10' : 'border-gray-600 bg-gray-900/50'}
                      ${isSmallScreen ? 'h-14' : 'h-16'}
                    `}
                  >
                    <Mail
                      size={isSmallScreen ? 18 : 20}
                      color={errors.email ? "#EF4444" : "#9CA3AF"}
                    />
                    <TextInput
                      ref={emailInputRef}
                      placeholder="you@example.com"
                      placeholderTextColor="#6B7280"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      value={formData.email}
                      onChangeText={handleEmailChange}
                      onSubmitEditing={handleEmailSubmit}
                      returnKeyType="next"
                      editable={!loading}
                      className="flex-1 ml-3 text-white"
                      style={{
                        fontSize: isSmallScreen ? 16 : 18,
                        paddingVertical: 0,
                        includeFontPadding: false,
                      }}
                      cursorColor="#3B82F6"
                      selectionColor="#3B82F6"
                      textContentType="emailAddress"
                      autoCorrect={false}
                      spellCheck={false}
                    />
                  </View>
                  {errors.email && (
                    <Text className={`
                      ${isSmallScreen ? 'text-xs' : 'text-sm'}
                      text-red-400 mt-1.5 ml-2
                    `}>
                      ⚠ {errors.email}
                    </Text>
                  )}
                </Animated.View>

                {/* Password Field - ENLARGED */}
                <Animated.View 
                  entering={FadeInDown.delay(600)}
                  className={`
                    ${isSmallScreen ? 'mb-5' : 'mb-6'}
                  `}
                >
                  <Text className={`
                    ${isSmallScreen ? 'text-xs' : 'text-sm'}
                    text-gray-300 font-semibold mb-2 ml-1
                  `}>
                    Password
                  </Text>
                  <View
                    className={`
                      flex-row items-center rounded-xl px-4
                      border-2
                      ${errors.password ? 'border-red-500 bg-red-500/10' : 'border-gray-600 bg-gray-900/50'}
                      ${isSmallScreen ? 'h-14' : 'h-16'}
                    `}
                  >
                    <Lock
                      size={isSmallScreen ? 18 : 20}
                      color={errors.password ? "#EF4444" : "#9CA3AF"}
                    />
                    <TextInput
                      ref={passwordInputRef}
                      placeholder="••••••••"
                      secureTextEntry={!showPassword}
                      placeholderTextColor="#6B7280"
                      value={formData.password}
                      onChangeText={handlePasswordChange}
                      onSubmitEditing={handleLogin}
                      returnKeyType="done"
                      editable={!loading}
                      className="flex-1 ml-3 text-white"
                      style={{
                        fontSize: isSmallScreen ? 16 : 18,
                        paddingVertical: 0,
                        includeFontPadding: false,
                      }}
                      cursorColor="#3B82F6"
                      selectionColor="#3B82F6"
                      textContentType="password"
                      autoCorrect={false}
                      spellCheck={false}
                    />
                    <TouchableOpacity
                      onPress={togglePasswordVisibility}
                      className="ml-2 p-1"
                      disabled={loading}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {showPassword ? (
                        <EyeOff 
                          size={isSmallScreen ? 18 : 20} 
                          color="#9CA3AF" 
                        />
                      ) : (
                        <Eye 
                          size={isSmallScreen ? 18 : 20} 
                          color="#9CA3AF" 
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                  {errors.password && (
                    <Text className={`
                      ${isSmallScreen ? 'text-xs' : 'text-sm'}
                      text-red-400 mt-1.5 ml-2
                    `}>
                      ⚠ {errors.password}
                    </Text>
                  )}
                </Animated.View>

                {/* Forgot Password Link */}
                <Animated.View 
                  entering={FadeInDown.delay(700)}
                  className={`
                    ${isSmallScreen ? 'mb-5' : 'mb-6'}
                  `}
                >
                  <Link href="/login/forgot-password" asChild>
                    <TouchableOpacity
                      className="self-end"
                      disabled={loading}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text className={`
                        ${isSmallScreen ? 'text-xs' : 'text-sm'}
                        text-blue-400 font-semibold
                      `}>
                        Forgot Password?
                      </Text>
                    </TouchableOpacity>
                  </Link>
                </Animated.View>

                {/* Sign In Button - ENLARGED */}
                <Animated.View entering={FadeInDown.delay(800)}>
                  <TouchableOpacity
                    className={`
                      rounded-xl items-center justify-center overflow-hidden
                      ${loading ? 'bg-blue-800' : 'bg-blue-600'}
                      ${isSmallScreen ? 'h-14' : 'h-16'}
                      shadow-lg shadow-blue-500/30
                    `}
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.8}
                    style={{
                      elevation: 6,
                    }}
                  >
                    <View className="flex-row items-center justify-center">
                      {loading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Text className={`
                            text-white font-bold
                            ${isSmallScreen ? 'text-base' : 'text-lg'}
                            mr-2
                          `}>
                            Sign In
                          </Text>
                          <View className="w-0.5 h-5 bg-white/30 rounded" />
                          <Text className={`
                            text-white/90 font-semibold
                            ${isSmallScreen ? 'text-xs' : 'text-sm'}
                            ml-2
                          `}>
                            Continue
                          </Text>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>

                {/* Sign Up Link */}
                <Animated.View
                  entering={FadeInDown.delay(900)}
                  className={`
                    flex-row justify-center items-center
                    ${isSmallScreen ? 'mt-5 pt-4' : 'mt-6 pt-5'}
                    border-t border-gray-700/50
                  `}
                >
                  <Text className={`
                    ${isSmallScreen ? 'text-xs' : 'text-sm'}
                    text-gray-400
                  `}>
                    Don`t have an account?{" "}
                  </Text>
                  <Link href="/register" asChild>
                    <TouchableOpacity 
                      disabled={loading} 
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text className={`
                        ${isSmallScreen ? 'text-xs' : 'text-sm'}
                        text-blue-400 font-bold
                      `}>
                        Create Account
                      </Text>
                    </TouchableOpacity>
                  </Link>
                </Animated.View>
              </Animated.View>

              {/* Extra spacing when keyboard is visible */}
              {keyboardVisible && (
                <View className={isSmallScreen ? 'h-20' : 'h-32'} />
              )}
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}