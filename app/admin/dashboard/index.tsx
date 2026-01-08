// app/admin/dashboard/index.tsx
import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialIcons,
} from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  change?: string;
}

const StatsCard = ({ title, value, icon, color, change }: StatsCardProps) => {
  const { theme } = useTheme();
  
  const renderIcon = () => {
    switch (icon) {
      case 'users':
        return <Ionicons name="people" size={24} color="white" />;
      case 'booking':
        return <Ionicons name="calendar" size={24} color="white" />;
      case 'money':
        return <FontAwesome5 name="money-bill-wave" size={20} color="white" />;
      case 'services':
        return <MaterialIcons name="build" size={24} color="white" />;
      default:
        return <Feather name="trending-up" size={24} color="white" />;
    }
  };

  return (
    <View className={`rounded-2xl p-5 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
      <View className="flex-row justify-between items-center">
        <View>
          <Text className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {title}
          </Text>
          <Text className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {value}
          </Text>
          {change && (
            <Text className={`text-xs mt-1 ${change.includes('+') ? 'text-green-500' : 'text-red-500'}`}>
              {change} from last month
            </Text>
          )}
        </View>
        <View className={`w-12 h-12 rounded-xl ${color} items-center justify-center`}>
          {renderIcon()}
        </View>
      </View>
    </View>
  );
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  
  // Removed unused setStats - kept stats as a regular variable since it's not being updated
  const stats = {
    totalBookings: 1245,
    activeUsers: 567,
    totalRevenue: 45890,
    pendingBookings: 23,
    completedServices: 892,
    activeGarages: 15,
  };
  
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
  const textColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const cardColor = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';

  const chartConfig = {
    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
    backgroundGradientFrom: theme === 'dark' ? '#1f2937' : '#ffffff',
    backgroundGradientTo: theme === 'dark' ? '#374151' : '#f3f4f6',
    decimalPlaces: 0,
    color: (opacity = 1) => theme === 'dark' ? `rgba(96, 165, 250, ${opacity})` : `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => theme === 'dark' ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
  };

  const bookingData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      data: [65, 78, 56, 102, 124, 98],
    }],
  };

  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      data: [6500, 7800, 5600, 10200, 12400, 9800],
    }],
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${bgColor} items-center justify-center`}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-4 ${textColor}`}>Loading admin dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      <View className="p-5">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className={`text-2xl font-bold ${textColor}`}>Admin Dashboard</Text>
            <Text className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              Overview of your business
            </Text>
          </View>
          <TouchableOpacity 
            className="p-3 rounded-full bg-blue-600"
            onPress={() => router.push('/dashboard')}
          >
            <Text className="text-white font-semibold">User View</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Stats Grid */}
          <View className="mb-6">
            <Text className={`text-lg font-semibold ${textColor} mb-3`}>Quick Stats</Text>
            <View className="flex-row flex-wrap justify-between">
              <View className="w-[48%] mb-4">
                <StatsCard
                  title="Total Bookings"
                  value={stats.totalBookings}
                  icon="booking"
                  color="bg-blue-500"
                  change="+12%"
                />
              </View>
              <View className="w-[48%] mb-4">
                <StatsCard
                  title="Active Users"
                  value={stats.activeUsers}
                  icon="users"
                  color="bg-green-500"
                  change="+8%"
                />
              </View>
              <View className="w-[48%]">
                <StatsCard
                  title="Total Revenue"
                  value={`$${stats.totalRevenue.toLocaleString()}`}
                  icon="money"
                  color="bg-purple-500"
                  change="+15%"
                />
              </View>
              <View className="w-[48%]">
                <StatsCard
                  title="Active Garages"
                  value={stats.activeGarages}
                  icon="services"
                  color="bg-orange-500"
                  change="+5%"
                />
              </View>
            </View>
          </View>

          {/* Charts */}
          <View className={`${cardColor} rounded-2xl p-5 mb-6 shadow-sm ${borderColor} border`}>
            <Text className={`text-lg font-semibold ${textColor} mb-4`}>Monthly Bookings</Text>
            <LineChart
              data={bookingData}
              width={SCREEN_WIDTH - 60}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={{ borderRadius: 16 }}
            />
          </View>

          <View className={`${cardColor} rounded-2xl p-5 mb-6 shadow-sm ${borderColor} border`}>
            <Text className={`text-lg font-semibold ${textColor} mb-4`}>Revenue Overview</Text>
            <BarChart
              data={revenueData}
              width={SCREEN_WIDTH - 60}
              height={220}
              yAxisLabel="$"
              yAxisSuffix=""
              chartConfig={chartConfig}
              style={{ borderRadius: 16 }}
              verticalLabelRotation={0}
              showValuesOnTopOfBars={true}
            />
          </View>

          {/* Recent Activity */}
          <View className={`${cardColor} rounded-2xl p-5 shadow-sm ${borderColor} border`}>
            <View className="flex-row justify-between items-center mb-4">
              <Text className={`text-lg font-semibold ${textColor}`}>Recent Activity</Text>
              <TouchableOpacity>
                <Text className="text-blue-500 font-medium">View All</Text>
              </TouchableOpacity>
            </View>
            
            <View className="space-y-4">
              {[
                { id: 1, action: 'New booking created', user: 'John Doe', time: '10 min ago' },
                { id: 2, action: 'Service completed', user: 'Auto Fix Garage', time: '30 min ago' },
                { id: 3, action: 'New garage registered', user: 'Speedy Repairs', time: '1 hour ago' },
                { id: 4, action: 'Payment received', user: 'Sarah Johnson', time: '2 hours ago' },
              ].map((activity) => (
                <View key={activity.id} className="flex-row items-center">
                  <View className={`w-10 h-10 rounded-full ${
                    activity.id % 2 === 0 ? 'bg-green-100' : 'bg-blue-100'
                  } items-center justify-center mr-3`}>
                    <Ionicons 
                      name={activity.id % 2 === 0 ? 'checkmark-circle' : 'add-circle'} 
                      size={20} 
                      color={activity.id % 2 === 0 ? '#10b981' : '#3b82f6'} 
                    />
                  </View>
                  <View className="flex-1">
                    <Text className={`font-medium ${textColor}`}>{activity.action}</Text>
                    <Text className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {activity.user} • {activity.time}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View className="h-20" /> {/* Bottom padding */}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}