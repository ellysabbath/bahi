import {
  FontAwesome,
  FontAwesome5,
  Ionicons,
  MaterialIcons,
} from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext'; // Import UserContext

interface SidebarProps {
  isVisible: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  iconType: 'material' | 'ionicons' | 'fontawesome' | 'fontawesome5';
  route: string | any; // Using any for route to avoid TypeScript issues with expo-router
  roles?: ('mechanic' | 'garage_owner' | 'customer' | 'admin')[]; // Roles that can see this menu item
}

export default function Sidebar({ isVisible, onClose }: SidebarProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useUser(); // Get user from UserContext
  
  const [activeMenuItem, setActiveMenuItem] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');

  // Get user role from context (assuming user object has a role property)
  const userRole = user?.role || 'customer'; // Default to customer if role not found

  // User data from context (dynamic)
  const userData = {
    name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Guest User' : 'Guest User',
    email: user?.email || 'guest@example.com',
    avatarUrl: user|| 'https://via.placeholder.com/100',
    role: userRole, // Add role to userData
  };

  // Theme-based colors
  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const textSecondaryColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  const hoverBgColor = theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100';

  const allMenuItems: MenuItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'dashboard',
      iconType: 'material',
      route: '/dashboard',
      roles: ['mechanic', 'garage_owner', 'customer', 'admin'], // All roles
    },
    {
      id: 'profile',
      title: 'My Profile',
      icon: 'person',
      iconType: 'ionicons',
      route: '/dashboard/profile',
      roles: ['mechanic', 'garage_owner', 'customer', 'admin'], // All roles
    },
    {
      id: 'mechanic_bookings',
      title: 'Mechanic Bookings View',
      icon: 'book',
      iconType: 'material',
      route: '/Mechanic/bookings',
      roles: ['mechanic', 'garage_owner'], // NOT customer
    },
    {
      id: 'admin_bookings',
      title: 'Manage Bookings',
      icon: 'book-online',
      iconType: 'material',
      route: '/admin/bookings',
      roles: ['admin'] // only admin
    },
        {
      id: 'admin_mechanics',
      title: 'Manage mechanics',
      icon: 'book-online',
      iconType: 'material',
      route: '/admin/manageMechanics',
      roles: ['admin'] // only admin
    },
    {
      id: 'admin_garages',
      title: 'Manage Garages',
      icon: 'warehouse',
      iconType: 'fontawesome5',
      route: '/admin/garages',
      roles: ['admin'] // only admin
    },
    {
      id: 'admin_users',
      title: 'Manage Users',
      icon: 'users',
      iconType: 'fontawesome5',
      route: '/admin/manage',
      roles: ['admin'] // only admin
    },
    {
      id: 'admin_services',
      title: 'Manage Services',
      icon: 'handshake',
      iconType: 'fontawesome5',
      route: '/admin/services',
      roles: ['admin'] // only admin
    },
    {
      id: 'bookings',
      title: 'My Bookings',
      icon: 'book',
      iconType: 'material',
      route: '/dashboard/bookings',
      // roles: ['mechanic', 'garage_owner', 'customer', 'admin'], // All roles
    },
    {
      id: 'garages',
      title: 'Garages',
      icon: 'warehouse',
      iconType: 'fontawesome5',
      route: '/dashboard/garages',
      // roles: ['mechanic', 'garage_owner', 'customer', 'admin'], // All roles
    },
    {
      id: 'services',
      title: 'All Services',
      icon: 'build',
      iconType: 'material',
      route: '/dashboard/services',
      roles: ['mechanic', 'garage_owner', 'customer', 'admin'], // All roles
    },
        {
      id: 'requests',
      title: 'join garage',
      icon: 'build',
      iconType: 'material',
      route: '/dashboard/requests',
      
    }
    ,
    {
      id: 'offers',
      title: 'Special Offers',
      icon: 'local-offer',
      iconType: 'material',
      route: '/dashboard/offers',
      roles: ['mechanic', 'garage_owner', 'customer', 'admin'], // All roles
    },
    {
      id: 'safety',
      title: 'Safety Guidelines',
      icon: 'shield-checkmark',
      iconType: 'ionicons',
      route: '/dashboard/safety',
      roles: ['mechanic', 'garage_owner', 'customer', 'admin'], // All roles
    },
    // {
    //   id: 'about',
    //   title: 'About Us',
    //   icon: 'info-circle',
    //   iconType: 'fontawesome',
    //   route: '/dashboard/about',
    //   roles: ['mechanic', 'garage_owner', 'customer', 'admin'], // All roles
    // },
    {
      id: 'contact',
      title: 'Contact Us',
      icon: 'headset',
      iconType: 'material',
      route: '/dashboard/contact',
      roles: ['mechanic', 'garage_owner', 'customer', 'admin'], // All roles
    },
    {
      id: 'chat',
      title: 'Chat',
      icon: 'chat',
      iconType: 'material',
      route: '/chat/index',
      roles: ['mechanic', 'garage_owner', 'customer', 'admin'], // All roles
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings',
      iconType: 'ionicons',
      route: '/dashboard/settings',
      roles: ['mechanic', 'garage_owner', 'customer', 'admin'], // All roles
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'help-circle',
      iconType: 'ionicons',
      route: '/dashboard/help',
      roles: ['mechanic', 'garage_owner', 'customer', 'admin'], // All roles
    },
  ];

  // Filter menu items based on user role
  const getFilteredMenuItems = () => {
    return allMenuItems.filter(item => {
      // If no roles specified, show to everyone
      if (!item.roles) return true;
      
      // Check if current user role is in the allowed roles array
      return item.roles.includes(userRole as 'mechanic' | 'garage_owner' | 'customer' | 'admin');
    });
  };

  const menuItems = getFilteredMenuItems();

  // Helper function to get menu sections based on filtered items
  const getMenuSections = () => {
    const mainMenuIds = ['dashboard', 'profile', 'mechanic_bookings', 'bookings', 'garages', 'services'];
    const adminMenuIds = ['admin_bookings', 'admin_garages', 'admin_users', 'admin_services','admin_mechanics'];
    const infoMenuIds = ['offers', 'safety', 'about', 'contact'];
    const supportMenuIds = ['chat', 'settings', 'help','requests'];

    return {
      mainMenu: menuItems.filter(item => mainMenuIds.includes(item.id)),
      adminMenu: menuItems.filter(item => adminMenuIds.includes(item.id)),
      infoMenu: menuItems.filter(item => infoMenuIds.includes(item.id)),
      supportMenu: menuItems.filter(item => supportMenuIds.includes(item.id)),
    };
  };

  const { mainMenu, adminMenu, infoMenu, supportMenu } = getMenuSections();

  const renderIcon = (iconName: string, iconType: string, isActive: boolean) => {
    const iconColor = isActive ? '#3b82f6' : (theme === 'dark' ? '#9ca3af' : '#6b7280');
    const size = 24;

    switch (iconType) {
      case 'material':
        return <MaterialIcons name={iconName as any} size={size} color={iconColor} />;
      case 'ionicons':
        return <Ionicons name={iconName as any} size={size} color={iconColor} />;
      case 'fontawesome':
        return <FontAwesome name={iconName as any} size={size} color={iconColor} />;
      case 'fontawesome5':
        return <FontAwesome5 name={iconName as any} size={size} color={iconColor} />;
      default:
        return <MaterialIcons name="help" size={size} color={iconColor} />;
    }
  };

  const handleMenuItemPress = (item: MenuItem) => {
    setActiveMenuItem(item.id);
    onClose();
    
    // Use router.push with proper typing
    if (item.route) {
      router.push(item.route as any);
    }
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Check out Quick Fix - The best auto service app! Download now: https://autofix.app',
        title: 'Quick Fix App',
      });
      showSuccessMessage('App shared successfully!');
    } catch (error) {
      console.error('Error sharing app:', error);
      showErrorMessage('Failed to share the app');
    }
  };

  const handleRateApp = async () => {
    const storeUrl = Platform.OS === 'ios' 
      ? 'https://apps.apple.com/app/idYOUR_APP_ID'
      : 'https://play.google.com/store/apps/details?id=YOUR_PACKAGE_NAME';
    
    const supported = await Linking.canOpenURL(storeUrl);
    
    if (supported) {
      await Linking.openURL(storeUrl);
      showSuccessMessage('Opening app store...');
    } else {
      showErrorMessage('Could not open app store');
    }
  };

  const showSuccessMessage = (message: string) => {
    setModalMessage(message);
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 3000);
  };

  const showErrorMessage = (message: string) => {
    setModalMessage(message);
    setShowErrorModal(true);
    setTimeout(() => setShowErrorModal(false), 3000);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => showErrorMessage('Logout cancelled')
        },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            showSuccessMessage('Logged out successfully!');
            onClose();
            // In a real app, you would call your logout function here
            // router.replace('/login');
          }
        }
      ]
    );
  };

  return (
    <>
      {/* Main Sidebar Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isVisible}
        onRequestClose={onClose}
      >
        <View className="flex-1">
          {/* Overlay */}
          <TouchableOpacity
            className="flex-1 bg-black/50"
            onPress={onClose}
            activeOpacity={1}
          />
          
          {/* Sidebar Content */}
          <View className={`absolute top-0 left-0 bottom-0 w-4/5 ${bgColor} shadow-2xl`}>
            <View className="flex-1">
              {/* User Profile Section - Fixed at top */}
              <View className={`p-6 border-b ${borderColor}`}>
                <View className="flex-row items-center mb-4">
                  <View className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 items-center justify-center mr-4 overflow-hidden">
                    {userData.avatarUrl && userData.avatarUrl !== 'https://via.placeholder.com/100' ? (
                      <Image
                        className="w-full h-full rounded-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <Text className="text-white text-2xl font-bold">
                        {userData.name.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className={`font-bold text-lg ${textColor}`}>{userData.name}</Text>
                    <Text className={`text-sm ${textSecondaryColor}`}>{userData.email}</Text>
                    {/* Display user role */}
                    <View className="mt-1">
                      <Text className={`text-xs px-2 py-1 rounded-full ${
                        userRole === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        userRole === 'mechanic' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        userRole === 'garage_owner' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View className="flex-row space-x-3">
                  <TouchableOpacity 
                    className={`flex-1 py-2 rounded-lg items-center ${hoverBgColor}`}
                    onPress={() => {
                      const profileItem = menuItems.find(item => item.id === 'profile');
                      if (profileItem) handleMenuItemPress(profileItem);
                    }}
                  >
                    <Text className={`font-medium ${textColor}`}>View Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className={`flex-1 py-2 rounded-lg items-center ${hoverBgColor}`}
                    onPress={() => {
                      const settingsItem = menuItems.find(item => item.id === 'settings');
                      if (settingsItem) handleMenuItemPress(settingsItem);
                    }}
                  >
                    <Text className={`font-medium ${textColor}`}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Scrollable Menu Items */}
              <ScrollView 
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <View className="p-4">
                  {/* Admin Menu Section (Only shown to admin users) */}
                  {adminMenu.length > 0 && (
                    <>
                      <Text className={`text-sm uppercase font-semibold mb-3 ${textSecondaryColor}`}>
                        Admin Panel
                      </Text>
                      
                      {adminMenu.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          className={`flex-row items-center p-3 rounded-lg mb-1 ${
                            activeMenuItem === item.id ? 'bg-red-500/10' : ''
                          }`}
                          onPress={() => handleMenuItemPress(item)}
                        >
                          {renderIcon(item.icon, item.iconType, activeMenuItem === item.id)}
                          <Text className={`ml-4 font-medium ${textColor}`}>{item.title}</Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  )}

                  {/* Main Menu Section */}
                  {mainMenu.length > 0 && (
                    <>
                      <Text className={`text-sm uppercase font-semibold mb-3 mt-6 ${textSecondaryColor}`}>
                        Main Menu
                      </Text>
                      
                      {mainMenu.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          className={`flex-row items-center p-3 rounded-lg mb-1 ${
                            activeMenuItem === item.id ? 'bg-blue-500/10' : ''
                          }`}
                          onPress={() => handleMenuItemPress(item)}
                        >
                          {renderIcon(item.icon, item.iconType, activeMenuItem === item.id)}
                          <Text className={`ml-4 font-medium ${textColor}`}>{item.title}</Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  )}

                  {/* Information Section */}
                  {infoMenu.length > 0 && (
                    <>
                      <Text className={`text-sm uppercase font-semibold mb-3 mt-6 ${textSecondaryColor}`}>
                        Information
                      </Text>
                      
                      {infoMenu.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          className={`flex-row items-center p-3 rounded-lg mb-1 ${
                            activeMenuItem === item.id ? 'bg-blue-500/10' : ''
                          }`}
                          onPress={() => handleMenuItemPress(item)}
                        >
                          {renderIcon(item.icon, item.iconType, activeMenuItem === item.id)}
                          <Text className={`ml-4 font-medium ${textColor}`}>{item.title}</Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  )}

                  {/* Support Section */}
                  {supportMenu.length > 0 && (
                    <>
                      <Text className={`text-sm uppercase font-semibold mb-3 mt-6 ${textSecondaryColor}`}>
                        Support
                      </Text>
                      
                      {supportMenu.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          className={`flex-row items-center p-3 rounded-lg mb-1 ${
                            activeMenuItem === item.id ? 'bg-blue-500/10' : ''
                          }`}
                          onPress={() => handleMenuItemPress(item)}
                        >
                          {renderIcon(item.icon, item.iconType, activeMenuItem === item.id)}
                          <Text className={`ml-4 font-medium ${textColor}`}>{item.title}</Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  )}

                  {/* Share App Section */}
                  <View className={`mt-8 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20`}>
                    <View className="flex-row items-center mb-3">
                      <Ionicons name="share-social" size={24} color="#10b981" />
                      <Text className="ml-3 font-bold text-green-800 dark:text-green-300">
                        Share Quick Fix
                      </Text>
                    </View>
                    <Text className="text-green-700 dark:text-green-400 mb-4 text-sm">
                      Help your friends find reliable auto services! Share the app and earn rewards.
                    </Text>
                    <TouchableOpacity
                      className="bg-green-600 py-3 rounded-lg items-center"
                      onPress={handleShareApp}
                    >
                      <Text className="text-white font-bold">Share App with Friends</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Rate App Button */}
                  <TouchableOpacity
                    className={`mt-4 p-4 rounded-xl flex-row items-center justify-between ${hoverBgColor}`}
                    onPress={handleRateApp}
                  >
                    <View className="flex-row items-center">
                      <MaterialIcons name="star-rate" size={24} color="#fbbf24" />
                      <Text className={`ml-3 font-medium ${textColor}`}>Rate Our App</Text>
                    </View>
                    <MaterialIcons name="arrow-forward-ios" size={16} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                  </TouchableOpacity>

                  {/* Version Info */}
                  <View className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 items-center">
                    <Text className="text-gray-500 dark:text-gray-400 text-sm">
                      Quick Fix Version 0.0.1
                    </Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                      © 2024 Quick Fix. All rights reserved.
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* Logout Button - Fixed at bottom */}
              <View className={`p-4 border-t ${borderColor}`}>
                <TouchableOpacity
                  className={`p-4 rounded-xl flex-row items-center justify-center ${
                    theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'
                  } border ${borderColor}`}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out" size={20} color="#ef4444" />
                  <Text className="ml-3 font-bold text-red-600">Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white dark:bg-gray-800 rounded-3xl p-8 mx-6 max-w-md w-full shadow-2xl">
            <View className="items-center mb-6">
              <View className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full items-center justify-center mb-4">
                <Ionicons name="checkmark-circle" size={48} color="#10b981" />
              </View>
              <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Success!
              </Text>
              <Text className="text-gray-600 dark:text-gray-300 text-center text-lg">
                {modalMessage}
              </Text>
            </View>
            
            <TouchableOpacity
              className="mt-6 bg-green-600 py-4 rounded-2xl items-center"
              onPress={() => setShowSuccessModal(false)}
            >
              <Text className="text-white font-bold text-lg">OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showErrorModal}
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white dark:bg-gray-800 rounded-3xl p-8 mx-6 max-w-md w-full shadow-2xl">
            <View className="items-center mb-6">
              <View className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full items-center justify-center mb-4">
                <Ionicons name="close-circle" size={48} color="#ef4444" />
              </View>
              <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Oops!
              </Text>
              <Text className="text-gray-600 dark:text-gray-300 text-center text-lg">
                {modalMessage}
              </Text>
            </View>
            
            <TouchableOpacity
              className="mt-6 bg-red-600 py-4 rounded-2xl items-center"
              onPress={() => setShowErrorModal(false)}
            >
              <Text className="text-white font-bold text-lg">Try Again</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="mt-4 py-4 rounded-2xl items-center border border-gray-300 dark:border-gray-600"
              onPress={() => setShowErrorModal(false)}
            >
              <Text className="text-gray-600 dark:text-gray-300 font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}