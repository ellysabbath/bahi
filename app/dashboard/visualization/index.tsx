// app/visualization.tsx
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
  Dimensions,
  StyleSheet,
  Platform,
  Alert,
  Share,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Link } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart, LineChart, PieChart, ProgressChart } from 'react-native-chart-kit';

// Type definitions
interface DonationSummaryData {
  summary: {
    total_donations: number;
    total_amount: number;
    total_zaka: number;
    total_ctf_donations: number;
    total_church_donations: number;
    total_ctf: number;
    total_church: number;
    total_all: number;
  };
  type_distribution: Array<{
    donation_type: string;
    count: number;
    total: number;
    percentage: number;
  }>;
  top_donors: Array<{
    user__id: number;
    user__fullname: string;
    user__mobile_number: string;
    total_donated: number;
    donation_count: number;
  }>;
  top_churches: Array<{
    church__id: number;
    church__church_name: string;
    total_received: number;
    donation_count: number;
  }>;
  monthly_trend: Array<{
    month: string;
    total: number;
    count: number;
  }>;
}

const API_URL = 'https://mhazini.pythonanywhere.com/api/auth/donations/summary/';
const { width, height } = Dimensions.get('window');

const VisualizationScreen: React.FC = () => {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [summaryData, setSummaryData] = useState<DonationSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [offline, setOffline] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showThemeModal, setShowThemeModal] = useState<boolean>(false);
  const [selectedChartType, setSelectedChartType] = useState<string>('bar');

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
      chartGrid: '#e2e8f0',
      chartText: '#64748b',
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
      chartGrid: '#334155',
      chartText: '#cbd5e1',
    },
  };

  const currentColors = colors[theme];

  // Chart colors
  const chartColors = {
    primary: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
    success: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
    warning: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a'],
    danger: ['#ef4444', '#f87171', '#fca5a5', '#fecaca'],
    gradient: ['#4f46e5', '#7c3aed', '#a855f7', '#d946ef'],
    rainbow: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
  };

  // Chart configuration
  const chartConfig = {
    backgroundGradientFrom: currentColors.cardBackground,
    backgroundGradientTo: currentColors.cardBackground,
    decimalPlaces: 0,
    color: (opacity = 1) => theme === 'dark' ? `rgba(203, 213, 225, ${opacity})` : `rgba(71, 85, 105, ${opacity})`,
    labelColor: (opacity = 1) => theme === 'dark' ? `rgba(203, 213, 225, ${opacity})` : `rgba(71, 85, 105, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: currentColors.buttonPrimary,
    },
    propsForBackgroundLines: {
      strokeWidth: 1,
      stroke: currentColors.chartGrid,
      strokeDasharray: "0",
    },
  };

  // Toggle theme
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format number with commas
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Fetch data from API
  const fetchFromAPI = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: DonationSummaryData = await response.json();
      
      // Store in AsyncStorage
      await AsyncStorage.setItem('visualization_data', JSON.stringify(data));
      await AsyncStorage.setItem('visualization_last_updated', new Date().toISOString());
      
      setSummaryData(data);
      setOffline(false);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('API fetch error:', error);
      // Try to load from storage
      const storedData = await AsyncStorage.getItem('visualization_data');
      if (storedData) {
        setSummaryData(JSON.parse(storedData));
        setOffline(true);
        const storedTime = await AsyncStorage.getItem('visualization_last_updated');
        if (storedTime) {
          setLastUpdated(new Date(storedTime));
        }
      } else {
        setError('Failed to fetch data. Please check your connection.');
      }
    }
  }, []);

  // Initialize data
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

  // Handle refresh
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

  // Handle share
  const handleShare = async () => {
    try {
      const message = `📊 Donation Visualization Summary\n\n` +
        `Total Donations: ${summaryData?.summary.total_donations}\n` +
        `Total Amount: ${formatCurrency(summaryData?.summary.total_amount || 0)}\n` +
        `Last Updated: ${lastUpdated?.toLocaleDateString()}`;
      
      await Share.share({
        message,
        title: 'Donation Visualization',
      });
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share visualization');
    }
  };

  // Prepare chart data functions
  const prepareMonthlyChartData = () => {
    if (!summaryData?.monthly_trend) return { labels: [], datasets: [{ data: [] }] };
    
    const labels = summaryData.monthly_trend.map(item => {
      const date = new Date(item.month + '-01');
      return date.toLocaleDateString('en-US', { month: 'short' });
    });
    
    const data = summaryData.monthly_trend.map(item => item.total / 1000);
    
    return {
      labels,
      datasets: [{
        data,
        color: (opacity = 1) => theme === 'dark' ? `rgba(59, 130, 246, ${opacity})` : `rgba(37, 99, 235, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  };

  const prepareTypeDistributionData = () => {
    if (!summaryData?.type_distribution) return [];
    
    return summaryData.type_distribution.map((item, index) => ({
      name: item.donation_type.charAt(0).toUpperCase() + item.donation_type.slice(1),
      population: item.total,
      color: chartColors.rainbow[index % chartColors.rainbow.length],
      legendFontColor: currentColors.textSecondary,
      legendFontSize: 12,
    }));
  };

  const prepareDonationCountData = () => {
    if (!summaryData?.type_distribution) return [];
    
    return summaryData.type_distribution.map((item, index) => ({
      name: item.donation_type.charAt(0).toUpperCase() + item.donation_type.slice(1),
      population: item.count,
      color: chartColors.success[index % chartColors.success.length],
      legendFontColor: currentColors.textSecondary,
      legendFontSize: 12,
    }));
  };

  // Loading state
  if (loading && !summaryData) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: currentColors.background }]}>
        <ActivityIndicator size="large" color={currentColors.buttonPrimary} />
        <Text style={{ color: currentColors.textSecondary, marginTop: 16, fontSize: 16 }}>
          Loading visualization data...
        </Text>
      </View>
    );
  }

  // Error state
  if (error && !summaryData) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: currentColors.background, padding: 20 }]}>
        <Ionicons name="alert-circle-outline" size={80} color={currentColors.danger} />
        <Text style={{ color: currentColors.danger, fontSize: 22, fontWeight: 'bold', marginTop: 24, marginBottom: 8 }}>
          Unable to Load Data
        </Text>
        <Text style={{ color: currentColors.textSecondary, textAlign: 'center', marginBottom: 32, fontSize: 16 }}>
          {error}
        </Text>
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: currentColors.buttonPrimary }]}
          onPress={handleRetry}
        >
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render Overview Tab
  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Summary Cards */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: currentColors.textPrimary }]}>
          📊 Quick Overview
        </Text>
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: currentColors.cardBackground }]}>
            <LinearGradient
              colors={[chartColors.primary[0], chartColors.primary[2]]}
              style={styles.summaryIcon}
            >
              <Ionicons name="receipt-outline" size={24} color="#ffffff" />
            </LinearGradient>
            <Text style={[styles.summaryValue, { color: currentColors.textPrimary }]}>
              {formatNumber(summaryData!.summary.total_donations)}
            </Text>
            <Text style={[styles.summaryLabel, { color: currentColors.textSecondary }]}>
              Total Donations
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: currentColors.cardBackground }]}>
            <LinearGradient
              colors={[chartColors.success[0], chartColors.success[2]]}
              style={styles.summaryIcon}
            >
              <Ionicons name="cash-outline" size={24} color="#ffffff" />
            </LinearGradient>
            <Text style={[styles.summaryValue, { color: currentColors.textPrimary }]}>
              {formatCurrency(summaryData!.summary.total_amount)}
            </Text>
            <Text style={[styles.summaryLabel, { color: currentColors.textSecondary }]}>
              Total Amount
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: currentColors.cardBackground }]}>
            <LinearGradient
              colors={[chartColors.warning[0], chartColors.warning[2]]}
              style={styles.summaryIcon}
            >
              <Ionicons name="people-outline" size={24} color="#ffffff" />
            </LinearGradient>
            <Text style={[styles.summaryValue, { color: currentColors.textPrimary }]}>
              {formatNumber(summaryData!.top_donors.length)}
            </Text>
            <Text style={[styles.summaryLabel, { color: currentColors.textSecondary }]}>
              Top Donors
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: currentColors.cardBackground }]}>
            <LinearGradient
              colors={[chartColors.danger[0], chartColors.danger[2]]}
              style={styles.summaryIcon}
            >
              <Ionicons name="business-outline" size={24} color="#ffffff" />
            </LinearGradient>
            <Text style={[styles.summaryValue, { color: currentColors.textPrimary }]}>
              {formatNumber(summaryData!.top_churches.length)}
            </Text>
            <Text style={[styles.summaryLabel, { color: currentColors.textSecondary }]}>
              Top Churches
            </Text>
          </View>
        </View>
      </View>

      {/* Monthly Trend Chart */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: currentColors.textPrimary }]}>
            📈 Monthly Trend
          </Text>
          <View style={styles.chartTypeSelector}>
            <TouchableOpacity
              style={[styles.chartTypeButton, selectedChartType === 'line' && styles.activeChartTypeButton]}
              onPress={() => setSelectedChartType('line')}
            >
              <Ionicons 
                name="trending-up" 
                size={20} 
                color={selectedChartType === 'line' ? '#ffffff' : currentColors.iconSecondary} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chartTypeButton, selectedChartType === 'bar' && styles.activeChartTypeButton]}
              onPress={() => setSelectedChartType('bar')}
            >
              <Ionicons 
                name="bar-chart" 
                size={20} 
                color={selectedChartType === 'bar' ? '#ffffff' : currentColors.iconSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={[styles.chartContainer, { backgroundColor: currentColors.cardBackground }]}>
          {selectedChartType === 'line' ? (
            <LineChart
              data={prepareMonthlyChartData()}
              width={width - 60}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              formatYLabel={(value) => `${value}K`}
            />
          ) : (
            <BarChart
              data={prepareMonthlyChartData()}
              width={width - 60}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              showValuesOnTopOfBars
            />
          )}
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: chartColors.primary[0] }]} />
              <Text style={[styles.legendText, { color: currentColors.textSecondary }]}>
                Total Amount (in thousands)
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Distribution Charts */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: currentColors.textPrimary }]}>
          🎯 Donation Distribution
        </Text>
        
        <View style={styles.distributionRow}>
          <View style={[styles.chartContainer, styles.smallChart, { backgroundColor: currentColors.cardBackground }]}>
            <PieChart
              data={prepareTypeDistributionData()}
              width={width / 2 - 40}
              height={180}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
            <Text style={[styles.chartTitle, { color: currentColors.textPrimary }]}>
              By Amount
            </Text>
          </View>

          <View style={[styles.chartContainer, styles.smallChart, { backgroundColor: currentColors.cardBackground }]}>
            <PieChart
              data={prepareDonationCountData()}
              width={width / 2 - 40}
              height={180}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
            <Text style={[styles.chartTitle, { color: currentColors.textPrimary }]}>
              By Count
            </Text>
          </View>
        </View>
      </View>

      {/* Progress Chart */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: currentColors.textPrimary }]}>
          📊 Allocation Progress
        </Text>
        
        <View style={[styles.chartContainer, { backgroundColor: currentColors.cardBackground }]}>
          <ProgressChart
            data={{
              labels: ['Zaka', 'CTF', 'Church'],
              data: [
                summaryData!.summary.total_zaka / summaryData!.summary.total_amount,
                summaryData!.summary.total_ctf / summaryData!.summary.total_amount,
                summaryData!.summary.total_church / summaryData!.summary.total_amount,
              ]
            }}
            width={width - 60}
            height={220}
            strokeWidth={16}
            radius={32}
            chartConfig={chartConfig}
            hideLegend={false}
            style={styles.chart}
          />
          <View style={styles.progressLabels}>
            {['Zaka', 'CTF', 'Church'].map((label, index) => {
              const percentage = [
                summaryData!.summary.total_zaka / summaryData!.summary.total_amount,
                summaryData!.summary.total_ctf / summaryData!.summary.total_amount,
                summaryData!.summary.total_church / summaryData!.summary.total_amount,
              ][index];
              
              return (
                <View key={index} style={styles.progressLabelItem}>
                  <View style={[styles.progressColor, { backgroundColor: chartColors.rainbow[index] }]} />
                  <Text style={[styles.progressLabelText, { color: currentColors.textSecondary }]}>
                    {label}: {(percentage * 100).toFixed(1)}%
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // Render Donors Tab
  const renderDonorsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.sectionTitle, { color: currentColors.textPrimary, marginHorizontal: 20 }]}>
        🏆 Top Donors
      </Text>
      
      {summaryData!.top_donors.map((donor, index) => (
        <View key={donor.user__id} style={[styles.donorCard, { backgroundColor: currentColors.cardBackground }]}>
          <View style={styles.donorHeader}>
            <View style={styles.donorRank}>
              <Text style={styles.donorRankText}>#{index + 1}</Text>
            </View>
            <View style={styles.donorInfo}>
              <Text style={[styles.donorName, { color: currentColors.textPrimary }]}>
                {donor.user__fullname}
              </Text>
              <Text style={[styles.donorPhone, { color: currentColors.textSecondary }]}>
                {donor.user__mobile_number}
              </Text>
            </View>
            <View style={styles.donorStats}>
              <Text style={[styles.donorAmount, { color: currentColors.success }]}>
                {formatCurrency(donor.total_donated)}
              </Text>
            </View>
          </View>
          
          {/* Custom progress bar */}
          <View style={styles.donorProgress}>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { 
                width: `${(donor.donation_count / Math.max(...summaryData!.top_donors.map(d => d.donation_count)) * 100)}%`,
                backgroundColor: chartColors.rainbow[index % chartColors.rainbow.length]
              }]} />
            </View>
            <View style={styles.donorDetails}>
              <View style={styles.donorDetailItem}>
                <Ionicons name="receipt-outline" size={16} color={currentColors.iconSecondary} />
                <Text style={[styles.donorDetailText, { color: currentColors.textSecondary }]}>
                  {donor.donation_count} donations
                </Text>
              </View>
              <View style={styles.donorDetailItem}>
                <Ionicons name="cash-outline" size={16} color={currentColors.iconSecondary} />
                <Text style={[styles.donorDetailText, { color: currentColors.textSecondary }]}>
                  Avg: {formatCurrency(donor.total_donated / donor.donation_count)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  // Render Churches Tab
  const renderChurchesTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.sectionTitle, { color: currentColors.textPrimary, marginHorizontal: 20 }]}>
        ⛪ Top Churches
      </Text>
      
      {summaryData!.top_churches.map((church, index) => (
        <View key={church.church__id} style={[styles.churchCard, { backgroundColor: currentColors.cardBackground }]}>
          <View style={styles.churchHeader}>
            <View style={styles.churchIcon}>
              <Ionicons name="business" size={28} color={chartColors.rainbow[index % chartColors.rainbow.length]} />
            </View>
            <View style={styles.churchInfo}>
              <Text style={[styles.churchName, { color: currentColors.textPrimary }]}>
                {church.church__church_name}
              </Text>
              <View style={styles.churchStats}>
                <View style={styles.churchStatItem}>
                  <Ionicons name="people" size={14} color={currentColors.iconSecondary} />
                  <Text style={[styles.churchStatText, { color: currentColors.textSecondary }]}>
                    {church.donation_count} donations
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.churchAmount}>
              <Text style={[styles.churchAmountText, { color: currentColors.success }]}>
                {formatCurrency(church.total_received)}
              </Text>
            </View>
          </View>
          
          {/* Horizontal Bar Chart for Church Performance */}
          <View style={styles.churchChart}>
            <View style={styles.chartLabel}>
              <Text style={[styles.chartLabelText, { color: currentColors.textSecondary }]}>
                Performance
              </Text>
              <Text style={[styles.chartValueText, { color: currentColors.textPrimary }]}>
                {(church.total_received / Math.max(...summaryData!.top_churches.map(c => c.total_received)) * 100).toFixed(0)}%
              </Text>
            </View>
            <View style={styles.churchProgressBarContainer}>
              <View style={[styles.churchProgressBar, { 
                width: `${(church.total_received / Math.max(...summaryData!.top_churches.map(c => c.total_received)) * 100)}%`,
                backgroundColor: chartColors.rainbow[index % chartColors.rainbow.length]
              }]} />
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <StatusBar 
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={currentColors.headerBackground} 
      />
      
      {/* Header */}
      <LinearGradient
        colors={[currentColors.gradientStart, currentColors.gradientEnd]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>📊 Data Visualization</Text>
              {lastUpdated && (
                <Text style={styles.headerSubtitle}>
                  Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={toggleTheme} style={styles.headerActionButton}>
                <Ionicons 
                  name={theme === 'dark' ? 'sunny' : 'moon'} 
                  size={22} 
                  color="#ffffff" 
                />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleShare} style={styles.headerActionButton}>
                <Ionicons name="share-outline" size={22} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
          
          {offline && (
            <View style={styles.offlineBadge}>
              <Ionicons name="cloud-offline-outline" size={16} color="#ffffff" />
              <Text style={styles.offlineText}>Offline Mode</Text>
            </View>
          )}
        </View>
        
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {['overview', 'donors', 'churches'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}>
                {tab === 'overview' ? '📈 Overview' : 
                 tab === 'donors' ? '👥 Donors' : '⛪ Churches'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* Content */}
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
      >
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'donors' && renderDonorsTab()}
        {activeTab === 'churches' && renderChurchesTab()}
      </ScrollView>

      {/* Refresh Button */}
      <TouchableOpacity
        style={[styles.refreshButton, { backgroundColor: currentColors.buttonPrimary }]}
        onPress={onRefresh}
      >
        <Ionicons name="refresh" size={24} color="#ffffff" />
        <Text style={styles.refreshButtonText}>Refresh Data</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  offlineText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeTabButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  chartContainer: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  smallChart: {
    width: '48%',
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  chartTypeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 4,
  },
  chartTypeButton: {
    padding: 8,
    borderRadius: 6,
    marginHorizontal: 2,
  },
  activeChartTypeButton: {
    backgroundColor: '#3b82f6',
  },
  chartLegend: {
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
  },
  distributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabels: {
    marginTop: 16,
  },
  progressLabelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  progressLabelText: {
    fontSize: 14,
  },
  donorCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  donorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  donorRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  donorRankText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  donorInfo: {
    flex: 1,
  },
  donorName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  donorPhone: {
    fontSize: 14,
  },
  donorStats: {
    alignItems: 'flex-end',
  },
  donorAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  donorProgress: {
    marginTop: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  donorDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  donorDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  donorDetailText: {
    fontSize: 12,
    marginLeft: 4,
  },
  churchCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  churchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  churchIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  churchInfo: {
    flex: 1,
  },
  churchName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  churchStats: {
    flexDirection: 'row',
  },
  churchStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  churchStatText: {
    fontSize: 12,
    marginLeft: 4,
  },
  churchAmount: {
    alignItems: 'flex-end',
  },
  churchAmountText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  churchChart: {
    marginTop: 8,
  },
  chartLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chartLabelText: {
    fontSize: 12,
  },
  chartValueText: {
    fontSize: 12,
    fontWeight: '600',
  },
  churchProgressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  churchProgressBar: {
    height: '100%',
    borderRadius: 4,
  },
  refreshButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default VisualizationScreen;