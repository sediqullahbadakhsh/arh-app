import React, { useEffect, useState, useMemo } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import { getRecentOrdersOfAgent, getStockInOut } from "../services/merchantApi";
import { formatDateTime } from "../utils/formatDate";
import { capitalizeFirstLetter } from "../utils/capitalizeFirstLetter";
import { useTranslation } from "react-i18next";
import { useUser } from "../context/userContext";
import ServiceHeader from "../components/ServiceHeader";

export default function AllTransactionsScreen({ navigation }) {
  const { t } = useTranslation();
  const { user } = useUser();
  
  const [orderTransactions, setOrderTransactions] = useState([]);
  const [stockTransactions, setStockTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); 

  useEffect(() => {
    fetchAllTransactions();
  }, []);

  const fetchAllTransactions = async () => {
    setLoading(true);
    try {
      const [ordersRes, stockRes] = await Promise.all([
        getRecentOrdersOfAgent(),
        getStockInOut()
      ]);
      
      setOrderTransactions(ordersRes?.data || []);
      setStockTransactions(stockRes?.data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllTransactions();
    setRefreshing(false);
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return t('status.completed');
      case 'failed':
        return t('status.failed');
      case 'pending':
        return t('status.pending');
      default:
        return capitalizeFirstLetter(status || 'pending');
    }
  };

  const getServiceName = (type) => {
    switch (type) {
      case 'recharge':
        return t('services.mobileTopup');
      case 'data_bundle':
        return t('services.dataBundle');
      case 'game_coins':
        return t('services.gameCoins');
      default:
        return t('transaction');
    }
  };

  const formatAF = (n) =>
    Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });

  // Filter transactions based on search query and active tab
  const filteredTransactions = useMemo(() => {
    const allTransactions = [
      ...orderTransactions.map(tx => ({ ...tx, transactionType: 'order' })),
      ...stockTransactions.map(tx => ({ ...tx, transactionType: 'stock' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    let filtered = allTransactions;

    // Filter by tab
    if (activeTab === "orders") {
      filtered = filtered.filter(tx => tx.transactionType === 'order');
    } else if (activeTab === "stock") {
      filtered = filtered.filter(tx => tx.transactionType === 'stock');
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx => {
        if (tx.transactionType === 'order') {
          return (
            getServiceName(tx.type).toLowerCase().includes(query) ||
            (tx.receiver && tx.receiver.includes(query)) ||
            getStatusText(tx.status).toLowerCase().includes(query)
          );
        } else {
          return (
            tx.type.toLowerCase().includes(query) ||
            (tx.from_wallet_id && tx.from_wallet_id.toLowerCase().includes(query)) ||
            (tx.to_wallet_id && tx.to_wallet_id.toLowerCase().includes(query))
          );
        }
      });
    }

    return filtered;
  }, [orderTransactions, stockTransactions, activeTab, searchQuery, t]);


  const OrderTransactionItem = ({ item }) => (
    <TouchableOpacity style={styles.transactionItem} activeOpacity={0.8}>
      <View style={styles.itemLeft}>
        <View style={[
          styles.itemIcon,
          { backgroundColor: item.status === 'completed' ? '#E8F5E9' : 
                            item.status === 'failed' ? '#FFEBEE' : '#FFF8E1' }
        ]}>
          <Ionicons
            name={item.type === 'recharge' ? 'phone-portrait-outline' : 
                  item.type === 'data_bundle' ? 'wifi-outline' : 'game-controller-outline'}
            size={22}
            color={item.status === 'completed' ? '#4CAF50' : 
                   item.status === 'failed' ? '#F44336' : '#FFC107'}
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
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={[
          styles.itemAmount,
          { color: item.status === 'completed' ? '#4CAF50' : 
                 item.status === 'failed' ? '#F44336' : '#FFC107' }
        ]}>
          {Number(item.amount || 0).toFixed(2)} {item.currency || 'USD'}
        </Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'completed' ? '#E8F5E9' : 
                            item.status === 'failed' ? '#FFEBEE' : '#FFF8E1' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.status === 'completed' ? '#4CAF50' : 
                   item.status === 'failed' ? '#F44336' : '#FFC107' }
          ]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );


  const StockTransactionItem = ({ item }) => (
    <TouchableOpacity style={styles.transactionItem} activeOpacity={0.8}>
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
              ? `${t('transactions.from')} ${item.from_wallet_id}` 
              : `${t('transactions.to')} ${item.to_wallet_id || t('transactions.activateBundle')}`}
          </Text>
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
  const goBack = () => {
    navigation.goBack();
  };


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
          onPress={() => setActiveTab("all")}
        >
          <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>
            {t('common.all')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "orders" && styles.activeTab]}
          onPress={() => setActiveTab("orders")}
        >
          <Text style={[styles.tabText, activeTab === "orders" && styles.activeTabText]}>
            {t('transactions.orders')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "stock" && styles.activeTab]}
          onPress={() => setActiveTab("stock")}
        >
          <Text style={[styles.tabText, activeTab === "stock" && styles.activeTabText]}>
            {t('transactions.stock')}
          </Text>
        </TouchableOpacity>
      </View>

 
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {filteredTransactions.length} {t('transactions.transactionsFound')}
        </Text>
      </View>

 
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item, index) => `${item.transactionType}-${item.id}-${index}`}
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
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <Ionicons name="refresh" size={32} color={Colors.primary} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 100,
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  headerRight: {
    width: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    margin: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9E9E9E',
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  countContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  countText: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 2,
  },
  itemDetail: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9E9E9E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
});