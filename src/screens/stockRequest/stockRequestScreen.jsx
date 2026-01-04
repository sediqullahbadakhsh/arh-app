import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Image,
  StyleSheet,
  Dimensions,
  Linking,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "../../context/userContext";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import moment from "moment";

import ServiceHeader from "../../components/ServiceHeader";
import PrimaryButton from "../../components/PrimaryButton";
import SuccessModal from "../../components/modals/SuccessModal";
import ErrorModal from "../../components/modals/ErrorModal";
import PurchaseRequestModal from "../../components/PurchaseRequestModal";
import { 
  getPurchaseRequests, 
  createPurchaseRequest 
} from "../../services/purchaseStockApi";
import FilterModal from "../../components/FilterModal";
import DateRangePicker from "../../components/DateRangePicker";

const { width, height } = Dimensions.get('window');

const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  
  const statusMap = {
    Pending: {
      color: "#F59E0B",
      backgroundColor: "#FEF3C7",
      icon: "time-outline",
      label: t('purchaseStock.statusOptions.pending')
    },
    Rejected: {
      color: "#DC2626",
      backgroundColor: "#FEE2E2",
      icon: "close-circle-outline",
      label: t('purchaseStock.statusOptions.rejected')
    },
    Approved: {
      color: "#059669",
      backgroundColor: "#D1FAE5",
      icon: "checkmark-circle-outline",
      label: t('purchaseStock.statusOptions.approved')
    },
    Verify: {
      color: "#3B82F6",
      backgroundColor: "#DBEAFE",
      icon: "shield-checkmark-outline",
      label: t('purchaseStock.statusOptions.verify')
    },
    Transfer: {
      color: "#8B5CF6",
      backgroundColor: "#EDE9FE",
      icon: "swap-horizontal-outline",
      label: t('purchaseStock.statusOptions.transfer')
    },
  };

  const config = statusMap[status] || {
    color: "#6B7280",
    backgroundColor: "#F3F4F6",
    icon: "help-circle-outline",
    label: status
  };

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.backgroundColor }]}>
      <Ionicons name={config.icon} size={14} color={config.color} style={styles.statusIcon} />
      <Text style={[styles.statusText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
};

export default function PurchaseStockScreen({ navigation }) {
  const { t } = useTranslation();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
    'createdAt[gte]': null,
    'createdAt[lte]': null,
    status: null,
    payment_method: null,
    'amount[gte]': null,
    'amount[lte]': null,
  });
  
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  const fetchPurchaseRequests = useCallback(async (page = 1, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (page === 1) {
        setLoading(true);
      }

      const params = {
        ...filters,
        page,
        limit: filters.limit,
      };

      Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === '') {
          delete params[key];
        }
      });

      const response = await getPurchaseRequests(params);
      const { data, meta } = response;
      
      if (page === 1) {
        setRequests(data || []);
      } else {
        setRequests(prev => [...prev, ...(data || [])]);
      }
      
      setTotalPages(meta?.pages || 1);
      setHasMore(page < (meta?.pages || 1));
    } catch (error) {
      console.error('Error fetching purchase requests:', error);
      Alert.alert(t('common.error'), t('purchaseStock.errorLoadingRequests'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, t]);

  useFocusEffect(
    useCallback(() => {
      fetchPurchaseRequests(1);
    }, [fetchPurchaseRequests])
  );

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = filters.page + 1;
      setFilters(prev => ({ ...prev, page: nextPage }));
      fetchPurchaseRequests(nextPage);
    }
  };

  const onRefresh = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    fetchPurchaseRequests(1, true);
  };

  const handleSearch = (text) => {
    setFilters(prev => ({ ...prev, search: text, page: 1 }));
  };

  const clearSearch = () => {
    setFilters(prev => ({ ...prev, search: "" }));
  };

  const handleApplyFilters = (filterValues) => {
    const newFilters = { ...filters, ...filterValues, page: 1 };
    setFilters(newFilters);
    setIsFilterModalVisible(false);
  };

  const handleApplyDateRange = (startDate, endDate) => {
    setFilters(prev => ({
      ...prev,
      'createdAt[gte]': startDate,
      'createdAt[lte]': endDate,
      page: 1,
    }));
    setIsDatePickerVisible(false);
  };

  const clearDateFilter = () => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters['createdAt[gte]'];
      delete newFilters['createdAt[lte]'];
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: "",
      'createdAt[gte]': null,
      'createdAt[lte]': null,
      status: null,
      payment_method: null,
      'amount[gte]': null,
      'amount[lte]': null,
    });
  };

  const formatDateRange = () => {
    if (!filters['createdAt[gte]'] || !filters['createdAt[lte]']) return null;
    const start = moment(filters['createdAt[gte]']).format('MMM D, YYYY');
    const end = moment(filters['createdAt[lte]']).format('MMM D, YYYY');
    return `${start} - ${end}`;
  };

  const isAnyFilterApplied = useMemo(() => {
    return (
      filters.search || 
      filters['createdAt[gte]'] || 
      filters['createdAt[lte]'] || 
      filters.status || 
      filters.payment_method || 
      filters['amount[gte]'] || 
      filters['amount[lte]']
    );
  }, [filters]);

  const handleCreateRequest = async (formData, file) => {
    try {
      const filesArray = file ? [file] : [];
      const requestData = {
        ...formData,
        customer_id: user?.id,
        note: formData.note || '',
      };

      await createPurchaseRequest(requestData, filesArray);
      
      setSuccessMessage(t('purchaseStock.requestSubmitted'));
      setSuccessModalVisible(true);
      setIsCreateModalVisible(false);
      
      onRefresh();
    } catch (error) {
      console.error('Error creating purchase request:', error);
      setErrorMessage(error?.message || t('purchaseStock.requestFailed'));
      setErrorModalVisible(true);
    }
  };

  const viewRequestDetails = (request) => {
    setSelectedRequest(request);
    setIsDetailModalVisible(true);
  };

  const renderRequestItem = ({ item }) => {
    const IMG_BASE_URL = process.env.EXPO_PUBLIC_IMG_BASE_URL1;
    
    const getAttachmentLink = (fileName) => {
      if (!fileName) return null;
      return `${IMG_BASE_URL}/uploads/salesRequest-attachments/${fileName}`;
    };

    const hasAttachment = item.attachments && item.attachments.length > 0;

    return (
      <TouchableOpacity 
        style={styles.requestCard}
        onPress={() => viewRequestDetails(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <Text style={styles.amountText}>
              AFN {parseFloat(item.amount).toFixed(2)}
            </Text>
            <Text style={styles.dateText}>
              {moment(item.createdAt).format('MMM D, YYYY h:mm A')}
            </Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('purchaseStock.columns.paymentMethod')}:</Text>
            <Text style={styles.detailValue}>{item.payment_method}</Text>
          </View>
          
          {item.note && (
            <View style={styles.noteContainer}>
              <Text style={styles.detailLabel}>{t('purchaseStock.columns.note')}:</Text>
              <Text style={styles.noteText} numberOfLines={2}>
                {item.note}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          {hasAttachment ? (
            <View style={styles.attachmentContainer}>
              <Ionicons name="document-attach-outline" size={16} color={Colors.primary} />
              <Text style={styles.attachmentText}>
                {t('purchaseStock.attachmentAvailable')}
              </Text>
            </View>
          ) : (
            <Text style={styles.noAttachmentText}>
              {t('purchaseStock.noAttachment')}
            </Text>
          )}
          
          <Ionicons name="chevron-forward" size={16} color="#9E9E9E" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={64} color="#CCCCCC" />
      <Text style={styles.emptyStateTitle}>
        {t('purchaseStock.noRequests')}
      </Text>
      <Text style={styles.emptyStateSubtitle}>
        {filters.search 
          ? t('purchaseStock.noResults', { search: filters.search })
          : t('purchaseStock.noRequestsAvailable')
        }
      </Text>
      {!filters.search && (
        <TouchableOpacity
          style={styles.createFirstButton}
          onPress={() => setIsCreateModalVisible(true)}
        >
          <Text style={styles.createFirstButtonText}>
            {t('purchaseStock.createFirstRequest')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={[styles.headerContainer, ]}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          placeholder={t('purchaseStock.searchPlaceholder')}
          value={filters.search}
          onChangeText={handleSearch}
          style={styles.searchInput}
          placeholderTextColor="#999"
        />
        {filters.search ? (
          <TouchableOpacity onPress={clearSearch} style={styles.clearSearchButton}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setIsDatePickerVisible(true)}
        >
          <Ionicons name="calendar-outline" size={20} color="#666" />
          <Text style={styles.filterButtonText} numberOfLines={1}>
            {filters['createdAt[gte]'] && filters['createdAt[lte]']
              ? formatDateRange()
              : t('purchaseStock.dateFilter')
            }
          </Text>
          {(filters['createdAt[gte]'] && filters['createdAt[lte]']) && (
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                clearDateFilter();
              }}
              style={styles.clearFilterButton}
            >
              <Ionicons name="close" size={16} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setIsFilterModalVisible(true)}
        >
          <Ionicons name="filter-outline" size={20} color="#666" />
          <Text style={styles.filterButtonText}>
            {t('purchaseStock.advanceFilter')}
          </Text>
          {isAnyFilterApplied && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>!</Text>
            </View>
          )}
        </TouchableOpacity>

        {isAnyFilterApplied && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={clearAllFilters}
          >
            <Text style={styles.clearAllButtonText}>
              {t('purchaseStock.clearAll')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ServiceHeader 
        title={t('purchaseStock.title')}
        onBack={() => navigation.goBack()}
      />
      
      <FlatList
        data={requests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading && renderEmptyState}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={
          loading && requests.length > 0 ? (
            <ActivityIndicator 
              size="large" 
              color={Colors.primary} 
              style={styles.loader}
            />
          ) : null
        }
      />

   
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setIsCreateModalVisible(true)}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
          <Text style={styles.createButtonText}>
            {t('purchaseStock.createRequest')}
          </Text>
        </TouchableOpacity>
      </View>

      {loading && requests.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            {t('purchaseStock.loadingRequests')}
          </Text>
        </View>
      )}

      <PurchaseRequestModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onSubmit={handleCreateRequest}
        isLoading={false}
      />

      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApply={handleApplyFilters}
        filterConfig={[
          {
            key: 'status',
            label: t('purchaseStock.columns.status'),
            type: 'dropdown',
            options: [
              { value: 'Pending', label: t('purchaseStock.statusOptions.pending') },
              { value: 'Approved', label: t('purchaseStock.statusOptions.approved') },
              { value: 'Rejected', label: t('purchaseStock.statusOptions.rejected') },
            ],
            multiSelect: false,
          },
          {
            key: 'payment_method',
            label: t('purchaseStock.columns.paymentMethod'),
            type: 'dropdown',
            options: [
              { value: 'Cash', label: t('cash') },
              { value: 'Bank', label: t('bank') },
              { value: 'Online', label: t('online') },
            ],
            multiSelect: false,
          },
          {
            key: 'amount',
            label: t('purchaseStock.amountRange'),
            type: 'range',
            min: 0,
            max: 100000,
            step: 100,
            unit: 'AFN',
          },
        ]}
        initialValues={filters}
      />

      {isDatePickerVisible && (
        <DateRangePicker
          visible={isDatePickerVisible}
          onClose={() => setIsDatePickerVisible(false)}
          onApply={handleApplyDateRange}
          initialStartDate={filters['createdAt[gte]']}
          initialEndDate={filters['createdAt[lte]']}
        />
      )}

      <Modal
        visible={isDetailModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setIsDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContainer}>
            {selectedRequest && (
              <>
                <View style={styles.detailModalHeader}>
                  <Text style={styles.detailModalTitle}>
                    {t('purchaseStock.requestDetails')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsDetailModalVisible(false)}
                    style={styles.detailCloseButton}
                  >
                    <Ionicons name="close" size={24} color={Colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.detailModalContent}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>
                      {t('purchaseStock.basicInfo')}
                    </Text>
                    <DetailItem 
                      label={t('purchaseStock.columns.amount')}
                      value={`AFN ${parseFloat(selectedRequest.amount).toFixed(2)}`}
                    />
                    <DetailItem 
                      label={t('purchaseStock.columns.paymentMethod')}
                      value={selectedRequest.payment_method}
                    />
                    <DetailItem 
                      label={t('purchaseStock.columns.status')}
                      value={<StatusBadge status={selectedRequest.status} />}
                    />
                    <DetailItem 
                      label={t('purchaseStock.columns.createdAt')}
                      value={moment(selectedRequest.createdAt).format('MMM D, YYYY h:mm A')}
                    />
                  </View>

                  {selectedRequest.note && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>
                        {t('purchaseStock.columns.note')}
                      </Text>
                      <Text style={styles.noteDetailText}>
                        {selectedRequest.note}
                      </Text>
                    </View>
                  )}

                  {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>
                        {t('purchaseStock.attachments')}
                      </Text>
                      {selectedRequest.attachments.map((attachment, index) => (
                        <AttachmentItem 
                          key={index}
                          fileName={attachment}
                          index={index}
                        />
                      ))}
                    </View>
                  )}
                </ScrollView>

                <View style={styles.detailModalFooter}>
                  <TouchableOpacity
                    style={styles.closeDetailButton}
                    onPress={() => setIsDetailModalVisible(false)}
                  >
                    <Text style={styles.closeDetailButtonText}>
                      {t('common.close')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <SuccessModal
        visible={successModalVisible}
        onClose={() => setSuccessModalVisible(false)}
        title={t('purchaseStock.success')}
        message={successMessage}
        buttonText={t('common.ok')}
      />

      <ErrorModal
        visible={errorModalVisible}
        onClose={() => setErrorModalVisible(false)}
        title={t('purchaseStock.error')}
        message={errorMessage}
        buttonText={t('common.tryAgain')}
      />
    </SafeAreaView>
  );
}

const DetailItem = ({ label, value }) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>{label}:</Text>
    <View style={styles.detailValueContainer}>
      {typeof value === 'string' ? (
        <Text style={styles.detailValueText}>{value}</Text>
      ) : (
        value
      )}
    </View>
  </View>
);

const AttachmentItem = ({ fileName, index }) => {
  const IMG_BASE_URL = process.env.EXPO_PUBLIC_IMG_BASE_URL1;
  const fileUrl = `${IMG_BASE_URL}/uploads/salesRequest-attachments/${fileName}`;
  
  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
      return 'image-outline';
    } else if (ext === 'pdf') {
      return 'document-outline';
    } else {
      return 'document-attach-outline';
    }
  };

  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    return ext.toUpperCase();
  };

  return (
    <TouchableOpacity 
      style={styles.attachmentItem}
      onPress={() => Linking.openURL(fileUrl)}
    >
      <Ionicons 
        name={getFileIcon(fileName)} 
        size={24} 
        color={Colors.primary} 
      />
      <View style={styles.attachmentInfo}>
        <Text style={styles.attachmentName} numberOfLines={1}>
          {fileName}
        </Text>
        <Text style={styles.attachmentType}>
          {getFileType(fileName)} • {t('purchaseStock.tapToView')}
        </Text>
      </View>
      <Ionicons name="open-outline" size={20} color="#999" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingBottom: 130,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80, 
    flexGrow: 1,
  },
  headerContainer: {
    paddingBottom: 16,
    backgroundColor: Colors.white,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E4E7EC',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    padding: 0,
  },
  clearSearchButton: {
    padding: 4,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    minWidth: 120,
    flex: 1,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  clearFilterButton: {
    padding: 2,
  },
  filterBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  clearAllButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearAllButtonText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },

  floatingButtonContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  createButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  requestCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardLeft: {
    flex: 1,
  },
  amountText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardBody: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  noteContainer: {
    marginTop: 8,
  },
  noteText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  attachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attachmentText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  noAttachmentText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  separator: {
    height: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  createFirstButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createFirstButtonText: {
    color: Colors.white,
    fontSize: 14,
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
  loader: {
    marginVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  detailModalContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  detailCloseButton: {
    padding: 4,
  },
  detailModalContent: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  detailValueContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  detailValueText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  noteDetailText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E7EC',
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E4E7EC',
  },
  attachmentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  attachmentName: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
    marginBottom: 2,
  },
  attachmentType: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  detailModalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  closeDetailButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeDetailButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});