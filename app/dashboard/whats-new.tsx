import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
} from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface Update {
  id: number;
  title: string;
  description: string;
  date: string;
  version: string;
  type: 'feature' | 'improvement' | 'bugfix';
  isNew: boolean;
  icon: string;
}

export default function WhatsNewScreen() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [updates, setUpdates] = useState<Update[]>([
    {
      id: 1,
      title: 'Smart Service Matching',
      description: 'Our AI now suggests the best mechanics based on your vehicle type and service needs.',
      date: 'Just now',
      version: 'v3.2.0',
      type: 'feature',
      isNew: true,
      icon: 'robot',
    },
    {
      id: 2,
      title: 'Real-Time Tracking',
      description: 'Track your mechanic in real-time and get ETA updates for mobile services.',
      date: '2 days ago',
      version: 'v3.1.8',
      type: 'feature',
      isNew: true,
      icon: 'map-marker-path',
    },
    {
      id: 3,
      title: 'Enhanced Payment Security',
      description: 'Added biometric authentication and improved encryption for all transactions.',
      date: '1 week ago',
      version: 'v3.1.5',
      type: 'improvement',
      isNew: false,
      icon: 'shield-check',
    },
    {
      id: 4,
      title: 'Chat Improvements',
      description: 'Faster message delivery and support for sending photos to mechanics.',
      date: '2 weeks ago',
      version: 'v3.1.2',
      type: 'improvement',
      isNew: false,
      icon: 'chat-plus',
    },
    {
      id: 5,
      title: 'Bug Fixes',
      description: 'Fixed notification issues and improved app stability on older devices.',
      date: '3 weeks ago',
      version: 'v3.1.0',
      type: 'bugfix',
      isNew: false,
      icon: 'bug-check',
    },
  ]);
  const { theme } = useTheme();
  const router = useRouter();

  const filters = [
    { id: 'all', label: 'All Updates' },
    { id: 'feature', label: 'New Features' },
    { id: 'improvement', label: 'Improvements' },
    { id: 'bugfix', label: 'Bug Fixes' },
  ];

  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
  const cardColor = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const textSecondaryColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature': return 'from-purple-500 to-pink-500';
      case 'improvement': return 'from-blue-500 to-cyan-500';
      case 'bugfix': return 'from-green-500 to-emerald-500';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'feature': return 'NEW FEATURE';
      case 'improvement': return 'IMPROVEMENT';
      case 'bugfix': return 'BUG FIX';
      default: return 'UPDATE';
    }
  };

  const filteredUpdates = selectedFilter === 'all' 
    ? updates 
    : updates.filter(update => update.type === selectedFilter);

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View className="relative">
        <View className={`h-56 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-b-3xl`}>
          <View className="p-5 pt-10">
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-white text-4xl font-bold">What's New</Text>
                <Text className="text-white/80 text-lg">Latest updates & features</Text>
              </View>
              <TouchableOpacity className="bg-white/20 p-3 rounded-full">
                <Ionicons name="notifications" size={28} color="white" />
              </TouchableOpacity>
            </View>
            
            <View className="bg-white/10 rounded-2xl p-4">
              <Text className="text-white text-center font-bold">
                🚀 Version 3.2.0 is here with AI-powered matching!
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View className="mx-5 -mt-8">
        <View className={`${cardColor} rounded-2xl p-5 shadow-2xl`}>
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className={`text-2xl font-bold ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`}>
                {updates.filter(u => u.isNew).length}
              </Text>
              <Text className={`text-sm ${textSecondaryColor}`}>New Features</Text>
            </View>
            <View className="items-center">
              <Text className={`text-2xl font-bold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>
                {updates.length}
              </Text>
              <Text className={`text-sm ${textSecondaryColor}`}>Total Updates</Text>
            </View>
            <View className="items-center">
              <Text className={`text-2xl font-bold ${theme === 'dark' ? 'text-green-300' : 'text-green-600'}`}>
                100%
              </Text>
              <Text className={`text-sm ${textSecondaryColor}`}>App Stability</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 mt-6 mb-4">
        <View className="flex-row space-x-3">
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              className={`px-5 py-3 rounded-xl ${
                selectedFilter === filter.id 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500' 
                  : cardColor
              } shadow-lg`}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text className={
                selectedFilter === filter.id 
                  ? 'text-white font-bold' 
                  : `${textColor} font-semibold`
              }>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Updates List */}
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="space-y-4 pb-10">
          {filteredUpdates.map((update) => (
            <TouchableOpacity
              key={update.id}
              className={`${cardColor} rounded-2xl overflow-hidden shadow-xl`}
            >
              {/* Update Header */}
              <View className={`p-5 bg-gradient-to-r ${getTypeColor(update.type)}`}>
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-xl bg-white/20 items-center justify-center mr-3">
                      <MaterialIcons name={update.icon as any} size={28} color="white" />
                    </View>
                    <View>
                      <Text className="text-white text-xl font-bold">{update.title}</Text>
                      <Text className="text-white/80">{update.date} • {update.version}</Text>
                    </View>
                  </View>
                  {update.isNew && (
                    <View className="bg-white px-3 py-1 rounded-full">
                      <Text className="text-purple-600 font-bold text-xs">NEW</Text>
                    </View>
                  )}
                </View>
                
                <View className="bg-white/10 px-3 py-1 rounded-full self-start">
                  <Text className="text-white font-bold text-xs">{getTypeLabel(update.type)}</Text>
                </View>
              </View>
              
              {/* Update Content */}
              <View className="p-5">
                <Text className={`${textSecondaryColor} mb-4 leading-6`}>
                  {update.description}
                </Text>
                
                <View className="flex-row space-x-3">
                  <TouchableOpacity className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 py-3 rounded-xl items-center">
                    <Text className="text-white font-semibold">Try Feature</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-1 border border-blue-500 py-3 rounded-xl items-center">
                    <Text className="text-blue-500 font-semibold">Learn More</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

 
    </SafeAreaView>
  );
}