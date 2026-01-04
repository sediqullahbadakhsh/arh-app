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
import { scale } from "../../utils/normalizeSize";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");

// Skeleton Loader Component
const StatementSkeleton = () => {
  return (
    <View style={styles.skeletonContainer}>
      {/* Header skeleton */}
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonFilterButton} />
        <View style={styles.skeletonExportButton} />
      </View>
      
      {/* Date info skeleton */}
      <View style={styles.skeletonDateInfo}>
        <View style={styles.skeletonDateText} />
        <View style={styles.skeletonSummaryRow}>
          <View style={styles.skeletonRecordCount} />
          <View style={styles.skeletonSummaryText} />
        </View>
      </View>
      
      {/* Transaction list skeletons */}
      {[...Array(5)].map((_, index) => (
        <View key={`skeleton-${index}`} style={styles.skeletonTransactionItem}>
          <View style={styles.skeletonLeft}>
            <View style={styles.skeletonIcon} />
            <View style={styles.skeletonInfo}>
              <View style={styles.skeletonTitle} />
              <View style={styles.skeletonSubtitle} />
              <View style={styles.skeletonRemarks} />
            </View>
          </View>
          <View style={styles.skeletonRight}>
            <View style={styles.skeletonAmount} />
            <View style={styles.skeletonBalance} />
          </View>
        </View>
      ))}
    </View>
  );
};

export default function StatementReportScreen({ navigation, route }) {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
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
    const initializeData = async () => {
      if (!filter.startDate || !filter.endDate) {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        setFilter(prev => ({
          ...prev,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }));
      } else {
        await fetchStatements();
      }
    };
    
    initializeData();
  }, []);

  useEffect(() => {
    if (filter.startDate && filter.endDate) {
      fetchStatements();
    }
  }, [filter.startDate, filter.endDate, filter.page]);

  const fetchStatements = async (isRefresh = false) => {
    if (!filter.startDate || !filter.endDate) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (!loading) {
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
      Alert.alert(t('error'), t('failedToLoadStatements'));
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
      Alert.alert(t('noData'), t('noDataToExport'));
      return;
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [t('cancel'), t('exportAsExcel'), t('exportAsPDF')],
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
        Alert.alert(t('noData'), t('noDataToExport'));
        return;
      }

      const headers = [t('date'), t('transactionId'), t('type'), t('debit'), t('credit'), t('balance'), t('remarks'), t('agent')].join(',') + '\n';
      
      const csvRows = data.map(item => {
        return [
          `"${new Date(item.createdAt).toLocaleDateString()}"`,
          `"${item.transactionId || ''}"`,
          `"${item.transactionType || ''}"`,
          `"${item.debit ? parseFloat(item.debit).toFixed(2) : '0.00'}"`,
          `"${item.credit ? parseFloat(item.credit).toFixed(2) : '0.00'}"`,
          `"${parseFloat(item.walletBalance || 0).toFixed(2)}"`,
          `"${(item.remarks || t('notAvailable')).replace(/"/g, '""')}"`,
          `"${(item.agent?.username || t('notAvailable')).replace(/"/g, '""')}"`
        ].join(',');
      });

      const csvContent = headers + csvRows.join('\n');
      const fileName = `statement-report-${Date.now()}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(t('sharingNotAvailable'), t('sharingNotAvailableMessage'));
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: t('shareStatementReport'),
        UTI: 'public.comma-separated-values-text'
      });

    } catch (error) {
      console.error("CSV Export failed:", error);
      Alert.alert(
        t('exportFailed'), 
        t('exportFailedMessage') + error.message
      );
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExportLoading(true);
      setExportMenuVisible(false);

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
              <div class="title">${t('statementReport')}</div>
              <div class="date-range">
                ${filter.startDate && filter.endDate 
                  ? `${t('from')} ${formatDate(filter.startDate)} ${t('to')} ${formatDate(filter.endDate)}`
                  : t('allTransactions')
                }
              </div>
            </div>

            <div class="summary">
              <div class="summary-row">
                <strong>${t('totalRecords')}:</strong>
                <span>${data.length}</span>
              </div>
              <div class="summary-row">
                <strong>${t('totalDebit')}:</strong>
                <span>AFN ${calculateTotalDebit().toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <strong>${t('totalCredit')}:</strong>
                <span>AFN ${calculateTotalCredit().toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <strong>${t('netAmount')}:</strong>
                <span>AFN ${(calculateTotalCredit() - calculateTotalDebit()).toFixed(2)}</span>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>${t('date')}</th>
                  <th>${t('transactionId')}</th>
                  <th>${t('type')}</th>
                  <th>${t('debit')}</th>
                  <th>${t('credit')}</th>
                  <th>${t('balance')}</th>
                  <th>${t('remarks')}</th>
                  <th>${t('agent')}</th>
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
                    <td>${item.remarks || t('notAvailable')}</td>
                    <td>${item.agent?.username || t('notAvailable')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="footer">
              ${t('generatedOn')} ${new Date().toLocaleDateString()} ${t('at')} ${new Date().toLocaleTimeString()}
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: t('shareStatementReportPDF'),
      });

    } catch (error) {
      console.error("PDF Export failed:", error);
      Alert.alert(t('exportFailed'), t('pdfExportFailed'));
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
              {t('agent')}: {item.agent.username}
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
          {t('balance')}: {formatCurrency(item.walletBalance)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={48} color="#CCCCCC" />
      <Text style={styles.emptyStateText}>{t('noStatementsFound')}</Text>
      <Text style={styles.emptyStateSubText}>
        {filter.startDate && filter.endDate 
          ? t('noStatementsMatchFilters')
          : t('generateStatementByDateRange')
        }
      </Text>
      <TouchableOpacity 
        style={styles.generateButton}
        onPress={() => setIsFilterModalOpen(true)}
      >
        <Text style={styles.generateButtonText}>{t('generateReport')}</Text>
      </TouchableOpacity>
    </View>
  );

  // Fixed header component with filter controls
  const FixedHeader = () => (
    <View style={styles.fixedHeader}>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setIsFilterModalOpen(true)}
        >
          <Ionicons name="filter" size={20} color={Colors.white} />
          <Text style={styles.filterButtonText}>{t('filter')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.exportButton,
            (data.length === 0 || exportLoading || loading) && styles.exportButtonDisabled
          ]}
          onPress={handleExportMenu}
          disabled={data.length === 0 || exportLoading || loading}
        >
          {exportLoading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Ionicons name="download-outline" size={20} color={Colors.white} />
          )}
          <Text style={styles.exportButtonText}>
            {exportLoading ? t('exporting') : t('export')}
          </Text>
        </TouchableOpacity>
      </View>

      {filter.startDate && filter.endDate && (
        <View style={styles.dateInfo}>
          <Text style={styles.dateInfoText}>
            {t('showingStatementsFrom')} {formatDate(filter.startDate)} {t('to')} {formatDate(filter.endDate)}
          </Text>
          {meta.total > 0 && !loading && (
            <View style={styles.summaryRow}>
              <Text style={styles.recordCount}>{meta.total} {t('recordsFound')}</Text>
              <Text style={styles.summaryText}>
                {t('debit')}: {formatCurrency(calculateTotalDebit())} • {t('credit')}: {formatCurrency(calculateTotalCredit())}
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
        title={t('statementReport')} 
        onBack={() => navigation.goBack()} 
      />
      
      {/* Fixed Header Section */}
      <FixedHeader />

      {/* Scrollable Transactions Section */}
      <View style={styles.scrollableSection}>
        {loading ? (
          <StatementSkeleton />
        ) : (
          <FlatList
            data={filteredData}
            renderItem={renderStatementItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={[
              styles.listContainer,
              filteredData.length === 0 && styles.emptyListContainer
            ]}
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
        )}
      </View>

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
            <Text style={styles.exportMenuTitle}>{t('exportAs')}</Text>
            
            <TouchableOpacity 
              style={styles.exportOption}
              onPress={handleExportCSV}
            >
              <Ionicons name="document-text-outline" size={24} color="#10B981" />
              <View style={styles.exportOptionInfo}>
                <Text style={styles.exportOptionTitle}>{t('excelCSV')}</Text>
                <Text style={styles.exportOptionDesc}>{t('exportAsSpreadsheet')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.exportOption}
              onPress={handleExportPDF}
            >
              <Ionicons name="document-attach-outline" size={24} color="#EF4444" />
              <View style={styles.exportOptionInfo}>
                <Text style={styles.exportOptionTitle}>{t('pdfDocument')}</Text>
                <Text style={styles.exportOptionDesc}>{t('exportAsPrintable')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setExportMenuVisible(false)}
            >
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
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
    backgroundColor: Colors.white,
  },
  fixedHeader: {
    paddingHorizontal: scale.wp(5),
    paddingTop: scale.hp(2.1),
    paddingBottom: scale.hp(1),
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  scrollableSection: {
    flex: 1,
  },
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: scale.wp(5),
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: scale.wp(3.1),
    marginBottom: scale.hp(2.1),
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: scale.hp(1.55),
    paddingVertical: scale.hp(1.55),
    gap: scale.wp(2),
  },
  filterButtonText: {
    color: Colors.white,
    fontSize: scale.hp(2.1),
    fontWeight: '600',
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: scale.hp(1.55),
    paddingVertical: scale.hp(1.55),
    gap: scale.wp(2),
  },
  exportButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  exportButtonText: {
    color: Colors.white,
    fontSize: scale.hp(2.1),
    fontWeight: '600',
  },
  dateInfo: {
    backgroundColor: '#F0F9FF',
    borderRadius: scale.hp(1),
    padding: scale.hp(1.55),
    borderLeftWidth: scale.wp(1),
    borderLeftColor: '#3B82F6',
  },
  dateInfoText: {
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
    fontWeight: '500',
    marginBottom: scale.hp(0.5),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordCount: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
  },
  summaryText: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale.hp(1.55),
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  txIconWrap: {
    width: scale.wp(10.4),
    height: scale.wp(10.4),
    borderRadius: scale.wp(5.2),
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: scale.wp(3.1),
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
    fontSize: scale.hp(2),
    fontWeight: '600',
    marginBottom: scale.hp(0.25),
  },
  txSub: {
    color: '#9E9E9E',
    fontSize: scale.hp(1.55),
    marginBottom: scale.hp(0.25),
  },
  txRemarks: {
    color: '#9E9E9E',
    fontSize: scale.hp(1.55),
    marginBottom: scale.hp(0.25),
    fontStyle: 'italic',
  },
  txAgent: {
    color: '#9E9E9E',
    fontSize: scale.hp(1.4),
  },
  txRight: {
    alignItems: 'flex-end',
    marginLeft: scale.wp(2),
  },
  txAmount: {
    fontSize: scale.hp(2),
    fontWeight: '700',
    marginBottom: scale.hp(0.5),
  },
  txBalance: {
    color: '#9E9E9E',
    fontSize: scale.hp(1.4),
    fontWeight: '500',
  },
  separator: {
    height: scale.hp(0.13),
    backgroundColor: '#F8F8F8',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale.hp(5.2),
  },
  emptyStateText: {
    color: '#666',
    fontSize: scale.hp(2.1),
    fontWeight: '600',
    marginTop: scale.hp(1.55),
    marginBottom: scale.hp(0.5),
  },
  emptyStateSubText: {
    color: '#999',
    fontSize: scale.hp(1.8),
    textAlign: 'center',
    marginBottom: scale.hp(2.1),
  },
  generateButton: {
    backgroundColor: Colors.primary,
    borderRadius: scale.hp(1.55),
    paddingHorizontal: scale.wp(6.2),
    paddingVertical: scale.hp(1.55),
  },
  generateButtonText: {
    color: Colors.white,
    fontSize: scale.hp(2.1),
    fontWeight: '600',
  },
  
  // Skeleton Styles
  skeletonContainer: {
    paddingHorizontal: scale.wp(5),
    paddingTop: scale.hp(2),
  },
  skeletonHeader: {
    flexDirection: 'row',
    gap: scale.wp(3.1),
    marginBottom: scale.hp(2.1),
  },
  skeletonFilterButton: {
    flex: 1,
    height: scale.hp(5.5),
    backgroundColor: '#E0E0E0',
    borderRadius: scale.hp(1.55),
  },
  skeletonExportButton: {
    flex: 1,
    height: scale.hp(5.5),
    backgroundColor: '#E0E0E0',
    borderRadius: scale.hp(1.55),
  },
  skeletonDateInfo: {
    backgroundColor: '#F0F0F0',
    borderRadius: scale.hp(1),
    padding: scale.hp(1.55),
    marginBottom: scale.hp(2.1),
  },
  skeletonDateText: {
    height: scale.hp(1.8),
    width: '70%',
    backgroundColor: '#D0D0D0',
    borderRadius: scale.hp(0.5),
    marginBottom: scale.hp(1),
  },
  skeletonSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skeletonRecordCount: {
    height: scale.hp(1.55),
    width: '30%',
    backgroundColor: '#D0D0D0',
    borderRadius: scale.hp(0.5),
  },
  skeletonSummaryText: {
    height: scale.hp(1.55),
    width: '50%',
    backgroundColor: '#D0D0D0',
    borderRadius: scale.hp(0.5),
  },
  skeletonTransactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale.hp(1.55),
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  skeletonLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  skeletonIcon: {
    width: scale.wp(10.4),
    height: scale.wp(10.4),
    borderRadius: scale.wp(5.2),
    backgroundColor: '#E0E0E0',
    marginRight: scale.wp(3.1),
  },
  skeletonInfo: {
    flex: 1,
  },
  skeletonTitle: {
    height: scale.hp(2),
    width: '60%',
    backgroundColor: '#E0E0E0',
    borderRadius: scale.hp(0.5),
    marginBottom: scale.hp(0.8),
  },
  skeletonSubtitle: {
    height: scale.hp(1.55),
    width: '80%',
    backgroundColor: '#E0E0E0',
    borderRadius: scale.hp(0.5),
    marginBottom: scale.hp(0.8),
  },
  skeletonRemarks: {
    height: scale.hp(1.55),
    width: '90%',
    backgroundColor: '#E0E0E0',
    borderRadius: scale.hp(0.5),
  },
  skeletonRight: {
    alignItems: 'flex-end',
    marginLeft: scale.wp(2),
  },
  skeletonAmount: {
    height: scale.hp(2),
    width: scale.wp(20.8),
    backgroundColor: '#E0E0E0',
    borderRadius: scale.hp(0.5),
    marginBottom: scale.hp(0.5),
  },
  skeletonBalance: {
    height: scale.hp(1.4),
    width: scale.wp(15.6),
    backgroundColor: '#E0E0E0',
    borderRadius: scale.hp(0.5),
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale.wp(5),
  },
  exportMenu: {
    backgroundColor: Colors.white,
    borderRadius: scale.hp(2.1),
    padding: scale.hp(2.6),
    width: '100%',
    maxWidth: scale.wp(104),
  },
  exportMenuTitle: {
    fontSize: scale.hp(2.35),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scale.hp(2.1),
    textAlign: 'center',
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale.hp(2.1),
    borderRadius: scale.hp(1.55),
    backgroundColor: '#F8FAFC',
    marginBottom: scale.hp(1.55),
  },
  exportOptionInfo: {
    flex: 1,
    marginLeft: scale.wp(3.1),
  },
  exportOptionTitle: {
    fontSize: scale.hp(2.1),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scale.hp(0.25),
  },
  exportOptionDesc: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
  },
  cancelButton: {
    padding: scale.hp(2.1),
    borderRadius: scale.hp(1.55),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    marginTop: scale.hp(1),
  },
  cancelButtonText: {
    fontSize: scale.hp(2.1),
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});