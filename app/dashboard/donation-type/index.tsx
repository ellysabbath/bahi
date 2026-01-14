import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';

const { width } = Dimensions.get('window');

// ============ API CONFIGURATION ============
const API_BASE_URL = 'https://mhazini.pythonanywhere.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============ INTERFACES ============
interface Church {
  id: number;
  church_name: string;
  region?: string;
  district?: string;
  ward?: string;
  village?: string;
}

interface User {
  id: number;
  fullname: string;
  email: string;
  mobile_number?: string;
  membership_number?: string;
}

interface Donation {
  id: number;
  receipt_number: string;
  user: number;  // This is the user ID
  church: number; // This is the church ID
  amount: string;
  donation_type: 'zaka' | 'sadaka' | 'mchango' | 'nyingine';
  direction: 'CTF' | 'KANISA_MAHALIA' | 'MTAA';
  zaka_amount: string;
  sadaka_pamoja_ctf: string;
  sadaka_pamoja_kanisa: string;
  jumla_fedha_kanisa: string;
  jumla_ya_fedha_ctf: string;
  jumla_ya_fedha_zote: string;
  amount_in_words: string;
  description?: string;
  donation_date: string;
  created_at: string;
  updated_at: string;
}

// Helper function to get display information
interface DonationDisplay extends Donation {
  user_name?: string;
  church_name?: string;
  user_details?: User;
  church_details?: Church;
}

// ============ MAIN COMPONENT ============
export default function DonationsPage() {
  const router = useRouter();
  
  // ============ STATE VARIABLES ============
  const [donations, setDonations] = useState<DonationDisplay[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingDonation, setEditingDonation] = useState<DonationDisplay | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [showChurchPicker, setShowChurchPicker] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    donation_type: 'sadaka' as 'zaka' | 'sadaka' | 'mchango' | 'nyingine',
    direction: 'CTF' as 'CTF' | 'KANISA_MAHALIA' | 'MTAA',
    description: '',
  });

  // ============ LOAD DATA ============
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      console.log('Loading donations data...');
      
      // Fetch all data in parallel
      const [donationsResponse, churchesResponse, usersResponse] = await Promise.all([
        api.get('/api/auth/donations/'),
        api.get('/api/auth/churches/'),
        api.get('/api/auth/users/'),
      ]);
      
      const donationsData: Donation[] = donationsResponse.data;
      const churchesData: Church[] = churchesResponse.data;
      const usersData: User[] = usersResponse.data;
      
      console.log('Donations loaded:', donationsData.length);
      console.log('Churches loaded:', churchesData.length);
      console.log('Users loaded:', usersData.length);
      
      // Process donations to include user and church names
      const processedDonations: DonationDisplay[] = donationsData.map(donation => {
        const user = usersData.find(u => u.id === donation.user);
        const church = churchesData.find(c => c.id === donation.church);
        
        return {
          ...donation,
          user_name: user?.fullname || 'Unknown User',
          church_name: church?.church_name || 'Unknown Church',
          user_details: user,
          church_details: church,
        };
      });
      
      setDonations(processedDonations);
      setChurches(churchesData);
      setUsers(usersData);
      
    } catch (error: any) {
      console.error('Error loading data:', error.response?.data || error.message);
      Alert.alert(
        'Error Loading Data',
        error.message || 'Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  // ============ CRUD OPERATIONS ============
  const handleCreateDonation = () => {
    setFormMode('create');
    setEditingDonation(null);
    setSelectedUser(null);
    setSelectedChurch(null);
    setFormData({
      amount: '',
      donation_type: 'sadaka',
      direction: 'CTF',
      description: '',
    });
    setShowForm(true);
  };

  const handleEditDonation = (donation: DonationDisplay) => {
    setFormMode('edit');
    setEditingDonation(donation);
    
    // Find the selected user and church from the lists
    const user = users.find(u => u.id === donation.user);
    const church = churches.find(c => c.id === donation.church);
    
    setSelectedUser(user || null);
    setSelectedChurch(church || null);
    
    setFormData({
      amount: donation.amount || '',
      donation_type: donation.donation_type || 'sadaka',
      direction: donation.direction || 'CTF',
      description: donation.description || '',
    });
    
    setShowForm(true);
  };

  const handleDeleteDonation = async (donation: DonationDisplay) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete donation ${donation.receipt_number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/auth/donations/${donation.id}/`);
              await loadData();
              Alert.alert('Success', 'Donation deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete donation');
            }
          },
        },
      ]
    );
  };

  const handleSubmitDonation = async () => {
    // Validate form
    if (!selectedUser || !selectedChurch || !formData.amount) {
      Alert.alert('Missing Information', 'Please select a donor, church, and enter amount');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
      return;
    }

    try {
      const donationPayload = {
        user: selectedUser.id,
        church: selectedChurch.id,
        amount: amount.toString(),
        donation_type: formData.donation_type,
        direction: formData.direction,
        description: formData.description,
      };

      console.log('Submitting donation payload:', donationPayload);

      if (formMode === 'create') {
        await api.post('/api/auth/donations/', donationPayload);
        Alert.alert('Success', 'Donation created successfully');
      } else if (editingDonation) {
        await api.put(`/api/auth/donations/${editingDonation.id}/`, donationPayload);
        Alert.alert('Success', 'Donation updated successfully');
      }

      setShowForm(false);
      await loadData();
    } catch (error: any) {
      console.error('Error saving donation:', error.response?.data || error);
      const errorMsg = error.response?.data?.detail || 
                      error.response?.data?.message || 
                      error.message || 
                      'Failed to save donation';
      Alert.alert('Error', errorMsg);
    }
  };

  // ============ HELPER FUNCTIONS ============
  const calculateDistribution = () => {
    const amount = parseFloat(formData.amount) || 0;
    
    if (formData.donation_type === 'zaka') {
      return {
        zaka: amount,
        sadaka_ctf: 0,
        sadaka_kanisa: 0,
        total: amount,
      };
    }

    if (formData.direction === 'KANISA_MAHALIA' || formData.direction === 'MTAA') {
      return {
        zaka: 0,
        sadaka_ctf: 0,
        sadaka_kanisa: amount,
        total: amount,
      };
    }

    // CTF distribution: 50% zaka, 50% sadaka, with sadaka split 58% CTF, 42% church
    const zaka = amount * 0.5;
    const sadaka_total = amount * 0.5;
    const sadaka_ctf = sadaka_total * 0.58;
    const sadaka_kanisa = sadaka_total * 0.42;
    
    return {
      zaka,
      sadaka_ctf,
      sadaka_kanisa,
      total: amount,
    };
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return 'TSh 0.00';
    
    return `TSh ${num.toLocaleString('en-TZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'zaka': return '#2ecc71';
      case 'sadaka': return '#3498db';
      case 'mchango': return '#9b59b6';
      default: return '#7f8c8d';
    }
  };

  const getDirectionLabel = (direction: string) => {
    switch (direction) {
      case 'CTF': return 'CTF';
      case 'KANISA_MAHALIA': return 'Kanisa Mahalia';
      case 'MTAA': return 'Mtaa';
      default: return direction || 'CTF';
    }
  };

  const filteredDonations = donations.filter(donation => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      donation.receipt_number.toLowerCase().includes(searchLower) ||
      donation.user_name?.toLowerCase().includes(searchLower) ||
      donation.church_name?.toLowerCase().includes(searchLower) ||
      donation.description?.toLowerCase().includes(searchLower)
    );
  });

  // ============ RENDER LOADING ============
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading donations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ============ RENDER FORM MODAL ============
  const renderFormModal = () => (
    <Modal
      visible={showForm}
      animationType="slide"
      onRequestClose={() => setShowForm(false)}
    >
      <SafeAreaView style={styles.modalSafeArea}>
        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {formMode === 'create' ? 'New Donation' : 'Edit Donation'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.formContainer}>
            {/* Donor (User) Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Donor (User) *</Text>
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={() => setShowUserPicker(true)}
              >
                {selectedUser ? (
                  <View style={styles.selectedItem}>
                    <FontAwesome5 name="user" size={16} color="#3498db" />
                    <View style={styles.selectedItemInfo}>
                      <Text style={styles.selectedItemName}>{selectedUser.fullname}</Text>
                      <Text style={styles.selectedItemDetail}>
                        {selectedUser.membership_number || selectedUser.email}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.placeholderText}>Select donor</Text>
                )}
                <Ionicons name="chevron-down" size={20} color="#7f8c8d" />
              </TouchableOpacity>
            </View>

            {/* Church Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Church *</Text>
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={() => setShowChurchPicker(true)}
              >
                {selectedChurch ? (
                  <View style={styles.selectedItem}>
                    <FontAwesome5 name="church" size={16} color="#3498db" />
                    <View style={styles.selectedItemInfo}>
                      <Text style={styles.selectedItemName}>{selectedChurch.church_name}</Text>
                      <Text style={styles.selectedItemDetail}>
                        {selectedChurch.region || selectedChurch.district || 'Location not specified'}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.placeholderText}>Select church</Text>
                )}
                <Ionicons name="chevron-down" size={20} color="#7f8c8d" />
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Amount (TSh) *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.amount}
                onChangeText={(value) => setFormData({...formData, amount: value.replace(/[^0-9.]/g, '')})}
                placeholder="Enter amount"
                keyboardType="decimal-pad"
                placeholderTextColor="#95a5a6"
              />
            </View>

            {/* Donation Type */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Donation Type</Text>
              <View style={styles.typeSelector}>
                {[
                  { label: 'Zaka', value: 'zaka', color: '#2ecc71', icon: 'money-bill-wave' },
                  { label: 'Sadaka', value: 'sadaka', color: '#3498db', icon: 'hand-holding-heart' },
                  { label: 'Mchango', value: 'mchango', color: '#9b59b6', icon: 'handshake' },
                  { label: 'Nyingine', value: 'nyingine', color: '#7f8c8d', icon: 'ellipsis-h' },
                ].map(type => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeOption,
                      formData.donation_type === type.value && [
                        styles.typeOptionActive,
                        { borderColor: type.color }
                      ]
                    ]}
                    onPress={() => setFormData({...formData, donation_type: type.value as any})}
                  >
                    <FontAwesome5 name={type.icon} size={14} color={type.color} />
                    <Text style={[
                      styles.typeOptionText,
                      formData.donation_type === type.value && { color: type.color, fontWeight: '600' }
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Direction */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Direction</Text>
              <View style={styles.directionSelector}>
                {[
                  { label: 'CTF', value: 'CTF', icon: '🏢' },
                  { label: 'KANISA MAHALIA', value: 'KANISA_MAHALIA', icon: '⛪' },
                  { label: 'MTAA', value: 'MTAA', icon: '🏘️' },
                ].map(dir => (
                  <TouchableOpacity
                    key={dir.value}
                    style={[
                      styles.directionOption,
                      formData.direction === dir.value && styles.directionOptionActive
                    ]}
                    onPress={() => setFormData({...formData, direction: dir.value as any})}
                  >
                    <Text style={styles.directionIcon}>{dir.icon}</Text>
                    <Text style={[
                      styles.directionText,
                      formData.direction === dir.value && styles.directionTextActive
                    ]}>
                      {dir.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => setFormData({...formData, description: value})}
                placeholder="Enter any additional notes..."
                multiline
                numberOfLines={3}
                placeholderTextColor="#95a5a6"
              />
            </View>

            {/* Distribution Preview */}
            <View style={styles.previewSection}>
              <Text style={styles.previewTitle}>Distribution Preview</Text>
              <View style={styles.previewCard}>
                <View style={styles.previewRow}>
                  <View style={styles.previewLabelContainer}>
                    <View style={[styles.previewDot, { backgroundColor: '#2ecc71' }]} />
                    <Text style={styles.previewLabel}>Zaka Amount:</Text>
                  </View>
                  <Text style={styles.previewValue}>
                    {formatCurrency(calculateDistribution().zaka)}
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  <View style={styles.previewLabelContainer}>
                    <View style={[styles.previewDot, { backgroundColor: '#3498db' }]} />
                    <Text style={styles.previewLabel}>Sadaka Pamoja CTF:</Text>
                  </View>
                  <Text style={styles.previewValue}>
                    {formatCurrency(calculateDistribution().sadaka_ctf)}
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  <View style={styles.previewLabelContainer}>
                    <View style={[styles.previewDot, { backgroundColor: '#9b59b6' }]} />
                    <Text style={styles.previewLabel}>Sadaka Pamoja Kanisa:</Text>
                  </View>
                  <Text style={styles.previewValue}>
                    {formatCurrency(calculateDistribution().sadaka_kanisa)}
                  </Text>
                </View>
                <View style={[styles.previewRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Amount:</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(calculateDistribution().total)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Form Actions */}
            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.formButton, styles.cancelButton]}
                onPress={() => setShowForm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formButton, styles.submitButton]}
                onPress={handleSubmitDonation}
              >
                <Ionicons 
                  name={formMode === 'create' ? 'add-circle' : 'checkmark-circle'} 
                  size={20} 
                  color="#fff" 
                />
                <Text style={styles.submitButtonText}>
                  {formMode === 'create' ? 'Create Donation' : 'Update Donation'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  // ============ RENDER PICKER MODALS ============
  const renderUserPicker = () => (
    <Modal
      visible={showUserPicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowUserPicker(false)}
    >
      <View style={styles.pickerModalOverlay}>
        <View style={styles.pickerModal}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Donor</Text>
            <TouchableOpacity onPress={() => setShowUserPicker(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerList}>
            {users.map(user => (
              <TouchableOpacity
                key={user.id}
                style={[
                  styles.pickerItem,
                  selectedUser?.id === user.id && styles.pickerItemSelected
                ]}
                onPress={() => {
                  setSelectedUser(user);
                  setShowUserPicker(false);
                }}
              >
                <FontAwesome5 name="user-circle" size={20} color="#3498db" />
                <View style={styles.pickerItemInfo}>
                  <Text style={styles.pickerItemName}>{user.fullname}</Text>
                  <Text style={styles.pickerItemDetail}>
                    {user.membership_number || user.email || 'No contact info'}
                  </Text>
                </View>
                {selectedUser?.id === user.id && (
                  <Ionicons name="checkmark-circle" size={20} color="#2ecc71" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderChurchPicker = () => (
    <Modal
      visible={showChurchPicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowChurchPicker(false)}
    >
      <View style={styles.pickerModalOverlay}>
        <View style={styles.pickerModal}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Church</Text>
            <TouchableOpacity onPress={() => setShowChurchPicker(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerList}>
            {churches.map(church => (
              <TouchableOpacity
                key={church.id}
                style={[
                  styles.pickerItem,
                  selectedChurch?.id === church.id && styles.pickerItemSelected
                ]}
                onPress={() => {
                  setSelectedChurch(church);
                  setShowChurchPicker(false);
                }}
              >
                <FontAwesome5 name="church" size={20} color="#3498db" />
                <View style={styles.pickerItemInfo}>
                  <Text style={styles.pickerItemName}>{church.church_name}</Text>
                  <Text style={styles.pickerItemDetail}>
                    {church.region || church.district || 'Location not specified'}
                  </Text>
                </View>
                {selectedChurch?.id === church.id && (
                  <Ionicons name="checkmark-circle" size={20} color="#2ecc71" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Donations Management</Text>
          <TouchableOpacity onPress={() => router.push('/dashboard/reports')}>
            <MaterialIcons name="receipt" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#7f8c8d" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by receipt, donor, or church..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#95a5a6"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#e74c3c" />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={[styles.quickAction, { backgroundColor: '#2ecc71' }]} onPress={handleCreateDonation}>
            <Ionicons name="add-circle" size={18} color="#fff" />
            <Text style={[styles.quickActionText, { color: '#fff' }]}>New Donation</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickAction, { backgroundColor: '#3498db' }]} onPress={onRefresh}>
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={[styles.quickActionText, { color: '#fff' }]}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Donations List */}
        <ScrollView
          style={styles.donationsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredDonations.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="receipt-long" size={64} color="#bdc3c7" />
              <Text style={styles.emptyStateTitle}>
                {searchQuery ? 'No donations found' : 'No donations yet'}
              </Text>
              <Text style={styles.emptyStateSubtitle}>
                {searchQuery ? 'Try a different search term' : 'Start by creating your first donation'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity style={styles.emptyStateButton} onPress={handleCreateDonation}>
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.emptyStateButtonText}>Create Donation</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.donationsGrid}>
              {filteredDonations.map(donation => (
                <View key={donation.id} style={styles.donationCard}>
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.receiptInfo}>
                      <MaterialIcons name="receipt" size={16} color="#3498db" />
                      <Text style={styles.receiptNumber}>{donation.receipt_number}</Text>
                    </View>
                    <View style={[
                      styles.typeBadge,
                      { backgroundColor: getTypeColor(donation.donation_type) + '20' }
                    ]}>
                      <View style={[
                        styles.typeDot,
                        { backgroundColor: getTypeColor(donation.donation_type) }
                      ]} />
                      <Text style={[
                        styles.typeText,
                        { color: getTypeColor(donation.donation_type) }
                      ]}>
                        {donation.donation_type.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Card Body */}
                  <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                      <FontAwesome5 name="user" size={12} color="#7f8c8d" />
                      <Text style={styles.infoLabel}>Donor:</Text>
                      <Text style={styles.infoValue} numberOfLines={1}>
                        {donation.user_name}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <FontAwesome5 name="church" size={12} color="#7f8c8d" />
                      <Text style={styles.infoLabel}>Church:</Text>
                      <Text style={styles.infoValue} numberOfLines={1}>
                        {donation.church_name}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <FontAwesome5 name="money-bill-wave" size={12} color="#7f8c8d" />
                      <Text style={styles.infoLabel}>Amount:</Text>
                      <Text style={[styles.infoValue, styles.amountValue]}>
                        {formatCurrency(donation.amount)}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <FontAwesome5 name="directions" size={12} color="#7f8c8d" />
                      <Text style={styles.infoLabel}>Direction:</Text>
                      <Text style={styles.infoValue}>
                        {getDirectionLabel(donation.direction)}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="calendar" size={12} color="#7f8c8d" />
                      <Text style={styles.infoLabel}>Date:</Text>
                      <Text style={styles.infoValue}>
                        {new Date(donation.donation_date).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  {/* Card Footer */}
                  <View style={styles.cardFooter}>
                    <TouchableOpacity
                      style={[styles.cardAction, styles.viewAction]}
                      onPress={() => handleEditDonation(donation)}
                    >
                      <Ionicons name="eye" size={14} color="#fff" />
                      <Text style={styles.actionText}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.cardAction, styles.editAction]}
                      onPress={() => handleEditDonation(donation)}
                    >
                      <Ionicons name="create" size={14} color="#fff" />
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.cardAction, styles.deleteAction]}
                      onPress={() => handleDeleteDonation(donation)}
                    >
                      <Ionicons name="trash" size={14} color="#fff" />
                      <Text style={styles.actionText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Form Modal */}
        {renderFormModal()}

        {/* Picker Modals */}
        {renderUserPicker()}
        {renderChurchPicker()}

        {/* Floating Action Button */}
        <TouchableOpacity style={styles.fab} onPress={handleCreateDonation}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#7f8c8d',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  donationsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  donationsGrid: {
    gap: 12,
    paddingBottom: 100,
  },
  donationCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  receiptInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  receiptNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardBody: {
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    minWidth: 50,
  },
  infoValue: {
    flex: 1,
    fontSize: 12,
    color: '#333',
  },
  amountValue: {
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  cardFooter: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 6,
  },
  cardAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  viewAction: {
    backgroundColor: '#3498db',
  },
  editAction: {
    backgroundColor: '#f39c12',
  },
  deleteAction: {
    backgroundColor: '#e74c3c',
  },
  actionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalScroll: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  selectedItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedItemInfo: {
    flex: 1,
  },
  selectedItemName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectedItemDetail: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  placeholderText: {
    fontSize: 14,
    color: '#95a5a6',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    gap: 6,
  },
  typeOptionActive: {
    borderWidth: 2,
    backgroundColor: '#f8f9fa',
  },
  typeOptionText: {
    fontSize: 12,
    color: '#333',
  },
  directionSelector: {
    gap: 8,
  },
  directionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  directionOptionActive: {
    borderColor: '#3498db',
    backgroundColor: '#3498db10',
  },
  directionIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  directionText: {
    fontSize: 13,
    color: '#333',
  },
  directionTextActive: {
    color: '#3498db',
    fontWeight: '600',
  },
  previewSection: {
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  previewLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  previewLabel: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  previewValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  formButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#2ecc71',
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  submitButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  pickerList: {
    padding: 16,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  pickerItemSelected: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  pickerItemInfo: {
    flex: 1,
  },
  pickerItemName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  pickerItemDetail: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});