import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'support';
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  edited?: boolean;
  replyTo?: Message | null;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi! Welcome to AutoFix Support. How can I help you today?',
      sender: 'support',
      timestamp: new Date(Date.now() - 3600000),
      status: 'read',
    },
    {
      id: '2',
      text: 'Hi there! My car is making a strange noise when I brake.',
      sender: 'user',
      timestamp: new Date(Date.now() - 3500000),
      status: 'read',
    },
    {
      id: '3',
      text: 'I can help with that. Can you describe the sound? Is it grinding, squealing, or clicking?',
      sender: 'support',
      timestamp: new Date(Date.now() - 3400000),
      status: 'read',
    },
    {
      id: '4',
      text: 'It\'s a high-pitched squealing sound that happens every time I brake.',
      sender: 'user',
      timestamp: new Date(Date.now() - 3300000),
      status: 'read',
    },
    {
      id: '5',
      text: 'That sounds like worn brake pads. When was the last time you had them replaced?',
      sender: 'support',
      timestamp: new Date(Date.now() - 3200000),
      status: 'read',
    },
  ]);
  
  const [inputText, setInputText] = useState('');
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showActions, setShowActions] = useState<{message: Message, position: {x: number, y: number}} | null>(null);
  const [supportTyping, setSupportTyping] = useState(false);
  const { theme } = useTheme();
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const themeColors = {
    dark: {
      bg: 'bg-gray-900',
      card: 'bg-gray-800',
      input: 'bg-gray-700',
      text: {
        primary: 'text-gray-100',
        secondary: 'text-gray-400',
        tertiary: 'text-gray-500',
      },
      bubble: {
        user: 'bg-blue-600',
        support: 'bg-gray-700',
      },
      border: 'border-gray-700',
      shadow: 'shadow-black/50',
    },
    light: {
      bg: 'bg-gray-50',
      card: 'bg-white',
      input: 'bg-gray-100',
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        tertiary: 'text-gray-500',
      },
      bubble: {
        user: 'bg-blue-500',
        support: 'bg-gray-200',
      },
      border: 'border-gray-200',
      shadow: 'shadow-gray-400/20',
    },
  };

  const colors = themeColors[theme];

  // Fixed useEffect dependencies
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, supportTyping]);

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sending':
        return <Ionicons name="time" size={12} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />;
      case 'sent':
        return <Ionicons name="checkmark" size={12} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />;
      case 'delivered':
        return <Ionicons name="checkmark-done" size={12} color="#3B82F6" />;
      case 'read':
        return <Ionicons name="checkmark-done" size={12} color="#10B981" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const sendMessage = () => {
    if (inputText.trim() === '') return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
      edited: false,
      replyTo: replyingTo,
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setReplyingTo(null);
    setEditingMessage(null);

    // Simulate sending
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? {...msg, status: 'sent'} : msg
      ));
      
      // Simulate delivery
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id ? {...msg, status: 'delivered'} : msg
        ));
        
        // Simulate read
        setTimeout(() => {
          setMessages(prev => prev.map(msg => 
            msg.id === newMessage.id ? {...msg, status: 'read'} : msg
          ));
        }, 1000);
      }, 1000);
    }, 500);

    // Simulate support typing
    setSupportTyping(true);
    setTimeout(() => {
      const responses = [
        "Thanks for sharing that information. Let me check what options we have available for you.",
        "I understand. Let me look into available appointment slots for brake inspection.",
        "Based on your description, it does sound like brake pads. Would you like me to schedule an inspection?",
        "That's a common issue with worn brake pads. We have same-day appointments available."
      ];
      
      const supportReply: Message = {
        id: (Date.now() + 1).toString(),
        text: responses[Math.floor(Math.random() * responses.length)],
        sender: 'support',
        timestamp: new Date(),
        status: 'read',
      };
      
      setMessages(prev => [...prev, supportReply]);
      setSupportTyping(false);
    }, 2000);
  };

  const editMessage = (message: Message) => {
    setEditingMessage(message);
    setInputText(message.text);
    setReplyingTo(message.replyTo || null);
    setShowActions(null);
  };

  const updateMessage = () => {
    if (!editingMessage || inputText.trim() === '') return;

    setMessages(prev => prev.map(msg =>
      msg.id === editingMessage.id 
        ? {...msg, text: inputText, edited: true, timestamp: new Date()}
        : msg
    ));

    setInputText('');
    setEditingMessage(null);
    setReplyingTo(null);
  };

  const deleteMessage = (messageId: string) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setMessages(prev => prev.filter(msg => msg.id !== messageId));
            setShowActions(null);
          },
        },
      ]
    );
  };

  const replyToMessage = (message: Message) => {
    setReplyingTo(message);
    setShowActions(null);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setInputText('');
    setReplyingTo(null);
  };

  const MessageBubble = ({ message }: { message: Message }) => {
    const isUser = message.sender === 'user';
    const scaleAnim = useRef(new Animated.Value(0.5)).current;

    // Fixed useEffect dependency
    useEffect(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 150,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, [scaleAnim]);

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderRelease: (evt, gestureState) => {
          if (gestureState.dx === 0 && gestureState.dy === 0) {
            // Long press detection
            setShowActions({
              message,
              position: { 
                x: evt.nativeEvent.pageX, 
                y: evt.nativeEvent.pageY 
              }
            });
          }
        },
      })
    ).current;

    return (
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          opacity: fadeAnim,
        }}
        className={`my-2 ${isUser ? 'items-end' : 'items-start'}`}
      >
        {message.replyTo && (
          <View 
            className={`mb-2 px-4 py-2 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-200/50'
            } border-l-4 ${isUser ? 'border-blue-500' : 'border-gray-400'} ml-4`}
            style={{ maxWidth: '80%' }}
          >
            <Text className={`text-xs font-semibold ${colors.text.secondary}`}>
              {message.replyTo.sender === 'user' ? 'You' : 'Support'}
            </Text>
            <Text className={`text-sm ${colors.text.primary}`} numberOfLines={2}>
              {message.replyTo.text}
            </Text>
          </View>
        )}
        
        <View
          {...panResponder.panHandlers}
          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
            isUser 
              ? `${colors.bubble.user} rounded-tr-none` 
              : `${colors.bubble.support} rounded-tl-none`
          }`}
          style={{
            shadowColor: isUser ? '#3B82F6' : '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text className={`${isUser ? 'text-white' : colors.text.primary} text-base`}>
            {message.text}
          </Text>
          
          <View className="flex-row items-center justify-end mt-2 space-x-2">
            {message.edited && (
              <Text className={`text-xs ${isUser ? 'text-blue-200' : colors.text.tertiary}`}>
                Edited
              </Text>
            )}
            <Text className={`text-xs ${isUser ? 'text-blue-200' : colors.text.tertiary}`}>
              {formatTime(message.timestamp)}
            </Text>
            {isUser && getStatusIcon(message.status)}
          </View>
        </View>
      </Animated.View>
    );
  };

  const SupportTypingIndicator = () => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
      className="flex-row items-center mb-4"
    >
      <View className={`${colors.bubble.support} rounded-2xl rounded-tl-none px-4 py-3`}>
        <View className="flex-row space-x-1">
          <View className="w-2 h-2 bg-gray-400 rounded-full" style={{ opacity: 0.6 }} />
          <View className="w-2 h-2 bg-gray-400 rounded-full" style={{ opacity: 0.6 }} />
          <View className="w-2 h-2 bg-gray-400 rounded-full" style={{ opacity: 0.6 }} />
        </View>
      </View>
    </Animated.View>
  );

  const windowDimensions = Dimensions.get('window');

  return (
    <SafeAreaView className={`flex-1 ${colors.bg}`}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <Animated.View 
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
        className={`px-5 py-4 ${colors.card} border-b ${colors.border} shadow-lg`}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="mr-4 p-1"
            >
              <Ionicons 
                name="arrow-back" 
                size={24} 
                color={theme === 'dark' ? '#f3f4f6' : '#111827'} 
              />
            </TouchableOpacity>
            
            <View className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 items-center justify-center mr-3">
              <MaterialCommunityIcons name="toolbox" size={24} color="white" />
            </View>
            
            <View>
              <Text className={`text-xl font-bold ${colors.text.primary}`}>
                AutoFix Support
              </Text>
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <Text className={`text-sm ${colors.text.secondary}`}>
                  Online • Usually replies instantly
                </Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity onPress={() => Alert.alert('Chat Info', 'Support available 24/7')}>
            <Ionicons 
              name="information-circle" 
              size={24} 
              color={theme === 'dark' ? '#f3f4f6' : '#111827'} 
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Chat Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 16 }}
        >
          {/* Welcome Message */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
            className="items-center mb-6"
          >
            <View className={`px-4 py-3 rounded-2xl ${colors.card} border ${colors.border} shadow-sm`}>
              <Text className={`text-center ${colors.text.secondary}`}>
                Today at {new Date().toLocaleDateString()}
              </Text>
            </View>
          </Animated.View>

          {/* Messages */}
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {/* Typing Indicator */}
          {supportTyping && <SupportTypingIndicator />}
        </ScrollView>

        {/* Reply Preview */}
        {replyingTo && !editingMessage && (
          <View className={`px-4 py-3 ${colors.card} border-t ${colors.border}`}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <MaterialIcons name="reply" size={20} color="#3B82F6" />
                <View className="ml-3 flex-1">
                  <Text className={`text-sm font-semibold ${colors.text.primary}`}>
                    Replying to {replyingTo.sender === 'user' ? 'yourself' : 'support'}
                  </Text>
                  <Text className={`text-sm ${colors.text.secondary}`} numberOfLines={1}>
                    {replyingTo.text}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={cancelReply} className="ml-2">
                <Ionicons name="close" size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Edit Preview */}
        {editingMessage && (
          <View className={`px-4 py-3 ${colors.card} border-t ${colors.border} bg-blue-500/10`}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <Feather name="edit-2" size={20} color="#3B82F6" />
                <View className="ml-3 flex-1">
                  <Text className={`text-sm font-semibold ${colors.text.primary}`}>
                    Editing message
                  </Text>
                  <Text className={`text-sm ${colors.text.secondary}`} numberOfLines={1}>
                    {editingMessage.text}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={cancelEdit} className="ml-2">
                <Ionicons name="close" size={20} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Input Area */}
        <View className={`px-4 py-3 ${colors.card} border-t ${colors.border}`}>
          <View className="flex-row items-center">
            <TouchableOpacity className="p-2">
              <Feather name="plus-circle" size={24} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
            
            <TextInput
              className={`flex-1 mx-2 px-4 py-3 rounded-full ${colors.input} ${colors.text.primary}`}
              placeholder="Type your message..."
              placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            
            {inputText.trim() === '' ? (
              <TouchableOpacity className="p-2">
                <Feather name="camera" size={24} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full active:scale-95"
                onPress={editingMessage ? updateMessage : sendMessage}
              >
                {editingMessage ? (
                  <Feather name="check" size={20} color="white" />
                ) : (
                  <Ionicons name="send" size={20} color="white" />
                )}
              </TouchableOpacity>
            )}
          </View>
          
          {/* Character Count */}
          {inputText.length > 0 && (
            <Text className={`text-right text-xs mt-1 ${colors.text.tertiary}`}>
              {inputText.length}/500
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Message Actions Modal */}
      <Modal
        transparent
        visible={!!showActions}
        animationType="fade"
        onRequestClose={() => setShowActions(null)}
      >
        <Pressable
          className="flex-1 bg-black/50"
          onPress={() => setShowActions(null)}
        >
          {showActions && (
            <View
              className="absolute"
              style={{
                top: Math.min(showActions.position.y - 100, windowDimensions.height - 200),
                left: Math.min(showActions.position.x - 100, windowDimensions.width - 200),
              }}
            >
              <View className={`w-48 rounded-xl p-2 ${colors.card} shadow-2xl`}>
                {showActions.message.sender === 'user' && (
                  <>
                    <TouchableOpacity
                      className="flex-row items-center px-3 py-3 rounded-lg active:bg-gray-100 dark:active:bg-gray-700"
                      onPress={() => editMessage(showActions.message)}
                    >
                      <Feather name="edit-2" size={18} color={theme === 'dark' ? '#f3f4f6' : '#111827'} />
                      <Text className={`ml-3 ${colors.text.primary}`}>Edit</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      className="flex-row items-center px-3 py-3 rounded-lg active:bg-gray-100 dark:active:bg-gray-700"
                      onPress={() => deleteMessage(showActions.message.id)}
                    >
                      <MaterialIcons name="delete-outline" size={18} color="#EF4444" />
                      <Text className="ml-3 text-red-500">Delete</Text>
                    </TouchableOpacity>
                  </>
                )}
                
                <TouchableOpacity
                  className="flex-row items-center px-3 py-3 rounded-lg active:bg-gray-100 dark:active:bg-gray-700"
                  onPress={() => replyToMessage(showActions.message)}
                >
                  <MaterialIcons name="reply" size={18} color={theme === 'dark' ? '#f3f4f6' : '#111827'} />
                  <Text className={`ml-3 ${colors.text.primary}`}>Reply</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="flex-row items-center px-3 py-3 rounded-lg active:bg-gray-100 dark:active:bg-gray-700"
                  onPress={() => {
                    // Copy to clipboard
                    Alert.alert('Copied', 'Message copied to clipboard');
                    setShowActions(null);
                  }}
                >
                  <Feather name="copy" size={18} color={theme === 'dark' ? '#f3f4f6' : '#111827'} />
                  <Text className={`ml-3 ${colors.text.primary}`}>Copy</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Pressable>
      </Modal>

      {/* Chat Info Floating Button */}
      <TouchableOpacity
        className={`absolute bottom-24 right-4 w-14 h-14 rounded-full items-center justify-center shadow-2xl ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } active:scale-95`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        }}
        onPress={() => {
          Alert.alert(
            'Chat Information',
            `• Support Agent: Sarah Johnson\n• Specialty: Brake & Suspension\n• Experience: 8 years\n• Response Time: < 2 minutes\n• Chat Started: ${new Date().toLocaleString()}\n\nNeed immediate help? Call emergency support at 1-800-AUTO-FIX`,
            [{ text: 'OK' }]
          );
        }}
      >
        <MaterialCommunityIcons name="account-tie" size={24} color="#3B82F6" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}