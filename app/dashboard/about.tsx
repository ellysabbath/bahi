import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
} from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  experience: string;
  image: string;
}

interface Milestone {
  year: string;
  title: string;
  description: string;
}

export default function AboutScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const teamMembers: TeamMember[] = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Chief Mechanic',
      experience: '15+ years',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop',
    },
    {
      id: 2,
      name: 'Mike Chen',
      role: 'Technical Director',
      experience: '12+ years',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    },
    {
      id: 3,
      name: 'Lisa Rodriguez',
      role: 'Customer Experience',
      experience: '8+ years',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    },
    {
      id: 4,
      name: 'David Park',
      role: 'Operations Head',
      experience: '10+ years',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    },
  ];

  const milestones: Milestone[] = [
    { year: '2010', title: 'Founded', description: 'Started with a single garage' },
    { year: '2014', title: 'Expansion', description: 'Opened 5 new locations' },
    { year: '2018', title: 'App Launch', description: 'Digital platform introduced' },
    { year: '2022', title: '100K+ Users', description: 'Served over 100,000 customers' },
    { year: '2024', title: 'AI Integration', description: 'Smart diagnostics launched' },
  ];

  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
  const cardColor = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const textSecondaryColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Static Header */}
      <View className={`p-5 pt-10 ${cardColor} shadow-lg`}>
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color={theme === 'dark' ? '#f3f4f6' : '#111827'} />
          </TouchableOpacity>
          <Text className={`text-xl font-bold ${textColor}`}>About Us</Text>
          <TouchableOpacity>
            <Ionicons name="share-social" size={24} color={theme === 'dark' ? '#f3f4f6' : '#111827'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View className="relative">
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&h=400&fit=crop' }}
            className="w-full h-64"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
          <View className="absolute bottom-0 left-0 right-0 p-5">
            <Text className="text-white text-4xl font-bold">Driven by Passion</Text>
            <Text className="text-white/90 text-lg mt-2">Trusted auto care since 2010</Text>
          </View>
        </View>

        {/* Mission Statement */}
        <View className={`mx-5 -mt-10 ${cardColor} rounded-3xl p-8 shadow-2xl`}>
          <View className="items-center mb-6">
            <View className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 items-center justify-center mb-4">
              <FontAwesome5 name="hands-helping" size={32} color="white" />
            </View>
            <Text className={`text-2xl font-bold text-center ${textColor}`}>
              Our Mission
            </Text>
          </View>
          <Text className={`text-center text-lg leading-7 ${textSecondaryColor}`}>
            To revolutionize auto care through innovative technology, 
            exceptional service, and genuine care for every vehicle and owner.
          </Text>
        </View>

        {/* Stats */}
        <View className="mx-5 my-8">
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className={`text-3xl font-bold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>
                50K+
              </Text>
              <Text className={`text-sm ${textSecondaryColor}`}>Happy Customers</Text>
            </View>
            <View className="items-center">
              <Text className={`text-3xl font-bold ${theme === 'dark' ? 'text-green-300' : 'text-green-600'}`}>
                150+
              </Text>
              <Text className={`text-sm ${textSecondaryColor}`}>Expert Mechanics</Text>
            </View>
            <View className="items-center">
              <Text className={`text-3xl font-bold ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`}>
                24/7
              </Text>
              <Text className={`text-sm ${textSecondaryColor}`}>Support</Text>
            </View>
            <View className="items-center">
              <Text className={`text-3xl font-bold ${theme === 'dark' ? 'text-yellow-300' : 'text-yellow-600'}`}>
                99%
              </Text>
              <Text className={`text-sm ${textSecondaryColor}`}>Satisfaction</Text>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View className="mx-5 mb-8">
          <Text className={`text-2xl font-bold mb-6 ${textColor}`}>🚀 Our Journey</Text>
          
          <View className="space-y-6">
            {milestones.map((milestone, index) => (
              <View key={index} className="flex-row">
                <View className="items-center mr-4">
                  <View className={`w-12 h-12 rounded-full bg-gradient-to-r ${
                    index % 3 === 0 ? 'from-blue-500 to-cyan-500' :
                    index % 3 === 1 ? 'from-green-500 to-emerald-500' :
                    'from-purple-500 to-pink-500'
                  } items-center justify-center`}>
                    <Text className="text-white font-bold">{milestone.year}</Text>
                  </View>
                  {index < milestones.length - 1 && (
                    <View className="w-1 h-16 bg-gray-300 dark:bg-gray-700 mt-2" />
                  )}
                </View>
                
                <View className={`flex-1 pb-6 ${index < milestones.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}>
                  <Text className={`text-xl font-bold ${textColor}`}>{milestone.title}</Text>
                  <Text className={`mt-1 ${textSecondaryColor}`}>{milestone.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Team Section */}
        <View className="mx-5 mb-8">
          <Text className={`text-2xl font-bold mb-6 ${textColor}`}>👥 Meet Our Experts</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="space-x-4">
            {teamMembers.map((member) => (
              <View key={member.id} className={`w-48 ${cardColor} rounded-2xl overflow-hidden shadow-xl`}>
                <Image
                  source={{ uri: member.image }}
                  className="w-full h-48"
                  resizeMode="cover"
                />
                <View className="p-4">
                  <Text className={`text-lg font-bold ${textColor}`}>{member.name}</Text>
                  <Text className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'} font-semibold mb-1`}>
                    {member.role}
                  </Text>
                  <Text className={`text-xs ${textSecondaryColor}`}>{member.experience} experience</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Values */}
        <View className="mx-5 mb-10">
          <Text className={`text-2xl font-bold mb-6 ${textColor}`}>🌟 Our Core Values</Text>
          
          <View className="space-y-4">
            <View className={`${cardColor} rounded-2xl p-5 shadow-lg`}>
              <View className="flex-row items-center mb-3">
                <View className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 items-center justify-center mr-3">
                  <FontAwesome5 name="shield-alt" size={24} color="#3b82f6" />
                </View>
                <Text className={`text-lg font-bold ${textColor}`}>Integrity First</Text>
              </View>
              <Text className={`${textSecondaryColor}`}>
                Honest diagnostics and transparent pricing with no hidden fees.
              </Text>
            </View>
            
            <View className={`${cardColor} rounded-2xl p-5 shadow-lg`}>
              <View className="flex-row items-center mb-3">
                <View className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 items-center justify-center mr-3">
                  <Ionicons name="star" size={24} color="#10b981" />
                </View>
                <Text className={`text-lg font-bold ${textColor}`}>Excellence Always</Text>
              </View>
              <Text className={`${textSecondaryColor}`}>
                Commitment to the highest quality service and customer satisfaction.
              </Text>
            </View>
            
            <View className={`${cardColor} rounded-2xl p-5 shadow-lg`}>
              <View className="flex-row items-center mb-3">
                <View className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 items-center justify-center mr-3">
                  <MaterialIcons name="lightbulb" size={24} color="#8b5cf6" />
                </View>
                <Text className={`text-lg font-bold ${textColor}`}>Innovation Driven</Text>
              </View>
              <Text className={`${textSecondaryColor}`}>
                Continuously improving with cutting-edge technology and techniques.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* CTA Footer */}
      <View className={`p-5 ${cardColor} border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <View className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6">
          <Text className="text-white text-xl font-bold text-center mb-3">
            Ready to experience premium auto care?
          </Text>
          <TouchableOpacity className="bg-white py-4 rounded-xl items-center">
            <Text className="text-blue-600 font-bold text-lg">Book Your Service Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}