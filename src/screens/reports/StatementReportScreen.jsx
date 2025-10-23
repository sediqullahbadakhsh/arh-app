import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Modal,
  ActionSheetIOS,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";
import { getStatementReport } from "../../services/merchantApi";

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import StatementFilterModal from "./StatementFilterModal";

const { width } = Dimensions.get("window");

export default function StatementReportScreen({ navigation, route }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportMenuVisible, setExportMenuVisible] = useState(false);
  
  const [filter, setFilter] = useState({
    search: "",
    startDate: null,
    endDate: null,
    page: 1,
    limit: 20,
  });

  const [meta, setMeta] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });

  useEffect(() => {
    fetchStatements();
  }, [filter.startDate, filter.endDate, filter.page]);

  const fetchStatements = async (isRefresh = false) => {
    if (!filter.startDate || !filter.endDate) {
      if (!isRefresh) {
        // Auto-set to current month if no dates selected
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        setFilter(prev => ({
          ...prev,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }));
      }
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getStatementReport(filter);
      setData(response.data || []);
      setMeta(response.meta || {
        page: filter.page,
        pages: 1,
        total: 0,
        limit: filter.limit,
      });
    } catch (error) {
      console.error("Error fetching statements:", error);
      Alert.alert("Error", "Failed to load statements. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleFilterSubmit = (dateFilter) => {
    setFilter(prev => ({
      ...prev,
      ...dateFilter,
      page: 1,
    }));
    setIsFilterModalOpen(false);
  };

  const handleSearch = (text) => {
    setFilter(prev => ({ ...prev, search: text, page: 1 }));
  };

  const filteredData = data.filter(item => {
    if (!filter.search) return true;
    
    const searchLower = filter.search.toLowerCase();
    return (
      item.transactionId?.toLowerCase().includes(searchLower) ||
      item.transactionType?.toLowerCase().includes(searchLower) ||
      item.remarks?.toLowerCase().includes(searchLower) ||
      item.agent?.username?.toLowerCase().includes(searchLower)
    );
  });

  const handleExportMenu = () => {
    if (data.length === 0) {
      Alert.alert("No Data", "There is no data to export.");
      return;
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Export as Excel (CSV)', 'Export as PDF'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleExportCSV();
          } else if (buttonIndex === 2) {
            handleExportPDF();
          }
        }
      );
    } else {
      setExportMenuVisible(true);
    }
  };

const handleExportCSV = async () => {
  try {
    setExportLoading(true);
    setExportMenuVisible(false);

    if (data.length === 0) {
      Alert.alert("No Data", "There is no data to export.");
      return;
    }

    // Create CSV content
    const headers = ["Date", "Transaction ID", "Type", "Debit", "Credit", "Balance", "Remarks", "Agent"].join(',') + '\n';
    
    const csvRows = data.map(item => {
      return [
        `"${new Date(item.createdAt).toLocaleDateString()}"`,
        `"${item.transactionId || ''}"`,
        `"${item.transactionType || ''}"`,
        `"${item.debit ? parseFloat(item.debit).toFixed(2) : '0.00'}"`,
        `"${item.credit ? parseFloat(item.credit).toFixed(2) : '0.00'}"`,
        `"${parseFloat(item.walletBalance || 0).toFixed(2)}"`,
        `"${(item.remarks || 'N/A').replace(/"/g, '""')}"`,
        `"${(item.agent?.username || 'N/A').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = headers + csvRows.join('\n');
    const fileName = `statement-report-${Date.now()}.csv`;
    const fileUri = FileSystem.documentDirectory + fileName;

    // Use the legacy API (this should work)
    await FileSystem.writeAsStringAsync(fileUri, csvContent);

    // Check if sharing is available
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert("Sharing not available", "Sharing is not available on this device.");
      return;
    }

    // Share the file
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Share Statement Report',
      UTI: 'public.comma-separated-values-text'
    });

  } catch (error) {
    console.error("CSV Export failed:", error);
    Alert.alert(
      "Export Failed", 
      "Could not export the report. Please try again.\nError: " + error.message
    );
  } finally {
    setExportLoading(false);
  }
};
  const handleExportPDF = async () => {
    try {
      setExportLoading(true);
      setExportMenuVisible(false);

      // Create HTML content for PDF
      const htmlContent = `
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .title { font-size: 24px; font-weight: bold; color: #333; }
              .date-range { font-size: 14px; color: #666; margin-top: 5px; }
              .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
              .summary-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
              .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              .table th { background-color: #333; color: white; padding: 12px; text-align: left; }
              .table td { padding: 10px; border-bottom: 1px solid #ddd; }
              .debit { color: #EF4444; }
              .credit { color: #10B981; }
              .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">Statement Report</div>
              <div class="date-range">
                ${filter.startDate && filter.endDate 
                  ? `From ${formatDate(filter.startDate)} to ${formatDate(filter.endDate)}`
                  : 'All Transactions'
                }
              </div>
            </div>

            <div class="summary">
              <div class="summary-row">
                <strong>Total Records:</strong>
                <span>${data.length}</span>
              </div>
              <div class="summary-row">
                <strong>Total Debit:</strong>
                <span>AFN ${calculateTotalDebit().toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <strong>Total Credit:</strong>
                <span>AFN ${calculateTotalCredit().toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <strong>Net Amount:</strong>
                <span>AFN ${(calculateTotalCredit() - calculateTotalDebit()).toFixed(2)}</span>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Transaction ID</th>
                  <th>Type</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th>Balance</th>
                  <th>Remarks</th>
                  <th>Agent</th>
                </tr>
              </thead>
              <tbody>
                ${data.map(item => `
                  <tr>
                    <td>${new Date(item.createdAt).toLocaleDateString()}</td>
                    <td>${item.transactionId}</td>
                    <td>${item.transactionType}</td>
                    <td class="${item.debit ? 'debit' : ''}">${item.debit ? `AFN ${parseFloat(item.debit).toFixed(2)}` : '-'}</td>
                    <td class="${item.credit ? 'credit' : ''}">${item.credit ? `AFN ${parseFloat(item.credit).toFixed(2)}` : '-'}</td>
                    <td>AFN ${parseFloat(item.walletBalance).toFixed(2)}</td>
                    <td>${item.remarks || 'N/A'}</td>
                    <td>${item.agent?.username || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="footer">
              Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
            </div>
          </body>
        </html>
      `;

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      // Share the PDF file
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Statement Report as PDF',
      });

    } catch (error) {
      console.error("PDF Export failed:", error);
      Alert.alert("Export Failed", "Could not generate PDF. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const calculateTotalDebit = () => {
    return data.reduce((total, item) => total + (parseFloat(item.debit) || 0), 0);
  };

  const calculateTotalCredit = () => {
    return data.reduce((total, item) => total + (parseFloat(item.credit) || 0), 0);
  };

  const formatCurrency = (value) => {
    if (!value) return "AFN 0.00";
    return `AFN ${parseFloat(value).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Skeleton for Transaction Item
  const renderSkeletonTransaction = ({ item, index }) => (
    <View style={styles.txRow}>
      <View style={styles.txLeft}>
        <View style={styles.skeletonTxIcon} />
        <View style={styles.txInfo}>
          <View style={styles.skeletonTxTitle} />
          <View style={styles.skeletonTxSub} />
        </View>
      </View>
      <View style={styles.skeletonTxAmount} />
    </View>
  );

  const renderStatementItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.txRow}
      onPress={() => navigation.navigate('StatementDetail', { statement: item })}
      activeOpacity={0.7}
    >
      <View style={styles.txLeft}>
        <View
          style={[
            styles.txIconWrap,
            item.debit ? styles.txOutIcon : styles.txInIcon,
          ]}
        >
          <Ionicons
            name={item.debit ? "arrow-up" : "arrow-down"}
            size={18}
            color={item.debit ? Colors.primary : "#0BA360"}
          />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txTitle}>
            {item.transactionType}
          </Text>
          <Text style={styles.txSub}>
            {formatDateTime(item.createdAt)} • {item.transactionId}
          </Text>
          {item.remarks && (
            <Text style={styles.txRemarks} numberOfLines={1}>
              {item.remarks}
            </Text>
          )}
          {item.agent?.username && (
            <Text style={styles.txAgent}>
              Agent: {item.agent.username}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.txRight}>
        <Text
          style={[
            styles.txAmount,
            { color: item.debit ? Colors.primary : "#0BA360" },
          ]}
        >
          {item.debit ? "-" : "+"}
          {formatCurrency(item.debit || item.credit)}
        </Text>
        <Text style={styles.txBalance}>
          Bal: {formatCurrency(item.walletBalance)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={48} color="#CCCCCC" />
      <Text style={styles.emptyStateText}>No statements found</Text>
      <Text style={styles.emptyStateSubText}>
        {filter.startDate && filter.endDate 
          ? "No statements match your current filters."
          : "Generate a statement report by selecting a date range."
        }
      </Text>
      <TouchableOpacity 
        style={styles.generateButton}
        onPress={() => setIsFilterModalOpen(true)}
      >
        <Text style={styles.generateButtonText}>Generate Report</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search transactions..."
          placeholderTextColor={Colors.textSecondary}
          value={filter.search}
          onChangeText={handleSearch}
        />
      </View> */}

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setIsFilterModalOpen(true)}
        >
          <Ionicons name="filter" size={20} color={Colors.white} />
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.exportButton,
            (data.length === 0 || exportLoading) && styles.exportButtonDisabled
          ]}
          onPress={handleExportMenu}
          disabled={data.length === 0 || exportLoading}
        >
          {exportLoading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Ionicons name="download-outline" size={20} color={Colors.white} />
          )}
          <Text style={styles.exportButtonText}>
            {exportLoading ? "Exporting..." : "Export"}
          </Text>
        </TouchableOpacity>
      </View>

      {filter.startDate && filter.endDate && (
        <View style={styles.dateInfo}>
          <Text style={styles.dateInfoText}>
            Showing statements from {formatDate(filter.startDate)} to {formatDate(filter.endDate)}
          </Text>
          {meta.total > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.recordCount}>{meta.total} records found</Text>
              <Text style={styles.summaryText}>
                Debit: {formatCurrency(calculateTotalDebit())} • Credit: {formatCurrency(calculateTotalCredit())}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ServiceHeader 
        title="Statement Report" 
        onBack={() => navigation.goBack()} 
      />
      
      <FlatList
        data={loading ? [...Array(5)] : filteredData}
        renderItem={loading ? renderSkeletonTransaction : renderStatementItem}
        keyExtractor={(item, index) => item?.id || `skeleton-${index}`}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading && renderEmptyState}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchStatements(true)}
            colors={[Colors.primary]}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {loading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading statements...</Text>
        </View>
      )}

      {/* Export Options Modal for Android */}
      <Modal
        visible={exportMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExportMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setExportMenuVisible(false)}
        >
          <View style={styles.exportMenu}>
            <Text style={styles.exportMenuTitle}>Export As</Text>
            
            <TouchableOpacity 
              style={styles.exportOption}
              onPress={handleExportCSV}
            >
              <Ionicons name="document-text-outline" size={24} color="#10B981" />
              <View style={styles.exportOptionInfo}>
                <Text style={styles.exportOptionTitle}>Excel (CSV)</Text>
                <Text style={styles.exportOptionDesc}>Export as spreadsheet</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.exportOption}
              onPress={handleExportPDF}
            >
              <Ionicons name="document-attach-outline" size={24} color="#EF4444" />
              <View style={styles.exportOptionInfo}>
                <Text style={styles.exportOptionTitle}>PDF Document</Text>
                <Text style={styles.exportOptionDesc}>Export as printable document</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setExportMenuVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <StatementFilterModal
        visible={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onSubmit={handleFilterSubmit}
        isLoading={loading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 100,
    backgroundColor: Colors.white,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  header: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  filterButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  exportButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  exportButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  dateInfo: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  dateInfoText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  summaryText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  txIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txInIcon: {
    backgroundColor: 'rgba(11, 163, 96, 0.1)',
  },
  txOutIcon: {
    backgroundColor: 'rgba(215, 0, 0, 0.1)',
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  txSub: {
    color: '#9E9E9E',
    fontSize: 12,
    marginBottom: 2,
  },
  txRemarks: {
    color: '#9E9E9E',
    fontSize: 12,
    marginBottom: 2,
    fontStyle: 'italic',
  },
  txAgent: {
    color: '#9E9E9E',
    fontSize: 11,
  },
  txRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  txBalance: {
    color: '#9E9E9E',
    fontSize: 11,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#F8F8F8',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  generateButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  skeletonTxIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#E0E0E0',
  },
  skeletonTxTitle: {
    width: 180,
    height: 15,
    marginBottom: 6,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  skeletonTxSub: {
    width: 140,
    height: 12,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  skeletonTxAmount: {
    width: 80,
    height: 15,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  exportMenu: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  exportMenuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 12,
  },
  exportOptionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  exportOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  exportOptionDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  cancelButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});