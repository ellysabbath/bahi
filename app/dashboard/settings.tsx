import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';

interface SettingItem {
  id: number;
  title: string;
  description: string;
  icon: string;
  type: 'toggle' | 'button' | 'select';
  value?: boolean;
  action?: () => void;
}

// Format date for display
const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

export default function SettingsScreen() {
  const [settings, setSettings] = useState<SettingItem[]>([
    {
      id: 1,
      title: 'Dark Mode',
      description: 'Switch between light and dark theme',
      icon: 'moon',
      type: 'toggle',
      value: false,
    },
    {
      id: 2,
      title: 'Push Notifications',
      description: 'Receive service reminders and updates',
      icon: 'notifications',
      type: 'toggle',
      value: true,
    },
    {
      id: 3,
      title: 'Location Services',
      description: 'Find nearby garages automatically',
      icon: 'location',
      type: 'toggle',
      value: true,
    },
    {
      id: 4,
      title: 'Biometric Login',
      description: 'Use fingerprint or face ID',
      icon: 'fingerprint',
      type: 'toggle',
      value: false,
    },
    {
      id: 5,
      title: 'Auto Updates',
      description: 'Download updates automatically',
      icon: 'update',
      type: 'toggle',
      value: true,
    },
    {
      id: 6,
      title: 'Data Saver',
      description: 'Reduce data usage',
      icon: 'data-usage',
      type: 'toggle',
      value: false,
    },
  ]);
  
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const { user, logout } = useUser();

  const accountSettings = [
    {
      id: 7,
      title: 'Edit Profile',
      description: 'Update personal information',
      icon: 'account-edit',
      type: 'button',
      action: () => router.push('/dashboard/profile'),
    },
    {
      id: 8,
      title: 'Payment Methods',
      description: 'Manage cards and payment options',
      icon: 'credit-card',
      type: 'button',
      action: () => router.push('/dashboard/payments'),
    },
    {
      id: 9,
      title: 'Address Book',
      description: 'Saved service locations',
      icon: 'map-marker',
      type: 'button',
      action: () => router.push('/dashboard/addresses'),
    },
  ];

  const supportSettings = [
    {
      id: 10,
      title: 'Privacy Policy',
      description: 'How we protect your data',
      icon: 'shield-check',
      type: 'button',
      action: () => Linking.openURL('https://autofix.com/privacy'),
    },
    {
      id: 11,
      title: 'Terms of Service',
      description: 'App usage terms',
      icon: 'file-document',
      type: 'button',
      action: () => Linking.openURL('https://autofix.com/terms'),
    },
    {
      id: 12,
      title: 'Rate App',
      description: 'Share your experience',
      icon: 'star',
      type: 'button',
      action: () => Linking.openURL('https://play.google.com/store/apps/details?id=com.autofix'),
    },
    {
      id: 13,
      title: 'Clear Cache',
      description: 'Free up storage space',
      icon: 'delete',
      type: 'button',
      action: () => {
        Alert.alert('Clear Cache', 'This will remove temporary files.', [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Clear', 
            style: 'destructive', 
            onPress: () => {
              Alert.alert('Success', 'Cache cleared successfully');
            }
          },
        ]);
      },
    },
    {
      id: 14,
      title: 'Help Center',
      description: 'Get help and support',
      icon: 'help-circle',
      type: 'button',
      action: () => router.push('/dashboard/help'),
    },
  ];

  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
  const cardColor = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const textSecondaryColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';

  const getUserInitials = () => {
    if (!user || !user.fullname) return 'GU';
    
    const nameParts = user.fullname.trim().split(' ');
    if (nameParts.length === 0) return 'GU';
    
    const firstInitial = nameParts[0][0]?.toUpperCase() || '';
    const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1][0]?.toUpperCase() : '';
    
    return (firstInitial + lastInitial) || 'GU';
  };

  const getFullName = () => {
    if (!user || !user.fullname) return 'Guest User';
    return user.fullname.trim() || 'Guest User';
  };

  const getUserEmail = () => {
    if (!user) return 'guest@example.com';
    return user.email || 'No email provided';
  };

  const getMemberSince = () => {
    if (!user || !user.date_joined) return 'Member since: Unknown';
    const joinedDate = new Date(user.date_joined);
    return `Member since: ${joinedDate.getFullYear()}`;
  };

  const toggleSetting = (id: number) => {
    setSettings(settings.map(setting => {
      if (setting.id === id && setting.type === 'toggle') {
        const newValue = !setting.value;
        
        if (id === 1) {
          toggleTheme();
        }
        
        return { ...setting, value: newValue };
      }
      return setting;
    }));
  };

  const renderIcon = (iconName: string) => {
    const iconColor = theme === 'dark' ? '#60a5fa' : '#3b82f6';
    return <MaterialCommunityIcons name={iconName as any} size={24} color={iconColor} />;
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            await logout();
            router.replace('/login');
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View className="px-5 pt-5 pb-3">
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className={`text-3xl font-bold ${textColor}`}>Settings</Text>
            <Text className={`text-lg ${textSecondaryColor}`}>Customize your experience</Text>
          </View>
          <TouchableOpacity 
            className={`p-3 rounded-xl ${cardColor} shadow-lg`}
            onPress={() => router.push('/dashboard/profile')}
          >
            <Ionicons name="person-circle" size={28} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* User Profile Card */}
      <View className={`mx-5 mb-6 ${cardColor} rounded-2xl p-5 shadow-xl`}>
        <View className="flex-row items-center">
          <View className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 items-center justify-center mr-4">
            <Text className="text-green-900 text-2xl font-bold">{getUserInitials()}</Text>
          </View>
          <View className="flex-1">
            <Text className={`text-xl font-bold ${textColor}`}>{getFullName()}</Text>
            <Text className={textSecondaryColor}>{getUserEmail()}</Text>
            <Text className={`text-sm ${textSecondaryColor}`}>{getMemberSince()}</Text>
            
            {/* Account Status Badges */}
            <View className="flex-row flex-wrap gap-2 mt-2">
              {user?.is_verified && (
                <View className="px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <View className="flex-row items-center">
                    <Ionicons name="checkmark-circle" size={10} color="#34C759" />
                    <Text className="text-green-700 dark:text-green-400 text-xs font-semibold ml-1">
                      Verified
                    </Text>
                  </View>
                </View>
              )}
              
              {user?.is_staff && (
                <View className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <View className="flex-row items-center">
                    <Ionicons name="shield" size={10} color="#AF52DE" />
                    <Text className="text-purple-700 dark:text-purple-400 text-xs font-semibold ml-1">
                      Staff
                    </Text>
                  </View>
                </View>
              )}
              
              {user?.mobile_number && (
                <View className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <View className="flex-row items-center">
                    <Ionicons name="phone-portrait" size={10} color="#007AFF" />
                    <Text className="text-blue-700 dark:text-blue-400 text-xs font-semibold ml-1">
                      Mobile Verified
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity 
            className="bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 rounded-full"
            onPress={() => router.push('/dashboard/profile')}
          >
            <Text className="text-white font-semibold">View Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* App Settings */}
        <View className={`${cardColor} rounded-2xl p-1 mb-6 shadow-lg`}>
          <View className="p-4 border-b border-gray-200 dark:border-gray-700">
            <Text className={`text-lg font-bold ${textColor}`}>App Preferences</Text>
            <Text className={`text-sm ${textSecondaryColor}`}>Customize app behavior</Text>
          </View>
          
          {settings.map((setting) => (
            <TouchableOpacity
              key={setting.id}
              className="flex-row items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
              onPress={() => setting.type === 'toggle' && toggleSetting(setting.id)}
            >
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 items-center justify-center mr-3">
                  {renderIcon(setting.icon)}
                </View>
                <View className="flex-1">
                  <Text className={`font-semibold ${textColor}`}>{setting.title}</Text>
                  <Text className={`text-sm ${textSecondaryColor}`}>{setting.description}</Text>
                </View>
              </View>
              
              {setting.type === 'toggle' && (
                <Switch
                  value={setting.value}
                  onValueChange={() => toggleSetting(setting.id)}
                  trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                  thumbColor={setting.value ? '#ffffff' : '#ffffff'}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Account Settings */}
        <View className={`${cardColor} rounded-2xl p-1 mb-6 shadow-lg`}>
          <View className="p-4 border-b border-gray-200 dark:border-gray-700">
            <Text className={`text-lg font-bold ${textColor}`}>Account Settings</Text>
            <Text className={`text-sm ${textSecondaryColor}`}>Manage your account</Text>
          </View>
          
          {accountSettings.map((setting) => (
            <TouchableOpacity
              key={setting.id}
              className="flex-row items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
              onPress={setting.action}
            >
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 items-center justify-center mr-3">
                  {renderIcon(setting.icon)}
                </View>
                <View className="flex-1">
                  <Text className={`font-semibold ${textColor}`}>{setting.title}</Text>
                  <Text className={`text-sm ${textSecondaryColor}`}>{setting.description}</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={textSecondaryColor} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Support & Legal */}
        <View className={`${cardColor} rounded-2xl p-1 mb-6 shadow-lg`}>
          <View className="p-4 border-b border-gray-200 dark:border-gray-700">
            <Text className={`text-lg font-bold ${textColor}`}>Support & Legal</Text>
            <Text className={`text-sm ${textSecondaryColor}`}>Help and information</Text>
          </View>
          
          {supportSettings.map((setting) => (
            <TouchableOpacity
              key={setting.id}
              className="flex-row items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
              onPress={setting.action}
            >
              <View className="flex-row items-center flex-1">
                <View className={`w-10 h-10 rounded-xl ${
                  setting.id === 13 
                    ? 'bg-red-100 dark:bg-red-900/30' 
                    : setting.id === 14
                    ? 'bg-amber-100 dark:bg-amber-900/30'
                    : 'bg-purple-100 dark:bg-purple-900/30'
                } items-center justify-center mr-3`}>
                  {renderIcon(setting.icon)}
                </View>
                <View className="flex-1">
                  <Text className={`font-semibold ${textColor}`}>{setting.title}</Text>
                  <Text className={`text-sm ${textSecondaryColor}`}>{setting.description}</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={textSecondaryColor} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Account Information */}
        <View className={`${cardColor} rounded-2xl p-5 mb-6 shadow-lg`}>
          <View className="items-center mb-4">
            <View className="w-20 h-20 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 items-center justify-center mb-3">
              <Ionicons name="information-circle" size={36} color="white" />
            </View>
            <Text className={`text-2xl font-bold ${textColor}`}>Account Information</Text>
            <Text className={textSecondaryColor}>Your account details</Text>
          </View>
          
          <View className="space-y-3">
            {user?.id && (
              <View className="flex-row justify-between">
                <Text className={textSecondaryColor}>User ID</Text>
                <Text className={textColor} style={{ fontFamily: 'monospace' }}>
                  {user.id.substring(0, 8)}...
                </Text>
              </View>
            )}
            
            {user?.mobile_number && (
              <View className="flex-row justify-between">
                <Text className={textSecondaryColor}>Mobile Number</Text>
                <Text className={textColor}>{user.mobile_number}</Text>
              </View>
            )}
            
            {user?.membership_number && (
              <View className="flex-row justify-between">
                <Text className={textSecondaryColor}>Membership Number</Text>
                <Text className={textColor} style={{ fontFamily: 'monospace' }}>
                  {user.membership_number}
                </Text>
              </View>
            )}
            
            {user?.region && user?.district && (
              <View className="flex-row justify-between">
                <Text className={textSecondaryColor}>Location</Text>
                <Text className={textColor}>{user.region}, {user.district}</Text>
              </View>
            )}
            
            {user?.last_login && (
              <View className="flex-row justify-between">
                <Text className={textSecondaryColor}>Last Login</Text>
                <Text className={textColor}>{formatDate(user.last_login)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* App Info */}
        <View className={`${cardColor} rounded-2xl p-5 mb-6 shadow-lg`}>
          <View className="items-center mb-4">
            <View className="w-20 h-20 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 items-center justify-center mb-3">
              <FontAwesome5 name="tools" size={36} color="white" />
            </View>
            <Text className={`text-2xl font-bold ${textColor}`}>MhaziniApi</Text>
            <Text className={textSecondaryColor}>Version 3.2.0</Text>
          </View>
          
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className={textSecondaryColor}>Build Number</Text>
              <Text className={textColor}>2024.12.01</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className={textSecondaryColor}>Last Updated</Text>
              <Text className={textColor}>2 days ago</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className={textSecondaryColor}>Storage Used</Text>
              <Text className={textColor}>147 MB</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className={textSecondaryColor}>Account Status</Text>
              <Text className={`font-medium ${user?.is_active ? 'text-green-600' : 'text-red-600'}`}>
                {user?.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          className={`${cardColor} rounded-2xl p-4 mb-10 shadow-lg`}
          onPress={handleLogout}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
            <Text className="text-red-500 text-lg font-bold ml-3">Logout</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}