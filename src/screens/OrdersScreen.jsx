import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Share,
  Platform,
  Dimensions
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from "../theme/colors";
import { getOrdersC, retryOrder } from '../services/order_services';
import ServiceHeader from '../components/ServiceHeader';
import { useNavigation } from '@react-navigation/native';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

const { width } = Dimensions.get('window');

const OrdersScreen = () => {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    page: 1,
    limit: 10,
  });
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation(); 
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const queryClient = useQueryClient();
  const viewShotRef = useRef();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['orders', filters],
    queryFn: () => getOrdersC(filters),
  });

  const retryOrderMutation = useMutation({
    mutationFn: (id) => retryOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      Alert.alert('Success', 'Order retry requested successfully');
    },
    onError: (error) => {
      console.error('Failed to retry order:', error);
      Alert.alert('Error', 'Failed to retry order. Please try again.');
    },
  });

  const goBack = () => {
    navigation.goBack();
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().then(() => setRefreshing(false));
  }, []);

  const handleSearch = (text) => {
    setFilters(prev => ({ ...prev, search: text, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleRetryOrder = (id) => {
    retryOrderMutation.mutate(id);
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  const handleResendOrder = (order) => {
    navigation.navigate('Topup1', { 
      resendOrder: {
        receiver: order.receiver,
        amount: order.amount
      }
    });
  };

  const requestMediaPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      return status === 'granted';
    }
    return false;
  };

  const downloadReceipt = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Info', 'Download feature is not available on web');
        return;
      }

      const hasPermission = await requestMediaPermission();
      if (!hasPermission) {
        Alert.alert('Permission required', 'Please allow access to save the receipt');
        return;
      }

      const uri = await viewShotRef.current.capture();
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('Receipts', asset, false);
      
      Alert.alert('Success', 'Receipt saved to your gallery');
    } catch (error) {
      console.error('Error saving receipt:', error);
      Alert.alert('Error', 'Failed to save receipt');
    }
  };

  const shareReceipt = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Info', 'Share feature is not available on web');
        return;
      }

      const uri = await viewShotRef.current.capture();
      await Share.share({
        url: uri,
        title: 'Order Receipt',
        message: 'Here is my order receipt',
      });
    } catch (error) {
      console.error('Error sharing receipt:', error);
    }
  };

  const OrderReceipt = ({ order }) => (
    <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
      <View style={styles.receiptContainer}>
        <View style={styles.receiptHeader}>
          <Text style={styles.receiptTitle}>ORDER RECEIPT</Text>
          <Text style={styles.receiptSubtitle}>Transaction Confirmation</Text>
        </View>
        
        <View style={styles.receiptDivider} />
        
        <View style={styles.receiptDetails}>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Transaction ID:</Text>
            <Text style={styles.receiptValue}>{order.txnNumber}</Text>
          </View>
          
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Date:</Text>
            <Text style={styles.receiptValue}>
              {new Date(order.createdAt).toLocaleString()}
            </Text>
          </View>
          
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Status:</Text>
            <View style={[
              styles.receiptStatus, 
              { backgroundColor: 
                order.status === 'succeeded' ? '#4caf50' : 
                order.status === 'failed' ? '#f44336' : 
                '#ff9800' 
              }
            ]}>
              <Text style={styles.receiptStatusText}>{order.status}</Text>
            </View>
          </View>
          
          <View style={styles.receiptDividerThin} />
          
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Receiver:</Text>
            <Text style={styles.receiptValue}>{order.receiver}</Text>
          </View>
          
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Amount:</Text>
            <Text style={[styles.receiptValue, styles.amountText]}>
              {Number(order.amount).toFixed(2)} {order.currency}
            </Text>
          </View>
          
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Payment Method:</Text>
            <Text style={styles.receiptValue}>
              {order.source?.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View style={styles.receiptDivider} />
        
        <View style={styles.receiptFooter}>
          <Text style={styles.thankYouText}>Thank you for your order!</Text>
          <Text style={styles.supportText}>
            For support, contact: support@example.com
          </Text>
        </View>
      </View>
    </ViewShot>
  );

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderHeader}>
        <View style={styles.orderIdContainer}>
          <Text style={styles.txnId}>TXN: {item.txnNumber}</Text>
          <View style={[styles.statusBadge, 
            { backgroundColor: 
              item.status === 'succeeded' ? '#4caf50' : 
              item.status === 'failed' ? '#f44336' : 
              '#ff9800' 
            }
          ]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      <View style={styles.orderBody}>
        <View style={styles.receiverInfo}>
          <Ionicons name="call" size={16} color="#666" />
          <Text style={styles.receiverText}>{item.receiver}</Text>
        </View>
        
        <View style={styles.amountInfo}>
          <Text style={styles.amountText}>
            {Number(item.amount).toFixed(2)} {item.currency}
          </Text>
          <Text style={styles.sourceText}>
            {item.source?.replace('_', ' ')}
          </Text>
        </View>
      </View>
      
      <View style={styles.orderFooter}>
        <View style={styles.actionButtons}>
          {item.status === 'failed' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleRetryOrder(item.id)}
              disabled={retryOrderMutation.isLoading}
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color={retryOrderMutation.isLoading ? '#ccc' : '#007AFF'} 
              />
              <Text style={styles.actionButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleResendOrder(item)}
          >
            <Ionicons name="return-up-forward" size={20} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Resend</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleViewDetails(item)}
          >
            <Ionicons name="receipt" size={20} color="#CD0202" />
            <Text style={styles.actionButtonText}>Receipt</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateText}>No orders found</Text>
      <Text style={styles.emptyStateSubText}>
        {filters.search || filters.status 
          ? 'Try adjusting your search or filters' 
          : 'Your orders will appear here'
        }
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
      <Text style={styles.errorStateText}>Failed to load orders</Text>
      <Text style={styles.errorStateSubText}>{error?.message}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={refetch}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ServiceHeader title="Orders" onBack={goBack} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Order History</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="filter" size={24} color="#CD0202" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Transaction ID or Receiver"
          value={filters.search}
          onChangeText={handleSearch}
        />
      </View>

      {isError ? (
        renderErrorState()
      ) : (
        <FlatList
          data={data?.data || []}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={!isLoading ? renderEmptyState() : null}
          contentContainerStyle={data?.data?.length === 0 ? styles.emptyList : styles.listContainer}
        />
      )}

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#CD0202" />
        </View>
      )}

      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Orders</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterOptions}>
              <Text style={styles.filterSectionTitle}>Status</Text>
              {['', 'pending', 'succeeded', 'failed'].map(status => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterOption,
                    filters.status === status && styles.filterOptionSelected
                  ]}
                  onPress={() => handleFilterChange('status', status)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filters.status === status && styles.filterOptionTextSelected
                  ]}>
                    {status === '' ? 'All Statuses' : status}
                  </Text>
                  {filters.status === status && (
                    <Ionicons name="checkmark" size={20} color="#CD0202" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={() => {
                  handleFilterChange('status', '');
                  setFilterModalVisible(false);
                }}
              >
                <Text style={styles.resetButtonText}>Reset Filters</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, styles.receiptModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Receipt</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.orderDetails}>
              {selectedOrder && <OrderReceipt order={selectedOrder} />}
              
              <View style={styles.receiptActions}>
                <TouchableOpacity 
                  style={[styles.receiptButton, styles.downloadButton]}
                  onPress={downloadReceipt}
                >
                  <Ionicons name="download" size={20} color="#fff" />
                  <Text style={styles.receiptButtonText}>Download</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.receiptButton, styles.shareButton]}
                  onPress={shareReceipt}
                >
                  <Ionicons name="share" size={20} color="#fff" />
                  <Text style={styles.receiptButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
              
              {selectedOrder?.status === 'failed' && (
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => {
                    handleRetryOrder(selectedOrder.id);
                    setDetailModalVisible(false);
                  }}
                  disabled={retryOrderMutation.isLoading}
                >
                  <Text style={styles.retryButtonText}>
                    {retryOrderMutation.isLoading ? 'Processing...' : 'Retry Order'}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
  orderItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  orderHeader: {
    marginBottom: 12,
  },
  orderIdContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  txnId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  orderBody: {
    marginBottom: 16,
  },
  receiverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  receiverText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  amountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  sourceText: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  errorState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f44336',
    marginTop: 16,
    marginBottom: 8,
  },
  errorStateSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#CD0202',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    padding: 16,
  },
  receiptModalContent: {
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterOptions: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterOptionSelected: {
    backgroundColor: '#f0f7ff',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333',
    textTransform: 'capitalize',
  },
  filterOptionTextSelected: {
    color: '#CD0202',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#CD0202',
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  orderDetails: {
    maxHeight: 640,
  },
  receiptContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 20,
    width: "100%",
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  receiptTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 5,
  },
  receiptSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  receiptDivider: {
    height: 2,
    backgroundColor: Colors.primary,
    marginVertical: 15,
  },
  receiptDividerThin: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
  },
  receiptDetails: {
    marginBottom: 15,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  receiptLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  receiptValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  receiptStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  receiptStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  receiptFooter: {
    alignItems: 'center',
  },
  thankYouText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  supportText: {
    fontSize: 12,
    color: '#666',
  },
  receiptActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  downloadButton: {
    backgroundColor: Colors.primary,
  },
  shareButton: {
    backgroundColor: '#4caf50',
  },
  receiptButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 5,
  },
});

export default OrdersScreen;