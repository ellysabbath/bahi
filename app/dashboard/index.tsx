// DonationSummaryScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
  Alert,
  Share,
  Linking,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, Link } from 'expo-router';

import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../../context/UserContext'; // Adjust the path as needed

// Type definitions
interface Summary {
  total_donations: number;
  total_amount: number;
  total_zaka: number;
  total_ctf_donations: number;
  total_church_donations: number;
  total_ctf: number;
  total_church: number;
  total_all: number;
}

interface TypeDistribution {
  donation_type: string;
  count: number;
  total: number;
  percentage: number;
}

interface TopDonor {
  user__id: number;
  user__fullname: string;
  user__mobile_number: string;
  total_donated: number;
  donation_count: number;
}

interface TopChurch {
  church__id: number;
  church__church_name: string;
  total_received: number;
  donation_count: number;
}

interface MonthlyTrend {
  month: string;
  total: number;
  count: number;
}

interface DonationSummaryData {
  summary: Summary;
  type_distribution: TypeDistribution[];
  top_donors: TopDonor[];
  top_churches: TopChurch[];
  monthly_trend: MonthlyTrend[];
}

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  route: string;
}

const API_URL = 'https://mhazini.pythonanywhere.com/api/auth/donations/summary/';
const { width, height } = Dimensions.get('window');

const STORAGE_KEYS = {
  DONATION_SUMMARY: 'donation_summary_data',
  LAST_UPDATED: 'donation_summary_last_updated',
  CACHE_EXPIRY: 'donation_summary_cache_expiry',
};

const DonationSummaryScreen: React.FC = () => {
  const router = useRouter();
  const { user, logout: contextLogout } = useUser();
  const [theme] = useState<'light' | 'dark'>('light');
  const [summaryData, setSummaryData] = useState<DonationSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [offline, setOffline] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(false);
  const [activeMenuItem, setActiveMenuItem] = useState<string>('dashboard');
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');

  // Theme colors
  const colors = {
    light: {
      background: '#f8fafc',
      cardBackground: '#ffffff',
      cardBorder: '#e2e8f0',
      textPrimary: '#1e293b',
      textSecondary: '#64748b',
      textTertiary: '#94a3b8',
      headerBackground: '#ffffff',
      headerBorder: '#e2e8f0',
      buttonPrimary: '#3b82f6',
      buttonSecondary: '#60a5fa',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#0ea5e9',
      iconPrimary: '#475569',
      iconSecondary: '#94a3b8',
      overlay: 'rgba(0, 0, 0, 0.5)',
      gradientStart: '#4f46e5',
      gradientEnd: '#7c3aed',
    },
    dark: {
      background: '#0f172a',
      cardBackground: '#1e293b',
      cardBorder: '#334155',
      textPrimary: '#f1f5f9',
      textSecondary: '#cbd5e1',
      textTertiary: '#94a3b8',
      headerBackground: '#1e293b',
      headerBorder: '#334155',
      buttonPrimary: '#60a5fa',
      buttonSecondary: '#93c5fd',
      success: '#34d399',
      warning: '#fbbf24',
      danger: '#f87171',
      info: '#38bdf8',
      iconPrimary: '#e2e8f0',
      iconSecondary: '#94a3b8',
      overlay: 'rgba(0, 0, 0, 0.7)',
      gradientStart: '#7c3aed',
      gradientEnd: '#4f46e5',
    },
  };

  const currentColors = colors[theme];

  // Get user data from context
  const userData = {
    name: user?.fullname || 'Guest User',
    email: user?.email || 'No email provided',
    role: user?.is_staff ? 'staff' : user?.is_verified ? 'verified' : 'member',
  };

  // Menu items - updated routes to match Expo Router file structure
  const menuItems: MenuItem[] = [
    { id: 'dashboard', title: 'Dashboard', icon: 'grid-outline', route: '/' },
    { id: 'profile', title: 'My Profile', icon: 'person-outline', route: '/dashboard/profile' },
    { id: 'donation_types', title: 'Donation Types', icon: 'pricetags-outline', route: '/dashboard/donation-type' },
    { id: 'reports', title: 'Reports', icon: 'document-text-outline', route: '/dashboard/reports' },
    { id: 'visualization', title: 'Visualization', icon: 'bar-chart-outline', route: '/dashboard/visualization' },
    { id: 'churches', title: 'Churches', icon: 'business-outline', route: '/dashboard/churches' },
    { id: 'members', title: 'Members', icon: 'people-outline', route: '/dashboard/members' },
    { id: 'settings', title: 'Settings', icon: 'settings-outline', route: '/dashboard/settings' },
    { id: 'about', title: 'About', icon: 'information-circle-outline', route: '/dashboard/about' },
  ];

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Store data in AsyncStorage
  const storeData = async (data: DonationSummaryData): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DONATION_SUMMARY, JSON.stringify(data));
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());
      await AsyncStorage.setItem(STORAGE_KEYS.CACHE_EXPIRY, (Date.now() + 60 * 60 * 1000).toString());
    } catch (error) {
      console.error('Error storing data:', error);
    }
  };

  // Load data from AsyncStorage
  const loadFromStorage = async (): Promise<void> => {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEYS.DONATION_SUMMARY);
      const storedTime = await AsyncStorage.getItem(STORAGE_KEYS.LAST_UPDATED);
      
      if (storedData) {
        setSummaryData(JSON.parse(storedData));
        setOffline(true);
        setError(null);
        
        if (storedTime) {
          setLastUpdated(new Date(storedTime));
        }
      } else {
        setError('No data available offline');
      }
    } catch (error) {
      console.error('Error loading from storage:', error);
      setError('Failed to load stored data');
    }
  };

  // Fetch data from API with authentication token
  const fetchFromAPI = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      
      // Get the authentication token from AsyncStorage
      const token = await AsyncStorage.getItem('quickfix_access_token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      const response = await fetch(API_URL, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: DonationSummaryData = await response.json();
      await storeData(data);
      setSummaryData(data);
      setOffline(false);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('API fetch error:', error);
      await loadFromStorage();
      if (!summaryData) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('Failed to fetch data. Please check your connection.');
        }
      }
    }
  }, []);

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await fetchFromAPI();
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setLoading(false);
      }
    };
    initializeData();
  }, [fetchFromAPI]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    setError(null);
    try {
      await fetchFromAPI();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchFromAPI]);

  // Handle retry
  const handleRetry = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await fetchFromAPI();
    } catch (error) {
      console.error('Retry error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle menu item press
  const handleMenuItemPress = (item: MenuItem) => {
    setActiveMenuItem(item.id);
    setSidebarVisible(false);
    router.push(item.route);
  };

  // Handle profile circle press
  const handleProfilePress = () => {
    setSidebarVisible(false);
    router.push('/dashboard/profile');
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
        },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await contextLogout();
              showMessage('Logged out successfully!', 'success');
              setSidebarVisible(false);
              setTimeout(() => {
                router.replace('/login');
              }, 500);
            } catch (error) {
              showMessage('Failed to logout', 'error');
            }
          }
        }
      ]
    );
  };

  // Handle share app
  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Check out our Donation Management System! Manage your church donations effectively.',
        title: 'Donation App',
      });
      showMessage('App shared successfully!', 'success');
    } catch (error) {
      console.error('Error sharing app:', error);
      showMessage('Failed to share the app', 'error');
    }
  };

  // Handle rate app
  const handleRateApp = async () => {
    const storeUrl = Platform.OS === 'ios' 
      ? 'https://apps.apple.com'
      : 'https://play.google.com';
    
    const supported = await Linking.canOpenURL(storeUrl);
    
    if (supported) {
      await Linking.openURL(storeUrl);
      showMessage('Opening app store...', 'success');
    } else {
      showMessage('Could not open app store', 'error');
    }
  };

  // Show message modal
  const showMessage = (message: string, type: 'success' | 'error') => {
    setModalMessage(message);
    if (type === 'success') {
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
    } else {
      setShowErrorModal(true);
      setTimeout(() => setShowErrorModal(false), 3000);
    }
  };

  // Loading state
  if (loading && !summaryData) {
    return (
      <View style={{ flex: 1, backgroundColor: currentColors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={currentColors.buttonPrimary} />
        <Text style={{ color: currentColors.textSecondary, marginTop: 16, fontSize: 16 }}>Loading donation data...</Text>
      </View>
    );
  }

  // Error state
  if (error && !summaryData) {
    return (
      <View style={{ flex: 1, backgroundColor: currentColors.background, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Ionicons name="alert-circle-outline" size={80} color={currentColors.danger} />
        <Text style={{ color: currentColors.danger, fontSize: 22, fontWeight: 'bold', marginTop: 24, marginBottom: 8 }}>
          Unable to Load Data
        </Text>
        <Text style={{ color: currentColors.textSecondary, textAlign: 'center', marginBottom: 32, fontSize: 16 }}>
          {error}
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: currentColors.buttonPrimary, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 25 }}
          onPress={handleRetry}
        >
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Sidebar Component
  const Sidebar = () => {
    if (!sidebarVisible) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={sidebarVisible}
        onRequestClose={() => setSidebarVisible(false)}
      >
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: currentColors.overlay }}
            onPress={() => setSidebarVisible(false)}
            activeOpacity={1}
          />
          
          <View style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            bottom: 0, 
            width: width * 0.8, 
            backgroundColor: currentColors.cardBackground,
            shadowColor: '#000',
            shadowOffset: { width: 4, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 20,
          }}>
            <LinearGradient
              colors={[currentColors.gradientStart, currentColors.gradientEnd]}
              style={{ 
                padding: 24, 
                borderBottomWidth: 1, 
                borderBottomColor: currentColors.cardBorder,
              }}
            >
              <TouchableOpacity
                onPress={handleProfilePress}
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}
              >
                <View style={{ 
                  width: 60, 
                  height: 60, 
                  borderRadius: 30, 
                  backgroundColor: '#ffffff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                  overflow: 'hidden',
                  borderWidth: 3,
                  borderColor: '#ffffff',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 8,
                }}>
                  <Ionicons name="person" size={32} color={currentColors.buttonPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#ffffff', marginBottom: 4 }}>
                    {userData.name}
                  </Text>
                  <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>
                    {userData.email}
                  </Text>
                  <View style={{ 
                    backgroundColor: userData.role === 'staff' ? '#ff5252' : userData.role === 'verified' ? '#4caf50' : '#3b82f6',
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 12,
                    alignSelf: 'flex-start'
                  }}>
                    <Text style={{ fontSize: 12, color: '#ffffff', fontWeight: '600' }}>
                      {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView 
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <View style={{ padding: 16 }}>
                <Text style={{ 
                  fontSize: 12, 
                  textTransform: 'uppercase', 
                  fontWeight: '700', 
                  marginBottom: 16,
                  color: currentColors.textSecondary,
                  letterSpacing: 1,
                }}>
                  Main Menu
                </Text>
                
                {menuItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleMenuItemPress(item)}
                    style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      padding: 14, 
                      borderRadius: 10,
                      marginBottom: 6,
                      backgroundColor: activeMenuItem === item.id ? 
                        (theme === 'dark' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.1)') : 'transparent',
                      borderLeftWidth: activeMenuItem === item.id ? 4 : 0,
                      borderLeftColor: currentColors.buttonPrimary,
                    }}
                  >
                    <Ionicons name={item.icon as any} size={24} color={activeMenuItem === item.id ? currentColors.buttonPrimary : currentColors.iconSecondary} />
                    <Text style={{ 
                      marginLeft: 16, 
                      fontWeight: '500', 
                      color: currentColors.textPrimary,
                      fontSize: 15,
                    }}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                ))}

                <View style={{ 
                  marginTop: 24, 
                  padding: 20, 
                  borderRadius: 16,
                  backgroundColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                  borderWidth: 1,
                  borderColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Ionicons name="share-social" size={28} color="#10b981" />
                    <Text style={{ 
                      marginLeft: 12, 
                      fontWeight: 'bold', 
                      fontSize: 16,
                      color: theme === 'dark' ? '#34d399' : '#059669'
                    }}>
                      Share Donation App
                    </Text>
                  </View>
                  <Text style={{ 
                    color: theme === 'dark' ? '#34d399' : '#059669', 
                    marginBottom: 16, 
                    fontSize: 14,
                    lineHeight: 20,
                  }}>
                    Help others manage their donations effectively!
                  </Text>
                  <TouchableOpacity
                    style={{ 
                      backgroundColor: '#10b981', 
                      paddingVertical: 14, 
                      borderRadius: 12, 
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                    onPress={handleShareApp}
                  >
                    <Ionicons name="share-outline" size={20} color="#ffffff" />
                    <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>
                      Share App
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: currentColors.cardBorder }}>
              <TouchableOpacity
                style={{ 
                  padding: 18, 
                  borderRadius: 12,
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(254, 226, 226, 1)',
                  borderWidth: 1,
                  borderColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.3)' : '#fecaca',
                }}
                onPress={handleLogout}
              >
                <Ionicons name="log-out" size={22} color="#ef4444" />
                <Text style={{ marginLeft: 12, fontWeight: 'bold', fontSize: 16, color: '#ef4444' }}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Summary Stats Card Component
  const StatCard = ({ title, value, icon, color }: { title: string; value: string; icon: string; color: string }) => (
    <View style={{ 
      width: '48%', 
      backgroundColor: currentColors.cardBackground, 
      borderRadius: 16, 
      padding: 20, 
      marginBottom: 16, 
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: currentColors.cardBorder,
    }}>
      <View style={{ 
        width: 48, 
        height: 48, 
        borderRadius: 24, 
        backgroundColor: `${color}20`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
      }}>
        <Ionicons name={icon as any} size={26} color={color} />
      </View>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: currentColors.textPrimary, marginTop: 4 }}>
        {value}
      </Text>
      <Text style={{ color: currentColors.textSecondary, fontSize: 14, marginTop: 4, fontWeight: '500' }}>
        {title}
      </Text>
    </View>
  );

  // Type Distribution Card Component
  const TypeDistributionCard = ({ item, index }: { item: TypeDistribution; index: number }) => (
    <View key={index} style={{ 
      backgroundColor: currentColors.cardBackground, 
      borderRadius: 16, 
      padding: 20, 
      marginBottom: 16, 
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: currentColors.cardBorder,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ 
            width: 44, 
            height: 44, 
            borderRadius: 22, 
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}>
            <Ionicons name="pie-chart-outline" size={22} color={currentColors.buttonPrimary} />
          </View>
          <View>
            <Text style={{ color: currentColors.textPrimary, fontWeight: '600', fontSize: 18, marginBottom: 2 }}>
              {item.donation_type.charAt(0).toUpperCase() + item.donation_type.slice(1)}
            </Text>
            <Text style={{ color: currentColors.textSecondary, fontSize: 14 }}>
              {item.count} donations
            </Text>
          </View>
        </View>
        <Text style={{ 
          fontSize: 22, 
          fontWeight: 'bold', 
          color: currentColors.buttonPrimary,
          backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
          paddingHorizontal: 16,
          paddingVertical: 6,
          borderRadius: 12,
        }}>
          {item.percentage.toFixed(1)}%
        </Text>
      </View>
      
      <View style={{ height: 8, backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
        <View style={{ 
          height: '100%', 
          backgroundColor: currentColors.buttonPrimary, 
          borderRadius: 4, 
          width: `${item.percentage}%`,
        }} />
      </View>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="list-outline" size={18} color={currentColors.textSecondary} />
          <Text style={{ color: currentColors.textSecondary, fontSize: 15, marginLeft: 6, fontWeight: '500' }}>
            {item.count} donations
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="wallet-outline" size={18} color={currentColors.textSecondary} />
          <Text style={{ color: currentColors.textSecondary, fontSize: 15, marginLeft: 6, fontWeight: '500' }}>
            {formatCurrency(item.total)}
          </Text>
        </View>
      </View>
    </View>
  );

  // Top Donor Card Component
  const TopDonorCard = ({ donor, index }: { donor: TopDonor; index: number }) => (
    <View key={donor.user__id} style={{ 
      backgroundColor: currentColors.cardBackground, 
      borderRadius: 16, 
      padding: 20, 
      marginBottom: 16, 
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: currentColors.cardBorder,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <View style={{ 
          width: 50, 
          height: 50, 
          borderRadius: 25, 
          backgroundColor: currentColors.buttonPrimary,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16,
          shadowColor: currentColors.buttonPrimary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }}>
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20 }}>#{index + 1}</Text>
        </View>
        
        <View style={{ flex: 1 }}>
          <Text style={{ color: currentColors.textPrimary, fontWeight: '600', fontSize: 18, marginBottom: 4 }}>
            {donor.user__fullname}
          </Text>
          <Text style={{ color: currentColors.textSecondary, fontSize: 15, marginBottom: 4 }}>
            {donor.user__mobile_number}
          </Text>
        </View>
      </View>
      
      <View style={{ 
        flexDirection: 'row', 
        backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc', 
        borderRadius: 14, 
        padding: 16,
      }}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Ionicons name="cash-outline" size={22} color={currentColors.success} />
          <Text style={{ color: currentColors.textPrimary, fontWeight: 'bold', fontSize: 20, marginTop: 6 }}>
            {formatCurrency(donor.total_donated)}
          </Text>
          <Text style={{ color: currentColors.textSecondary, fontSize: 13, fontWeight: '500' }}>Total Donated</Text>
        </View>
        
        <View style={{ width: 1, backgroundColor: theme === 'dark' ? '#334155' : '#e2e8f0', marginHorizontal: 16 }} />
        
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Ionicons name="receipt-outline" size={22} color={currentColors.warning} />
          <Text style={{ color: currentColors.textPrimary, fontWeight: 'bold', fontSize: 20, marginTop: 6 }}>
            {donor.donation_count}
          </Text>
          <Text style={{ color: currentColors.textSecondary, fontSize: 13, fontWeight: '500' }}>Donations</Text>
        </View>
      </View>
    </View>
  );

  // Monthly Trend Card Component
  const MonthlyTrendCard = ({ month, index }: { month: MonthlyTrend; index: number }) => (
    <View key={index} style={{ 
      backgroundColor: currentColors.cardBackground, 
      borderRadius: 16, 
      padding: 20, 
      marginBottom: 16, 
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: currentColors.cardBorder,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <View style={{ 
          width: 50, 
          height: 50, 
          borderRadius: 25, 
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16,
        }}>
          <Ionicons name="calendar-outline" size={24} color={currentColors.warning} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: currentColors.textPrimary, fontWeight: '600', fontSize: 18, marginBottom: 4 }}>
            {new Date(month.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
          </Text>
          <Text style={{ color: currentColors.textSecondary, fontSize: 15 }}>Monthly Performance</Text>
        </View>
      </View>
      
      <View style={{ 
        flexDirection: 'row', 
        backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc', 
        borderRadius: 14, 
        padding: 16,
      }}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: currentColors.textPrimary, fontWeight: 'bold', fontSize: 22, marginBottom: 6 }}>
            {formatCurrency(month.total)}
          </Text>
          <Text style={{ color: currentColors.textSecondary, fontSize: 14, fontWeight: '500' }}>Total Amount</Text>
        </View>
        
        <View style={{ width: 1, backgroundColor: theme === 'dark' ? '#334155' : '#e2e8f0', marginHorizontal: 16 }} />
        
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: currentColors.textPrimary, fontWeight: 'bold', fontSize: 22, marginBottom: 6 }}>
            {month.count}
          </Text>
          <Text style={{ color: currentColors.textSecondary, fontSize: 14, fontWeight: '500' }}>Donations</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: currentColors.background }}>
      <StatusBar 
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={currentColors.headerBackground} 
      />
      
      {/* Header */}
      <View style={{
        backgroundColor: currentColors.headerBackground,
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: currentColors.headerBorder,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => setSidebarVisible(true)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: theme === 'dark' ? '#334155' : '#e5e7eb',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="menu-outline" size={26} color={currentColors.iconPrimary} />
          </TouchableOpacity>
          
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: currentColors.textPrimary, textAlign: 'center' }}>
              Donation Summary
            </Text>
            {lastUpdated && (
              <Text style={{ fontSize: 13, color: currentColors.textSecondary, textAlign: 'center', marginTop: 4 }}>
                {offline ? '📱 Offline - ' : '🌐 '}
                Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </View>
          
          {offline && (
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              backgroundColor: theme === 'dark' ? 'rgba(220, 38, 38, 0.2)' : '#fee2e2', 
              paddingHorizontal: 12, 
              paddingVertical: 6, 
              borderRadius: 16,
            }}>
              <Ionicons name="cloud-offline-outline" size={16} color="#dc2626" />
              <Text style={{ color: '#dc2626', fontSize: 13, fontWeight: '600', marginLeft: 6 }}>Offline</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[currentColors.buttonPrimary]}
            tintColor={currentColors.buttonPrimary}
          />
        }
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={{ padding: 20 }}>
          {/* Welcome Section */}
          <LinearGradient
            colors={[currentColors.gradientStart, currentColors.gradientEnd]}
            style={{ 
              borderRadius: 20, 
              padding: 24, 
              marginBottom: 24,
            }}
          >
            <TouchableOpacity
              onPress={handleProfilePress}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <View style={{ 
                width: 60, 
                height: 60, 
                borderRadius: 30, 
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
              }}>
                <Ionicons name="person-circle-outline" size={40} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 }}>
                  Welcome back, {userData.name.split(' ')[0]}!
                </Text>
                <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)' }}>
                  Here's your donation overview
                </Text>
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                  Tap to view profile →
                </Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>

          {/* Summary Statistics */}
          <View style={{ marginBottom: 28 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: currentColors.textPrimary }}>
                📊 Summary Statistics
              </Text>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 12,
                }}
                onPress={onRefresh}
              >
                <Ionicons name="refresh-outline" size={18} color={currentColors.buttonPrimary} />
                <Text style={{ color: currentColors.buttonPrimary, fontSize: 14, fontWeight: '600', marginLeft: 6 }}>
                  Refresh
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <StatCard
                title="Total Donations"
                value={summaryData!.summary.total_donations.toString()}
                icon="receipt-outline"
                color={currentColors.buttonPrimary}
              />
              
              <StatCard
                title="Total Amount"
                value={formatCurrency(summaryData!.summary.total_amount)}
                icon="cash-outline"
                color={currentColors.success}
              />
              
              <StatCard
                title="Zaka Total"
                value={formatCurrency(summaryData!.summary.total_zaka)}
                icon="home-outline"
                color={currentColors.warning}
              />
              
              <StatCard
                title="CTF Total"
                value={formatCurrency(summaryData!.summary.total_ctf)}
                icon="business-outline"
                color={currentColors.danger}
              />
            </View>
          </View>

          {/* Type Distribution */}
          {summaryData!.type_distribution.length > 0 && (
            <View style={{ marginBottom: 28 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: currentColors.textPrimary }}>
                  📈 Donation Types
                </Text>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => router.push('/dashboard/reports')}
                >
                  <Text style={{ color: currentColors.buttonPrimary, fontSize: 15, fontWeight: '600', marginRight: 6 }}>
                    View All
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color={currentColors.buttonPrimary} />
                </TouchableOpacity>
              </View>
              {summaryData!.type_distribution.map((item, index) => (
                <TypeDistributionCard key={index} item={item} index={index} />
              ))}
            </View>
          )}

          {/* Top Donors */}
          {summaryData!.top_donors.length > 0 && (
            <View style={{ marginBottom: 28 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: currentColors.textPrimary }}>
                  🏆 Top Donors
                </Text>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => router.push('/dashboard/members')}
                >
                  <Text style={{ color: currentColors.buttonPrimary, fontSize: 15, fontWeight: '600', marginRight: 6 }}>
                    View All
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color={currentColors.buttonPrimary} />
                </TouchableOpacity>
              </View>
              {summaryData!.top_donors.map((donor, index) => (
                <TopDonorCard key={donor.user__id} donor={donor} index={index} />
              ))}
            </View>
          )}

          {/* Monthly Trend */}
          {summaryData!.monthly_trend.length > 0 && (
            <View style={{ marginBottom: 28 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: currentColors.textPrimary }}>
                  📅 Monthly Trend
                </Text>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => router.push('/dashboard/reports')}
                >
                  <Text style={{ color: currentColors.buttonPrimary, fontSize: 15, fontWeight: '600', marginRight: 6 }}>
                    View Report
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color={currentColors.buttonPrimary} />
                </TouchableOpacity>
              </View>
              {summaryData!.monthly_trend.map((month, index) => (
                <MonthlyTrendCard key={index} month={month} index={index} />
              ))}
            </View>
          )}

          {/* Cache Info */}
          <View style={{ 
            backgroundColor: currentColors.cardBackground, 
            borderRadius: 16, 
            padding: 20, 
            marginBottom: 24, 
            alignItems: 'center',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons 
                name={offline ? "cloud-download-outline" : "cloud-done-outline"} 
                size={28} 
                color={offline ? currentColors.warning : currentColors.success} 
              />
              <Text style={{ 
                marginLeft: 12, 
                fontSize: 18, 
                fontWeight: '600', 
                color: currentColors.textPrimary 
              }}>
                {offline ? 'Viewing Cached Data' : 'Connected to Server'}
              </Text>
            </View>
            {lastUpdated && (
              <Text style={{ 
                color: currentColors.textSecondary, 
                fontSize: 14, 
                textAlign: 'center',
                lineHeight: 20,
              }}>
                Last sync: {lastUpdated.toLocaleDateString()} at {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
            <TouchableOpacity
              style={{
                marginTop: 16,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
              }}
              onPress={onRefresh}
            >
              <Ionicons name="sync-outline" size={18} color={currentColors.buttonPrimary} />
              <Text style={{ color: currentColors.buttonPrimary, fontSize: 14, fontWeight: '600', marginLeft: 8 }}>
                Refresh Data
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={{ 
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: currentColors.cardBackground,
        borderTopWidth: 1,
        borderTopColor: currentColors.cardBorder,
        paddingHorizontal: 20,
        paddingVertical: 12,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
          <TouchableOpacity 
            style={{ alignItems: 'center', padding: 8 }}
            onPress={() => router.push('/')}
          >
            <View style={{ 
              width: 56, 
              height: 56, 
              borderRadius: 28, 
              backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 6,
            }}>
              <Ionicons name="home" size={28} color={currentColors.buttonPrimary} />
            </View>
            <Text style={{ color: currentColors.buttonPrimary, fontSize: 13, fontWeight: '600' }}>
              Home
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={{ alignItems: 'center', padding: 8 }}
            onPress={() => router.push('/dashboard/settings')}
          >
            <View style={{ 
              width: 56, 
              height: 56, 
              borderRadius: 28, 
              backgroundColor: theme === 'dark' ? 'rgba(107, 114, 128, 0.2)' : 'rgba(107, 114, 128, 0.1)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 6,
            }}>
              <Ionicons name="settings" size={28} color={currentColors.textSecondary} />
            </View>
            <Text style={{ color: currentColors.textSecondary, fontSize: 13, fontWeight: '600' }}>
              Settings
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={{ alignItems: 'center', padding: 8 }}
            onPress={handleProfilePress}
          >
            <View style={{ 
              width: 56, 
              height: 56, 
              borderRadius: 28, 
              backgroundColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 6,
            }}>
              <Ionicons name="person" size={28} color={currentColors.success} />
            </View>
            <Text style={{ color: currentColors.success, fontSize: 13, fontWeight: '600' }}>
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modals */}
      {showSuccessModal && (
        <Modal transparent visible={showSuccessModal}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, alignItems: 'center' }}>
              <Ionicons name="checkmark-circle" size={50} color="green" />
              <Text style={{ marginTop: 10, fontSize: 16 }}>{modalMessage}</Text>
            </View>
          </View>
        </Modal>
      )}

      {showErrorModal && (
        <Modal transparent visible={showErrorModal}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, alignItems: 'center' }}>
              <Ionicons name="alert-circle" size={50} color="red" />
              <Text style={{ marginTop: 10, fontSize: 16 }}>{modalMessage}</Text>
            </View>
          </View>
        </Modal>
      )}

      <Sidebar />
    </SafeAreaView>
  );
};

export default DonationSummaryScreen;