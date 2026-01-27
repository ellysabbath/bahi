// DonationSummaryScreen.tsx - UPDATED with better padding
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Modal,
  Animated,
  Easing,
  Platform,
  Share,
  Linking,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';

const { width, height } = Dimensions.get('window');
const API_URL = 'https://mhazini.pythonanywhere.com/api/auth/reports/total/summary/';

interface SummaryData {
  total_donations: number;
  total_amount: number;
  total_zaka: number;
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
  doner__id: number;
  doner__fullname: string;
  doner__mobile_number: string;
  total_donated: number;
  donation_count: number;
}

interface TopChurch {
  church: string;
  total_received: number;
  donation_count: number;
}

interface MonthlyTrend {
  month: string;
  total: number;
  count: number;
}

interface DonationStats {
  summary: SummaryData;
  type_distribution: TypeDistribution[];
  top_donors: TopDonor[];
  top_churches: TopChurch[];
  monthly_trend: MonthlyTrend[];
  timestamp: string;
}

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

const DonationSummaryScreen = () => {
  const router = useRouter();
  const { user, logout } = useUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DonationStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [offlineMode, setOfflineMode] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  
  // Animations
  const sidebarAnim = useRef(new Animated.Value(-width)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [scaleAnim] = useState(new Animated.Value(1));

  // Menu items
  const menuItems: MenuItem[] = [
    { id: 'dashboard', title: 'Dashboard', icon: 'grid-outline', route: '/' },
    { id: 'profile', title: 'My Profile', icon: 'person-outline', route: '/dashboard/profile' },
    { id: 'finalReport', title: 'Final Report', icon: 'document-text-outline', route: '/dashboard/all-donations' },
    { id: 'donation_types', title: 'Donation Types', icon: 'pricetags-outline', route: '/dashboard/donation-type' },
    { id: 'reports', title: 'Reports', icon: 'document-text-outline', route: '/dashboard/reports' },
    { id: 'visualization', title: 'Visualization', icon: 'bar-chart-outline', route: '/dashboard/visualization' },
    { id: 'churches', title: 'Churches', icon: 'business-outline', route: '/dashboard/churches' },
    { id: 'members', title: 'Members', icon: 'people-outline', route: '/dashboard/members' },
    { id: 'settings', title: 'Settings', icon: 'settings-outline', route: '/dashboard/settings' },
    { id: 'about', title: 'About', icon: 'information-circle-outline', route: '/dashboard/about' },
  ];

  // Cache keys
  const CACHE_KEYS = {
    DONATION_STATS: 'donation_stats_cache',
    LAST_FETCH: 'donation_stats_last_fetch',
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format month name
  const formatMonth = (monthStr: string): string => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Get donation type display name
  const getTypeDisplayName = (type: string): string => {
    const typeMap: Record<string, string> = {
      'zaka': 'Zaka',
      'zaka_na_sadaka': 'Zaka & Sadaka',
      'sadaka': 'Sadaka',
      'nyingine': 'Other Contributions',
    };
    return typeMap[type] || type;
  };

  // Get icon for donation type
  const getTypeIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      'zaka': 'home',
      'zaka_na_sadaka': 'heart',
      'sadaka': 'gift',
      'nyingine': 'ellipsis-horizontal',
    };
    return iconMap[type] || 'help-circle';
  };

  // Get color for donation type
  const getTypeColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      'zaka': '#10B981',
      'zaka_na_sadaka': '#3B82F6',
      'sadaka': '#F59E0B',
      'nyingine': '#8B5CF6',
    };
    return colorMap[type] || '#6B7280';
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

  // Open sidebar
  const openSidebar = () => {
    setSidebarVisible(true);
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Close sidebar
  const closeSidebar = () => {
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: -width,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSidebarVisible(false);
    });
  };

  // Handle menu item press
  const handleMenuItemPress = (item: MenuItem) => {
    closeSidebar();
    router.push(item.route);
  };

  // Handle profile press
  const handleProfilePress = () => {
    closeSidebar();
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
              await logout();
              showMessage('Logged out successfully!', 'success');
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
        message: 'Check out the Donation Management System for SDA CTF!',
        title: 'Donation Management App',
      });
      showMessage('App shared successfully!', 'success');
    } catch (error) {
      console.error('Error sharing app:', error);
      showMessage('Failed to share the app', 'error');
    }
  };

  // Load cached data
  const loadCachedData = async (): Promise<boolean> => {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEYS.DONATION_STATS);
      const lastFetch = await AsyncStorage.getItem(CACHE_KEYS.LAST_FETCH);
      
      if (cachedData && lastFetch) {
        const parsedData = JSON.parse(cachedData);
        const lastFetchDate = new Date(lastFetch);
        const now = new Date();
        const hoursDiff = (now.getTime() - lastFetchDate.getTime()) / (1000 * 60 * 60);
        
        // Use cache if less than 1 hour old
        if (hoursDiff < 1) {
          setStats(parsedData);
          setLastUpdate(lastFetchDate);
          setOfflineMode(true);
          return true;
        }
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
    return false;
  };

  // Save data to cache
  const saveToCache = async (data: DonationStats): Promise<void> => {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.DONATION_STATS, JSON.stringify(data));
      await AsyncStorage.setItem(CACHE_KEYS.LAST_FETCH, new Date().toISOString());
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  };

  // Fetch data from API
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && await loadCachedData()) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const token = await AsyncStorage.getItem('quickfix_access_token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(API_URL, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: DonationStats = await response.json();
      
      // Validate data structure
      if (!data.summary || !Array.isArray(data.type_distribution)) {
        throw new Error('Invalid data format');
      }

      await saveToCache(data);
      setStats(data);
      setLastUpdate(new Date());
      setOfflineMode(false);
      
      // Trigger animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.02,
          duration: 200,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error: any) {
      console.error('Fetch error:', error);
      
      // Try to load cached data as fallback
      if (!await loadCachedData()) {
        setError(error.message || 'Failed to fetch data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (autoRefreshEnabled && !offlineMode && !error && !sidebarVisible) {
      intervalId = setInterval(() => {
        fetchData(true);
      }, 30000); // 30 seconds
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefreshEnabled, offlineMode, error, sidebarVisible, fetchData]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(true);
  }, [fetchData]);

  // Render loading state
  if (loading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading donation statistics...</Text>
      </View>
    );
  }

  // Render error state
  if (error && !stats) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Unable to Load Data</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchData(true)}>
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Default data if stats is null
  const safeStats = stats || {
    summary: {
      total_donations: 0,
      total_amount: 0,
      total_zaka: 0,
      total_ctf: 0,
      total_church: 0,
      total_all: 0,
    },
    type_distribution: [],
    top_donors: [],
    top_churches: [],
    monthly_trend: [],
    timestamp: new Date().toISOString(),
  };

  // User data
  const userData = {
    name: user?.fullname || 'Guest User',
    email: user?.email || 'No email provided',
    role: user?.is_staff ? 'Staff' : user?.is_verified ? 'Verified' : 'Member',
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Main Header */}
      <LinearGradient
        colors={['#3B82F6', '#1D4ED8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={openSidebar} style={styles.menuButton}>
            <Ionicons name="menu-outline" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Donation Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              {offlineMode ? '📱 Offline' : '🌐 Online'}
              {` • ${lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            style={styles.autoRefreshButton}
          >
            <Ionicons 
              name={autoRefreshEnabled ? "sync-circle" : "sync-circle-outline"} 
              size={26} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Card */}
        <LinearGradient
          colors={['#4F46E5', '#7C3AED']}
          style={styles.welcomeCard}
        >
          <TouchableOpacity onPress={handleProfilePress} style={styles.welcomeContent}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person-circle-outline" size={50} color="#FFFFFF" />
            </View>
            <View style={styles.welcomeTextContainer}>
              <Text style={styles.welcomeTitle}>Welcome back, {userData.name.split(' ')[0]}!</Text>
              <Text style={styles.welcomeSubtitle}>Here's your donation overview</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{userData.role}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </LinearGradient>

        {/* Summary Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Summary Statistics</Text>
          <View style={styles.summaryGrid}>
            <Animated.View style={[styles.summaryCard, { transform: [{ scale: scaleAnim }] }]}>
              <View style={[styles.iconContainer, { backgroundColor: '#3B82F620' }]}>
                <Ionicons name="receipt-outline" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.summaryNumber}>{safeStats.summary.total_donations}</Text>
              <Text style={styles.summaryLabel}>Total Donations</Text>
            </Animated.View>

            <Animated.View style={[styles.summaryCard, { transform: [{ scale: scaleAnim }] }]}>
              <View style={[styles.iconContainer, { backgroundColor: '#10B98120' }]}>
                <Ionicons name="cash-outline" size={24} color="#10B981" />
              </View>
              <Text style={styles.summaryNumber}>{formatCurrency(safeStats.summary.total_amount)}</Text>
              <Text style={styles.summaryLabel}>Total Amount</Text>
            </Animated.View>

            <Animated.View style={[styles.summaryCard, { transform: [{ scale: scaleAnim }] }]}>
              <View style={[styles.iconContainer, { backgroundColor: '#F59E0B20' }]}>
                <Ionicons name="home-outline" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.summaryNumber}>{formatCurrency(safeStats.summary.total_zaka)}</Text>
              <Text style={styles.summaryLabel}>Total Zaka</Text>
            </Animated.View>

            <Animated.View style={[styles.summaryCard, { transform: [{ scale: scaleAnim }] }]}>
              <View style={[styles.iconContainer, { backgroundColor: '#EF444420' }]}>
                <Ionicons name="business-outline" size={24} color="#EF4444" />
              </View>
              <Text style={styles.summaryNumber}>{formatCurrency(safeStats.summary.total_ctf)}</Text>
              <Text style={styles.summaryLabel}>Total CTF</Text>
            </Animated.View>
          </View>
        </View>

        {/* Donation Type Distribution */}
        {safeStats.type_distribution.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📈 Donation Types</Text>
              <TouchableOpacity 
                onPress={() => router.push('/dashboard/reports')} 
                style={styles.viewAllButton}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <Ionicons name="arrow-forward" size={16} color="#3B82F6" />
              </TouchableOpacity>
            </View>
            
            {safeStats.type_distribution.map((item, index) => (
              <View key={index} style={styles.typeCard}>
                <View style={styles.typeHeader}>
                  <View style={styles.typeIconContainer}>
                    <Ionicons 
                      name={getTypeIcon(item.donation_type)} 
                      size={20} 
                      color={getTypeColor(item.donation_type)} 
                    />
                  </View>
                  <Text style={styles.typeName}>{getTypeDisplayName(item.donation_type)}</Text>
                  <Text style={styles.typePercentage}>{item.percentage.toFixed(1)}%</Text>
                </View>
                
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${item.percentage}%`,
                        backgroundColor: getTypeColor(item.donation_type),
                      }
                    ]} 
                  />
                </View>
                
                <View style={styles.typeDetails}>
                  <Text style={styles.typeCount}>{item.count} donations</Text>
                  <Text style={styles.typeAmount}>{formatCurrency(item.total)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Top Donors */}
        {safeStats.top_donors.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🏆 Top Donors</Text>
              <TouchableOpacity 
                onPress={() => router.push('/dashboard/members')} 
                style={styles.viewAllButton}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <Ionicons name="arrow-forward" size={16} color="#3B82F6" />
              </TouchableOpacity>
            </View>
            
            {safeStats.top_donors.slice(0, 5).map((donor, index) => (
              <View key={donor.doner__id} style={styles.donorCard}>
                <View style={styles.donorHeader}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.donorInfo}>
                    <Text style={styles.donorName}>{donor.doner__fullname || 'Anonymous'}</Text>
                    <Text style={styles.donorPhone}>{donor.doner__mobile_number || 'No phone'}</Text>
                  </View>
                </View>
                
                <View style={styles.donorStats}>
                  <View style={styles.donorStat}>
                    <Ionicons name="cash-outline" size={16} color="#10B981" />
                    <Text style={styles.donorStatValue}>{formatCurrency(donor.total_donated)}</Text>
                    <Text style={styles.donorStatLabel}>Donated</Text>
                  </View>
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.donorStat}>
                    <Ionicons name="receipt-outline" size={16} color="#3B82F6" />
                    <Text style={styles.donorStatValue}>{donor.donation_count}</Text>
                    <Text style={styles.donorStatLabel}>Donations</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Monthly Trend */}
        {safeStats.monthly_trend.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📅 Monthly Trend</Text>
              <TouchableOpacity 
                onPress={() => router.push('/dashboard/reports')} 
                style={styles.viewAllButton}
              >
                <Text style={styles.viewAllText}>View Report</Text>
                <Ionicons name="arrow-forward" size={16} color="#3B82F6" />
              </TouchableOpacity>
            </View>
            
            {safeStats.monthly_trend.slice(-6).map((month, index) => (
              <View key={index} style={styles.monthCard}>
                <View style={styles.monthHeader}>
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                  <Text style={styles.monthName}>{formatMonth(month.month)}</Text>
                </View>
                
                <View style={styles.monthStats}>
                  <View style={styles.monthStat}>
                    <Text style={styles.monthStatValue}>{formatCurrency(month.total)}</Text>
                    <Text style={styles.monthStatLabel}>Total Amount</Text>
                  </View>
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.monthStat}>
                    <Text style={styles.monthStatValue}>{month.count}</Text>
                    <Text style={styles.monthStatLabel}>Donations</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Connection Status */}
        <View style={styles.connectionCard}>
          <View style={styles.connectionHeader}>
            <Ionicons 
              name={offlineMode ? "cloud-offline-outline" : "cloud-done-outline"} 
              size={24} 
              color={offlineMode ? "#F59E0B" : "#10B981"} 
            />
            <Text style={styles.connectionTitle}>
              {offlineMode ? 'Offline Mode' : 'Online'}
            </Text>
          </View>
          <Text style={styles.connectionText}>
            {offlineMode 
              ? 'Showing cached data. Pull to refresh when online.'
              : 'Connected to server. Auto-refresh enabled.'
            }
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={() => fetchData(true)}>
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.refreshButtonText}>Sync now</Text>
          </TouchableOpacity>
        </View>

        {/* Extra bottom padding to prevent content from being hidden */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/')}>
          <View style={styles.navIconContainer}>
            <Ionicons name="home" size={24} color="#3B82F6" />
          </View>
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/dashboard/reports')}>
          <View style={styles.navIconContainer}>
            <Ionicons name="document-text" size={24} color="#6B7280" />
          </View>
          <Text style={styles.navText}>Reports</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/dashboard/profile')}>
          <View style={styles.navIconContainer}>
            <Ionicons name="person" size={24} color="#6B7280" />
          </View>
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Sidebar Overlay */}
      {sidebarVisible && (
        <Animated.View 
          style={[
            styles.overlay,
            { opacity: overlayAnim }
          ]}
        >
          <TouchableOpacity 
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={closeSidebar}
          />
        </Animated.View>
      )}

      {/* Sidebar */}
      {sidebarVisible && (
        <Animated.View 
          style={[
            styles.sidebar,
            { transform: [{ translateX: sidebarAnim }] }
          ]}
        >
          {/* Sidebar Header */}
          <LinearGradient
            colors={['#3B82F6', '#1D4ED8']}
            style={styles.sidebarHeader}
          >
            <TouchableOpacity onPress={handleProfilePress} style={styles.sidebarProfile}>
              <View style={styles.sidebarAvatar}>
                <Ionicons name="person" size={40} color="#FFFFFF" />
              </View>
              <View style={styles.sidebarUserInfo}>
                <Text style={styles.sidebarUserName}>{userData.name}</Text>
                <Text style={styles.sidebarUserEmail}>{userData.email}</Text>
                <View style={styles.sidebarRoleBadge}>
                  <Text style={styles.sidebarRoleText}>{userData.role}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </LinearGradient>

          {/* Sidebar Menu */}
          <ScrollView style={styles.sidebarMenu} showsVerticalScrollIndicator={false}>
            <Text style={styles.menuSectionTitle}>MAIN MENU</Text>
            
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleMenuItemPress(item)}
              >
                <View style={styles.menuItemIcon}>
                  <Ionicons name={item.icon} size={22} color="#4B5563" />
                </View>
                <Text style={styles.menuItemText}>{item.title}</Text>
              </TouchableOpacity>
            ))}

            {/* Share App Section */}
            <View style={styles.shareCard}>
              <View style={styles.shareHeader}>
                <Ionicons name="share-social" size={24} color="#10B981" />
                <Text style={styles.shareTitle}>Share Donation App</Text>
              </View>
              <Text style={styles.shareText}>
                Help others manage their donations effectively!
              </Text>
              <TouchableOpacity style={styles.shareButton} onPress={handleShareApp}>
                <Ionicons name="share-outline" size={18} color="#FFFFFF" />
                <Text style={styles.shareButtonText}>Share App</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Sidebar Footer */}
          <View style={styles.sidebarFooter}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Success Modal */}
      <Modal transparent visible={showSuccessModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <Ionicons name="checkmark-circle" size={50} color="#10B981" />
            <Text style={styles.modalText}>{modalMessage}</Text>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal transparent visible={showErrorModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.errorModal}>
            <Ionicons name="alert-circle" size={50} color="#EF4444" />
            <Text style={styles.modalText}>{modalMessage}</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  // INCREASED HEADER PADDING
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40, // Increased from 50/30
    paddingBottom: 26, // Increased from 20
    paddingHorizontal: 26,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuButton: {
    padding: 10, // Increased from 8
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 22, // Slightly larger
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13, // Slightly larger
    color: '#E5E7EB',
    marginTop: 4,
  },
  autoRefreshButton: {
    padding: 10, // Increased from 8
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
  },
  scrollView: {
    flex: 1,
  },
  // ADDED: Content container padding
  scrollViewContent: {
    paddingBottom: 120, // Increased bottom padding for bottom nav
  },
  welcomeCard: {
    margin: 20,
    borderRadius: 20,
    padding: 24, // Increased from 20
    marginTop: 10, // Added top margin
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 20, // Increased from 16
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 22, // Increased from 20
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6, // Increased from 4
  },
  welcomeSubtitle: {
    fontSize: 15, // Increased from 14
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12, // Increased from 8
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)', // Slightly more visible
    paddingHorizontal: 14, // Increased from 12
    paddingVertical: 6, // Increased from 4
    borderRadius: 14, // Increased from 12
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 13, // Increased from 12
    color: '#FFFFFF',
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 28, // Increased from 24
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20, // Increased from 16
  },
  sectionTitle: {
    fontSize: 20, // Increased from 18
    fontWeight: 'bold',
    color: '#1F2937',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    marginRight: 4,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18, // Increased from 16
    padding: 18, // Increased from 16
    marginBottom: 18, // Increased from 16
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, // Increased shadow
    shadowOpacity: 0.12, // Increased opacity
    shadowRadius: 10, // Increased from 8
    elevation: 4, // Increased from 3
  },
  iconContainer: {
    width: 52, // Increased from 48
    height: 52, // Increased from 48
    borderRadius: 26, // Increased from 24
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14, // Increased from 12
  },
  summaryNumber: {
    fontSize: 22, // Increased from 20
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6, // Increased from 4
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  typeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14, // Increased from 12
    padding: 18, // Increased from 16
    marginBottom: 14, // Increased from 12
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, // Increased
    shadowOpacity: 0.08, // Increased
    shadowRadius: 6, // Increased from 4
    elevation: 3, // Increased from 2
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14, // Increased from 12
  },
  typeIconContainer: {
    width: 40, // Increased from 36
    height: 40, // Increased from 36
    borderRadius: 20, // Increased from 18
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14, // Increased from 12
  },
  typeName: {
    flex: 1,
    fontSize: 17, // Increased from 16
    fontWeight: '600',
    color: '#1F2937',
  },
  typePercentage: {
    fontSize: 17, // Increased from 16
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  progressBar: {
    height: 10, // Increased from 8
    backgroundColor: '#F3F4F6',
    borderRadius: 5, // Increased from 4
    marginBottom: 14, // Increased from 12
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5, // Increased from 4
  },
  typeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  typeAmount: {
    fontSize: 15, // Increased from 14
    fontWeight: '600',
    color: '#1F2937',
  },
  donorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14, // Increased from 12
    padding: 18, // Increased from 16
    marginBottom: 14, // Increased from 12
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  donorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18, // Increased from 16
  },
  rankBadge: {
    width: 44, // Increased from 40
    height: 44, // Increased from 40
    borderRadius: 22, // Increased from 20
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14, // Increased from 12
  },
  rankText: {
    fontSize: 18, // Increased from 16
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  donorInfo: {
    flex: 1,
  },
  donorName: {
    fontSize: 17, // Increased from 16
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4, // Increased from 2
  },
  donorPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  donorStats: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10, // Increased from 8
    padding: 14, // Increased from 12
  },
  donorStat: {
    flex: 1,
    alignItems: 'center',
  },
  donorStatValue: {
    fontSize: 18, // Increased from 16
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 6, // Increased from 4
    marginBottom: 4, // Increased from 2
  },
  donorStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  divider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 14, // Increased from 12
  },
  monthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  monthName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 14,
  },
  monthStats: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
  },
  monthStat: {
    flex: 1,
    alignItems: 'center',
  },
  monthStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  monthStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  connectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18, // Increased from 16
    padding: 22, // Increased from 20
    marginHorizontal: 20,
    marginBottom: 28, // Increased from 24
    marginTop: 10, // Added top margin
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14, // Increased from 12
  },
  connectionTitle: {
    fontSize: 19, // Increased from 18
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 14, // Increased from 12
  },
  connectionText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 18, // Increased from 16
    lineHeight: 22, // Increased from 20
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14, // Increased from 12
    borderRadius: 10, // Increased from 8
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 10, // Increased from 8
    fontSize: 15, // Increased from 14
  },
  // REPLACED spacer with bottomSpacer
  bottomSpacer: {
    height: 160, // Increased from 100 to accommodate bottom nav
  },
  // ENHANCED Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5, // Thicker border
    borderTopColor: '#E5E7EB',
    paddingVertical: 18, // Increased from 12
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20, // Extra padding for iOS home indicator
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconContainer: {
    width: 48, // Increased from 40
    height: 52, // Increased from 40
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16, // Increased spacing
  },
  navText: {
    fontSize: 13, // Increased from 12
    color: '#6B7280',
    fontWeight: '500', // Medium weight
    marginTop: 4,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouchable: {
    flex: 1,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  sidebarHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40, // Increased from 50/30
    paddingBottom: 25, // Increased from 20
    paddingHorizontal: 20,
  },
  sidebarProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sidebarAvatar: {
    width: 65, // Increased from 60
    height: 65, // Increased from 60
    borderRadius: 32.5, // Increased from 30
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18, // Increased from 16
  },
  sidebarUserInfo: {
    flex: 1,
  },
  sidebarUserName: {
    fontSize: 20, // Increased from 18
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6, // Increased from 4
  },
  sidebarUserEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 10, // Increased from 8
  },
  sidebarRoleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 14, // Increased from 12
    paddingVertical: 6, // Increased from 4
    borderRadius: 14, // Increased from 12
    alignSelf: 'flex-start',
  },
  sidebarRoleText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sidebarMenu: {
    flex: 1,
    padding: 24, // Increased from 20
  },
  menuSectionTitle: {
    fontSize: 13, // Increased from 12
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 20, // Increased from 16
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16, // Increased from 14
    paddingHorizontal: 10, // Increased from 8
    borderRadius: 12, // Increased from 10
    marginBottom: 8, // Increased from 6
  },
  menuItemIcon: {
    width: 44, // Increased from 40
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 17, // Increased from 16
    color: '#1F2937',
    fontWeight: '500',
    marginLeft: 14, // Increased from 12
  },
  shareCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 18, // Increased from 16
    padding: 22, // Increased from 20
    marginTop: 24, // Increased from 20
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  shareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14, // Increased from 12
  },
  shareTitle: {
    fontSize: 17, // Increased from 16
    fontWeight: 'bold',
    color: '#059669',
    marginLeft: 14, // Increased from 12
  },
  shareText: {
    fontSize: 14,
    color: '#059669',
    marginBottom: 18, // Increased from 16
    lineHeight: 22, // Increased from 20
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16, // Increased from 14
    borderRadius: 14, // Increased from 12
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 17, // Increased from 16
    marginLeft: 10, // Increased from 8
  },
  sidebarFooter: {
    padding: 22, // Increased from 20
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 18, // Increased from 16
    borderRadius: 14, // Increased from 12
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 17, // Increased from 16
    marginLeft: 14, // Increased from 12
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  successModal: {
    backgroundColor: '#FFFFFF',
    padding: 28, // Increased from 24
    borderRadius: 18, // Increased from 16
    alignItems: 'center',
    minWidth: 220, // Increased from 200
  },
  errorModal: {
    backgroundColor: '#FFFFFF',
    padding: 28,
    borderRadius: 18,
    alignItems: 'center',
    minWidth: 220,
  },
  modalText: {
    marginTop: 16, // Increased from 12
    fontSize: 17, // Increased from 16
    color: '#1F2937',
    textAlign: 'center',
  },
});

export default DonationSummaryScreen;