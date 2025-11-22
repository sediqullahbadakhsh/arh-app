import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  RefreshControl,
  Image,
  Modal,
  Animated,
  Easing,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "../../theme/colors";
import ServiceButton from "../../components/ServiceButton";
import { useUser } from "../../context/userContext";
import { getRecentOrdersOfAgent, getStockInOut } from "../../services/merchantApi";
import { formatDateTime } from "../../utils/formatDate";
import { capitalizeFirstLetter } from "../../utils/capitalizeFirstLetter";
import HeaderBackgroundSVG from "../../../assets/top";
import TopupIcon from '../../../assets/icons/topup.png';
import BundleIcon from '../../../assets/icons/Data bundle.png';
import GamesIcon from '../../../assets/icons/game.png';
import StockTransferIcon from '../../../assets/icons/stock.png';
import { useTranslation } from "react-i18next";
import ReceiptModal1 from "../../components/ReceiptModal";
import { scale } from "../../utils/normalizeSize";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HomeMerchantScreen({ navigation }) {
  const { user, setUser } = useUser();
  const { t, i18n } = useTranslation();
  
  const [recentTransaction, setRecentTransactions] = useState([]);
  const [stockTransactions, setStockTransactions] = useState([]); 
  const [refreshing, setRefreshing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [userName, setUserName] = useState(user?.username || t('merchant'));
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedTransactionType, setSelectedTransactionType] = useState(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      await getRecentTransactions();
      await getStockTransactions();
    };

    fetchData();

    // Show welcome modal for new merchants (you can modify this condition)
    const shouldShowWelcome = true; // Add your logic here - e.g., check if first login
    if (shouldShowWelcome) {
      setTimeout(() => {
        setShowWelcomeModal(true);
      }, 1000);
    }
  }, []);

  const getRecentTransactions = async () => {
    const res = await getRecentOrdersOfAgent();
    console.log(res, "recent Transactions");
    setRecentTransactions(res?.data || []);
  };

  const getStockTransactions = async () => {
    const res = await getStockInOut();
    console.log(res, "stock transactions");
    setStockTransactions(res?.data || []);
  };

  useEffect(() => {
    if (user?.profileImg) {
      const fullImageUrl = user.profileImg.startsWith('http') 
        ? user.profileImg 
        : `http://3.67.144.22/backend/uploads/merchant_pictures/${user.profileImg}`;
      setProfileImage(fullImageUrl);
    }
  }, [user]);

  const services = useMemo(
    () => [
      {
        key: "StockTransfer",
        label: t('services.stockTransfer'),
        icon: <Image source={StockTransferIcon} style={{ width: 80, height: 80 }} resizeMode="contain" />,
        onPress: () => navigation.navigate("StockTransfer"),
      },
      {
        key: "MobileTopup",
        label: t('services.mobileTopup'),
        icon: <Image source={TopupIcon} style={{ width: 100, height: 100 }} resizeMode="contain" />,
        onPress: () => navigation.navigate("Topup"),
      },
      { 
        key: "DataBundle", 
        label: t('services.dataBundle'), 
        icon: <Image source={BundleIcon} style={{ width: 80, height: 80 }} resizeMode="contain" />,
        onPress: () => navigation.navigate("DataMerchant"),
      },
      {
        key: "GameCoins",
        label: t('services.gameCoins'),
        icon: <Image source={GamesIcon} style={{ width: 80, height: 80 }} resizeMode="contain" />,
        onPress: () => navigation.navigate("GameCoins"),
      },
    ],
    [navigation, t]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([getRecentTransactions(), getStockTransactions()]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const goToNotifications = () => navigation.navigate("Notifications");
  const goToProfile = () => navigation.navigate("MerchantProfile");

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
      case 'bundle':
        return t('services.dataBundle');
      case 'game_coins':
        return t('services.gameCoins');
      default:
        return t('transaction');
    }
  };

  const formatAF = (n) =>
    Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });

  const handleTransactionPress = (transaction, transactionType) => {
    setSelectedTransaction(transaction);
    setSelectedTransactionType(transactionType);
    setReceiptModalVisible(true);
  };

  const OrderTransactionRow = ({ item }) => (
    <TouchableOpacity
      style={styles.txRow}
      onPress={() => handleTransactionPress(item, 'order')}
      activeOpacity={0.85}
    >
      <View style={styles.txLeft}>
        <View style={[
          styles.txIconWrap,
          { backgroundColor: item.status === 'succeeded' ? '#E8F5E9' : 
                            item.status === 'failed' ? '#FFEBEE' : '#FFF8E1' }
        ]}>
          <Ionicons
            name={item.type === 'recharge' ? 'phone-portrait-outline' : 'wifi-outline'} 
            size={20} 
            color={item.status === 'succeeded' ? '#4CAF50' : 
                   item.status === 'failed' ? '#F44336' : '#FFC107'} 
          />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txTitle}>
            {getServiceName(item?.type)}
          </Text>
          <Text style={styles.txSub}>{formatDateTime(item?.createdAt)}</Text>
          <Text style={styles.txPhone}>{item.receiver ? `(+93) ${item.receiver}` : 'N/A'}</Text>
        </View>
      </View>
      <View style={styles.txRight}>
        <Text style={[
          styles.txAmount,
          { color: item.status === 'succeeded' ? '#4CAF50' : 
                 item.status === 'failed' ? '#F44336' : '#FFC107' }
        ]}>
          {Number(item?.amount || 0).toFixed(2)} {item?.currency || 'USD'}
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
            {getStatusText(item?.status)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const StockTransactionRow = ({ item }) => (
    <TouchableOpacity
      style={styles.txRow}
      onPress={() => handleTransactionPress(item, 'stock')}
      activeOpacity={0.85}
    >
      <View style={styles.txLeft}>
        <View style={[
          styles.txIconWrap,
          item.type === "IN" ? styles.txInIcon : styles.txOutIcon,
        ]}>
          <Ionicons
            name={item.type === "IN" ? "arrow-down" : "arrow-up"}
            size={18}
            color={item.type === "IN" ? "#0BA360" : Colors.primary}
          />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txTitle}>
            {item.type === "IN" ? "Stock In" : "Stock Out"}
          </Text>
          <Text style={styles.txSub}>
            {formatDateTime(item.createdAt)}
          </Text>
          <Text style={styles.txPhone}>
            {item.type === "IN" 
              ? `From ${item.from_wallet_id}` 
              : `To ${item.to_wallet_id || "Activate Bundle"}`}
          </Text>
        </View>
      </View>
      <View style={styles.txRight}>
        <Text
          style={[
            styles.txAmount,
            { color: item.type === "IN" ? "#0BA360" : Colors.primary },
          ]}
        >
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
            {item.type === "IN" ? "Received" : "Sent"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const allTransactions = useMemo(() => {
    const orders = recentTransaction.map(tx => ({ ...tx, transactionType: 'order' }));
    const stocks = stockTransactions.map(tx => ({ ...tx, transactionType: 'stock' }));
    
    return [...orders, ...stocks]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10); 
  }, [recentTransaction, stockTransactions]);

  const hasTransactions = allTransactions.length > 0;

  const openWhatsApp = () => {
    const phoneNumber = "+93700000000"; 
    const url = `whatsapp://send?phone=${phoneNumber}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "WhatsApp is not installed on your device");
    });
  };

  const openTelegram = () => {
    const username = "yescharge_support"; 
    const url = `tg://resolve?domain=${username}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Telegram is not installed on your device");
    });
  };

  const WelcomeModal = () => {
    return (
      <Modal
        visible={showWelcomeModal}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setShowWelcomeModal(false)}
      >
        <View style={styles.welcomeModalOverlay}>
          <View style={styles.welcomeModalContent}>
            <View style={styles.welcomeModalHeader}>
              <Text style={styles.welcomeModalTitle}>Welcome to Yes Charge!</Text>
              <TouchableOpacity 
                onPress={() => setShowWelcomeModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.welcomeModalScrollView}>
              <Text style={styles.welcomeModalSubtitle}>
                As a Reseller
              </Text>
              
              <View style={styles.welcomeMessageContainer}>
                <Text style={styles.welcomeMessageText}>
                  Welcome to Yes Charge as a Reseller, Please try to purchase some amount and benefit from our services.
                </Text>
              </View>

              <View style={styles.paymentOptions}>
                <View style={styles.paymentOption}>
                  <View style={styles.paymentIcon}>
                    <Ionicons name="card" size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.paymentText}>
                    You can purchase using your Master and Visa Card and receive additional commission.
                  </Text>
                </View>

                <View style={styles.paymentOption}>
                  <View style={styles.paymentIcon}>
                    <Ionicons name="business" size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.paymentText}>
                    You can purchase through direct deposit to our Bank Account
                  </Text>
                </View>

                <View style={styles.paymentOption}>
                  <View style={styles.paymentIcon}>
                    <Ionicons name="chatbubbles" size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.paymentText}>
                    For other payment options, please contact our Team
                  </Text>
                </View>
              </View>

              <View style={styles.contactSection}>
                <Text style={styles.contactTitle}>Contact us on:</Text>
                <View style={styles.contactButtons}>
                  <TouchableOpacity 
                    style={[styles.contactButton, styles.whatsappButton]}
                    onPress={openWhatsApp}
                  >
                    <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                    <Text style={styles.contactButtonText}>WhatsApp</Text>
                  </TouchableOpacity>
                  
           
                </View>
                <Text style={styles.contactNumber}>Mobile: +93 700 000 000</Text>
              </View>
            </ScrollView>

            <View style={styles.welcomeModalButtons}>
              <TouchableOpacity 
                style={[styles.welcomeModalButton, styles.primaryButton]}
                onPress={() => setShowWelcomeModal(false)}
              >
                <Text style={styles.primaryButtonText}>
                  Get Started
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

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
              <Text style={styles.greeting}>{t('greeting.hi')},</Text>
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
                <Text style={styles.promoTitle}>{t('analytics.businessAnalytics')}</Text>
                <Text style={styles.promoSubtitle}>
                  {t('analytics.viewPerformance')}
                </Text>
              </View>
              <View style={styles.promoButton}>
                <Text style={styles.promoButtonText}>{t('analytics.viewDashboard')}</Text>
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
            <Text style={styles.recentTitle}>{t('transactions.recent')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate("AllTransactions")}>
              <Text style={styles.seeAll}>{t('common.seeAll')}</Text>
            </TouchableOpacity>
          </View>

          {!hasTransactions ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={40} color="#ccc" />
              <Text style={styles.emptyStateText}>{t('transactions.noTransactions')}</Text>
            </View>
          ) : (
            allTransactions.map((tx, index) => (
              tx.transactionType === 'order' ? 
                <OrderTransactionRow key={`order-${tx.id}-${index}`} item={tx} /> :
                <StockTransactionRow key={`stock-${tx.id}-${index}`} item={tx} />
            ))
          )}
        </View>
      </ScrollView>

      <ReceiptModal1
        visible={receiptModalVisible}
        onClose={() => setReceiptModalVisible(false)}
        transaction={selectedTransaction}
        transactionType={selectedTransactionType}
      />

      <WelcomeModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  
  header: {
    height: scale.hp(19.4),
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
    paddingHorizontal: scale.wp(4.9),
    transform: [{ translateY: -scale.hp(3.1) }],
    zIndex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: scale.wp(11.7),
    height: scale.wp(11.7),
    borderRadius: scale.wp(5.85),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale.wp(2.9),
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarImage: {
    width: scale.wp(10.7),
    height: scale.wp(10.7),
    borderRadius: scale.wp(5.35),
  },
  avatarPlaceholder: {
    width: scale.wp(10.7),
    height: scale.wp(10.7),
    borderRadius: scale.wp(5.35),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  userTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  greeting: {
    fontSize: scale.hp(1.8),
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: scale.hp(2.35),
    fontWeight: 'bold',
    color: '#fff',
    marginTop: scale.hp(0.25),
  },
  iconBtn: {
    width: scale.wp(10.7),
    height: scale.wp(10.7),
    borderRadius: scale.wp(5.35),
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: scale.wp(2.4),
  },
  promoBanner: {
    marginHorizontal: scale.wp(4.9),
    marginBottom: scale.hp(3.2),
    borderRadius: scale.hp(2.6),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: scale.hp(1),
    },
    shadowOpacity: 0.2,
    shadowRadius: scale.hp(2.1),
    elevation: 10,
  },
  promoGradient: {
    borderRadius: scale.hp(2.6),
    padding: scale.hp(2.6),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: scale.hp(15.5),
  },
  promoContent: {
    flex: 1,
  },
  promoTextContainer: {
    marginBottom: scale.hp(1.95),
  },
  promoTitle: {
    fontSize: scale.hp(2.85),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: scale.hp(0.65),
  },
  promoSubtitle: {
    fontSize: scale.hp(1.8),
    color: 'rgba(255,255,255,0.9)',
    lineHeight: scale.hp(2.6),
  },
  promoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: scale.wp(3.9),
    paddingVertical: scale.hp(1.05),
    borderRadius: scale.hp(2.6),
    alignSelf: 'flex-start',
  },
  promoButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: scale.hp(1.8),
    marginRight: scale.wp(1.2),
  },
  promoIcon: {
    marginLeft: scale.wp(2.4),
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: scale.wp(4.9),
    marginTop: scale.hp(3.9),
    justifyContent: "space-between",
    marginBottom: scale.hp(1.3),
  },
  recentContainer: {
    backgroundColor: "#fff",
    borderRadius: scale.hp(2.1),
    padding: scale.hp(2.6),
    marginBottom: scale.hp(12.9),
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: "#F3F3F3",
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale.hp(2.1),
  },
  recentTitle: {
    color: Colors.textPrimary,
    fontSize: scale.hp(2.35),
    fontWeight: "500",
  },
  seeAll: {
    color: Colors.primary,
    fontSize: scale.hp(1.8),
    fontWeight: "600",
  },
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scale.hp(2.1),
    borderBottomWidth: 1,
    borderBottomColor: "#F3F3F3",
  },
  txLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
    welcomeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale.hp(2.5),
  },
  welcomeModalContent: {
    backgroundColor: Colors.white,
    borderRadius: scale.hp(2),
    padding: scale.hp(3),
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  welcomeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scale.hp(2),
    paddingBottom: scale.hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  welcomeModalTitle: {
    fontSize: scale.hp(2.5),
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    padding: scale.hp(0.5),
  },
  welcomeModalScrollView: {
    maxHeight: scale.hp(37.5),
  },
  welcomeModalSubtitle: {
    fontSize: scale.hp(2),
    color: Colors.textSecondary,
    marginBottom: scale.hp(2),
    fontWeight: '600',
    textAlign: 'center',
  },
  welcomeMessageContainer: {
    backgroundColor: '#f5f5f5',
    padding: scale.hp(1.5),
    borderRadius: scale.hp(1),
    marginBottom: scale.hp(2),
  },
  welcomeMessageText: {
    fontSize: scale.hp(1.75),
    color: Colors.textPrimary,
    lineHeight: scale.hp(2.5),
    textAlign: 'center',
  },
  paymentOptions: {
    marginBottom: scale.hp(4),
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: scale.hp(2),
    padding: scale.hp(1),
    backgroundColor: '#F9F9F9',
    borderRadius: scale.hp(1),
  },
  paymentIcon: {
    width: scale.wp(8),
    height: scale.wp(8),
    borderRadius: scale.wp(4),
    backgroundColor: 'rgba(196, 12, 2, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale.wp(3),
    marginTop: scale.hp(0.5),
  },
  paymentText: {
    fontSize: scale.hp(1.75),
    color: Colors.textPrimary,
    lineHeight: scale.hp(2.5),
    flex: 1,
  },
  contactSection: {
    backgroundColor: '#f5f5f5',
    padding: scale.hp(1.5),
    borderRadius: scale.hp(1),
    marginTop: scale.hp(2),
    marginBottom: scale.hp(2),
  },
  contactTitle: {
    fontSize: scale.hp(1.75),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scale.hp(1),
    textAlign: 'center',
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale.wp(3),
    marginBottom: scale.hp(1),
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale.wp(4),
    paddingVertical: scale.hp(1),
    borderRadius: scale.hp(1),
    gap: scale.wp(2),
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  telegramButton: {
    backgroundColor: '#0088CC',
  },
  contactButtonText: {
    color: '#fff',
    fontSize: scale.hp(1.75),
    fontWeight: '600',
  },
  contactNumber: {
    fontSize: scale.hp(1.75),
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  welcomeModalButtons: {
    marginTop: scale.hp(3),
    marginBottom: scale.hp(4.5),
    gap: scale.hp(1.5),
  },
  welcomeModalButton: {
    padding: scale.hp(2),
    borderRadius: scale.hp(1.25),
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: scale.hp(2),
    fontWeight: '600',
  },
  txIconWrap: {
    width: scale.wp(11.7),
    height: scale.wp(11.7),
    borderRadius: scale.wp(5.85),
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale.wp(2.9),
  },
  txInIcon: {
    backgroundColor: "rgba(11, 163, 96, 0.1)",
  },
  txOutIcon: {
    backgroundColor: "rgba(215, 0, 0, 0.1)",
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    color: Colors.textPrimary,
    fontSize: scale.hp(2.1),
    fontWeight: "600",
    textTransform: 'capitalize',
  },
  txSub: {
    color: "#9E9E9E",
    fontSize: scale.hp(1.55),
    marginTop: scale.hp(0.25),
  },
  txPhone: {
    color: "#9E9E9E",
    fontSize: scale.hp(1.55),
    marginTop: scale.hp(0.25),
  },
  txRight: {
    alignItems: "flex-end",
  },
  txAmount: {
    fontSize: scale.hp(2.1),
    fontWeight: "700",
    marginBottom: scale.hp(0.5),
  },
  statusBadge: {
    paddingHorizontal: scale.wp(2),
    paddingVertical: scale.hp(0.5),
    borderRadius: scale.hp(1.55),
  },
  statusText: {
    fontSize: scale.hp(1.55),
    fontWeight: "600",
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    padding: scale.hp(2.6),
  },
  emptyStateText: {
    color: '#9E9E9E',
    fontSize: scale.hp(1.8),
    marginTop: scale.hp(1.05),
  },

  // Welcome Modal Styles
  welcomeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  welcomeModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  welcomeModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: scale.hp(3.9),
    borderTopRightRadius: scale.hp(3.9),
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -scale.hp(1.3),
    },
    shadowOpacity: 0.25,
    shadowRadius: scale.hp(3.9),
    elevation: 20,
  },
  welcomeHeader: {
    padding: scale.hp(3.1),
    borderTopLeftRadius: scale.hp(3.9),
    borderTopRightRadius: scale.hp(3.9),
    alignItems: 'center',
  },
  welcomeIconContainer: {
    width: scale.wp(19.5),
    height: scale.wp(19.5),
    borderRadius: scale.wp(9.75),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale.hp(1.3),
  },
  welcomeTitle: {
    fontSize: scale.hp(3.1),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: scale.hp(0.65),
  },
  welcomeSubtitle: {
    fontSize: scale.hp(2.1),
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  welcomeContent: {
    maxHeight: scale.hp(58.5),
    padding: scale.hp(2.6),
  },
  welcomeMessage: {
    fontSize: scale.hp(2.1),
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: scale.hp(2.85),
    marginBottom: scale.hp(2.6),
    fontWeight: '500',
  },
  paymentOptions: {
    gap: scale.hp(1.95),
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: scale.hp(2.1),
    borderRadius: scale.hp(1.95),
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  paymentIcon: {
    width: scale.wp(14.6),
    height: scale.wp(14.6),
    borderRadius: scale.wp(7.3),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale.wp(3.9),
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: scale.hp(2.1),
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: scale.hp(0.65),
  },
  paymentDescription: {
    fontSize: scale.hp(1.8),
    color: '#666',
    lineHeight: scale.hp(2.35),
    marginBottom: scale.hp(0.65),
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFE8E6',
    paddingHorizontal: scale.wp(2.9),
    paddingVertical: scale.hp(0.5),
    borderRadius: scale.hp(1.3),
  },
  badgeText: {
    fontSize: scale.hp(1.55),
    color: '#C40C02',
    fontWeight: '600',
  },
  otherPayments: {
    backgroundColor: '#F8F9FA',
    padding: scale.hp(2.6),
    borderRadius: scale.hp(1.95),
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginTop: scale.hp(1.3),
  },
  otherPaymentsTitle: {
    fontSize: scale.hp(2.1),
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: scale.hp(0.65),
  },
  otherPaymentsDescription: {
    fontSize: scale.hp(1.8),
    color: '#666',
    marginBottom: scale.hp(1.95),
    lineHeight: scale.hp(2.35),
  },
  contactButtons: {
    flexDirection: 'row',
    gap: scale.wp(2.9),
    marginBottom: scale.hp(1.95),
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale.hp(1.3),
    paddingHorizontal: scale.wp(3.9),
    borderRadius: scale.hp(1.3),
    gap: scale.wp(1.95),
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  telegramButton: {
    backgroundColor: '#0088CC',
  },
  contactButtonText: {
    color: '#fff',
    fontSize: scale.hp(1.8),
    fontWeight: '600',
  },
  contactNumber: {
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  welcomeFooter: {
    padding: scale.hp(2.6),
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    gap: scale.hp(1.3),
  },
  getStartedButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale.hp(1.8),
    borderRadius: scale.hp(1.3),
    gap: scale.wp(1.95),
  },
  getStartedButtonText: {
    color: '#fff',
    fontSize: scale.hp(2.1),
    fontWeight: 'bold',
  },
  laterButton: {
    paddingVertical: scale.hp(1.3),
    alignItems: 'center',
  },
  laterButtonText: {
    color: '#666',
    fontSize: scale.hp(1.8),
    fontWeight: '500',
  },
});