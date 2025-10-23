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
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
  Dimensions,
  Animated,
  Easing,
  Image
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getOrdersC, retryOrder } from '../../services/order_services';
import { useNavigation } from '@react-navigation/native';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import OrderStyles from './OrderStyles';
const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
import { Colors } from "../../theme/colors";
import OrdersHeader from './OrdersHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

// ReceiptModal Component (same as from HomeScreen)
const ReceiptModal = ({ visible, onClose, transaction }) => {
  const [slideAnim] = useState(new Animated.Value(screenHeight));
  const { t } = useTranslation();

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'succeeded':
        return '#10B981';
      case 'failed':
        return '#EF4444';
      case 'pending':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'succeeded':
        return 'checkmark-circle';
      case 'failed':
        return 'close-circle';
      case 'pending':
        return 'time';
      default:
        return 'help-circle';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'succeeded':
        return t('status.succeeded');
      case 'failed':
        return t('status.failed');
      case 'pending':
        return t('status.pending');
      default:
        return status;
    }
  };

  const getServiceName = (source) => {
    switch (source) {
      case 'stripe_card':
        return t('services.mobileTopup');
      case 'data_bundle':
        return t('services.dataBundle');
      case 'game_coins':
        return t('services.gameCoins');
      default:
        return t('transaction');
    }
  };

  const getServiceIcon = (source) => {
    switch (source) {
      case 'stripe_card':
        return 'phone-portrait-outline';
      case 'data_bundle':
        return 'wifi-outline';
      case 'game_coins':
        return 'game-controller-outline';
      default:
        return 'document-text-outline';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const shareReceipt = async () => {
    try {
      const receiptText = `
🎫 Transaction Receipt

Service: ${getServiceName(transaction.source)}
Amount: ${Number(transaction.amount).toFixed(2)} ${transaction.currency}
Receiver: ${transaction.receiver}
Status: ${getStatusText(transaction.status)}
Date: ${formatDate(transaction.createdAt)}
Transaction ID: ${transaction.txnNumber}

Thank you for your business!
      `.trim();

      await Share.share({
        message: receiptText,
        title: 'Transaction Receipt',
      });
    } catch (error) {
      console.error('Error sharing receipt:', error);
      Alert.alert('Error', 'Failed to share receipt');
    }
  };

  const downloadPDF = async () => {
    Alert.alert(
      'Download PDF',
      'PDF download functionality will be implemented soon.',
      [{ text: 'OK' }]
    );
  };

  if (!transaction) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={OrderStyles.receiptModalOverlay}>
        <TouchableOpacity 
          style={OrderStyles.receiptModalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View 
          style={[
            OrderStyles.receiptModalContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={OrderStyles.receiptHeader}>
            <View style={OrderStyles.receiptHeaderLeft}>
              <TouchableOpacity onPress={onClose} style={OrderStyles.receiptCloseButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={OrderStyles.receiptHeaderCenter}>
              <Text style={OrderStyles.receiptTitle}>Receipt</Text>
            </View>
            
            <View style={OrderStyles.receiptHeaderRight}>
              <TouchableOpacity onPress={shareReceipt} style={OrderStyles.receiptHeaderActionButton}>
                <Ionicons name="share-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={downloadPDF} style={OrderStyles.receiptHeaderActionButton}>
                <Ionicons name="download-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={OrderStyles.receiptContent}>
            <View style={OrderStyles.receiptStatusSection}>
              <View style={[
                OrderStyles.receiptStatusIconContainer,
                { backgroundColor: `${getStatusColor(transaction.status)}15` }
              ]}>
                <Ionicons 
                  name={getStatusIcon(transaction.status)} 
                  size={80} 
                  color={getStatusColor(transaction.status)} 
                />
              </View>
            </View>

            <View style={OrderStyles.receiptTopSection}>
              <Text style={OrderStyles.receiptAmountValueTop}>
                {transaction.status === 'succeeded' ? 'Top-Up Success' : 
                 transaction.status === 'failed' ? 'Top-Up Failed' : 
                 'Processing Top-Up'}
              </Text>
            </View>

            <View style={OrderStyles.receiptDetailsGrid}>
              <View style={OrderStyles.receiptDetailItem}>
                <Text style={OrderStyles.receiptDetailLabel}>Transaction ID</Text>
                <Text style={OrderStyles.receiptDetailValue} numberOfLines={1} ellipsizeMode="middle">
                  {transaction.txnNumber}
                </Text>
              </View>
              
              <View style={OrderStyles.receiptDetailItem}>
                <Text style={OrderStyles.receiptDetailLabel}>Date & Time</Text>
                <Text style={OrderStyles.receiptDetailValue}>
                  {formatDate(transaction.createdAt)}
                </Text>
              </View>
              
              <View style={OrderStyles.receiptDetailItem}>
                <Text style={OrderStyles.receiptDetailLabel}>Receiver</Text>
                <Text style={OrderStyles.receiptDetailValue}>
                  {transaction.receiver}
                </Text>
              </View>
              
              <View style={OrderStyles.receiptDetailItem}>
                <Text style={OrderStyles.receiptDetailLabel}>Service</Text>
                <Text style={OrderStyles.receiptDetailValue}>
                  {getServiceName(transaction.source)}
                </Text>
              </View>
            </View>

            <View style={OrderStyles.receiptAmountSection}>
              <Text style={OrderStyles.receiptAmountLabel}>Total Amount</Text>
              <Text style={OrderStyles.receiptAmountValue}>
                {Number(transaction.amount).toFixed(2)} {transaction.currency}
              </Text>
            </View>

            <View style={OrderStyles.receiptAdditionalInfo}>
              <View style={OrderStyles.receiptInfoRow}>
                <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                <Text style={OrderStyles.receiptInfoText}>
                  {transaction.status === 'succeeded' 
                    ? 'Your transaction was completed successfully.' 
                    : transaction.status === 'failed'
                    ? 'Your transaction failed. Please try again.'
                    : 'Your transaction is being processed.'}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={OrderStyles.receiptActions}>
            <TouchableOpacity 
              style={OrderStyles.receiptPrimaryButton}
              onPress={onClose}
            >
              <Text style={OrderStyles.receiptPrimaryButtonText}>Done</Text>
            </TouchableOpacity>
            
            {/* Added Share Button Below Done Button */}
            <TouchableOpacity 
              style={OrderStyles.receiptShareButton}
              onPress={shareReceipt}
            >
              <Ionicons name="share-outline" size={20} color={Colors.primary} />
              <Text style={OrderStyles.receiptShareButtonText}>Share Receipt</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

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
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const queryClient = useQueryClient();
  const viewShotRef = useRef();
  const {t} = useTranslation();
 
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
    setReceiptModalVisible(true);
  };

  const handleResendOrder = (order) => {
    navigation.navigate('Topup1', { 
      resendOrder: {
        receiver: order.receiver,
        amount: order.amount
      }
    });
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
            }
          ]}
        >
          <View style={OrderStyles.modalHeader}>
            <Text style={OrderStyles.modalTitle}>{t("filterOrders")}</Text>
            <TouchableOpacity 
              onPress={() => setFilterModalVisible(false)}
              style={OrderStyles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={OrderStyles.filterOptions}>
            <Text style={OrderStyles.filterSectionTitle}>{t("status")}</Text>
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
              <Text style={OrderStyles.resetButtonText}>{t('resetFilters')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={OrderStyles.applyButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={OrderStyles.applyButtonText}>{t('applyFilters')}</Text>
            </TouchableOpacity>
          </View>
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
              <Text style={OrderStyles.actionButtonText}>{t("retry")}</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={OrderStyles.actionButton}
            onPress={() => handleResendOrder(item)}
          >
            <Ionicons name="return-up-forward" size={20} color={Colors.primary} />
            <Text style={OrderStyles.actionButtonText}>{t("resend")}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={OrderStyles.actionButton}
            onPress={() => handleViewDetails(item)}
          >
            <Ionicons name="receipt" size={20} color="#CD0202" />
            <Text style={OrderStyles.actionButtonText}>{t("receipt")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={OrderStyles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color="#ccc" />
      <Text style={OrderStyles.emptyStateText}>{t('noOrdersFound')}</Text>
      <Text style={OrderStyles.emptyStateSubText}>
        {filters.search || filters.status 
          ? t('tryAdjustingSearchOrFilters')
          : t('yourOrdersWillAppearHere')
        }
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={OrderStyles.errorState}>
      <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
      <Text style={OrderStyles.errorStateText}>{t('failedToLoadOrders')}</Text>
      <Text style={OrderStyles.errorStateSubText}>{error?.message}</Text>
      <TouchableOpacity style={OrderStyles.retryButton} onPress={refetch}>
        <Text style={OrderStyles.retryButtonText}>{t("tryAgain")}</Text>
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
          placeholder={t("searchByTransactionIDorReceiver")}
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

      <ReceiptModal
        visible={receiptModalVisible}
        onClose={() => setReceiptModalVisible(false)}
        transaction={selectedOrder}
      />
    </SafeAreaView>
  );
};

export default OrdersScreen;