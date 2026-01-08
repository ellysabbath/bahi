import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

// ========== TYPE DEFINITIONS ==========
interface ServiceRequest {
  id: string | number;
  request_id?: string;
  full_name: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  location: string;
  email?: string;
  phone?: string;
  experience?: string;
  garage_id?: string | number;
  garage?: number;
  garage_name?: string;
  garage_details?: {
    id: string | number;
    name: string;
    address: string;
    phone?: string;
    rating?: number;
  };
  status: 'pending' | 'received' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  status_display?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  priority_display?: string;
  is_emergency?: boolean;
  requires_follow_up?: boolean;
  is_archived?: boolean;
  vehicle_type?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: string | number;
  service_type?: string;
  agreed_to_terms: boolean;
  terms_agreement_date?: string;
  estimated_cost?: number | string | null;
  actual_cost?: number | string;
  quote_approved?: boolean;
  quote_approved_date?: string;
  garage_notes?: string;
  estimated_completion_date?: string;
  actual_completion_date?: string;
  submitted_at: string;
  created_at: string;
  updated_at?: string;
  ip_address?: string;
  user_rating?: number;
  user_feedback?: string;
  user_details?: {
    id: string | number;
  };
  user?: {
    id: string | number;
  };
  updates?: {
    update_type: string;
    notes?: string;
    created_at: string;
  }[];
}

interface Garage {
  id: string | number;
  name: string;
  address: string;
  phone?: string;
  rating?: number;
}

interface Statistics {
  total_requests: number;
  pending_requests: number;
  in_progress_requests: number;
  completed_requests: number;
  requests_by_status?: {
    status: string;
    count: number;
  }[];
  recent_requests_last_7_days: number;
  average_rating: number;
}

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

interface StatusUpdateModalProps {
  visible: boolean;
  request: ServiceRequest | null;
  onClose: () => void;
  onUpdate: () => Promise<void>;
}

interface PriorityUpdateModalProps {
  visible: boolean;
  request: ServiceRequest | null;
  onClose: () => void;
  onUpdate: () => Promise<void>;
}

interface CostUpdateModalProps {
  visible: boolean;
  request: ServiceRequest | null;
  onClose: () => void;
  onUpdate: () => Promise<void>;
}

interface ServiceRequestCardProps {
  request: ServiceRequest;
  onPress: (request: ServiceRequest) => void;
  onAction: (action: string, request: ServiceRequest) => void;
  userRole: string;
  onEdit: (request: ServiceRequest) => void;
  onDelete: (request: ServiceRequest) => void;
}

interface DetailViewModalProps {
  visible: boolean;
  request: ServiceRequest | null;
  onClose: () => void;
  onUpdate: () => Promise<void>;
  userRole: string;
}

interface CreateEditModalProps {
  visible: boolean;
  request: ServiceRequest | null;
  onClose: () => void;
  onSuccess: (result: any) => void;
}

interface FormData {
  first_name: string;
  middle_name: string;
  last_name: string;
  location: string;
  garage_id: string;
  experience: string;
  email: string;
  phone: string;
  vehicle_type: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: string;
  agreed_to_terms: boolean;
}

// ========== API CONFIGURATION ==========
const API_BASE_URL = 'https://autofix.pythonanywhere.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add request interceptor to include auth token if available
api.interceptors.request.use(
  (config) => {
    // You can add authentication token here if needed
    // const token = await AsyncStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error: any) => {
    console.error('API Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      // Handle unauthorized access
      Alert.alert('Session Expired', 'Please login again');
      // You can redirect to login here
    }
    return Promise.reject(error);
  }
);

// ========== API FUNCTIONS ==========
const apiFunctions = {
  getServiceRequests: async (params: any = {}): Promise<ServiceRequest[]> => {
    try {
      const response = await api.get('/service-requests/', { params });
      console.log('API Response:', response.data); // Debug log
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        return response.data.results;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      console.warn('Unexpected API response format:', response.data);
      return [];
    } catch (error: any) {
      console.error('Error fetching service requests:', error);
      throw error.response?.data || error;
    }
  },

  getServiceRequestById: async (id: string | number): Promise<ServiceRequest> => {
    try {
      const response = await api.get(`/service-requests/${id}/`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching service request ${id}:`, error);
      throw error.response?.data || error;
    }
  },

  createServiceRequest: async (data: any): Promise<ServiceRequest> => {
    try {
      const response = await api.post('/service-requests/', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating service request:', error);
      throw error.response?.data || error;
    }
  },

  updateServiceRequest: async (id: string | number, data: any): Promise<ServiceRequest> => {
    try {
      const response = await api.put(`/service-requests/${id}/`, data);
      return response.data;
    } catch (error: any) {
      console.error(`Error updating service request ${id}:`, error);
      throw error.response?.data || error;
    }
  },

  deleteServiceRequest: async (id: string | number): Promise<void> => {
    try {
      await api.delete(`/service-requests/${id}/`);
    } catch (error: any) {
      console.error(`Error deleting service request ${id}:`, error);
      throw error.response?.data || error;
    }
  },

  updateStatus: async (id: string | number, status: string, notes = ''): Promise<any> => {
    try {
      const response = await api.post(`/service-requests/${id}/update_status/`, {
        status,
        notes
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error updating status for request ${id}:`, error);
      throw error.response?.data || error;
    }
  },

  updatePriority: async (id: string | number, priority: string): Promise<ServiceRequest> => {
    try {
      const response = await api.put(`/service-requests/${id}/`, { priority });
      return response.data;
    } catch (error: any) {
      console.error(`Error updating priority for request ${id}:`, error);
      throw error.response?.data || error;
    }
  },

  updateCost: async (id: string | number, estimated_cost?: number, actual_cost?: number): Promise<ServiceRequest> => {
    try {
      const data: any = {};
      if (estimated_cost !== undefined) data.estimated_cost = estimated_cost;
      if (actual_cost !== undefined) data.actual_cost = actual_cost;
      const response = await api.put(`/service-requests/${id}/`, data);
      return response.data;
    } catch (error: any) {
      console.error(`Error updating cost for request ${id}:`, error);
      throw error.response?.data || error;
    }
  },

  updateGarageNotes: async (id: string | number, garage_notes: string): Promise<ServiceRequest> => {
    try {
      const response = await api.put(`/service-requests/${id}/`, { garage_notes });
      return response.data;
    } catch (error: any) {
      console.error(`Error updating garage notes for request ${id}:`, error);
      throw error.response?.data || error;
    }
  },

  updateFlags: async (id: string | number, flags: any): Promise<ServiceRequest> => {
    try {
      const response = await api.put(`/service-requests/${id}/`, flags);
      return response.data;
    } catch (error: any) {
      console.error(`Error updating flags for request ${id}:`, error);
      throw error.response?.data || error;
    }
  },

  submitFeedback: async (id: string | number, rating: number, feedback: string): Promise<any> => {
    try {
      const response = await api.post(`/service-requests/${id}/submit_feedback/`, {
        rating,
        feedback
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error submitting feedback for request ${id}:`, error);
      throw error.response?.data || error;
    }
  },

  getGarages: async (): Promise<Garage[]> => {
    try {
      const response = await api.get('/garage-select/');
      
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        return response.data.results;
      }
      
      console.warn('Unexpected garages API response format:', response.data);
      return [];
    } catch (error: any) {
      console.error('Error fetching garages:', error);
      throw error.response?.data || error;
    }
  },

  getStatistics: async (): Promise<Statistics> => {
    try {
      const response = await api.get('/service-requests/statistics/');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
      // Return default statistics if API fails
      return {
        total_requests: 0,
        pending_requests: 0,
        in_progress_requests: 0,
        completed_requests: 0,
        recent_requests_last_7_days: 0,
        average_rating: 0
      };
    }
  },

  searchRequests: async (query: string): Promise<ServiceRequest[]> => {
    try {
      const response = await api.get('/service-requests/search_by_name/', {
        params: { q: query }
      });
      
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        return response.data.results;
      }
      
      return [];
    } catch (error: any) {
      console.error('Error searching requests:', error);
      throw error.response?.data || error;
    }
  },
};

// ========== LOADING SPINNER ==========
interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...' }) => (
  <View className="flex-1 justify-center items-center">
    <ActivityIndicator size="large" color="#3b82f6" />
    <Text className="mt-4 text-gray-600 text-base">{message}</Text>
  </View>
);

// ========== CONFIRMATION MODAL ==========
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  visible, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = 'warning',
  onConfirm, 
  onCancel 
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white rounded-xl w-4/5 max-w-md p-6 shadow-lg">
          <View className={`w-14 h-14 rounded-full ${
            type === 'danger' ? 'bg-red-100' : 
            type === 'success' ? 'bg-green-100' : 'bg-yellow-100'
          } justify-center items-center self-center mb-4`}>
            <MaterialIcons 
              name={type === 'danger' ? 'warning' : type === 'success' ? 'check-circle' : 'info'} 
              size={32} 
              color={type === 'danger' ? '#dc2626' : type === 'success' ? '#16a34a' : '#f59e0b'} 
            />
          </View>
          
          <Text className="text-2xl font-bold text-gray-800 text-center mb-2">{title}</Text>
          <Text className="text-base text-gray-600 text-center mb-8">{message}</Text>
          
          <View className="flex-row justify-between space-x-4">
            <TouchableOpacity
              className="flex-1 border border-gray-300 px-6 py-3 rounded-lg items-center active:bg-gray-50"
              onPress={onCancel}
            >
              <Text className="text-gray-700 font-medium text-base">{cancelText}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className={`flex-1 px-6 py-3 rounded-lg items-center ${
                type === 'danger' ? 'bg-red-600 active:bg-red-700' : 
                type === 'success' ? 'bg-green-600 active:bg-green-700' : 'bg-blue-600 active:bg-blue-700'
              }`}
              onPress={onConfirm}
            >
              <Text className="text-white font-semibold text-base">{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ========== STATUS UPDATE MODAL ==========
const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({ visible, request, onClose, onUpdate }) => {
  const [status, setStatus] = useState<string>(request?.status || 'pending');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (visible && request) {
      setStatus(request.status);
      setNotes('');
    }
  }, [visible, request]);

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
    { value: 'received', label: 'Received', color: 'bg-blue-500' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-purple-500' },
    { value: 'completed', label: 'Completed', color: 'bg-green-500' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-500' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-500' },
  ];

  const handleSubmit = async () => {
    if (!request) return;
    
    setLoading(true);
    try {
      await apiFunctions.updateStatus(request.id, status, notes);
      await onUpdate();
      Alert.alert('Success', 'Status updated successfully');
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update status');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!visible || !request) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white rounded-xl w-4/5 max-w-md p-6 shadow-lg">
          <Text className="text-2xl font-bold text-gray-800 text-center mb-4">
            Update Status
          </Text>
          
          <Text className="text-gray-600 text-center mb-6">
            Request: {request.full_name}
          </Text>

          <Text className="text-gray-700 font-medium mb-3">Select New Status:</Text>
          <View className="flex-row flex-wrap justify-center gap-2 mb-6">
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                className={`px-4 py-2 rounded-full ${option.color} ${
                  status === option.value ? 'opacity-100' : 'opacity-70'
                }`}
                onPress={() => setStatus(option.value)}
              >
                <Text className="text-white font-medium">{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-gray-700 font-medium mb-2">Notes (Optional):</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-6 min-h-[80px]"
            placeholder="Add any notes about this status change..."
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />

          <View className="bg-gray-50 rounded-lg p-3 mb-6">
            <Text className="text-gray-600 text-sm">Current Status:</Text>
            <Text className="text-gray-800 font-medium">
              {request.status_display || statusOptions.find(opt => opt.value === request.status)?.label || request.status}
            </Text>
          </View>

          <View className="flex-row justify-between space-x-4">
            <TouchableOpacity
              className="flex-1 border border-gray-300 px-6 py-3 rounded-lg items-center"
              onPress={onClose}
              disabled={loading}
            >
              <Text className="text-gray-700 font-medium">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className={`flex-1 px-6 py-3 rounded-lg items-center ${
                loading ? 'bg-blue-400' : 'bg-blue-600'
              }`}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold">Update Status</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ========== PRIORITY UPDATE MODAL ==========
const PriorityUpdateModal: React.FC<PriorityUpdateModalProps> = ({ visible, request, onClose, onUpdate }) => {
  const [priority, setPriority] = useState<string>(request?.priority || 'medium');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (visible && request) {
      setPriority(request.priority);
    }
  }, [visible, request]);

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-500' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
    { value: 'high', label: 'High', color: 'bg-orange-500' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-500' },
  ];

  const handleSubmit = async () => {
    if (!request) return;
    
    setLoading(true);
    try {
      await apiFunctions.updatePriority(request.id, priority);
      await onUpdate();
      Alert.alert('Success', 'Priority updated successfully');
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update priority');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!visible || !request) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white rounded-xl w-4/5 max-w-md p-6 shadow-lg">
          <Text className="text-2xl font-bold text-gray-800 text-center mb-4">
            Update Priority
          </Text>
          
          <Text className="text-gray-600 text-center mb-6">
            Request: {request.full_name}
          </Text>

          <Text className="text-gray-700 font-medium mb-3">Select Priority Level:</Text>
          <View className="space-y-2 mb-6">
            {priorityOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                className={`flex-row items-center p-3 rounded-lg ${
                  priority === option.value ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50'
                }`}
                onPress={() => setPriority(option.value)}
              >
                <View className={`w-4 h-4 rounded-full ${option.color} mr-3`} />
                <Text className="text-gray-800 font-medium">{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="bg-gray-50 rounded-lg p-3 mb-6">
            <Text className="text-gray-600 text-sm">Current Priority:</Text>
            <Text className="text-gray-800 font-medium capitalize">
              {request.priority_display || priorityOptions.find(opt => opt.value === request.priority)?.label || request.priority}
            </Text>
          </View>

          <View className="flex-row justify-between space-x-4">
            <TouchableOpacity
              className="flex-1 border border-gray-300 px-6 py-3 rounded-lg items-center"
              onPress={onClose}
              disabled={loading}
            >
              <Text className="text-gray-700 font-medium">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className={`flex-1 px-6 py-3 rounded-lg items-center ${
                loading ? 'bg-blue-400' : 'bg-blue-600'
              }`}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold">Update Priority</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ========== COST UPDATE MODAL ==========
const CostUpdateModal: React.FC<CostUpdateModalProps> = ({ visible, request, onClose, onUpdate }) => {
  const [estimatedCost, setEstimatedCost] = useState<string>(
    request?.estimated_cost ? request.estimated_cost.toString() : ''
  );
  const [actualCost, setActualCost] = useState<string>(
    request?.actual_cost ? request.actual_cost.toString() : ''
  );
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (visible && request) {
      setEstimatedCost(request.estimated_cost ? request.estimated_cost.toString() : '');
      setActualCost(request.actual_cost ? request.actual_cost.toString() : '');
    }
  }, [visible, request]);

  const handleSubmit = async () => {
    if (!request) return;
    
    setLoading(true);
    try {
      await apiFunctions.updateCost(
        request.id,
        estimatedCost ? parseFloat(estimatedCost) : undefined,
        actualCost ? parseFloat(actualCost) : undefined
      );
      await onUpdate();
      Alert.alert('Success', 'Cost information updated successfully');
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update cost information');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!visible || !request) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white rounded-xl w-4/5 max-w-md p-6 shadow-lg">
          <Text className="text-2xl font-bold text-gray-800 text-center mb-4">
            Update Cost Information
          </Text>
          
          <Text className="text-gray-600 text-center mb-6">
            Request: {request.full_name}
          </Text>

          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Estimated Cost (Tsh):</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3"
              placeholder="Enter estimated cost"
              value={estimatedCost}
              onChangeText={setEstimatedCost}
              keyboardType="decimal-pad"
            />
          </View>

          <View className="mb-6">
            <Text className="text-gray-700 font-medium mb-2">Actual Cost (Tsh):</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3"
              placeholder="Enter actual cost"
              value={actualCost}
              onChangeText={setActualCost}
              keyboardType="decimal-pad"
            />
          </View>

          <View className="flex-row justify-between space-x-4">
            <TouchableOpacity
              className="flex-1 border border-gray-300 px-6 py-3 rounded-lg items-center"
              onPress={onClose}
              disabled={loading}
            >
              <Text className="text-gray-700 font-medium">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className={`flex-1 px-6 py-3 rounded-lg items-center ${
                loading ? 'bg-blue-400' : 'bg-blue-600'
              }`}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold">Update Costs</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ========== SERVICE REQUEST CARD ==========
const ServiceRequestCard: React.FC<ServiceRequestCardProps> = ({ 
  request, 
  onPress, 
  onAction, 
  userRole, 
  onEdit, 
  onDelete 
}) => {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'received': return 'bg-blue-500';
      case 'in_progress': return 'bg-purple-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-gray-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'urgent': return 'text-red-700 font-bold';
      case 'medium': return 'text-orange-500';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const canUpdateStatus = userRole === 'garage_owner' || userRole === 'admin';

  // Extract garage name from different possible fields
  const garageName = request.garage_name || request.garage_details?.name || `Garage ${request.garage || 'Unknown'}`;

  return (
    <TouchableOpacity 
      className="bg-white mx-4 my-2 p-4 rounded-xl shadow-sm border border-gray-100"
      onPress={() => onPress(request)}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 mr-2">
          <Text className="text-lg font-bold text-gray-800" numberOfLines={1}>
            {request.full_name}
          </Text>
          <Text className="text-sm text-gray-600 mt-1" numberOfLines={1}>
            {garageName}
          </Text>
        </View>
        
        <View className="flex-row items-center space-x-2">
          <View className={`px-2 py-1 rounded-full ${getStatusColor(request.status)}`}>
            <Text className="text-white text-xs font-bold uppercase">
              {request.status_display || request.status.replace('_', ' ')}
            </Text>
          </View>
          {request.is_emergency && (
            <View className="px-2 py-1 rounded-full bg-red-100">
              <MaterialIcons name="emergency" size={14} color="#dc2626" />
            </View>
          )}
        </View>
      </View>
      
      <View className="mb-3">
        {request.experience && (
          <Text className="text-sm text-gray-600 mb-1" numberOfLines={2}>
            {request.experience.substring(0, 100)}...
          </Text>
        )}
        
        <View className="flex-row items-center justify-between mt-2">
          <View className="flex-row items-center">
            <MaterialIcons name="location-on" size={14} color="#6b7280" />
            <Text className="text-xs text-gray-500 ml-1">{request.location}</Text>
          </View>
          
          <Text className={`text-xs font-medium ${getPriorityColor(request.priority)}`}>
            {request.priority_display || request.priority.toUpperCase()}
          </Text>
        </View>
        
        <Text className="text-xs text-gray-400 mt-2">
          Created: {new Date(request.created_at).toLocaleDateString()}
        </Text>

        {(request.estimated_cost || request.actual_cost) && (
          <View className="flex-row items-center mt-2">
            <MaterialIcons name="attach-money" size={14} color="#6b7280" />
            <Text className="text-xs text-gray-500 ml-1">
              Est: Tsh {request.estimated_cost || 'N/A'} | 
              Actual: Tsh {request.actual_cost || 'N/A'}
            </Text>
          </View>
        )}
      </View>
      
      <View className="flex-row justify-between pt-3 border-t border-gray-100 mt-2">
        <TouchableOpacity 
          className="flex-row items-center px-3 py-1.5 bg-blue-100 rounded-lg active:bg-blue-200"
          onPress={() => onEdit(request)}
        >
          <MaterialIcons name="edit" size={14} color="#1d4ed8" />
          <Text className="text-blue-700 text-xs font-medium ml-1">Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="flex-row items-center px-3 py-1.5 bg-red-100 rounded-lg active:bg-red-200"
          onPress={() => onDelete(request)}
        >
          <MaterialIcons name="delete" size={14} color="#dc2626" />
          <Text className="text-red-700 text-xs font-medium ml-1">Delete</Text>
        </TouchableOpacity>
        
        {canUpdateStatus && (
          <TouchableOpacity 
            className="flex-row items-center px-3 py-1.5 bg-green-100 rounded-lg active:bg-green-200"
            onPress={() => onAction('update_status', request)}
          >
            <MaterialIcons name="update" size={14} color="#16a34a" />
            <Text className="text-green-700 text-xs font-medium ml-1">Status</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ========== DETAIL VIEW MODAL ==========
const DetailViewModal: React.FC<DetailViewModalProps> = ({ visible, request, onClose, onUpdate, userRole }) => {
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [showPriorityModal, setShowPriorityModal] = useState<boolean>(false);
  const [showCostModal, setShowCostModal] = useState<boolean>(false);
  const [garageNotes, setGarageNotes] = useState<string>(request?.garage_notes || '');
  const [notesLoading, setNotesLoading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [detailedRequest, setDetailedRequest] = useState<ServiceRequest | null>(null);

  const canSubmitFeedback = userRole === 'customer' && 
                          request?.status === 'completed' && 
                          !request?.user_rating;

  const canManageRequest = userRole === 'garage_owner' || userRole === 'admin';
  const isOwner = request?.user_details?.id === request?.user?.id;

  const loadDetailedRequest = useCallback(async () => {
    if (!request) return;
    
    setIsLoading(true);
    try {
      const detailedData = await apiFunctions.getServiceRequestById(request.id);
      setDetailedRequest(detailedData);
      setGarageNotes(detailedData.garage_notes || '');
    } catch (error) {
      console.error('Error loading detailed request:', error);
      // Fallback to the basic request data
      setDetailedRequest(request);
      setGarageNotes(request.garage_notes || '');
    } finally {
      setIsLoading(false);
    }
  }, [request]);

  useEffect(() => {
    if (visible && request) {
      loadDetailedRequest();
    }
  }, [visible, request, loadDetailedRequest]);

  const handleSubmitFeedback = async () => {
    if (!request) return;
    
    if (rating < 1 || rating > 5) {
      Alert.alert('Error', 'Please select a rating between 1 and 5');
      return;
    }

    setSubmitting(true);
    try {
      await apiFunctions.submitFeedback(request.id, rating, feedback);
      Alert.alert('Success', 'Thank you for your feedback!');
      setShowFeedback(false);
      await onUpdate();
      await loadDetailedRequest(); // Refresh detailed data
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to submit feedback');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateGarageNotes = async () => {
    if (!request) return;
    
    setNotesLoading(true);
    try {
      await apiFunctions.updateGarageNotes(request.id, garageNotes);
      Alert.alert('Success', 'Garage notes updated successfully');
      await onUpdate();
      await loadDetailedRequest(); // Refresh detailed data
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update notes');
      console.error(error);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleUpdateFlags = async (flags: any) => {
    if (!request) return;
    
    try {
      await apiFunctions.updateFlags(request.id, flags);
      Alert.alert('Success', 'Flags updated successfully');
      await onUpdate();
      await loadDetailedRequest(); // Refresh detailed data
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update flags');
      console.error(error);
    }
  };

  if (!visible || !request) return null;

  const displayRequest = detailedRequest || request;
  const userRatingValue = displayRequest.user_rating ?? 0;
  const garageName = displayRequest.garage_name || displayRequest.garage_details?.name || `Garage ${displayRequest.garage || 'Unknown'}`;

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center">
          <TouchableOpacity onPress={onClose} className="mr-3">
            <MaterialIcons name="arrow-back" size={24} color="#3b82f6" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800 flex-1">Service Request Details</Text>
          <Text className="text-sm font-medium text-gray-500">ID: {displayRequest.request_id?.slice(0, 8)}</Text>
        </View>

        {isLoading ? (
          <LoadingSpinner message="Loading request details..." />
        ) : (
          <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
            <View className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center">
                  <View className={`px-3 py-1 rounded-full ${
                    displayRequest.status === 'pending' ? 'bg-yellow-500' :
                    displayRequest.status === 'received' ? 'bg-blue-500' :
                    displayRequest.status === 'in_progress' ? 'bg-purple-500' :
                    displayRequest.status === 'completed' ? 'bg-green-500' :
                    displayRequest.status === 'cancelled' ? 'bg-gray-500' : 'bg-red-500'
                  }`}>
                    <Text className="text-white text-sm font-bold uppercase">
                      {displayRequest.status_display || displayRequest.status.replace('_', ' ')}
                    </Text>
                  </View>
                  {canManageRequest && (
                    <TouchableOpacity 
                      className="ml-2 p-1"
                      onPress={() => setShowStatusModal(true)}
                    >
                      <MaterialIcons name="edit" size={16} color="#3b82f6" />
                    </TouchableOpacity>
                  )}
                </View>
                
                <View className="flex-row items-center">
                  <View className={`px-3 py-1 rounded-full ${
                    displayRequest.priority === 'high' ? 'bg-red-100' :
                    displayRequest.priority === 'urgent' ? 'bg-red-200' :
                    displayRequest.priority === 'medium' ? 'bg-orange-100' : 'bg-green-100'
                  }`}>
                    <Text className={`text-sm font-bold ${
                      displayRequest.priority === 'high' ? 'text-red-700' :
                      displayRequest.priority === 'urgent' ? 'text-red-800' :
                      displayRequest.priority === 'medium' ? 'text-orange-700' : 'text-green-700'
                    }`}>
                      {displayRequest.priority_display || displayRequest.priority.toUpperCase()}
                    </Text>
                  </View>
                  {canManageRequest && (
                    <TouchableOpacity 
                      className="ml-2 p-1"
                      onPress={() => setShowPriorityModal(true)}
                    >
                      <MaterialIcons name="edit" size={16} color="#3b82f6" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {displayRequest.is_emergency && (
                <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <MaterialIcons name="warning" size={20} color="#dc2626" />
                      <Text className="text-red-700 font-bold ml-2">EMERGENCY SERVICE REQUEST</Text>
                    </View>
                    {canManageRequest && (
                      <TouchableOpacity
                        onPress={() => handleUpdateFlags({ is_emergency: false })}
                      >
                        <MaterialIcons name="close" size={20} color="#dc2626" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              {displayRequest.requires_follow_up && (
                <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <MaterialIcons name="flag" size={20} color="#f59e0b" />
                      <Text className="text-yellow-700 font-bold ml-2">REQUIRES FOLLOW UP</Text>
                    </View>
                    {canManageRequest && (
                      <TouchableOpacity
                        onPress={() => handleUpdateFlags({ requires_follow_up: false })}
                      >
                        <MaterialIcons name="close" size={20} color="#f59e0b" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              {displayRequest.is_archived && (
                <View className="bg-gray-100 border border-gray-300 rounded-lg p-3 mb-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <MaterialIcons name="archive" size={20} color="#6b7280" />
                      <Text className="text-gray-700 font-bold ml-2">ARCHIVED</Text>
                    </View>
                    {canManageRequest && (
                      <TouchableOpacity
                        onPress={() => handleUpdateFlags({ is_archived: false })}
                      >
                        <MaterialIcons name="close" size={20} color="#6b7280" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>

            {canManageRequest && (
              <View className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
                <Text className="text-lg font-bold text-gray-800 mb-3">Management Actions</Text>
                
                <View className="flex-row flex-wrap gap-2">
                  <TouchableOpacity
                    className="flex-row items-center px-4 py-2 bg-blue-100 rounded-lg"
                    onPress={() => setShowStatusModal(true)}
                  >
                    <MaterialIcons name="update" size={16} color="#1d4ed8" />
                    <Text className="text-blue-700 font-medium ml-2">Update Status</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    className="flex-row items-center px-4 py-2 bg-purple-100 rounded-lg"
                    onPress={() => setShowPriorityModal(true)}
                  >
                    <MaterialIcons name="priority-high" size={16} color="#9333ea" />
                    <Text className="text-purple-700 font-medium ml-2">Change Priority</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    className="flex-row items-center px-4 py-2 bg-green-100 rounded-lg"
                    onPress={() => setShowCostModal(true)}
                  >
                    <MaterialIcons name="attach-money" size={16} color="#16a34a" />
                    <Text className="text-green-700 font-medium ml-2">Update Costs</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
              <Text className="text-lg font-bold text-gray-800 mb-3">Customer Information</Text>
              
              <View className="space-y-2">
                <View className="flex-row">
                  <Text className="text-gray-600 w-32">Name:</Text>
                  <Text className="text-gray-800 font-medium flex-1">
                    {displayRequest.full_name}
                  </Text>
                </View>
                
                <View className="flex-row">
                  <Text className="text-gray-600 w-32">Location:</Text>
                  <Text className="text-gray-800 flex-1">{displayRequest.location}</Text>
                </View>
                
                {displayRequest.email && (
                  <View className="flex-row">
                    <Text className="text-gray-600 w-32">Email:</Text>
                    <Text className="text-gray-800 flex-1">{displayRequest.email}</Text>
                  </View>
                )}
                
                {displayRequest.phone && (
                  <View className="flex-row">
                    <Text className="text-gray-600 w-32">Phone:</Text>
                    <Text className="text-gray-800 flex-1">{displayRequest.phone}</Text>
                  </View>
                )}
                
                <View className="flex-row">
                  <Text className="text-gray-600 w-32">Terms Agreed:</Text>
                  <Text className={`font-medium ${displayRequest.agreed_to_terms ? 'text-green-600' : 'text-red-600'}`}>
                    {displayRequest.agreed_to_terms ? 'Yes' : 'No'}
                  </Text>
                </View>

                {displayRequest.terms_agreement_date && (
                  <View className="flex-row">
                    <Text className="text-gray-600 w-32">Agreed On:</Text>
                    <Text className="text-gray-800 flex-1">
                      {new Date(displayRequest.terms_agreement_date).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
              <Text className="text-lg font-bold text-gray-800 mb-3">Garage Information</Text>
              
              <View className="space-y-2">
                <Text className="text-gray-800 font-medium text-lg">{garageName}</Text>
                
                {displayRequest.garage_details?.address && (
                  <Text className="text-gray-600">{displayRequest.garage_details.address}</Text>
                )}
                
                <View className="flex-row items-center mt-2 space-x-4">
                  {displayRequest.garage_details?.rating && displayRequest.garage_details.rating > 0 && (
                    <View className="flex-row items-center">
                      <MaterialIcons name="star" size={16} color="#f59e0b" />
                      <Text className="text-gray-700 ml-1">{displayRequest.garage_details.rating}/5</Text>
                    </View>
                  )}
                  
                  {displayRequest.garage_details?.phone && (
                    <View className="flex-row items-center">
                      <MaterialIcons name="phone" size={16} color="#6b7280" />
                      <Text className="text-gray-700 ml-1">{displayRequest.garage_details.phone}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {displayRequest.experience && (
              <View className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
                <Text className="text-lg font-bold text-gray-800 mb-3">Service Details</Text>
                
                <Text className="text-gray-800 mb-4">{displayRequest.experience}</Text>
                
                {(displayRequest.vehicle_type || displayRequest.vehicle_make || displayRequest.vehicle_model) && (
                  <View className="bg-gray-50 rounded-lg p-3">
                    <Text className="text-gray-700 font-medium mb-2">Vehicle Information:</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {displayRequest.vehicle_type && (
                        <Text className="text-gray-600">Type: {displayRequest.vehicle_type}</Text>
                      )}
                      {displayRequest.vehicle_make && (
                        <Text className="text-gray-600">Make: {displayRequest.vehicle_make}</Text>
                      )}
                      {displayRequest.vehicle_model && (
                        <Text className="text-gray-600">Model: {displayRequest.vehicle_model}</Text>
                      )}
                      {displayRequest.vehicle_year && (
                        <Text className="text-gray-600">Year: {displayRequest.vehicle_year}</Text>
                      )}
                    </View>
                  </View>
                )}
              </View>
            )}

            <View className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
              <Text className="text-lg font-bold text-gray-800 mb-3">Financial Information</Text>
              
              <View className="space-y-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-600">Estimated Cost:</Text>
                  <View className="flex-row items-center">
                    <Text className="text-gray-800 font-bold">
                      Tsh {displayRequest.estimated_cost ? parseFloat(displayRequest.estimated_cost.toString()).toFixed(2) : '0.00'}
                    </Text>
                    {canManageRequest && (
                      <TouchableOpacity 
                        className="ml-2 p-1"
                        onPress={() => setShowCostModal(true)}
                      >
                        <MaterialIcons name="edit" size={16} color="#3b82f6" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-600">Actual Cost:</Text>
                  <View className="flex-row items-center">
                    <Text className="text-green-600 font-bold">
                      Tsh {displayRequest.actual_cost ? parseFloat(displayRequest.actual_cost.toString()).toFixed(2) : '0.00'}
                    </Text>
                    {canManageRequest && (
                      <TouchableOpacity 
                        className="ml-2 p-1"
                        onPress={() => setShowCostModal(true)}
                      >
                        <MaterialIcons name="edit" size={16} color="#3b82f6" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </View>

            <View className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
              <Text className="text-lg font-bold text-gray-800 mb-3">Timeline</Text>
              
              <View className="space-y-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-600">Submitted:</Text>
                  <Text className="text-gray-800">
                    {new Date(displayRequest.submitted_at).toLocaleString()}
                  </Text>
                </View>
                
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-600">Created:</Text>
                  <Text className="text-blue-600 font-medium">
                    {new Date(displayRequest.created_at).toLocaleString()}
                  </Text>
                </View>
                
                {displayRequest.estimated_completion_date && (
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-600">Estimated Completion:</Text>
                    <Text className="text-blue-600 font-medium">
                      {new Date(displayRequest.estimated_completion_date).toLocaleDateString()}
                    </Text>
                  </View>
                )}
                
                {displayRequest.actual_completion_date && (
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-600">Actual Completion:</Text>
                    <Text className="text-green-600 font-medium">
                      {new Date(displayRequest.actual_completion_date).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {canManageRequest && (
              <View className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
                <Text className="text-lg font-bold text-gray-800 mb-3">Garage Notes</Text>
                
                <TextInput
                  className="border border-gray-300 rounded-lg p-3 min-h-[100px] text-base"
                  placeholder="Add internal notes here..."
                  value={garageNotes}
                  onChangeText={setGarageNotes}
                  multiline
                  textAlignVertical="top"
                />
                
                <TouchableOpacity
                  className="mt-3 bg-blue-600 px-4 py-2 rounded-lg items-center self-end"
                  onPress={handleUpdateGarageNotes}
                  disabled={notesLoading}
                >
                  {notesLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-medium">Save Notes</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {displayRequest.updates && displayRequest.updates.length > 0 && (
              <View className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
                <Text className="text-lg font-bold text-gray-800 mb-3">Updates History</Text>
                
                <View className="space-y-3">
                  {displayRequest.updates.slice(0, 5).map((update, index) => (
                    <View key={index} className="border-l-2 border-blue-300 pl-3 py-2">
                      <Text className="text-gray-700 font-medium">{update.update_type.replace('_', ' ')}</Text>
                      {update.notes && (
                        <Text className="text-gray-600 text-sm mt-1">{update.notes}</Text>
                      )}
                      <Text className="text-gray-400 text-xs mt-1">
                        {new Date(update.created_at).toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {displayRequest.status === 'completed' && (
              <View className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
                <Text className="text-lg font-bold text-gray-800 mb-3">Customer Feedback</Text>
                
                {displayRequest.user_rating ? (
                  <View className="space-y-2">
                    <View className="flex-row items-center">
                      {[...Array(5)].map((_, i) => (
                        <MaterialIcons
                          key={i}
                          name={i < userRatingValue ? "star" : "star-border"}
                          size={24}
                          color="#f59e0b"
                        />
                      ))}
                      <Text className="text-gray-700 ml-2 font-medium">{userRatingValue}/5</Text>
                    </View>
                    
                    {displayRequest.user_feedback && (
                      <Text className="text-gray-600 italic mt-2">{displayRequest.user_feedback}</Text>
                    )}
                  </View>
                ) : canSubmitFeedback ? (
                  !showFeedback ? (
                    <TouchableOpacity
                      className="bg-blue-100 rounded-lg p-3 items-center"
                      onPress={() => setShowFeedback(true)}
                    >
                      <Text className="text-blue-700 font-medium">Submit Feedback</Text>
                    </TouchableOpacity>
                  ) : (
                    <View className="space-y-4">
                      <Text className="text-gray-700">Rate your experience:</Text>
                      
                      <View className="flex-row justify-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <TouchableOpacity key={star} onPress={() => setRating(star)}>
                            <MaterialIcons
                              name={star <= rating ? "star" : "star-border"}
                              size={36}
                              color="#f59e0b"
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                      
                      <TextInput
                        className="border border-gray-300 rounded-lg p-3 text-base"
                        placeholder="Additional feedback (optional)"
                        value={feedback}
                        onChangeText={setFeedback}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                      
                      <View className="flex-row space-x-3">
                        <TouchableOpacity
                          className="flex-1 border border-gray-300 px-4 py-2 rounded-lg items-center"
                          onPress={() => setShowFeedback(false)}
                          disabled={submitting}
                        >
                          <Text className="text-gray-700">Cancel</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          className="flex-1 bg-green-600 px-4 py-2 rounded-lg items-center"
                          onPress={handleSubmitFeedback}
                          disabled={submitting || rating === 0}
                        >
                          {submitting ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <Text className="text-white font-medium">Submit</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )
                ) : (
                  <Text className="text-gray-500 italic">No feedback provided yet</Text>
                )}
              </View>
            )}

            <View className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
              <Text className="text-lg font-bold text-gray-800 mb-3">Request Information</Text>
              
              <View className="space-y-2">
                <View className="flex-row">
                  <Text className="text-gray-600 w-40">Request ID:</Text>
                  <Text className="text-gray-800 flex-1">{displayRequest.request_id}</Text>
                </View>
                
                <View className="flex-row">
                  <Text className="text-gray-600 w-40">Created At:</Text>
                  <Text className="text-gray-800 flex-1">
                    {new Date(displayRequest.created_at).toLocaleString()}
                  </Text>
                </View>
                
                {displayRequest.updated_at && (
                  <View className="flex-row">
                    <Text className="text-gray-600 w-40">Updated At:</Text>
                    <Text className="text-gray-800 flex-1">
                      {new Date(displayRequest.updated_at).toLocaleString()}
                    </Text>
                  </View>
                )}
                
                {displayRequest.ip_address && (
                  <View className="flex-row">
                    <Text className="text-gray-600 w-40">IP Address:</Text>
                    <Text className="text-gray-800 flex-1">{displayRequest.ip_address}</Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        )}

        <View className="bg-white border-t border-gray-200 p-4">
          <View className="flex-row justify-between space-x-3">
            {isOwner && displayRequest.status === 'pending' && (
              <TouchableOpacity
                className="flex-1 bg-red-600 px-4 py-3 rounded-lg items-center active:bg-red-700"
                onPress={() => {
                  onClose();
                  setTimeout(() => {
                    Alert.alert(
                      'Cancel Request',
                      'Are you sure you want to cancel this request?',
                      [
                        {
                          text: 'No',
                          style: 'cancel',
                        },
                        {
                          text: 'Yes',
                          onPress: async () => {
                            try {
                              await apiFunctions.updateStatus(displayRequest.id, 'cancelled', 'Cancelled by user');
                              await onUpdate();
                              Alert.alert('Success', 'Request cancelled successfully');
                            } catch (error: any) {
                              Alert.alert('Error', error.response?.data?.detail || 'Failed to cancel request');
                              console.error(error);
                            }
                          },
                        },
                      ]
                    );
                  }, 300);
                }}
              >
                <Text className="text-white font-medium">Cancel Request</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              className="flex-1 border border-gray-300 px-4 py-3 rounded-lg items-center bg-white active:bg-gray-50"
              onPress={onClose}
            >
              <Text className="text-gray-700 font-medium">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <StatusUpdateModal
        visible={showStatusModal}
        request={displayRequest}
        onClose={() => setShowStatusModal(false)}
        onUpdate={async () => {
          await onUpdate();
          await loadDetailedRequest();
        }}
      />
      
      <PriorityUpdateModal
        visible={showPriorityModal}
        request={displayRequest}
        onClose={() => setShowPriorityModal(false)}
        onUpdate={async () => {
          await onUpdate();
          await loadDetailedRequest();
        }}
      />
      
      <CostUpdateModal
        visible={showCostModal}
        request={displayRequest}
        onClose={() => setShowCostModal(false)}
        onUpdate={async () => {
          await onUpdate();
          await loadDetailedRequest();
        }}
      />
    </Modal>
  );
};

// ========== CREATE/EDIT MODAL ==========
const CreateEditModal: React.FC<CreateEditModalProps> = ({ visible, request, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    middle_name: '',
    last_name: '',
    location: '',
    garage_id: '',
    experience: '',
    email: '',
    phone: '',
    vehicle_type: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: '',
    agreed_to_terms: false,
  });
  
  const [loading, setLoading] = useState<boolean>(false);
  const [garages, setGarages] = useState<Garage[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [characterCount, setCharacterCount] = useState<number>(0);

  useEffect(() => {
    if (visible) {
      loadGarages();
      
      if (request) {
        // Parse full_name into first, middle, last names if needed
        let firstName = '';
        let middleName = '';
        let lastName = '';
        
        if (request.full_name) {
          const nameParts = request.full_name.split(' ');
          if (nameParts.length >= 1) firstName = nameParts[0];
          if (nameParts.length >= 2) lastName = nameParts[nameParts.length - 1];
          if (nameParts.length > 2) middleName = nameParts.slice(1, -1).join(' ');
        }
        
        setFormData({
          first_name: request.first_name || firstName,
          middle_name: request.middle_name || middleName,
          last_name: request.last_name || lastName,
          location: request.location || '',
          garage_id: request.garage_id?.toString() || request.garage?.toString() || '',
          experience: request.experience || '',
          email: request.email || '',
          phone: request.phone || '',
          vehicle_type: request.vehicle_type || '',
          vehicle_make: request.vehicle_make || '',
          vehicle_model: request.vehicle_model || '',
          vehicle_year: request.vehicle_year?.toString() || '',
          agreed_to_terms: request.agreed_to_terms || false,
        });
        setCharacterCount(request.experience?.length || 0);
      } else {
        setFormData({
          first_name: '',
          middle_name: '',
          last_name: '',
          location: '',
          garage_id: '',
          experience: '',
          email: '',
          phone: '',
          vehicle_type: '',
          vehicle_make: '',
          vehicle_model: '',
          vehicle_year: '',
          agreed_to_terms: false,
        });
        setCharacterCount(0);
      }
      setErrors({});
    }
  }, [visible, request]);

  const loadGarages = async () => {
    try {
      const data = await apiFunctions.getGarages();
      setGarages(data);
    } catch (error) {
      console.error('Failed to load garages:', error);
      Alert.alert('Error', 'Failed to load garage list');
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    if (field === 'experience') {
      setCharacterCount(value.length);
    }
    
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.garage_id) newErrors.garage_id = 'Please select a garage';
    if (!formData.experience.trim() || formData.experience.length < 10) 
      newErrors.experience = 'Please provide a detailed description (minimum 10 characters)';
    if (!formData.agreed_to_terms) newErrors.agreed_to_terms = 'You must agree to terms';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Combine first, middle, last names into full_name for API
      const fullName = `${formData.first_name} ${formData.middle_name ? formData.middle_name + ' ' : ''}${formData.last_name}`.trim();
      
      const submitData = {
        first_name: formData.first_name,
        middle_name: formData.middle_name || undefined,
        last_name: formData.last_name,
        full_name: fullName,
        location: formData.location,
        garage_id: parseInt(formData.garage_id) || formData.garage_id,
        experience: formData.experience,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        vehicle_type: formData.vehicle_type || undefined,
        vehicle_make: formData.vehicle_make || undefined,
        vehicle_model: formData.vehicle_model || undefined,
        vehicle_year: formData.vehicle_year ? parseInt(formData.vehicle_year) : undefined,
        agreed_to_terms: formData.agreed_to_terms,
      };
      
      let result;
      if (request) {
        result = await apiFunctions.updateServiceRequest(request.id, submitData);
      } else {
        result = await apiFunctions.createServiceRequest(submitData);
      }
      
      onSuccess(result);
      onClose();
    } catch (error: any) {
      console.error('Submit error:', error);
      if (error.response?.data) {
        // Handle Django REST framework validation errors
        if (typeof error.response.data === 'object') {
          const apiErrors: Record<string, string> = {};
          Object.keys(error.response.data).forEach(key => {
            if (Array.isArray(error.response.data[key])) {
              apiErrors[key] = error.response.data[key].join(', ');
            } else {
              apiErrors[key] = error.response.data[key];
            }
          });
          setErrors(apiErrors);
        } else if (error.response.data.detail) {
          Alert.alert('Error', error.response.data.detail);
        } else {
          Alert.alert('Error', 'Failed to save request');
        }
      } else {
        Alert.alert('Error', 'Failed to save request');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center">
          <TouchableOpacity onPress={onClose} className="mr-3">
            <MaterialIcons name="arrow-back" size={24} color="#3b82f6" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800 flex-1">
            {request ? 'Edit Service Request' : 'Create Service Request'}
          </Text>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
            <View className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
              <Text className="text-lg font-bold text-gray-800 mb-3">Personal Information</Text>
              
              <View className="space-y-3">
                <View>
                  <Text className="text-gray-700 font-medium mb-1">First Name *</Text>
                  <TextInput
                    className={`border rounded-lg px-3 py-2 text-base ${
                      errors.first_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.first_name}
                    onChangeText={(value) => handleInputChange('first_name', value)}
                    placeholder="Enter first name"
                  />
                  {errors.first_name && <Text className="text-red-500 text-sm mt-1">{errors.first_name}</Text>}
                </View>
                
                <View>
                  <Text className="text-gray-700 font-medium mb-1">Middle Name</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-3 py-2 text-base"
                    value={formData.middle_name}
                    onChangeText={(value) => handleInputChange('middle_name', value)}
                    placeholder="Enter middle name (optional)"
                  />
                </View>
                
                <View>
                  <Text className="text-gray-700 font-medium mb-1">Last Name *</Text>
                  <TextInput
                    className={`border rounded-lg px-3 py-2 text-base ${
                      errors.last_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.last_name}
                    onChangeText={(value) => handleInputChange('last_name', value)}
                    placeholder="Enter last name"
                  />
                  {errors.last_name && <Text className="text-red-500 text-sm mt-1">{errors.last_name}</Text>}
                </View>
                
                <View>
                  <Text className="text-gray-700 font-medium mb-1">Location *</Text>
                  <TextInput
                    className={`border rounded-lg px-3 py-2 text-base ${
                      errors.location ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.location}
                    onChangeText={(value) => handleInputChange('location', value)}
                    placeholder="Enter your city/location"
                  />
                  {errors.location && <Text className="text-red-500 text-sm mt-1">{errors.location}</Text>}
                </View>
              </View>
            </View>

            <View className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
              <Text className="text-lg font-bold text-gray-800 mb-3">Contact Information (Optional)</Text>
              
              <View className="space-y-3">
                <View>
                  <Text className="text-gray-700 font-medium mb-1">Email</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-3 py-2 text-base"
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    placeholder="Enter email address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                
                <View>
                  <Text className="text-gray-700 font-medium mb-1">Phone</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-3 py-2 text-base"
                    value={formData.phone}
                    onChangeText={(value) => handleInputChange('phone', value)}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </View>

            <View className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
              <Text className="text-lg font-bold text-gray-800 mb-3">Select Garage *</Text>
              
              {garages.length === 0 ? (
                <View className="items-center py-4">
                  <ActivityIndicator size="small" color="#3b82f6" />
                  <Text className="text-gray-500 mt-2">Loading garages...</Text>
                </View>
              ) : (
                <View className="space-y-2">
                  {garages.map((garage) => (
                    <TouchableOpacity
                      key={garage.id.toString()}
                      className={`p-3 rounded-lg border-2 ${
                        formData.garage_id === garage.id.toString()
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                      onPress={() => handleInputChange('garage_id', garage.id.toString())}
                    >
                      <View className="flex-row items-center">
                        <View className={`w-4 h-4 rounded-full mr-3 ${
                          formData.garage_id === garage.id.toString() ? 'bg-blue-500' : 'bg-gray-300'
                        }`} />
                        <View className="flex-1">
                          <Text className="text-gray-800 font-medium">{garage.name}</Text>
                          <Text className="text-gray-600 text-sm mt-1">{garage.address}</Text>
                          {garage.phone && (
                            <Text className="text-gray-500 text-sm mt-1">📞 {garage.phone}</Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {errors.garage_id && <Text className="text-red-500 text-sm mt-2">{errors.garage_id}</Text>}
            </View>

            <View className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
              <Text className="text-lg font-bold text-gray-800 mb-3">Service Details *</Text>
              
              <View className="space-y-3">
                <View>
                  <Text className="text-gray-700 font-medium mb-1">Describe Your Issue *</Text>
                  <TextInput
                    className={`border rounded-lg px-3 py-2 text-base min-h-[100px] ${
                      errors.experience ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.experience}
                    onChangeText={(value) => handleInputChange('experience', value)}
                    placeholder="Please describe your vehicle issues, what work you need done..."
                    multiline
                    textAlignVertical="top"
                  />
                  {errors.experience && <Text className="text-red-500 text-sm mt-1">{errors.experience}</Text>}
                  <Text className="text-gray-500 text-sm mt-1 text-right">
                    {characterCount}/500 characters
                  </Text>
                </View>
                
                <Text className="text-gray-700 font-medium">Vehicle Information (Optional)</Text>
                
                <View className="grid grid-cols-2 gap-3">
                  <View>
                    <Text className="text-gray-600 text-sm mb-1">Type</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-3 py-2 text-base"
                      value={formData.vehicle_type}
                      onChangeText={(value) => handleInputChange('vehicle_type', value)}
                      placeholder="Sedan, SUV, etc"
                    />
                  </View>
                  
                  <View>
                    <Text className="text-gray-600 text-sm mb-1">Year</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-3 py-2 text-base"
                      value={formData.vehicle_year}
                      onChangeText={(value) => handleInputChange('vehicle_year', value)}
                      placeholder="2020"
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View>
                    <Text className="text-gray-600 text-sm mb-1">Make</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-3 py-2 text-base"
                      value={formData.vehicle_make}
                      onChangeText={(value) => handleInputChange('vehicle_make', value)}
                      placeholder="Toyota, Ford, etc"
                    />
                  </View>
                  
                  <View>
                    <Text className="text-gray-600 text-sm mb-1">Model</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-3 py-2 text-base"
                      value={formData.vehicle_model}
                      onChangeText={(value) => handleInputChange('vehicle_model', value)}
                      placeholder="Camry, F-150, etc"
                    />
                  </View>
                </View>
              </View>
            </View>

            <View className="bg-white rounded-xl p-4 border border-gray-100 mb-6">
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => handleInputChange('agreed_to_terms', !formData.agreed_to_terms)}
              >
                <View className={`w-6 h-6 border-2 rounded mr-3 flex items-center justify-center ${
                  formData.agreed_to_terms ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                }`}>
                  {formData.agreed_to_terms && <MaterialIcons name="check" size={16} color="#fff" />}
                </View>
                <Text className="text-gray-700 flex-1">
                  I agree to the Terms of Service and Privacy Policy *
                </Text>
              </TouchableOpacity>
              {errors.agreed_to_terms && <Text className="text-red-500 text-sm mt-2">{errors.agreed_to_terms}</Text>}
            </View>

            <View className="flex-row space-x-3 mb-6">
              <TouchableOpacity
                className="flex-1 border border-gray-300 px-6 py-3 rounded-lg items-center bg-white"
                onPress={onClose}
                disabled={loading}
              >
                <Text className="text-gray-700 font-medium">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className={`flex-1 px-6 py-3 rounded-lg items-center ${
                  loading ? 'bg-blue-400' : 'bg-blue-600'
                }`}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold">
                    {request ? 'Update Request' : 'Submit Request'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

// ========== MAIN COMPONENT ==========
export default function ServiceRequestsManager() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userRole] = useState<string>('admin');
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [showCreateEdit, setShowCreateEdit] = useState<boolean>(false);
  const [editingRequest, setEditingRequest] = useState<ServiceRequest | null>(null);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [showPriorityModal, setShowPriorityModal] = useState<boolean>(false);
  const [showCostModal, setShowCostModal] = useState<boolean>(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'warning' | 'danger' | 'success';
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {},
  });

  // Fix: Use ReturnType<typeof setTimeout> for cross-platform compatibility
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const params: any = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      
      const [requestsData, statsData] = await Promise.all([
        apiFunctions.getServiceRequests(params),
        apiFunctions.getStatistics(),
      ]);
      
      console.log('Loaded requests:', requestsData.length); // Debug log
      setRequests(requestsData);
      setStatistics(statsData);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to load service requests');
      
      // Set empty arrays to prevent infinite loading
      setRequests([]);
      setStatistics({
        total_requests: 0,
        pending_requests: 0,
        in_progress_requests: 0,
        completed_requests: 0,
        recent_requests_last_7_days: 0,
        average_rating: 0
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (searchQuery) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Fix: Use ReturnType<typeof setTimeout>
      timeoutRef.current = setTimeout(async () => {
        try {
          const results = await apiFunctions.searchRequests(searchQuery);
          setRequests(results);
        } catch (error) {
          console.error('Search error:', error);
          // If search fails, revert to showing all data
          loadData();
        }
      }, 500);
    } else {
      loadData();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchQuery, loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const showConfirmation = (
    title: string, 
    message: string, 
    type: 'warning' | 'danger' | 'success', 
    onConfirm: () => void
  ) => {
    setConfirmationModal({
      visible: true,
      title,
      message,
      type,
      onConfirm: () => {
        setConfirmationModal(prev => ({ ...prev, visible: false }));
        onConfirm();
      },
    });
  };

  const handleAction = (action: string, request: ServiceRequest) => {
    switch (action) {
      case 'update_status':
        setSelectedRequest(request);
        setShowStatusModal(true);
        break;
      case 'update_priority':
        setSelectedRequest(request);
        setShowPriorityModal(true);
        break;
      case 'update_cost':
        setSelectedRequest(request);
        setShowCostModal(true);
        break;
    }
  };

  const handleDeleteRequest = (request: ServiceRequest) => {
    showConfirmation(
      'Delete Request',
      `Are you sure you want to delete the request from ${request.full_name}? This action cannot be undone.`,
      'danger',
      async () => {
        try {
          await apiFunctions.deleteServiceRequest(request.id);
          await loadData();
          Alert.alert('Success', 'Request deleted successfully');
        } catch (error: any) {
          Alert.alert('Error', error.response?.data?.detail || 'Failed to delete request');
          console.error(error);
        }
      }
    );
  };

  const handleEditRequest = (request: ServiceRequest) => {
    setEditingRequest(request);
    setShowCreateEdit(true);
  };

  const handleCreateSuccess = () => {
    loadData();
    Alert.alert('Success', 'Service request created successfully');
  };

  const handleUpdateSuccess = () => {
    loadData();
    Alert.alert('Success', 'Service request updated successfully');
  };

  if (loading && !refreshing) {
    return <LoadingSpinner message="Loading service requests..." />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" style={{ paddingTop: Platform.OS === 'android' ? 25 : 0 }}>
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-gray-800">Service Requests</Text>
            <Text className="text-sm text-gray-500 mt-1">Manage all service requests</Text>
          </View>
          
          <View className="flex-row items-center space-x-2">
            <TouchableOpacity
              className="px-3 py-1.5 bg-blue-600 rounded active:bg-blue-700"
              onPress={() => {
                setEditingRequest(null);
                setShowCreateEdit(true);
              }}
            >
              <View className="flex-row items-center">
                <MaterialIcons name="add" size={16} color="#fff" />
                <Text className="text-white font-medium text-sm ml-1">New</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="px-3 py-1.5 bg-green-600 rounded active:bg-green-700"
              onPress={loadData}
            >
              <View className="flex-row items-center">
                <MaterialIcons name="refresh" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <MaterialIcons name="search" size={20} color="#6b7280" />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Search by name, location, or request ID..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {statistics && (
        <View className="bg-white px-4 py-3 border-b border-gray-200">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-4">
              <View className="items-center min-w-[80px]">
                <Text className="text-2xl font-bold text-gray-800">{statistics.total_requests}</Text>
                <Text className="text-xs text-gray-500">Total</Text>
              </View>
              
              <View className="items-center min-w-[80px]">
                <Text className="text-2xl font-bold text-yellow-600">{statistics.pending_requests}</Text>
                <Text className="text-xs text-gray-500">Pending</Text>
              </View>
              
              <View className="items-center min-w-[80px]">
                <Text className="text-2xl font-bold text-purple-600">{statistics.in_progress_requests}</Text>
                <Text className="text-xs text-gray-500">In Progress</Text>
              </View>
              
              <View className="items-center min-w-[80px]">
                <Text className="text-2xl font-bold text-green-600">{statistics.completed_requests}</Text>
                <Text className="text-xs text-gray-500">Completed</Text>
              </View>
              
              <View className="items-center min-w-[80px]">
                <Text className="text-2xl font-bold text-red-600">
                  {statistics.requests_by_status?.find(s => s.status === 'rejected')?.count || 0}
                </Text>
                <Text className="text-xs text-gray-500">Rejected</Text>
              </View>
              
              <View className="items-center min-w-[80px]">
                <Text className="text-2xl font-bold text-blue-600">
                  {statistics.recent_requests_last_7_days}
                </Text>
                <Text className="text-xs text-gray-500">Last 7 Days</Text>
              </View>
              
              <View className="items-center min-w-[80px]">
                <Text className="text-2xl font-bold text-orange-600">
                  {statistics.average_rating ? statistics.average_rating.toFixed(1) : '0.0'}
                </Text>
                <Text className="text-xs text-gray-500">Avg Rating</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row space-x-2">
            <TouchableOpacity
              className={`px-4 py-2 rounded-full ${filter === 'all' ? 'bg-blue-600' : 'bg-gray-100'}`}
              onPress={() => setFilter('all')}
            >
              <Text className={`font-medium text-sm ${filter === 'all' ? 'text-white' : 'text-gray-700'}`}>
                All
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className={`px-4 py-2 rounded-full ${filter === 'pending' ? 'bg-blue-600' : 'bg-gray-100'}`}
              onPress={() => setFilter('pending')}
            >
              <Text className={`font-medium text-sm ${filter === 'pending' ? 'text-white' : 'text-gray-700'}`}>
                Pending
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className={`px-4 py-2 rounded-full ${filter === 'received' ? 'bg-blue-600' : 'bg-gray-100'}`}
              onPress={() => setFilter('received')}
            >
              <Text className={`font-medium text-sm ${filter === 'received' ? 'text-white' : 'text-gray-700'}`}>
                Received
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className={`px-4 py-2 rounded-full ${filter === 'in_progress' ? 'bg-blue-600' : 'bg-gray-100'}`}
              onPress={() => setFilter('in_progress')}
            >
              <Text className={`font-medium text-sm ${filter === 'in_progress' ? 'text-white' : 'text-gray-700'}`}>
                In Progress
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className={`px-4 py-2 rounded-full ${filter === 'completed' ? 'bg-green-100' : 'bg-gray-100'}`}
              onPress={() => setFilter('completed')}
            >
              <Text className={`font-medium text-sm ${filter === 'completed' ? 'text-green-700' : 'text-gray-700'}`}>
                Completed
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className={`px-4 py-2 rounded-full ${filter === 'cancelled' ? 'bg-gray-100' : 'bg-gray-100'}`}
              onPress={() => setFilter('cancelled')}
            >
              <Text className={`font-medium text-sm ${filter === 'cancelled' ? 'text-gray-700' : 'text-gray-700'}`}>
                Cancelled
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className={`px-4 py-2 rounded-full ${filter === 'rejected' ? 'bg-red-100' : 'bg-gray-100'}`}
              onPress={() => setFilter('rejected')}
            >
              <Text className={`font-medium text-sm ${filter === 'rejected' ? 'text-red-700' : 'text-gray-700'}`}>
                Rejected
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      <FlatList
        data={requests}
        renderItem={({ item }) => (
          <ServiceRequestCard
            request={item}
            onPress={(req) => {
              setSelectedRequest(req);
              setShowDetail(true);
            }}
            onAction={handleAction}
            userRole={userRole}
            onEdit={handleEditRequest}
            onDelete={handleDeleteRequest}
          />
        )}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View className="items-center py-12">
            <MaterialIcons name="inbox" size={64} color="#9ca3af" />
            <Text className="text-gray-500 text-lg mt-4">No service requests found</Text>
            <Text className="text-gray-400 text-sm mt-2">Pull down to refresh</Text>
            <TouchableOpacity
              className="mt-4 bg-blue-600 px-6 py-3 rounded-lg active:bg-blue-700"
              onPress={() => setShowCreateEdit(true)}
            >
              <View className="flex-row items-center">
                <MaterialIcons name="add" size={20} color="#fff" />
                <Text className="text-white font-medium ml-2">Create Your First Request</Text>
              </View>
            </TouchableOpacity>
          </View>
        }
        className="flex-1"
        contentContainerStyle={requests.length === 0 ? { flexGrow: 1 } : { paddingBottom: 20 }}
      />

      <ConfirmationModal
        visible={confirmationModal.visible}
        title={confirmationModal.title}
        message={confirmationModal.message}
        type={confirmationModal.type}
        onConfirm={confirmationModal.onConfirm}
        onCancel={() => setConfirmationModal(prev => ({ ...prev, visible: false }))}
      />
      
      <StatusUpdateModal
        visible={showStatusModal}
        request={selectedRequest}
        onClose={() => setShowStatusModal(false)}
        onUpdate={loadData}
      />
      
      <PriorityUpdateModal
        visible={showPriorityModal}
        request={selectedRequest}
        onClose={() => setShowPriorityModal(false)}
        onUpdate={loadData}
      />
      
      <CostUpdateModal
        visible={showCostModal}
        request={selectedRequest}
        onClose={() => setShowCostModal(false)}
        onUpdate={loadData}
      />
      
      <DetailViewModal
        visible={showDetail}
        request={selectedRequest}
        onClose={() => setShowDetail(false)}
        onUpdate={loadData}
        userRole={userRole}
      />
      
      <CreateEditModal
        visible={showCreateEdit}
        request={editingRequest}
        onClose={() => {
          setShowCreateEdit(false);
          setEditingRequest(null);
        }}
        onSuccess={editingRequest ? handleUpdateSuccess : handleCreateSuccess}
      />
    </SafeAreaView>
  );
}