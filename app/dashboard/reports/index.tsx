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
import { useRouter, useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as LegacyFileSystem from 'expo-file-system/legacy'; // Use legacy API
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

// Type definitions based on backend models
interface User {
  id: number;
  fullname: string;
  mobile_number: string;
  email?: string;
  membership_number?: string;
  region?: string;
  district?: string;
}

interface Watoaji {
  id: number;
  doner: number;
  amount: string;
  jumla_ya_fedha_kwa_maneno: string;
  church: string;
  date: string;
  doner_details?: User;
}

interface Zaka {
  id: number;
  donation: number;
  doner: number;
  amount: string;
  jumla_kwa_maneno: string;
  donation_details?: Watoaji;
  doner_details?: User;
}

interface ZakaNaSadaka {
  id: number;
  donation: number;
  amount: string;
  zaka_amount: string;
  remain: string;
  ctf_sadaka: string;
  kanisa_mahalia_sadaka: string;
  doner: number;
  donation_details?: Watoaji;
  doner_details?: User;
}

interface Sadaka {
  id: number;
  donation: number;
  amount: string;
  ctf_sadaka: string;
  kanisa_mahalia_sadaka: string;
  doner: number;
  donation_details?: Watoaji;
  doner_details?: User;
}

interface Nyingine {
  id: number;
  donation: number;
  amount: string;
  percent: string;
  ctf_percent: string;
  kanisa_mahalia_percent: string;
  ctf_amount: string;
  kanisa_mahalia_amount: string;
  contribution_type: string;
  custom_contribution_type: string;
  contribution_type_display: string;
  doner: number;
  date: string;
  sadaka_name: string;
  description: string;
  donation_details?: Watoaji;
  doner_details?: User;
}

interface Report {
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
    doner_details?: User; // Fixed: Added doner_details here
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

interface DonationFormData {
  doner: number | null;
  church: string;
  amount: string;
  donation_type: 'zaka' | 'zaka_na_sadaka' | 'sadaka' | 'nyingine'; // Fixed type
  direction?: 'CTF' | 'KANISA_MAHALIA' | 'MTAA';
  description?: string;
  sadaka_name?: string;
  percent?: string;
  ctf_percent?: string;
  kanisa_mahalia_percent?: string;
  contribution_type?: string;
  custom_contribution_type?: string;
}

// API Configuration
const API_BASE_URL = 'https://mhazini.pythonanywhere.com';
const USERS_API = `${API_BASE_URL}/api/auth/users/`;
const WATOAJI_API = `${API_BASE_URL}/api/auth/watoaji/`;
const ZAKA_API = `${API_BASE_URL}/api/auth/zaka/`;
const ZAKA_NA_SADAKA_API = `${API_BASE_URL}/api/auth/zaka-na-sadaka/`;
const SADAKA_API = `${API_BASE_URL}/api/auth/sadaka/`;
const NYINGINE_API = `${API_BASE_URL}/api/auth/nyingine/`;
const REPORTS_API = `${API_BASE_URL}/api/auth/reports/`;
const SUMMARY_API = `${API_BASE_URL}/api/auth/reports/total/summary/`;

// Storage keys
const STORAGE_KEYS = {
  WATOAJI: 'watoaji_data',
  ZAKA: 'zaka_data',
  ZAKA_NA_SADAKA: 'zaka_na_sadaka_data',
  SADAKA: 'sadaka_data',
  NYINGINE: 'nyingine_data',
  REPORTS: 'reports_data',
  LAST_SYNC: 'last_sync_timestamp',
};

// Constants
const DONATION_TYPES = [
  { id: 'zaka', name: 'Zaka', color: '#27AE60', icon: 'cash-outline', api: ZAKA_API },
  { id: 'zaka_na_sadaka', name: 'Zaka na Sadaka', color: '#3498DB', icon: 'wallet-outline', api: ZAKA_NA_SADAKA_API },
  { id: 'sadaka', name: 'Sadaka', color: '#8E44AD', icon: 'heart-outline', api: SADAKA_API },
  { id: 'nyingine', name: 'Nyingine', color: '#F39C12', icon: 'ellipsis-horizontal-outline', api: NYINGINE_API },
];

const CONTRIBUTION_TYPES = [
  { id: 'sadaka', name: 'Sadaka' },
  { id: 'michango', name: 'Michango' },
  { id: 'zawadi', name: 'Zawadi' },
  { id: 'matumizi', name: 'Matumizi Maalum' },
  { id: 'nyingine', name: 'Nyingine' },
];

const { width, height } = Dimensions.get('window');

export default function DonationsManagementScreen() {
  const router = useRouter();
  
  // State management
  const [watoaji, setWatoaji] = useState<Watoaji[]>([]);
  const [zaka, setZaka] = useState<Zaka[]>([]);
  const [zakaNaSadaka, setZakaNaSadaka] = useState<ZakaNaSadaka[]>([]);
  const [sadaka, setSadaka] = useState<Sadaka[]>([]);
  const [nyingine, setNyingine] = useState<Nyingine[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [showReceiptManager, setShowReceiptManager] = useState(false);
  const [selectedReports, setSelectedReports] = useState<string[]>([]); // stakabaadhi_no
  const [selectAll, setSelectAll] = useState(false);
  const [expandedDonation, setExpandedDonation] = useState<string | null>(null); // Changed to string
  const [appState, setAppState] = useState(AppState.currentState);
  const [summary, setSummary] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState<DonationFormData>({
    doner: null,
    church: '',
    amount: '',
    donation_type: 'sadaka',
    description: '',
    sadaka_name: '',
    percent: '100',
    ctf_percent: '58',
    kanisa_mahalia_percent: '42',
    contribution_type: 'sadaka',
    custom_contribution_type: '',
  });

  // Refs
  const amountInputRef = useRef<TextInput>(null);
  const isMountedRef = useRef(true);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        fetchAllData();
      }
      setAppState(nextAppState);
    });

    return () => {
      isMountedRef.current = false;
      subscription.remove();
    };
  }, [appState]);

  // Initial load
  useEffect(() => {
    fetchAllData();
  }, []);

  // Load from local storage
  const loadLocalData = async () => {
    try {
      const [
        watoajiData,
        zakaData,
        zakaNaSadakaData,
        sadakaData,
        nyingineData,
        reportsData,
        usersData,
        summaryData,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.WATOAJI),
        AsyncStorage.getItem(STORAGE_KEYS.ZAKA),
        AsyncStorage.getItem(STORAGE_KEYS.ZAKA_NA_SADAKA),
        AsyncStorage.getItem(STORAGE_KEYS.SADAKA),
        AsyncStorage.getItem(STORAGE_KEYS.NYINGINE),
        AsyncStorage.getItem(STORAGE_KEYS.REPORTS),
        AsyncStorage.getItem('users_data'),
        AsyncStorage.getItem('summary_data'),
      ]);

      if (watoajiData) setWatoaji(JSON.parse(watoajiData));
      if (zakaData) setZaka(JSON.parse(zakaData));
      if (zakaNaSadakaData) setZakaNaSadaka(JSON.parse(zakaNaSadakaData));
      if (sadakaData) setSadaka(JSON.parse(sadakaData));
      if (nyingineData) setNyingine(JSON.parse(nyingineData));
      if (reportsData) setReports(JSON.parse(reportsData));
      if (usersData) setUsers(JSON.parse(usersData));
      if (summaryData) setSummary(JSON.parse(summaryData));
    } catch (error) {
      console.error('Error loading local data:', error);
    }
  };

  // Save to local storage
  const saveLocalData = async (data: any, key: string) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving to ${key}:`, error);
    }
  };

  // Fetch all data from server
  const fetchAllData = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [
        usersResponse,
        watoajiResponse,
        zakaResponse,
        zakaNaSadakaResponse,
        sadakaResponse,
        nyingineResponse,
        reportsResponse,
        summaryResponse,
      ] = await Promise.allSettled([
        fetch(USERS_API),
        fetch(WATOAJI_API),
        fetch(ZAKA_API),
        fetch(ZAKA_NA_SADAKA_API),
        fetch(SADAKA_API),
        fetch(NYINGINE_API),
        fetch(REPORTS_API),
        fetch(SUMMARY_API),
      ]);

      // Process users
      if (usersResponse.status === 'fulfilled' && usersResponse.value.ok) {
        const usersData = await usersResponse.value.json();
        const usersArray = Array.isArray(usersData) ? usersData : usersData.results || [];
        setUsers(usersArray);
        await saveLocalData(usersArray, 'users_data');
      }

      // Process Watoaji
      if (watoajiResponse.status === 'fulfilled' && watoajiResponse.value.ok) {
        const watoajiData = await watoajiResponse.value.json();
        const watoajiArray = Array.isArray(watoajiData) ? watoajiData : watoajiData.results || [];
        setWatoaji(watoajiArray);
        await saveLocalData(watoajiArray, STORAGE_KEYS.WATOAJI);
      }

      // Process Zaka
      if (zakaResponse.status === 'fulfilled' && zakaResponse.value.ok) {
        const zakaData = await zakaResponse.value.json();
        const zakaArray = Array.isArray(zakaData) ? zakaData : zakaData.results || [];
        setZaka(zakaArray);
        await saveLocalData(zakaArray, STORAGE_KEYS.ZAKA);
      }

      // Process ZakaNaSadaka
      if (zakaNaSadakaResponse.status === 'fulfilled' && zakaNaSadakaResponse.value.ok) {
        const zakaNaSadakaData = await zakaNaSadakaResponse.value.json();
        const zakaNaSadakaArray = Array.isArray(zakaNaSadakaData) ? zakaNaSadakaData : zakaNaSadakaData.results || [];
        setZakaNaSadaka(zakaNaSadakaArray);
        await saveLocalData(zakaNaSadakaArray, STORAGE_KEYS.ZAKA_NA_SADAKA);
      }

      // Process Sadaka
      if (sadakaResponse.status === 'fulfilled' && sadakaResponse.value.ok) {
        const sadakaData = await sadakaResponse.value.json();
        const sadakaArray = Array.isArray(sadakaData) ? sadakaData : sadakaData.results || [];
        setSadaka(sadakaArray);
        await saveLocalData(sadakaArray, STORAGE_KEYS.SADAKA);
      }

      // Process Nyingine
      if (nyingineResponse.status === 'fulfilled' && nyingineResponse.value.ok) {
        const nyingineData = await nyingineResponse.value.json();
        const nyingineArray = Array.isArray(nyingineData) ? nyingineData : nyingineData.results || [];
        setNyingine(nyingineArray);
        await saveLocalData(nyingineArray, STORAGE_KEYS.NYINGINE);
      }

      // Process Reports - Fixed to handle nested doner_details
      if (reportsResponse.status === 'fulfilled' && reportsResponse.value.ok) {
        const reportsData = await reportsResponse.value.json();
        const reportsArray = Array.isArray(reportsData) ? reportsData : reportsData.results || [];
        
        // Process reports to ensure doner_details is accessible
        const processedReports = reportsArray.map((report: any) => {
          // If doner_details is nested in donation_details, flatten it
          if (report.donation_details && report.donation_details.doner_details) {
            return {
              ...report,
              donation_details: {
                ...report.donation_details,
                doner_name: report.donation_details.doner_details?.fullname || 'Unknown',
                doner_membership: report.donation_details.doner_details?.membership_number || '',
              }
            };
          }
          return report;
        });
        
        setReports(processedReports);
        await saveLocalData(processedReports, STORAGE_KEYS.REPORTS);
      }

      // Process Summary
      if (summaryResponse.status === 'fulfilled' && summaryResponse.value.ok) {
        const summaryData = await summaryResponse.value.json();
        setSummary(summaryData);
        await saveLocalData(summaryData, 'summary_data');
      }

      // Update last sync time
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
      setError(null);

    } catch (error: any) {
      console.error('Fetch error:', error);
      setError('Using locally stored data. Connect to sync with server.');
      await loadLocalData();
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllData();
  }, [fetchAllData]);

  // Create Watoaji (donation)
  const createWatoaji = async (donationData: any) => {
    try {
      const response = await fetch(WATOAJI_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(donationData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create donation: ${errorText}`);
      }

      const newWatoaji = await response.json();
      
      // Update local state
      setWatoaji(prev => [newWatoaji, ...prev]);
      await saveLocalData([newWatoaji, ...watoaji], STORAGE_KEYS.WATOAJI);
      
      // Create specific donation type based on selection
      await createDonationType(newWatoaji.id);
      
      // Generate report automatically
      await generateReport(newWatoaji.id);
      
      return newWatoaji;
    } catch (error: any) {
      console.error('Create watoaji error:', error);
      throw error;
    }
  };

  // Create specific donation type
  const createDonationType = async (watoajiId: number) => {
    const donationType = formData.donation_type;
    
    try {
      let apiUrl, payload;
      
      switch (donationType) {
        case 'zaka':
          apiUrl = ZAKA_API;
          payload = { donation: watoajiId };
          break;
          
        case 'zaka_na_sadaka':
          apiUrl = ZAKA_NA_SADAKA_API;
          payload = { donation: watoajiId };
          break;
          
        case 'sadaka':
          apiUrl = SADAKA_API;
          payload = { donation: watoajiId };
          break;
          
        case 'nyingine':
          apiUrl = NYINGINE_API;
          payload = {
            donation: watoajiId,
            sadaka_name: formData.sadaka_name || 'Sadaka',
            description: formData.description || '',
            contribution_type: formData.contribution_type,
            custom_contribution_type: formData.custom_contribution_type,
            percent: formData.percent || '100',
            ctf_percent: formData.ctf_percent || '58',
            kanisa_mahalia_percent: formData.kanisa_mahalia_percent || '42',
          };
          break;
          
        default:
          throw new Error('Invalid donation type');
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to create ${donationType}:`, errorText);
      }
      
    } catch (error) {
      console.error(`Error creating ${donationType}:`, error);
    }
  };

  // Generate report for donation
  const generateReport = async (watoajiId: number) => {
    try {
      const response = await fetch(REPORTS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          donation: watoajiId,
          maelezo: formData.description || 'barikiwa sana',
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to generate report:', errorText);
      } else {
        const newReport = await response.json();
        setReports(prev => [newReport, ...prev]);
        await saveLocalData([newReport, ...reports], STORAGE_KEYS.REPORTS);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  // Handle create donation
  const handleCreateDonation = async () => {
    try {
      if (!formData.doner || !formData.church || !formData.amount) {
        Alert.alert('Validation Error', 'Please fill in all required fields');
        return;
      }

      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Validation Error', 'Please enter a valid amount');
        return;
      }

      if (formData.donation_type === 'nyingine' && !formData.sadaka_name) {
        Alert.alert('Validation Error', 'Please enter sadaka/mchango name');
        return;
      }

      setProcessing(true);

      // Create Watoaji
      const watoajiData = {
        doner: formData.doner,
        church: formData.church,
        amount: amount.toString(),
      };

      await createWatoaji(watoajiData);

      setShowForm(false);
      resetForm();
      showSuccess('Donation created and receipt generated successfully!');
      
      // Refresh data
      fetchAllData();
      
    } catch (error: any) {
      console.error('Create donation error:', error);
      Alert.alert('Error', error.message || 'Failed to create donation. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      doner: null,
      church: '',
      amount: '',
      donation_type: 'sadaka',
      description: '',
      sadaka_name: '',
      percent: '100',
      ctf_percent: '58',
      kanisa_mahalia_percent: '42',
      contribution_type: 'sadaka',
      custom_contribution_type: '',
    });
  };

  // Download receipt - Fixed FileSystem API
  const handleDownloadReceipt = async (report: Report) => {
    try {
      setProcessing(true);
      
      const downloadUrl = `${API_BASE_URL}${report.pdf_download_url}`;
      const filename = `stakabaadhi_${report.stakabaadhi_no}.pdf`;
      
      // Use legacy FileSystem API
      const downloadResult = await LegacyFileSystem.downloadAsync(
        downloadUrl,
        LegacyFileSystem.cacheDirectory + filename
      );
      
      if (downloadResult.status === 200) {
        showSuccess('Receipt downloaded successfully!');
        
        // Share the file
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Share Receipt',
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert('Download Complete', `Receipt saved to: ${downloadResult.uri}`, [
            { text: 'OK' }
          ]);
        }
      } else {
        throw new Error(`Download failed: ${downloadResult.status}`);
      }
      
    } catch (error: any) {
      console.error('Download error:', error);
      Alert.alert('Error', error.message || 'Failed to download receipt. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Print receipt - Fixed FileSystem API
  const handlePrintReceipt = async (report: Report) => {
    try {
      setProcessing(true);
      
      const printUrl = `${API_BASE_URL}${report.pdf_print_url}`;
      
      // First download the PDF using legacy API
      const filename = `stakabaadhi_${report.stakabaadhi_no}_print.pdf`;
      const downloadResult = await LegacyFileSystem.downloadAsync(
        printUrl,
        LegacyFileSystem.cacheDirectory + filename
      );
      
      if (downloadResult.status === 200) {
        // Print the PDF
        await Print.printAsync({
          uri: downloadResult.uri,
        });
        
        showSuccess('Receipt sent to printer!');
      } else {
        throw new Error(`Failed to get PDF: ${downloadResult.status}`);
      }
      
    } catch (error: any) {
      console.error('Print error:', error);
      Alert.alert('Error', error.message || 'Failed to print receipt. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Batch download receipts - Fixed FileSystem API
  const handleBatchDownload = async () => {
    if (selectedReports.length === 0) {
      Alert.alert('No Selection', 'Please select receipts to download.');
      return;
    }

    try {
      setProcessing(true);
      
      const selectedReportDetails = reports.filter(r => 
        selectedReports.includes(r.stakabaadhi_no)
      );

      // Create HTML for batch receipts
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @media print {
              .page-break {
                page-break-after: always;
              }
            }
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
            <h2>BATCH RECEIPTS - SEVENTH-DAY ADVENTIST CHURCH</h2>
            <h3>CENTRAL TANZANIA FIELD (CTF)</h3>
            <p>P.O. BOX 474, DODOMA | TANZANIA</p>
            <p>Total Receipts: ${selectedReports.length} | Date: ${new Date().toLocaleDateString()}</p>
          </div>
      `;

      selectedReportDetails.forEach((report, index) => {
        // Get donor name correctly
        const donorName = report.donation_details?.doner_name || 
                         report.donation_details?.doner_details?.fullname || 
                         'Unknown Donor';
        
        htmlContent += `
          <div class="receipt-container">
            <div class="header">
              <h3>SEVENTH-DAY ADVENTIST CHURCH</h3>
              <h4>CENTRAL TANZANIA FIELD (CTF)</h4>
              <p>P.O. BOX 474, DODOMA | TANZANIA</p>
              <h4>STAKABADHI YA KUPOKEA FEDHA</h4>
              <p><strong>STAKABADHI NO:</strong> ${report.formatted_stakabaadhi_no}</p>
              <p><strong>Risiti Namba:</strong> ${report.receipt_number}</p>
            </div>
            
            <div class="receipt-info">
              <h4>TAARIFA ZA MTOAJI</h4>
              <p><strong>Nimepokea toka kwa:</strong> ${donorName}</p>
              <p><strong>Kanisa la:</strong> ${report.kanisa}</p>
              <p><strong>Jumla ya fedha kwa maneno:</strong> ${report.jumla_ya_fedha_kwa_maneno.toUpperCase()}</p>
              <p><strong>Tarehe:</strong> ${new Date(report.tarehe).toLocaleDateString('en-GB')}</p>
              <p><strong>Sahihi:</strong> _________________________</p>
            </div>
            
            <div class="amount-breakdown">
              <h4>MCHANGANUO WA FEDHA</h4>
              <p><strong>ZAKA:</strong> ${parseFloat(report.zaka).toLocaleString()} TZS</p>
              <p><strong>SADAKA YA PAMOJA CTF (58%):</strong> ${parseFloat(report.sadaka_pamoja_ctf).toLocaleString()} TZS</p>
              <p><strong>JUMLA YA FEDHA CTF:</strong> ${parseFloat(report.jumla_ya_fedha_ctf).toLocaleString()} TZS</p>
              <p><strong>SADAKA PAMOJA KANISA MAHALIA (42%):</strong> ${parseFloat(report.sadaka_pamoja_kanisa).toLocaleString()} TZS</p>
              <p><strong>JUMLA YA FEDHA KANISA MAHALIA:</strong> ${parseFloat(report.jumla_ya_fedha_kanisa_mahalia).toLocaleString()} TZS</p>
              <p><strong>JUMLA YA FEDHA ZOTE:</strong> ${parseFloat(report.jumla_ya_fedha_zote).toLocaleString()} TZS</p>
            </div>
            
            <div class="footer">
              <p>BARIKIWA SANA!</p>
              <p>Generated by CTF Donation System</p>
            </div>
          </div>
          
          ${index < selectedReportDetails.length - 1 ? '<div class="page-break"></div>' : ''}
        `;
      });

      htmlContent += `</body></html>`;
      
      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
      });
      
      showSuccess(`${selectedReports.length} receipt(s) generated successfully!`);
      
      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Batch Receipts',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Batch Generated', `Batch PDF saved to: ${uri}`, [
          { 
            text: 'Open', 
            onPress: async () => {
              try {
                await Linking.openURL(uri);
              } catch (error) {
                console.error('Error opening file:', error);
              }
            }
          },
          { text: 'OK' }
        ]);
      }
      
      // Clear selection
      setSelectedReports([]);
      setSelectAll(false);
      
    } catch (error: any) {
      console.error('Batch download error:', error);
      Alert.alert('Error', error.message || 'Failed to generate batch receipts. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Batch print receipts
  const handleBatchPrint = async () => {
    if (selectedReports.length === 0) {
      Alert.alert('No Selection', 'Please select receipts to print.');
      return;
    }

    try {
      setProcessing(true);
      
      const selectedReportDetails = reports.filter(r => 
        selectedReports.includes(r.stakabaadhi_no)
      );

      // Create HTML for batch printing
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @media print {
              .page-break {
                page-break-after: always;
              }
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0;
              padding: 20px;
              font-size: 14px;
            }
            .receipt {
              border: 2px solid #000;
              padding: 20px;
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .section {
              margin-bottom: 15px;
            }
            .amount-row {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
            }
            .total-row {
              font-weight: bold;
              border-top: 1px solid #000;
              padding-top: 10px;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
      `;

      selectedReportDetails.forEach((report, index) => {
        // Get donor name correctly
        const donorName = report.donation_details?.doner_name || 
                         report.donation_details?.doner_details?.fullname || 
                         'Unknown Donor';
        
        htmlContent += `
          <div class="receipt">
            <div class="header">
              <h2>SEVENTH-DAY ADVENTIST CHURCH</h2>
              <h3>CENTRAL TANZANIA FIELD (CTF)</h3>
              <p>P.O. BOX 474, DODOMA | TANZANIA</p>
              <p><strong>STAKABADHI NO:</strong> ${report.formatted_stakabaadhi_no}</p>
              <p><strong>Risiti Namba:</strong> ${report.receipt_number}</p>
            </div>
            
            <div class="section">
              <h4>TAARIFA ZA MTOAJI</h4>
              <div class="amount-row">
                <span>Nimepokea toka kwa:</span>
                <span>${donorName}</span>
              </div>
              <div class="amount-row">
                <span>Kanisa la:</span>
                <span>${report.kanisa}</span>
              </div>
              <div class="amount-row">
                <span>Jumla ya fedha kwa maneno:</span>
                <span>${report.jumla_ya_fedha_kwa_maneno.toUpperCase()}</span>
              </div>
              <div class="amount-row">
                <span>Tarehe:</span>
                <span>${new Date(report.tarehe).toLocaleDateString('en-GB')}</span>
              </div>
              <div class="amount-row">
                <span>Sahihi:</span>
                <span>_________________________</span>
              </div>
            </div>
            
            <div class="section">
              <h4>MCHANGANUO WA FEDHA</h4>
              <div class="amount-row">
                <span>ZAKA:</span>
                <span>${parseFloat(report.zaka).toLocaleString()} TZS</span>
              </div>
              <div class="amount-row">
                <span>SADAKA YA PAMOJA CTF (58%):</span>
                <span>${parseFloat(report.sadaka_pamoja_ctf).toLocaleString()} TZS</span>
              </div>
              <div class="amount-row total-row">
                <span>JUMLA YA FEDHA CTF:</span>
                <span>${parseFloat(report.jumla_ya_fedha_ctf).toLocaleString()} TZS</span>
              </div>
              <div class="amount-row">
                <span>SADAKA PAMOJA KANISA MAHALIA (42%):</span>
                <span>${parseFloat(report.sadaka_pamoja_kanisa).toLocaleString()} TZS</span>
              </div>
              <div class="amount-row total-row">
                <span>JUMLA YA FEDHA KANISA MAHALIA:</span>
                <span>${parseFloat(report.jumla_ya_fedha_kanisa_mahalia).toLocaleString()} TZS</span>
              </div>
              <div class="amount-row total-row" style="font-size: 16px;">
                <span>JUMLA YA FEDHA ZOTE:</span>
                <span>${parseFloat(report.jumla_ya_fedha_zote).toLocaleString()} TZS</span>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; font-size: 16px; font-weight: bold;">
              BARIKIWA SANA!
            </div>
          </div>
          
          ${index < selectedReportDetails.length - 1 ? '<div class="page-break"></div>' : ''}
        `;
      });

      htmlContent += `</body></html>`;
      
      // Print directly
      await Print.printAsync({
        html: htmlContent,
      });
      
      showSuccess(`${selectedReports.length} receipt(s) printed successfully!`);
      
      // Clear selection
      setSelectedReports([]);
      setSelectAll(false);
      
    } catch (error: any) {
      console.error('Batch print error:', error);
      Alert.alert('Error', error.message || 'Failed to print receipts. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Export to CSV - Fixed FileSystem API
  const handleExportCSV = async () => {
    try {
      setProcessing(true);
      
      let csvContent = "Data,Value\n";
      
      // Add summary data
      if (summary) {
        csvContent += `Total Donations,${summary.summary?.total_donations || 0}\n`;
        csvContent += `Total Amount,${summary.summary?.total_amount || 0}\n`;
        csvContent += `Total Zaka,${summary.summary?.total_zaka || 0}\n`;
        csvContent += `Total CTF,${summary.summary?.total_ctf || 0}\n`;
        csvContent += `Total Church,${summary.summary?.total_church || 0}\n`;
        csvContent += `Total All,${summary.summary?.total_all || 0}\n\n`;
      }
      
      // Add report details
      csvContent += "\nRECEIPTS DETAILS\n";
      csvContent += "Stakabadhi No,Receipt Number,Donor Name,Church,Amount,Zaka,CTF Sadaka,Church Sadaka,Total CTF,Total Church,Grand Total,Date\n";
      
      reports.forEach(report => {
        // Get donor name correctly
        const donorName = report.donation_details?.doner_name || 
                         report.donation_details?.doner_details?.fullname || 
                         'Unknown';
        const date = new Date(report.tarehe).toLocaleDateString();
        
        csvContent += `"${report.formatted_stakabaadhi_no}","${report.receipt_number}","${donorName}","${report.kanisa}",${report.donation_details?.amount || '0'},${report.zaka},${report.sadaka_pamoja_ctf},${report.sadaka_pamoja_kanisa},${report.jumla_ya_fedha_ctf},${report.jumla_ya_fedha_kanisa_mahalia},${report.jumla_ya_fedha_zote},"${date}"\n`;
      });
      
      // Create file using legacy API
      const filename = `donations_export_${Date.now()}.csv`;
      const fileUri = LegacyFileSystem.cacheDirectory + filename;
      
      // Use legacy FileSystem API
      await LegacyFileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: LegacyFileSystem.EncodingType.UTF8,
      });
      
      showSuccess('CSV exported successfully!');
      
      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Donations',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('Export Complete', `CSV saved to: ${fileUri}`, [
          { text: 'OK' }
        ]);
      }
      
    } catch (error: any) {
      console.error('Export error:', error);
      Alert.alert('Error', error.message || 'Failed to export CSV. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Regenerate receipt
  const handleRegenerateReceipt = async (report: Report) => {
    try {
      setProcessing(true);
      
      const response = await fetch(`${REPORTS_API}${report.stakabaadhi_no}/generate_pdf/`, {
        method: 'POST',
      });
      
      if (response.ok) {
        showSuccess('Receipt regenerated successfully!');
        fetchAllData(); // Refresh data
      } else {
        throw new Error('Failed to regenerate receipt');
      }
      
    } catch (error: any) {
      console.error('Regenerate error:', error);
      Alert.alert('Error', error.message || 'Failed to regenerate receipt. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Toggle report selection
  const toggleReportSelection = (stakabaadhiNo: string) => {
    setSelectedReports(prev => 
      prev.includes(stakabaadhiNo) 
        ? prev.filter(id => id !== stakabaadhiNo)
        : [...prev, stakabaadhiNo]
    );
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedReports([]);
    } else {
      const allIds = reports.map(r => r.stakabaadhi_no);
      setSelectedReports(allIds);
    }
    setSelectAll(!selectAll);
  };

  // Format currency
  const formatCurrency = (amount: string | number): string => {
    try {
      const num = typeof amount === 'string' ? parseFloat(amount) : amount;
      return new Intl.NumberFormat('en-TZ', {
        style: 'currency',
        currency: 'TZS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
    } catch {
      return 'TZS 0.00';
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-GB');
    } catch {
      return dateString;
    }
  };

  // Success message handler
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 3000);
  };

  // Filter reports based on active tab
  const filteredReports = reports.filter(report => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const donorName = report.donation_details?.doner_name || 
                       report.donation_details?.doner_details?.fullname || 
                       '';
      return (
        report.formatted_stakabaadhi_no.toLowerCase().includes(query) ||
        report.receipt_number.toLowerCase().includes(query) ||
        report.kanisa.toLowerCase().includes(query) ||
        donorName.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Get donor name from report
  const getDonorName = (report: Report): string => {
    return report.donation_details?.doner_name || 
           report.donation_details?.doner_details?.fullname || 
           'Unknown Donor';
  };

  // Report Card Component
  const ReportCard = ({ report }: { report: Report }) => {
    const isSelected = selectedReports.includes(report.stakabaadhi_no);
    const isExpanded = expandedDonation === report.stakabaadhi_no;
    const donorName = getDonorName(report);

    return (
      <View className={`bg-white rounded-xl mx-4 my-2 shadow-lg border-2 ${
        isSelected ? 'border-blue-600 bg-blue-50' : 'border-transparent'
      } ${isExpanded ? 'border-blue-300' : ''}`}>
        {showReceiptManager && (
          <TouchableOpacity
            className="absolute top-2 right-2 z-10 p-2"
            onPress={() => toggleReportSelection(report.stakabaadhi_no)}
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
              toggleReportSelection(report.stakabaadhi_no);
            } else {
              setExpandedDonation(isExpanded ? null : report.stakabaadhi_no);
            }
          }}
          className="p-4"
          activeOpacity={0.8}
        >
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-full bg-blue-100 justify-center items-center mr-3">
                <Ionicons name="receipt-outline" size={20} color="#2E86C1" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-gray-800" numberOfLines={1}>
                  {report.formatted_stakabaadhi_no}
                </Text>
                <Text className="text-sm text-gray-600 mt-0.5" numberOfLines={1}>
                  {report.receipt_number}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-lg font-bold text-blue-600">
                {formatCurrency(report.jumla_ya_fedha_zote)}
              </Text>
              <Text className="text-xs text-gray-500 mt-0.5">
                {formatDate(report.tarehe)}
              </Text>
            </View>
          </View>
          
          <View className="mb-2">
            <View className="flex-row items-center mb-2">
              <Ionicons name="person-outline" size={16} color="#7F8C8D" />
              <Text className="text-sm text-gray-600 ml-2 flex-1" numberOfLines={1}>
                {donorName}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="business-outline" size={16} color="#7F8C8D" />
              <Text className="text-sm text-gray-600 ml-2 flex-1" numberOfLines={1}>
                {report.kanisa}
              </Text>
            </View>
          </View>

          {/* Expanded Details */}
          {isExpanded && (
            <View className="mt-3 pt-3 border-t border-gray-100">
              <View className="mb-3">
                <Text className="text-xs font-medium text-gray-500 mb-1">Amount Breakdown</Text>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm text-gray-600">Zaka:</Text>
                  <Text className="text-sm font-semibold text-gray-800">
                    {formatCurrency(report.zaka)}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm text-gray-600">CTF Sadaka (58%):</Text>
                  <Text className="text-sm font-semibold text-gray-800">
                    {formatCurrency(report.sadaka_pamoja_ctf)}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm text-gray-600">Church Sadaka (42%):</Text>
                  <Text className="text-sm font-semibold text-gray-800">
                    {formatCurrency(report.sadaka_pamoja_kanisa)}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-1 pt-2 border-t border-gray-200">
                  <Text className="text-sm font-semibold text-gray-700">Total CTF:</Text>
                  <Text className="text-sm font-bold text-blue-600">
                    {formatCurrency(report.jumla_ya_fedha_ctf)}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm font-semibold text-gray-700">Total Church:</Text>
                  <Text className="text-sm font-bold text-green-600">
                    {formatCurrency(report.jumla_ya_fedha_kanisa_mahalia)}
                  </Text>
                </View>
              </View>
              
              <Text className="text-xs font-medium text-gray-500 mb-1">Amount in Words:</Text>
              <Text className="text-sm text-gray-700 italic mb-3">
                {report.jumla_ya_fedha_kwa_maneno}
              </Text>
              
              {report.maelezo && report.maelezo !== 'barikiwa sana' && (
                <View className="mb-2">
                  <Text className="text-xs font-medium text-gray-500 mb-1">Description:</Text>
                  <Text className="text-sm text-gray-700">{report.maelezo}</Text>
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
              onPress={() => setExpandedDonation(isExpanded ? null : report.stakabaadhi_no)}
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
                onPress={() => handleDownloadReceipt(report)}
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
                onPress={() => handlePrintReceipt(report)}
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

  // Form Component (unchanged)
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
        <ScrollView className="w-full max-h-[90%]" showsVerticalScrollIndicator={false}>
          <View className="bg-white rounded-2xl min-h-[70%]">
            <View className="flex-row justify-between items-center p-5 border-b border-gray-200">
              <Text className="text-lg font-bold text-gray-800">
                New Donation
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

            <View className="p-5">
              {/* Donor Selection */}
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
                            formData.doner === user.id ? 'bg-blue-600' : 'bg-gray-100'
                          }`}
                          onPress={() => setFormData({...formData, doner: user.id})}
                          activeOpacity={0.7}
                        >
                          <Text className={`font-medium text-center ${
                            formData.doner === user.id ? 'text-white' : 'text-gray-800'
                          }`} numberOfLines={1}>
                            {user.fullname}
                          </Text>
                          <Text className={`text-xs mt-1 text-center ${
                            formData.doner === user.id ? 'text-white/80' : 'text-gray-600'
                          }`} numberOfLines={1}>
                            {user.mobile_number}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                )}
                {formData.doner === null && users.length > 0 && (
                  <Text className="text-red-500 text-xs mt-1">Please select a donor</Text>
                )}
              </View>

              {/* Church */}
              <View className="mb-5">
                <Text className="text-sm font-semibold text-gray-800 mb-2">Church *</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800 bg-white"
                  value={formData.church}
                  onChangeText={(text) => setFormData({...formData, church: text})}
                  placeholder="Enter church name"
                  placeholderTextColor="#95A5A6"
                  autoCapitalize="words"
                />
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
                      onPress={() => setFormData({...formData, donation_type: type.id as any})}
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

              {/* For Nyingine Type - Additional Fields */}
              {formData.donation_type === 'nyingine' && (
                <>
                  {/* Sadaka/Mchango Name */}
                  <View className="mb-5">
                    <Text className="text-sm font-semibold text-gray-800 mb-2">Sadaka/Mchango Name *</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800 bg-white"
                      value={formData.sadaka_name}
                      onChangeText={(text) => setFormData({...formData, sadaka_name: text})}
                      placeholder="Enter sadaka/mchango name"
                      placeholderTextColor="#95A5A6"
                    />
                  </View>

                  {/* Contribution Type */}
                  <View className="mb-5">
                    <Text className="text-sm font-semibold text-gray-800 mb-2">Contribution Type</Text>
                    <View className="flex-row flex-wrap">
                      {CONTRIBUTION_TYPES.map(type => (
                        <TouchableOpacity
                          key={type.id}
                          className={`px-4 py-2 rounded-lg mr-2 mb-2 ${
                            formData.contribution_type === type.id ? 'bg-blue-600' : 'bg-gray-100'
                          }`}
                          onPress={() => setFormData({...formData, contribution_type: type.id})}
                          activeOpacity={0.8}
                        >
                          <Text className={`font-medium ${
                            formData.contribution_type === type.id ? 'text-white' : 'text-gray-800'
                          }`}>
                            {type.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {formData.contribution_type === 'nyingine' && (
                    <View className="mb-5">
                      <Text className="text-sm font-semibold text-gray-800 mb-2">Specify Contribution Type</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800 bg-white"
                        value={formData.custom_contribution_type}
                        onChangeText={(text) => setFormData({...formData, custom_contribution_type: text})}
                        placeholder="Enter custom contribution type"
                        placeholderTextColor="#95A5A6"
                      />
                    </View>
                  )}

                  {/* Percentage Distribution */}
                  <View className="mb-5">
                    <Text className="text-sm font-semibold text-gray-800 mb-2">Percentage Distribution</Text>
                    <View className="flex-row space-x-2 mb-2">
                      <View className="flex-1">
                        <Text className="text-xs text-gray-600 mb-1">CTF (%)</Text>
                        <TextInput
                          className="border border-gray-300 rounded-lg px-3 py-2 text-center text-base text-gray-800 bg-white"
                          value={formData.ctf_percent}
                          onChangeText={(text) => setFormData({...formData, ctf_percent: text})}
                          keyboardType="numeric"
                          placeholder="58"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs text-gray-600 mb-1">Church (%)</Text>
                        <TextInput
                          className="border border-gray-300 rounded-lg px-3 py-2 text-center text-base text-gray-800 bg-white"
                          value={formData.kanisa_mahalia_percent}
                          onChangeText={(text) => setFormData({...formData, kanisa_mahalia_percent: text})}
                          keyboardType="numeric"
                          placeholder="42"
                        />
                      </View>
                    </View>
                    <Text className="text-xs text-gray-500">
                      Note: Percentages must sum to 100%
                    </Text>
                  </View>
                </>
              )}

              {/* Description */}
              <View className="mb-5">
                <Text className="text-sm font-semibold text-gray-800 mb-2">Description (Optional)</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800 min-h-[80px] bg-white"
                  value={formData.description}
                  onChangeText={(text) => setFormData({...formData, description: text})}
                  placeholder="Enter description or notes..."
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#95A5A6"
                  textAlignVertical="top"
                />
              </View>
            </View>

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
                onPress={handleCreateDonation}
                disabled={!formData.doner || !formData.church || !formData.amount || processing}
                activeOpacity={0.7}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="font-semibold text-base text-white">
                    Create Donation
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  // Loading state
  if (loading && reports.length === 0) {
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
              {reports.length} receipts • {formatCurrency(summary?.summary?.total_amount || 0)} total
            </Text>
          </View>
          
          <TouchableOpacity
            className="w-12 h-12 rounded-full bg-white/20 justify-center items-center"
            onPress={() => setShowForm(true)}
            disabled={users.length === 0}
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
      {summary && (
        <View className="flex-row px-4 py-4 bg-white border-b border-gray-200 shadow-sm">
          <View className="flex-1 items-center">
            <Text className="text-lg font-bold text-gray-800">{summary.summary?.total_donations || 0}</Text>
            <Text className="text-xs text-gray-500 mt-0.5">Donations</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-lg font-bold text-gray-800">{users.length}</Text>
            <Text className="text-xs text-gray-500 mt-0.5">Users</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-lg font-bold text-green-600">
              {formatCurrency(summary.summary?.total_amount || 0)}
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5">Total</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-lg font-bold text-blue-600">
              {formatCurrency(summary.summary?.total_zaka || 0)}
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5">Zaka</Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View className="flex-row px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center py-3 rounded-xl mx-1 bg-blue-600 disabled:bg-blue-300"
          onPress={() => setShowPrintOptions(true)}
          disabled={processing || reports.length === 0}
          activeOpacity={0.8}
        >
          <Ionicons name="print-outline" size={18} color="white" />
          <Text className="ml-2 font-semibold text-sm text-white">Print</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center py-3 rounded-xl mx-1 bg-green-600 disabled:bg-green-300"
          onPress={handleExportCSV}
          disabled={processing || reports.length === 0}
          activeOpacity={0.8}
        >
          <Ionicons name="download-outline" size={18} color="white" />
          <Text className="ml-2 font-semibold text-sm text-white">Export</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center py-3 rounded-xl mx-1 bg-purple-600 disabled:bg-purple-300"
          onPress={() => setShowReceiptManager(true)}
          disabled={processing || reports.length === 0}
          activeOpacity={0.8}
        >
          <Ionicons name="receipt-outline" size={18} color="white" />
          <Text className="ml-2 font-semibold text-sm text-white">Manage</Text>
        </TouchableOpacity>
      </View>

      {/* Receipt Management Bar - IMPROVED STYLING */}
      {showReceiptManager ? (
        <View className="px-4 py-3 bg-gray-50 border-b border-gray-300 shadow-sm">
          <View className="flex-row justify-between items-center mb-3">
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
            
            <Text className="text-sm text-gray-500">
              {selectedReports.length} selected
            </Text>
          </View>
          
          <View className="flex-row justify-between items-center">
            {/* Action Buttons */}
            <View className="flex-row flex-1 space-x-2">
              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center py-3 rounded-lg ${
                  selectedReports.length > 0 ? 'bg-green-600' : 'bg-gray-400'
                }`}
                onPress={handleBatchDownload}
                disabled={selectedReports.length === 0 || processing}
                activeOpacity={0.8}
              >
                <Ionicons name="download-outline" size={16} color="white" />
                <Text className="ml-1.5 font-medium text-xs text-white">
                  Download ({selectedReports.length})
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center py-3 rounded-lg ${
                  selectedReports.length > 0 ? 'bg-purple-600' : 'bg-gray-400'
                }`}
                onPress={handleBatchPrint}
                disabled={selectedReports.length === 0 || processing}
                activeOpacity={0.8}
              >
                <Ionicons name="print-outline" size={16} color="white" />
                <Text className="ml-1.5 font-medium text-xs text-white">
                  Print ({selectedReports.length})
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Cancel Button - Better Sizing */}
            <TouchableOpacity
              className="ml-3 w-12 h-12 rounded-lg bg-red-500 justify-center items-center"
              onPress={() => {
                setShowReceiptManager(false);
                setSelectedReports([]);
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
          disabled={reports.length === 0}
          activeOpacity={0.7}
        >
          <Ionicons name="receipt-outline" size={18} color="#2E86C1" />
          <Text className="ml-2 text-sm font-medium text-blue-600">Manage Receipts</Text>
        </TouchableOpacity>
      )}

      {/* Reports List */}
      <FlatList
        data={filteredReports}
        renderItem={({ item }) => <ReportCard report={item} />}
        keyExtractor={(item) => item.stakabaadhi_no}
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
              {error ? error : searchQuery ? 'No receipts match your search' : 'No receipts found'}
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
            {users.length === 0 && !error && (
              <Text className="text-sm text-amber-600 text-center mt-4 italic">
                Please add users first to create donations
              </Text>
            )}
          </View>
        }
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          filteredReports.length > 0 ? (
            <View className="px-4 pt-4 pb-2">
              <Text className="text-sm text-gray-500">
                Showing {filteredReports.length} of {reports.length} receipts
                {selectedReports.length > 0 && ` • ${selectedReports.length} selected`}
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
                  handleBatchPrint();
                }}
                disabled={processing || reports.length === 0}
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 rounded-full bg-green-100 justify-center items-center mr-3">
                  <Ionicons name="print-outline" size={22} color="#27AE60" />
                </View>
                <View className="flex-1 mr-2">
                  <Text className="text-base font-semibold text-gray-800 mb-0.5">Print All Receipts</Text>
                  <Text className="text-sm text-gray-500">Print all {reports.length} receipts</Text>
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
                  handleExportCSV();
                }}
                disabled={processing || reports.length === 0}
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 rounded-full bg-purple-100 justify-center items-center mr-3">
                  <Ionicons name="document-text-outline" size={22} color="#8E44AD" />
                </View>
                <View className="flex-1 mr-2">
                  <Text className="text-base font-semibold text-gray-800 mb-0.5">Export Summary Report</Text>
                  <Text className="text-sm text-gray-500">Generate and export summary report</Text>
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