// src/screens/HomeConsumerScreen.jsx
import React, { useMemo, useState, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import ServiceButton from "../components/ServiceButton";
import { useAuth } from "../auth/AuthProvider";
import { useQuery } from '@tanstack/react-query';
import { getOrdersC } from '../services/order_services';

export default function HomeConsumerScreen({ navigation }) {
  const { user } = useAuth();
  const userName = user?.username;
  const [refreshing, setRefreshing] = useState(false);

  const { data: ordersData, isLoading, isError, refetch } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => getOrdersC({ page: 1, limit: 10, status: '' }),
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().then(() => setRefreshing(false));
  }, []);

  const goToNotifications = () => navigation.navigate("Notifications");
  const goToAllOrders = () => navigation.navigate("Order");

  const SERVICES_B2C = useMemo(
    () => [
      {
        key: "MobileTopup1",
        label: "Mobile Top-up",
        icon: "phone-portrait-outline",
        onPress: () => navigation.navigate("Topup1"),
      },
      {
        key: "DataBundle",
        label: "Data Bundle",
        icon: "wifi-outline",
        onPress: () => navigation.navigate("Data"),
      },
      {
        key: "GameCoins",
        label: "Game Coins",
        icon: "game-controller-outline",
        onPress: () => navigation.navigate("GameCoins"),
      },
    ],
    [navigation]
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getServiceIcon = (source) => {
    switch (source) {
      case 'mobile_topup':
        return 'phone-portrait-outline';
      case 'data_bundle':
        return 'wifi-outline';
      case 'game_coins':
        return 'game-controller-outline';
      default:
        return 'document-text-outline';
    }
  };

  const TransactionRow = ({ item }) => (
    <TouchableOpacity
      style={styles.txRow}
      onPress={() => navigation.navigate("Orders")}
      activeOpacity={0.85}
    >
      <View style={styles.txLeft}>
        <View style={[
          styles.txIconWrap,
          { backgroundColor: item.status === 'succeeded' ? '#E8F5E9' : 
                            item.status === 'failed' ? '#FFEBEE' : '#FFF8E1' }
        ]}>
          <Ionicons 
            name={getServiceIcon(item.source)} 
            size={20} 
            color={item.status === 'succeeded' ? '#4CAF50' : 
                   item.status === 'failed' ? '#F44336' : '#FFC107'} 
          />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txTitle}>{item.source?.replace('_', ' ') || 'Transaction'}</Text>
          <Text style={styles.txSub}>{formatDate(item.createdAt)}</Text>
          <Text style={styles.txPhone}>{item.receiver}</Text>
        </View>
      </View>
      <View style={styles.txRight}>
        <Text style={[
          styles.txAmount,
          { color: item.status === 'succeeded' ? '#4CAF50' : 
                 item.status === 'failed' ? '#F44336' : '#FFC107' }
        ]}>
          {Number(item.amount).toFixed(2)} {item.currency}
        </Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'succeeded' ? '#E8F5E9' : 
                            item.status === 'failed' ? '#FFEBEE' : '#FFF8E1' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.status === 'succeeded' ? '#4CAF50' : 
                   item.status === 'failed' ? '#F44336' : '#FFC107' }
          ]}>
            {item.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["#D70000", "#E52421", "#F0533F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Hi,</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <TouchableOpacity onPress={goToNotifications} style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.servicesHeader}>
          <Text style={styles.servicesTitle}>Services</Text>
        </View>
        <View style={styles.servicesGrid}>
          {SERVICES_B2C.map((s) => (
            <ServiceButton
              key={s.key}
              label={s.label}
              icon={s.icon}
              onPress={s.onPress}
            />
          ))}
        </View>

        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={goToAllOrders}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />
          ) : isError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={32} color="#f44336" />
              <Text style={styles.errorText}>Failed to load transactions</Text>
              <TouchableOpacity onPress={refetch} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : ordersData?.data && ordersData.data.length > 0 ? (
            ordersData.data.map((tx) => (
              <TransactionRow key={tx.id} item={tx} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={40} color="#ccc" />
              <Text style={styles.emptyStateText}>No transactions yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.white },
  header: {
    height: 170,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  greeting: { color: "#fff", fontSize: 16 },
  userName: { color: "#fff", fontSize: 24, fontWeight: "700", marginTop: 4 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  servicesHeader: { 
    paddingHorizontal: 24, 
    marginBottom: 12, 
    marginTop: 24 
  },
  servicesTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: Colors.textPrimary 
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
    justifyContent: "flex-start",
    gap: 8,
    marginBottom: 24,
  },
  recentContainer: {
    marginHorizontal: 24,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  recentTitle: { 
    color: Colors.textPrimary, 
    fontSize: 18, 
    fontWeight: "700" 
  },
  seeAll: { 
    color: Colors.primary, 
    fontSize: 14, 
    fontWeight: "600" 
  },
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F3F3",
  },
  txLeft: { 
    flexDirection: "row", 
    alignItems: "center", 
    flex: 1 
  },
  txIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: { 
    color: Colors.textPrimary, 
    fontSize: 16, 
    fontWeight: "600",
    textTransform: 'capitalize'
  },
  txSub: { 
    color: "#9E9E9E", 
    fontSize: 12, 
    marginTop: 2 
  },
  txPhone: { 
    color: "#9E9E9E", 
    fontSize: 12, 
    marginTop: 2 
  },
  txRight: { 
    alignItems: "flex-end" 
  },
  txAmount: { 
    fontSize: 16, 
    fontWeight: "700",
    marginBottom: 4
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: 'capitalize'
  },
  loader: {
    padding: 20,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    color: '#9E9E9E',
    fontSize: 14,
    marginTop: 8,
  }
});