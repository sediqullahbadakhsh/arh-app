import React, { useEffect, useMemo, useState } from "react";
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
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "../../theme/colors";
import ServiceButton from "../../components/ServiceButton";
import { useUser } from "../../context/userContext";
import { getRecentOrdersOfAgent } from "../../services/merchantApi";
import { formatDateTime } from "../../utils/formatDate";
import { capitalizeFirstLetter } from "../../utils/capitalizeFirstLetter";
import HeaderBackgroundSVG from "../../../assets/top";
import TopupIcon from '../../../assets/icons/Topup1.png';
import BundleIcon from '../../../assets/icons/Bundle1.png';
import GamesIcon from '../../../assets/icons/Games1.png';
import StockTransferIcon from '../../../assets/icons/StockTransfer.png'; 


export default function HomeMerchantScreen({ navigation }) {
  const { user, setUser } = useUser();
  const [recentTransaction, setRecentTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [userName, setUserName] = useState(user?.username || "Merchant");

  useEffect(() => {
    const getRecentTransactions = async () => {
      const res = await getRecentOrdersOfAgent();
      console.log(res, "recent Transactions");
      setRecentTransactions(res?.data || []);
    };

    getRecentTransactions();
  }, []);


  useEffect(() => {
    if (user?.profileImg) {
      const fullImageUrl = user.profileImg.startsWith('http') 
        ? user.profileImg 
        : `http://192.168.0.115:8081/uploads/merchant_pictures/${user.profileImg}`;
      setProfileImage(fullImageUrl);
    }
  }, [user]);

  const services = useMemo(
    () => [
      {
        key: "StockTransfer",
        label: "Stock Transfer",
        icon: <Image source={StockTransferIcon} style={{ width: 45, height: 45 }} resizeMode="contain" />,
        onPress: () => navigation.navigate("StockTransfer"),
      },
      {
        key: "MobileTopup",
        label: "Mobile Top-up",
        icon: <Image source={TopupIcon} style={{ width: 45, height: 45 }} resizeMode="contain" />,
        onPress: () => navigation.navigate("Topup"),
      },
      { 
        key: "DataBundle", 
        label: "Data Bundle", 
        icon: <Image source={BundleIcon} style={{ width: 60, height: 60 }} resizeMode="contain" />,
        onPress: () => navigation.navigate("DataMerchant"),
      },
      {
        key: "GameCoins",
        label: "Game Coins",
        icon: <Image source={GamesIcon} style={{ width: 60, height: 60 }} resizeMode="contain" />,
        onPress: () => navigation.navigate("GameCoins"),
      },
    ],
    [navigation]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await getRecentOrdersOfAgent();
      setRecentTransactions(res?.data || []);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const goToNotifications = () => navigation.navigate("Notifications");
  const goToProfile = () => navigation.navigate("MerchantProfile");

  const TransactionRow = ({ item }) => (
    <TouchableOpacity
      style={styles.txRow}
      onPress={() => navigation.navigate("MerchantOrders")}
      activeOpacity={0.85}
    >
      <View style={styles.txLeft}>
        <View style={[
          styles.txIconWrap,
          { backgroundColor: item.status === 'completed' ? '#E8F5E9' : 
                            item.status === 'failed' ? '#FFEBEE' : '#FFF8E1' }
        ]}>
          <Ionicons
            name={item.type === 'recharge' ? 'phone-portrait-outline' : 'wifi-outline'} 
            size={20} 
            color={item.status === 'completed' ? '#4CAF50' : 
                   item.status === 'failed' ? '#F44336' : '#FFC107'} 
          />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txTitle}>
            {capitalizeFirstLetter(item?.type || 'Transaction')}
          </Text>
          <Text style={styles.txSub}>{formatDateTime(item?.createdAt)}</Text>
          <Text style={styles.txPhone}>{item.receiver ? `(+93) ${item.receiver}` : 'N/A'}</Text>
        </View>
      </View>
      <View style={styles.txRight}>
        <Text style={[
          styles.txAmount,
          { color: item.status === 'completed' ? '#4CAF50' : 
                 item.status === 'failed' ? '#F44336' : '#FFC107' }
        ]}>
          {Number(item?.amount || 0).toFixed(2)} {item?.currency || 'USD'}
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
            {capitalizeFirstLetter(item?.status || 'Pending')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />


      <View style={styles.header}>
        <View style={styles.svgContainer}>
          <HeaderBackgroundSVG width="100%" height="100%" />
        </View>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.userInfo} 
            onPress={goToProfile}
            activeOpacity={0.7}
          >
            <View style={styles.avatarContainer}>
              {profileImage ? (
                <Image 
                  source={{ uri: profileImage }} 
                  style={styles.avatarImage}
                  onError={(e) => {
                    console.log('Image load error:', e.nativeEvent.error);
                    setProfileImage(null);
                  }}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={24} color="#fff" />
                </View>
              )}
            </View>
            <View style={styles.userTextContainer}>
              <Text style={styles.greeting}>Hi,</Text>
              <Text style={styles.userName} numberOfLines={1}>
                {userName}
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={goToNotifications} style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.servicesGrid}>
          {services.map((s) => (
            <ServiceButton
              key={s.key}
              label={s.label}
              icon={s.icon}
              onPress={s.onPress}
            />
          ))}
        </View>

     
        <TouchableOpacity 
          style={styles.promoBanner}
          onPress={() => navigation.navigate("MerchantAnalytics")}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#C40C02', '#E48D08']}
            style={styles.promoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.promoContent}>
              <View style={styles.promoTextContainer}>
                <Text style={styles.promoTitle}>Business Analytics</Text>
                <Text style={styles.promoSubtitle}>
                  View your sales performance and customer insights
                </Text>
              </View>
              <View style={styles.promoButton}>
                <Text style={styles.promoButtonText}>View Dashboard</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </View>
            </View>
            <View style={styles.promoIcon}>
              <Ionicons name="bar-chart-outline" size={40} color="rgba(255,255,255,0.8)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate("MerchantOrders")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentTransaction.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={40} color="#ccc" />
              <Text style={styles.emptyStateText}>No transactions yet</Text>
            </View>
          ) : (
            recentTransaction.map((tx) => (
              <TransactionRow key={tx.id} item={tx} />
            ))
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
    height: 180,
    position: 'relative', 
  },
  svgContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  headerContent: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    transform: [{ translateY: -24 }], 
    zIndex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  userTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  // Promotional Banner
  promoBanner: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 25,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  promoGradient: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 120,
  },
  promoContent: {
    flex: 1,
  },
  promoTextContainer: {
    marginBottom: 15,
  },
  promoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  promoSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  promoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  promoButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginRight: 5,
  },
  promoIcon: {
    marginLeft: 10,
  },

  // Services
  servicesHeader: { 
    paddingHorizontal: 24, 
    marginBottom: 12, 
    marginTop: 10,
  },
  servicesTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: Colors.textPrimary 
  },
  servicesGrid: {
    flexDirection: "row",
    marginTop: 25,
    flexWrap: "wrap",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: "#fff",
    padding: 10,
    justifyContent: "space-between", 
    marginBottom: 24,
  },

  // Recent Transactions
  recentContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
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