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
  RefreshControl,
  I18nManager
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import ServiceButton from "../components/ServiceButton";
import { useAuth } from "../auth/AuthProvider";
import { useQuery } from '@tanstack/react-query';
import { getOrdersC } from '../services/order_services';
import { useLanguage } from "../context/LanguageContext";
import { useTranslation } from "react-i18next";

export default function HomeConsumerScreen({ navigation }) {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { isRTL, currentLanguage } = useLanguage();
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
        label: t('services.mobileTopup'),
        icon: "phone-portrait-outline",
        onPress: () => navigation.navigate("Topup1"),
      },
      {
        key: "DataBundle",
        label: t('services.dataBundle'),
        icon: "wifi-outline",
        onPress: () => navigation.navigate("Data"),
      },
      {
        key: "GameCoins",
        label: t('services.gameCoins'),
        icon: "game-controller-outline",
        onPress: () => navigation.navigate("GameCoins"),
      },
    ],
    [navigation, t]
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    };
    return date.toLocaleDateString(i18n.language === 'ps' ? 'fa-IR' : i18n.language === 'dr' ? 'fa-AF' : 'en-US', options);
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

  const TransactionRow = ({ item }) => (
    <TouchableOpacity
      style={[styles.txRow, isRTL && styles.txRowRTL]}
      onPress={() => navigation.navigate("Orders")}
      activeOpacity={0.85}
    >
      <View style={[styles.txLeft, isRTL && styles.txLeftRTL]}>
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
        <View style={[styles.txInfo, isRTL && styles.txInfoRTL]}>
          <Text style={[styles.txTitle, isRTL && styles.textRTL]}>
            {getServiceName(item.source)}
          </Text>
          <Text style={[styles.txSub, isRTL && styles.textRTL]}>{formatDate(item.createdAt)}</Text>
          <Text style={[styles.txPhone, isRTL && styles.textRTL]}>{item.receiver}</Text>
        </View>
      </View>
      <View style={[styles.txRight, isRTL && styles.txRightRTL]}>
        <Text style={[
          styles.txAmount,
          { color: item.status === 'succeeded' ? '#4CAF50' : 
                 item.status === 'failed' ? '#F44336' : '#FFC107' },
          isRTL && styles.textRTL
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
                   item.status === 'failed' ? '#F44336' : '#FFC107' },
            isRTL && styles.textRTL
          ]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, isRTL && styles.safeAreaRTL]}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["#D70000", "#E52421", "#F0533F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={[styles.headerContent, isRTL && styles.headerContentRTL]}>
          <View style={isRTL && styles.headerTextRTL}>
            <Text style={[styles.greeting, isRTL && styles.textRTL]}>{t('greeting.hi')},</Text>
            <Text style={[styles.userName, isRTL && styles.textRTL]}>{userName}</Text>
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
        <View style={[styles.servicesHeader, isRTL && styles.servicesHeaderRTL]}>
          <Text style={[styles.servicesTitle, isRTL && styles.textRTL]}>{t('services.title')}</Text>
        </View>
        <View style={[styles.servicesGrid, isRTL && styles.servicesGridRTL]}>
          {SERVICES_B2C.map((s) => (
            <ServiceButton
              key={s.key}
              label={s.label}
              icon={s.icon}
              onPress={s.onPress}
              isRTL={isRTL}
            />
          ))}
        </View>

        <View style={[styles.recentContainer, isRTL && styles.recentContainerRTL]}>
          <View style={[styles.recentHeader, isRTL && styles.recentHeaderRTL]}>
            <Text style={[styles.recentTitle, isRTL && styles.textRTL]}>{t('transactions.recent')}</Text>
            <TouchableOpacity onPress={goToAllOrders}>
              <Text style={[styles.seeAll, isRTL && styles.textRTL]}>{t('common.seeAll')}</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />
          ) : isError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={32} color="#f44336" />
              <Text style={[styles.errorText, isRTL && styles.textRTL]}>{t('errors.loadTransactions')}</Text>
              <TouchableOpacity onPress={refetch} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>{t('common.tryAgain')}</Text>
              </TouchableOpacity>
            </View>
          ) : ordersData?.data && ordersData.data.length > 0 ? (
            ordersData.data.map((tx) => (
              <TransactionRow key={tx.id} item={tx} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={40} color="#ccc" />
              <Text style={[styles.emptyStateText, isRTL && styles.textRTL]}>{t('transactions.noTransactions')}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: Colors.white 
  },

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
  headerContentRTL: {
    flexDirection: "row-reverse",
  },
  headerTextRTL: {
    alignItems: 'flex-end',
  },
  greeting: { 
    color: "#fff", 
    fontSize: 16 
  },
  userName: { 
    color: "#fff", 
    fontSize: 24, 
    fontWeight: "700", 
    marginTop: 4 
  },
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
    marginTop: 24,
    flexDirection: 'row'
  },
  servicesHeaderRTL: {
    flexDirection: 'row-reverse',
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
  servicesGridRTL: {
    justifyContent: "flex-end",
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
  recentHeaderRTL: {
    flexDirection: "row-reverse",
  },
  recentTitle: { 
    color: Colors.textPrimary, 
    fontSize: 18, 
    fontWeight: "500" 
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
  txRowRTL: {
    flexDirection: "row-reverse",
  },
  txLeft: { 
    flexDirection: "row", 
    alignItems: "center", 
    flex: 1 
  },
  txLeftRTL: {
    flexDirection: "row-reverse",
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
  txInfoRTL: {
    alignItems: 'flex-end',
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
  txRightRTL: { 
    alignItems: "flex-start" 
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
  },
  textRTL: {
    textAlign: 'right',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
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