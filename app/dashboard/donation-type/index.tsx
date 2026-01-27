// app/dashboard/donations/index.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const { width, height } = Dimensions.get('window');

// ============ API CONFIGURATION ============
const API_BASE_URL = 'https://mhazini.pythonanywhere.com/api/auth';

// ============ INTERFACES ============
interface User {
  id: number;
  fullname: string;
  email: string;
  mobile_number?: string;
  membership_number?: string;
}

interface Church {
  id: number;
  church_name: string;
  description?: string;
  region?: string;
  district?: string;
  ward?: string;
  village?: string;
  phone_number?: string;
  email?: string;
  leader?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  established_date?: string;
  total_members?: number;
  active_members?: number;
}

interface Watoaji {
  id: number;
  doner: number;
  amount: string;
  church: string;
  jumla_ya_fedha_kwa_maneno: string;
  date: string;
  created_at?: string;
  zaka?: any;
  sadaka?: any;
  zaka_na_sadaka?: any;
  nyingine?: any;
}

interface WatoajiDisplay extends Watoaji {
  doner_details?: User;
  doner_name?: string;
  donation_type?: string;
  sub_donation?: any;
}

interface Report {
  id: number;
  stakabaadhi_no: string;
  formatted_stakabaadhi_no: string;
  receipt_number: string;
  donation: number;
  donation_details?: {
    id: number;
    amount: string;
    church: string;
    date: string;
    doner_name: string;
    doner_membership: string;
    doner_details?: User;
  };
  kanisa: string;
  jumla_ya_fedha_kwa_maneno: string;
  tarehe: string;
  sahihi: number;
  sahihi_details?: User;
  zaka: string;
  zaka_display: string;
  sadaka_pamoja_ctf: string;
  sadaka_pamoja_ctf_display: string;
  sadaka_pamoja_kanisa: string;
  sadaka_pamoja_kanisa_display: string;
  sadaka_name: string;
  jumla_ya_fedha_ctf: string;
  jumla_ya_fedha_ctf_display: string;
  jumla_ya_fedha_kanisa_mahalia: string;
  jumla_ya_fedha_kanisa_mahalia_display: string;
  jumla_ya_fedha_zote: string;
  jumla_ya_fedha_zote_display: string;
  maelezo: string;
  pdf_document: string;
  pdf_download_url: string;
  pdf_print_url: string;
  created_at: string;
  updated_at: string;
}

// ============ DONATION TYPE OPTIONS ============
const DONATION_TYPE_OPTIONS = [
  { 
    id: 'zaka', 
    name: 'Zaka', 
    description: 'Full amount as Zaka',
    icon: 'home',
    color: '#10B981',
  },
  { 
    id: 'sadaka', 
    name: 'Sadaka', 
    description: '58% CTF, 42% Church',
    icon: 'gift',
    color: '#3B82F6',
  },
  { 
    id: 'zaka_na_sadaka', 
    name: 'Zaka & Sadaka', 
    description: '50% Zaka, 50% Sadaka (58% CTF, 42% Church)',
    icon: 'heart',
    color: '#8B5CF6',
  },
  { 
    id: 'nyingine', 
    name: 'Other', 
    description: 'Custom contributions',
    icon: 'ellipsis-h',
    color: '#F59E0B',
  },
];

// ============ HELPER FUNCTIONS ============
// Function to convert amount to Swahili words
const convertAmountToSwahiliWords = (amount: number): string => {
  if (amount === 0) return 'sifuri shilingi';
  
  const units = ['', 'moja', 'mbili', 'tatu', 'nne', 'tano', 'sita', 'saba', 'nane', 'tisa'];
  const teens = ['kumi', 'kumi na moja', 'kumi na mbili', 'kumi na tatu', 'kumi na nne', 'kumi na tano', 'kumi na sita', 'kumi na saba', 'kumi na nane', 'kumi na tisa'];
  const tens = ['', 'kumi', 'ishirini', 'thelathini', 'arobaini', 'hamsini', 'sitini', 'sabini', 'themanini', 'tisini'];
  const hundreds = ['', 'mia moja', 'mia mbili', 'mia tatu', 'mia nne', 'mia tano', 'mia sita', 'mia saba', 'mia nane', 'mia tisa'];
  
  const thousands = Math.floor(amount / 1000);
  const remainder = amount % 1000;
  
  let result = '';
  
  // Handle thousands
  if (thousands > 0) {
    if (thousands === 1) {
      result += 'elfu moja ';
    } else if (thousands < 10) {
      result += `${units[thousands]} elfu `;
    } else if (thousands < 20) {
      result += `${teens[thousands - 10]} elfu `;
    } else if (thousands < 100) {
      const tenThousands = Math.floor(thousands / 10);
      const unitThousands = thousands % 10;
      result += tens[tenThousands];
      if (unitThousands > 0) result += ` na ${units[unitThousands]}`;
      result += ' elfu ';
    }
  }
  
  // Handle hundreds
  const hundredsPart = Math.floor(remainder / 100);
  if (hundredsPart > 0) {
    result += hundreds[hundredsPart];
    if (remainder % 100 > 0) result += ' na ';
  }
  
  // Handle tens and units
  const tensPart = Math.floor((remainder % 100) / 10);
  const unitsPart = remainder % 10;
  
  if (tensPart > 0) {
    if (tensPart === 1) {
      // Handle teens
      result += teens[unitsPart];
    } else {
      result += tens[tensPart];
      if (unitsPart > 0) {
        result += ` na ${units[unitsPart]}`;
      }
    }
  } else if (unitsPart > 0) {
    result += units[unitsPart];
  }
  
  return result + ' shilingi';
};

// ============ MAIN COMPONENT ============
export default function DonationsPage() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // ============ STATE VARIABLES ============
  const [watoaji, setWatoaji] = useState<WatoajiDisplay[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingDonation, setEditingDonation] = useState<WatoajiDisplay | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showReceiptActions, setShowReceiptActions] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    doner: null as number | null,
    amount: '',
    church: '',
    donation_type: 'zaka_na_sadaka',
    sadaka_name: '',
    description: '',
    percent: '100',
    ctf_percent: '58',
    kanisa_mahalia_percent: '42',
    contribution_type: 'sadaka',
    custom_contribution_type: '',
  });

  // Modal states
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [showChurchPicker, setShowChurchPicker] = useState(false);
  const [showDonationTypePicker, setShowDonationTypePicker] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);

  // Stats
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalDonations, setTotalDonations] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // ============ AUTH HEADERS ============
  const getAuthHeaders = async () => {
    try {
      const token = await AsyncStorage.getItem('quickfix_access_token');
      if (!token) {
        Alert.alert('Session Expired', 'Please login again');
        router.replace('/login');
        return {};
      }
      
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
    } catch (error) {
      console.error('Error getting auth headers:', error);
      return {};
    }
  };

  // ============ LOAD CURRENT USER ============
  const loadCurrentUser = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/users/me/`, { headers });
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Error loading current user:', error);
      return null;
    }
  };

  // ============ LOAD DATA ============
  const loadData = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      
      if (!headers.Authorization) {
        throw new Error('Authentication required');
      }

      // Load current user first
      await loadCurrentUser();

      // Fetch Watoaji (donations) with related data
      const watoajiResponse = await fetch(`${API_BASE_URL}/watoaji/`, {
        headers,
        method: 'GET',
      });

      if (watoajiResponse.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
        router.replace('/login');
        return;
      }

      if (!watoajiResponse.ok) {
        throw new Error(`Failed to fetch donations: ${watoajiResponse.status}`);
      }

      const watoajiResult = await watoajiResponse.json();
      const watoajiData = Array.isArray(watoajiResult) ? watoajiResult : watoajiResult.results || watoajiResult.data || [];

      if (!Array.isArray(watoajiData)) {
        throw new Error('Invalid data format received');
      }

      // Fetch Users
      const usersResponse = await fetch(`${API_BASE_URL}/users/`, { headers });
      let usersData: User[] = [];
      if (usersResponse.ok) {
        const usersResult = await usersResponse.json();
        usersData = Array.isArray(usersResult) ? usersResult : usersResult.results || usersResult.data || [];
      }

      // Fetch Churches
      const churchesResponse = await fetch(`${API_BASE_URL}/churches/`, { headers });
      let churchesData: Church[] = [];
      if (churchesResponse.ok) {
        const churchesResult = await churchesResponse.json();
        churchesData = Array.isArray(churchesResult) ? churchesResult : churchesResult.results || churchesResult.data || [];
      } else {
        console.warn('Failed to fetch churches, using empty list');
      }

      // Fetch Reports
      const reportsResponse = await fetch(`${API_BASE_URL}/reports/`, { headers });
      let reportsData: Report[] = [];
      if (reportsResponse.ok) {
        const reportsResult = await reportsResponse.json();
        reportsData = Array.isArray(reportsResult) ? reportsResult : reportsResult.results || reportsResult.data || [];
      }

      // Process donations with user details and determine donation type
      const processedDonations: WatoajiDisplay[] = watoajiData.map((donation: any) => {
        const user = usersData.find(u => u.id === donation.doner);
        let donationType = 'other';
        let subDonation = null;

        // Determine donation type based on related records
        if (donation.zaka) {
          donationType = 'zaka';
          subDonation = donation.zaka;
        } else if (donation.sadaka) {
          donationType = 'sadaka';
          subDonation = donation.sadaka;
        } else if (donation.zaka_na_sadaka) {
          donationType = 'zaka_na_sadaka';
          subDonation = donation.zaka_na_sadaka;
        } else if (donation.nyingine) {
          donationType = 'nyingine';
          subDonation = donation.nyingine;
        }

        return {
          ...donation,
          doner_details: user,
          doner_name: user?.fullname || `Donor ${donation.doner}`,
          donation_type: donationType,
          sub_donation: subDonation,
        };
      });

      // Calculate statistics
      const total = processedDonations.reduce((sum, d) => sum + parseFloat(d.amount || '0'), 0);

      setWatoaji(processedDonations);
      setUsers(usersData);
      setChurches(churchesData);
      setReports(reportsData);
      setTotalAmount(total);
      setTotalDonations(processedDonations.length);

    } catch (error: any) {
      console.error('Error loading data:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to load data. Please try again.'
      );
      setWatoaji([]);
      setUsers([]);
      setChurches([]);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  // ============ REFRESH FUNCTION ============
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  // ============ FIXED AUTO-GENERATE RECEIPT ============
  const autoGenerateReceipt = async (donationId: number, description: string = 'barikiwa sana') => {
    try {
      const headers = await getAuthHeaders();
      
      if (!currentUser) {
        await loadCurrentUser();
      }
      
      // Use current user ID or default to 1
      const sahihiId = currentUser?.id || 1;
      
      console.log('Generating receipt for donation:', donationId);
      console.log('Using sahihi ID:', sahihiId);
      
      const response = await fetch(`${API_BASE_URL}/reports/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          donation: donationId, // CORRECT FIELD NAME
          maelezo: description,
          sahihi: sahihiId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Receipt generation error response:', errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          console.error('Receipt generation error JSON:', errorJson);
          
          // Check if report already exists
          if (response.status === 400 && 
              (errorJson.error?.includes('already exists') || 
               errorJson.donation?.includes('already exists'))) {
            
            // Try to get existing report by donation ID
            const existingReportResponse = await fetch(
              `${API_BASE_URL}/reports/by-donation/${donationId}/`, 
              { headers }
            );
            
            if (existingReportResponse.ok) {
              const existingReport = await existingReportResponse.json();
              console.log('Found existing report:', existingReport);
              return existingReport;
            }
          }
          
          throw new Error(errorJson.error || errorJson.detail || 'Failed to generate receipt');
        } catch (parseError) {
          throw new Error(`Failed to generate receipt: ${response.status} ${response.statusText}`);
        }
      }

      const newReport = await response.json();
      console.log('Successfully generated receipt:', newReport);
      
      // Add to local state
      setReports(prev => [newReport, ...prev]);
      
      return newReport;
    } catch (error: any) {
      console.error('Error in autoGenerateReceipt:', error);
      // Return null instead of throwing to prevent breaking the donation creation flow
      return null;
    }
  };

  // ============ CREATE DONATION WITH AUTO-RECEIPT ============
  const handleSubmitDonation = async () => {
    // Validation
    if (!selectedUser) {
      Alert.alert('Error', 'Please select a donor');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!formData.church.trim()) {
      Alert.alert('Error', 'Please select a church');
      return;
    }

    // Additional validation for nyingine
    if (formData.donation_type === 'nyingine' && !formData.sadaka_name.trim()) {
      Alert.alert('Error', 'Please enter sadaka/mchango name for other contributions');
      return;
    }

    if (formData.donation_type === 'nyingine' && formData.contribution_type === 'nyingine' && !formData.custom_contribution_type.trim()) {
      Alert.alert('Error', 'Please specify the type of contribution');
      return;
    }

    setProcessing(true);

    try {
      const headers = await getAuthHeaders();
      const donationType = formData.donation_type;
      
      // Convert amount to Swahili words
      const amountInWords = convertAmountToSwahiliWords(parseFloat(formData.amount));
      
      // Create Watoaji (main donation record)
      const watoajiPayload = {
        doner: selectedUser.id,
        amount: formData.amount,
        church: formData.church.trim(),
        jumla_ya_fedha_kwa_maneno: amountInWords,
        date: new Date().toISOString().split('T')[0], // Add current date
      };

      let watoajiResponse;
      let watoajiData;

      if (formMode === 'create') {
        console.log('Creating watoaji:', watoajiPayload);
        watoajiResponse = await fetch(`${API_BASE_URL}/watoaji/`, {
          method: 'POST',
          headers,
          body: JSON.stringify(watoajiPayload),
        });

        if (!watoajiResponse.ok) {
          const error = await watoajiResponse.json();
          console.error('Watoaji creation error:', error);
          throw new Error(error?.detail || error?.message || 'Failed to create donation');
        }

        watoajiData = await watoajiResponse.json();
        console.log('Watoaji created successfully:', watoajiData);
        
        // Create sub-donation record based on type
        await handleCreateSubDonation(watoajiData.id, donationType, headers);
        
        // Auto-generate receipt
        console.log('Generating receipt for donation ID:', watoajiData.id);
        const receipt = await autoGenerateReceipt(watoajiData.id, formData.description || 'barikiwa sana');
        
        if (receipt) {
          Alert.alert(
            'Success', 
            `Donation created successfully!\n\nReceipt Details:\nReceipt No: ${receipt.receipt_number}\nStakabaadhi No: ${receipt.formatted_stakabaadhi_no}`
          );
        } else {
          Alert.alert(
            'Success with Note', 
            'Donation created successfully!\n\nNote: Receipt was not auto-generated. You can generate it manually from the donation list.'
          );
        }
      } else if (editingDonation) {
        watoajiResponse = await fetch(`${API_BASE_URL}/watoaji/${editingDonation.id}/`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(watoajiPayload),
        });

        if (!watoajiResponse.ok) {
          const error = await watoajiResponse.json();
          throw new Error(error?.detail || error?.message || 'Failed to update donation');
        }

        Alert.alert('Success', 'Donation updated successfully');
      }

      setShowForm(false);
      await loadData();

    } catch (error: any) {
      console.error('Error in handleSubmitDonation:', error);
      Alert.alert('Error', error.message || 'Failed to save donation');
    } finally {
      setProcessing(false);
    }
  };

  // ============ CREATE SUB-DONATION ============
  const handleCreateSubDonation = async (watoajiId: number, donationType: string, headers: any) => {
    let url = '';
    let payload: any = { donation: watoajiId };

    switch (donationType) {
      case 'zaka':
        url = `${API_BASE_URL}/zaka/`;
        payload = {
          ...payload,
          amount: formData.amount,
          jumla_kwa_maneno: convertAmountToSwahiliWords(parseFloat(formData.amount)),
        };
        break;
      case 'sadaka':
        url = `${API_BASE_URL}/sadaka/`;
        const amount = parseFloat(formData.amount);
        const ctfSadaka = (amount * 0.58).toFixed(2);
        const kanisaSadaka = (amount * 0.42).toFixed(2);
        payload = {
          ...payload,
          amount: amount.toFixed(2),
          ctf_sadaka: ctfSadaka,
          kanisa_mahalia_sadaka: kanisaSadaka,
        };
        break;
      case 'zaka_na_sadaka':
        url = `${API_BASE_URL}/zaka-na-sadaka/`;
        const totalAmount = parseFloat(formData.amount);
        const zakaAmount = (totalAmount * 0.5).toFixed(2);
        const remain = (totalAmount * 0.5).toFixed(2);
        const ctfPortion = (parseFloat(remain) * 0.58).toFixed(2);
        const kanisaPortion = (parseFloat(remain) * 0.42).toFixed(2);
        payload = {
          ...payload,
          amount: totalAmount.toFixed(2),
          zaka_amount: zakaAmount,
          remain: remain,
          ctf_sadaka: ctfPortion,
          kanisa_mahalia_sadaka: kanisaPortion,
        };
        break;
      case 'nyingine':
        url = `${API_BASE_URL}/nyingine/`;
        const nyingineAmount = parseFloat(formData.amount);
        const percent = parseFloat(formData.percent || '100');
        const ctfPercent = parseFloat(formData.ctf_percent || '58');
        const kanisaPercent = parseFloat(formData.kanisa_mahalia_percent || '42');
        const ctfAmount = (nyingineAmount * (ctfPercent / 100)).toFixed(2);
        const kanisaAmount = (nyingineAmount * (kanisaPercent / 100)).toFixed(2);
        
        payload = {
          ...payload,
          amount: nyingineAmount.toFixed(2),
          sadaka_name: formData.sadaka_name,
          description: formData.description,
          percent: percent,
          ctf_percent: ctfPercent,
          kanisa_mahalia_percent: kanisaPercent,
          ctf_amount: ctfAmount,
          kanisa_mahalia_amount: kanisaAmount,
          contribution_type: formData.contribution_type,
          custom_contribution_type: formData.custom_contribution_type,
        };
        break;
    }

    if (url) {
      console.log(`Creating ${donationType}:`, payload);
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        console.warn(`Warning: Failed to create ${donationType}:`, error);
      } else {
        console.log(`${donationType} created successfully`);
      }
    }
  };

  // ============ CRUD OPERATIONS ============
  const handleCreateDonation = () => {
    setFormMode('create');
    setEditingDonation(null);
    setSelectedUser(null);
    setSelectedChurch(null);
    setFormData({
      doner: null,
      amount: '',
      church: '',
      donation_type: 'zaka_na_sadaka',
      sadaka_name: '',
      description: '',
      percent: '100',
      ctf_percent: '58',
      kanisa_mahalia_percent: '42',
      contribution_type: 'sadaka',
      custom_contribution_type: '',
    });
    setShowForm(true);
  };

  const handleEditDonation = (donation: WatoajiDisplay) => {
    setFormMode('edit');
    setEditingDonation(donation);
    setSelectedUser(donation.doner_details || null);
    
    // Find the church from churches list
    const church = churches.find(c => c.church_name === donation.church) || null;
    setSelectedChurch(church);
    
    // Set form data based on donation type
    const type = donation.donation_type || 'zaka_na_sadaka';
    const subData = donation.sub_donation || {};
    
    setFormData({
      doner: donation.doner,
      amount: donation.amount,
      church: donation.church,
      donation_type: type,
      sadaka_name: subData.sadaka_name || '',
      description: subData.description || '',
      percent: subData.percent ? subData.percent.toString() : '100',
      ctf_percent: subData.ctf_percent ? subData.ctf_percent.toString() : '58',
      kanisa_mahalia_percent: subData.kanisa_mahalia_percent ? subData.kanisa_mahalia_percent.toString() : '42',
      contribution_type: subData.contribution_type || 'sadaka',
      custom_contribution_type: subData.custom_contribution_type || '',
    });
    setShowForm(true);
  };

  const handleDeleteDonation = async (donation: WatoajiDisplay) => {
    Alert.alert(
      'Confirm Delete',
      `Delete donation from ${donation.doner_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const headers = await getAuthHeaders();
              const response = await fetch(`${API_BASE_URL}/watoaji/${donation.id}/`, {
                method: 'DELETE',
                headers,
              });

              if (response.ok) {
                Alert.alert('Success', 'Donation deleted');
                await loadData();
              } else {
                throw new Error('Delete failed');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Delete failed');
            }
          },
        },
      ]
    );
  };

  // ============ RECEIPT FUNCTIONS ============
  const handleViewReceipt = (donation: WatoajiDisplay) => {
    const report = reports.find(r => r.donation === donation.id);
    if (report) {
      Alert.alert(
        'Receipt Available',
        `Receipt Number: ${report.receipt_number}\nStakabaadhi No: ${report.formatted_stakabaadhi_no}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Download Receipt', 
            onPress: () => downloadReceipt(report)
          },
          { 
            text: 'View Details', 
            onPress: () => router.push(`/dashboard/reports/${report.stakabaadhi_no}`)
          }
        ]
      );
    } else {
      Alert.alert(
        'No Receipt Found',
        'Would you like to generate a receipt for this donation?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Generate Receipt', 
            onPress: () => generateReceiptForDonation(donation.id)
          }
        ]
      );
    }
  };

  const generateReceiptForDonation = async (donationId: number) => {
    try {
      setProcessing(true);
      
      // Check if report already exists
      const headers = await getAuthHeaders();
      try {
        const existingReportResponse = await fetch(
          `${API_BASE_URL}/reports/by-donation/${donationId}/`, 
          { headers }
        );
        
        if (existingReportResponse.ok) {
          const existingReport = await existingReportResponse.json();
          Alert.alert('Receipt Exists', `Receipt already exists:\n\nReceipt No: ${existingReport.receipt_number}\nStakabaadhi No: ${existingReport.formatted_stakabaadhi_no}`);
          await loadData();
          return existingReport;
        }
      } catch (checkError) {
        // If check fails, proceed to generate
      }
      
      const receipt = await autoGenerateReceipt(donationId);
      if (receipt) {
        Alert.alert('Success', `Receipt generated successfully!\n\nReceipt No: ${receipt.receipt_number}\nStakabaadhi No: ${receipt.formatted_stakabaadhi_no}`);
        await loadData();
      } else {
        Alert.alert('Error', 'Failed to generate receipt. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate receipt');
    } finally {
      setProcessing(false);
    }
  };

  const downloadReceipt = async (report: Report) => {
    try {
      setProcessing(true);
      
      let downloadUrl = '';
      
      if (report.pdf_document) {
        downloadUrl = report.pdf_document;
      } else if (report.pdf_download_url) {
        downloadUrl = report.pdf_download_url.startsWith('http') 
          ? report.pdf_download_url 
          : `${API_BASE_URL}${report.pdf_download_url}`;
      } else {
        // Try to generate PDF first
        const headers = await getAuthHeaders();
        const generateResponse = await fetch(
          `${API_BASE_URL}/reports/${report.stakabaadhi_no}/generate_pdf/`,
          {
            method: 'POST',
            headers,
          }
        );
        
        if (generateResponse.ok) {
          const generateResult = await generateResponse.json();
          downloadUrl = generateResult.download_url;
        }
      }
      
      if (!downloadUrl) {
        throw new Error('Receipt PDF not available');
      }
      
      const filename = `stakabaadhi_${report.stakabaadhi_no}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      console.log('Downloading receipt from:', downloadUrl);
      const downloadResult = await FileSystem.downloadAsync(downloadUrl, fileUri);
      
      if (downloadResult.status === 200) {
        Alert.alert('Success', 'Receipt downloaded successfully!');
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Share Receipt',
            UTI: 'com.adobe.pdf',
          });
        } else {
          // On Android, open the file
          Alert.alert('Download Complete', `Receipt saved to: ${fileUri}`);
        }
      } else {
        throw new Error(`Download failed: ${downloadResult.status}`);
      }
      
    } catch (error: any) {
      console.error('Download error:', error);
      Alert.alert('Error', error.message || 'Failed to download receipt');
    } finally {
      setProcessing(false);
    }
  };

  // ============ HELPER FUNCTIONS ============
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return 'TSh 0';
    
    return `TSh ${num.toLocaleString('en-TZ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-TZ', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getDonationColor = (type?: string) => {
    const found = DONATION_TYPE_OPTIONS.find(t => 
      type?.toLowerCase().includes(t.id) || t.id === type?.toLowerCase()
    );
    return found?.color || '#6B7280';
  };

  const getDonationTypeDisplay = (type?: string) => {
    const found = DONATION_TYPE_OPTIONS.find(t => t.id === type);
    return found?.name || 'Other';
  };

  const hasReceipt = (donationId: number) => {
    return reports.some(report => report.donation === donationId);
  };

  const filteredDonations = watoaji.filter(donation => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      donation.doner_name?.toLowerCase().includes(searchLower) ||
      donation.church.toLowerCase().includes(searchLower) ||
      donation.amount.includes(searchQuery) ||
      donation.jumla_ya_fedha_kwa_maneno.toLowerCase().includes(searchLower) ||
      getDonationTypeDisplay(donation.donation_type).toLowerCase().includes(searchLower)
    );
  });

  // ============ EXPORT FUNCTION ============
  const exportToCSV = async () => {
    try {
      if (watoaji.length === 0) {
        Alert.alert('No Data', 'There are no donations to export');
        return;
      }

      const headers = ['ID', 'Donor', 'Amount', 'Church', 'Date', 'Amount in Words', 'Donation Type', 'Receipt Generated'];
      const rows = watoaji.map(d => [
        d.id,
        d.doner_name,
        d.amount,
        d.church,
        formatDate(d.date),
        `"${d.jumla_ya_fedha_kwa_maneno}"`,
        getDonationTypeDisplay(d.donation_type),
        hasReceipt(d.id) ? 'Yes' : 'No'
      ]);

      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      
      const fileUri = `${FileSystem.documentDirectory}donations_${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Share Donations CSV',
          UTI: 'public.comma-separated-values-text'
        });
      } else {
        Alert.alert('Success', `CSV exported to: ${fileUri}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  // ============ INITIAL LOAD ============
  useEffect(() => {
    loadData();
  }, []);

  // ============ RENDER LOADING ============
  if (loading && watoaji.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
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
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowForm(false)} style={styles.modalBackButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {formMode === 'create' ? 'New Donation' : 'Edit Donation'}
          </Text>
          <View style={styles.modalHeaderActions}>
            <TouchableOpacity
              style={[styles.formActionButton, styles.cancelButton]}
              onPress={() => setShowForm(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formActionButton, styles.submitButton]}
              onPress={handleSubmitDonation}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons 
                    name={formMode === 'create' ? 'add-circle' : 'checkmark-circle'} 
                    size={16} 
                    color="#fff" 
                  />
                  <Text style={styles.submitButtonText}>
                    {formMode === 'create' ? 'Create & Generate Receipt' : 'Update'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.modalScroll} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.modalContentContainer}
        >
          <View style={styles.formContainer}>
            {/* Info Banner */}
            {formMode === 'create' && (
              <View style={styles.infoBanner}>
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <Text style={styles.infoBannerText}>
                  Receipt will be auto-generated after creating donation
                </Text>
              </View>
            )}

            {/* Donor Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Donor *</Text>
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={() => setShowUserPicker(true)}
                disabled={processing}
              >
                {selectedUser ? (
                  <View style={styles.selectedItem}>
                    <FontAwesome5 name="user" size={16} color="#3B82F6" />
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
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Amount (TSh) *</Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>TSh</Text>
                <TextInput
                  style={styles.amountInput}
                  value={formData.amount}
                  onChangeText={(value) => {
                    const cleaned = value.replace(/[^0-9.]/g, '');
                    setFormData({...formData, amount: cleaned});
                  }}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#9CA3AF"
                  editable={!processing}
                />
              </View>
              {formData.amount && !isNaN(parseFloat(formData.amount)) && (
                <Text style={styles.amountInWords}>
                  {convertAmountToSwahiliWords(parseFloat(formData.amount))}
                </Text>
              )}
            </View>

            {/* Church */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Church *</Text>
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={() => setShowChurchPicker(true)}
                disabled={processing}
              >
                {selectedChurch ? (
                  <View style={styles.selectedItem}>
                    <FontAwesome5 name="church" size={16} color="#3B82F6" />
                    <View style={styles.selectedItemInfo}>
                      <Text style={styles.selectedItemName}>{selectedChurch.church_name}</Text>
                      <Text style={styles.selectedItemDetail}>
                        {selectedChurch.region && selectedChurch.district ? 
                          `${selectedChurch.region}, ${selectedChurch.district}` : 
                          'No location'}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.placeholderText}>Select church</Text>
                )}
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Donation Type */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Donation Type *</Text>
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={() => setShowDonationTypePicker(true)}
                disabled={processing}
              >
                <View style={styles.selectedItem}>
                  <FontAwesome5 
                    name={DONATION_TYPE_OPTIONS.find(t => t.id === formData.donation_type)?.icon || 'heart'} 
                    size={16} 
                    color={getDonationColor(formData.donation_type)} 
                  />
                  <View style={styles.selectedItemInfo}>
                    <Text style={styles.selectedItemName}>
                      {DONATION_TYPE_OPTIONS.find(t => t.id === formData.donation_type)?.name}
                    </Text>
                    <Text style={styles.typeDescription}>
                      {DONATION_TYPE_OPTIONS.find(t => t.id === formData.donation_type)?.description}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Additional fields for nyingine */}
            {formData.donation_type === 'nyingine' && (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Sadaka/Mchango Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.sadaka_name}
                    onChangeText={(value) => setFormData({...formData, sadaka_name: value})}
                    placeholder="Enter name"
                    placeholderTextColor="#9CA3AF"
                    editable={!processing}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Contribution Type</Text>
                  <View style={styles.radioGroup}>
                    {['sadaka', 'michango', 'zawadi', 'matumizi', 'nyingine'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.radioOption,
                          formData.contribution_type === type && styles.radioOptionSelected
                        ]}
                        onPress={() => setFormData({...formData, contribution_type: type})}
                        disabled={processing}
                      >
                        <View style={styles.radioCircle}>
                          {formData.contribution_type === type && (
                            <View style={styles.radioInnerCircle} />
                          )}
                        </View>
                        <Text style={[
                          styles.radioLabel,
                          formData.contribution_type === type && styles.radioLabelSelected
                        ]}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {formData.contribution_type === 'nyingine' && (
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Custom Contribution Type *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.custom_contribution_type}
                      onChangeText={(value) => setFormData({...formData, custom_contribution_type: value})}
                      placeholder="Specify contribution type"
                      placeholderTextColor="#9CA3AF"
                      editable={!processing}
                    />
                  </View>
                )}

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Percentage of Total (%)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.percent}
                    onChangeText={(value) => setFormData({...formData, percent: value.replace(/[^0-9.]/g, '')})}
                    placeholder="100"
                    keyboardType="decimal-pad"
                    placeholderTextColor="#9CA3AF"
                    editable={!processing}
                  />
                </View>

                <View style={styles.percentageRow}>
                  <View style={styles.percentageGroup}>
                    <Text style={styles.formLabel}>CTF %</Text>
                    <TextInput
                      style={styles.percentageInput}
                      value={formData.ctf_percent}
                      onChangeText={(value) => {
                        const ctf = value.replace(/[^0-9.]/g, '');
                        const kanisa = (100 - parseFloat(ctf || '0')).toString();
                        setFormData({
                          ...formData,
                          ctf_percent: ctf,
                          kanisa_mahalia_percent: kanisa
                        });
                      }}
                      placeholder="58"
                      keyboardType="decimal-pad"
                      placeholderTextColor="#9CA3AF"
                      editable={!processing}
                    />
                  </View>
                  <View style={styles.percentageGroup}>
                    <Text style={styles.formLabel}>Church %</Text>
                    <TextInput
                      style={styles.percentageInput}
                      value={formData.kanisa_mahalia_percent}
                      onChangeText={(value) => {
                        const kanisa = value.replace(/[^0-9.]/g, '');
                        const ctf = (100 - parseFloat(kanisa || '0')).toString();
                        setFormData({
                          ...formData,
                          ctf_percent: ctf,
                          kanisa_mahalia_percent: kanisa
                        });
                      }}
                      placeholder="42"
                      keyboardType="decimal-pad"
                      placeholderTextColor="#9CA3AF"
                      editable={!processing}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Description</Text>
                  <TextInput
                    style={[styles.textInput, styles.multilineInput]}
                    value={formData.description}
                    onChangeText={(value) => setFormData({...formData, description: value})}
                    placeholder="Additional details..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                    editable={!processing}
                  />
                </View>
              </>
            )}

            {/* Amount Preview */}
            {formData.amount && (
              <View style={styles.previewSection}>
                <Text style={styles.previewTitle}>Preview</Text>
                <View style={styles.previewCard}>
                  <Text style={styles.previewLabel}>Amount:</Text>
                  <Text style={styles.previewValue}>{formatCurrency(formData.amount)}</Text>
                </View>
                <View style={styles.previewCard}>
                  <Text style={styles.previewLabel}>Church:</Text>
                  <Text style={styles.previewValue}>{selectedChurch?.church_name || 'Not selected'}</Text>
                </View>
                <View style={styles.previewCard}>
                  <Text style={styles.previewLabel}>Type:</Text>
                  <Text style={styles.previewValue}>
                    {DONATION_TYPE_OPTIONS.find(t => t.id === formData.donation_type)?.name}
                  </Text>
                </View>
                {formMode === 'create' && (
                  <View style={[styles.previewCard, { backgroundColor: '#F0F9FF' }]}>
                    <Text style={styles.previewLabel}>Receipt:</Text>
                    <Text style={[styles.previewValue, { color: '#3B82F6' }]}>Will be auto-generated</Text>
                  </View>
                )}
              </View>
            )}
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
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={users}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  selectedUser?.id === item.id && styles.pickerItemSelected
                ]}
                onPress={() => {
                  setSelectedUser(item);
                  setFormData({...formData, doner: item.id});
                  setShowUserPicker(false);
                }}
              >
                <View style={styles.userAvatar}>
                  <FontAwesome5 name="user" size={16} color="#fff" />
                </View>
                <View style={styles.pickerItemInfo}>
                  <Text style={styles.pickerItemName}>{item.fullname}</Text>
                  <Text style={styles.pickerItemDetail}>
                    {item.membership_number || item.email || 'No contact'}
                  </Text>
                </View>
                {selectedUser?.id === item.id && (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.pickerList}
          />
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
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={churches}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  selectedChurch?.id === item.id && styles.pickerItemSelected
                ]}
                onPress={() => {
                  setSelectedChurch(item);
                  setFormData({...formData, church: item.church_name});
                  setShowChurchPicker(false);
                }}
              >
                <View style={styles.churchIcon}>
                  <FontAwesome5 name="church" size={16} color="#3B82F6" />
                </View>
                <View style={styles.pickerItemInfo}>
                  <Text style={styles.pickerItemName}>{item.church_name}</Text>
                  <Text style={styles.pickerItemDetail}>
                    {item.region && item.district ? 
                      `${item.region}, ${item.district}` : 
                      'No location info'}
                    {item.total_members ? ` • ${item.total_members} members` : ''}
                  </Text>
                </View>
                {selectedChurch?.id === item.id && (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.pickerList}
          />
        </View>
      </View>
    </Modal>
  );

  const renderDonationTypePicker = () => (
    <Modal
      visible={showDonationTypePicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowDonationTypePicker(false)}
    >
      <View style={styles.pickerModalOverlay}>
        <View style={styles.pickerModal}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Type</Text>
            <TouchableOpacity onPress={() => setShowDonationTypePicker(false)}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={DONATION_TYPE_OPTIONS}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  formData.donation_type === item.id && styles.typeOptionActive
                ]}
                onPress={() => {
                  setFormData({...formData, donation_type: item.id});
                  setShowDonationTypePicker(false);
                }}
              >
                <View style={[styles.typeIcon, { backgroundColor: `${item.color}20` }]}>
                  <FontAwesome5 name={item.icon} size={20} color={item.color} />
                </View>
                <View style={styles.typeInfo}>
                  <Text style={[
                    styles.typeName,
                    formData.donation_type === item.id && styles.typeNameActive
                  ]}>
                    {item.name}
                  </Text>
                  <Text style={styles.typeDescription}>{item.description}</Text>
                </View>
                {formData.donation_type === item.id && (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.pickerList}
          />
        </View>
      </View>
    </Modal>
  );

  // ============ RENDER DONATION ITEM ============
  const renderDonationItem = ({ item }: { item: WatoajiDisplay }) => {
    const hasReceiptForThis = hasReceipt(item.id);
    
    return (
      <View style={styles.donationCard}>
        <View style={styles.cardHeader}>
          <View style={styles.donorInfo}>
            <View style={[styles.donorAvatar, { backgroundColor: getDonationColor(item.donation_type) }]}>
              <FontAwesome5 name="user" size={14} color="#fff" />
            </View>
            <View>
              <Text style={styles.donorName}>{item.doner_name}</Text>
              <View style={styles.donationTypeBadge}>
                <Text style={[styles.donationTypeText, { color: getDonationColor(item.donation_type) }]}>
                  {getDonationTypeDisplay(item.donation_type)}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
            <Text style={styles.donationDate}>{formatDate(item.date)}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <FontAwesome5 name="church" size={12} color="#6B7280" />
            <Text style={styles.infoLabel}>Church:</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{item.church}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="description" size={12} color="#6B7280" />
            <Text style={styles.infoLabel}>Amount in Words:</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {item.jumla_ya_fedha_kwa_maneno}
            </Text>
          </View>
          
          {/* Receipt Status */}
          <View style={styles.infoRow}>
            <Ionicons name="receipt" size={12} color={hasReceiptForThis ? "#10B981" : "#F59E0B"} />
            <Text style={styles.infoLabel}>Receipt:</Text>
            <Text style={[styles.infoValue, { color: hasReceiptForThis ? "#10B981" : "#F59E0B" }]}>
              {hasReceiptForThis ? "Generated" : "Not generated"}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, hasReceiptForThis ? styles.receiptButton : styles.generateButton]}
            onPress={() => handleViewReceipt(item)}
            disabled={processing}
          >
            <Ionicons name={hasReceiptForThis ? "receipt" : "add-circle"} size={14} color="#fff" />
            <Text style={styles.actionText}>
              {hasReceiptForThis ? "View Receipt" : "Generate Receipt"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditDonation(item)}
            disabled={processing}
          >
            <Ionicons name="create" size={14} color="#fff" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteDonation(item)}
            disabled={processing}
          >
            <Ionicons name="trash" size={14} color="#fff" />
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Donations</Text>
          <TouchableOpacity onPress={exportToCSV} style={styles.exportButton}>
            <MaterialIcons name="file-download" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.statCard1]}>
            <Ionicons name="cash" size={28} color="#10B981" />
            <Text style={styles.statNumber}>{formatCurrency(totalAmount)}</Text>
            <Text style={styles.statLabel}>Total Amount</Text>
          </View>
          <View style={[styles.statCard, styles.statCard2]}>
            <MaterialIcons name="list-alt" size={28} color="#3B82F6" />
            <Text style={styles.statNumber}>{totalDonations}</Text>
            <Text style={styles.statLabel}>Total Donations</Text>
          </View>
          <View style={[styles.statCard, styles.statCard3]}>
            <Ionicons name="receipt" size={28} color="#8B5CF6" />
            <Text style={styles.statNumber}>{reports.length}</Text>
            <Text style={styles.statLabel}>Receipts</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search donations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.quickAction, styles.createButton]}
            onPress={handleCreateDonation}
            disabled={processing}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.quickActionText}>New Donation</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.quickAction, styles.refreshButton]}
            onPress={onRefresh}
            disabled={processing}
          >
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.quickActionText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBannerContainer}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.infoBannerContainerText}>
            Receipts are auto-generated when creating new donations
          </Text>
        </View>

        {/* Donations List */}
        <FlatList
          ref={scrollViewRef}
          data={filteredDonations}
          renderItem={renderDonationItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="receipt-long" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>
                {searchQuery ? 'No donations found' : 'No donations yet'}
              </Text>
              <Text style={styles.emptyStateSubtitle}>
                {searchQuery ? 'Try a different search' : 'Create your first donation'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity 
                  style={styles.emptyStateButton}
                  onPress={handleCreateDonation}
                  disabled={processing}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.emptyStateButtonText}>Create Donation</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />

        {/* Processing Overlay */}
        {processing && (
          <View style={styles.processingOverlay}>
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          </View>
        )}

        {/* Form Modal */}
        {renderFormModal()}

        {/* Picker Modals */}
        {renderUserPicker()}
        {renderChurchPicker()}
        {renderDonationTypePicker()}

        {/* Floating Action Button */}
        <TouchableOpacity 
          style={styles.fab} 
          onPress={handleCreateDonation}
          disabled={processing}
        >
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
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  exportButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statCard1: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statCard2: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statCard3: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
    padding: 0,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButton: {
    backgroundColor: '#3B82F6',
  },
  refreshButton: {
    backgroundColor: '#10B981',
  },
  quickActionText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  infoBannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  infoBannerContainerText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#0369A1',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  donationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  donorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  donorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  donationTypeBadge: {
    marginTop: 4,
  },
  donationTypeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  donationDate: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'right',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0369A1',
  },
  cardContent: {
    gap: 10,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    minWidth: 60,
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 18,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  receiptButton: {
    backgroundColor: '#10B981',
  },
  generateButton: {
    backgroundColor: '#F59E0B',
  },
  editButton: {
    backgroundColor: '#3B82F6',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingBottom: 100,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalBackButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  formActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButtonText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  submitButtonText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  modalScroll: {
    flex: 1,
  },
  modalContentContainer: {
    paddingBottom: 60,
  },
  formContainer: {
    padding: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  infoBannerText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#0369A1',
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 15,
    color: '#1F2937',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 52,
  },
  selectedItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedItemInfo: {
    flex: 1,
  },
  selectedItemName: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  selectedItemDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  placeholderText: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  typeDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  amountInWords: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 16,
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  radioOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#F0F9FF',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  radioLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  radioLabelSelected: {
    color: '#1F2937',
    fontWeight: '500',
  },
  percentageRow: {
    flexDirection: 'row',
    gap: 16,
  },
  percentageGroup: {
    flex: 1,
  },
  percentageInput: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 15,
    color: '#1F2937',
    textAlign: 'center',
  },
  previewSection: {
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  previewCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  previewValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  pickerList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  pickerItemSelected: {
    backgroundColor: '#F0F9FF',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  churchIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemInfo: {
    flex: 1,
  },
  pickerItemName: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  pickerItemDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeOptionActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#3B82F6',
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeInfo: {
    flex: 1,
  },
  typeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  typeNameActive: {
    color: '#0369A1',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 1000,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  processingContainer: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
});