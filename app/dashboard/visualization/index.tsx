// app/visualization.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Animated,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Link } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  ProgressChart,
  ContributionGraph,
  StackedBarChart 
} from 'react-native-chart-kit';
import Svg, { Circle, Path, G, Text as SvgText } from 'react-native-svg';

// Type definitions matching your backend
interface DonationSummaryData {
  summary: {
    total_donations: number;
    total_amount: number;
    total_zaka: number;
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
    doner__id: number;
    doner__fullname: string;
    doner__mobile_number: string;
    total_donated: number;
    donation_count: number;
  }>;
  top_churches: Array<{
    church: string;
    total_received: number;
    donation_count: number;
  }>;
  monthly_trend: Array<{
    month: string;
    total: number;
    count: number;
  }>;
}

const API_URL = 'https://mhazini.pythonanywhere.com/api/auth/reports/total/summary/';
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
  const [selectedChartType, setSelectedChartType] = useState<string>('bar');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('monthly');
  const [animationValues] = useState({
    cards: new Animated.Value(0),
    charts: new Animated.Value(0),
    stats: new Animated.Value(0),
  });

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
      purple: '#8b5cf6',
      pink: '#ec4899',
      indigo: '#6366f1',
      teal: '#14b8a6',
      orange: '#f97316',
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
      purple: '#a78bfa',
      pink: '#f472b6',
      indigo: '#818cf8',
      teal: '#2dd4bf',
      orange: '#fb923c',
    },
  };

  const currentColors = colors[theme];

  // Chart colors array
  const chartColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#06b6d4'
  ];

  // Chart configuration
  const chartConfig = {
    backgroundGradientFrom: currentColors.cardBackground,
    backgroundGradientTo: currentColors.cardBackground,
    decimalPlaces: 0,
    color: (opacity = 1) => currentColors.textSecondary,
    labelColor: (opacity = 1) => currentColors.textSecondary,
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

  // Animated values
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Start animations
  useEffect(() => {
    if (summaryData) {
      // Rotation animation for loading
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Scale animation for cards
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();

      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [summaryData]);

  // Toggle theme
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    if (!amount) return 'TSh 0';
    return `TSh ${new Intl.NumberFormat('en-TZ', {
      minimumFractionDigits: 0,
    }).format(amount)}`;
  };

  // Format number with commas
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  // Fetch data from API
  const fetchFromAPI = useCallback(async (): Promise<void> => {
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
      
      if (response.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      
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
    } catch (error: any) {
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
        setError(error.message || 'Failed to fetch data. Please check your connection.');
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
      const message = `📊 SDA CTF Donation Summary\n\n` +
        `Total Donations: ${summaryData?.summary.total_donations}\n` +
        `Total Amount: ${formatCurrency(summaryData?.summary.total_amount || 0)}\n` +
        `Zaka: ${formatCurrency(summaryData?.summary.total_zaka || 0)}\n` +
        `CTF Total: ${formatCurrency(summaryData?.summary.total_ctf || 0)}\n` +
        `Church Total: ${formatCurrency(summaryData?.summary.total_church || 0)}\n` +
        `Last Updated: ${lastUpdated?.toLocaleDateString()}`;
      
      await Share.share({
        message,
        title: 'SDA CTF Donation Visualization',
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
      const [year, month] = item.month.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, 1)
        .toLocaleDateString('en-US', { month: 'short' });
    });
    
    const data = summaryData.monthly_trend.map(item => item.total / 1000);
    
    return {
      labels,
      datasets: [{
        data,
        color: (opacity = 1) => currentColors.buttonPrimary,
        strokeWidth: 2,
      }],
    };
  };

  const prepareTypeDistributionData = () => {
    if (!summaryData?.type_distribution) return [];
    
    return summaryData.type_distribution.map((item, index) => ({
      name: item.donation_type.replace('_', ' ').toUpperCase(),
      population: item.total,
      color: chartColors[index % chartColors.length],
      legendFontColor: currentColors.textSecondary,
      legendFontSize: 12,
    }));
  };

  const prepareDonationCountData = () => {
    if (!summaryData?.type_distribution) return [];
    
    return summaryData.type_distribution.map((item, index) => ({
      name: item.donation_type.replace('_', ' ').toUpperCase(),
      population: item.count,
      color: chartColors[(index + 2) % chartColors.length],
      legendFontColor: currentColors.textSecondary,
      legendFontSize: 12,
    }));
  };

  const prepareAllocationData = () => {
    if (!summaryData?.summary) return [];
    
    return [
      {
        name: 'ZAKA',
        amount: summaryData.summary.total_zaka,
        color: chartColors[0],
      },
      {
        name: 'CTF',
        amount: summaryData.summary.total_ctf,
        color: chartColors[1],
      },
      {
        name: 'CHURCH',
        amount: summaryData.summary.total_church,
        color: chartColors[2],
      },
    ];
  };

  // Custom Polar Chart Component
  const PolarChart = ({ data, size = 200 }: { data: any[], size?: number }) => {
    const radius = size / 2 - 20;
    const center = size / 2;
    
    // Calculate angles and coordinates
    const segments = data.map((item, index) => {
      const angle = (index / data.length) * Math.PI * 2;
      const value = item.amount / Math.max(...data.map(d => d.amount));
      const segmentRadius = radius * value;
      
      return {
        ...item,
        angle,
        x: center + segmentRadius * Math.cos(angle - Math.PI / 2),
        y: center + segmentRadius * Math.sin(angle - Math.PI / 2),
        radius: segmentRadius,
      };
    });

    return (
      <Svg width={size} height={size}>
        {/* Grid circles */}
        <Circle cx={center} cy={center} r={radius * 0.25} fill="none" stroke={currentColors.chartGrid} strokeWidth="1" strokeDasharray="5,5" />
        <Circle cx={center} cy={center} r={radius * 0.5} fill="none" stroke={currentColors.chartGrid} strokeWidth="1" strokeDasharray="5,5" />
        <Circle cx={center} cy={center} r={radius * 0.75} fill="none" stroke={currentColors.chartGrid} strokeWidth="1" strokeDasharray="5,5" />
        <Circle cx={center} cy={center} r={radius} fill="none" stroke={currentColors.chartGrid} strokeWidth="1" />
        
        {/* Grid lines */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
          const rad = (angle * Math.PI) / 180;
          const x1 = center + radius * Math.cos(rad);
          const y1 = center + radius * Math.sin(rad);
          return (
            <Path
              key={angle}
              d={`M${center} ${center} L${x1} ${y1}`}
              stroke={currentColors.chartGrid}
              strokeWidth="1"
            />
          );
        })}
        
        {/* Data segments */}
        {segments.map((segment, index) => (
          <G key={index}>
            <Path
              d={`M${center} ${center} L${segment.x} ${segment.y}`}
              stroke={segment.color}
              strokeWidth="3"
              strokeOpacity="0.7"
            />
            <Circle
              cx={segment.x}
              cy={segment.y}
              r="8"
              fill={segment.color}
              fillOpacity="0.8"
            />
            <SvgText
              x={center + (radius + 20) * Math.cos(segment.angle - Math.PI / 2)}
              y={center + (radius + 20) * Math.sin(segment.angle - Math.PI / 2)}
              fill={currentColors.textPrimary}
              fontSize="12"
              fontWeight="bold"
              textAnchor="middle"
            >
              {segment.name}
            </SvgText>
            <SvgText
              x={segment.x}
              y={segment.y - 15}
              fill={currentColors.textSecondary}
              fontSize="10"
              textAnchor="middle"
            >
              {formatCurrency(segment.amount)}
            </SvgText>
          </G>
        ))}
      </Svg>
    );
  };

  // Custom Radar Chart Component
  const RadarChart = ({ data, size = 200 }: { data: any[], size?: number }) => {
    const radius = size / 2 - 20;
    const center = size / 2;
    const sides = data.length;
    
    // Create polygon points
    const points = data.map((item, index) => {
      const angle = (index / sides) * Math.PI * 2 - Math.PI / 2;
      const value = item.amount / Math.max(...data.map(d => d.amount));
      const x = center + radius * value * Math.cos(angle);
      const y = center + radius * value * Math.sin(angle);
      return { x, y };
    });

    const pathData = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`
    ).join(' ') + ' Z';

    return (
      <Svg width={size} height={size}>
        {/* Grid polygons */}
        {[0.25, 0.5, 0.75, 1].map(scale => {
          const gridPoints = data.map((_, index) => {
            const angle = (index / sides) * Math.PI * 2 - Math.PI / 2;
            const x = center + radius * scale * Math.cos(angle);
            const y = center + radius * scale * Math.sin(angle);
            return { x, y };
          });
          
          const gridPath = gridPoints.map((point, index) => 
            `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`
          ).join(' ') + ' Z';

          return (
            <Path
              key={scale}
              d={gridPath}
              fill="none"
              stroke={currentColors.chartGrid}
              strokeWidth="1"
            />
          );
        })}
        
        {/* Grid lines */}
        {points.map((point, index) => (
          <Path
            key={`line-${index}`}
            d={`M${center} ${center} L${point.x} ${point.y}`}
            stroke={currentColors.chartGrid}
            strokeWidth="1"
          />
        ))}
        
        {/* Data polygon */}
        <Path
          d={pathData}
          fill={currentColors.buttonPrimary}
          fillOpacity="0.2"
          stroke={currentColors.buttonPrimary}
          strokeWidth="2"
        />
        
        {/* Data points */}
        {points.map((point, index) => (
          <G key={`point-${index}`}>
            <Circle
              cx={point.x}
              cy={point.y}
              r="6"
              fill={chartColors[index % chartColors.length]}
            />
            <SvgText
              x={point.x}
              y={point.y - 12}
              fill={currentColors.textPrimary}
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
            >
              {data[index].name}
            </SvgText>
            <SvgText
              x={point.x}
              y={point.y + 25}
              fill={currentColors.textSecondary}
              fontSize="9"
              textAnchor="middle"
            >
              {formatCurrency(data[index].amount)}
            </SvgText>
          </G>
        ))}
      </Svg>
    );
  };

  // Loading state
  if (loading && !summaryData) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: currentColors.background }]}>
        <Animated.View
          style={{
            transform: [{
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            }],
          }}
        >
          <Ionicons name="stats-chart" size={60} color={currentColors.buttonPrimary} />
        </Animated.View>
        <Text style={{ color: currentColors.textSecondary, marginTop: 20, fontSize: 18, fontWeight: '600' }}>
          Loading Visualization Data...
        </Text>
        <Text style={{ color: currentColors.textTertiary, marginTop: 8, fontSize: 14 }}>
          Fetching donation insights...
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
        <Text style={{ color: currentColors.textSecondary, textAlign: 'center', marginBottom: 32, fontSize: 16, lineHeight: 24 }}>
          {error}
        </Text>
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: currentColors.buttonPrimary }]}
          onPress={handleRetry}
        >
          <Ionicons name="refresh" size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render Overview Tab
  const renderOverviewTab = () => (
    <Animated.ScrollView 
      style={[styles.tabContent, { opacity: fadeAnim }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Summary Cards */}
      <Animated.View style={[
        styles.section,
        { transform: [{ scale: scaleAnim }] }
      ]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: currentColors.textPrimary }]}>
            📊 Quick Overview
          </Text>
          <TouchableOpacity style={styles.timeRangeSelector}>
            <Text style={[styles.timeRangeText, { color: currentColors.textSecondary }]}>
              {selectedTimeRange.toUpperCase()}
            </Text>
            <Ionicons name="chevron-down" size={16} color={currentColors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.summaryGrid}>
          {[
            { 
              icon: 'receipt-outline', 
              label: 'Total Donations', 
              value: summaryData!.summary.total_donations,
              color: chartColors[0],
              format: formatNumber 
            },
            { 
              icon: 'cash-outline', 
              label: 'Total Amount', 
              value: summaryData!.summary.total_amount,
              color: chartColors[1],
              format: formatCurrency 
            },
            { 
              icon: 'home-outline', 
              label: 'Zaka', 
              value: summaryData!.summary.total_zaka,
              color: chartColors[2],
              format: formatCurrency 
            },
            { 
              icon: 'business-outline', 
              label: 'CTF Total', 
              value: summaryData!.summary.total_ctf,
              color: chartColors[3],
              format: formatCurrency 
            },
          ].map((item, index) => (
            <Animated.View 
              key={index}
              style={[
                styles.summaryCard, 
                { 
                  backgroundColor: currentColors.cardBackground,
                  opacity: fadeAnim,
                  transform: [{
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  }],
                }
              ]}
            >
              <LinearGradient
                colors={[item.color, `${item.color}80`]}
                style={styles.summaryIcon}
              >
                <Ionicons name={item.icon as any} size={24} color="#ffffff" />
              </LinearGradient>
              <Text style={[styles.summaryValue, { color: currentColors.textPrimary }]}>
                {item.format(item.value)}
              </Text>
              <Text style={[styles.summaryLabel, { color: currentColors.textSecondary }]}>
                {item.label}
              </Text>
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      {/* Chart Type Selector */}
      <View style={styles.section}>
        <View style={styles.chartTypeContainer}>
          {['bar', 'line', 'polar', 'radar'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.chartTypeButton,
                selectedChartType === type && styles.activeChartTypeButton,
                { backgroundColor: currentColors.cardBackground }
              ]}
              onPress={() => setSelectedChartType(type)}
            >
              <Ionicons 
                name={
                  type === 'bar' ? 'bar-chart' :
                  type === 'line' ? 'trending-up' :
                  type === 'polar' ? 'navigate-circle' :
                  'speedometer'
                } 
                size={20} 
                color={selectedChartType === type ? '#ffffff' : currentColors.iconSecondary} 
              />
              <Text style={[
                styles.chartTypeText,
                { color: selectedChartType === type ? '#ffffff' : currentColors.textSecondary }
              ]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Main Chart */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: currentColors.textPrimary }]}>
          📈 Monthly Trend
        </Text>
        
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
              segments={5}
            />
          ) : selectedChartType === 'bar' ? (
            <BarChart
              data={prepareMonthlyChartData()}
              width={width - 60}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              showValuesOnTopOfBars
              fromZero
            />
          ) : selectedChartType === 'polar' ? (
            <View style={styles.customChartContainer}>
              <PolarChart 
                data={prepareAllocationData()} 
                size={width - 60}
              />
            </View>
          ) : (
            <View style={styles.customChartContainer}>
              <RadarChart 
                data={prepareAllocationData()} 
                size={width - 60}
              />
            </View>
          )}
          
          <View style={styles.chartLegend}>
            {selectedChartType === 'polar' || selectedChartType === 'radar' ? (
              <View style={styles.legendGrid}>
                {prepareAllocationData().map((item, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                    <Text style={[styles.legendText, { color: currentColors.textSecondary }]}>
                      {item.name}: {formatCurrency(item.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: currentColors.buttonPrimary }]} />
                <Text style={[styles.legendText, { color: currentColors.textSecondary }]}>
                  Total Amount (in thousands)
                </Text>
              </View>
            )}
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
              hasLegend={false}
            />
            <View style={styles.chartStats}>
              <Text style={[styles.chartTitle, { color: currentColors.textPrimary }]}>
                By Amount
              </Text>
              <Text style={[styles.chartSubtitle, { color: currentColors.textSecondary }]}>
                Total: {formatCurrency(summaryData!.summary.total_amount)}
              </Text>
            </View>
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
              hasLegend={false}
            />
            <View style={styles.chartStats}>
              <Text style={[styles.chartTitle, { color: currentColors.textPrimary }]}>
                By Count
              </Text>
              <Text style={[styles.chartSubtitle, { color: currentColors.textSecondary }]}>
                Total: {formatNumber(summaryData!.summary.total_donations)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Progress Allocation */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: currentColors.textPrimary }]}>
          📊 Allocation Breakdown
        </Text>
        
        <View style={[styles.chartContainer, { backgroundColor: currentColors.cardBackground }]}>
          <ProgressChart
            data={{
              labels: ['ZAKA', 'CTF', 'CHURCH'],
              data: [
                summaryData!.summary.total_zaka / summaryData!.summary.total_amount,
                summaryData!.summary.total_ctf / summaryData!.summary.total_amount,
                summaryData!.summary.total_church / summaryData!.summary.total_amount,
              ]
            }}
            width={width - 60}
            height={180}
            strokeWidth={16}
            radius={32}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1, index) => 
                index === 0 ? chartColors[0] :
                index === 1 ? chartColors[1] : chartColors[2],
            }}
            hideLegend={false}
            style={styles.chart}
          />
          <View style={styles.progressDetails}>
            {prepareAllocationData().map((item, index) => (
              <View key={index} style={styles.progressDetailItem}>
                <View style={[styles.progressColor, { backgroundColor: item.color }]} />
                <View style={styles.progressInfo}>
                  <Text style={[styles.progressLabel, { color: currentColors.textPrimary }]}>
                    {item.name}
                  </Text>
                  <View style={styles.progressValues}>
                    <Text style={[styles.progressAmount, { color: currentColors.textPrimary }]}>
                      {formatCurrency(item.amount)}
                    </Text>
                    <Text style={[styles.progressPercentage, { color: currentColors.textSecondary }]}>
                      {formatPercentage((item.amount / summaryData!.summary.total_amount) * 100)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Animated.ScrollView>
  );

  // Render Donors Tab
  const renderDonorsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: currentColors.textPrimary }]}>
          🏆 Top Donors
        </Text>
        
        {summaryData!.top_donors.slice(0, 10).map((donor, index) => (
          <View key={index} style={[styles.donorCard, { backgroundColor: currentColors.cardBackground }]}>
            <View style={styles.donorHeader}>
              <View style={[
                styles.donorRank,
                { 
                  backgroundColor: 
                    index === 0 ? '#FFD700' :
                    index === 1 ? '#C0C0C0' :
                    index === 2 ? '#CD7F32' : currentColors.buttonSecondary 
                }
              ]}>
                <Text style={styles.donorRankText}>#{index + 1}</Text>
              </View>
              <View style={styles.donorInfo}>
                <Text style={[styles.donorName, { color: currentColors.textPrimary }]}>
                  {donor.doner__fullname || `Donor ${donor.doner__id}`}
                </Text>
                <Text style={[styles.donorPhone, { color: currentColors.textSecondary }]}>
                  {donor.doner__mobile_number || 'No phone'}
                </Text>
              </View>
              <View style={styles.donorStats}>
                <Text style={[styles.donorAmount, { color: currentColors.success }]}>
                  {formatCurrency(donor.total_donated)}
                </Text>
              </View>
            </View>
            
            <View style={styles.donorProgress}>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { 
                  width: `${(donor.total_donated / Math.max(...summaryData!.top_donors.map(d => d.total_donated)) * 100)}%`,
                  backgroundColor: chartColors[index % chartColors.length]
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
      </View>
    </ScrollView>
  );

  // Render Churches Tab
  const renderChurchesTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: currentColors.textPrimary }]}>
          ⛪ Top Churches
        </Text>
        
        {summaryData!.top_churches.slice(0, 10).map((church, index) => (
          <View key={index} style={[styles.churchCard, { backgroundColor: currentColors.cardBackground }]}>
            <View style={styles.churchHeader}>
              <View style={styles.churchIcon}>
                <Ionicons name="business" size={28} color={chartColors[index % chartColors.length]} />
              </View>
              <View style={styles.churchInfo}>
                <Text style={[styles.churchName, { color: currentColors.textPrimary }]}>
                  {church.church || 'Unknown Church'}
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
                  backgroundColor: chartColors[index % chartColors.length]
                }]} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <StatusBar 
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={currentColors.gradientStart} 
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
        
        {/* Stats Footer */}
        <View style={[styles.statsFooter, { backgroundColor: currentColors.cardBackground }]}>
          <Text style={[styles.statsFooterTitle, { color: currentColors.textPrimary }]}>
            📈 Real-time Stats
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: currentColors.textSecondary }]}>Total All</Text>
              <Text style={[styles.statValue, { color: currentColors.textPrimary }]}>
                {formatCurrency(summaryData?.summary.total_all || 0)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: currentColors.textSecondary }]}>Church Total</Text>
              <Text style={[styles.statValue, { color: currentColors.textPrimary }]}>
                {formatCurrency(summaryData?.summary.total_church || 0)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: currentColors.textSecondary }]}>Donation Types</Text>
              <Text style={[styles.statValue, { color: currentColors.textPrimary }]}>
                {summaryData?.type_distribution.length || 0}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <Animated.View
        style={[
          styles.fabContainer,
          {
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0],
              }),
            }],
          }
        ]}
      >
        <TouchableOpacity
          style={[styles.fabButton, { backgroundColor: currentColors.buttonPrimary }]}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={24} color="#ffffff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fabButton, { backgroundColor: currentColors.success, marginLeft: 10 }]}
          onPress={handleShare}
        >
          <Ionicons name="share" size={24} color="#ffffff" />
        </TouchableOpacity>
      </Animated.View>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    elevation: 4,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    elevation: 2,
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
    elevation: 2,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
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
  timeRangeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  timeRangeText: {
    fontSize: 12,
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
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  chartTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chartTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activeChartTypeButton: {
    backgroundColor: '#3b82f6',
  },
  chartTypeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
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
  customChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  chartSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  chartStats: {
    alignItems: 'center',
    marginTop: 8,
  },
  chartLegend: {
    marginTop: 16,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
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
  smallChart: {
    width: '48%',
    alignItems: 'center',
  },
  progressDetails: {
    marginTop: 16,
  },
  progressDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  progressInfo: {
    flex: 1,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  progressValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressAmount: {
    fontSize: 12,
  },
  progressPercentage: {
    fontSize: 12,
  },
  donorCard: {
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
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    flexDirection: 'row',
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  statsFooter: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsFooterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default VisualizationScreen;