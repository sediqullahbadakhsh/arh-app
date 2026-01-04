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
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import OrderStyles from './OrderStyles';
const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
import { Colors } from "../../theme/colors";
import OrdersHeader from './OrdersHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import ReceiptModal from './ReceiptModal';
import LottieView from 'lottie-react-native';

const ITEMS_PER_PAGE = 10;

// Skeleton Loader Component
const ModernSkeletonLoader = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.skeletonHeader}>
      <View style={styles.skeletonBackButton} />
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonFilterButton} />
    </View>
    
    <View style={styles.skeletonSearchContainer}>
      <View style={styles.skeletonSearchIcon} />
      <View style={styles.skeletonSearchInput} />
    </View>

    {[1, 2, 3].map((item) => (
      <View key={item} style={styles.skeletonCard}>
        <View style={styles.skeletonCardHeader}>
          <View style={styles.skeletonService}>
            <View style={styles.skeletonIcon} />
            <View>
              <View style={styles.skeletonTextLarge} />
              <View style={styles.skeletonTextSmall} />
            </View>
          </View>
          <View style={styles.skeletonStatus} />
        </View>
        <View style={styles.skeletonBody}>
          <View style={styles.skeletonReceiver} />
          <View style={styles.skeletonTxn} />
        </View>
        <View style={styles.skeletonFooter}>
          <View>
            <View style={styles.skeletonLabel} />
            <View style={styles.skeletonAmount} />
          </View>
          <View style={styles.skeletonActions} />
        </View>
      </View>
    ))}
  </SafeAreaView>
);

const ModernOrderCard = ({ item, onViewDetails, onRetry, onResend, t }) => {
  const [cardScale] = useState(new Animated.Value(1));
  
  const statusConfig = {
    succeeded: { 
      color: '#10B981', 
      bgColor: '#10B98115', 
      icon: 'checkmark-circle',
      label: t('status.succeeded')
    },
    failed: { 
      color: '#EF4444', 
      bgColor: '#EF444415', 
      icon: 'close-circle',
      label: t('status.failed')
    },
    pending: { 
      color: '#F59E0B', 
      bgColor: '#F59E0B15', 
      icon: 'time',
      label: t('status.pending')
    },
    cancelled: { 
      color: '#6B7280', 
      bgColor: '#6B728015', 
      icon: 'close-circle-outline',
      label: t('status.cancelled')
    }
  };

  const serviceConfig = {
    recharge: { 
      name: t('services.mobileTopup'), 
      icon: 'phone-portrait-outline',
      color: Colors.primary,
      showResend: true
    },
    bundle: { 
      name: t('services.dataBundle'), 
      icon: 'wifi-outline',
      color: '#8B5CF6',
      showResend: true
    },
    game: { 
      name: t('services.gameCoins'), 
      icon: 'game-controller-outline',
      color: '#F59E0B',
      showResend: false
    },
    games: {
      name: t('services.gameCoins'), 
      icon: 'game-controller-outline',
      color: '#F59E0B',
      showResend: false
    },
    social: {
      name: t('services.social'), 
      icon: 'share-social-outline',
      color: '#EC4899',
      showResend: false
    },
    others: {
      name: t('services.other'), 
      icon: 'cube-outline',
      color: '#6B7280',
      showResend: false
    },
    stripe_card: {
      name: t('services.payment'), 
      icon: 'card-outline',
      color: Colors.primary,
      showResend: false
    }
  };

  const config = statusConfig[item?.status] || statusConfig.pending;
  const serviceType = item?.type || 'stripe_card';
  const service = serviceConfig[serviceType] || serviceConfig.stripe_card;
  const shouldShowResend = item?.status !== 'cancelled' && service.showResend;

  const handlePressIn = () => {
    Animated.spring(cardScale, {
      toValue: 0.98,
      useNativeDriver: true,
      damping: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(cardScale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 10,
    }).start();
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (!item) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.orderCard,
        {
          transform: [{ scale: cardScale }],
          borderLeftColor: config.color,
        }
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onViewDetails(item);
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.serviceInfo}>
            <View style={[styles.serviceIcon, { backgroundColor: service.color + '15' }]}>
              <Ionicons name={service.icon} size={20} color={service.color} />
            </View>
            <View style={styles.serviceText}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
            <Ionicons name={config.icon} size={12} color={config.color} />
            <Text style={[styles.statusText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        </View>

        <View style={styles.receiverSection}>
          <View style={styles.receiverRow}>
            <Ionicons name="call-outline" size={16} color="#6B7280" />
            <Text style={styles.receiverNumber} numberOfLines={1}>
              {item.receiver || 'N/A'}
            </Text>
          </View>
          <Text style={styles.txnId}>TXN: {item.txnNumber || 'N/A'}</Text>
        </View>

        <View style={styles.amountSection}>
          <View>
            <Text style={styles.amountLabel}>{t('amount')}</Text>
            <Text style={styles.amountValue}>
              {Number(item.amount || 0).toFixed(2)} {item.currency || 'USD'}
            </Text>
          </View>
          
          <View style={styles.actionButtons}>
            {item.status === 'failed' && (
              <TouchableOpacity 
                style={[styles.actionIcon, styles.retryIcon]}
                onPress={(e) => {
                  e.stopPropagation();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onRetry(item.id);
                }}
              >
                <Ionicons name="refresh" size={18} color={Colors.primary} />
              </TouchableOpacity>
            )}
            
            {shouldShowResend && (
              <TouchableOpacity 
                style={[styles.actionIcon, styles.resendIcon]}
                onPress={(e) => {
                  e.stopPropagation();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onResend(item);
                }}
              >
                <Ionicons name="return-up-forward" size={18} color={Colors.primary} />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.actionIcon, styles.receiptIcon]}
              onPress={(e) => {
                e.stopPropagation();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onViewDetails(item);
              }}
            >
              <Ionicons name="receipt-outline" size={18} color="#8B5CF6" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const ModernFilterModal = ({ visible, onClose, filters, onFilterChange, t }) => {
  const [slideAnim] = useState(new Animated.Value(screenHeight));

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        mass: 0.8,
        stiffness: 90,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const statusOptions = [
    { value: '', label: t('allStatuses'), icon: 'apps-outline' },
    { value: 'pending', label: t('status.pending'), icon: 'time-outline', color: '#F59E0B' },
    { value: 'succeeded', label: t('status.succeeded'), icon: 'checkmark-circle-outline', color: '#10B981' },
    { value: 'failed', label: t('status.failed'), icon: 'close-circle-outline', color: '#EF4444' },
    { value: 'cancelled', label: t('status.cancelled'), icon: 'close-circle-outline', color: '#6B7280' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View 
          style={[
            styles.filterModal,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.modalHandle}>
            <View style={styles.handleBar} />
          </View>

          <ScrollView 
            style={styles.filterContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.filterTitle}>{t('filterOrders')}</Text>
            
            <Text style={styles.filterSectionTitle}>{t('status')}</Text>
            <View style={styles.statusGrid}>
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.statusOption,
                    filters.status === option.value && styles.statusOptionActive,
                    { borderColor: option.color || '#E5E7EB' }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onFilterChange('status', option.value);
                  }}
                >
                  <Ionicons 
                    name={option.icon} 
                    size={22} 
                    color={filters.status === option.value ? option.color || Colors.primary : '#6B7280'} 
                  />
                  <Text style={[
                    styles.statusOptionText,
                    filters.status === option.value && styles.statusOptionTextActive
                  ]}>
                    {option.label}
                  </Text>
                  {filters.status === option.value && (
                    <View style={[styles.activeIndicator, { backgroundColor: option.color || Colors.primary }]}>
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.filterActions}>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onFilterChange('status', '');
                onClose();
              }}
            >
              <Ionicons name="close-circle-outline" size={18} color="#6B7280" />
              <Text style={styles.resetButtonText}>{t('reset')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onClose();
              }}
            >
              <LinearGradient
                colors={[Colors.primary, '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.applyGradient}
              >
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                <Text style={styles.applyButtonText}>{t('applyFilters')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const ModernEmptyState = ({ filters, t, onClearFilters }) => (
  <View style={styles.emptyState}>
    <LottieView
      source={require('../../../assets/lotties/loading.json')}
      autoPlay
      loop
      style={styles.emptyAnimation}
    />
    <Text style={styles.emptyStateTitle}>
      {filters.search || filters.status ? t('noResultsFound') : t('noOrders')}
    </Text>
    <Text style={styles.emptyStateSubtitle}>
      {filters.search || filters.status 
        ? t('tryDifferentSearch')
        : t('ordersWillAppearHere')}
    </Text>
    {(filters.search || filters.status) && (
      <TouchableOpacity 
        style={styles.clearFiltersButton}
        onPress={onClearFilters}
      >
        <Ionicons name="close-circle" size={18} color="#FFFFFF" />
        <Text style={styles.clearFiltersText}>{t('clearFilters')}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const ModernErrorState = ({ error, onRetry, t }) => (
  <View style={styles.errorState}>
    <LottieView
      source={require('../../../assets/lotties/error.json')}
      autoPlay
      loop
      style={styles.errorAnimation}
    />
    <Text style={styles.errorStateTitle}>{t('somethingWentWrong')}</Text>
    <Text style={styles.errorStateSubtitle}>
      {error?.message || t('failedToLoadOrders')}
    </Text>
    <TouchableOpacity 
      style={styles.retryButton}
      onPress={onRetry}
    >
      <Ionicons name="refresh" size={18} color="#FFFFFF" />
      <Text style={styles.retryButtonText}>{t('tryAgain')}</Text>
    </TouchableOpacity>
  </View>
);

const OrdersScreen = () => {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    page: 1,
    limit: ITEMS_PER_PAGE,
  });
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [ordersData, setOrdersData] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [metaData, setMetaData] = useState(null);
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const searchInputRef = useRef();
  const flatListRef = useRef();

  const fetchOrders = async (page = 1, shouldReset = false) => {
    try {
      const response = await getOrdersC({
        ...filters,
        page,
        limit: ITEMS_PER_PAGE,
      });

      if (response?.data) {
        if (shouldReset || page === 1) {
          setOrdersData(response.data);
        } else {
          setOrdersData(prev => [...prev, ...response.data]);
        }
        
        setMetaData(response?.meta);
        setHasMore(response?.meta ? page < response.meta.pages : false);
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [filters.search, filters.status]);

  const loadInitialData = async () => {
    try {
      setInitialLoading(true);
      await fetchOrders(1, true);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadMoreData = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = filters.page + 1;
      await fetchOrders(nextPage, false);
      setFilters(prev => ({ ...prev, page: nextPage }));
    } catch (error) {
      console.error('Error loading more data:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchOrders(1, true);
      setFilters(prev => ({ ...prev, page: 1 }));
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const retryOrderMutation = useMutation({
    mutationFn: (id) => retryOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      loadInitialData(); // Refresh the list
      Alert.alert(t('success'), t('orderRetrySuccess'));
    },
    onError: (error) => {
      console.error('Failed to retry order:', error);
      Alert.alert(t('error'), t('orderRetryFailed'));
    },
  });

  const goBack = () => {
    navigation.goBack();
  };

  const handleSearch = (text) => {
    setFilters(prev => ({ ...prev, search: text, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleRetryOrder = (id) => {
    retryOrderMutation.mutate(id);
  };

  const handleViewDetails = (order) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedOrder(order);
    setReceiptModalVisible(true);
  };

  const handleResendOrder = (order) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('TopupTab', { 
      resendOrder: {
        receiver: order.receiver,
        amount: order.amount
      }
    });
  };

  const clearFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilters({
      search: '',
      status: '',
      page: 1,
      limit: ITEMS_PER_PAGE,
    });
  };

  const renderOrderItem = ({ item }) => (
    <ModernOrderCard
      item={item}
      onViewDetails={handleViewDetails}
      onRetry={handleRetryOrder}
      onResend={handleResendOrder}
      t={t}
    />
  );

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.footerText}>
            {t('loadingMore') || "Loading more orders..."}
          </Text>
        </View>
      );
    }
    
    if (ordersData.length > 0 && !hasMore) {
      return (
        <View style={styles.noMoreContainer}>
          <Text style={styles.noMoreText}>
            {t('noMoreOrders') || "No more orders"}
          </Text>
        </View>
      );
    }
    
    return null;
  };

  const handleEndReached = () => {
    if (!loadingMore && hasMore && ordersData.length > 0) {
      loadMoreData();
    }
  };

  if (initialLoading) {
    return <ModernSkeletonLoader />;
  }

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
      <OrdersHeader 
        title="Orders" 
        onBack={goBack} 
        onFilter={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setFilterModalVisible(true);
        }}
        filterActive={!!filters.status}
      />

      <View style={styles.searchContainer}>
        <View style={styles.searchInner}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder={t('searchOrders')}
            placeholderTextColor="#9CA3AF"
            value={filters.search}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {filters.search ? (
            <TouchableOpacity 
              style={styles.clearSearchButton}
              onPress={() => handleSearch('')}
            >
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {(filters.search || filters.status) && (
        <View style={styles.activeFilters}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeFiltersContent}
          >
            {filters.status && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>
                  {t(`status.${filters.status}`)}
                </Text>
                <TouchableOpacity 
                  onPress={() => handleFilterChange('status', '')}
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
            {(filters.search || filters.status) && (
              <TouchableOpacity 
                style={styles.clearAllButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearAllText}>{t('clearAll')}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={ordersData}
        renderItem={renderOrderItem}
        keyExtractor={(item, index) => `order-${item.id}-${index}`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          <ModernEmptyState 
            filters={filters} 
            t={t} 
            onClearFilters={clearFilters}
          />
        }
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        removeClippedSubviews={false}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        windowSize={10}
      />

      {ordersData.length > 0 && (
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFC']}
            style={styles.statsGradient}
          >
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#10B981' }]}>
                  {ordersData.filter(item => item.status === 'succeeded').length}
                </Text>
                <Text style={styles.statLabel}>{t('successful')}</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                  {ordersData.filter(item => item.status === 'pending').length}
                </Text>
                <Text style={styles.statLabel}>{t('pending')}</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#EF4444' }]}>
                  {ordersData.filter(item => item.status === 'failed').length}
                </Text>
                <Text style={styles.statLabel}>{t('failed')}</Text>
              </View>

              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#6B7280' }]}>
                  {ordersData.filter(item => item.status === 'cancelled').length}
                </Text>
                <Text style={styles.statLabel}>{t('cancelled')}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      )}

      <ModernFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        t={t}
      />

      <ReceiptModal
        visible={receiptModalVisible}
        onClose={() => setReceiptModalVisible(false)}
        transaction={selectedOrder}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  // Skeleton Styles
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  skeletonBackButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  skeletonTitle: {
    width: 100,
    height: 20,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  skeletonFilterButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  skeletonSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  skeletonSearchIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  skeletonSearchInput: {
    flex: 1,
    height: 20,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    marginLeft: 12,
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  skeletonCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  skeletonService: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  skeletonIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  skeletonTextLarge: {
    width: 120,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    marginBottom: 4,
  },
  skeletonTextSmall: {
    width: 80,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  skeletonStatus: {
    width: 60,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    marginLeft: 8,
  },
  skeletonBody: {
    marginBottom: 16,
  },
  skeletonReceiver: {
    width: 150,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    marginBottom: 4,
  },
  skeletonTxn: {
    width: 100,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  skeletonLabel: {
    width: 40,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    marginBottom: 4,
  },
  skeletonAmount: {
    width: 80,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  skeletonActions: {
    width: 120,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  // Original Styles
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'System',
  },
  clearSearchButton: {
    padding: 4,
  },
  activeFilters: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  activeFiltersContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginRight: 6,
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearAllText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceText: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  receiverSection: {
    marginBottom: 10,
    justifyContent: "space-between",
    flexDirection: "row"
  },
  receiverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  receiverNumber: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 8,
  },
  txnId: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  amountSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  amountLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  retryIcon: {
    backgroundColor: '#EFF6FF',
  },
  resendIcon: {
    backgroundColor: '#F5F3FF',
  },
  receiptIcon: {
    backgroundColor: '#FAF5FF',
  },
  listContainer: {
    paddingTop: 8,
    paddingBottom: 120,
  },
  separator: {
    height: 8,
  },
  footerContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  footerText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#6B7280',
  },
  noMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMoreText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  statsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  statsGradient: {
    paddingHorizontal: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  filterModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 24,
  },
  modalHandle: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
  },
  filterContent: {
    paddingHorizontal: 20,
  },
  filterTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusGrid: {
    marginBottom: 24,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  statusOptionActive: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
  },
  statusOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 12,
    flex: 1,
  },
  statusOptionTextActive: {
    color: '#111827',
    fontWeight: '600',
  },
  activeIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginRight: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  applyButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  applyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyAnimation: {
    width: 180,
    height: 180,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  clearFiltersText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  errorAnimation: {
    width: 160,
    height: 160,
  },
  errorStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EF4444',
    marginTop: 24,
    marginBottom: 8,
  },
  errorStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default OrdersScreen;