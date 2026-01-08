import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';

import React, { useState } from 'react';
import {

  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';



interface SafetyTip {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  importance: 'high' | 'medium' | 'low';
}

interface ChecklistItem {
  id: number;
  title: string;
  description: string;
  isChecked: boolean;
}

export default function SafetyScreen() {
  const [expandedTip, setExpandedTip] = useState<number | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: 1, title: 'Check tire pressure', description: 'Ensure proper inflation', isChecked: true },
    { id: 2, title: 'Inspect brake fluid', description: 'Check level and color', isChecked: false },
    { id: 3, title: 'Test headlights & signals', description: 'All lights functioning', isChecked: true },
    { id: 4, title: 'Check engine oil', description: 'Level and quality', isChecked: false },
    { id: 5, title: 'Inspect windshield wipers', description: 'Replace if needed', isChecked: false },
  ]);
  const { theme } = useTheme();


  const safetyTips: SafetyTip[] = [
    {
      id: 1,
      title: 'Regular Maintenance',
      description: 'Follow manufacturer-recommended service intervals to prevent breakdowns and ensure optimal performance.',
      icon: 'wrench',
      color: 'from-blue-500 to-cyan-500',
      importance: 'high',
    },
    {
      id: 2,
      title: 'Tire Safety',
      description: 'Check tire pressure monthly and inspect tread depth regularly. Replace tires when tread reaches 2/32".',
      icon: 'tire',
      color: 'from-green-500 to-emerald-500',
      importance: 'high',
    },
    {
      id: 3,
      title: 'Brake System',
      description: 'Listen for unusual noises and have brakes inspected every 12,000 miles or as recommended.',
      icon: 'car-brake-abs',
      color: 'from-red-500 to-rose-500',
      importance: 'high',
    },
    {
      id: 4,
      title: 'Fluid Levels',
      description: 'Regularly check engine oil, coolant, brake fluid, and transmission fluid levels.',
      icon: 'water',
      color: 'from-purple-500 to-pink-500',
      importance: 'medium',
    },
    {
      id: 5,
      title: 'Emergency Kit',
      description: 'Always carry a basic emergency kit including jumper cables, flashlight, and first aid supplies.',
      icon: 'first-aid',
      color: 'from-orange-500 to-amber-500',
      importance: 'medium',
    },
  ];

  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
  const cardColor = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const textSecondaryColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';

  const toggleChecklist = (id: number) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, isChecked: !item.isChecked } : item
    ));
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View className="px-5 pt-5 pb-3">
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className={`text-3xl font-bold ${textColor}`}>Safety First</Text>
            <Text className={`text-lg ${textSecondaryColor}`}>Your guide to safe driving</Text>
          </View>
          <TouchableOpacity className={`p-3 rounded-xl ${cardColor} shadow-lg`}>
            <Ionicons name="shield-checkmark" size={28} color="#10b981" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 mb-6">
        <View className="flex-row space-x-4">
          <View className={`w-40 rounded-2xl p-4 bg-gradient-to-r from-blue-500 to-indigo-500`}>
            <MaterialCommunityIcons name="car-brake-alert" size={32} color="white" />
            <Text className="text-white text-2xl font-bold mt-2">98%</Text>
            <Text className="text-white/80 text-sm">Accident Prevention</Text>
          </View>
          <View className={`w-40 rounded-2xl p-4 bg-gradient-to-r from-green-500 to-emerald-500`}>
            <MaterialIcons name="verified" size={32} color="white" />
            <Text className="text-white text-2xl font-bold mt-2">24/7</Text>
            <Text className="text-white/80 text-sm">Roadside Assistance</Text>
          </View>
          <View className={`w-40 rounded-2xl p-4 bg-gradient-to-r from-red-500 to-rose-500`}>
            <FontAwesome5 name="user-shield" size={28} color="white" />
            <Text className="text-white text-2xl font-bold mt-2">1000+</Text>
            <Text className="text-white/80 text-sm">Lives Protected</Text>
          </View>
        </View>
      </ScrollView>

      {/* Safety Checklist */}
      <View className={`mx-5 mb-6 ${cardColor} rounded-2xl p-5 shadow-lg`}>
        <Text className={`text-xl font-bold mb-4 ${textColor}`}>📋 Monthly Safety Checklist</Text>
        <Text className={`mb-4 ${textSecondaryColor}`}>Complete these tasks for maximum safety</Text>
        
        <View className="space-y-3">
          {checklist.map((item) => (
            <TouchableOpacity
              key={item.id}
              className="flex-row items-center p-3 rounded-xl bg-gray-100 dark:bg-gray-900"
              onPress={() => toggleChecklist(item.id)}
            >
              <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                item.isChecked ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'
              }`}>
                {item.isChecked && <Ionicons name="checkmark" size={20} color="white" />}
              </View>
              <View className="flex-1">
                <Text className={`font-semibold ${textColor}`}>{item.title}</Text>
                <Text className={`text-sm ${textSecondaryColor}`}>{item.description}</Text>
              </View>
              <Text className={`text-sm ${item.isChecked ? 'text-green-500' : textSecondaryColor}`}>
                {item.isChecked ? 'Completed' : 'Pending'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View className="mt-4 flex-row items-center justify-between">
          <Text className={`text-sm ${textSecondaryColor}`}>
            {checklist.filter(item => item.isChecked).length} of {checklist.length} completed
          </Text>
          <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-full">
            <Text className="text-white font-semibold">Save Progress</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Safety Tips */}
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <Text className={`text-xl font-bold mb-4 ${textColor}`}>🚨 Essential Safety Tips</Text>
        
        <View className="space-y-4 pb-10">
          {safetyTips.map((tip) => (
            <TouchableOpacity
              key={tip.id}
              className={`${cardColor} rounded-2xl overflow-hidden shadow-lg`}
              onPress={() => setExpandedTip(expandedTip === tip.id ? null : tip.id)}
            >
              {/* Tip Header */}
              <View className={`p-4 bg-gradient-to-r ${tip.color} flex-row items-center justify-between`}>
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-xl bg-white/20 items-center justify-center mr-3">
                    <MaterialCommunityIcons name={tip.icon as any} size={28} color="white" />
                  </View>
                  <View>
                    <Text className="text-white text-lg font-bold">{tip.title}</Text>
                    <View className="flex-row items-center mt-1">
                      <View className={`w-3 h-3 rounded-full ${getImportanceColor(tip.importance)} mr-2`} />
                      <Text className="text-white/80 text-sm">
                        {tip.importance.toUpperCase()} PRIORITY
                      </Text>
                    </View>
                  </View>
                </View>
                <Ionicons 
                  name={expandedTip === tip.id ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color="white" 
                />
              </View>
              
              {/* Tip Content */}
              {expandedTip === tip.id && (
                <View className="p-4">
                  <Text className={`${textSecondaryColor} leading-6`}>{tip.description}</Text>
                  
                  {/* Action Buttons */}
                  <View className="flex-row space-x-3 mt-4">
                    <TouchableOpacity className="flex-1 bg-blue-500 py-3 rounded-xl items-center">
                      <Text className="text-white font-semibold">Learn More</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-1 border border-blue-500 py-3 rounded-xl items-center">
                      <Text className="text-blue-500 font-semibold">Share Tip</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Emergency Section */}
      <View className={`p-5 ${cardColor} border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <View className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-5">
          <View className="flex-row items-center mb-3">
            <Ionicons name="warning" size={28} color="white" />
            <Text className="text-white text-xl font-bold ml-3">Emergency Assistance</Text>
          </View>
          <Text className="text-white/90 mb-4">
            In case of emergency, our 24/7 roadside assistance is just a tap away
          </Text>
          <TouchableOpacity className="bg-white py-4 rounded-xl items-center">
            <Text className="text-red-600 font-bold text-lg">🚨 CALL FOR HELP</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}