import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  Dimensions,
  Animated,
  Easing
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getOrdersC, retryOrder } from '../../services/order_services';
import { useNavigation } from '@react-navigation/native';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import OrderStyles from './OrderStyles';
const { height: screenHeight } = Dimensions.get('window');
import { Colors } from "../../theme/colors";
import OrdersHeader from './OrdersHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  
 
  const [detailSlideAnim] = useState(new Animated.Value(screenHeight));
  const [filterSlideAnim] = useState(new Animated.Value(screenHeight));
  const insets = useSafeAreaInsets();

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


  useEffect(() => {
    if (detailModalVisible) {
      Animated.timing(detailSlideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.back(1)),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(detailSlideAnim, {
        toValue: screenHeight,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [detailModalVisible]);

  useEffect(() => {
    if (filterModalVisible) {
      Animated.timing(filterSlideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.back(1)),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(filterSlideAnim, {
        toValue: screenHeight,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [filterModalVisible]);

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


  const SkeletonLoader = () => (
    <SafeAreaView style={OrderStyles.container}>
      <OrdersHeader title="Orders" onBack={goBack} onFilter={() => {}} />
      
  
      <View style={OrderStyles.searchContainer}>
        <View style={OrderStyles.skeletonSearchIcon} />
        <View style={OrderStyles.skeletonSearchInput} />
      </View>


      <FlatList
        data={[1, 2, 3, 4, 5]}
        renderItem={() => (
          <View style={OrderStyles.skeletonOrderItem}>
 
            <View style={OrderStyles.skeletonOrderHeader}>
              <View style={OrderStyles.skeletonTxnId} />
              <View style={OrderStyles.skeletonStatus} />
            </View>
            
         
            <View style={OrderStyles.skeletonDate} />
            
        
            <View style={OrderStyles.skeletonOrderBody}>
              <View style={OrderStyles.skeletonReceiverInfo}>
                <View style={OrderStyles.skeletonReceiverIcon} />
                <View style={OrderStyles.skeletonReceiverText} />
              </View>
              <View style={OrderStyles.skeletonAmountInfo}>
                <View style={OrderStyles.skeletonAmount} />
                <View style={OrderStyles.skeletonSource} />
              </View>
            </View>
            
        
            <View style={OrderStyles.skeletonOrderFooter}>
              <View style={OrderStyles.skeletonActionButtons}>
                <View style={OrderStyles.skeletonActionButton} />
                <View style={OrderStyles.skeletonActionButton} />
                <View style={OrderStyles.skeletonActionButton} />
              </View>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.toString()}
        contentContainerStyle={OrderStyles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );

  const OrderReceipt = ({ order }) => (
    <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
      <View style={OrderStyles.receiptContainer}>
        <View style={OrderStyles.receiptHeader}>
          <Text style={OrderStyles.receiptTitle}>ORDER RECEIPT</Text>
          <Text style={OrderStyles.receiptSubtitle}>Transaction Confirmation</Text>
        </View>
        
        <View style={OrderStyles.receiptDivider} />
        
        <View style={OrderStyles.receiptDetails}>
          <View style={OrderStyles.receiptRow}>
            <Text style={OrderStyles.receiptLabel}>Transaction ID:</Text>
            <Text style={OrderStyles.receiptValue}>{order.txnNumber}</Text>
          </View>
          
          <View style={OrderStyles.receiptRow}>
            <Text style={OrderStyles.receiptLabel}>Date:</Text>
            <Text style={OrderStyles.receiptValue}>
              {new Date(order.createdAt).toLocaleString()}
            </Text>
          </View>
          
          <View style={OrderStyles.receiptRow}>
            <Text style={OrderStyles.receiptLabel}>Status:</Text>
            <View style={[
              OrderStyles.receiptStatus, 
              { backgroundColor: 
                order.status === 'succeeded' ? '#4caf50' : 
                order.status === 'failed' ? '#f44336' : 
                '#ff9800' 
              }
            ]}>
              <Text style={OrderStyles.receiptStatusText}>{order.status}</Text>
            </View>
          </View>
          
          <View style={OrderStyles.receiptDividerThin} />
          
          <View style={OrderStyles.receiptRow}>
            <Text style={OrderStyles.receiptLabel}>Receiver:</Text>
            <Text style={OrderStyles.receiptValue}>{order.receiver}</Text>
          </View>
          
          <View style={OrderStyles.receiptRow}>
            <Text style={OrderStyles.receiptLabel}>Amount:</Text>
            <Text style={[OrderStyles.receiptValue, OrderStyles.amountText]}>
              {Number(order.amount).toFixed(2)} {order.currency}
            </Text>
          </View>
          
          <View style={OrderStyles.receiptRow}>
            <Text style={OrderStyles.receiptLabel}>Payment Method:</Text>
            <Text style={OrderStyles.receiptValue}>
              {order.source?.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View style={OrderStyles.receiptDivider} />
        
        <View style={OrderStyles.receiptFooter}>
          <Text style={OrderStyles.thankYouText}>Thank you for your order!</Text>
          <Text style={OrderStyles.supportText}>
            For support, contact: support@example.com
          </Text>
        </View>
      </View>
    </ViewShot>
  );

  const FilterModal = () => (
    <Modal
      visible={filterModalVisible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={OrderStyles.modalOverlay}>
        <TouchableOpacity 
          style={OrderStyles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        />
        <Animated.View 
          style={[
            OrderStyles.modalCard,
            { 
              transform: [{ translateY: filterSlideAnim }],
              height: '60%',
              // marginBottom: -insets.bottom
            }
          ]}
        >
          <View style={OrderStyles.modalHeader}>
            <Text style={OrderStyles.modalTitle}>Filter Orders</Text>
            <TouchableOpacity 
              onPress={() => setFilterModalVisible(false)}
              style={OrderStyles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={OrderStyles.filterOptions}>
            <Text style={OrderStyles.filterSectionTitle}>Status</Text>
            {['', 'pending', 'succeeded', 'failed'].map(status => (
              <TouchableOpacity
                key={status}
                style={[
                  OrderStyles.filterOption,
                  filters.status === status && OrderStyles.filterOptionSelected
                ]}
                onPress={() => handleFilterChange('status', status)}
              >
                <Text style={[
                  OrderStyles.filterOptionText,
                  filters.status === status && OrderStyles.filterOptionTextSelected
                ]}>
                  {status === '' ? 'All Statuses' : status}
                </Text>
                {filters.status === status && (
                  <Ionicons name="checkmark" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={OrderStyles.modalActions}>
            <TouchableOpacity 
              style={OrderStyles.resetButton}
              onPress={() => {
                handleFilterChange('status', '');
                setFilterModalVisible(false);
              }}
            >
              <Text style={OrderStyles.resetButtonText}>Reset Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={OrderStyles.applyButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={OrderStyles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  const DetailModal = () => (
    <Modal
      visible={detailModalVisible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={() => setDetailModalVisible(false)}
    >
      <View style={OrderStyles.modalOverlay}>
        <TouchableOpacity 
          style={OrderStyles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setDetailModalVisible(false)}
        />
        <Animated.View 
          style={[
            OrderStyles.modalCard,
            { 
              transform: [{ translateY: detailSlideAnim }],
              height: '95%',
              marginBottom: -insets.bottom
            }
          ]}
        >
          <View style={OrderStyles.modalHeader}>
            <Text style={OrderStyles.modalTitle}>Order Receipt</Text>
            <TouchableOpacity 
              onPress={() => setDetailModalVisible(false)}
              style={OrderStyles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={OrderStyles.orderDetails}>
            {selectedOrder && <OrderReceipt order={selectedOrder} />}
            
            <View style={OrderStyles.receiptActions}>
              <TouchableOpacity 
                style={[OrderStyles.receiptButton, OrderStyles.downloadButton]}
                onPress={downloadReceipt}
              >
                <Ionicons name="download" size={20} color="#fff" />
                <Text style={OrderStyles.receiptButtonText}>Download</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[OrderStyles.receiptButton, OrderStyles.shareButton]}
                onPress={shareReceipt}
              >
                <Ionicons name="share" size={20} color="#fff" />
                <Text style={OrderStyles.receiptButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
            
            {selectedOrder?.status === 'failed' && (
              <TouchableOpacity 
                style={OrderStyles.retryButton}
                onPress={() => {
                  handleRetryOrder(selectedOrder.id);
                  setDetailModalVisible(false);
                }}
                disabled={retryOrderMutation.isLoading}
              >
                <Text style={OrderStyles.retryButtonText}>
                  {retryOrderMutation.isLoading ? 'Processing...' : 'Retry Order'}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );

  const renderOrderItem = ({ item }) => (
    <View style={OrderStyles.orderItem}>
      <View style={OrderStyles.orderHeader}>
        <View style={OrderStyles.orderIdContainer}>
          <Text style={OrderStyles.txnId}>TXN: {item.txnNumber}</Text>
          <View style={[OrderStyles.statusBadge, 
            { backgroundColor: 
              item.status === 'succeeded' ? '#4caf50' : 
              item.status === 'failed' ? '#f44336' : 
              '#ff9800' 
            }
          ]}>
            <Text style={OrderStyles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>
      
      <View style={OrderStyles.orderBody}>
        <View style={OrderStyles.receiverInfo}>
          <View style={OrderStyles.receiverInfo1}>
            <Ionicons name="call" size={16} color="#666" />
            <Text style={OrderStyles.receiverText}>{item.receiver}</Text>
          </View>
          <Text style={OrderStyles.dateText}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={OrderStyles.amountInfo}>
          <Text style={OrderStyles.amountText}>
            {Number(item.amount).toFixed(2)} {item.currency}
          </Text>
          {/* <Text style={OrderStyles.sourceText}>
            {item.source?.replace('_', ' ')}
          </Text> */}
        </View>
      </View>
      
      <View style={OrderStyles.orderFooter}>
        <View style={OrderStyles.actionButtons}>
          {item.status === 'failed' && (
            <TouchableOpacity 
              style={OrderStyles.actionButton}
              onPress={() => handleRetryOrder(item.id)}
              disabled={retryOrderMutation.isLoading}
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color={retryOrderMutation.isLoading ? '#ccc' : '#007AFF'} 
              />
              <Text style={OrderStyles.actionButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={OrderStyles.actionButton}
            onPress={() => handleResendOrder(item)}
          >
            <Ionicons name="return-up-forward" size={20} color={Colors.primary} />
            <Text style={OrderStyles.actionButtonText}>Resend</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={OrderStyles.actionButton}
            onPress={() => handleViewDetails(item)}
          >
            <Ionicons name="receipt" size={20} color="#CD0202" />
            <Text style={OrderStyles.actionButtonText}>Receipt</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={OrderStyles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color="#ccc" />
      <Text style={OrderStyles.emptyStateText}>No orders found</Text>
      <Text style={OrderStyles.emptyStateSubText}>
        {filters.search || filters.status 
          ? 'Try adjusting your search or filters' 
          : 'Your orders will appear here'
        }
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={OrderStyles.errorState}>
      <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
      <Text style={OrderStyles.errorStateText}>Failed to load orders</Text>
      <Text style={OrderStyles.errorStateSubText}>{error?.message}</Text>
      <TouchableOpacity style={OrderStyles.retryButton} onPress={refetch}>
        <Text style={OrderStyles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );


  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <SafeAreaView style={OrderStyles.container}>
      <OrdersHeader title="Orders" onBack={goBack} onFilter={() => setFilterModalVisible(true)} />
      <View style={OrderStyles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={OrderStyles.searchIcon} />
        <TextInput
          style={OrderStyles.searchInput}
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
          contentContainerStyle={data?.data?.length === 0 ? OrderStyles.emptyList : OrderStyles.listContainer}
        />
      )}

      <FilterModal />
      <DetailModal />
    </SafeAreaView>
  );
};

export default OrdersScreen;