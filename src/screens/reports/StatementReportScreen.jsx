import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";
import { getStatementReport } from "../../services/merchantApi";

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import StatementFilterModal from "./StatementFilterModal";

export default function StatementReportScreen({ navigation, route }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  
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
    // Implement search filtering locally for now
    // In a real app, you might want to debounce and call API
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

  const handleExport = async () => {
    if (data.length === 0) {
      Alert.alert("No Data", "There is no data to export.");
      return;
    }

    try {
      setExportLoading(true);

      // Create CSV content
      const headers = "Date,Transaction ID,Type,Debit,Credit,Balance,Remarks,Agent\n";
      
      const csvContent = data.map(item => {
        const row = [
          `"${new Date(item.createdAt).toLocaleDateString()}"`,
          `"${item.transactionId}"`,
          `"${item.transactionType}"`,
          `"${item.debit ? parseFloat(item.debit).toFixed(2) : '0.00'}"`,
          `"${item.credit ? parseFloat(item.credit).toFixed(2) : '0.00'}"`,
          `"${parseFloat(item.walletBalance).toFixed(2)}"`,
          `"${item.remarks || 'N/A'}"`,
          `"${item.agent?.username || 'N/A'}"`
        ].join(',');
        return row;
      }).join('\n');

      const fullCsv = headers + csvContent;

      // Save CSV file
      const uri = FileSystem.documentDirectory + `statement-report-${Date.now()}.csv`;
      
      await FileSystem.writeAsStringAsync(uri, fullCsv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share the file
      await Sharing.shareAsync(uri, {
        mimeType: 'text/csv',
        dialogTitle: 'Share Statement Report',
      });

    } catch (error) {
      console.error("Export failed:", error);
      Alert.alert("Export Failed", "Could not export the report. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return "-";
    return `AFN ${parseFloat(value).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderStatementItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.statementCard}
      onPress={() => navigation.navigate('StatementDetail', { statement: item })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionId}>{item.transactionId}</Text>
          <Text style={styles.transactionType}>
            {item.transactionType}
          </Text>
        </View>
        <View style={styles.amountSection}>
          {item.debit ? (
            <Text style={[styles.amount, styles.debit]}>
              -{formatCurrency(item.debit)}
            </Text>
          ) : (
            <Text style={[styles.amount, styles.credit]}>
              +{formatCurrency(item.credit)}
            </Text>
          )}
          <Text style={styles.balance}>
            {formatCurrency(item.walletBalance)}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.detailText}>{formatDate(item.createdAt)}</Text>
        </View>
        
        {item.remarks && (
          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.remarks}
            </Text>
          </View>
        )}

        {item.agent?.username && (
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{item.agent.username}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.debit ? '#FEF2F2' : '#F0FDF4' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.debit ? '#EF4444' : '#10B981' }
          ]}>
            {item.debit ? 'Debit' : 'Credit'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={64} color="#CBD5E1" />
      <Text style={styles.emptyTitle}>No Statements Found</Text>
      <Text style={styles.emptySubtitle}>
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
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search transactions..."
          placeholderTextColor={Colors.textSecondary}
          value={filter.search}
          onChangeText={handleSearch}
        />
      </View>

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
          onPress={handleExport}
          disabled={data.length === 0 || exportLoading}
        >
          {exportLoading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Ionicons name="download-outline" size={20} color={Colors.white} />
          )}
          <Text style={styles.exportButtonText}>
            {exportLoading ? "Exporting..." : "Export CSV"}
          </Text>
        </TouchableOpacity>
      </View>

      {filter.startDate && filter.endDate && (
        <View style={styles.dateInfo}>
          <Text style={styles.dateInfoText}>
            Showing statements from {formatDate(filter.startDate)} to {formatDate(filter.endDate)}
          </Text>
          {meta.total > 0 && (
            <Text style={styles.recordCount}>{meta.total} records found</Text>
          )}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader 
        title="Statement Report" 
        onBack={() => navigation.goBack()} 
      />
      
      <FlatList
        data={filteredData}
        renderItem={renderStatementItem}
        keyExtractor={(item) => item.id}
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
  },
  recordCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statementCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionId: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  transactionType: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  debit: {
    color: '#EF4444',
  },
  credit: {
    color: '#10B981',
  },
  balance: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  cardBody: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  separator: {
    height: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
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
});