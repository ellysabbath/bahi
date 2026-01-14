import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Calendar, 
  CheckCircle, 
  XCircle,
  Church,
  Users,
  Heart,
  Users as MembersIcon
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const API_URL = 'https://mhazini.pythonanywhere.com/api/auth/churches/';
const USERS_API_URL = 'https://mhazini.pythonanywhere.com/api/auth/users/';

const ChurchesPage = () => {
  const router = useRouter();
  
  // States
  const [churches, setChurches] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentChurchId, setCurrentChurchId] = useState(null);
  
  // Form states
  const [church_name, setChurchName] = useState('');
  const [description, setDescription] = useState('');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [village, setVillage] = useState('');
  const [phone_number, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [leader, setLeader] = useState('');
  const [is_active, setIsActive] = useState(true);
  const [established_date, setEstablishedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [members, setMembers] = useState([]);
  
  // Tanzanian country code
  const COUNTRY_CODE = '255';

  // Format phone number input
  const handlePhoneInput = (text) => {
    let cleanText = text.replace(/\D/g, '');
    
    if (cleanText.length > 9) {
      cleanText = cleanText.substring(0, 9);
    }
    
    setPhoneNumber(cleanText);
  };

  // Get full phone number
  const getFullPhoneNumber = () => {
    if (!phone_number) return '';
    return COUNTRY_CODE + phone_number;
  };

  // Fetch all churches
  const fetchChurches = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      setChurches(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch churches');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users for leader selection
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await axios.get(USERS_API_URL);
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  // Create church
  const createChurch = async () => {
    // Validation
    if (!church_name) {
      Alert.alert('Validation Error', 'Church name is required');
      return;
    }

    // Validate phone if provided
    if (phone_number && phone_number.length !== 9) {
      Alert.alert('Validation Error', 'Phone number must be exactly 9 digits (after 255)');
      return;
    }

    try {
      const churchData = {
        church_name,
        description: description || '',
        region: region || '',
        district: district || '',
        ward: ward || '',
        village: village || '',
        phone_number: getFullPhoneNumber() || '',
        email: email || '',
        leader: leader || null,
        is_active,
        established_date: established_date.toISOString().split('T')[0],
        members: members || [],
      };

      await axios.post(API_URL, churchData);
      Alert.alert('Success', 'Church created successfully');
      resetForm();
      setModalVisible(false);
      fetchChurches();
    } catch (error) {
      if (error.response?.data) {
        const errors = error.response.data;
        let errorMessage = '';
        
        for (const key in errors) {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        }
        
        Alert.alert('API Error', errorMessage);
      } else {
        Alert.alert('Error', 'Failed to create church');
      }
      console.error(error.response?.data || error);
    }
  };

  // Update church
  const updateChurch = async () => {
    if (!currentChurchId) return;

    // Validation
    if (!church_name) {
      Alert.alert('Validation Error', 'Church name is required');
      return;
    }

    // Validate phone if provided
    if (phone_number && phone_number.length !== 9) {
      Alert.alert('Validation Error', 'Phone number must be exactly 9 digits (after 255)');
      return;
    }

    try {
      const churchData = {
        church_name,
        description: description || '',
        region: region || '',
        district: district || '',
        ward: ward || '',
        village: village || '',
        phone_number: getFullPhoneNumber() || '',
        email: email || '',
        leader: leader || null,
        is_active,
        established_date: established_date.toISOString().split('T')[0],
        members: members || [],
      };

      await axios.put(`${API_URL}${currentChurchId}/`, churchData);
      Alert.alert('Success', 'Church updated successfully');
      resetForm();
      setModalVisible(false);
      fetchChurches();
    } catch (error) {
      if (error.response?.data) {
        const errors = error.response.data;
        let errorMessage = '';
        
        for (const key in errors) {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        }
        
        Alert.alert('API Error', errorMessage);
      } else {
        Alert.alert('Error', 'Failed to update church');
      }
      console.error(error.response?.data || error);
    }
  };

  // Delete church
  const deleteChurch = async (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this church?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}${id}/`);
              Alert.alert('Success', 'Church deleted successfully');
              fetchChurches();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete church');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  // Edit church
  const editChurch = (church) => {
    setCurrentChurchId(church.id);
    setChurchName(church.church_name);
    setDescription(church.description || '');
    setRegion(church.region || '');
    setDistrict(church.district || '');
    setWard(church.ward || '');
    setVillage(church.village || '');
    
    // Extract last 9 digits from phone number if exists
    if (church.phone_number) {
      const phone = church.phone_number;
      const lastNineDigits = phone.startsWith('255') ? phone.substring(3) : phone;
      setPhoneNumber(lastNineDigits);
    } else {
      setPhoneNumber('');
    }
    
    setEmail(church.email || '');
    setLeader(church.leader || '');
    setIsActive(church.is_active);
    
    // Set members if exists
    if (church.members && Array.isArray(church.members)) {
      setMembers(church.members.map(member => member.id));
    }
    
    // Parse established date
    if (church.established_date) {
      setEstablishedDate(new Date(church.established_date));
    }
    
    setEditing(true);
    setModalVisible(true);
  };

  // Reset form
  const resetForm = () => {
    setChurchName('');
    setDescription('');
    setRegion('');
    setDistrict('');
    setWard('');
    setVillage('');
    setPhoneNumber('');
    setEmail('');
    setLeader('');
    setMembers([]);
    setIsActive(true);
    setEstablishedDate(new Date());
    setCurrentChurchId(null);
    setEditing(false);
  };

  // Handle submit
  const handleSubmit = () => {
    if (editing) {
      updateChurch();
    } else {
      createChurch();
    }
  };

  // Handle date picker
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEstablishedDate(selectedDate);
    }
  };

  // Toggle member selection
  const toggleMember = (userId) => {
    if (members.includes(userId)) {
      setMembers(members.filter(id => id !== userId));
    } else {
      setMembers([...members, userId]);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchChurches();
    fetchUsers();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get leader name from ID
  const getLeaderName = (leaderId) => {
    if (!leaderId) return 'No leader assigned';
    const user = users.find(u => u.id === leaderId);
    return user ? user.fullname : 'Unknown leader';
  };

  // Get member names from IDs
  const getMemberNames = (memberIds) => {
    if (!memberIds || memberIds.length === 0) return [];
    return memberIds.map(id => {
      const user = users.find(u => u.id === id);
      return user ? user.fullname : 'Unknown member';
    });
  };

  // Render church item
  const renderChurchItem = ({ item }) => (
    <View style={styles.churchCard}>
      <View style={styles.churchCardContent}>
        <View style={styles.churchHeader}>
          <View style={styles.churchHeaderLeft}>
            <View style={styles.churchTitleContainer}>
              <Church size={16} color="#3B82F6" />
              <Text style={styles.churchTitle}>{item.church_name}</Text>
            </View>
            {item.description && (
              <Text style={styles.churchDescription}>{item.description}</Text>
            )}
          </View>
          <View style={styles.statusContainer}>
            {item.is_active ? (
              <View style={styles.activeStatus}>
                <CheckCircle size={14} color="#10B981" />
                <Text style={styles.activeText}>Active</Text>
              </View>
            ) : (
              <View style={styles.inactiveStatus}>
                <XCircle size={14} color="#EF4444" />
                <Text style={styles.inactiveText}>Inactive</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.churchDetails}>
          {/* Location Info */}
          {(item.region || item.district || item.ward || item.village) && (
            <View style={styles.locationCard}>
              <View style={styles.cardHeader}>
                <MapPin size={14} color="#3B82F6" />
                <Text style={styles.cardTitle}>Location</Text>
              </View>
              <View style={styles.cardContent}>
                {item.region && <Text style={styles.cardText}>Region: {item.region}</Text>}
                {item.district && <Text style={styles.cardText}>District: {item.district}</Text>}
                {item.ward && <Text style={styles.cardText}>Ward: {item.ward}</Text>}
                {item.village && <Text style={styles.cardText}>Village/Street: {item.village}</Text>}
              </View>
            </View>
          )}

          {/* Contact Info */}
          {(item.phone_number || item.email) && (
            <View style={styles.contactCard}>
              <View style={styles.cardHeader}>
                <Phone size={14} color="#6B7280" />
                <Text style={styles.contactCardTitle}>Contact</Text>
              </View>
              <View style={styles.cardContent}>
                {item.phone_number && (
                  <View style={styles.contactItem}>
                    <Phone size={12} color="#6B7280" />
                    <Text style={styles.cardText}>
                      <Text style={styles.boldText}>+255</Text> {item.phone_number.substring(3)}
                    </Text>
                  </View>
                )}
                {item.email && (
                  <View style={styles.contactItem}>
                    <Mail size={12} color="#6B7280" />
                    <Text style={styles.cardText}>{item.email}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Leader Info */}
          {item.leader && (
            <View style={styles.leaderCard}>
              <View style={styles.cardHeader}>
                <Users size={14} color="#10B981" />
                <Text style={styles.leaderCardTitle}>Leader</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.contactItem}>
                  <User size={12} color="#10B981" />
                  <Text style={styles.cardText}>{getLeaderName(item.leader)}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Members Info */}
          {item.members && item.members.length > 0 && (
            <View style={styles.membersCard}>
              <View style={styles.cardHeader}>
                <MembersIcon size={14} color="#8B5CF6" />
                <Text style={styles.membersCardTitle}>
                  Members ({item.total_members || item.members.length})
                </Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardText}>
                  {item.members.slice(0, 3).map((member, index) => (
                    <Text key={member.id}>
                      {getLeaderName(member.id)}{index < Math.min(2, item.members.length - 1) ? ', ' : ''}
                    </Text>
                  ))}
                  {item.members.length > 3 && (
                    <Text style={styles.grayText}> and {item.members.length - 3} more</Text>
                  )}
                </Text>
              </View>
            </View>
          )}

          {/* Established Date */}
          <View style={styles.dateRow}>
            <View style={styles.dateItem}>
              <Calendar size={14} color="#6B7280" />
              <Text style={styles.dateText}>
                Established: {item.established_date ? formatDate(item.established_date) : 'Not set'}
              </Text>
            </View>
            <Text style={styles.createdText}>
              {item.created_at && `Created: ${formatDate(item.created_at)}`}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => editChurch(item)}>
          <Edit2 size={16} color="white" />
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteChurch(item.id)}>
          <Trash2 size={16} color="white" />
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}>
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <View style={styles.headerTitleRow}>
              <Church size={24} color="white" />
              <Text style={styles.headerTitle}>Church Management</Text>
            </View>
            <Text style={styles.headerSubtitle}>Manage all church records</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons Container */}
      <View style={styles.actionContainer}>
        {/* Add Church Button */}
        <TouchableOpacity
          style={styles.addChurchButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}>
          <Plus size={20} color="white" />
          <Text style={styles.actionButtonText}>Add New Church</Text>
        </TouchableOpacity>

        {/* Add Donations Button */}
        <TouchableOpacity
          style={styles.addDonationButton}
          onPress={() => router.push('/dashboard/donation-type')}>
          <Heart size={20} color="white" />
          <Text style={styles.actionButtonText}>Add Donations</Text>
        </TouchableOpacity>
      </View>

      {/* Churches List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading churches...</Text>
        </View>
      ) : churches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCard}>
            <Church size={48} color="#A78BFA" />
            <Text style={styles.emptyTitle}>No churches found</Text>
            <Text style={styles.emptyText}>
              Tap "Add New Church" to create your first church record
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={churches}
          renderItem={renderChurchItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal for Add/Edit Church */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
          resetForm();
        }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {editing ? 'Edit Church' : 'Add New Church'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => {
                      setModalVisible(false);
                      resetForm();
                    }}>
                    <Text style={styles.closeText}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Church Name - REQUIRED */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    Church Name <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={church_name}
                    onChangeText={setChurchName}
                    placeholder="Enter church name (required)"
                  />
                </View>

                {/* Description */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Enter description"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                {/* Location Fields */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Location Information</Text>
                  <View style={styles.locationGrid}>
                    <View style={styles.locationRow}>
                      <View style={styles.halfInput}>
                        <Text style={styles.inputLabel}>Region</Text>
                        <TextInput
                          style={styles.input}
                          value={region}
                          onChangeText={setRegion}
                          placeholder="Region"
                        />
                      </View>
                      <View style={styles.halfInput}>
                        <Text style={styles.inputLabel}>District</Text>
                        <TextInput
                          style={styles.input}
                          value={district}
                          onChangeText={setDistrict}
                          placeholder="District"
                        />
                      </View>
                    </View>
                    
                    <View style={styles.locationRow}>
                      <View style={styles.halfInput}>
                        <Text style={styles.inputLabel}>Ward</Text>
                        <TextInput
                          style={styles.input}
                          value={ward}
                          onChangeText={setWard}
                          placeholder="Ward"
                        />
                      </View>
                      <View style={styles.halfInput}>
                        <Text style={styles.inputLabel}>Village/Street</Text>
                        <TextInput
                          style={styles.input}
                          value={village}
                          onChangeText={setVillage}
                          placeholder="Village/Street"
                        />
                      </View>
                    </View>
                  </View>
                </View>

                {/* Contact Information */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Contact Information</Text>
                  
                  {/* Phone Number */}
                  <View style={styles.phoneContainer}>
                    <Text style={styles.inputLabel}>Church Phone Number</Text>
                    <View style={styles.phoneInputContainer}>
                      <View style={styles.countryCode}>
                        <Text style={styles.countryCodeText}>+255</Text>
                      </View>
                      <TextInput
                        style={[
                          styles.phoneInput,
                          phone_number.length > 0 && phone_number.length !== 9 && styles.errorInput
                        ]}
                        value={phone_number}
                        onChangeText={handlePhoneInput}
                        placeholder="712345678"
                        keyboardType="phone-pad"
                        maxLength={9}
                      />
                    </View>
                    {phone_number.length > 0 && phone_number.length !== 9 && (
                      <Text style={styles.errorText}>
                        Must be exactly 9 digits (e.g., 712345678)
                      </Text>
                    )}
                  </View>

                  {/* Email */}
                  <View>
                    <Text style={styles.inputLabel}>Church Email</Text>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="church@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Leader Selection */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Leader</Text>
                  {usersLoading ? (
                    <View style={styles.loadingUsers}>
                      <ActivityIndicator size="small" color="#8B5CF6" />
                      <Text style={styles.loadingUsersText}>Loading users...</Text>
                    </View>
                  ) : (
                    <View style={styles.leaderScrollContainer}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.leaderScroll}>
                        <TouchableOpacity
                          style={[styles.leaderOption, !leader && styles.selectedLeader]}
                          onPress={() => setLeader('')}>
                          <Text style={[styles.leaderOptionText, !leader && styles.selectedLeaderText]}>
                            No Leader
                          </Text>
                        </TouchableOpacity>
                        
                        {users.map((user) => (
                          <TouchableOpacity
                            key={user.id}
                            style={[styles.leaderOption, leader === user.id && styles.selectedLeader]}
                            onPress={() => setLeader(user.id)}>
                            <Text style={[styles.leaderOptionText, leader === user.id && styles.selectedLeaderText]}>
                              {user.fullname}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  {leader && (
                    <Text style={styles.selectedText}>
                      Selected: {users.find(u => u.id === leader)?.fullname}
                    </Text>
                  )}
                </View>

                {/* Members Selection */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Members</Text>
                  {usersLoading ? (
                    <View style={styles.loadingUsers}>
                      <ActivityIndicator size="small" color="#8B5CF6" />
                      <Text style={styles.loadingUsersText}>Loading users...</Text>
                    </View>
                  ) : (
                    <View style={styles.membersContainer}>
                      <ScrollView 
                        showsVerticalScrollIndicator={true}
                        style={styles.membersScroll}
                        contentContainerStyle={styles.membersScrollContent}
                      >
                        {users.map((user) => (
                          <TouchableOpacity
                            key={user.id}
                            style={[styles.memberOption, members.includes(user.id) && styles.selectedMember]}
                            onPress={() => toggleMember(user.id)}>
                            <View style={[styles.checkbox, members.includes(user.id) && styles.checkedBox]}>
                              {members.includes(user.id) && (
                                <View style={styles.checkmark} />
                              )}
                            </View>
                            <Text style={[styles.memberText, members.includes(user.id) && styles.selectedMemberText]}>
                              {user.fullname}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  {members.length > 0 && (
                    <Text style={styles.selectedText}>
                      Selected {members.length} member{members.length !== 1 ? 's' : ''}
                    </Text>
                  )}
                </View>

                {/* Established Date */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Established Date</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(true)}>
                    <Text style={styles.dateText}>
                      {established_date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                    <Calendar size={20} color="#6B7280" />
                  </TouchableOpacity>
                  
                  {showDatePicker && (
                    <DateTimePicker
                      value={established_date}
                      mode="date"
                      display="default"
                      onChange={onDateChange}
                    />
                  )}
                </View>

                {/* Active Toggle */}
                <View style={styles.activeContainer}>
                  <View style={styles.activeToggle}>
                    <View>
                      <Text style={styles.activeLabel}>Active Status</Text>
                      <Text style={styles.activeSubtitle}>Is this church currently active?</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.toggleButton, is_active ? styles.activeButton : styles.inactiveButton]}
                      onPress={() => setIsActive(!is_active)}>
                      <Text style={styles.toggleText}>
                        {is_active ? 'Yes' : 'No'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setModalVisible(false);
                      resetForm();
                    }}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.submitButton, !church_name && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={!church_name}>
                    <Text style={styles.submitButtonText}>
                      {editing ? 'Update' : 'Create'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#8B5CF6',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  headerSubtitle: {
    color: '#e9d5ff',
    fontSize: 14,
    marginTop: 4,
  },
  actionContainer: {
    marginHorizontal: 20,
    marginVertical: 16,
    gap: 12,
  },
  addChurchButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addDonationButton: {
    backgroundColor: '#EC4899',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 16,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyCard: {
    backgroundColor: '#f5f3ff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#374151',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 24,
  },
  churchCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  churchCardContent: {
    marginBottom: 12,
  },
  churchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  churchHeaderLeft: {
    flex: 1,
  },
  churchTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  churchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 8,
  },
  churchDescription: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  activeStatus: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeText: {
    color: '#065f46',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  inactiveStatus: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inactiveText: {
    color: '#991b1b',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  churchDetails: {
    gap: 8,
  },
  locationCard: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
  },
  contactCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  leaderCard: {
    backgroundColor: '#d1fae5',
    padding: 12,
    borderRadius: 8,
  },
  membersCard: {
    backgroundColor: '#f5f3ff',
    padding: 12,
    borderRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    color: '#1d4ed8',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 8,
  },
  contactCardTitle: {
    color: '#4b5563',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 8,
  },
  leaderCardTitle: {
    color: '#065f46',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 8,
  },
  membersCardTitle: {
    color: '#7c3aed',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 8,
  },
  cardContent: {
    marginLeft: 22,
  },
  cardText: {
    color: '#6B7280',
    fontSize: 14,
  },
  boldText: {
    fontWeight: '500',
  },
  grayText: {
    color: '#9ca3af',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    color: '#6B7280',
    fontSize: 12,
    fontStyle: 'italic',
    marginLeft: 8,
  },
  createdText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#f59e0b',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 8,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalScroll: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    color: '#6B7280',
    fontSize: 18,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    color: '#374151',
    fontWeight: '500',
    fontSize: 16,
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputLabel: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 4,
  },
  locationGrid: {
    gap: 12,
  },
  locationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  phoneContainer: {
    marginBottom: 16,
  },
  phoneInputContainer: {
    flexDirection: 'row',
  },
  countryCode: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRightWidth: 0,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    justifyContent: 'center',
  },
  countryCodeText: {
    color: '#1f2937',
    fontWeight: '600',
    fontSize: 16,
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    fontSize: 16,
  },
  errorInput: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
  },
  loadingUsers: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  loadingUsersText: {
    color: '#6B7280',
    marginTop: 8,
  },
  leaderScrollContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  leaderScroll: {
    paddingVertical: 8,
  },
  leaderOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
  },
  selectedLeader: {
    backgroundColor: '#8B5CF6',
  },
  leaderOptionText: {
    color: '#374151',
  },
  selectedLeaderText: {
    color: 'white',
  },
  selectedText: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 8,
  },
  membersContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    maxHeight: 160,
    overflow: 'hidden',
  },
  membersScroll: {
    flex: 1,
  },
  membersScrollContent: {
    padding: 8,
  },
  memberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginBottom: 4,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  selectedMember: {
    backgroundColor: '#f5f3ff',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#9ca3af',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  checkmark: {
    width: 8,
    height: 8,
    backgroundColor: 'white',
    borderRadius: 2,
  },
  memberText: {
    color: '#374151',
  },
  selectedMemberText: {
    color: '#7c3aed',
    fontWeight: '500',
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeContainer: {
    marginBottom: 32,
  },
  activeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
  },
  activeLabel: {
    color: '#374151',
    fontWeight: '500',
    fontSize: 16,
  },
  activeSubtitle: {
    color: '#6B7280',
    fontSize: 14,
  },
  toggleButton: {
    width: 64,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeButton: {
    backgroundColor: '#10B981',
  },
  inactiveButton: {
    backgroundColor: '#ef4444',
  },
  toggleText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    paddingVertical: 16,
    borderRadius: 12,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#c4b5fd',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default ChurchesPage;