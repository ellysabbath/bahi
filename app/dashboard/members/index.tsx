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
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, UserPlus, Edit2, Trash2, Phone, Mail, MapPin, User, Calendar, CheckCircle, XCircle, X } from 'lucide-react-native';

const API_URL = 'https://mhazini.pythonanywhere.com/api/auth/users/';

const App = () => {
  const navigation = useNavigation();
  
  // States
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Form states
  const [mobile_number, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [membership_number, setMembershipNumber] = useState('');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [is_active, setIsActive] = useState(true);
  const [is_verified, setIsVerified] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  // Tanzanian country code
  const COUNTRY_CODE = '255';

  // Validate password (only if provided)
  const validatePassword = (pass) => {
    if (!pass) return true; // Optional, so empty is valid
    return pass.length >= 6;
  };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      setUsers(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Format phone number input - user only enters last 9 digits
  const handlePhoneInput = (text) => {
    let cleanText = text.replace(/\D/g, '');
    
    if (cleanText.length > 9) {
      cleanText = cleanText.substring(0, 9);
    }
    
    setMobileNumber(cleanText);
  };

  // Get full phone number with country code
  const getFullPhoneNumber = () => {
    if (!mobile_number) return '';
    return COUNTRY_CODE + mobile_number;
  };

  // Create user
  const createUser = async () => {
    const fullPhoneNumber = getFullPhoneNumber();
    
    // VALIDATION - Only fullname is required
    if (!fullname) {
      Alert.alert('Validation Error', 'Full name is required');
      return;
    }

    // Validate phone if provided
    if (mobile_number && mobile_number.length !== 9) {
      Alert.alert('Validation Error', 'Phone number must be exactly 9 digits (after 255)');
      return;
    }

    // Validate password if provided
    if (password && !validatePassword(password)) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters');
      return;
    }

    if (password && password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return;
    }

    try {
      const userData = {
        mobile_number: fullPhoneNumber || '',
        fullname,
        email: email || '',
        membership_number: membership_number || '',
        region: region || '',
        district: district || '',
        is_active,
        is_verified,
      };

      // Only add password if provided
      if (password) {
        userData.password = password;
      }

      await axios.post(API_URL, userData);
      Alert.alert('Success', 'User created successfully');
      resetForm();
      setModalVisible(false);
      fetchUsers();
    } catch (error) {
      handleApiError(error);
    }
  };

  // Update user
  const updateUser = async () => {
    if (!currentUserId) return;

    const fullPhoneNumber = getFullPhoneNumber();
    
    // Validation - Only fullname is required
    if (!fullname) {
      Alert.alert('Validation Error', 'Full name is required');
      return;
    }

    // Validate phone if provided
    if (mobile_number && mobile_number.length !== 9) {
      Alert.alert('Validation Error', 'Phone number must be exactly 9 digits (after 255)');
      return;
    }

    try {
      const userData = {
        mobile_number: fullPhoneNumber || '',
        fullname,
        email: email || '',
        membership_number: membership_number || '',
        region: region || '',
        district: district || '',
        is_active,
        is_verified,
      };

      // Only add password if provided
      if (password) {
        if (!validatePassword(password)) {
          Alert.alert('Validation Error', 'Password must be at least 6 characters');
          return;
        }
        if (password !== confirmPassword) {
          Alert.alert('Validation Error', 'Passwords do not match');
          return;
        }
        userData.password = password;
      }

      await axios.put(`${API_URL}${currentUserId}/`, userData);
      Alert.alert('Success', 'User updated successfully');
      resetForm();
      setModalVisible(false);
      fetchUsers();
    } catch (error) {
      handleApiError(error);
    }
  };

  // Handle API errors
  const handleApiError = (error) => {
    if (error.response?.data) {
      const errors = error.response.data;
      let errorMessage = '';
      
      for (const key in errors) {
        if (Array.isArray(errors[key])) {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        } else {
          errorMessage += `${key}: ${errors[key]}\n`;
        }
      }
      
      Alert.alert('API Error', errorMessage);
    } else {
      Alert.alert('Error', 'Failed to save user');
    }
    console.error(error.response?.data || error);
  };

  // Delete user
  const deleteUser = async (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}${id}/`);
              Alert.alert('Success', 'User deleted successfully');
              fetchUsers();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  // Edit user
  const editUser = (user) => {
    setCurrentUserId(user.id);
    
    // Extract last 9 digits from mobile number if exists
    if (user.mobile_number) {
      const phone = user.mobile_number;
      const lastNineDigits = phone.startsWith('255') ? phone.substring(3) : phone;
      setMobileNumber(lastNineDigits);
    } else {
      setMobileNumber('');
    }
    
    setFullname(user.fullname);
    setEmail(user.email || '');
    setMembershipNumber(user.membership_number || '');
    setRegion(user.region || '');
    setDistrict(user.district || '');
    setIsActive(user.is_active);
    setIsVerified(user.is_verified);
    setPassword('');
    setConfirmPassword('');
    setEditing(true);
    setModalVisible(true);
  };

  // Reset form
  const resetForm = () => {
    setMobileNumber('');
    setPassword('');
    setConfirmPassword('');
    setFullname('');
    setEmail('');
    setMembershipNumber('');
    setRegion('');
    setDistrict('');
    setIsActive(true);
    setIsVerified(false);
    setCurrentUserId(null);
    setEditing(false);
  };

  // Handle submit
  const handleSubmit = () => {
    if (editing) {
      updateUser();
    } else {
      createUser();
    }
  };

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Render user item
  const renderUserItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userCardHeader}>
        <Text style={styles.userName}>{item.fullname}</Text>
        <View style={styles.statusContainer}>
          {item.is_active ? (
            <View style={[styles.statusBadge, styles.activeBadge]}>
              <CheckCircle size={14} color="#10B981" />
              <Text style={styles.activeText}>Active</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, styles.inactiveBadge]}>
              <XCircle size={14} color="#EF4444" />
              <Text style={styles.inactiveText}>Inactive</Text>
            </View>
          )}
          {item.is_verified && (
            <View style={[styles.statusBadge, styles.verifiedBadge]}>
              <CheckCircle size={14} color="#3B82F6" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.userDetails}>
        {item.mobile_number && (
          <View style={styles.detailRow}>
            <Phone size={14} color="#6B7280" />
            <Text style={styles.detailText}>
              <Text style={styles.boldText}>+255</Text> {item.mobile_number.substring(3)}
            </Text>
          </View>
        )}
        
        {item.email && (
          <View style={styles.detailRow}>
            <Mail size={14} color="#6B7280" />
            <Text style={styles.detailText}>{item.email}</Text>
          </View>
        )}
        
        {item.membership_number && (
          <View style={styles.detailRow}>
            <User size={14} color="#6B7280" />
            <Text style={styles.detailText}>ID: {item.membership_number}</Text>
          </View>
        )}
        
        {(item.region || item.district) && (
          <View style={styles.detailRow}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.detailText}>
              {item.region}{item.district ? `, ${item.district}` : ''}
            </Text>
          </View>
        )}
        
        <View style={styles.detailRow}>
          <Calendar size={14} color="#6B7280" />
          <Text style={styles.dateText}>
            Joined: {new Date(item.date_joined).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => editUser(item)}>
          <Edit2 size={16} color="white" />
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteUser(item.id)}>
          <Trash2 size={16} color="white" />
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#2563EB" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>User Management</Text>
            <Text style={styles.headerSubtitle}>Only Full Name is required</Text>
          </View>
        </View>
      </View>

      {/* Add User Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          resetForm();
          setModalVisible(true);
        }}>
        <UserPlus size={20} color="white" />
        <Text style={styles.addButtonText}>Add New User</Text>
      </TouchableOpacity>

      {/* Users List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCard}>
            <User size={48} color="#93C5FD" />
            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptySubtitle}>
              Tap "Add New User" to create your first user
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal for Add/Edit User */}
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
              
              {/* Fixed Header with Action Buttons */}
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <Text style={styles.modalTitle}>
                    {editing ? 'Edit User' : 'Add New User'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => {
                      setModalVisible(false);
                      resetForm();
                    }}>
                    <X size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                
                {/* Action Buttons Row at TOP */}
                <View style={styles.topActionButtons}>
                  {/* Cancel Button */}
                  <TouchableOpacity
                    style={[styles.actionButtonTop, styles.cancelButtonTop]}
                    onPress={() => {
                      setModalVisible(false);
                      resetForm();
                    }}>
                    <Text style={styles.cancelButtonTopText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[
                      styles.actionButtonTop,
                      styles.submitButtonTop,
                      !fullname ? styles.submitButtonTopDisabled : {}
                    ]}
                    onPress={handleSubmit}
                    disabled={!fullname}>
                    <Text style={styles.submitButtonTopText}>
                      {editing ? 'Update' : 'Create'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.requiredNote}>
                  <Text style={styles.requiredNoteText}>
                    * Full name is required. All other fields are optional.
                  </Text>
                </View>
              </View>

              {/* Scrollable Form Fields */}
              <ScrollView 
                style={styles.formScrollView}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.formContainer}>
                
                {/* Full Name - REQUIRED */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Full Name <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={fullname}
                    onChangeText={setFullname}
                    placeholder="Enter full name (required)"
                  />
                </View>

                {/* Phone Number - OPTIONAL */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Mobile Number</Text>
                  <View style={styles.phoneInputContainer}>
                    <View style={styles.countryCode}>
                      <Text style={styles.countryCodeText}>+255</Text>
                    </View>
                    <TextInput
                      style={[
                        styles.textInput,
                        styles.phoneInput,
                        mobile_number.length > 0 && mobile_number.length !== 9 ? styles.inputError : {}
                      ]}
                      value={mobile_number}
                      onChangeText={handlePhoneInput}
                      placeholder="712345678 (optional)"
                      keyboardType="phone-pad"
                      maxLength={9}
                    />
                  </View>
                  {mobile_number.length > 0 && mobile_number.length !== 9 && (
                    <Text style={styles.errorText}>
                      Must be exactly 9 digits (e.g., 712345678)
                    </Text>
                  )}
                  <Text style={styles.hintText}>
                    Enter 9 digits after +255 (optional)
                  </Text>
                </View>

                {/* Email - OPTIONAL */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter email (optional)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Membership Number - OPTIONAL */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Membership Number</Text>
                  <TextInput
                    style={styles.textInput}
                    value={membership_number}
                    onChangeText={setMembershipNumber}
                    placeholder="Enter membership number (optional)"
                  />
                </View>

                {/* Password Fields - OPTIONAL */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Password {editing ? '(Optional)' : ''}
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      password && !validatePassword(password) ? styles.inputError : {}
                    ]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={editing ? "Leave blank to keep current" : "Minimum 6 characters (optional)"}
                    secureTextEntry
                  />
                  {password && !validatePassword(password) && (
                    <Text style={styles.errorText}>Password must be at least 6 characters</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Confirm Password {editing ? '(Optional)' : ''}
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      confirmPassword && password !== confirmPassword ? styles.inputError : {}
                    ]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm password (optional)"
                    secureTextEntry
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <Text style={styles.errorText}>Passwords do not match</Text>
                  )}
                </View>

                {/* Region and District */}
                <View style={styles.rowInputGroup}>
                  <View style={styles.halfInput}>
                    <Text style={styles.inputLabel}>Region</Text>
                    <TextInput
                      style={styles.textInput}
                      value={region}
                      onChangeText={setRegion}
                      placeholder="Region"
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <Text style={styles.inputLabel}>District</Text>
                    <TextInput
                      style={styles.textInput}
                      value={district}
                      onChangeText={setDistrict}
                      placeholder="District"
                    />
                  </View>
                </View>

                {/* Toggle Switches */}
                <View style={styles.toggleGroup}>
                  <Text style={styles.toggleTitle}>Account Status</Text>
                  <View style={styles.toggleContainer}>
                    <View style={styles.toggleItem}>
                      <Text style={styles.toggleLabel}>Active User</Text>
                      <TouchableOpacity
                        style={[
                          styles.toggleButton,
                          is_active ? styles.toggleButtonActive : styles.toggleButtonInactive
                        ]}
                        onPress={() => setIsActive(!is_active)}>
                        <Text style={styles.toggleButtonText}>
                          {is_active ? 'Yes' : 'No'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.toggleItem}>
                      <Text style={styles.toggleLabel}>Verified</Text>
                      <TouchableOpacity
                        style={[
                          styles.toggleButton,
                          is_verified ? styles.toggleButtonVerified : styles.toggleButtonInactive
                        ]}
                        onPress={() => setIsVerified(!is_verified)}>
                        <Text style={styles.toggleButtonText}>
                          {is_verified ? 'Yes' : 'No'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Additional Cancel Button at Bottom */}
                <View style={styles.bottomButtons}>
                  <TouchableOpacity
                    style={styles.cancelButtonBottom}
                    onPress={() => {
                      setModalVisible(false);
                      resetForm();
                    }}>
                    <Text style={styles.cancelButtonBottomText}>Cancel</Text>
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

// Styles
const styles = {
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#2563EB',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#BFDBFE',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#10B981',
    marginHorizontal: 20,
    marginVertical: 16,
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
  addButtonText: {
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
    backgroundColor: '#EFF6FF',
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
  emptySubtitle: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  listContainer: {
    paddingBottom: 24,
  },
  userCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  userCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
  },
  activeText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
  },
  inactiveText: {
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  verifiedBadge: {
    backgroundColor: '#DBEAFE',
  },
  verifiedText: {
    color: '#1E40AF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  userDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    color: '#6B7280',
    fontSize: 14,
    marginLeft: 8,
  },
  boldText: {
    fontWeight: '500',
  },
  dateText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontStyle: 'italic',
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  editButton: {
    backgroundColor: '#F59E0B',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 4,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    padding: 24,
    paddingBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  // Top Action Buttons
  topActionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButtonTop: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonTop: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonTopText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonTop: {
    backgroundColor: '#2563EB',
  },
  submitButtonTopDisabled: {
    backgroundColor: '#93C5FD',
  },
  submitButtonTopText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  requiredNote: {
    marginTop: 8,
  },
  requiredNoteText: {
    color: '#6B7280',
    fontSize: 12,
    fontStyle: 'italic',
  },
  formScrollView: {
    maxHeight: '100%',
  },
  formContainer: {
    padding: 24,
    paddingTop: 0,
  },
  inputGroup: {
    marginBottom: 20,
  },
  rowInputGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  halfInput: {
    flex: 1,
  },
  inputLabel: {
    color: '#374151',
    fontWeight: '500',
    marginBottom: 8,
    fontSize: 14,
  },
  requiredStar: {
    color: '#EF4444',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    fontSize: 16,
  },
  phoneInputContainer: {
    flexDirection: 'row',
  },
  countryCode: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRightWidth: 0,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    justifyContent: 'center',
  },
  countryCodeText: {
    color: '#1F2937',
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  hintText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  toggleGroup: {
    marginBottom: 24,
  },
  toggleTitle: {
    color: '#374151',
    fontWeight: '500',
    marginBottom: 16,
    fontSize: 14,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toggleItem: {
    alignItems: 'center',
  },
  toggleLabel: {
    color: '#6B7280',
    marginBottom: 8,
    fontSize: 14,
  },
  toggleButton: {
    width: 80,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#10B981',
  },
  toggleButtonVerified: {
    backgroundColor: '#3B82F6',
  },
  toggleButtonInactive: {
    backgroundColor: '#9CA3AF',
  },
  toggleButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  bottomButtons: {
    marginBottom: 8,
    marginTop: 8,
  },
  cancelButtonBottom: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonBottomText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
};

export default App;