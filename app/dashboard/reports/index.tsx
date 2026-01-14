// app/donations-management.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
  Alert,
  RefreshControl,
  TextInput,
  Platform,
  Linking,
  FlatList,
  AppState,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

// Import the new FileSystem API from legacy module
import * as LegacyFileSystem from 'expo-file-system/legacy';

// Type definitions
interface User {
  id: number;
  fullname: string;
  mobile_number: string;
  email?: string;
  membership_number?: string;
  region?: string;
  district?: string;
}

interface Church {
  id: number;
  church_name: string;
  region?: string;
  district?: string;
  ward?: string;
  village?: string;
  phone_number?: string;
  leader_name?: string;
}

interface Donation {
  id: number;
  receipt_number: string;
  user: number;
  user_fullname: string;
  church: number;
  church_name: string;
  amount: string;
  donation_type: string;
  direction: string;
  zaka_amount: string;
  sadaka_pamoja_ctf: string;
  sadaka_pamoja_kanisa: string;
  jumla_fedha_kanisa: string;
  jumla_ya_fedha_ctf: string;
  jumla_ya_fedha_zote: string;
  amount_in_words: string;
  description: string;
  donation_date: string;
  receipt_url: string;
  receipt_pdf: string;
  created_at: string;
  updated_at: string;
}

interface DonationFormData {
  user: number | null;
  church: number | null;
  amount: string;
  donation_type: string;
  direction?: string;
  description?: string;
}

// API Configuration
const API_BASE_URL = 'https://mhazini.pythonanywhere.com';
const USERS_API = `${API_BASE_URL}/api/auth/users/`;
const CHURCHES_API = `${API_BASE_URL}/api/auth/churches/`;
const DONATIONS_API = `${API_BASE_URL}/api/auth/donations/`;
const DONATIONS_REPORT_API = `${API_BASE_URL}/api/auth/donations/generate-report/`;
const DONATIONS_EXPORT_API = `${API_BASE_URL}/api/auth/donations/export-csv/`;

const DONATION_TYPES = [
  { id: 'zaka', name: 'Zaka', color: '#27AE60', icon: 'cash-outline' },
  { id: 'sadaka', name: 'Sadaka', color: '#3498DB', icon: 'heart-outline' },
  { id: 'mchango', name: 'Mchango', color: '#8E44AD', icon: 'gift-outline' },
  { id: 'nyingine', name: 'Nyingine', color: '#F39C12', icon: 'ellipsis-horizontal-outline' },
];

const DIRECTIONS = [
  { id: 'CTF', name: 'CTF', color: '#3498DB' },
  { id: 'KANISA_MAHALIA', name: 'Kanisa Mahalia', color: '#27AE60' },
  { id: 'MTAA', name: 'Mtaa', color: '#8E44AD' },
];

const { width, height } = Dimensions.get('window');

export default function DonationsManagementScreen() {
  const router = useRouter();
  
  // State management
  const [donations, setDonations] = useState<Donation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [showReceiptManager, setShowReceiptManager] = useState(false);
  const [selectedDonations, setSelectedDonations] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [expandedDonation, setExpandedDonation] = useState<number | null>(null);
  const [appState, setAppState] = useState(AppState.currentState);

  // Refs for TextInput
  const amountInputRef = useRef<TextInput>(null);
  const descriptionInputRef = useRef<TextInput>(null);

  // Form state
  const [formData, setFormData] = useState<DonationFormData>({
    user: null,
    church: null,
    amount: '',
    donation_type: 'sadaka',
    direction: 'CTF',
    description: '',
  });

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        fetchAllData();
      }
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, [appState]);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [usersResponse, churchesResponse, donationsResponse] = await Promise.all([
        fetch(USERS_API).catch(error => {
          console.error('Users fetch error:', error);
          throw new Error('Failed to connect to server');
        }),
        fetch(CHURCHES_API).catch(error => {
          console.error('Churches fetch error:', error);
          throw new Error('Failed to connect to server');
        }),
        fetch(DONATIONS_API).catch(error => {
          console.error('Donations fetch error:', error);
          throw new Error('Failed to connect to server');
        })
      ]);

      // Process users response
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        const usersArray = Array.isArray(usersData) ? usersData : usersData.results || [];
        setUsers(usersArray);
      } else {
        console.error('Failed to fetch users:', usersResponse.status);
      }

      // Process churches response
      if (churchesResponse.ok) {
        const churchesData = await churchesResponse.json();
        const churchesArray = Array.isArray(churchesData) ? churchesData : churchesData.results || [];
        setChurches(churchesArray);
      } else {
        console.error('Failed to fetch churches:', churchesResponse.status);
      }

      // Process donations response
      if (donationsResponse.ok) {
        const donationsData = await donationsResponse.json();
        const donationsArray = Array.isArray(donationsData) ? donationsData : donationsData.results || [];
        setDonations(donationsArray);
        setError(null);
        
        await AsyncStorage.setItem('cached_donations', JSON.stringify(donationsArray));
      } else {
        throw new Error(`Failed to fetch donations: ${donationsResponse.status}`);
      }

    } catch (error: any) {
      console.error('Fetch error:', error);
      const errorMessage = error.message || 'Failed to load data. Please check your connection.';
      setError(errorMessage);
      
      try {
        const cached = await AsyncStorage.getItem('cached_donations');
        if (cached) {
          const parsedData = JSON.parse(cached);
          const cachedArray = Array.isArray(parsedData) ? parsedData : parsedData.results || [];
          setDonations(cachedArray);
        }
      } catch (cacheError) {
        console.error('Cache error:', cacheError);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAllData();
  }, []);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllData();
  }, []);

  // Filter donations
  const filteredDonations = donations.filter(donation =>
    donation.receipt_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    donation.user_fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    donation.church_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    donation.donation_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Success message handler
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 3000);
  };

  // New FileSystem API download function
  const downloadFileNewAPI = async (url: string, filename: string): Promise<string> => {
    console.log(`Downloading with new API: ${url}`);
    
    try {
      setProcessing(true);
      
      // Use the legacy FileSystem API which still works
      const fileUri = `${LegacyFileSystem.cacheDirectory}${filename}`;
      
      // Download the file directly
      const downloadResult = await LegacyFileSystem.downloadAsync(
        url,
        fileUri
      );
      
      if (downloadResult.status !== 200) {
        throw new Error(`Download failed: ${downloadResult.status}`);
      }
      
      console.log(`File downloaded: ${fileUri}`);
      return fileUri;
      
    } catch (error: any) {
      console.error('New API download error:', error);
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  // Alternative: Use fetch and save with new File API
  const downloadFileWithFetch = async (url: string, filename: string): Promise<string> => {
    try {
      setProcessing(true);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      // Get as blob
      const blob = await response.blob();
      
      // Convert blob to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      // Extract base64 data
      const base64Data = base64.split(',')[1];
      
      // Use legacy FileSystem to save
      const fileUri = `${LegacyFileSystem.cacheDirectory}${filename}`;
      
      await LegacyFileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: LegacyFileSystem.EncodingType.Base64,
      });
      
      return fileUri;
      
    } catch (error) {
      console.error('Fetch download error:', error);
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  // Main download function with fallbacks
  const downloadFile = async (url: string, filename: string): Promise<string> => {
    try {
      // Try new API first
      return await downloadFileNewAPI(url, filename);
    } catch (error) {
      console.log('New API download failed, trying fetch method:', error);
      try {
        return await downloadFileWithFetch(url, filename);
      } catch (fetchError) {
        console.log('Fetch method failed:', fetchError);
        
        // Last resort: Use the modern File API if available
        try {
          return await downloadWithModernFileAPI(url, filename);
        } catch (modernError) {
          console.log('Modern API failed:', modernError);
          throw new Error(`All download methods failed: ${modernError.message}`);
        }
      }
    }
  };

  // Modern File API download (for newer Expo versions)
  const downloadWithModernFileAPI = async (url: string, filename: string): Promise<string> => {
    try {
      setProcessing(true);
      
      // Check if we're in a browser-like environment
      if (typeof document !== 'undefined') {
        // For web or environments with DOM API
        const response = await fetch(url);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        
        // Create temporary download link
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Return a dummy URI for compatibility
        return objectUrl;
      } else {
        // For React Native, use a different approach
        const response = await fetch(url);
        const text = await response.text();
        
        // Save using AsyncStorage as last resort
        const key = `file_${filename}`;
        await AsyncStorage.setItem(key, text);
        
        // Return a reference we can use
        return `asyncstorage://${key}`;
      }
    } catch (error) {
      console.error('Modern API error:', error);
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  // CRUD Operations
  const handleCreateDonation = async () => {
    try {
      if (!formData.user || !formData.church || !formData.amount) {
        Alert.alert('Validation Error', 'Please fill in all required fields');
        return;
      }

      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Validation Error', 'Please enter a valid amount');
        return;
      }

      const response = await fetch(DONATIONS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: formData.user,
          church: formData.church,
          amount: amount,
          donation_type: formData.donation_type,
          direction: formData.direction,
          description: formData.description || '',
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { detail: responseText };
        }
        throw new Error(errorData.detail || `Create failed: ${response.status}`);
      }

      const newDonation = JSON.parse(responseText);
      setDonations(prev => [newDonation, ...prev]);
      setShowForm(false);
      resetForm();
      showSuccess('Donation created successfully!');
      
    } catch (error: any) {
      console.error('Create error:', error);
      Alert.alert('Error', error.message || 'Failed to create donation. Please try again.');
    }
  };

  const handleEditDonation = (donation: Donation) => {
    setEditingDonation(donation);
    setFormData({
      user: donation.user,
      church: donation.church,
      amount: donation.amount,
      donation_type: donation.donation_type,
      direction: donation.direction,
      description: donation.description || '',
    });
    setShowForm(true);
  };

  const handleUpdateDonation = async () => {
    if (!editingDonation) return;

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Validation Error', 'Please enter a valid amount');
        return;
      }

      const response = await fetch(`${DONATIONS_API}${editingDonation.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: formData.user,
          church: formData.church,
          amount: amount,
          donation_type: formData.donation_type,
          direction: formData.direction,
          description: formData.description || '',
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { detail: responseText };
        }
        throw new Error(errorData.detail || `Update failed: ${response.status}`);
      }

      const updatedDonation = JSON.parse(responseText);
      setDonations(prev => prev.map(d => d.id === editingDonation.id ? updatedDonation : d));
      setShowForm(false);
      setEditingDonation(null);
      resetForm();
      showSuccess('Donation updated successfully!');
      
    } catch (error: any) {
      console.error('Update error:', error);
      Alert.alert('Error', error.message || 'Failed to update donation. Please try again.');
    }
  };

  const handleDeleteDonation = async (id: number) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this donation? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${DONATIONS_API}${id}/`, {
                method: 'DELETE',
              });

              if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Delete failed: ${response.status}`);
              }

              setDonations(prev => prev.filter(d => d.id !== id));
              setSelectedDonations(prev => prev.filter(dId => dId !== id));
              showSuccess('Donation deleted successfully!');
              
            } catch (error: any) {
              console.error('Delete error:', error);
              Alert.alert('Error', error.message || 'Failed to delete donation. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Receipt Operations
  const handleGenerateReport = async () => {
    try {
      if (donations.length === 0) {
        Alert.alert('No Data', 'There are no donations to generate a report.');
        return;
      }

      const filename = `donation_report_${Date.now()}.pdf`;
      
      const fileUri = await downloadFile(DONATIONS_REPORT_API, filename);
      
      showSuccess('Report generated successfully!');
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Donation Report',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Report Generated', `Report saved to: ${fileUri}`, [
          { 
            text: 'Open', 
            onPress: async () => {
              try {
                await Linking.openURL(fileUri);
              } catch (error) {
                console.error('Error opening file:', error);
                Alert.alert('Error', 'Could not open the file.');
              }
            }
          },
          { text: 'OK' }
        ]);
      }
      
    } catch (error: any) {
      console.error('Report error:', error);
      Alert.alert('Error', error.message || 'Failed to generate report. Please try again.');
    }
  };

  const handleExportCSV = async () => {
    try {
      if (donations.length === 0) {
        Alert.alert('No Data', 'There are no donations to export.');
        return;
      }

      const filename = `donations_export_${Date.now()}.csv`;
      
      const fileUri = await downloadFile(DONATIONS_EXPORT_API, filename);
      
      showSuccess('CSV exported successfully!');
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Share Donations CSV',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('CSV Exported', `File saved to: ${fileUri}`, [
          { 
            text: 'Open', 
            onPress: async () => {
              try {
                await Linking.openURL(fileUri);
              } catch (error) {
                console.error('Error opening file:', error);
                Alert.alert('Error', 'Could not open the file.');
              }
            }
          },
          { text: 'OK' }
        ]);
      }
      
    } catch (error: any) {
      console.error('CSV export error:', error);
      Alert.alert('Error', error.message || 'Failed to export CSV. Please try again.');
    }
  };

  const handleDownloadReceipt = async (donation: Donation) => {
    try {
      const url = `${DONATIONS_API}${donation.id}/download-receipt/`;
      const filename = `receipt_${donation.receipt_number}_${Date.now()}.pdf`;
      
      const fileUri = await downloadFile(url, filename);
      
      showSuccess('Receipt downloaded!');
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Receipt',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Receipt Downloaded', `Receipt saved to: ${fileUri}`, [
          { 
            text: 'Open', 
            onPress: async () => {
              try {
                await Linking.openURL(fileUri);
              } catch (error) {
                console.error('Error opening file:', error);
                Alert.alert('Error', 'Could not open the receipt.');
              }
            }
          },
          { text: 'OK' }
        ]);
      }
      
    } catch (error: any) {
      console.error('Receipt download error:', error);
      Alert.alert('Error', error.message || 'Failed to download receipt. Please try again.');
    }
  };

  const handlePrintReceipt = async (donation: Donation) => {
    try {
      setProcessing(true);
      
      const url = `${DONATIONS_API}${donation.id}/download-receipt/`;
      const filename = `receipt_${donation.receipt_number}_print_${Date.now()}.pdf`;
      
      const fileUri = await downloadFile(url, filename);
      
      await Print.printAsync({
        uri: fileUri,
        printerUrl: undefined,
      });
      
      showSuccess('Receipt sent to printer!');
      
    } catch (error: any) {
      console.error('Print error:', error);
      
      if (error.message.includes('Printing not available')) {
        Alert.alert(
          'Print Unavailable',
          'Printing is not available on this device. Please download the receipt instead.',
          [
            { text: 'Download', onPress: () => handleDownloadReceipt(donation) },
            { text: 'OK' }
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to print receipt. Please try again.');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handlePrintSelectedReceipts = async () => {
    if (selectedDonations.length === 0) {
      Alert.alert('No Selection', 'Please select receipts to print.');
      return;
    }

    try {
      setProcessing(true);
      
      const selectedDonationDetails = donations.filter(d => 
        selectedDonations.includes(d.id)
      );

      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              background: white;
              font-size: 12px;
            }
            .receipt-container {
              page-break-inside: avoid;
              margin-bottom: 30px;
              border: 1px solid #ddd;
              padding: 15px;
              border-radius: 8px;
            }
            .header {
              text-align: center;
              background-color: #2E86C1;
              color: white;
              padding: 10px;
              margin-bottom: 20px;
              border-radius: 5px;
            }
            .receipt-info {
              margin-bottom: 15px;
            }
            .amount-breakdown {
              background-color: #f5f5f5;
              padding: 10px;
              border-radius: 5px;
              margin: 10px 0;
            }
            .signature-area {
              margin-top: 30px;
              border-top: 1px solid #ccc;
              padding-top: 15px;
            }
            .footer {
              text-align: center;
              font-style: italic;
              color: #666;
              margin-top: 20px;
              font-size: 10px;
            }
            .summary-header {
              background-color: #2E86C1;
              color: white;
              padding: 10px;
              text-align: center;
              border-radius: 5px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="summary-header">
            <h2>SELECTED RECEIPTS - BATCH PRINT</h2>
            <p>Total Receipts: ${selectedDonations.length} | Date: ${new Date().toLocaleDateString()}</p>
          </div>
      `;

      selectedDonationDetails.forEach((donation, index) => {
        htmlContent += `
          <div class="receipt-container">
            <div class="header">
              <h3>SEVENTH-DAY ADVENTIST CHURCH</h3>
              <h4>CENTRAL TANZANIA FIELD (CTF)</h4>
              <p>P.O. BOX 474, DODOMA</p>
              <h4>STAKABADHI YA KUPOKEA FEDHA</h4>
              <p><strong>STAKABADHI No:</strong> ${donation.receipt_number}</p>
            </div>
            
            <div class="receipt-info">
              <p><strong>Nimepokea toka kwa:</strong> ${donation.user_fullname}</p>
              <p><strong>Kanisa la:</strong> ${donation.church_name}</p>
              <p><strong>Aina ya Mchango:</strong> ${getDonationTypeDisplay(donation.donation_type)}</p>
              <p><strong>Mwelekeo:</strong> ${getDirectionDisplay(donation.direction)}</p>
              <p><strong>Kiasi:</strong> ${formatCurrency(parseFloat(donation.amount))}</p>
              <p><strong>Kiasi kwa Maneno:</strong> ${donation.amount_in_words}</p>
            </div>
            
            <div class="amount-breakdown">
              <h4>MGAWANYO WA FEDHA</h4>
              <p><strong>Zaka:</strong> ${formatCurrency(parseFloat(donation.zaka_amount))}</p>
              <p><strong>Sadaka Pamoja CTF:</strong> ${formatCurrency(parseFloat(donation.sadaka_pamoja_ctf))}</p>
              <p><strong>Sadaka Pamoja Kanisa:</strong> ${formatCurrency(parseFloat(donation.sadaka_pamoja_kanisa))}</p>
              <p><strong>Jumla Fedha Kanisa:</strong> ${formatCurrency(parseFloat(donation.jumla_fedha_kanisa))}</p>
              <p><strong>Jumla Fedha CTF:</strong> ${formatCurrency(parseFloat(donation.jumla_ya_fedha_ctf))}</p>
              <p><strong>Jumla Fedha Zote:</strong> ${formatCurrency(parseFloat(donation.jumla_ya_fedha_zote))}</p>
            </div>
            
            ${donation.description ? `<p><strong>Maelezo:</strong> ${donation.description}</p>` : ''}
            
            <div class="signature-area">
              <p><strong>Mpokeaji:</strong> _________________________</p>
              <p><strong>Tarehe:</strong> ${formatDate(donation.donation_date)}</p>
            </div>
            
            <div class="footer">
              <p>Asante kwa mchango wako. Mungu akubariki.</p>
              <p>Generated by MhaziniAPI System</p>
            </div>
          </div>
          
          ${index < selectedDonationDetails.length - 1 ? '<div style="height: 20px;"></div>' : ''}
        `;
      });

      htmlContent += `</body></html>`;
      
      await Print.printAsync({
        html: htmlContent,
        printerUrl: undefined,
      });

      showSuccess(`${selectedDonations.length} receipt(s) sent to printer!`);
      setSelectedDonations([]);
      setSelectAll(false);
      
    } catch (error: any) {
      console.error('Print selected error:', error);
      Alert.alert('Error', error.message || 'Failed to print receipts. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePrintAllReceipts = async () => {
    if (donations.length === 0) {
      Alert.alert('No Donations', 'There are no donations to print.');
      return;
    }

    try {
      setProcessing(true);
      
      const batchSize = 10;
      const batches = Math.ceil(donations.length / batchSize);
      
      for (let batch = 0; batch < batches; batch++) {
        const startIdx = batch * batchSize;
        const endIdx = Math.min(startIdx + batchSize, donations.length);
        const batchDonations = donations.slice(startIdx, endIdx);
        
        let htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 15px; 
                background: white;
                font-size: 11px;
              }
              .receipt-container {
                page-break-inside: avoid;
                margin-bottom: 20px;
                border: 1px solid #eee;
                padding: 10px;
                border-radius: 5px;
              }
              .receipt-header {
                text-align: center;
                background-color: #f0f0f0;
                padding: 8px;
                margin-bottom: 10px;
                border-radius: 3px;
              }
              .amount-row {
                display: flex;
                justify-content: space-between;
                margin: 3px 0;
              }
              .batch-header {
                text-align: center;
                background-color: #2E86C1;
                color: white;
                padding: 10px;
                margin-bottom: 15px;
                border-radius: 5px;
              }
            </style>
          </head>
          <body>
            <div class="batch-header">
              <h3>BATCH ${batch + 1} OF ${batches}</h3>
              <p>Receipts ${startIdx + 1} to ${endIdx} of ${donations.length}</p>
            </div>
        `;

        batchDonations.forEach((donation, index) => {
          htmlContent += `
            <div class="receipt-container">
              <div class="receipt-header">
                <h4>RECEIPT: ${donation.receipt_number}</h4>
              </div>
              
              <div class="amount-row">
                <span><strong>Donor:</strong></span>
                <span>${donation.user_fullname}</span>
              </div>
              
              <div class="amount-row">
                <span><strong>Church:</strong></span>
                <span>${donation.church_name}</span>
              </div>
              
              <div class="amount-row">
                <span><strong>Type:</strong></span>
                <span>${getDonationTypeDisplay(donation.donation_type)}</span>
              </div>
              
              <div class="amount-row">
                <span><strong>Amount:</strong></span>
                <span>${formatCurrency(parseFloat(donation.amount))}</span>
              </div>
              
              <div class="amount-row">
                <span><strong>Date:</strong></span>
                <span>${formatDate(donation.donation_date)}</span>
              </div>
              
              <div style="margin-top: 8px; padding: 5px; background-color: #f8f8f8; border-radius: 3px;">
                <div class="amount-row">
                  <span>Zaka:</span>
                  <span>${formatCurrency(parseFloat(donation.zaka_amount))}</span>
                </div>
                <div class="amount-row">
                  <span>CTF:</span>
                  <span>${formatCurrency(parseFloat(donation.sadaka_pamoja_ctf))}</span>
                </div>
                <div class="amount-row">
                  <span>Kanisa:</span>
                  <span>${formatCurrency(parseFloat(donation.sadaka_pamoja_kanisa))}</span>
                </div>
              </div>
            </div>
            
            ${index < batchDonations.length - 1 ? '<div style="height: 10px;"></div>' : ''}
          `;
        });

        htmlContent += `</body></html>`;
        
        await Print.printAsync({
          html: htmlContent,
          printerUrl: undefined,
        });
        
        if (batch < batches - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      showSuccess(`All ${donations.length} receipt(s) printed successfully!`);
      
    } catch (error: any) {
      console.error('Print all error:', error);
      Alert.alert('Error', error.message || 'Failed to print receipts. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewReceipt = async (donation: Donation) => {
    if (donation.receipt_url) {
      try {
        await Linking.openURL(donation.receipt_url);
      } catch (error) {
        console.error('Error opening URL:', error);
        Alert.alert('Error', 'Could not open receipt. Please try downloading it instead.');
      }
    } else {
      Alert.alert('No Receipt', 'Receipt has not been generated for this donation.');
    }
  };

  const handleRegenerateReceipt = async (donationId: number) => {
    try {
      const response = await fetch(
        `${DONATIONS_API}${donationId}/regenerate-receipt/`,
        { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      const responseText = await response.text();
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { detail: responseText };
        }
        throw new Error(errorData.detail || `Regenerate failed: ${response.status}`);
      }
      
      showSuccess('Receipt regenerated successfully!');
      
      fetchAllData();
      
    } catch (error: any) {
      console.error('Regenerate error:', error);
      Alert.alert('Error', error.message || 'Failed to regenerate receipt.');
    }
  };

  // Helper functions
  const resetForm = () => {
    setFormData({
      user: null,
      church: null,
      amount: '',
      donation_type: 'sadaka',
      direction: 'CTF',
      description: '',
    });
    setEditingDonation(null);
    
    if (amountInputRef.current) {
      amountInputRef.current.blur();
    }
    if (descriptionInputRef.current) {
      descriptionInputRef.current.blur();
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getDonationTypeDisplay = (type: string): string => {
    const found = DONATION_TYPES.find(t => t.id === type);
    return found ? found.name : type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getDirectionDisplay = (direction: string): string => {
    const found = DIRECTIONS.find(d => d.id === direction);
    return found ? found.name : direction.replace(/_/g, ' ');
  };

  const getDonationTypeColor = (type: string): string => {
    const found = DONATION_TYPES.find(t => t.id === type);
    return found ? found.color : '#7F8C8D';
  };

  const getDirectionColor = (direction: string): string => {
    const found = DIRECTIONS.find(d => d.id === direction);
    return found ? found.color : '#7F8C8D';
  };

  const toggleDonationSelection = (donationId: number) => {
    setSelectedDonations(prev => 
      prev.includes(donationId) 
        ? prev.filter(id => id !== donationId)
        : [...prev, donationId]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedDonations([]);
    } else {
      const allIds = filteredDonations.map(d => d.id);
      setSelectedDonations(allIds);
    }
    setSelectAll(!selectAll);
  };

  const toggleExpandedDonation = (donationId: number) => {
    setExpandedDonation(expandedDonation === donationId ? null : donationId);
  };

  // Form Component
  const DonationForm = () => (
    <Modal
      visible={showForm}
      transparent
      animationType="slide"
      onRequestClose={() => {
        setShowForm(false);
        resetForm();
      }}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-5">
        <View className="bg-white rounded-2xl w-full max-h-[90%] min-h-[70%]">
          <View className="flex-row justify-between items-center p-5 border-b border-gray-200">
            <Text className="text-lg font-bold text-gray-800">
              {editingDonation ? 'Edit Donation' : 'New Donation'}
            </Text>
            <TouchableOpacity 
              onPress={() => {
                setShowForm(false);
                resetForm();
              }}
              className="p-1"
            >
              <Ionicons name="close" size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            className="p-5"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* User Selection */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-800 mb-2">Donor *</Text>
              {users.length === 0 ? (
                <View className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <Text className="text-amber-800 text-center">
                    No users found. Please add users first.
                  </Text>
                </View>
              ) : (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                >
                  <View className="flex-row flex-wrap">
                    {users.map(user => (
                      <TouchableOpacity
                        key={user.id}
                        className={`px-4 py-3 rounded-lg mr-2 mb-2 min-w-[150px] items-center justify-center ${
                          formData.user === user.id ? 'bg-blue-600' : 'bg-gray-100'
                        }`}
                        onPress={() => setFormData({...formData, user: user.id})}
                        activeOpacity={0.7}
                      >
                        <Text className={`font-medium text-center ${
                          formData.user === user.id ? 'text-white' : 'text-gray-800'
                        }`} numberOfLines={1}>
                          {user.fullname}
                        </Text>
                        <Text className={`text-xs mt-1 text-center ${
                          formData.user === user.id ? 'text-white/80' : 'text-gray-600'
                        }`} numberOfLines={1}>
                          {user.mobile_number}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
              {formData.user === null && users.length > 0 && (
                <Text className="text-red-500 text-xs mt-1">Please select a donor</Text>
              )}
            </View>

            {/* Church Selection */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-800 mb-2">Church *</Text>
              {churches.length === 0 ? (
                <View className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <Text className="text-amber-800 text-center">
                    No churches found. Please add churches first.
                  </Text>
                </View>
              ) : (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                >
                  <View className="flex-row flex-wrap">
                    {churches.map(church => (
                      <TouchableOpacity
                        key={church.id}
                        className={`px-4 py-3 rounded-lg mr-2 mb-2 min-w-[150px] items-center justify-center ${
                          formData.church === church.id ? 'bg-blue-600' : 'bg-gray-100'
                        }`}
                        onPress={() => setFormData({...formData, church: church.id})}
                        activeOpacity={0.7}
                      >
                        <Text className={`font-medium text-center ${
                          formData.church === church.id ? 'text-white' : 'text-gray-800'
                        }`} numberOfLines={2}>
                          {church.church_name}
                        </Text>
                        {church.district && (
                          <Text className={`text-xs mt-1 text-center ${
                            formData.church === church.id ? 'text-white/80' : 'text-gray-600'
                          }`} numberOfLines={1}>
                            {church.district}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
              {formData.church === null && churches.length > 0 && (
                <Text className="text-red-500 text-xs mt-1">Please select a church</Text>
              )}
            </View>

            {/* Amount */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-800 mb-2">Amount (TZS) *</Text>
              <TextInput
                ref={amountInputRef}
                className="border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800 bg-white"
                value={formData.amount}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9.]/g, '');
                  const parts = cleaned.split('.');
                  if (parts.length > 2) {
                    setFormData({...formData, amount: parts[0] + '.' + parts.slice(1).join('')});
                  } else {
                    setFormData({...formData, amount: cleaned});
                  }
                }}
                placeholder="Enter amount (e.g., 100000)"
                keyboardType="decimal-pad"
                placeholderTextColor="#95A5A6"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                selectionColor="#3498DB"
                onFocus={() => {
                  setTimeout(() => {
                    if (amountInputRef.current) {
                      amountInputRef.current.setNativeProps({
                        selection: { start: 0, end: formData.amount.length }
                      });
                    }
                  }, 100);
                }}
              />
              {formData.amount && !isNaN(parseFloat(formData.amount)) && parseFloat(formData.amount) > 0 && (
                <Text className="text-green-600 text-xs mt-1">
                  Amount: {formatCurrency(parseFloat(formData.amount))}
                </Text>
              )}
            </View>

            {/* Donation Type */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-800 mb-2">Donation Type *</Text>
              <View className="flex-row flex-wrap">
                {DONATION_TYPES.map(type => (
                  <TouchableOpacity
                    key={type.id}
                    className={`flex-row items-center px-4 py-2.5 rounded-lg mr-2 mb-2 ${
                      formData.donation_type === type.id ? 'border-2 border-white shadow-md' : ''
                    }`}
                    style={{ 
                      backgroundColor: formData.donation_type === type.id ? type.color : type.color + '20'
                    }}
                    onPress={() => setFormData({...formData, donation_type: type.id})}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name={type.icon as any} 
                      size={18} 
                      color={formData.donation_type === type.id ? '#FFFFFF' : type.color} 
                    />
                    <Text className={`ml-2 font-medium ${
                      formData.donation_type === type.id ? 'text-white' : 'text-gray-800'
                    }`}>
                      {type.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Direction */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-800 mb-2">Direction *</Text>
              <View className="flex-row flex-wrap">
                {DIRECTIONS.map(dir => (
                  <TouchableOpacity
                    key={dir.id}
                    className={`px-5 py-3 rounded-lg mr-2 mb-2 ${
                      formData.direction === dir.id ? 'border-2 border-white shadow-md' : ''
                    }`}
                    style={{ 
                      backgroundColor: formData.direction === dir.id ? dir.color : dir.color + '20'
                    }}
                    onPress={() => setFormData({...formData, direction: dir.id})}
                    activeOpacity={0.8}
                  >
                    <Text className={`font-medium ${
                      formData.direction === dir.id ? 'text-white' : 'text-gray-800'
                    }`}>
                      {dir.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Description */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-800 mb-2">Description (Optional)</Text>
              <TextInput
                ref={descriptionInputRef}
                className="border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800 min-h-[100px] bg-white"
                value={formData.description}
                onChangeText={(text) => setFormData({...formData, description: text})}
                placeholder="Enter description or notes..."
                multiline
                numberOfLines={4}
                placeholderTextColor="#95A5A6"
                autoCapitalize="sentences"
                autoCorrect={true}
                textAlignVertical="top"
                blurOnSubmit={true}
                returnKeyType="default"
                selectionColor="#3498DB"
              />
            </View>
          </ScrollView>

          <View className="flex-row p-5 border-t border-gray-200">
            <TouchableOpacity
              className="flex-1 py-3.5 rounded-lg items-center mr-2 bg-gray-100"
              onPress={() => {
                setShowForm(false);
                resetForm();
              }}
              activeOpacity={0.7}
            >
              <Text className="font-semibold text-base text-gray-800">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-1 py-3.5 rounded-lg items-center ml-2 bg-blue-600 disabled:bg-blue-300"
              onPress={editingDonation ? handleUpdateDonation : handleCreateDonation}
              disabled={!formData.user || !formData.church || !formData.amount || !formData.direction || processing}
              activeOpacity={0.7}
            >
              {processing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="font-semibold text-base text-white">
                  {editingDonation ? 'Update Donation' : 'Create Donation'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Donation Card Component
  const DonationCard = ({ donation }: { donation: Donation }) => {
    const isSelected = selectedDonations.includes(donation.id);
    const isExpanded = expandedDonation === donation.id;

    return (
      <View className={`bg-white rounded-xl mx-4 my-2 shadow-lg border-2 ${
        isSelected ? 'border-blue-600 bg-blue-50' : 'border-transparent'
      } ${isExpanded ? 'border-blue-300' : ''}`}>
        {showReceiptManager && (
          <TouchableOpacity
            className="absolute top-2 right-2 z-10 p-2"
            onPress={() => toggleDonationSelection(donation.id)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isSelected ? "checkbox" : "square-outline"} 
              size={22} 
              color={isSelected ? '#2E86C1' : '#7F8C8D'} 
            />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          onPress={() => {
            if (showReceiptManager) {
              toggleDonationSelection(donation.id);
            } else {
              toggleExpandedDonation(donation.id);
            }
          }}
          onLongPress={() => {
            Alert.alert(
              'Quick Actions',
              `Receipt: ${donation.receipt_number}`,
              [
                { 
                  text: 'View Details', 
                  onPress: () => toggleExpandedDonation(donation.id) 
                },
                { 
                  text: 'Edit', 
                  onPress: () => handleEditDonation(donation) 
                },
                { 
                  text: 'View Receipt', 
                  onPress: () => handleViewReceipt(donation) 
                },
                { 
                  text: 'Download Receipt', 
                  onPress: () => handleDownloadReceipt(donation) 
                },
                { 
                  text: 'Print Receipt', 
                  onPress: () => handlePrintReceipt(donation) 
                },
                { 
                  text: 'Regenerate Receipt', 
                  onPress: () => handleRegenerateReceipt(donation.id) 
                },
                { 
                  text: 'Delete', 
                  style: 'destructive', 
                  onPress: () => handleDeleteDonation(donation.id) 
                },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }}
          className="p-4"
          activeOpacity={0.8}
        >
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-row items-center flex-1">
              <View 
                className="w-10 h-10 rounded-full justify-center items-center mr-3"
                style={{ backgroundColor: getDonationTypeColor(donation.donation_type) }}
              >
                <Ionicons 
                  name={DONATION_TYPES.find(t => t.id === donation.donation_type)?.icon as any || 'receipt-outline'}
                  size={20} 
                  color="#FFFFFF" 
                />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-gray-800" numberOfLines={1}>
                  {donation.receipt_number}
                </Text>
                <Text className="text-sm text-gray-600 mt-0.5" numberOfLines={1}>
                  {donation.user_fullname}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-lg font-bold text-blue-600">
                {formatCurrency(parseFloat(donation.amount))}
              </Text>
              <Text className="text-xs text-gray-500 mt-0.5">
                {formatDate(donation.donation_date)}
              </Text>
            </View>
          </View>
          
          <View className="mb-2">
            <View className="flex-row items-center mb-2">
              <Ionicons name="business-outline" size={16} color="#7F8C8D" />
              <Text className="text-sm text-gray-600 ml-2 flex-1" numberOfLines={1}>
                {donation.church_name}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="compass-outline" size={16} color="#7F8C8D" />
              <Text className="text-sm text-gray-600 ml-2 flex-1" numberOfLines={1}>
                {getDirectionDisplay(donation.direction)}
              </Text>
            </View>
          </View>

          {/* Expanded Details */}
          {isExpanded && (
            <View className="mt-3 pt-3 border-t border-gray-100">
              <View className="flex-row flex-wrap mb-3">
                <View className="w-1/2 py-2">
                  <Text className="text-xs font-medium text-gray-500 mb-1">Zaka Amount</Text>
                  <Text className="text-sm font-semibold text-gray-800">
                    {formatCurrency(parseFloat(donation.zaka_amount))}
                  </Text>
                </View>
                <View className="w-1/2 py-2">
                  <Text className="text-xs font-medium text-gray-500 mb-1">Sadaka CTF</Text>
                  <Text className="text-sm font-semibold text-gray-800">
                    {formatCurrency(parseFloat(donation.sadaka_pamoja_ctf))}
                  </Text>
                </View>
                <View className="w-1/2 py-2">
                  <Text className="text-xs font-medium text-gray-500 mb-1">Sadaka Kanisa</Text>
                  <Text className="text-sm font-semibold text-gray-800">
                    {formatCurrency(parseFloat(donation.sadaka_pamoja_kanisa))}
                  </Text>
                </View>
                <View className="w-1/2 py-2">
                  <Text className="text-xs font-medium text-gray-500 mb-1">Total Kanisa</Text>
                  <Text className="text-sm font-semibold text-gray-800">
                    {formatCurrency(parseFloat(donation.jumla_fedha_kanisa))}
                  </Text>
                </View>
                <View className="w-1/2 py-2">
                  <Text className="text-xs font-medium text-gray-500 mb-1">Total CTF</Text>
                  <Text className="text-sm font-semibold text-gray-800">
                    {formatCurrency(parseFloat(donation.jumla_ya_fedha_ctf))}
                  </Text>
                </View>
                <View className="w-1/2 py-2">
                  <Text className="text-xs font-medium text-gray-500 mb-1">Grand Total</Text>
                  <Text className="text-sm font-bold text-blue-600">
                    {formatCurrency(parseFloat(donation.jumla_ya_fedha_zote))}
                  </Text>
                </View>
              </View>
              
              {donation.amount_in_words && (
                <View className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <Text className="text-xs font-medium text-gray-500 mb-1">Amount in Words:</Text>
                  <Text className="text-sm text-gray-700 italic">{donation.amount_in_words}</Text>
                </View>
              )}
              
              {donation.description && (
                <View className="mb-2">
                  <Text className="text-xs font-medium text-gray-500 mb-1">Description:</Text>
                  <Text className="text-sm text-gray-700">{donation.description}</Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>

        {!showReceiptManager && (
          <View className="flex-row justify-between border-t border-gray-100 pt-3 px-4 pb-3">
            <TouchableOpacity
              className="flex-row items-center px-3 py-2 rounded-lg"
              style={{ backgroundColor: '#3498DB20' }}
              onPress={() => toggleExpandedDonation(donation.id)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="#3498DB" 
              />
              <Text className="ml-1.5 text-xs font-semibold text-blue-600">
                {isExpanded ? 'Less Details' : 'More Details'}
              </Text>
            </TouchableOpacity>
            
            <View className="flex-row">
              <TouchableOpacity
                className="flex-row items-center px-3 py-2 rounded-lg mr-2"
                style={{ backgroundColor: '#27AE6020' }}
                onPress={() => handleDownloadReceipt(donation)}
                activeOpacity={0.7}
                disabled={processing}
              >
                <Ionicons name="download-outline" size={16} color="#27AE60" />
                <Text className="ml-1.5 text-xs font-semibold text-green-600">
                  Download
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-row items-center px-3 py-2 rounded-lg"
                style={{ backgroundColor: '#8E44AD20' }}
                onPress={() => handlePrintReceipt(donation)}
                activeOpacity={0.7}
                disabled={processing}
              >
                <Ionicons name="print-outline" size={16} color="#8E44AD" />
                <Text className="ml-1.5 text-xs font-semibold text-purple-600">
                  Print
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Loading state
  if (loading && donations.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#2E86C1" />
        <Text className="mt-4 text-base text-gray-500">Loading donations...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" backgroundColor="#2E86C1" />
      
      {/* Header */}
      <LinearGradient 
        colors={['#2E86C1', '#1A5276', '#154360']} 
        className="pt-12 pb-5 px-4"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View className="flex-row items-center mb-4">
          <TouchableOpacity 
            className="p-2" 
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View className="flex-1 ml-3">
            <Text className="text-xl font-bold text-white">Donations Management</Text>
            <Text className="text-sm text-white/80 mt-0.5">
              {donations.length} total donations
              {selectedDonations.length > 0 && ` | ${selectedDonations.length} selected`}
            </Text>
          </View>
          
          <TouchableOpacity
            className="w-12 h-12 rounded-full bg-white/20 justify-center items-center"
            onPress={() => setShowForm(true)}
            disabled={users.length === 0 || churches.length === 0}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={26} color="white" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-white rounded-xl px-4 py-3 shadow-md">
          <Ionicons name="search" size={20} color="#7F8C8D" />
          <TextInput
            className="flex-1 text-base text-gray-800 ml-3"
            placeholder="Search by receipt, donor, or church..."
            placeholderTextColor="#95A5A6"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
            selectionColor="#3498DB"
          />
          {searchQuery ? (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              className="ml-2"
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color="#7F8C8D" />
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>

      {/* Quick Stats */}
      <View className="flex-row px-4 py-4 bg-white border-b border-gray-200 shadow-sm">
        <View className="flex-1 items-center">
          <Text className="text-lg font-bold text-gray-800">{donations.length}</Text>
          <Text className="text-xs text-gray-500 mt-0.5">Total</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-lg font-bold text-gray-800">{users.length}</Text>
          <Text className="text-xs text-gray-500 mt-0.5">Users</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-lg font-bold text-gray-800">{churches.length}</Text>
          <Text className="text-xs text-gray-500 mt-0.5">Churches</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-lg font-bold text-green-600">
            {formatCurrency(donations.reduce((sum, d) => sum + parseFloat(d.amount), 0))}
          </Text>
          <Text className="text-xs text-gray-500 mt-0.5">Total Amount</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center py-3 rounded-xl mx-1 bg-blue-600 disabled:bg-blue-300"
          onPress={handleGenerateReport}
          disabled={processing || donations.length === 0}
          activeOpacity={0.8}
        >
          {processing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="document-text-outline" size={18} color="white" />
              <Text className="ml-2 font-semibold text-sm text-white">Report</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center py-3 rounded-xl mx-1 bg-green-600 disabled:bg-green-300"
          onPress={handleExportCSV}
          disabled={processing || donations.length === 0}
          activeOpacity={0.8}
        >
          {processing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="download-outline" size={18} color="white" />
              <Text className="ml-2 font-semibold text-sm text-white">Export</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center py-3 rounded-xl mx-1 bg-purple-600 disabled:bg-purple-300"
          onPress={() => setShowPrintOptions(true)}
          disabled={processing || donations.length === 0}
          activeOpacity={0.8}
        >
          <Ionicons name="print-outline" size={18} color="white" />
          <Text className="ml-2 font-semibold text-sm text-white">Print</Text>
        </TouchableOpacity>
      </View>

      {/* Receipt Management Bar */}
      {showReceiptManager ? (
        <View className="flex-row justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-300 shadow-sm">
          <View className="flex-row items-center">
            <TouchableOpacity 
              className="flex-row items-center p-2"
              onPress={toggleSelectAll}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={selectAll ? "checkbox" : "square-outline"} 
                size={22} 
                color={selectAll ? '#2E86C1' : '#2C3E50'} 
              />
              <Text className="ml-2 text-sm font-medium text-gray-800">
                {selectAll ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View className="flex-row items-center">
            <Text className="text-sm text-gray-500 mr-3">
              {selectedDonations.length} selected
            </Text>
            
            <TouchableOpacity
              className={`flex-row items-center px-4 py-2 rounded-lg mr-2 ${
                selectedDonations.length > 0 ? 'bg-green-600' : 'bg-gray-400'
              }`}
              onPress={handlePrintSelectedReceipts}
              disabled={selectedDonations.length === 0 || processing}
              activeOpacity={0.8}
            >
              <Ionicons name="print-outline" size={16} color="white" />
              <Text className="ml-1.5 font-medium text-xs text-white">
                Print ({selectedDonations.length})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="w-10 h-10 rounded-lg bg-red-500 justify-center items-center"
              onPress={() => {
                setShowReceiptManager(false);
                setSelectedDonations([]);
                setSelectAll(false);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          className="flex-row items-center justify-center py-3 bg-gray-50 border-b border-gray-300"
          onPress={() => setShowReceiptManager(true)}
          disabled={donations.length === 0}
          activeOpacity={0.7}
        >
          <Ionicons name="receipt-outline" size={18} color="#2E86C1" />
          <Text className="ml-2 text-sm font-medium text-blue-600">Manage Receipts</Text>
        </TouchableOpacity>
      )}

      {/* Donations List */}
      <FlatList
        data={filteredDonations}
        renderItem={({ item }) => <DonationCard donation={item} />}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2E86C1']}
            tintColor="#2E86C1"
            title="Pull to refresh"
            titleColor="#2E86C1"
          />
        }
        ListEmptyComponent={
          <View className="items-center py-20 px-10">
            <Ionicons name="receipt-outline" size={80} color="#ECF0F1" />
            <Text className="text-base text-gray-500 text-center mt-6 leading-6">
              {error ? error : searchQuery ? 'No donations match your search' : 'No donations found'}
            </Text>
            {error && (
              <TouchableOpacity
                className="mt-6 bg-blue-600 px-8 py-3 rounded-xl shadow-md"
                onPress={fetchAllData}
                activeOpacity={0.8}
              >
                <Text className="font-semibold text-base text-white">Retry Loading</Text>
              </TouchableOpacity>
            )}
            {(users.length === 0 || churches.length === 0) && !error && (
              <Text className="text-sm text-amber-600 text-center mt-4 italic">
                {users.length === 0 && churches.length === 0 
                  ? 'Please add users and churches first' 
                  : users.length === 0 
                  ? 'Please add users first' 
                  : 'Please add churches first'}
              </Text>
            )}
          </View>
        }
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          filteredDonations.length > 0 ? (
            <View className="px-4 pt-4 pb-2">
              <Text className="text-sm text-gray-500">
                Showing {filteredDonations.length} of {donations.length} donations
              </Text>
            </View>
          ) : null
        }
      />

      {/* Print Options Modal */}
      <Modal
        visible={showPrintOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPrintOptions(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-5">
          <View className="bg-white rounded-2xl w-full max-w-[400px] shadow-2xl">
            <View className="flex-row justify-between items-center p-5 border-b border-gray-200">
              <Text className="text-lg font-bold text-gray-800">Print Options</Text>
              <TouchableOpacity 
                onPress={() => setShowPrintOptions(false)}
                className="p-1"
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#2C3E50" />
              </TouchableOpacity>
            </View>
            
            <View className="p-5">
              <TouchableOpacity
                className="flex-row items-center py-4 border-b border-gray-100"
                onPress={() => {
                  setShowPrintOptions(false);
                  setShowReceiptManager(true);
                }}
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 rounded-full bg-blue-100 justify-center items-center mr-3">
                  <Ionicons name="list-outline" size={22} color="#2E86C1" />
                </View>
                <View className="flex-1 mr-2">
                  <Text className="text-base font-semibold text-gray-800 mb-0.5">Print Selected Receipts</Text>
                  <Text className="text-sm text-gray-500">Choose specific receipts to print</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#7F8C8D" />
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-row items-center py-4 border-b border-gray-100"
                onPress={() => {
                  setShowPrintOptions(false);
                  handlePrintAllReceipts();
                }}
                disabled={processing || donations.length === 0}
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 rounded-full bg-green-100 justify-center items-center mr-3">
                  <Ionicons name="print-outline" size={22} color="#27AE60" />
                </View>
                <View className="flex-1 mr-2">
                  <Text className="text-base font-semibold text-gray-800 mb-0.5">Print All Receipts</Text>
                  <Text className="text-sm text-gray-500">Print all {donations.length} receipts</Text>
                </View>
                {processing ? (
                  <ActivityIndicator size="small" color="#2E86C1" />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color="#7F8C8D" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-row items-center py-4"
                onPress={() => {
                  setShowPrintOptions(false);
                  handleGenerateReport();
                }}
                disabled={processing || donations.length === 0}
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 rounded-full bg-purple-100 justify-center items-center mr-3">
                  <Ionicons name="document-text-outline" size={22} color="#8E44AD" />
                </View>
                <View className="flex-1 mr-2">
                  <Text className="text-base font-semibold text-gray-800 mb-0.5">Print Summary Report</Text>
                  <Text className="text-sm text-gray-500">Generate and print summary report</Text>
                </View>
                {processing ? (
                  <ActivityIndicator size="small" color="#2E86C1" />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color="#7F8C8D" />
                )}
              </TouchableOpacity>
            </View>
            
            <View className="p-5 border-t border-gray-200">
              <TouchableOpacity
                className="py-3.5 rounded-xl items-center bg-gray-100"
                onPress={() => setShowPrintOptions(false)}
                activeOpacity={0.7}
              >
                <Text className="font-semibold text-base text-gray-800">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Donation Form Modal */}
      <DonationForm />

      {/* Processing Overlay */}
      {processing && (
        <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/60 justify-center items-center">
          <View className="bg-white rounded-2xl p-8 items-center shadow-2xl">
            <ActivityIndicator size="large" color="#2E86C1" />
            <Text className="mt-4 text-lg font-medium text-gray-800">Processing...</Text>
            <Text className="mt-2 text-sm text-gray-500 text-center">Please wait</Text>
          </View>
        </View>
      )}

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-center items-center">
          <View className="bg-white rounded-2xl p-8 items-center w-4/5 shadow-2xl">
            <Ionicons name="checkmark-circle" size={60} color="#27AE60" />
            <Text className="text-xl font-bold text-gray-800 mt-4">Success!</Text>
            <Text className="text-base text-gray-500 text-center mt-2 mb-6">{successMessage}</Text>
            
            <TouchableOpacity
              className="px-12 py-3 bg-blue-600 rounded-xl shadow-md"
              onPress={() => setShowSuccessModal(false)}
              activeOpacity={0.8}
            >
              <Text className="font-semibold text-base text-white">Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}