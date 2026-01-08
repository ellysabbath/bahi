import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons
} from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ProfileField {
  id: number;
  label: string;
  value: string;
  icon: string;
  editable: boolean;
  type: 'text' | 'email' | 'phone' | 'date';
}

interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: string;
  license: string;
  image: string;
}

export default function ProfileScreen() {
  const [profileImage, setProfileImage] = useState<string>('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileField[]>([
    { id: 1, label: 'Full Name', value: 'John Doe', icon: 'account', editable: true, type: 'text' },
    { id: 2, label: 'Email', value: 'john.doe@example.com', icon: 'email', editable: true, type: 'email' },
    { id: 3, label: 'Phone', value: '+1 (555) 123-4567', icon: 'phone', editable: true, type: 'phone' },
    { id: 4, label: 'Join Date', value: 'January 15, 2023', icon: 'calendar', editable: false, type: 'date' },
    { id: 5, label: 'Membership', value: 'Pro Member', icon: 'crown', editable: false, type: 'text' },
    { id: 6, label: 'Location', value: 'New York, NY', icon: 'map-marker', editable: true, type: 'text' },
  ]);
  const [vehicles] = useState<Vehicle[]>([
    { id: 1, make: 'Toyota', model: 'Camry', year: '2022', license: 'ABC-123', image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&h=300&fit=crop' },
    { id: 2, make: 'Honda', model: 'CR-V', year: '2020', license: 'XYZ-789', image: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=300&fit=crop' },
  ]);
  const [notifications, setNotifications] = useState({
    serviceReminders: true,
    promotions: false,
    securityAlerts: true,
    newsUpdates: true,
  });
  const { theme } = useTheme();
  const router = useRouter();

  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
  const cardColor = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const textSecondaryColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'Allow access to photos to change profile picture');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleFieldChange = (id: number, value: string) => {
    setProfileData(profileData.map(field => 
      field.id === id ? { ...field, value } : field
    ));
  };

  const handleSave = () => {
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully');
  };

  const addNewVehicle = () => {
    Alert.alert('Add Vehicle', 'Vehicle management feature coming soon!');
  };

  const handleVehiclePress = (vehicle: Vehicle) => {
    Alert.alert(
      `${vehicle.make} ${vehicle.model}`,
      `Year: ${vehicle.year}\nLicense: ${vehicle.license}`,
      [{ text: 'OK' }]
    );
  };

  const handleAccountAction = (action: string) => {
    const actions = {
      'Privacy & Security': 'Privacy settings would open here',
      'Payment Methods': 'Payment methods management would open here',
      'Service History': 'Your service history would display here',
      'Documents': 'Your documents would display here'
    };
    
    Alert.alert(action, actions[action as keyof typeof actions] || 'Feature coming soon!');
  };

  const stats = [
    { label: 'Services Booked', value: '24', icon: 'wrench' as const, color: '#3b82f6' },
    { label: 'Total Spent', value: '$1,850', icon: 'cash' as const, color: '#10b981' },
    { label: 'Garages Visited', value: '8', icon: 'garage' as const, color: '#8b5cf6' },
    { label: 'Ratings Given', value: '18', icon: 'star' as const, color: '#f59e0b' },
  ];

  // Fixed icon names - using correct icon packages
  const accountActions = [
    { label: 'Privacy & Security', icon: 'security' as const, iconColor: '#3b82f6', iconPackage: 'MaterialIcons' as const },
    { label: 'Payment Methods', icon: 'card' as const, iconColor: '#10b981', iconPackage: 'Ionicons' as const },
    { label: 'Service History', icon: 'history' as const, iconColor: '#8b5cf6', iconPackage: 'MaterialIcons' as const },
    { label: 'Documents', icon: 'document-text' as const, iconColor: '#f59e0b', iconPackage: 'Ionicons' as const },
  ];

  // Helper function to render icons based on their package
  const renderIcon = (iconPackage: string, iconName: string, color: string, size: number = 24) => {
    switch (iconPackage) {
      case 'MaterialIcons':
        return <MaterialIcons name={iconName as any} size={size} color={color} />;
      case 'Ionicons':
        return <Ionicons name={iconName as any} size={size} color={color} />;
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />;
      default:
        return <Ionicons name="information-circle" size={size} color={color} />;
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View className={`px-5 pt-5 pb-3 ${bgColor}`}>
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color={textColor} />
          </TouchableOpacity>
          <Text className={`text-2xl font-bold ${textColor}`}>My Profile</Text>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            <Text className={`text-lg font-semibold ${isEditing ? 'text-blue-500' : textColor}`}>
              {isEditing ? 'Cancel' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="items-center px-5 mb-8">
          <TouchableOpacity 
            onPress={isEditing ? pickImage : undefined} 
            disabled={!isEditing}
            activeOpacity={isEditing ? 0.7 : 1}
          >
            <View className="relative">
              <Image
                source={{ uri: profileImage }}
                className="w-32 h-32 rounded-full"
              />
              {isEditing && (
                <View className="absolute bottom-2 right-2 w-10 h-10 bg-blue-500 rounded-full items-center justify-center border-2 border-white">
                  <Ionicons name="camera" size={20} color="white" />
                </View>
              )}
            </View>
          </TouchableOpacity>
          
          <Text className={`text-2xl font-bold mt-4 ${textColor}`}>John Doe</Text>
          <Text className={`${textSecondaryColor} mt-1`}>Pro Member since 2023</Text>
          
          <View className="flex-row space-x-3 mt-4">
            <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-full">
              <Text className="text-white font-semibold">Active</Text>
            </TouchableOpacity>
            <TouchableOpacity className="border border-blue-500 px-4 py-2 rounded-full">
              <Text className="text-blue-500 font-semibold">Verified</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View className="px-5 mb-8">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
            <View className="flex-row space-x-4">
              {stats.map((stat, index) => (
                <View key={index} className={`w-40 ${cardColor} rounded-2xl p-4 shadow-lg ${borderColor} border`}>
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className={`text-2xl font-bold ${textColor}`}>{stat.value}</Text>
                      <Text className={`text-sm ${textSecondaryColor} mt-1`}>{stat.label}</Text>
                    </View>
                    <View className="w-12 h-12 rounded-xl items-center justify-center" 
                      style={{ backgroundColor: `${stat.color}20` }}>
                      <MaterialCommunityIcons name={stat.icon} size={28} color={stat.color} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Profile Form */}
        <View className={`mx-5 mb-8 ${cardColor} rounded-2xl p-5 shadow-xl ${borderColor} border`}>
          <Text className={`text-xl font-bold mb-6 ${textColor}`}>Personal Information</Text>
          
          <View className="space-y-4">
            {profileData.map((field) => (
              <View key={field.id} className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-900 items-center justify-center mr-3">
                  <MaterialCommunityIcons name={field.icon as any} size={22} color={textSecondaryColor} />
                </View>
                <View className="flex-1">
                  <Text className={`text-sm ${textSecondaryColor}`}>{field.label}</Text>
                  {isEditing && field.editable ? (
                    <TextInput
                      className={`${textColor} text-lg font-medium border-b ${borderColor} py-2`}
                      value={field.value}
                      onChangeText={(value) => handleFieldChange(field.id, value)}
                      keyboardType={
                        field.type === 'email' ? 'email-address' :
                        field.type === 'phone' ? 'phone-pad' :
                        'default'
                      }
                      editable={field.editable}
                    />
                  ) : (
                    <Text className={`text-lg font-medium ${textColor}`}>{field.value}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
          
          {isEditing && (
            <TouchableOpacity 
              className="mt-6 bg-gradient-to-r from-blue-500 to-indigo-500 py-4 rounded-xl items-center"
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-lg">Save Changes</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* My Vehicles */}
        <View className={`mx-5 mb-8 ${cardColor} rounded-2xl p-5 shadow-xl ${borderColor} border`}>
          <View className="flex-row items-center justify-between mb-6">
            <Text className={`text-xl font-bold ${textColor}`}>My Vehicles</Text>
            <TouchableOpacity 
              className="bg-blue-500 px-4 py-2 rounded-full"
              onPress={addNewVehicle}
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold">+ Add Vehicle</Text>
            </TouchableOpacity>
          </View>
          
          {vehicles.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
              <View className="flex-row space-x-4">
                {vehicles.map((vehicle) => (
                  <TouchableOpacity 
                    key={vehicle.id} 
                    className="w-48"
                    onPress={() => handleVehiclePress(vehicle)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{ uri: vehicle.image }}
                      className="w-full h-32 rounded-xl mb-3"
                    />
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className={`font-bold ${textColor}`}>
                          {vehicle.make} {vehicle.model}
                        </Text>
                        <Text className={`text-sm ${textSecondaryColor}`}>
                          {vehicle.year} • {vehicle.license}
                        </Text>
                      </View>
                      <TouchableOpacity className="p-2">
                        <Ionicons name="ellipsis-vertical" size={20} color={textSecondaryColor} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          ) : (
            <View className="items-center py-8">
              <MaterialCommunityIcons name="car-off" size={64} color={textSecondaryColor} />
              <Text className={`${textColor} text-lg font-semibold mt-4`}>No vehicles added</Text>
              <Text className={`${textSecondaryColor} text-center mt-2`}>
                Add your vehicles to get personalized service recommendations
              </Text>
              <TouchableOpacity 
                className="mt-6 px-6 py-3 bg-blue-500 rounded-lg"
                onPress={addNewVehicle}
              >
                <Text className="text-white font-semibold">Add Your First Vehicle</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Notifications */}
        <View className={`mx-5 mb-8 ${cardColor} rounded-2xl p-5 shadow-xl ${borderColor} border`}>
          <Text className={`text-xl font-bold mb-6 ${textColor}`}>🔔 Notifications</Text>
          
          <View className="space-y-4">
            {Object.entries(notifications).map(([key, value]) => {
              const label = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .replace('Service Reminders', 'Service Reminders')
                .replace('News Updates', 'News Updates');
              
              const description = key === 'serviceReminders' ? 'Get reminded about upcoming services' :
                                key === 'promotions' ? 'Receive special offers and discounts' :
                                key === 'securityAlerts' ? 'Get notified about security updates' :
                                'Stay updated with the latest news';
              
              return (
                <View key={key} className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className={`font-medium ${textColor}`}>{label}</Text>
                    <Text className={`text-sm ${textSecondaryColor}`}>{description}</Text>
                  </View>
                  <Switch
                    value={value}
                    onValueChange={(newValue) => setNotifications({...notifications, [key]: newValue})}
                    trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                    thumbColor={value ? '#ffffff' : '#ffffff'}
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* Account Actions */}
        <View className={`mx-5 mb-10 ${cardColor} rounded-2xl p-5 shadow-xl ${borderColor} border`}>
          <Text className={`text-xl font-bold mb-6 ${textColor}`}>⚙️ Account</Text>
          
          <View className="space-y-3">
            {accountActions.map((action, index) => (
              <TouchableOpacity 
                key={index}
                className={`flex-row items-center p-3 rounded-xl ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}
                onPress={() => handleAccountAction(action.label)}
                activeOpacity={0.7}
              >
                {renderIcon(action.iconPackage, action.icon, action.iconColor)}
                <Text className={`ml-3 font-semibold ${textColor} flex-1`}>{action.label}</Text>
                <Ionicons name="chevron-forward" size={20} color={textSecondaryColor} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View className="px-5 pb-8">
          <TouchableOpacity 
            className={`py-4 rounded-xl items-center ${theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'} border border-red-200`}
            onPress={() => Alert.alert(
              'Sign Out',
              'Are you sure you want to sign out?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive' }
              ]
            )}
          >
            <Text className="text-red-500 font-semibold text-lg">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}