// app/login/index.tsx
import { Link, router, useLocalSearchParams } from "expo-router";
import { Eye, EyeOff, Lock, Phone } from "lucide-react-native";
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
import { useUser } from "../context/UserContext";
// app/login/index.tsx - Change this line
import authApi, { type LoginData, type LoginResponse } from "../lib/api/loginApi"; // ✅ Correct
export default function LoginScreen() {
  const params = useLocalSearchParams();
  const { setUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [formData, setFormData] = useState({
    mobile_number: (params.email as string) || "",
    password: "",
  });
  const [errors, setErrors] = useState({
    mobile_number: "",
    password: "",
  });

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  const isSmallScreen = screenHeight < 700;
  const isVerySmallScreen = screenHeight < 600;
  
  const getScaleFactor = () => {
    if (screenHeight < 600) return 0.8;
    if (screenHeight < 700) return 0.9;
    if (screenHeight < 800) return 0.95;
    return 1;
  };
  
  const scaleFactor = getScaleFactor();

  const mobileInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-redirect check on component mount
  useEffect(() => {
    const checkAutoRedirect = async () => {
      try {
        console.log('🔍 Checking for existing auth session...');
        
        const authStatus = await authApi.checkAuthStatus();
        
        if (authStatus.success && 
            authStatus.is_authenticated && 
            authStatus.should_redirect_to_dashboard &&
            authStatus.user &&
            authStatus.access) {
          
          console.log('✅ User already authenticated, auto-redirecting to dashboard...');
          
          await setUser(authStatus.user, authStatus.access);
          
          // Auto-redirect to dashboard
          setTimeout(() => {
            router.replace('/dashboard');
          }, 300);
        } else {
          console.log('🔐 No valid session found, showing login screen');
        }
      } catch (error) {
        console.log('⚠️ Auth check error:', error);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAutoRedirect();
  }, []);

  useEffect(() => {
    if (params.registration_complete === 'true') {
      Alert.alert(
        '✅ Registration Complete!',
        (params.message as string) || 'Your account has been created successfully. Please login.',
        [{ text: 'OK' }]
      );
    }

    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
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

  const validateMobileNumber = (mobile: string): string => {
    if (!mobile.trim()) return 'Mobile number is required';
    
    // Remove any spaces or special characters
    const cleaned = mobile.replace(/\D/g, '');
    
    // Check if it starts with 0 or 255
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      return ''; // Valid Tanzanian number starting with 0
    }
    
    if (cleaned.startsWith('255') && cleaned.length === 12) {
      return ''; // Valid Tanzanian number with country code
    }
    
    if (cleaned.length === 9) {
      return ''; // Valid without leading 0
    }
    
    return 'Please enter a valid Tanzanian mobile number (e.g., 0712345678 or 255712345678)';
  };

  const validatePassword = (password: string): string => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const validateForm = (): boolean => {
    const mobileError = validateMobileNumber(formData.mobile_number);
    const passwordError = validatePassword(formData.password);
    
    setErrors({
      mobile_number: mobileError,
      password: passwordError,
    });

    return !mobileError && !passwordError;
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    
    setErrors({ mobile_number: '', password: '' });
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Normalize mobile number format for Django
      let mobileNumber = formData.mobile_number.replace(/\D/g, '');
      
      // Convert to Django expected format: 255XXXXXXXXX
      if (mobileNumber.startsWith('0')) {
        mobileNumber = '255' + mobileNumber.substring(1);
      } else if (mobileNumber.length === 9) {
        mobileNumber = '255' + mobileNumber;
      }
      // If it's already 255XXXXXXXXX, leave it as is
      
      // FIXED: Use the correct LoginData structure
      const requestData: LoginData = {
        mobile_number: mobileNumber, // Correct field name
        password: formData.password,
      };
      
      console.log('🔐 Attempting login with mobile:', mobileNumber);
      
      const response: LoginResponse = await authApi.login(requestData);
      console.log('📥 Login Response:', response);
      
      if (response.success && response.access && response.user) {
        console.log('✅ Login successful!');
        
        await setUser(response.user, response.access);
        
        // Navigate to dashboard
        router.replace('/dashboard');
        
        // Clear password field
        setFormData(prev => ({ ...prev, password: '' }));
        
      } else {
        console.error('❌ Login failed:', response.error);
        
        if (response.error?.toLowerCase().includes('mobile') || 
            response.error?.toLowerCase().includes('not found')) {
          setErrors(prev => ({ ...prev, mobile_number: response.error! }));
        } else if (response.error?.toLowerCase().includes('password') || 
                   response.error?.toLowerCase().includes('invalid')) {
          setErrors(prev => ({ ...prev, password: response.error! }));
        }
        
        if (response.error?.includes('not registered')) {
          Alert.alert(
            'Account Not Found',
            'This mobile number is not registered. Would you like to create an account?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Sign Up', 
                onPress: () => router.push('/register') 
              }
            ]
          );
        } else if (response.error?.includes('not verified')) {
          Alert.alert(
            'Account Not Verified',
            'Please verify your account before logging in.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Resend Verification', 
                onPress: () => handleResendVerification() 
              }
            ]
          );
        } else {
          Alert.alert('Login Failed', response.error || 'Invalid mobile number or password.');
        }
      }
    } catch (error: any) {
      console.error('❌ Unexpected login error:', error);
      Alert.alert(
        'Connection Error',
        error.message || 'Unable to connect to the server. Please check your internet connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    Alert.alert('Info', 'Verification functionality coming soon.');
  };

  const handleMobileChange = (text: string) => {
    setFormData({ ...formData, mobile_number: text });
    if (errors.mobile_number) setErrors(prev => ({ ...prev, mobile_number: '' }));
  };

  const handlePasswordChange = (text: string) => {
    setFormData({ ...formData, password: text });
    if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleMobileSubmit = () => {
    passwordInputRef.current?.focus();
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  if (checkingAuth) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
        <View className="items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-white mt-4 text-lg">Checking authentication...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-900 pt-safe">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? (isSmallScreen ? 20 : 40) : 20}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View className="flex-1">
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
                      source={require('../assets/images/image.png')}
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
                  Sign in with your mobile number
                </Animated.Text>
              </Animated.View>

              {/* Login Card */}
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
                {/* Mobile Number Field */}
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
                    Mobile Number
                  </Text>
                  <View
                    className={`
                      flex-row items-center rounded-xl px-4
                      border-2
                      ${errors.mobile_number ? 'border-red-500 bg-red-500/10' : 'border-gray-600 bg-gray-900/50'}
                      ${isSmallScreen ? 'h-14' : 'h-16'}
                    `}
                  >
                    <Phone
                      size={isSmallScreen ? 18 : 20}
                      color={errors.mobile_number ? "#EF4444" : "#9CA3AF"}
                    />
                    <TextInput
                      ref={mobileInputRef}
                      placeholder="0712345678 or 255712345678"
                      placeholderTextColor="#6B7280"
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      autoComplete="tel"
                      value={formData.mobile_number}
                      onChangeText={handleMobileChange}
                      onSubmitEditing={handleMobileSubmit}
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
                      textContentType="telephoneNumber"
                      autoCorrect={false}
                      spellCheck={false}
                      maxLength={15}
                    />
                  </View>
                  {errors.mobile_number && (
                    <Text className={`
                      ${isSmallScreen ? 'text-xs' : 'text-sm'}
                      text-red-400 mt-1.5 ml-2
                    `}>
                      ⚠ {errors.mobile_number}
                    </Text>
                  )}
                </Animated.View>

                {/* Password Field */}
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

                {/* Sign In Button */}
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
                  <Link href="/register/register" asChild>
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