import React, { useState, useCallback } from 'react';
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
  StatusBar
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from "../theme/colors";
import { getOrdersC, retryOrder } from '../services/order_services';
import ServiceHeader from '../components/ServiceHeader';
import { useNavigation } from '@react-navigation/native';

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

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['orders', filters],
    queryFn: () => getOrdersC(filters),
  });
  console.log(data, "this is data of order")

  const retryOrderMutation = useMutation({
    mutationFn: (id) => retryOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      alert('Order retry requested successfully');
    },
    onError: (error) => {
      console.error('Failed to retry order:', error);
      alert('Failed to retry order. Please try again.');
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

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.orderItem} 
      onPress={() => handleViewDetails(item)}
    >
      <View style={styles.orderHeader}>
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
      
      <View style={styles.orderBody}>
        <View style={styles.receiverInfo}>
          <Ionicons name="person" size={16} color="#666" />
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
        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        
        <View style={styles.actionButtons}>
          {item.status === 'failed' && (
            <TouchableOpacity 
              onPress={() => handleRetryOrder(item.id)}
              disabled={retryOrderMutation.isLoading}
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color={retryOrderMutation.isLoading ? '#ccc' : '#007AFF'} 
              />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity onPress={() => handleViewDetails(item)}>
            <Ionicons name="eye" size={20} color="#CD0202" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
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
     <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
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
          contentContainerStyle={data?.data?.length === 0 ? styles.emptyList : null}
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
              {['', 'pending', 'succeeded', 'failed', ].map(status => (
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView style={styles.orderDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction ID</Text>
                  <Text style={styles.detailValue}>{selectedOrder.txnNumber}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Receiver</Text>
                  <Text style={styles.detailValue}>{selectedOrder.receiver}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={styles.detailValue}>
                    {Number(selectedOrder.amount).toFixed(2)} {selectedOrder.currency}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Source</Text>
                  <Text style={styles.detailValue}>
                    {selectedOrder.source?.replace('_', ' ')}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={[
                    styles.statusBadge, 
                    { 
                      backgroundColor: 
                        selectedOrder.status === 'success' ? '#4caf50' : 
                        selectedOrder.status === 'failed' ? '#f44336' : 
                        '#ff9800',
                      alignSelf: 'flex-start'
                    }
                  ]}>
                    <Text style={styles.statusText}>{selectedOrder.status}</Text>
                  </View>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Created At</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </Text>
                </View>
                
                {selectedOrder.status === 'failed' && (
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
            )}
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
    marginBottom: 12,
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
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderColor: "#CD0202",
    borderWidth: 1,
    padding: 16,
    shadowColor: '#0c5e35ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  txnId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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
  orderBody: {
    marginBottom: 12,
  },
  receiverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiverText: {
    marginLeft: 6,
    fontSize: 16,
    color: '#333',
  },
  amountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sourceText: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
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
    paddingVertical: 10,
    borderRadius: 8,
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
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterOptions: {
    padding: 16,
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
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
 
  resetButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    marginRight: 8,
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
    marginLeft: 8,
    backgroundColor: '#CD0202',
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  orderDetails: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});

export default OrdersScreen;