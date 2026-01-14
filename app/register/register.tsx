// app/register/index.tsx - SIMPLE SCROLLING VERSION
import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  Keyboard,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, EyeOff, Phone, Mail, User, Hash, MapPin, Lock, Shield } from 'lucide-react-native';
import { router } from 'expo-router';
import { authAPI, RegistrationData } from '../../services/authApi';

export default function RegisterScreen() {
  const [formData, setFormData] = useState<RegistrationData>({
    mobile_number: '',
    email: '',
    fullname: '',
    membership_number: '',
    password: '',
    confirm_password: '',
    region: '',
    district: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const scrollViewRef = useRef<ScrollView>(null);

  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Mobile number validation
    if (!formData.mobile_number.trim()) {
      newErrors.mobile_number = 'Mobile number is required';
    } else if (!authAPI.isValidTanzanianPhone(formData.mobile_number)) {
      newErrors.mobile_number = 'Please enter a valid Tanzanian mobile number';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!authAPI.isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Fullname validation
    if (!formData.fullname.trim()) {
      newErrors.fullname = 'Full name is required';
    }

    // Membership number validation
    if (!formData.membership_number.trim()) {
      newErrors.membership_number = 'Membership number is required';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!authAPI.isValidPassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Confirm password validation
    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Please confirm your password';
    } else if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    // Region validation
    if (!formData.region.trim()) {
      newErrors.region = 'Region is required';
    }

    // District validation
    if (!formData.district.trim()) {
      newErrors.district = 'District is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatPhoneInput = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    
    if (cleaned.startsWith('255')) {
      if (cleaned.length <= 3) return cleaned;
      if (cleaned.length <= 6) return `255 ${cleaned.substring(3)}`;
      if (cleaned.length <= 9) return `255 ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
      return `255 ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)} ${cleaned.substring(9, 12)}`;
    } else if (cleaned.startsWith('0')) {
      if (cleaned.length <= 4) return cleaned;
      if (cleaned.length <= 7) return `0${cleaned.substring(1, 4)} ${cleaned.substring(4)}`;
      return `0${cleaned.substring(1, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
    }
    
    return cleaned;
  };

  const handleMobileChange = (text: string) => {
    const formatted = formatPhoneInput(text);
    handleInputChange('mobile_number', formatted);
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await authAPI.registerUser(formData);
      
      if (response.success) {
        Alert.alert(
          'Registration Successful!',
          response.message,
          [
            {
              text: 'Verify Now',
              style: 'default',
              onPress: () => {
                const displayMobile = authAPI.formatPhoneForDisplay(formData.mobile_number);
                router.push({
                  pathname: '/login/verify',
                  params: { 
                    mobile_number: formData.mobile_number,
                    display_mobile: displayMobile
                  }
                });
              }
            }
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert('Registration Failed', response.message);
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Network error. Please try again.';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    Keyboard.dismiss();
    router.back();
  };

  const renderInput = (
    field: keyof RegistrationData,
    label: string,
    icon: React.ReactNode,
    placeholder: string,
    keyboardType: any = 'default',
    secureTextEntry: boolean = false
  ) => {
    const hasError = errors[field];
    
    return (
      <View className="mb-5" key={field}>
        <Text className="text-gray-700 text-sm font-medium mb-2 ml-1">
          {label}
        </Text>
        <View className={`
          flex-row items-center rounded-2xl px-4 py-3 border-2 
          ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'}
        `}>
          {icon}
          <TextInput
            className={`flex-1 ml-3 text-base ${hasError ? 'text-red-800' : 'text-gray-800'}`}
            placeholder={placeholder}
            placeholderTextColor={hasError ? "#FCA5A5" : "#9CA3AF"}
            keyboardType={keyboardType}
            autoCapitalize={field.includes('name') ? 'words' : 'none'}
            autoCorrect={false}
            value={formData[field]}
            onChangeText={(text) => {
              if (field === 'mobile_number') {
                handleMobileChange(text);
              } else if (field === 'email') {
                handleInputChange(field, text.toLowerCase());
              } else {
                handleInputChange(field, text);
              }
            }}
            editable={!loading}
            secureTextEntry={secureTextEntry}
            style={{ 
              height: 24,
              includeFontPadding: false,
              paddingVertical: 0
            }}
          />
          {(field === 'password' || field === 'confirm_password') && (
            <TouchableOpacity 
              onPress={() => field === 'password' ? setShowPassword(!showPassword) : setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
              className="ml-2"
            >
              {(field === 'password' && showPassword) || (field === 'confirm_password' && showConfirmPassword) ? (
                <EyeOff size={20} color={hasError ? "#EF4444" : "#6B7280"} />
              ) : (
                <Eye size={20} color={hasError ? "#EF4444" : "#6B7280"} />
              )}
            </TouchableOpacity>
          )}
        </View>
        {errors[field] && (
          <Text className="text-red-500 text-xs mt-1 ml-1">{errors[field]}</Text>
        )}
      </View>
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />
      
      {/* Simple Blue Header */}
      <View className="bg-blue-600 pt-12 pb-4 px-6">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity 
            onPress={handleBack} 
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-3"
            disabled={loading}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-white">Create Account</Text>
            <Text className="text-blue-100 text-sm">Join our community</Text>
          </View>
          <Shield size={24} color="#FFFFFF" />
        </View>
        
        {/* Simple Progress */}
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-white items-center justify-center mr-2">
            <Text className="text-blue-600 font-bold">1</Text>
          </View>
          <Text className="text-white text-sm mr-2">Registration</Text>
          <View className="w-6 h-1 bg-white/50 rounded-full mr-2" />
          <View className="w-8 h-8 rounded-full bg-white/30 items-center justify-center mr-2">
            <Text className="text-white/60 font-bold">2</Text>
          </View>
          <Text className="text-white/60 text-sm">Verification</Text>
        </View>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ 
          paddingHorizontal: 20,
          paddingVertical: 20,
          paddingBottom: 100 // Extra padding for bottom content
        }}
        showsVerticalScrollIndicator={true}
        bounces={true}
        keyboardShouldPersistTaps="handled"
        className="flex-1 bg-gray-50"
      >
        {/* Personal Information Card */}
        <View className="bg-white rounded-xl p-5 mb-5 shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-4">Personal Information</Text>
          
          {/* Mobile & Email Row */}
          <View className="flex-row mb-4">
            <View className="flex-1 mr-2">
              {renderInput('mobile_number', 'Mobile Number', 
                <Phone size={20} color={errors.mobile_number ? "#EF4444" : "#6B7280"} />, 
                '0712 345 678', 'phone-pad')}
            </View>
            <View className="flex-1 ml-2">
              {renderInput('email', 'Email Address', 
                <Mail size={20} color={errors.email ? "#EF4444" : "#6B7280"} />, 
                'email@example.com', 'email-address')}
            </View>
          </View>

          {/* Full Name */}
          {renderInput('fullname', 'Full Name', 
            <User size={20} color={errors.fullname ? "#EF4444" : "#6B7280"} />, 
            'John Doe')}

          {/* Membership Number */}
          {renderInput('membership_number', 'Membership Number', 
            <Hash size={20} color={errors.membership_number ? "#EF4444" : "#6B7280"} />, 
            'ABC123456')}

          {/* Region & District */}
          <View className="flex-row mb-4">
            <View className="flex-1 mr-2">
              {renderInput('region', 'Region', 
                <MapPin size={20} color={errors.region ? "#EF4444" : "#6B7280"} />, 
                'e.g. Dar es Salaam')}
            </View>
            <View className="flex-1 ml-2">
              {renderInput('district', 'District', 
                <MapPin size={20} color={errors.district ? "#EF4444" : "#6B7280"} />, 
                'e.g. Ilala')}
            </View>
          </View>

          {/* Password Section */}
          <View className="mb-2">
            {renderInput('password', 'Password', 
              <Lock size={20} color={errors.password ? "#EF4444" : "#6B7280"} />, 
              'Minimum 8 characters', 'default', !showPassword)}
            
            {renderInput('confirm_password', 'Confirm Password', 
              <Lock size={20} color={errors.confirm_password ? "#EF4444" : "#6B7280"} />, 
              'Re-enter password', 'default', !showConfirmPassword)}
          </View>
        </View>

        {/* Password Requirements */}
        <View className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
          <Text className="text-blue-700 font-medium mb-3">Password Requirements:</Text>
          <View className="space-y-2">
            <View className="flex-row items-center">
              <View className={`w-2 h-2 rounded-full mr-3 ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-gray-400'}`} />
              <Text className={`text-sm ${formData.password.length >= 8 ? 'text-gray-700' : 'text-gray-500'}`}>
                At least 8 characters
              </Text>
            </View>
            <View className="flex-row items-center">
              <View className={`w-2 h-2 rounded-full mr-3 ${formData.password === formData.confirm_password && formData.confirm_password.length > 0 ? 'bg-green-500' : 'bg-gray-400'}`} />
              <Text className={`text-sm ${formData.password === formData.confirm_password && formData.confirm_password.length > 0 ? 'text-gray-700' : 'text-gray-500'}`}>
                Passwords must match
              </Text>
            </View>
          </View>
        </View>

        {/* Verification Info */}
        <View className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-5">
          <View className="flex-row items-start">
            <View className="bg-blue-500 p-2 rounded-lg mr-3">
              <Mail size={18} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-blue-800 font-medium mb-1">Verification Required</Text>
              <Text className="text-blue-700 text-sm">
                A 6-digit code will be sent to your mobile and email for verification.
              </Text>
            </View>
          </View>
        </View>

        {/* Terms & Conditions */}
        <View className="bg-white border border-gray-200 rounded-xl p-4 mb-8">
          <Text className="text-gray-600 text-sm text-center">
            By creating an account, you agree to our{' '}
            <Text className="text-blue-600 font-medium">Terms</Text> and{' '}
            <Text className="text-blue-600 font-medium">Privacy Policy</Text>.
          </Text>
        </View>

        {/* Extra Spacer for Scrolling */}
        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Fixed Bottom Section */}
      <View className="bg-white border-t border-gray-200 pt-4 pb-6 px-6">
        {/* Register Button */}
        <TouchableOpacity
          className={`
            rounded-xl py-4 items-center justify-center mb-3
            ${loading ? 'bg-blue-400' : 'bg-blue-600'}
          `}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text className="text-white font-bold text-lg">Create Account</Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <TouchableOpacity
          className="py-3 items-center mb-4"
          onPress={handleBack}
          disabled={loading}
        >
          <Text className="text-gray-600 text-base">
            Already registered? <Text className="text-blue-600 font-medium">Sign In</Text>
          </Text>
        </TouchableOpacity>

        {/* MhaziniApi System Footer */}
        <View className="pt-4 border-t border-gray-300">
          <View className="flex-row items-center justify-center">
            <Shield size={18} color="#3B82F6" className="mr-2" />
            <Text className="text-blue-700 font-bold">MhaziniApi System</Text>
          </View>
          <Text className="text-center text-gray-500 text-xs mt-1">
            Secure Authentication Platform © 2024
          </Text>
        </View>
      </View>
    </>
  );
}