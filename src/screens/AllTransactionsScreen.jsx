import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  SafeAreaView,
  RefreshControl,
  TextInput,
  Animated,
  Easing,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import { getRecentOrdersOfAgent, getStockInOut } from "../services/merchantApi";
import { formatDateTime } from "../utils/formatDate";
import { capitalizeFirstLetter } from "../utils/capitalizeFirstLetter";
import { useTranslation } from "react-i18next";
import { useUser } from "../context/userContext";
import ServiceHeader from "../components/ServiceHeader";
import ReceiptModal1 from "../components/ReceiptModal";
import { scale } from "../utils/normalizeSize";

// Skeleton Components
const SkeletonRect = ({ width, height, borderRadius = 4, style = {} }) => {
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, [animation]);

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E1E9EE',
          opacity,
        },
        style,
      ]}
    />
  );
};

const SkeletonCircle = ({ size }) => {
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, [animation]);

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#E1E9EE',
        opacity,
      }}
    />
  );
};

// Skeleton Screen Component
const TransactionsSkeletonScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <SkeletonRect width={24} height={24} borderRadius={12} />
        </TouchableOpacity>
        <SkeletonRect width={scale.wp(40)} height={scale.hp(2.3)} />
        <View style={styles.headerRight}>
          <SkeletonCircle size={scale.wp(8)} />
        </View>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: '#f0f0f0' }]}>
        <SkeletonCircle size={scale.wp(5)} />
        <SkeletonRect width="70%" height={scale.hp(2)} style={{ marginLeft: scale.wp(2) }} />
        <SkeletonCircle size={scale.wp(5)} />
      </View>

      <View style={styles.tabContainer}>
        {[1, 2, 3].map((item) => (
          <SkeletonRect 
            key={`tab-${item}`}
            width={scale.wp(25)}
            height={scale.hp(4)}
            borderRadius={scale.hp(1)}
            style={{ flex: 1, marginHorizontal: scale.wp(1) }}
          />
        ))}
      </View>

      <View style={styles.countSkeleton}>
        <SkeletonRect width={scale.wp(40)} height={scale.hp(1.8)} />
      </View>

      <FlatList
        data={[1, 2, 3, 4, 5]}
        renderItem={({ item }) => (
          <View style={styles.transactionItemSkeleton}>
            <View style={styles.itemLeft}>
              <SkeletonCircle size={scale.wp(11.7)} />
              <View style={styles.itemInfoSkeleton}>
                <SkeletonRect width="60%" height={scale.hp(2.1)} />
                <SkeletonRect 
                  width="40%" 
                  height={scale.hp(1.55)} 
                  style={{ marginTop: scale.hp(0.5) }}
                />
                <SkeletonRect 
                  width="50%" 
                  height={scale.hp(1.55)} 
                  style={{ marginTop: scale.hp(0.25) }}
                />
              </View>
            </View>
            <View style={styles.itemRightSkeleton}>
              <SkeletonRect width={scale.wp(25)} height={scale.hp(2.1)} />
              <SkeletonRect 
                width={scale.wp(20)} 
                height={scale.hp(1.55)} 
                borderRadius={scale.hp(1.55)}
                style={{ marginTop: scale.hp(0.8) }}
              />
            </View>
          </View>
        )}
        keyExtractor={(item) => `skeleton-${item}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const ITEMS_PER_PAGE = 10;

export default function AllTransactionsScreen({ navigation }) {
  const { t } = useTranslation();
  const { user } = useUser();
  
  const [orderTransactions, setOrderTransactions] = useState([]);
  const [stockTransactions, setStockTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedTransactionType, setSelectedTransactionType] = useState(null);
  
  // Pagination states
  const [ordersPage, setOrdersPage] = useState(1);
  const [stockPage, setStockPage] = useState(1);
  const [hasMoreOrders, setHasMoreOrders] = useState(true);
  const [hasMoreStock, setHasMoreStock] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [ordersMeta, setOrdersMeta] = useState(null);
  const [stockMeta, setStockMeta] = useState(null);

  const flatListRef = useRef(null);

  const fetchAllTransactions = async (reset = false) => {
    try {
      if (reset) {
        setOrdersPage(1);
        setStockPage(1);
        setLoading(true);
        setOrderTransactions([]);
        setStockTransactions([]);
      }

      // Fetch orders
      const ordersRes = await getRecentOrdersOfAgent({ 
        page: reset ? 1 : ordersPage, 
        limit: ITEMS_PER_PAGE 
      });
      
      if (ordersRes?.data) {
        if (reset) {
          setOrderTransactions(ordersRes.data);
        } else {
          setOrderTransactions(prev => [...prev, ...ordersRes.data]);
        }
        setOrdersMeta(ordersRes?.meta);
        setHasMoreOrders(ordersRes?.meta ? ordersPage < ordersRes.meta.pages : false);
      }

      // Fetch stock
      const stockRes = await getStockInOut({ 
        page: reset ? 1 : stockPage, 
        limit: ITEMS_PER_PAGE 
      });
      
      if (stockRes?.data) {
        if (reset) {
          setStockTransactions(stockRes.data);
        } else {
          setStockTransactions(prev => [...prev, ...stockRes.data]);
        }
        setStockMeta(stockRes?.meta);
        setHasMoreStock(stockRes?.meta ? stockPage < stockRes.meta.pages : false);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllTransactions(true);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    fetchAllTransactions(true);
  };

  const loadMoreData = useCallback(async () => {
    if (loadingMore) return;

    console.log("Loading more data for tab:", activeTab);
    setLoadingMore(true);

    try {
      if (activeTab === "all") {
        // Load more for both orders and stock
        const nextOrdersPage = ordersPage + 1;
        const nextStockPage = stockPage + 1;
        
        setOrdersPage(nextOrdersPage);
        setStockPage(nextStockPage);
        
        await fetchAllTransactions(false);
      } else if (activeTab === "orders" && hasMoreOrders) {
        const nextPage = ordersPage + 1;
        setOrdersPage(nextPage);
        const ordersRes = await getRecentOrdersOfAgent({ 
          page: nextPage, 
          limit: ITEMS_PER_PAGE 
        });
        
        if (ordersRes?.data?.length > 0) {
          setOrderTransactions(prev => [...prev, ...ordersRes.data]);
          setOrdersMeta(ordersRes?.meta);
          setHasMoreOrders(ordersRes?.meta ? nextPage < ordersRes.meta.pages : false);
        } else {
          setHasMoreOrders(false);
        }
      } else if (activeTab === "stock" && hasMoreStock) {
        const nextPage = stockPage + 1;
        setStockPage(nextPage);
        const stockRes = await getStockInOut({ 
          page: nextPage, 
          limit: ITEMS_PER_PAGE 
        });
        
        if (stockRes?.data?.length > 0) {
          setStockTransactions(prev => [...prev, ...stockRes.data]);
          setStockMeta(stockRes?.meta);
          setHasMoreStock(stockRes?.meta ? nextPage < stockRes.meta.pages : false);
        } else {
          setHasMoreStock(false);
        }
      }
    } catch (error) {
      console.error("Error loading more data:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [activeTab, ordersPage, stockPage, hasMoreOrders, hasMoreStock, loadingMore]);

  const handleTransactionPress = (transaction, transactionType) => {
    setSelectedTransaction(transaction);
    setSelectedTransactionType(transactionType);
    setReceiptModalVisible(true);
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
      case 'succeeded':
        return t('status.completed');
      case 'failed':
        return t('status.failed');
      case 'pending':
      case 'cancelled':
        return t('status.pending');
      default:
        return capitalizeFirstLetter(status || 'pending');
    }
  };

  const getServiceName = (type) => {
    switch (type) {
      case 'recharge':
        return t('services.mobileTopup');
      case 'bundle':
        return t('services.dataBundle');
      case 'games':
        return t('services.gameCoins');
      case 'social':
        return t('services.social');
      default:
        return t('transaction');
    }
  };

  const formatAF = (n) =>
    Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setOrdersPage(1);
    setStockPage(1);
    setHasMoreOrders(true);
    setHasMoreStock(true);
    fetchAllTransactions(true);
  };

  const hasMoreData = () => {
    if (activeTab === "all") {
      return hasMoreOrders || hasMoreStock;
    } else if (activeTab === "orders") {
      return hasMoreOrders;
    } else if (activeTab === "stock") {
      return hasMoreStock;
    }
    return false;
  };

  const filteredTransactions = useMemo(() => {
    const allTransactions = [
      ...orderTransactions.map(tx => ({ ...tx, transactionType: 'order' })),
      ...stockTransactions.map(tx => ({ ...tx, transactionType: 'stock' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    let filtered = allTransactions;

    if (activeTab === "orders") {
      filtered = filtered.filter(tx => tx.transactionType === 'order');
    } else if (activeTab === "stock") {
      filtered = filtered.filter(tx => tx.transactionType === 'stock');
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx => {
        if (tx.transactionType === 'order') {
          return (
            getServiceName(tx.type).toLowerCase().includes(query) ||
            (tx.receiver && tx.receiver.toLowerCase().includes(query)) ||
            getStatusText(tx.status).toLowerCase().includes(query) ||
            (tx.txnNumber && tx.txnNumber.toLowerCase().includes(query))
          );
        } else {
          return (
            tx.type.toLowerCase().includes(query) ||
            (tx.from_wallet_id && tx.from_wallet_id.toLowerCase().includes(query)) ||
            (tx.to_wallet_id && tx.to_wallet_id.toLowerCase().includes(query)) ||
            (tx.reference_table && tx.reference_table.toLowerCase().includes(query))
          );
        }
      });
    }

    return filtered;
  }, [orderTransactions, stockTransactions, activeTab, searchQuery, t]);

  const totalTransactionCount = useMemo(() => {
    if (activeTab === "orders") return ordersMeta?.total || orderTransactions.length;
    if (activeTab === "stock") return stockMeta?.total || stockTransactions.length;
    return (ordersMeta?.total || 0) + (stockMeta?.total || 0);
  }, [activeTab, ordersMeta, stockMeta, orderTransactions.length, stockTransactions.length]);

  const OrderTransactionItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.transactionItem} 
      activeOpacity={0.8}
      onPress={() => handleTransactionPress(item, 'order')}
    >
      <View style={styles.itemLeft}>
        <View style={[
          styles.itemIcon,
          { backgroundColor: item.status === 'succeeded' ? '#E8F5E9' : 
                            item.status === 'failed' ? '#FFEBEE' : 
                            item.status === 'cancelled' ? '#FFF3E0' : '#FFF8E1' }
        ]}>
          <Ionicons
            name={
              item.type === 'recharge' ? 'phone-portrait-outline' : 
              item.type === 'bundle' ? 'wifi-outline' :
              item.type === 'games' ? 'game-controller-outline' :
              item.type === 'social' ? 'people-outline' :
              'receipt-outline'
            } 
            size={20} 
            color={
              item.status === 'succeeded' ? '#4CAF50' : 
              item.status === 'failed' ? '#F44336' : 
              item.status === 'cancelled' ? '#FF9800' : '#FFC107'
            } 
          />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>{getServiceName(item.type)}</Text>
          <Text style={styles.itemSubtitle}>
            {formatDateTime(item.createdAt)}
          </Text>
          <Text style={styles.itemDetail}>
            {item.receiver ? `(+93) ${item.receiver}` : 'N/A'}
          </Text>
          {item.txnNumber && (
            <Text style={styles.transactionId}>ID: {item.txnNumber}</Text>
          )}
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={[
          styles.itemAmount,
          { 
            color: item.status === 'succeeded' ? '#4CAF50' : 
                   item.status === 'failed' ? '#F44336' : 
                   item.status === 'cancelled' ? '#FF9800' : '#FFC107'
          }
        ]}>
          {Number(item.amount || 0).toFixed(2)} {item.currency || 'AFN'}
        </Text>
        <View style={[
          styles.statusBadge,
          { 
            backgroundColor: item.status === 'succeeded' ? '#E8F5E9' : 
                             item.status === 'failed' ? '#FFEBEE' : 
                             item.status === 'cancelled' ? '#FFF3E0' : '#FFF8E1'
          }
        ]}>
          <Text style={[
            styles.statusText,
            { 
              color: item.status === 'succeeded' ? '#4CAF50' : 
                     item.status === 'failed' ? '#F44336' : 
                     item.status === 'cancelled' ? '#FF9800' : '#FFC107'
            }
          ]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const StockTransactionItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.transactionItem} 
      activeOpacity={0.8}
      onPress={() => handleTransactionPress(item, 'stock')}
    >
      <View style={styles.itemLeft}>
        <View style={[
          styles.itemIcon,
          item.type === "IN" ? styles.stockInIcon : styles.stockOutIcon
        ]}>
          <Ionicons
            name={item.type === "IN" ? "arrow-down" : "arrow-up"}
            size={20}
            color={item.type === "IN" ? "#0BA360" : Colors.primary}
          />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>
            {item.type === "IN" ? t('transactions.stockIn') : t('transactions.stockOut')}
          </Text>
          <Text style={styles.itemSubtitle}>
            {formatDateTime(item.createdAt)}
          </Text>
          <Text style={styles.itemDetail}>
            {item.type === "IN" 
              ? `${t('transactions.from')} ${item.from_wallet_id || 'N/A'}` 
              : `${t('transactions.to')} ${item.to_wallet_id || t('transactions.activateBundle')}`}
          </Text>
          {item.reference_table && (
            <Text style={styles.transactionId}>Type: {item.reference_table}</Text>
          )}
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={[
          styles.itemAmount,
          { color: item.type === "IN" ? "#0BA360" : Colors.primary }
        ]}>
          {item.type === "OUT" ? "-" : "+"}
          {formatAF(Math.abs(item.amount))} AF
        </Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.type === "IN" ? '#E8F5E9' : '#FFEBEE' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.type === "IN" ? '#0BA360' : Colors.primary }
          ]}>
            {item.type === "IN" ? t('transactions.received') : t('transactions.sent')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTransactionItem = ({ item }) => {
    if (item.transactionType === 'order') {
      return <OrderTransactionItem item={item} />;
    } else {
      return <StockTransactionItem item={item} />;
    }
  };

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.footerText}>
            {t('loadingMore') || "Loading more transactions..."}
          </Text>
        </View>
      );
    }
    
    if (filteredTransactions.length > 0 && !hasMoreData()) {
      return (
        <View style={styles.noMoreContainer}>
          <Text style={styles.noMoreText}>
            {t('noMoreTransactions') || "No more transactions"}
          </Text>
        </View>
      );
    }
    
    return null;
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons 
        name="receipt-outline" 
        size={64} 
        color="#E0E0E0" 
      />
      <Text style={styles.emptyStateTitle}>
        {t('transactions.noTransactions')}
      </Text>
      <Text style={styles.emptyStateSubtitle}>
        {searchQuery || activeTab !== "all" 
          ? t('transactions.noFilteredTransactions')
          : t('transactions.noTransactionsDesc')
        }
      </Text>
    </View>
  );

  const handleEndReached = useCallback(() => {
    if (!loadingMore && hasMoreData() && filteredTransactions.length > 0) {
      loadMoreData();
    }
  }, [loadingMore, hasMoreData, filteredTransactions.length, loadMoreData]);

  const goBack = () => {
    navigation.goBack();
  };

  // Show skeleton loader while loading initial data
  if (loading && !loadingMore) {
    return <TransactionsSkeletonScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ServiceHeader title="Transactions" onBack={goBack} />
  
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#9E9E9E" />
        <TextInput
          style={styles.searchInput}
          placeholder={t('common.search')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9E9E9E"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#9E9E9E" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "all" && styles.activeTab]}
          onPress={() => handleTabChange("all")}
        >
          <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>
            {t('common.all')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "orders" && styles.activeTab]}
          onPress={() => handleTabChange("orders")}
        >
          <Text style={[styles.tabText, activeTab === "orders" && styles.activeTabText]}>
            {t('transactions.orders')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "stock" && styles.activeTab]}
          onPress={() => handleTabChange("stock")}
        >
          <Text style={[styles.tabText, activeTab === "stock" && styles.activeTabText]}>
            {t('transactions.stock')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          Showing {filteredTransactions.length} of {totalTransactionCount} {t('transactions.transactionsFound')}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={filteredTransactions}
        keyExtractor={(item, index) => `${item.transactionType}-${item.id || item.txnNumber || index}-${index}`}
        renderItem={renderTransactionItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!loading && EmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        removeClippedSubviews={false}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        windowSize={10}
      />

      <ReceiptModal1
        visible={receiptModalVisible}
        onClose={() => setReceiptModalVisible(false)}
        transaction={selectedTransaction}
        transactionType={selectedTransactionType}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: scale.hp(12.9),
    flex: 1,
    backgroundColor: Colors.white,
  },
  // Skeleton Styles
  headerSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale.wp(4.9),
    paddingVertical: scale.hp(2.1),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: scale.hp(0.5),
  },
  headerRight: {
    width: scale.wp(8),
  },
  tabsSkeleton: {
    flexDirection: 'row',
    marginHorizontal: scale.wp(4.9),
    marginBottom: scale.hp(2.1),
    backgroundColor: '#F8F8F8',
    borderRadius: scale.hp(1.55),
    padding: scale.hp(0.5),
  },
  countSkeleton: {
    paddingHorizontal: scale.wp(4.9),
    marginBottom: scale.hp(1),
  },
  transactionItemSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: scale.hp(2.1),
    borderRadius: scale.hp(1.55),
    marginBottom: scale.hp(1),
    marginHorizontal: scale.wp(4.9),
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  itemInfoSkeleton: {
    flex: 1,
    marginLeft: scale.wp(2.9),
  },
  itemRightSkeleton: {
    alignItems: 'flex-end',
  },
  // Original Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale.wp(4.9),
    paddingVertical: scale.hp(2.1),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: scale.hp(2.3),
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    margin: scale.wp(4.9),
    paddingHorizontal: scale.wp(3.9),
    paddingVertical: scale.hp(1.55),
    borderRadius: scale.hp(1.55),
  },
  searchInput: {
    flex: 1,
    marginLeft: scale.wp(2.9),
    fontSize: scale.hp(2.1),
    color: Colors.textPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: scale.wp(4.9),
    marginBottom: scale.hp(2.1),
    backgroundColor: '#F8F8F8',
    borderRadius: scale.hp(1.55),
    padding: scale.hp(0.5),
  },
  tab: {
    flex: 1,
    paddingVertical: scale.hp(1),
    alignItems: 'center',
    borderRadius: scale.hp(1),
  },
  activeTab: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale.hp(0.25) },
    shadowOpacity: 0.1,
    shadowRadius: scale.hp(0.5),
    elevation: 2,
  },
  tabText: {
    fontSize: scale.hp(1.8),
    fontWeight: '500',
    color: '#9E9E9E',
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  countContainer: {
    paddingHorizontal: scale.wp(4.9),
    marginBottom: scale.hp(1),
  },
  countText: {
    fontSize: scale.hp(1.8),
    color: '#9E9E9E',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: scale.wp(4.9),
    paddingBottom: scale.hp(2.6),
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: scale.hp(2.1),
    borderRadius: scale.hp(1.55),
    marginBottom: scale.hp(1),
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: scale.wp(11.7),
    height: scale.wp(11.7),
    borderRadius: scale.wp(5.8),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale.wp(2.9),
  },
  stockInIcon: {
    backgroundColor: 'rgba(11, 163, 96, 0.1)',
  },
  stockOutIcon: {
    backgroundColor: 'rgba(215, 0, 0, 0.1)',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: scale.hp(2.1),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scale.hp(0.5),
  },
  itemSubtitle: {
    fontSize: scale.hp(1.55),
    color: '#9E9E9E',
    marginBottom: scale.hp(0.25),
  },
  itemDetail: {
    fontSize: scale.hp(1.55),
    color: '#9E9E9E',
    marginBottom: scale.hp(0.25),
  },
  transactionId: {
    fontSize: scale.hp(1.4),
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemAmount: {
    fontSize: scale.hp(2.1),
    fontWeight: '700',
    marginBottom: scale.hp(0.8),
  },
  statusBadge: {
    paddingHorizontal: scale.wp(2),
    paddingVertical: scale.hp(0.5),
    borderRadius: scale.hp(1.55),
  },
  statusText: {
    fontSize: scale.hp(1.55),
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale.hp(7.75),
    paddingHorizontal: scale.wp(9.7),
  },
  emptyStateTitle: {
    fontSize: scale.hp(2.3),
    fontWeight: '600',
    color: '#9E9E9E',
    marginTop: scale.hp(2.1),
    marginBottom: scale.hp(1),
  },
  emptyStateSubtitle: {
    fontSize: scale.hp(1.8),
    color: '#9E9E9E',
    textAlign: 'center',
    lineHeight: scale.hp(2.6),
  },
  footerContainer: {
    paddingVertical: scale.hp(3),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  footerText: {
    marginLeft: scale.wp(2),
    fontSize: scale.hp(1.6),
    color: Colors.textSecondary,
  },
  noMoreContainer: {
    paddingVertical: scale.hp(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMoreText: {
    fontSize: scale.hp(1.6),
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});