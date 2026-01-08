// app/admin/manage/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = 'https://autofix.pythonanywhere.com';
const API_ENDPOINTS = {
  users: `${API_BASE_URL}/users/`,
  userDetail: (id: string) => `${API_BASE_URL}/users/${id}/`,
  activate: (id: string) => `${API_BASE_URL}/users/${id}/activate/`,
  deactivate: (id: string) => `${API_BASE_URL}/users/${id}/deactivate/`,
  delete: (id: string) => `${API_BASE_URL}/users/${id}/delete/`,
  verifyEmail: (id: string) => `${API_BASE_URL}/users/${id}/verify_email/`,
  verifyPhone: (id: string) => `${API_BASE_URL}/users/${id}/verify_phone/`,
  stats: `${API_BASE_URL}/users/stats/`,
  csrfToken: `${API_BASE_URL}/api/auth/csrf/`,
};

// Types matching Django backend
interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  state: string;
  role: 'admin' | 'mechanic' | 'garage_owner' | 'customer';
  role_display: string;
  is_active: boolean;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  registration_stage: number;
  date_joined: string;
  personal_info_completed_at: string | null;
  contact_details_completed_at: string | null;
  location_completed_at: string | null;
  security_completed_at: string | null;
  is_admin: boolean;
  is_mechanic: boolean;
  is_garage_owner: boolean;
  is_customer: boolean;
}

interface StatsData {
  total_users: number;
  active_users: number;
  verified_users: number;
  role_distribution: {
    admin?: number;
    garage_owner?: number;
    mechanic?: number;
    customer?: number;
  };
  registration_stages: {
    [key: string]: number;
  };
  recent_users: number;
}

// Configuration texts
const CONFIG_TEXTS = {
  deleteConfirm: {
    title: 'Delete User',
    message: 'Are you sure you want to permanently delete this user? This action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
  },
  deactivateConfirm: {
    title: 'Deactivate User',
    message: 'Are you sure you want to deactivate this user? They will not be able to log in.',
    confirmText: 'Deactivate',
    cancelText: 'Cancel',
  },
  activateConfirm: {
    title: 'Activate User',
    message: 'Are you sure you want to activate this user? They will be able to log in again.',
    confirmText: 'Activate',
    cancelText: 'Cancel',
  },
  roleChangeConfirm: {
    title: 'Change User Role',
    message: (oldRole: string, newRole: string) => 
      `Change user role from ${oldRole || 'current'} to ${newRole}? This will affect their permissions.`,
    confirmText: 'Change Role',
    cancelText: 'Cancel',
  },
  adminRoleWarning: {
    title: '⚠️ Admin Role Assignment',
    message: 'Are you sure you want to assign ADMIN role? This user will have full system access.',
    confirmText: 'Make Admin',
    cancelText: 'Cancel',
  },
  emailVerifyConfirm: {
    title: 'Verify Email',
    message: 'Mark this user\'s email as verified?',
    confirmText: 'Verify',
    cancelText: 'Cancel',
  },
  phoneVerifyConfirm: {
    title: 'Verify Phone',
    message: 'Mark this user\'s phone as verified?',
    confirmText: 'Verify',
    cancelText: 'Cancel',
  },
  successMessages: {
    delete: 'User deleted successfully!',
    deactivate: 'User deactivated successfully!',
    activate: 'User activated successfully!',
    roleChange: 'User role changed successfully!',
    adminRole: 'User is now an Administrator!',
    emailVerify: 'Email marked as verified!',
    phoneVerify: 'Phone marked as verified!',
    update: 'User updated successfully!',
  },
  errors: {
    noPermission: 'You do not have permission to perform this action.',
    somethingWentWrong: 'Something went wrong. Please try again.',
    networkError: 'Network error. Please check your connection.',
    unauthorized: 'Session expired. Please login again.',
    csrfMissing: 'CSRF token missing or invalid. Please refresh the page.',
  },
  roleDescriptions: {
    admin: 'Full system administrator with complete access to all features, user management, and system settings.',
    mechanic: 'Professional mechanic for performing repairs and maintenance services.',
    garage_owner: 'Business owner managing a garage with staff and service management capabilities.',
    customer: 'Personal customer account for booking services and managing appointments.',
  },
};

// Role-based permissions
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['delete', 'deactivate', 'activate', 'change_role', 'view_all', 'edit', 'verify_email', 'verify_phone', 'make_admin'],
  garage_owner: ['view_assigned', 'edit_profile'],
  mechanic: ['view_assigned', 'edit_profile'],
  customer: ['view_own'],
};

// Role options for selection
const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrator', icon: 'shield-outline' },
  { value: 'garage_owner', label: 'Garage Owner', icon: 'business-outline' },
  { value: 'mechanic', label: 'Mechanic', icon: 'construct-outline' },
  { value: 'customer', label: 'Customer', icon: 'person-outline' },
];

const UserManagement = () => {
  // State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [actionType, setActionType] = useState<
    'delete' | 'deactivate' | 'activate' | 'role_change' | 'verify_email' | 'verify_phone' | null
  >(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [newRole, setNewRole] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isFetchingCsrf, setIsFetchingCsrf] = useState(false);

  // Fetch current user from storage
  const fetchCurrentUser = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem('@autofix_user');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUser(user);
      }
    } catch {
      console.error('Failed to fetch current user');
    }
  }, []);

  // Load CSRF token
  const fetchCsrfToken = useCallback(async () => {
    try {
      setIsFetchingCsrf(true);
      
      const response = await fetch(API_ENDPOINTS.csrfToken, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.csrfToken) {
          setCsrfToken(data.csrfToken);
          await AsyncStorage.setItem('@autofix_csrf_token', data.csrfToken);
        } else {
          const cookies = response.headers.get('set-cookie');
          if (cookies) {
            const csrfMatch = cookies.match(/csrftoken=([^;]+)/);
            if (csrfMatch) {
              const token = csrfMatch[1];
              setCsrfToken(token);
              await AsyncStorage.setItem('@autofix_csrf_token', token);
            }
          }
        }
      } else {
        const storedToken = await AsyncStorage.getItem('@autofix_csrf_token');
        if (storedToken) {
          setCsrfToken(storedToken);
        }
      }
    } catch {
      const storedToken = await AsyncStorage.getItem('@autofix_csrf_token');
      if (storedToken) {
        setCsrfToken(storedToken);
      }
    } finally {
      setIsFetchingCsrf(false);
    }
  }, []);

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!csrfToken) {
        await fetchCsrfToken();
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }
      
      let url = API_ENDPOINTS.users;
      
      if (selectedRoleFilter !== 'all') {
        url += `?role=${selectedRoleFilter}`;
      }
      if (searchQuery) {
        url += `${selectedRoleFilter !== 'all' ? '&' : '?'}search=${encodeURIComponent(searchQuery)}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include',
      });
      
      if (response.status === 401) {
        throw new Error(CONFIG_TEXTS.errors.unauthorized);
      }
      
      if (response.status === 403) {
        const errorText = await response.text();
        
        if (errorText.includes('CSRF') || errorText.includes('csrf')) {
          await fetchCsrfToken();
          throw new Error(CONFIG_TEXTS.errors.csrfMissing);
        }
        
        throw new Error(`${CONFIG_TEXTS.errors.noPermission} (403 Forbidden)`);
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch users: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.results) {
        setUsers(data.results);
      } else if (data.users) {
        setUsers(data.users);
      } else if (Array.isArray(data)) {
        setUsers(data);
      } else if (data.data) {
        setUsers(data.data);
      } else {
        setUsers([]);
      }
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : CONFIG_TEXTS.errors.networkError;
      setError(errorMsg);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [csrfToken, fetchCsrfToken, searchQuery, selectedRoleFilter]);

  // Fetch statistics (admin only)
  const fetchStats = useCallback(async () => {
    if (!currentUser?.is_admin) return;
    
    try {
      setIsLoadingStats(true);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }
      
      const response = await fetch(API_ENDPOINTS.stats, {
        method: 'GET',
        headers,
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch {
      console.error('Error fetching stats');
    } finally {
      setIsLoadingStats(false);
    }
  }, [csrfToken, currentUser?.is_admin]);

  // Load initial data
  useEffect(() => {
    fetchCurrentUser();
    fetchCsrfToken();
  }, [fetchCurrentUser, fetchCsrfToken]);

  // Fetch users and stats when ready
  useEffect(() => {
    if (csrfToken) {
      fetchUsers();
      if (currentUser?.is_admin) {
        fetchStats();
      }
    }
  }, [csrfToken, fetchUsers, fetchStats, currentUser?.is_admin]);

  // Filter users based on search and role
  useEffect(() => {
    let filtered = users;
    
    if (selectedRoleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRoleFilter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(query) ||
        (user.first_name?.toLowerCase() || '').includes(query) ||
        (user.last_name?.toLowerCase() || '').includes(query) ||
        (user.phone || '').includes(query)
      );
    }
    
    setFilteredUsers(filtered);
  }, [users, searchQuery, selectedRoleFilter]);

  // Check if current user has permission
  const hasPermission = (action: string): boolean => {
    if (!currentUser) return false;
    
    if (currentUser.is_admin) return true;
    
    const currentUserRole = currentUser.role;
    const permissions = ROLE_PERMISSIONS[currentUserRole];
    return permissions?.includes(action) || false;
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCsrfToken();
    await Promise.all([fetchUsers(), fetchStats()]);
    setRefreshing(false);
  };

  // Handle user selection
  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  // Show confirmation dialog for role change
  const showRoleChangeConfirmation = (user: User) => {
    setSelectedUser(user);
    setNewRole('');
    setActionType('role_change');
    setActionModalVisible(true);
  };

  // Show confirmation dialog for other actions
  const showActionConfirmation = (
    type: 'delete' | 'deactivate' | 'activate' | 'verify_email' | 'verify_phone',
    user: User
  ) => {
    setSelectedUser(user);
    setActionType(type);
    setActionModalVisible(true);
  };

  // Execute role change
  const executeRoleChange = async () => {
    if (!selectedUser || !newRole) return;

    // Show admin role warning
    if (newRole === 'admin') {
      Alert.alert(
        CONFIG_TEXTS.adminRoleWarning.title,
        CONFIG_TEXTS.adminRoleWarning.message,
        [
          {
            text: CONFIG_TEXTS.adminRoleWarning.cancelText,
            style: 'cancel',
            onPress: () => setActionModalVisible(false),
          },
          {
            text: CONFIG_TEXTS.adminRoleWarning.confirmText,
            style: 'destructive',
            onPress: async () => {
              await performRoleChange();
            },
          },
        ]
      );
    } else {
      await performRoleChange();
    }
  };

  // Perform the actual role change API call
  const performRoleChange = async () => {
    if (!selectedUser || !newRole) return;

    setIsLoading(true);
    setError(null);
    
    try {
      if (!csrfToken) {
        await fetchCsrfToken();
        if (!csrfToken) {
          throw new Error(CONFIG_TEXTS.errors.csrfMissing);
        }
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }
      
      const endpoint = API_ENDPOINTS.userDetail(selectedUser.id);
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ role: newRole }),
        credentials: 'include',
      });
      
      if (response.status === 403) {
        const errorText = await response.text();
        
        if (errorText.includes('CSRF') || errorText.includes('csrf')) {
          await fetchCsrfToken();
          throw new Error(CONFIG_TEXTS.errors.csrfMissing);
        }
        
        let errorMsg = CONFIG_TEXTS.errors.noPermission;
        try {
          const errorData = JSON.parse(errorText);
          errorMsg = errorData.detail || errorData.message || errorMsg;
        } catch {
          errorMsg = errorText || errorMsg;
        }
        
        throw new Error(`${errorMsg} (403 Forbidden)`);
      }
      
      if (!response.ok) {
        let errorMsg = `Role change failed: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.detail || errorData.message || errorMsg;
        } catch {
          const errorText = await response.text();
          errorMsg = errorText || errorMsg;
        }
        throw new Error(errorMsg);
      }
      
      const message = newRole === 'admin' 
        ? CONFIG_TEXTS.successMessages.adminRole 
        : CONFIG_TEXTS.successMessages.roleChange;
      
      await fetchUsers();
      
      setSuccessMessage(message);
      setSuccessModalVisible(true);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : CONFIG_TEXTS.errors.somethingWentWrong;
      Alert.alert(
        'Error', 
        errorMsg,
        [
          { text: 'OK', style: 'default' },
          { text: 'Refresh CSRF Token', onPress: fetchCsrfToken },
        ]
      );
    } finally {
      setIsLoading(false);
      setActionModalVisible(false);
      setSelectedUser(null);
      setNewRole('');
    }
  };

  // Execute other actions
  const executeAction = async () => {
    if (!selectedUser || !actionType) return;

    if (actionType === 'role_change') {
      await executeRoleChange();
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      if (!csrfToken) {
        await fetchCsrfToken();
        if (!csrfToken) {
          throw new Error(CONFIG_TEXTS.errors.csrfMissing);
        }
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }
      
      let endpoint = '';
      let method = 'POST';
      
      switch (actionType) {
        case 'delete':
          endpoint = API_ENDPOINTS.delete(selectedUser.id);
          method = 'DELETE';
          break;
        case 'deactivate':
          endpoint = API_ENDPOINTS.deactivate(selectedUser.id);
          break;
        case 'activate':
          endpoint = API_ENDPOINTS.activate(selectedUser.id);
          break;
        case 'verify_email':
          endpoint = API_ENDPOINTS.verifyEmail(selectedUser.id);
          break;
        case 'verify_phone':
          endpoint = API_ENDPOINTS.verifyPhone(selectedUser.id);
          break;
      }
      
      const response = await fetch(endpoint, {
        method,
        headers,
        credentials: 'include',
      });
      
      if (response.status === 403) {
        const errorText = await response.text();
        
        if (errorText.includes('CSRF') || errorText.includes('csrf')) {
          await fetchCsrfToken();
          throw new Error(CONFIG_TEXTS.errors.csrfMissing);
        }
        
        let errorMsg = CONFIG_TEXTS.errors.noPermission;
        try {
          const errorData = JSON.parse(errorText);
          errorMsg = errorData.detail || errorData.message || errorMsg;
        } catch {
          errorMsg = errorText || errorMsg;
        }
        
        throw new Error(`${errorMsg} (403 Forbidden)`);
      }
      
      if (!response.ok) {
        let errorMsg = `Action failed: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.detail || errorData.message || errorMsg;
        } catch {
          const errorText = await response.text();
          errorMsg = errorText || errorMsg;
        }
        throw new Error(errorMsg);
      }
      
      let message = '';
      switch (actionType) {
        case 'delete':
          message = CONFIG_TEXTS.successMessages.delete;
          break;
        case 'deactivate':
          message = CONFIG_TEXTS.successMessages.deactivate;
          break;
        case 'activate':
          message = CONFIG_TEXTS.successMessages.activate;
          break;
        case 'verify_email':
          message = CONFIG_TEXTS.successMessages.emailVerify;
          break;
        case 'verify_phone':
          message = CONFIG_TEXTS.successMessages.phoneVerify;
          break;
      }
      
      await fetchUsers();
      
      setSuccessMessage(message);
      setSuccessModalVisible(true);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : CONFIG_TEXTS.errors.somethingWentWrong;
      Alert.alert(
        'Error', 
        errorMsg,
        [
          { text: 'OK', style: 'default' },
          { text: 'Refresh CSRF Token', onPress: fetchCsrfToken },
        ]
      );
    } finally {
      setIsLoading(false);
      setActionModalVisible(false);
      setSelectedUser(null);
    }
  };

  // Get role color
  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'garage_owner': return 'bg-green-500';
      case 'mechanic': return 'bg-orange-500';
      case 'customer': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  // Get role icon
  const getRoleIcon = (role: string): keyof typeof Ionicons.glyphMap => {
    switch (role) {
      case 'admin': return 'shield-checkmark-outline';
      case 'garage_owner': return 'business-outline';
      case 'mechanic': return 'construct-outline';
      case 'customer': return 'person-outline';
      default: return 'person-outline';
    }
  };

  // Get user initials
  const getUserInitials = (user: User): string => {
    const firstInitial = user.first_name?.[0] || '';
    const lastInitial = user.last_name?.[0] || '';
    return `${firstInitial}${lastInitial}`.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U';
  };

  // Get display name
  const getDisplayName = (user: User): string => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.email?.split('@')[0] || 'User';
  };

  // Get role display text
  const getRoleDisplayText = (role: string): string => {
    if (!role) return 'Unknown';
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Unknown date';
    }
  };

  // Render user item with all action buttons
  const renderUserItem = ({ item }: { item: User }) => {
    const initials = getUserInitials(item);
    const displayName = getDisplayName(item);
    const roleIcon = getRoleIcon(item.role);
    const roleText = item.role_display || getRoleDisplayText(item.role);

    return (
      <TouchableOpacity
        className="bg-white rounded-xl p-4 mb-3 flex-row justify-between items-center shadow-sm border border-gray-100"
        onPress={() => handleSelectUser(item)}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center flex-1">
          <View className={`w-12 h-12 rounded-full ${getRoleColor(item.role)} justify-center items-center`}>
            <Text className="text-white font-bold text-base">{initials}</Text>
          </View>
          
          <View className="ml-3 flex-1">
            <Text className="text-base font-semibold text-gray-800">{displayName}</Text>
            <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={1}>{item.email}</Text>
            <View className="flex-row items-center space-x-2 mt-1">
              <View className={`flex-row items-center self-start px-2 py-1 rounded-full ${getRoleColor(item.role)}`}>
                <Ionicons name={roleIcon} size={12} color="#fff" />
                <Text className="text-white text-xs font-semibold ml-1">{roleText}</Text>
              </View>
              
              <View className={`px-2 py-1 rounded-full ${item.is_active ? 'bg-green-500' : 'bg-red-500'}`}>
                <Text className="text-white text-xs font-semibold">
                  {item.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="flex-row">
          {/* Delete Button */}
          {hasPermission('delete') && (
            <TouchableOpacity
              className="w-8 h-8 rounded-full bg-red-500 justify-center items-center ml-1"
              onPress={() => showActionConfirmation('delete', item)}
            >
              <Ionicons name="trash-outline" size={16} color="#fff" />
            </TouchableOpacity>
          )}
          
          {/* Deactivate Button */}
          {hasPermission('deactivate') && item.is_active && item.role !== 'admin' && (
            <TouchableOpacity
              className="w-8 h-8 rounded-full bg-orange-500 justify-center items-center ml-1"
              onPress={() => showActionConfirmation('deactivate', item)}
            >
              <Ionicons name="power-outline" size={16} color="#fff" />
            </TouchableOpacity>
          )}
          
          {/* Activate Button */}
          {hasPermission('activate') && !item.is_active && (
            <TouchableOpacity
              className="w-8 h-8 rounded-full bg-green-500 justify-center items-center ml-1"
              onPress={() => showActionConfirmation('activate', item)}
            >
              <Ionicons name="power-outline" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render statistics
  const renderStats = () => {
    if (!currentUser?.is_admin) return null;

    return (
      <View className="px-5 py-4 bg-white border-b border-gray-200">
        <Text className="text-lg font-bold text-gray-900 mb-3">Statistics</Text>
        {isLoadingStats ? (
          <ActivityIndicator size="small" color="#3b82f6" />
        ) : stats ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-3">
              <StatCard label="Total Users" value={stats.total_users.toString()} color="bg-blue-500" />
              <StatCard label="Active Users" value={stats.active_users.toString()} color="bg-green-500" />
              <StatCard label="Verified" value={stats.verified_users.toString()} color="bg-purple-500" />
              {stats.role_distribution?.admin !== undefined && (
                <StatCard label="Admins" value={stats.role_distribution.admin.toString()} color="bg-red-500" />
              )}
              {stats.role_distribution?.garage_owner !== undefined && (
                <StatCard label="Garage Owners" value={stats.role_distribution.garage_owner.toString()} color="bg-green-600" />
              )}
              {stats.role_distribution?.mechanic !== undefined && (
                <StatCard label="Mechanics" value={stats.role_distribution.mechanic.toString()} color="bg-orange-500" />
              )}
            </View>
          </ScrollView>
        ) : (
          <Text className="text-gray-500">No statistics available</Text>
        )}
      </View>
    );
  };

  // Render role filter chips
  const renderRoleFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      className="px-5 py-3 bg-white"
    >
      <TouchableOpacity
        className={`px-4 py-2 rounded-full border mr-3 ${selectedRoleFilter === 'all' ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`}
        onPress={() => setSelectedRoleFilter('all')}
      >
        <Text className={`font-medium ${selectedRoleFilter === 'all' ? 'text-white' : 'text-gray-600'}`}>
          All Users
        </Text>
      </TouchableOpacity>
      
      {ROLE_OPTIONS.map(role => (
        <TouchableOpacity
          key={role.value}
          className={`px-4 py-2 rounded-full border mr-3 ${selectedRoleFilter === role.value ? `${getRoleColor(role.value)} border-transparent` : 'bg-white border-gray-300'}`}
          onPress={() => setSelectedRoleFilter(role.value)}
        >
          <Text className={`font-medium ${selectedRoleFilter === role.value ? 'text-white' : 'text-gray-600'}`}>
            {role.label}s
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Render loading state
  if (isLoading && users.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Loading users...</Text>
        {isFetchingCsrf && (
          <Text className="mt-2 text-sm text-gray-500">Fetching CSRF token...</Text>
        )}
      </SafeAreaView>
    );
  }

  // Render error state
  if (error && users.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center px-5">
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text className="text-xl font-bold text-gray-900 mt-4 text-center">Error Loading Users</Text>
        <Text className="text-gray-600 mt-2 text-center mb-4">{error}</Text>
        
        <View className="space-y-3 w-full max-w-xs">
          <TouchableOpacity
            className="bg-blue-500 px-6 py-3 rounded-xl"
            onPress={fetchUsers}
          >
            <Text className="text-white font-semibold text-center">Try Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="bg-yellow-500 px-6 py-3 rounded-xl"
            onPress={fetchCsrfToken}
          >
            <Text className="text-white font-semibold text-center">Refresh CSRF Token</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="bg-white px-5 pt-4 pb-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900">User Management</Text>
            <Text className="text-sm text-gray-500 mt-1">Manage users and permissions</Text>
            <Text className="text-xs text-gray-400 mt-1">
              {csrfToken ? 'Authenticated' : isFetchingCsrf ? 'Authenticating...' : 'Not authenticated'}
            </Text>
          </View>
          {currentUser && (
            <View className={`flex-row items-center px-3 py-1.5 rounded-full ${getRoleColor(currentUser.role)}`}>
              <Ionicons name={getRoleIcon(currentUser.role)} size={14} color="#fff" />
              <Text className="text-white text-xs font-semibold ml-1.5">
                {currentUser.role_display || getRoleDisplayText(currentUser.role)}
              </Text>
            </View>
          )}
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mt-4">
          <Ionicons name="search-outline" size={20} color="#6b7280" />
          <TextInput
            className="flex-1 ml-3 text-gray-800"
            placeholder="Search users by name, email, or phone..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
            returnKeyType="search"
            onSubmitEditing={fetchUsers}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              fetchUsers();
            }}>
              <Ionicons name="close-circle-outline" size={20} color="#6b7280" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Statistics (Admin only) */}
      {renderStats()}

      {/* Role Filters */}
      {renderRoleFilter()}

      {/* User Count */}
      <View className="px-5 py-3 bg-white border-b border-gray-200 flex-row justify-between items-center">
        <Text className="text-sm text-gray-500">
          Showing <Text className="font-semibold text-gray-700">{filteredUsers.length}</Text> of{' '}
          <Text className="font-semibold text-gray-700">{users.length}</Text> users
        </Text>
        <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
          <Ionicons name="refresh-outline" size={20} color={refreshing ? "#9ca3af" : "#3b82f6"} />
        </TouchableOpacity>
      </View>

      {/* User List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-16">
            <Ionicons name="people-outline" size={64} color="#d1d5db" />
            <Text className="text-lg text-gray-500 mt-4 font-medium">No users found</Text>
            <Text className="text-sm text-gray-400 mt-2">
              {searchQuery ? 'Try a different search term' : 'No users match the selected filters'}
            </Text>
            <TouchableOpacity
              className="mt-4 bg-blue-500 px-6 py-3 rounded-xl"
              onPress={fetchUsers}
            >
              <Text className="text-white font-semibold">Refresh</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerClassName="px-5 pb-5 pt-3"
        showsVerticalScrollIndicator={false}
      />

      {/* User Detail Modal */}
      {selectedUser && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl max-h-[90%]">
              <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
                <Text className="text-xl font-bold text-gray-900">User Details</Text>
                <TouchableOpacity 
                  className="p-2"
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close-outline" size={24} color="#374151" />
                </TouchableOpacity>
              </View>

              <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
                <View className="items-center mb-6">
                  <View className={`w-20 h-20 rounded-full ${getRoleColor(selectedUser.role)} justify-center items-center`}>
                    <Text className="text-white font-bold text-2xl">
                      {getUserInitials(selectedUser)}
                    </Text>
                  </View>
                  <Text className="text-2xl font-bold text-gray-900 mt-4">
                    {getDisplayName(selectedUser)}
                  </Text>
                  <Text className="text-base text-gray-600 mt-1">{selectedUser.email}</Text>
                  <Text className="text-sm text-gray-500 mt-2">Joined {formatDate(selectedUser.date_joined)}</Text>
                  <Text className="text-xs text-gray-400 mt-1">ID: {selectedUser.id.substring(0, 8)}...</Text>
                </View>

                <View className="flex-row flex-wrap mb-6">
                  <DetailItem label="Phone" value={selectedUser.phone || 'N/A'} />
                  <DetailItem label="Location" value={`${selectedUser.city || 'N/A'}, ${selectedUser.state || 'N/A'}`} />
                  <DetailItem label="Role" value={selectedUser.role_display || getRoleDisplayText(selectedUser.role)} />
                  <DetailItem label="Status" value={selectedUser.is_active ? 'Active' : 'Inactive'} />
                  <DetailItem label="Email Verified" value={selectedUser.is_email_verified ? 'Yes' : 'No'} />
                  <DetailItem label="Phone Verified" value={selectedUser.is_phone_verified ? 'Yes' : 'No'} />
                  <DetailItem label="Registration Stage" value={`Stage ${selectedUser.registration_stage}`} />
                </View>

                <Text className="text-lg font-semibold text-gray-900 mb-2">Role Description:</Text>
                <Text className="text-gray-600 mb-8">
                  {CONFIG_TEXTS.roleDescriptions[selectedUser.role as keyof typeof CONFIG_TEXTS.roleDescriptions] || 'No description available.'}
                </Text>

                {/* Action Buttons */}
                <View className="flex-row flex-wrap -mx-2 mb-6">
                  {/* Delete Button */}
                  {hasPermission('delete') && (
                    <TouchableOpacity
                      className="flex-row items-center justify-center py-3 px-4 rounded-xl bg-red-500 flex-1 mx-2 mb-3"
                      onPress={() => {
                        setModalVisible(false);
                        showActionConfirmation('delete', selectedUser);
                      }}
                    >
                      <Ionicons name="trash-outline" size={20} color="#fff" />
                      <Text className="text-white font-semibold ml-2">Delete User</Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* Change Role Button */}
                  {hasPermission('change_role') && (
                    <TouchableOpacity
                      className="flex-row items-center justify-center py-3 px-4 rounded-xl bg-purple-500 flex-1 mx-2 mb-3"
                      onPress={() => {
                        setModalVisible(false);
                        showRoleChangeConfirmation(selectedUser);
                      }}
                    >
                      <Ionicons name="swap-horizontal-outline" size={20} color="#fff" />
                      <Text className="text-white font-semibold ml-2">Change Role</Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* Deactivate Button */}
                  {hasPermission('deactivate') && selectedUser.is_active && selectedUser.role !== 'admin' && (
                    <TouchableOpacity
                      className="flex-row items-center justify-center py-3 px-4 rounded-xl bg-orange-500 flex-1 mx-2 mb-3"
                      onPress={() => {
                        setModalVisible(false);
                        showActionConfirmation('deactivate', selectedUser);
                      }}
                    >
                      <Ionicons name="power-outline" size={20} color="#fff" />
                      <Text className="text-white font-semibold ml-2">Deactivate</Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* Activate Button */}
                  {hasPermission('activate') && !selectedUser.is_active && (
                    <TouchableOpacity
                      className="flex-row items-center justify-center py-3 px-4 rounded-xl bg-green-500 flex-1 mx-2 mb-3"
                      onPress={() => {
                        setModalVisible(false);
                        showActionConfirmation('activate', selectedUser);
                      }}
                    >
                      <Ionicons name="power-outline" size={20} color="#fff" />
                      <Text className="text-white font-semibold ml-2">Activate</Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* Verify Email Button */}
                  {hasPermission('verify_email') && !selectedUser.is_email_verified && (
                    <TouchableOpacity
                      className="flex-row items-center justify-center py-3 px-4 rounded-xl bg-blue-500 flex-1 mx-2 mb-3"
                      onPress={() => {
                        setModalVisible(false);
                        showActionConfirmation('verify_email', selectedUser);
                      }}
                    >
                      <Ionicons name="mail-outline" size={20} color="#fff" />
                      <Text className="text-white font-semibold ml-2">Verify Email</Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* Verify Phone Button */}
                  {hasPermission('verify_phone') && !selectedUser.is_phone_verified && (
                    <TouchableOpacity
                      className="flex-row items-center justify-center py-3 px-4 rounded-xl bg-teal-500 flex-1 mx-2 mb-3"
                      onPress={() => {
                        setModalVisible(false);
                        showActionConfirmation('verify_phone', selectedUser);
                      }}
                    >
                      <Ionicons name="call-outline" size={20} color="#fff" />
                      <Text className="text-white font-semibold ml-2">Verify Phone</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={actionModalVisible}
        onRequestClose={() => setActionModalVisible(false)}
      >
        <View className="flex-1 bg-black/70 justify-center items-center p-5">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md">
            {isLoading ? (
              <View className="py-8">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="text-center text-gray-600 mt-4">Processing...</Text>
              </View>
            ) : (
              <>
                <View className="items-center mb-6">
                  <Ionicons 
                    name={
                      actionType === 'delete' ? 'trash-outline' :
                      actionType === 'deactivate' ? 'warning-outline' : 
                      actionType === 'activate' ? 'checkmark-circle-outline' :
                      actionType === 'verify_email' || actionType === 'verify_phone' ? 'checkmark-circle-outline' :
                      'alert-circle-outline'
                    } 
                    size={48} 
                    color={
                      actionType === 'delete' ? '#ef4444' :
                      actionType === 'deactivate' ? '#f59e0b' : 
                      actionType === 'activate' ? '#10b981' :
                      actionType === 'verify_email' || actionType === 'verify_phone' ? '#10b981' :
                      '#f59e0b'
                    } 
                  />
                  
                  <Text className="text-xl font-bold text-gray-900 mt-4 mb-2 text-center">
                    {actionType === 'delete' && CONFIG_TEXTS.deleteConfirm.title}
                    {actionType === 'deactivate' && CONFIG_TEXTS.deactivateConfirm.title}
                    {actionType === 'activate' && CONFIG_TEXTS.activateConfirm.title}
                    {actionType === 'role_change' && CONFIG_TEXTS.roleChangeConfirm.title}
                    {actionType === 'verify_email' && CONFIG_TEXTS.emailVerifyConfirm.title}
                    {actionType === 'verify_phone' && CONFIG_TEXTS.phoneVerifyConfirm.title}
                  </Text>
                  
                  <Text className="text-gray-600 text-center">
                    {actionType === 'delete' && CONFIG_TEXTS.deleteConfirm.message}
                    {actionType === 'deactivate' && CONFIG_TEXTS.deactivateConfirm.message}
                    {actionType === 'activate' && CONFIG_TEXTS.activateConfirm.message}
                    {actionType === 'role_change' && selectedUser && 
                      CONFIG_TEXTS.roleChangeConfirm.message(
                        selectedUser.role_display || getRoleDisplayText(selectedUser.role), 
                        getRoleDisplayText(newRole)
                      )}
                    {actionType === 'verify_email' && CONFIG_TEXTS.emailVerifyConfirm.message}
                    {actionType === 'verify_phone' && CONFIG_TEXTS.phoneVerifyConfirm.message}
                  </Text>
                </View>

                {actionType === 'role_change' && (
                  <View className="mb-6">
                    <Text className="text-base font-semibold text-gray-900 mb-3">Select New Role:</Text>
                    <View className="flex-row justify-between flex-wrap -mx-1">
                      {ROLE_OPTIONS.map(role => (
                        <TouchableOpacity
                          key={role.value}
                          className={`flex-1 mx-1 py-3 rounded-lg items-center mb-2 ${newRole === role.value ? getRoleColor(role.value) : 'bg-gray-100'}`}
                          onPress={() => setNewRole(role.value)}
                          disabled={selectedUser?.role === role.value}
                        >
                          <View className="flex-row items-center">
                            <Ionicons 
                              name={role.icon as keyof typeof Ionicons.glyphMap} 
                              size={16} 
                              color={newRole === role.value ? '#fff' : '#6b7280'} 
                            />
                            <Text className={`font-medium ml-2 ${newRole === role.value ? 'text-white' : 'text-gray-600'}`}>
                              {role.label}
                            </Text>
                          </View>
                          {selectedUser?.role === role.value && (
                            <Text className="text-xs text-gray-400 mt-1">(Current)</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    className="flex-1 py-3.5 rounded-xl bg-gray-100 items-center"
                    onPress={() => {
                      setActionModalVisible(false);
                      setNewRole('');
                    }}
                  >
                    <Text className="text-gray-600 font-semibold">
                      {actionType === 'delete' && CONFIG_TEXTS.deleteConfirm.cancelText}
                      {actionType === 'deactivate' && CONFIG_TEXTS.deactivateConfirm.cancelText}
                      {actionType === 'activate' && CONFIG_TEXTS.activateConfirm.cancelText}
                      {actionType === 'role_change' && CONFIG_TEXTS.roleChangeConfirm.cancelText}
                      {actionType === 'verify_email' && CONFIG_TEXTS.emailVerifyConfirm.cancelText}
                      {actionType === 'verify_phone' && CONFIG_TEXTS.phoneVerifyConfirm.cancelText}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    className={`flex-1 py-3.5 rounded-xl items-center ${
                      actionType === 'delete' ? 'bg-red-500' :
                      actionType === 'deactivate' ? 'bg-orange-500' :
                      actionType === 'activate' ? 'bg-green-500' :
                      actionType === 'role_change' ? 'bg-purple-500' :
                      'bg-blue-500'
                    } ${actionType === 'role_change' && !newRole ? 'opacity-50' : ''}`}
                    onPress={() => {
                      if (actionType === 'role_change') {
                        executeRoleChange();
                      } else {
                        executeAction();
                      }
                    }}
                    disabled={actionType === 'role_change' && !newRole}
                  >
                    <Text className="text-white font-semibold">
                      {actionType === 'delete' && CONFIG_TEXTS.deleteConfirm.confirmText}
                      {actionType === 'deactivate' && CONFIG_TEXTS.deactivateConfirm.confirmText}
                      {actionType === 'activate' && CONFIG_TEXTS.activateConfirm.confirmText}
                      {actionType === 'role_change' && CONFIG_TEXTS.roleChangeConfirm.confirmText}
                      {actionType === 'verify_email' && CONFIG_TEXTS.emailVerifyConfirm.confirmText}
                      {actionType === 'verify_phone' && CONFIG_TEXTS.phoneVerifyConfirm.confirmText}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={successModalVisible}
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View className="flex-1 bg-black/70 justify-center items-center p-5">
          <View className="bg-white rounded-2xl p-8 items-center w-full max-w-sm">
            <Ionicons name="checkmark-circle-outline" size={64} color="#10b981" />
            <Text className="text-2xl font-bold text-gray-900 mt-4">Success!</Text>
            <Text className="text-gray-600 text-center mt-2 mb-8">{successMessage}</Text>
            <TouchableOpacity
              className="bg-blue-500 py-3.5 rounded-xl w-full items-center"
              onPress={() => {
                setSuccessModalVisible(false);
                setModalVisible(false);
              }}
            >
              <Text className="text-white font-semibold text-base">OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Helper component for detail items
const DetailItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View className="w-1/2 mb-4 px-2">
    <Text className="text-xs text-gray-500 mb-1">{label}</Text>
    <Text className="text-base text-gray-900 font-medium">{value}</Text>
  </View>
);

// Helper component for stat cards
const StatCard: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <View className="w-32 px-2 mb-2">
    <View className={`${color} rounded-xl p-3`}>
      <Text className="text-white text-2xl font-bold text-center">{value}</Text>
      <Text className="text-white text-xs font-medium text-center mt-1">{label}</Text>
    </View>
  </View>
);

export default UserManagement;