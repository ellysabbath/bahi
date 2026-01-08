// app/dashboard/payments/index.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';

// Type definition
type PaymentMethodType = 'card' | 'mobile_money' | 'bank_transfer' | 'cash';

interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  provider: string;
  display_name: string;
  account_number: string;
  status: 'active' | 'inactive';
  is_default: boolean;
}

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  
  // Static payment methods data
  const paymentMethods: PaymentMethod[] = [
    {
      id: '1',
      type: 'card',
      provider: 'Visa',
      display_name: 'Primary Visa Card',
      account_number: '•••• •••• •••• 4242',
      status: 'active',
      is_default: true,
    },
    {
      id: '2',
      type: 'mobile_money',
      provider: 'M-Pesa',
      display_name: 'M-Pesa Wallet',
      account_number: '0765 ••• 456',
      status: 'active',
      is_default: false,
    },
    {
      id: '3',
      type: 'mobile_money',
      provider: 'Airtel Money',
      display_name: 'Airtel Money',
      account_number: '0789 ••• 654',
      status: 'active',
      is_default: false,
    },
    {
      id: '4',
      type: 'bank_transfer',
      provider: 'CRDB Bank',
      display_name: 'CRDB Savings',
      account_number: '015 •••••• 7890',
      status: 'active',
      is_default: false,
    },
    {
      id: '5',
      type: 'card',
      provider: 'Mastercard',
      display_name: 'Mastercard',
      account_number: '•••• •••• •••• 1234',
      status: 'inactive',
      is_default: false,
    },
  ];

  // Theme colors
  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
  const cardColor = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const textSecondaryColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  const primaryColor = '#3b82f6';
  const successColor = '#10b981';
  const inactiveColor = '#6b7280';

  // Get payment method icon
  const getPaymentIcon = (type: PaymentMethodType, provider?: string) => {
    switch (type) {
      case 'card':
        if (provider?.toLowerCase().includes('visa')) {
          return <FontAwesome5 name="cc-visa" size={32} color={primaryColor} />;
        } else if (provider?.toLowerCase().includes('mastercard')) {
          return <FontAwesome5 name="cc-mastercard" size={32} color="#FF5F00" />;
        } else {
          return <FontAwesome5 name="credit-card" size={32} color={primaryColor} />;
        }
      case 'mobile_money':
        if (provider?.toLowerCase().includes('m-pesa')) {
          return <MaterialCommunityIcons name="cellphone" size={32} color={successColor} />;
        } else if (provider?.toLowerCase().includes('airtel')) {
          return <MaterialCommunityIcons name="cellphone-android" size={32} color="#E62B2B" />;
        } else {
          return <MaterialIcons name="smartphone" size={32} color={primaryColor} />;
        }
      case 'bank_transfer':
        return <FontAwesome5 name="university" size={28} color="#8b5cf6" />;
      case 'cash':
        return <FontAwesome5 name="money-bill-wave" size={28} color="#f59e0b" />;
      default:
        return <MaterialIcons name="payment" size={32} color={primaryColor} />;
    }
  };

  // Get payment method type display name
  const getPaymentTypeDisplay = (type: PaymentMethodType): string => {
    switch (type) {
      case 'card': return 'Credit/Debit Card';
      case 'mobile_money': return 'Mobile Money';
      case 'bank_transfer': return 'Bank Transfer';
      case 'cash': return 'Cash Payment';
      default: return 'Payment Method';
    }
  };

  // Get status badge style
  const getStatusBadgeStyle = (status: string) => {
    if (status === 'active') {
      return {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-800 dark:text-green-300',
        dot: 'bg-green-500',
      };
    } else {
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-600 dark:text-gray-400',
        dot: 'bg-gray-400',
      };
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View className={`px-6 pt-8 pb-4 ${cardColor} shadow-sm ${borderColor} border-b`}>
        <View className="flex-row items-center mb-4">
          <TouchableOpacity 
            className="mr-4"
            onPress={() => router.back()}
          >
            <Ionicons 
              name="arrow-back" 
              size={28} 
              color={theme === 'dark' ? '#fff' : '#000'} 
            />
          </TouchableOpacity>
          
          <View className="flex-1">
            <Text className={`text-2xl font-bold ${textColor}`}>
              Payment Methods
            </Text>
            <Text className={`${textSecondaryColor} mt-1`}>
              Manage your payment options
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Info Card */}
        <View className={`mx-6 mt-6 p-5 ${cardColor} rounded-2xl shadow-sm ${borderColor} border`}>
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center mr-3">
              <Ionicons name="information-circle" size={22} color={primaryColor} />
            </View>
            <Text className={`font-bold text-lg ${textColor}`}>
              Payment Information
            </Text>
          </View>
          
          <Text className={`${textSecondaryColor} leading-6`}>
            Your saved payment methods are displayed here. 
            Choose a default method for faster checkout on your next booking.
          </Text>
        </View>

        {/* Payment Methods List */}
        <View className="mx-6 mt-6">
          <Text className={`text-lg font-semibold mb-4 ${textColor}`}>
            Saved Payment Methods ({paymentMethods.length})
          </Text>
          
          {paymentMethods.map((method) => {
            const statusStyle = getStatusBadgeStyle(method.status);
            
            return (
              <View 
                key={method.id}
                className={`${cardColor} rounded-2xl p-5 mb-4 shadow-sm ${borderColor} border ${
                  method.is_default ? 'border-blue-300 dark:border-blue-700 border-2' : ''
                }`}
              >
                {/* Method Header */}
                <View className="flex-row justify-between items-center mb-4">
                  <View className="flex-row items-center">
                    {getPaymentIcon(method.type, method.provider)}
                    <View className="ml-4">
                      <Text className={`font-bold text-lg ${textColor}`}>
                        {method.display_name}
                      </Text>
                      <Text className={`${textSecondaryColor}`}>
                        {getPaymentTypeDisplay(method.type)}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Default Badge */}
                  {method.is_default && (
                    <View className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                        DEFAULT
                      </Text>
                    </View>
                  )}
                </View>
                
                {/* Method Details */}
                <View className="space-y-3">
                  <View className="flex-row items-center">
                    <Ionicons 
                      name="card" 
                      size={18} 
                      color={textSecondaryColor} 
                    />
                    <Text className={`ml-2 ${textColor}`}>
                      {method.account_number}
                    </Text>
                  </View>
                  
                  <View className="flex-row items-center">
                    <Ionicons 
                      name="business" 
                      size={18} 
                      color={textSecondaryColor} 
                    />
                    <Text className={`ml-2 ${textColor}`}>
                      {method.provider}
                    </Text>
                  </View>
                  
                  <View className="flex-row justify-between items-center mt-3 pt-3 border-t ${borderColor}">
                    <View className="flex-row items-center">
                      <View 
                        className={`w-2 h-2 rounded-full mr-2 ${statusStyle.dot}`}
                      />
                      <Text className={`${statusStyle.text} font-medium`}>
                        {method.status.toUpperCase()}
                      </Text>
                    </View>
                    
                    {method.is_default ? (
                      <View className="flex-row items-center">
                        <Ionicons name="checkmark-circle" size={20} color={successColor} />
                        <Text className="ml-1 text-green-600 dark:text-green-400 font-medium">
                          Default payment
                        </Text>
                      </View>
                    ) : (
                      <Text className={`${textSecondaryColor}`}>
                        Not default
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Supported Payment Methods */}
        <View className={`mx-6 mt-8 p-5 ${cardColor} rounded-2xl shadow-sm ${borderColor} border`}>
          <Text className={`font-bold text-lg mb-4 ${textColor}`}>
            Supported Payment Methods
          </Text>
          
          <View className="space-y-4">
            {/* Cards */}
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 items-center justify-center mr-4">
                <FontAwesome5 name="credit-card" size={24} color={primaryColor} />
              </View>
              <View className="flex-1">
                <Text className={`font-semibold ${textColor}`}>
                  Credit/Debit Cards
                </Text>
                <Text className={`text-sm ${textSecondaryColor}`}>
                  Visa, Mastercard, American Express
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color={successColor} />
            </View>
            
            {/* Mobile Money */}
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 items-center justify-center mr-4">
                <MaterialCommunityIcons name="cellphone" size={24} color={successColor} />
              </View>
              <View className="flex-1">
                <Text className={`font-semibold ${textColor}`}>
                  Mobile Money
                </Text>
                <Text className={`text-sm ${textSecondaryColor}`}>
                  M-Pesa, Airtel Money, Tigo Pesa
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color={successColor} />
            </View>
            
            {/* Bank Transfer */}
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 items-center justify-center mr-4">
                <FontAwesome5 name="university" size={24} color="#8b5cf6" />
              </View>
              <View className="flex-1">
                <Text className={`font-semibold ${textColor}`}>
                  Bank Transfer
                </Text>
                <Text className={`text-sm ${textSecondaryColor}`}>
                  All Tanzanian banks
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color={successColor} />
            </View>
          </View>
        </View>

        {/* Help Section */}
        <View className={`mx-6 mt-8 p-5 ${cardColor} rounded-2xl shadow-sm ${borderColor} border`}>
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center mr-3">
              <Ionicons name="help-circle" size={22} color={primaryColor} />
            </View>
            <Text className={`font-bold text-lg ${textColor}`}>
              Need Help?
            </Text>
          </View>
          
          <Text className={`${textSecondaryColor} mb-4`}>
            If you encounter any issues with your payment methods, please contact our support team.
          </Text>
          
          <TouchableOpacity 
            className={`flex-row items-center justify-between p-3 ${borderColor} border rounded-xl`}
            onPress={() => router.push('/dashboard/help')}
          >
            <View className="flex-row items-center">
              <Ionicons name="chatbubble-ellipses" size={22} color={primaryColor} />
              <Text className={`ml-3 ${textColor} font-medium`}>
                Contact Support
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}