
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
  Linking,
  StatusBar,
  FlatList,
  AppState,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

// ============ API CONFIGURATION ============
const API_BASE_URL = 'https://mhazini.pythonanywhere.com/api/auth';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ============ INTERFACES ============
interface FinalReport {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  amount_present: number;
  amount_used: number;
  amount_remained: number;
  reason: string;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

// ============ MAIN COMPONENT ============
export default function FinalReportsPage() {
  const router = useRouter();
  
  // ============ STATE VARIABLES ============
  const [reports, setReports] = useState<FinalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appState, setAppState] = useState(AppState.currentState);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [showBatchOptions, setShowBatchOptions] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Selected reports for batch operations
  const [selectedReport, setSelectedReport] = useState<FinalReport | null>(null);
  const [selectedReports, setSelectedReports] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Success message
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    amount_present: '',
    amount_used: '',
    reason: '',
  });
  
  // Search state
  const [searchData, setSearchData] = useState({
    start_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  // Refs for TextInput
  const amountPresentRef = useRef<TextInput>(null);
  const amountUsedRef = useRef<TextInput>(null);
  const reasonRef = useRef<TextInput>(null);

  // ============ APP STATE HANDLING ============
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        loadAllReports();
      }
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, [appState]);

  // ============ LOAD DATA ============
  useEffect(() => {
    loadAllReports();
  }, []);

  const loadAllReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/final-reports/all/');
      
      if (response.data.success) {
        setReports(response.data.reports);
        
        // Cache the data
        await AsyncStorage.setItem('cached_final_reports', JSON.stringify(response.data.reports));
      } else {
        throw new Error(response.data.error || 'Failed to load reports');
      }
    } catch (error: any) {
      console.error('Error loading reports:', error);
      setError(error.message || 'Failed to load reports. Please check your connection.');
      
      // Try to load cached data
      try {
        const cached = await AsyncStorage.getItem('cached_final_reports');
        if (cached) {
          setReports(JSON.parse(cached));
        }
      } catch (cacheError) {
        console.error('Cache error:', cacheError);
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllReports();
    setRefreshing(false);
  }, []);

  // ============ SELECTION HANDLERS ============
  const toggleReportSelection = (reportId: number) => {
    setSelectedReports(prev => {
      if (prev.includes(reportId)) {
        return prev.filter(id => id !== reportId);
      } else {
        return [...prev, reportId];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports.map(report => report.id));
    }
    setSelectAll(!selectAll);
  };

  const clearSelection = () => {
    setSelectedReports([]);
    setSelectAll(false);
  };

  // ============ SUCCESS HANDLER ============
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 3000);
  };

  // ============ CRUD OPERATIONS ============
  const handleCreateReport = async () => {
    // Validation
    if (!formData.title.trim()) {
      Alert.alert('Missing Title', 'Please enter a report title');
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      Alert.alert('Missing Dates', 'Please select start and end dates');
      return;
    }

    const amountPresent = parseFloat(formData.amount_present);
    const amountUsed = parseFloat(formData.amount_used);

    if (isNaN(amountPresent) || amountPresent < 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount present');
      return;
    }

    if (isNaN(amountUsed) || amountUsed < 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount used');
      return;
    }

    if (amountUsed > amountPresent) {
      Alert.alert('Invalid Amount', 'Amount used cannot be greater than amount present');
      return;
    }

    try {
      setProcessing(true);
      const response = await api.post('/final-reports/', {
        title: formData.title,
        start_date: formData.start_date,
        end_date: formData.end_date,
        amount_present: amountPresent,
        amount_used: amountUsed,
        reason: formData.reason,
      });

      if (response.data) {
        showSuccess('Report created successfully');
        setShowCreateModal(false);
        resetForm();
        await loadAllReports();
      }
    } catch (error: any) {
      console.error('Error creating report:', error.response?.data || error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to create report');
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateAndGenerateReport = async () => {
    // Validation
    if (!formData.title.trim()) {
      Alert.alert('Missing Title', 'Please enter a report title');
      return;
    }

    const amountPresent = parseFloat(formData.amount_present);
    const amountUsed = parseFloat(formData.amount_used);

    if (isNaN(amountPresent) || amountPresent < 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount present');
      return;
    }

    if (isNaN(amountUsed) || amountUsed < 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount used');
      return;
    }

    if (amountUsed > amountPresent) {
      Alert.alert('Invalid Amount', 'Amount used cannot be greater than amount present');
      return;
    }

    try {
      setProcessing(true);
      const response = await api.post('/final-reports/create_and_generate/', {
        title: formData.title,
        start_date: formData.start_date,
        end_date: formData.end_date,
        amount_present: amountPresent,
        amount_used: amountUsed,
        reason: formData.reason,
      });

      if (response.data.success) {
        showSuccess(response.data.message);
        setShowCreateModal(false);
        resetForm();
        await loadAllReports();
        
        // Download PDF automatically if URL is available
        if (response.data.pdf_url) {
          const reportWithPdf = {
            ...response.data.report,
            pdf_url: response.data.pdf_url
          };
          await handleDownloadPdf(reportWithPdf);
        }
      } else {
        Alert.alert('Error', response.data.error || 'Failed to create report');
      }
    } catch (error: any) {
      console.error('Error creating report:', error.response?.data || error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to create report');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    try {
      const response = await api.delete(`/final-reports/${reportId}/`);
      
      if (response.status === 204) {
        showSuccess('Report deleted successfully');
        setShowDeleteModal(false);
        setSelectedReport(null);
        setSelectedReports(prev => prev.filter(id => id !== reportId));
        await loadAllReports();
      }
    } catch (error: any) {
      console.error('Error deleting report:', error);
      Alert.alert('Error', 'Failed to delete report');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedReports.length === 0) {
      Alert.alert('No Selection', 'Please select reports to delete');
      return;
    }

    Alert.alert(
      'Delete Multiple Reports',
      `Are you sure you want to delete ${selectedReports.length} report(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setBatchProcessing(true);
              const promises = selectedReports.map(reportId => 
                api.delete(`/final-reports/${reportId}/`)
              );
              
              await Promise.all(promises);
              showSuccess(`${selectedReports.length} report(s) deleted successfully`);
              clearSelection();
              await loadAllReports();
            } catch (error: any) {
              console.error('Error deleting reports:', error);
              Alert.alert('Error', 'Failed to delete some reports');
            } finally {
              setBatchProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleSearchReports = async () => {
    if (!searchData.start_date || !searchData.end_date) {
      Alert.alert('Missing Dates', 'Please select start and end dates');
      return;
    }

    try {
      setSearchLoading(true);
      const response = await api.get('/final-reports/search/', {
        params: searchData,
      });

      if (response.data.success) {
        setReports(response.data.reports);
        showSuccess(`Found ${response.data.count} reports`);
        setShowSearchModal(false);
      } else {
        Alert.alert('Error', response.data.error || 'No reports found');
      }
    } catch (error: any) {
      console.error('Error searching reports:', error);
      Alert.alert('Error', error.response?.data?.error || 'Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleGeneratePdf = async (reportId: number) => {
    try {
      setGeneratingPdf(true);
      const response = await api.post(`/final-reports/${reportId}/generate_pdf/`);
      
      if (response.data.success) {
        showSuccess(response.data.message);
        await loadAllReports();
        
        // Get updated report
        const updatedReport = reports.find(r => r.id === reportId);
        if (updatedReport && response.data.pdf_url) {
          await handleDownloadPdf({...updatedReport, pdf_url: response.data.pdf_url});
        }
      } else {
        Alert.alert('Error', response.data.error || 'Failed to generate PDF');
      }
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleBatchGeneratePdf = async () => {
    if (selectedReports.length === 0) {
      Alert.alert('No Selection', 'Please select reports to generate PDFs');
      return;
    }

    try {
      setBatchProcessing(true);
      const promises = selectedReports.map(reportId => 
        api.post(`/final-reports/${reportId}/generate_pdf/`)
      );
      
      const results = await Promise.all(promises);
      const successful = results.filter(result => result.data.success);
      
      if (successful.length > 0) {
        showSuccess(`${successful.length} PDF(s) generated successfully`);
        await loadAllReports();
      }
      
      if (successful.length < selectedReports.length) {
        Alert.alert('Partial Success', 
          `${successful.length} out of ${selectedReports.length} PDFs were generated successfully`);
      }
    } catch (error: any) {
      console.error('Error generating PDFs:', error);
      Alert.alert('Error', 'Failed to generate some PDFs');
    } finally {
      setBatchProcessing(false);
    }
  };

  // ============ PDF DOWNLOAD FUNCTION (FIXED) ============
  const ensureDirectoryExists = async (directory: string) => {
    try {
      const dirInfo = await LegacyFileSystem.getInfoAsync(directory);
      if (!dirInfo.exists) {
        console.log('Creating directory:', directory);
        await LegacyFileSystem.makeDirectoryAsync(directory, { intermediates: true });
        console.log('Directory created successfully');
      }
      return true;
    } catch (error) {
      console.error('Error creating directory:', error);
      throw error;
    }
  };

  const downloadPdfAlternative = async (url: string, fileUri: string) => {
    try {
      console.log('Using alternative download method');
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Convert blob to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      const base64Data = base64.split(',')[1];
      
      // Extract directory from fileUri
      const directory = fileUri.substring(0, fileUri.lastIndexOf('/'));
      
      // Ensure directory exists BEFORE writing
      await ensureDirectoryExists(directory);
      
      // Now write the file
      console.log('Writing file to:', fileUri);
      await LegacyFileSystem.writeAsStringAsync(
        fileUri,
        base64Data,
        { encoding: LegacyFileSystem.EncodingType.Base64 }
      );
      
      console.log('PDF saved via alternative method');
      return fileUri;
    } catch (error) {
      console.error('Alternative download error:', error);
      throw error;
    }
  };

  const handleDownloadPdf = async (report: FinalReport) => {
    try {
      if (!report.pdf_url) {
        Alert.alert('No PDF', 'PDF not available for this report');
        return;
      }

      const pdfUrl = report.pdf_url;
      const fileName = `final_report_${report.id}_${report.start_date}_${report.end_date}.pdf`;
      
      // Use cache directory instead of document directory
      const downloadDir = `${LegacyFileSystem.cacheDirectory}final_reports/`;
      const fileUri = `${downloadDir}${fileName}`;
      
      // Ensure directory exists
      await ensureDirectoryExists(downloadDir);
      
      Alert.alert(
        'Download PDF',
        `Download ${fileName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Download',
            onPress: async () => {
              try {
                setProcessing(true);
                console.log('Starting PDF download...');
                console.log('URL:', pdfUrl);
                console.log('Save to:', fileUri);
                
                // Try direct download first
                const downloadResult = await LegacyFileSystem.downloadAsync(pdfUrl, fileUri);
                
                console.log('Download status:', downloadResult.status);
                console.log('Download URI:', downloadResult.uri);
                
                if (downloadResult.status === 200) {
                  showSuccess('PDF downloaded successfully!');
                  
                  // Verify file exists
                  const fileInfo = await LegacyFileSystem.getInfoAsync(fileUri);
                  console.log('File exists:', fileInfo.exists);
                  console.log('File size:', fileInfo.size);
                  
                  Alert.alert(
                    'Download Complete',
                    'PDF has been downloaded successfully',
                    [
                      { 
                        text: 'Open', 
                        onPress: async () => {
                          try {
                            if (await Sharing.isAvailableAsync()) {
                              await Sharing.shareAsync(fileUri, {
                                mimeType: 'application/pdf',
                                dialogTitle: 'Share PDF Report',
                                UTI: 'com.adobe.pdf'
                              });
                            } else {
                              await Linking.openURL(pdfUrl);
                            }
                          } catch (openError) {
                            console.error('Open error:', openError);
                            Alert.alert('Error', 'Could not open PDF');
                          }
                        }
                      },
                      { 
                        text: 'Print',
                        onPress: async () => {
                          try {
                            await Print.printAsync({
                              uri: fileUri,
                              printerUrl: undefined,
                            });
                          } catch (printError) {
                            console.error('Print error:', printError);
                            Alert.alert('Error', 'Failed to print PDF');
                          }
                        }
                      },
                      { text: 'OK' }
                    ]
                  );
                } else {
                  throw new Error(`Download failed: ${downloadResult.status}`);
                }
              } catch (downloadError) {
                console.error('Download error:', downloadError);
                
                // Try alternative method
                try {
                  await downloadPdfAlternative(pdfUrl, fileUri);
                  showSuccess('PDF downloaded via alternative method!');
                } catch (altError) {
                  console.error('Alternative download error:', altError);
                  Alert.alert('Download Error', 'Failed to download PDF. Please try again later.');
                }
              } finally {
                setProcessing(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('PDF download error:', error);
      Alert.alert('Error', 'Failed to download PDF');
    }
  };

  const handleBatchDownloadPdf = async () => {
    if (selectedReports.length === 0) {
      Alert.alert('No Selection', 'Please select reports to download');
      return;
    }

    const selectedReportData = reports.filter(report => selectedReports.includes(report.id));
    const reportsWithPdf = selectedReportData.filter(report => report.pdf_url);
    
    if (reportsWithPdf.length === 0) {
      Alert.alert('No PDFs', 'None of the selected reports have PDFs generated');
      return;
    }

    Alert.alert(
      'Download Multiple PDFs',
      `Download ${reportsWithPdf.length} PDF(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download All',
          onPress: async () => {
            try {
              setBatchProcessing(true);
              
              // Download all PDFs
              for (const report of reportsWithPdf) {
                if (report.pdf_url) {
                  const fileName = `final_report_${report.id}_${report.start_date}_${report.end_date}.pdf`;
                  const downloadDir = `${LegacyFileSystem.cacheDirectory}final_reports/batch/`;
                  const fileUri = `${downloadDir}${fileName}`;
                  
                  await ensureDirectoryExists(downloadDir);
                  
                  try {
                    await LegacyFileSystem.downloadAsync(report.pdf_url, fileUri);
                  } catch (error) {
                    console.error(`Failed to download report ${report.id}:`, error);
                  }
                }
              }
              
              showSuccess(`${reportsWithPdf.length} PDF(s) downloaded successfully`);
              
              // Offer to share the batch directory
              const batchDir = `${LegacyFileSystem.cacheDirectory}final_reports/batch/`;
              const dirInfo = await LegacyFileSystem.getInfoAsync(batchDir);
              
              if (dirInfo.exists && await Sharing.isAvailableAsync()) {
                Alert.alert(
                  'Download Complete',
                  'PDFs have been downloaded. Would you like to access them?',
                  [
                    {
                      text: 'Open Folder',
                      onPress: async () => {
                        try {
                          await Sharing.shareAsync(batchDir, {
                            dialogTitle: 'Batch PDF Reports',
                          });
                        } catch (error) {
                          console.error('Error sharing folder:', error);
                          Alert.alert('Error', 'Could not open folder');
                        }
                      }
                    },
                    { text: 'OK' }
                  ]
                );
              }
              
            } catch (error) {
              console.error('Error downloading batch PDFs:', error);
              Alert.alert('Error', 'Failed to download some PDFs');
            } finally {
              setBatchProcessing(false);
            }
          },
        },
      ]
    );
  };

  const previewPdf = async (report: FinalReport) => {
    if (!report.pdf_url) {
      Alert.alert('No PDF', 'PDF not available for this report');
      return;
    }

    openPdfUrl(report.pdf_url);
  };

  const openPdfUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', `Cannot open URL: ${url}`);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert('Error', 'Failed to open PDF');
    }
  };

  // ============ PRINTING OPERATIONS ============
  const handlePrintReport = async (report: FinalReport) => {
    try {
      setProcessing(true);
      
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
            }
            .header {
              text-align: center;
              background-color: #2E86C1;
              color: white;
              padding: 20px;
              margin-bottom: 30px;
              border-radius: 8px;
            }
            .report-info {
              margin-bottom: 25px;
              padding: 15px;
              background-color: #f8f9fa;
              border-radius: 8px;
              border-left: 4px solid #3498db;
            }
            .amount-summary {
              background-color: #e8f6f3;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .amount-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 10px 0;
              border-bottom: 1px solid #d5dbdb;
            }
            .amount-label {
              font-weight: bold;
              color: #2c3e50;
            }
            .amount-value {
              font-weight: bold;
              font-size: 16px;
            }
            .signature-area {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ccc;
            }
            .footer {
              text-align: center;
              font-style: italic;
              color: #7f8c8d;
              margin-top: 30px;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>KANISA LA WAADVENTISTA WASABATO</h1>
            <h2>RIPOTI YA MWISHO YA FEDHA</h2>
            <p>Central Tanzania Field (CTF)</p>
          </div>
          
          <div class="report-info">
            <h3>${report.title}</h3>
            <p><strong>Kipindi:</strong> ${formatDate(report.start_date)} - ${formatDate(report.end_date)}</p>
            <p><strong>Tarehe ya Kutengeneza:</strong> ${formatDate(report.created_at)}</p>
            <p><strong>Namba ya Ripoti:</strong> FINAL-REP-${report.id}</p>
          </div>
          
          <div class="amount-summary">
            <h3 style="text-align: center; color: #2c3e50;">MUHTASARI WA FEDHA</h3>
            
            <div class="amount-row">
              <span class="amount-label">Fedha Zilizopo Kabla:</span>
              <span class="amount-value" style="color: #27ae60;">${formatCurrency(report.amount_present)}</span>
            </div>
            
            <div class="amount-row">
              <span class="amount-label">Fedha Zilizotumika:</span>
              <span class="amount-value" style="color: #e74c3c;">${formatCurrency(report.amount_used)}</span>
            </div>
            
            <div class="amount-row">
              <span class="amount-label">Fedha Zilizobaki:</span>
              <span class="amount-value" style="color: #3498db;">${formatCurrency(report.amount_remained)}</span>
            </div>
          </div>
      `;

      if (report.reason) {
        htmlContent += `
          <div style="background-color: #fef9e7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #d68910;">SABABU YA MATUMIZI:</h4>
            <p style="color: #2c3e50;">${report.reason}</p>
          </div>
        `;
      }

      htmlContent += `
          <div class="signature-area">
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
              <div>
                <p><strong>Mhasibu Mkuu</strong></p>
                <p>_________________________</p>
                <p>SAINI: __________</p>
              </div>
              <div>
                <p><strong>Mkaguzi wa Fedha</strong></p>
                <p>_________________________</p>
                <p>SAINI: __________</p>
              </div>
              <div>
                <p><strong>Mkuu wa Kanisa</strong></p>
                <p>_________________________</p>
                <p>SAINI: __________</p>
              </div>
            </div>
            <p><strong>Tarehe:</strong> ${formatDate(new Date().toISOString())}</p>
          </div>
          
          <div class="footer">
            <p>Ripoti ya Mwisho #${report.id} | Kipindi: ${formatDate(report.start_date)} - ${formatDate(report.end_date)}</p>
            <p>Imetengenezwa na mfumo wa usimamizi wa fedha wa Kanisa la Waadventista</p>
            <p>© ${new Date().getFullYear()} Kanisa la Waadventista Wasabato - CTF</p>
          </div>
        </body>
        </html>
      `;
      
      await Print.printAsync({
        html: htmlContent,
        printerUrl: undefined,
      });
      
      showSuccess('Report sent to printer!');
      
    } catch (error: any) {
      console.error('Print error:', error);
      
      if (error.message.includes('Printing not available')) {
        Alert.alert(
          'Print Unavailable',
          'Printing is not available on this device. Please download the report instead.',
          [
            { text: 'Download', onPress: () => handleDownloadPdf(report) },
            { text: 'OK' }
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to print report. Please try again.');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleBatchPrint = async () => {
    if (selectedReports.length === 0) {
      Alert.alert('No Selection', 'Please select reports to print');
      return;
    }

    const selectedReportData = reports.filter(report => selectedReports.includes(report.id));
    
    try {
      setBatchProcessing(true);
      
      // Combine all reports into one HTML document
      let combinedHtml = `
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
            }
            .batch-header {
              text-align: center;
              background-color: #2E86C1;
              color: white;
              padding: 20px;
              margin-bottom: 30px;
              border-radius: 8px;
            }
            .report-container {
              page-break-after: always;
              margin-bottom: 40px;
            }
            .report-info {
              margin-bottom: 25px;
              padding: 15px;
              background-color: #f8f9fa;
              border-radius: 8px;
              border-left: 4px solid #3498db;
            }
            .amount-summary {
              background-color: #e8f6f3;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .amount-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 10px 0;
              border-bottom: 1px solid #d5dbdb;
            }
            .amount-label {
              font-weight: bold;
              color: #2c3e50;
            }
            .amount-value {
              font-weight: bold;
              font-size: 16px;
            }
            .signature-area {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ccc;
            }
            .footer {
              text-align: center;
              font-style: italic;
              color: #7f8c8d;
              margin-top: 30px;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="batch-header">
            <h1>KANISA LA WAADVENTISTA WASABATO</h1>
            <h2>BATCH RIPOTI ZA MWISHO ZA FEDHA</h2>
            <p>Central Tanzania Field (CTF)</p>
            <p><strong>Jumla ya Ripoti: ${selectedReportData.length}</strong></p>
            <p><strong>Tarehe ya Uchapa: ${formatDate(new Date().toISOString())}</strong></p>
          </div>
      `;

      // Add each report to the combined HTML
      selectedReportData.forEach((report, index) => {
        combinedHtml += `
          <div class="report-container">
            <div class="report-info">
              <h3>${report.title} (Ripoti #${report.id})</h3>
              <p><strong>Kipindi:</strong> ${formatDate(report.start_date)} - ${formatDate(report.end_date)}</p>
              <p><strong>Tarehe ya Kutengeneza:</strong> ${formatDate(report.created_at)}</p>
            </div>
            
            <div class="amount-summary">
              <h3 style="text-align: center; color: #2c3e50;">MUHTASARI WA FEDHA</h3>
              
              <div class="amount-row">
                <span class="amount-label">Fedha Zilizopo Kabla:</span>
                <span class="amount-value" style="color: #27ae60;">${formatCurrency(report.amount_present)}</span>
              </div>
              
              <div class="amount-row">
                <span class="amount-label">Fedha Zilizotumika:</span>
                <span class="amount-value" style="color: #e74c3c;">${formatCurrency(report.amount_used)}</span>
              </div>
              
              <div class="amount-row">
                <span class="amount-label">Fedha Zilizobaki:</span>
                <span class="amount-value" style="color: #3498db;">${formatCurrency(report.amount_remained)}</span>
              </div>
            </div>
        `;

        if (report.reason) {
          combinedHtml += `
            <div style="background-color: #fef9e7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #d68910;">SABABU YA MATUMIZI:</h4>
              <p style="color: #2c3e50;">${report.reason}</p>
            </div>
          `;
        }

        combinedHtml += `
            <div class="signature-area">
              <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                <div>
                  <p><strong>Mhasibu Mkuu</strong></p>
                  <p>_________________________</p>
                  <p>SAINI: __________</p>
                </div>
                <div>
                  <p><strong>Mkaguzi wa Fedha</strong></p>
                  <p>_________________________</p>
                  <p>SAINI: __________</p>
                </div>
                <div>
                  <p><strong>Mkuu wa Kanisa</strong></p>
                  <p>_________________________</p>
                  <p>SAINI: __________</p>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <p>Ripoti #${index + 1} ya ${selectedReportData.length} | ID: ${report.id}</p>
            </div>
          </div>
        `;
      });

      combinedHtml += `
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #2E86C1;">
            <p><strong>--- MWISHO WA RIPOTI ZOTE ---</strong></p>
            <p>Jumla ya Ripoti: ${selectedReportData.length}</p>
            <p>Jumla ya Fedha Zilizopo: ${formatCurrency(selectedReportData.reduce((sum, r) => sum + r.amount_present, 0))}</p>
            <p>Jumla ya Fedha Zilizotumika: ${formatCurrency(selectedReportData.reduce((sum, r) => sum + r.amount_used, 0))}</p>
            <p>Jumla ya Fedha Zilizobaki: ${formatCurrency(selectedReportData.reduce((sum, r) => sum + r.amount_remained, 0))}</p>
          </div>
        </body>
        </html>
      `;

      // Print the combined document
      await Print.printAsync({
        html: combinedHtml,
        printerUrl: undefined,
      });

      showSuccess(`${selectedReportData.length} report(s) sent to printer!`);
      clearSelection();
      
    } catch (error: any) {
      console.error('Batch print error:', error);
      
      if (error.message.includes('Printing not available')) {
        Alert.alert(
          'Print Unavailable',
          'Printing is not available on this device.',
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to print reports. Please try again.');
      }
    } finally {
      setBatchProcessing(false);
    }
  };

  // ============ HELPER FUNCTIONS ============
  const resetForm = () => {
    setFormData({
      title: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      amount_present: '',
      amount_used: '',
      reason: '',
    });
    
    if (amountPresentRef.current) amountPresentRef.current.blur();
    if (amountUsedRef.current) amountUsedRef.current.blur();
    if (reasonRef.current) reasonRef.current.blur();
  };

  const formatCurrency = (amount: number) => {
    return `TSh ${amount.toLocaleString('en-TZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return dateString;
    }
  };

  const showReportDetails = (report: FinalReport) => {
    setSelectedReport(report);
    setShowDetailsModal(true);
  };

  const confirmDeleteReport = (report: FinalReport) => {
    setSelectedReport(report);
    setShowDeleteModal(true);
  };

  const resetSearch = () => {
    setSearchData({
      start_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
    });
    loadAllReports();
  };

  // ============ BATCH OPTIONS MODAL ============
  const renderBatchOptionsModal = () => (
    <Modal
      visible={showBatchOptions}
      transparent
      animationType="slide"
      onRequestClose={() => setShowBatchOptions(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Batch Operations</Text>
            <TouchableOpacity onPress={() => setShowBatchOptions(false)}>
              <Ionicons name="close" size={24} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.batchSummary}>
              {selectedReports.length} report(s) selected
            </Text>
            
            <View style={styles.batchActions}>
              <TouchableOpacity
                style={[styles.batchButton, styles.batchPrintButton]}
                onPress={handleBatchPrint}
                disabled={batchProcessing || selectedReports.length === 0}
              >
                <Ionicons name="print" size={24} color="#fff" />
                <Text style={styles.batchButtonText}>Print Selected</Text>
                <Text style={styles.batchButtonSubtext}>
                  Print {selectedReports.length} report(s) as one document
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.batchButton, styles.batchPdfButton]}
                onPress={handleBatchDownloadPdf}
                disabled={batchProcessing || selectedReports.length === 0}
              >
                <Ionicons name="download" size={24} color="#fff" />
                <Text style={styles.batchButtonText}>Download PDFs</Text>
                <Text style={styles.batchButtonSubtext}>
                  Download PDFs for {selectedReports.length} report(s)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.batchButton, styles.batchGenerateButton]}
                onPress={handleBatchGeneratePdf}
                disabled={batchProcessing || selectedReports.length === 0}
              >
                <Ionicons name="document-text" size={24} color="#fff" />
                <Text style={styles.batchButtonText}>Generate PDFs</Text>
                <Text style={styles.batchButtonSubtext}>
                  Generate PDFs for {selectedReports.length} report(s)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.batchButton, styles.batchDeleteButton]}
                onPress={handleBatchDelete}
                disabled={batchProcessing || selectedReports.length === 0}
              >
                <Ionicons name="trash" size={24} color="#fff" />
                <Text style={styles.batchButtonText}>Delete Selected</Text>
                <Text style={styles.batchButtonSubtext}>
                  Delete {selectedReports.length} report(s) permanently
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.selectionInfo}>
              <TouchableOpacity
                style={styles.selectAllButton}
                onPress={toggleSelectAll}
              >
                <Ionicons 
                  name={selectAll ? "checkbox" : "square-outline"} 
                  size={20} 
                  color="#3498db" 
                />
                <Text style={styles.selectAllText}>
                  {selectAll ? 'Deselect All' : 'Select All'} ({reports.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.clearSelectionButton}
                onPress={clearSelection}
                disabled={selectedReports.length === 0}
              >
                <Text style={styles.clearSelectionText}>Clear Selection</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowBatchOptions(false)}
            >
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ============ RENDER LOADING ============
  if (loading && reports.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  // ============ MAIN RENDER ============
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#2E86C1" />
      
      {/* Header with Gradient */}
      <LinearGradient 
        colors={['#2E86C1', '#1A5276', '#154360']} 
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Final Reports</Text>
            <Text style={styles.headerSubtitle}>
              {reports.length} total reports | {selectedReports.length} selected
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={26} color="white" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{reports.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {reports.filter(r => r.pdf_url).length}
            </Text>
            <Text style={styles.statLabel}>With PDF</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, styles.statAmount]}>
              {formatCurrency(reports.reduce((sum, r) => sum + r.amount_present, 0))}
            </Text>
            <Text style={styles.statLabel}>Total Funds</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.searchButton]}
          onPress={() => setShowSearchModal(true)}
        >
          <Ionicons name="search" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.batchButton]}
          onPress={() => setShowBatchOptions(true)}
          disabled={reports.length === 0}
        >
          <Ionicons name="layers" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Batch</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.refreshButton]}
          onPress={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="refresh" size={18} color="#fff" />
          )}
          <Text style={styles.actionButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Selection Bar */}
      {selectedReports.length > 0 && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionText}>
            {selectedReports.length} report(s) selected
          </Text>
          <TouchableOpacity
            style={styles.selectionCloseButton}
            onPress={clearSelection}
          >
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Reports List */}
      <FlatList
        data={reports}
        renderItem={({ item }) => (
          <View style={[
            styles.reportCard,
            selectedReports.includes(item.id) && styles.selectedCard
          ]}>
            <TouchableOpacity
              onPress={() => toggleReportSelection(item.id)}
              onLongPress={() => showReportDetails(item)}
              style={styles.cardContent}
              activeOpacity={0.8}
            >
              {/* Selection Checkbox */}
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => toggleReportSelection(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={[
                  styles.checkbox,
                  selectedReports.includes(item.id) && styles.checkboxSelected
                ]}>
                  {selectedReports.includes(item.id) && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.cardHeader}>
                <View style={styles.titleContainer}>
                  <MaterialIcons name="description" size={16} color="#3498db" />
                  <Text style={styles.reportTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: item.amount_remained > 0 ? '#2ecc71' : '#e74c3c' }
                ]}>
                  <Text style={styles.statusText}>
                    {item.amount_remained > 0 ? 'Funds Left' : 'No Funds'}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={12} color="#7f8c8d" />
                  <Text style={styles.infoLabel}>Period:</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(item.start_date)} - {formatDate(item.end_date)}
                  </Text>
                </View>
                
                <View style={styles.amountRow}>
                  <View style={styles.amountItem}>
                    <Text style={styles.amountLabel}>Current</Text>
                    <Text style={[styles.amountValue, styles.presentAmount]}>
                      {formatCurrency(item.amount_present)}
                    </Text>
                  </View>
                  <View style={styles.amountItem}>
                    <Text style={styles.amountLabel}>Used</Text>
                    <Text style={[styles.amountValue, styles.usedAmount]}>
                      {formatCurrency(item.amount_used)}
                    </Text>
                  </View>
                  <View style={styles.amountItem}>
                    <Text style={styles.amountLabel}>Remaining</Text>
                    <Text style={[styles.amountValue, styles.remainedAmount]}>
                      {formatCurrency(item.amount_remained)}
                    </Text>
                  </View>
                </View>
                
                {item.reason && (
                  <View style={styles.reasonPreview}>
                    <Text style={styles.reasonLabel}>Reason:</Text>
                    <Text style={styles.reasonText} numberOfLines={2}>
                      {item.reason}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.cardFooter}>
              <TouchableOpacity
                style={[styles.cardAction, styles.viewAction]}
                onPress={() => showReportDetails(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="eye" size={14} color="#fff" />
                <Text style={styles.actionText}>View</Text>
              </TouchableOpacity>
              
              {item.pdf_url ? (
                <>
                  <TouchableOpacity
                    style={[styles.cardAction, styles.downloadAction]}
                    onPress={() => handleDownloadPdf(item)}
                    activeOpacity={0.7}
                    disabled={processing}
                  >
                    <Ionicons name="download" size={14} color="#fff" />
                    <Text style={styles.actionText}>PDF</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.cardAction, styles.printAction]}
                    onPress={() => handlePrintReport(item)}
                    activeOpacity={0.7}
                    disabled={processing}
                  >
                    <Ionicons name="print" size={14} color="#fff" />
                    <Text style={styles.actionText}>Print</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.cardAction, styles.generateAction]}
                  onPress={() => handleGeneratePdf(item.id)}
                  disabled={generatingPdf || processing}
                  activeOpacity={0.7}
                >
                  {generatingPdf ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="document-text" size={14} color="#fff" />
                      <Text style={styles.actionText}>Generate</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2E86C1']}
            tintColor="#2E86C1"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="description" size={80} color="#ECF0F1" />
            <Text style={styles.emptyStateTitle}>
              {error ? error : 'No Final Reports Found'}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              Create your first final report to track church funds
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.emptyStateButtonText}>Create Report</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={reports.length === 0 ? styles.emptyListContent : styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Batch Options Modal */}
      {renderBatchOptionsModal()}

      {/* Processing Overlay */}
      {(processing || batchProcessing) && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#2E86C1" />
            <Text style={styles.processingText}>
              {batchProcessing ? 'Processing Batch...' : 'Processing...'}
            </Text>
            <Text style={styles.processingSubtext}>Please wait</Text>
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
        <View style={styles.successModalOverlay}>
          <View style={styles.successModal}>
            <Ionicons name="checkmark-circle" size={60} color="#27AE60" />
            <Text style={styles.successModalTitle}>Success!</Text>
            <Text style={styles.successModalMessage}>{successMessage}</Text>
            
            <TouchableOpacity
              style={styles.successModalButton}
              onPress={() => setShowSuccessModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.successModalButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    color: '#7f8c8d',
    fontSize: 16,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statAmount: {
    fontSize: 14,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
  searchButton: {
    backgroundColor: '#3498db',
  },
  batchButton: {
    backgroundColor: '#9b59b6',
  },
  refreshButton: {
    backgroundColor: '#f39c12',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  selectionBar: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  selectionText: {
    color: '#fff',
    fontWeight: '600',
  },
  selectionCloseButton: {
    padding: 4,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
    textAlign: 'center',
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
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#3498db',
    borderWidth: 2,
    backgroundColor: '#f0f8ff',
  },
  cardContent: {
    padding: 16,
    paddingLeft: 50, // Space for checkbox
    position: 'relative',
  },
  checkboxContainer: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#bdc3c7',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  cardBody: {
    gap: 8,
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
    fontWeight: '500',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  amountItem: {
    alignItems: 'center',
    flex: 1,
  },
  amountLabel: {
    fontSize: 11,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  presentAmount: {
    color: '#27ae60',
  },
  usedAmount: {
    color: '#e74c3c',
  },
  remainedAmount: {
    color: '#3498db',
  },
  reasonPreview: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  reasonLabel: {
    fontSize: 11,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  reasonText: {
    fontSize: 11,
    color: '#333',
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  cardAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  viewAction: {
    backgroundColor: '#3498db',
  },
  downloadAction: {
    backgroundColor: '#2ecc71',
  },
  printAction: {
    backgroundColor: '#9b59b6',
  },
  generateAction: {
    backgroundColor: '#f39c12',
  },
  actionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalContent: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#ecf0f1',
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontWeight: '600',
  },
  // Batch Options Modal Styles
  batchSummary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
  },
  batchActions: {
    gap: 12,
    marginBottom: 20,
  },
  batchButton: {
    backgroundColor: '#3498db',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  batchPrintButton: {
    backgroundColor: '#9b59b6',
  },
  batchPdfButton: {
    backgroundColor: '#2ecc71',
  },
  batchGenerateButton: {
    backgroundColor: '#f39c12',
  },
  batchDeleteButton: {
    backgroundColor: '#e74c3c',
  },
  batchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  batchButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  selectionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectAllText: {
    color: '#3498db',
    fontWeight: '500',
  },
  clearSelectionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
  },
  clearSelectionText: {
    color: '#7f8c8d',
    fontSize: 12,
    fontWeight: '500',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  processingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  processingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#7f8c8d',
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '80%',
    maxWidth: 400,
  },
  successModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
  },
  successModalMessage: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  successModalButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  successModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});