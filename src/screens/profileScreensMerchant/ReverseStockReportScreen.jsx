import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";
import { getReverseStocksForMerchant } from "../../services/reverseStockApi";
import { useAuth } from "../../auth/AuthProvider";
import { useTranslation } from "react-i18next";
import { scale } from "../../utils/normalizeSize";

const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  
  const statusConfig = {
    under_process: {
      color: "#F59E0B",
      backgroundColor: "#FEF3C7",
      label: "Under Process"
    },
    rejected: {
      color: "#DC2626",
      backgroundColor: "#FEE2E2",
      label: "Rejected"
    },
    reversed: {
      color: "#059669",
      backgroundColor: "#D1FAE5",
      label: "Completed"
    }
  };

  const config = statusConfig[status] || {
    color: "#6B7280",
    backgroundColor: "#F3F4F6",
    label: status
  };

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.backgroundColor }]}>
      <Text style={[styles.statusText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
};

export default function ReverseStockReportScreen({ navigation }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const fetchReverseStocks = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getReverseStocksForMerchant({
        page: 1,
        limit: 50,
        search: searchQuery,
      });
      setData(response.data || []);
    } catch (error) {
      console.error("Error fetching reverse stocks:", error);
      Alert.alert("Error", "Failed to load reverse stock requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReverseStocks();
  }, [searchQuery]);

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const showRequestDetails = (request) => {
    setSelectedRequest(request);
    setDetailModalVisible(true);
  };

  const renderReverseStockItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.itemCard}
      onPress={() => showRequestDetails(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemHeader}>
        <View style={styles.itemLeft}>
          <Text style={styles.agentName}>
            {item?.source?.username || "Unknown Agent"}
          </Text>
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.itemBody}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Amount:</Text>
          <Text style={styles.amountValue}>AFN {parseFloat(item.amount).toFixed(2)}</Text>
        </View>

        {item.comment && (
          <View style={styles.commentRow}>
            <Text style={styles.commentLabel}>Comment:</Text>
            <Text style={styles.commentText} numberOfLines={2}>
              {item.comment}
            </Text>
          </View>
        )}

        {item.attachment && (
          <View style={styles.attachmentRow}>
            <Ionicons name="document-attach-outline" size={16} color={Colors.primary} />
            <Text style={styles.attachmentText}>Attachment Available</Text>
          </View>
        )}
      </View>

      <View style={styles.itemFooter}>
        <Text style={styles.requestId}>ID: {item.id}</Text>
        <Ionicons name="chevron-forward" size={16} color="#9E9E9E" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={48} color="#CCCCCC" />
      <Text style={styles.emptyStateText}>No Reverse Stock Requests</Text>
      <Text style={styles.emptyStateSubText}>
        {searchQuery 
          ? `No results found for "${searchQuery}"`
          : "You haven't made any reverse stock requests yet"
        }
      </Text>
      {!searchQuery && (
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => navigation.navigate("ReverseStockScreen")}
        >
          <Text style={styles.createButtonText}>Create New Request</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          placeholder="Search requests..."
          value={searchQuery}
          onChangeText={handleSearch}
          style={styles.searchInput}
          placeholderTextColor="#999"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={clearSearch}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{data.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#F59E0B' }]}>
            {data.filter(item => item.status === 'under_process').length}
          </Text>
          <Text style={styles.statLabel}>Processing</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#059669' }]}>
            {data.filter(item => item.status === 'reversed').length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>
    </View>
  );

  const RequestDetailModal = () => (
    <Modal
      visible={detailModalVisible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => setDetailModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Request Details</Text>
            <TouchableOpacity 
              onPress={() => setDetailModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedRequest && (
              <>
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Basic Information</Text>
                  <DetailRow label="Request ID" value={selectedRequest.id} />
                  <DetailRow label="Agent" value={selectedRequest.source?.username} />
                  <DetailRow label="Phone" value={selectedRequest.source?.mobileNumber} />
                  <DetailRow label="Date" value={
                    new Date(selectedRequest.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  } />
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Request Details</Text>
                  <DetailRow label="Amount" value={`AFN ${parseFloat(selectedRequest.amount).toFixed(2)}`} />
                  <DetailRow label="Status" value={
                    <StatusBadge status={selectedRequest.status} />
                  } />
                  {selectedRequest.comment && (
                    <View style={styles.commentDetail}>
                      <Text style={styles.detailLabel}>Comment:</Text>
                      <Text style={styles.commentDetailText}>{selectedRequest.comment}</Text>
                    </View>
                  )}
                </View>

                {selectedRequest.attachment && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Attachment</Text>
                    <TouchableOpacity style={styles.attachmentDetail}>
                      <Ionicons name="document-attach-outline" size={24} color={Colors.primary} />
                      <Text style={styles.attachmentDetailText}>View Attachment</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setDetailModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ServiceHeader 
        title="Reverse Stock Reports" 
        onBack={() => navigation.goBack()} 
      />
      
      <FlatList
        data={data}
        renderItem={renderReverseStockItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading && renderEmptyState}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchReverseStocks(true)}
            colors={[Colors.primary]}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {loading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      )}

      <RequestDetailModal />
    </SafeAreaView>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <View style={styles.detailValueContainer}>
        {typeof value === 'string' ? (
          <Text style={styles.detailValue}>{value}</Text>
        ) : (
          value
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: scale.hp(20),
    backgroundColor: Colors.white,
  },
  listContainer: {
    paddingHorizontal: scale.wp(5),
    paddingTop: scale.hp(2.1),
    paddingBottom: scale.hp(2.6),
    flexGrow: 1,
  },
  header: {
    marginBottom: scale.hp(2.1),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: scale.hp(1.55),
    paddingHorizontal: scale.wp(4.2),
    paddingVertical: scale.hp(1.55),
    marginBottom: scale.hp(2.1),
  },
  searchIcon: {
    marginRight: scale.wp(2.1),
  },
  searchInput: {
    flex: 1,
    fontSize: scale.hp(2.1),
    color: Colors.textPrimary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: scale.hp(1.55),
    padding: scale.hp(2.1),
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: scale.hp(2.6),
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
    marginTop: scale.hp(0.5),
  },
  itemCard: {
    backgroundColor: Colors.white,
    borderRadius: scale.hp(1.55),
    padding: scale.hp(2.1),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale.hp(0.26) },
    shadowOpacity: 0.1,
    shadowRadius: scale.hp(0.8),
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: scale.hp(1.55),
  },
  itemLeft: {
    flex: 1,
  },
  agentName: {
    fontSize: scale.hp(2.1),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scale.hp(0.5),
  },
  dateText: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: scale.wp(3.1),
    paddingVertical: scale.hp(0.5),
    borderRadius: scale.hp(1),
  },
  statusText: {
    fontSize: scale.hp(1.55),
    fontWeight: '500',
  },
  itemBody: {
    marginTop: scale.hp(1.05),
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale.hp(1.05),
  },
  amountLabel: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  amountValue: {
    fontSize: scale.hp(2.1),
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  commentRow: {
    marginBottom: scale.hp(1.05),
  },
  commentLabel: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: scale.hp(0.5),
  },
  commentText: {
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
    lineHeight: scale.hp(2.35),
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale.wp(2),
  },
  attachmentText: {
    fontSize: scale.hp(1.8),
    color: Colors.primary,
    fontWeight: '500',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scale.hp(1.55),
    paddingTop: scale.hp(1.05),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  requestId: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
  },
  separator: {
    height: scale.hp(1.55),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale.hp(10.4),
  },
  emptyStateText: {
    color: '#666',
    fontSize: scale.hp(2.1),
    fontWeight: '600',
    marginTop: scale.hp(1.55),
    marginBottom: scale.hp(0.5),
    textAlign: 'center',
  },
  emptyStateSubText: {
    color: '#999',
    fontSize: scale.hp(1.8),
    textAlign: 'center',
    marginBottom: scale.hp(2.1),
    lineHeight: scale.hp(2.35),
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: scale.hp(1.55),
    paddingHorizontal: scale.wp(6.2),
    paddingVertical: scale.hp(1.55),
  },
  createButtonText: {
    color: Colors.white,
    fontSize: scale.hp(2.1),
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: scale.hp(1.55),
    fontSize: scale.hp(2.1),
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale.wp(5),
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderRadius: scale.hp(2.6),
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scale.hp(2.6),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: scale.hp(2.35),
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: scale.hp(0.5),
  },
  modalContent: {
    padding: scale.hp(2.6),
  },
  detailSection: {
    marginBottom: scale.hp(2.6),
  },
  detailSectionTitle: {
    fontSize: scale.hp(2.1),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scale.hp(1.55),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale.hp(1.05),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  detailValueContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  detailValue: {
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  commentDetail: {
    paddingVertical: scale.hp(1.05),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  commentDetailText: {
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
    lineHeight: scale.hp(2.35),
    marginTop: scale.hp(0.5),
  },
  attachmentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale.hp(1.55),
    backgroundColor: '#F0F9FF',
    borderRadius: scale.hp(1.3),
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  attachmentDetailText: {
    fontSize: scale.hp(1.8),
    color: Colors.primary,
    fontWeight: '500',
    marginLeft: scale.wp(2.1),
  },
  modalFooter: {
    padding: scale.hp(2.6),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalButton: {
    backgroundColor: Colors.primary,
    borderRadius: scale.hp(1.3),
    padding: scale.hp(1.55),
    alignItems: 'center',
  },
  modalButtonText: {
    color: Colors.white,
    fontSize: scale.hp(1.8),
    fontWeight: '600',
  },
});