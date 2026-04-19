import React, { useEffect, useMemo, useState, useRef } from "react";
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
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "../../theme/colors";
import ServiceButton from "../../components/ServiceButton";
import { useUser } from "../../context/userContext";
import SocialIcon from '../../../assets/icons/social.png';
import { getRecentOrdersOfAgent, getStockInOut, getUserWallets } from "../../services/merchantApi";
import { formatDateTime } from "../../utils/formatDate";
import { capitalizeFirstLetter } from "../../utils/capitalizeFirstLetter";
import HeaderBackgroundSVG from "../../../assets/top";
import TopupIcon from '../../../assets/icons/topup.png';
import BundleIcon from '../../../assets/icons/Data bundle.png';
import GamesIcon from '../../../assets/icons/game.png';
import StockTransferIcon from '../../../assets/icons/stock.png';
import { useTranslation } from "react-i18next";
import ReceiptModal1 from "../../components/ReceiptModal";
import DotIndicators from "../../components/DotIndicators";
import { scale } from "../../utils/normalizeSize";
import { useFocusEffect } from "@react-navigation/native";
import NetInfo from "@react-native-community/netinfo";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 48;
const CARD_MARGIN = 16;

const WELCOME_MODAL_SEEN_KEY = 'has_seen_welcome_modal';


let refreshListeners = [];

export const triggerHomeRefresh = () => {
  refreshListeners.forEach(listener => listener());
};

const NetworkStatusIndicator = ({ isConnected }) => {
  if (isConnected) return null;
  
  return (
    <View style={networkStyles.container}>
      <Ionicons name="wifi-off" size={16} color="#fff" />
      <Text style={networkStyles.text}>No Internet Connection</Text>
    </View>
  );
};


const WalletCardSkeleton = () => {
  return (
    <View style={styles.skeletonWalletCard}>
      <View style={styles.cardPattern}>
        <View style={styles.patternCircle1} />
        <View style={styles.patternCircle2} />
      </View>
      
      <View style={styles.cardHeader}>
        <View style={styles.balanceSection}>
          <View style={[styles.skeletonBlock, { width: scale.wp(31.2), height: scale.hp(1.8), marginBottom: scale.hp(1.05) }]} />
          <View style={[styles.skeletonBlock, { width: scale.wp(41.6), height: scale.hp(4.2), marginBottom: scale.hp(1.55) }]} />
          <View style={[styles.skeletonBlock, { width: scale.wp(36.4), height: scale.hp(2.1) }]} />
        </View>
        
        <View style={[styles.skeletonBlock, { width: scale.wp(12.4), height: scale.wp(12.4), borderRadius: scale.wp(6.2) }]} />
      </View>
      
      <View style={[styles.skeletonBlock, { height: scale.hp(5.7), borderRadius: scale.hp(1.55), marginTop: scale.hp(2.1) }]} />
    </View>
  );
};


const WalletCard = ({ item, index, currentIndex, onTransferPress }) => {
  const isActive = index === currentIndex;
  const { t } = useTranslation();

  return (
    <Animated.View
      style={[
        styles.walletCardContainer,
        !isActive && styles.walletCardInactive
      ]}
    >
      <LinearGradient
        colors={item?.key === "commission" ? ["#D70000", "#E52421", "#F0533F"] : ["#D70000", "#E52421", "#F0533F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.walletCard}
      >
        <View style={styles.cardPattern}>
          <View style={styles.patternCircle1} />
          <View style={styles.patternCircle2} />
        </View>

        <View style={styles.cardHeader}>
          <View style={styles.balanceSection}>
            <Text style={styles.walletLabel}>{t('walletBalance')}</Text>
            <Text style={styles.balanceText}>
              {formatAF(item.balance)} {t('currency')}
            </Text>
            <View style={styles.walletInfoRow}>
              <Text style={styles.walletName}>{item.label}</Text>
              {item?.key === "commission" && (
                <View style={styles.commissionBadge}>
                  <Text style={styles.commissionBadgeText}>Commission</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.walletIcon}>
            <LinearGradient
              colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"]}
              style={styles.walletIconGradient}
            >
              <Ionicons 
                name={item?.key === "commission" ? "gift-outline" : "wallet-outline"} 
                size={32} 
                color="#fff" 
              />
            </LinearGradient>
          </View>
        </View>

        {item?.key === "commission" && (
          <TouchableOpacity
            onPress={() => onTransferPress(item.balance)}
            style={styles.transferButton}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0.2)"]}
              style={styles.transferGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.transferButtonText}>
                {t('wallet.transferToPrimary')}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color="#fff"
                style={{ marginLeft: 8 }}
              />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </Animated.View>
  );
};


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

const SkeletonHomeScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.svgContainer}>
          <HeaderBackgroundSVG width="100%" height="100%" />
        </View>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <SkeletonCircle size={scale.wp(11.7)} />
            <View style={[styles.userTextContainer, { marginLeft: scale.wp(2.9) }]}>
              <SkeletonRect width={scale.wp(30)} height={scale.hp(1.8)} />
              <SkeletonRect 
                width={scale.wp(50)} 
                height={scale.hp(2.35)} 
                style={{ marginTop: scale.hp(0.25) }}
              />
            </View>
          </View>
          <SkeletonCircle size={scale.wp(10.7)} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
    
        <View style={styles.walletsSection}>
          <SkeletonRect 
            width={scale.wp(30)} 
            height={scale.hp(2.6)} 
            style={{ marginLeft: scale.wp(4.9), marginBottom: scale.hp(2.1) }} 
          />
          <View style={styles.walletCarouselContainer}>
            <WalletCardSkeleton />
          </View>
        </View>

        <View style={styles.servicesGrid}>
          {[1, 2, 3, 4, 5].map((item) => (
            <View key={item} style={styles.serviceSkeletonItem}>
              <SkeletonCircle size={scale.wp(20)} />
              <SkeletonRect 
                width={scale.wp(20)} 
                height={scale.hp(1.8)} 
                style={{ marginTop: scale.hp(1) }}
              />
            </View>
          ))}
        </View>

        <View style={[styles.promoBanner, { backgroundColor: '#F0F0F0' }]}>
          <View style={{ padding: scale.hp(2.6), width: '100%' }}>
            <SkeletonRect width="60%" height={scale.hp(2.85)} />
            <SkeletonRect 
              width="80%" 
              height={scale.hp(1.8)} 
              style={{ marginTop: scale.hp(0.65) }}
            />
            <SkeletonRect 
              width="40%" 
              height={scale.hp(2.6)} 
              style={{ marginTop: scale.hp(1.95), borderRadius: scale.hp(2.6) }}
            />
          </View>
        </View>

        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <SkeletonRect width="30%" height={scale.hp(2.35)} />
            <SkeletonRect width="15%" height={scale.hp(1.8)} />
          </View>

          {[1, 2, 3, 4].map((item) => (
            <View key={item} style={styles.txRow}>
              <View style={styles.txLeft}>
                <SkeletonCircle size={scale.wp(11.7)} />
                <View style={[styles.txInfo, { flex: 1, marginLeft: scale.wp(2.9) }]}>
                  <SkeletonRect width="40%" height={scale.hp(2.1)} />
                  <SkeletonRect 
                    width="60%" 
                    height={scale.hp(1.55)} 
                    style={{ marginTop: scale.hp(0.25) }}
                  />
                  <SkeletonRect 
                    width="50%" 
                    height={scale.hp(1.55)} 
                    style={{ marginTop: scale.hp(0.25) }}
                  />
                </View>
              </View>
              <View style={styles.txRight}>
                <SkeletonRect width="30%" height={scale.hp(2.1)} />
                <SkeletonRect 
                  width="40%" 
                  height={scale.hp(1.55)} 
                  style={{ marginTop: scale.hp(0.5), borderRadius: scale.hp(1.55) }}
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default function HomeMerchantScreen({ navigation }) {
  const { user, setUser } = useUser();
  const { t, i18n } = useTranslation();
  
  const [wallets, setWallets] = useState([]);
  const [activeWalletIndex, setActiveWalletIndex] = useState(0);
  const [walletsLoading, setWalletsLoading] = useState(true);
  
  const [recentTransaction, setRecentTransactions] = useState([]);
  const [stockTransactions, setStockTransactions] = useState([]); 
  const [refreshing, setRefreshing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [userName, setUserName] = useState(user?.username || t('merchant'));
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedTransactionType, setSelectedTransactionType] = useState(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  
  const flatListRef = useRef(null);
  const lastRefreshTimeRef = useRef(null);
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;
  
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems?.length) {
      setActiveWalletIndex(viewableItems[0].index);
    }
  }).current;

  useEffect(() => {
    const refreshCallback = () => {
      console.log('Triggering home refresh...');
      fetchAllData();
    };

    refreshListeners.push(refreshCallback);

    return () => {
      const index = refreshListeners.indexOf(refreshCallback);
      if (index > -1) {
        refreshListeners.splice(index, 1);
      }
    };
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      if (state.isConnected && !isConnected) {
        fetchAllData();
      }
    });

    return () => unsubscribe();
  }, [isConnected]);

  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      if (!lastRefreshTimeRef.current || (now - lastRefreshTimeRef.current > 30000)) {
        console.log('Screen focused, refreshing data...');
        fetchAllData();
      }
      
      const pollInterval = setInterval(() => {
        console.log('Auto-polling for updates...');
        fetchAllData();
      }, 60000);
      
      return () => {
        clearInterval(pollInterval);
      };
    }, [])
  );

  const fetchAllData = async (showLoading = false) => {
    if (!isConnected) {
      Alert.alert(
        'No Internet Connection',
        'Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (showLoading) {
      setIsLoading(true);
    }

    try {
      await Promise.all([
        fetchWallets(),
        getRecentTransactions(),
        getStockTransactions(),
      ]);
      lastRefreshTimeRef.current = Date.now();
    } catch (error) {
      console.error("Error loading data:", error);
      if (showLoading) {
        Alert.alert(
          'Error',
          'Failed to load data. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const fetchWallets = async () => {
    try {
      setWalletsLoading(true);
      const res = await getUserWallets(user?.id);
      
      const commissionWallet = {
        ...res?.comissionWallet,
        key: "commission",
        label: t('commissionWallet'),
        balance: res?.comissionWallet?.balance || 0,
      };
      const primaryWallet = {
        ...res?.primaryWallet,
        key: "primary",
        label: t('primaryWallet'),
        balance: res?.primaryWallet?.balance || 0,
      };
      
      setWallets([primaryWallet, commissionWallet].filter(w => w !== null));
    } catch (error) {
      console.error("Error fetching wallets:", error);
    } finally {
      setWalletsLoading(false);
    }
  };

  const getRecentTransactions = async () => {
    try {
      const res = await getRecentOrdersOfAgent();
      setRecentTransactions(res?.data || []);
    } catch (error) {
      console.error("Error fetching recent transactions:", error);
      throw error;
    }
  };

  const getStockTransactions = async () => {
    try {
      const res = await getStockInOut();
      setStockTransactions(res?.data || []);
    } catch (error) {
      console.error("Error fetching stock transactions:", error);
      throw error;
    }
  };

  useEffect(() => {
    const checkWelcomeModal = async () => {
      try {
        const hasSeenWelcomeModal = await AsyncStorage.getItem(WELCOME_MODAL_SEEN_KEY);
        
        if (!hasSeenWelcomeModal) {
          setTimeout(() => {
            setShowWelcomeModal(true);
          }, 1500);
        }
      } catch (error) {
        console.error("Error checking welcome modal status:", error);
      }
    };

    fetchAllData(true);
    checkWelcomeModal();
  }, []);

  useEffect(() => {
    if (user?.profileImg) {
      const fullImageUrl = user.profileImg.startsWith('http') 
        ? user.profileImg 
        : `http://3.67.144.22/backend/uploads/merchant_pictures/${user.profileImg}`;
      setProfileImage(fullImageUrl);
    }
  }, [user]);

  const handleWelcomeModalClose = async () => {
    try {
      await AsyncStorage.setItem(WELCOME_MODAL_SEEN_KEY, 'true');
      setShowWelcomeModal(false);
    } catch (error) {
      console.error("Error saving welcome modal status:", error);
      setShowWelcomeModal(false);
    }
  };

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
        onPress: () => navigation.navigate("GameCoinsMerchant"),
      },
      {
        key: "Social",
        label: t('services.social'),
        icon: <Image source={SocialIcon} style={{ width: 90, height: 90 }} resizeMode="contain" />,
        onPress: () => navigation.navigate("SocialScreenMerchant"),
      },
      {
        key: "StockRequest",
        label: t('services.stockRequest'),
        icon: <Image source={StockTransferIcon} style={{ width: 80, height: 80 }} resizeMode="contain" />,
        onPress: () => navigation.navigate("StockRequest"),
      },
    ],
    [navigation, t]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const goToNotifications = () => navigation.navigate("Notifications");
  const goToProfile = () => navigation.navigate("ProfileMerchant");

  const handleTransferPress = (balance) => {
    navigation.navigate("TransferToPrimary", { balance });
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
      case 'succeeded':
        return t('status.completed');
      case 'failed':
        return t('status.failed');
      case 'pending':
        return t('status.pending');
      case 'queued':
        return t('status.queued');
      case 'processing':
        return t('status.processing');
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
                            item.status === 'failed' ? '#FFEBEE' : 
                            item.status === 'processing' || item.status === 'queued' ? '#E3F2FD' : '#FFF8E1' }
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
              item.status === 'processing' || item.status === 'queued' ? '#2196F3' : '#FFC107'
            } 
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
                 item.status === 'failed' ? '#F44336' : 
                 item.status === 'processing' || item.status === 'queued' ? '#2196F3' : '#FFC107' }
        ]}>
          {Number(item?.amount || 0).toFixed(2)} {item?.currency || 'AF'}
        </Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'succeeded' ? '#E8F5E9' : 
                            item.status === 'failed' ? '#FFEBEE' : 
                            item.status === 'processing' || item.status === 'queued' ? '#E3F2FD' : '#FFF8E1' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.status === 'succeeded' ? '#4CAF50' : 
                   item.status === 'failed' ? '#F44336' : 
                   item.status === 'processing' || item.status === 'queued' ? '#2196F3' : '#FFC107' }
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
              ? `From ${item.from_wallet_id || 'Wallet'}` 
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
        onRequestClose={handleWelcomeModalClose}
      >
        <View style={styles.welcomeModalOverlay}>
          <View style={styles.welcomeModalContent}>
            <View style={styles.welcomeModalHeader}>
              <Text style={styles.welcomeModalTitle}>Welcome to YES Charge!</Text>
              <TouchableOpacity 
                onPress={handleWelcomeModalClose}
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
                  Welcome to YES Charge as a Reseller, Please try to purchase some amount and benefit from our services.
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
                  
                  <TouchableOpacity 
                    style={[styles.contactButton, styles.telegramButton]}
                    onPress={openTelegram}
                  >
                    <Ionicons name="paper-plane" size={20} color="#fff" />
                    <Text style={styles.contactButtonText}>Telegram</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.contactNumber}>Mobile: +93 700 000 000</Text>
              </View>
            </ScrollView>

            <View style={styles.welcomeModalButtons}>
              <TouchableOpacity 
                style={[styles.welcomeModalButton, styles.primaryButton]}
                onPress={handleWelcomeModalClose}
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

  const renderWalletCarousel = () => {
    if (walletsLoading) {
      return (
        <View style={styles.walletCarouselContainer}>
          <WalletCardSkeleton />
        </View>
      );
    }

    if (!wallets.length) {
      return (
        <View style={styles.noWalletsContainer}>
          <Ionicons name="wallet-outline" size={40} color="#ccc" />
          <Text style={styles.noWalletsText}>No wallets available</Text>
        </View>
      );
    }

    return (
      <View style={styles.walletCarouselContainer}>
        <FlatList
          ref={flatListRef}
          data={wallets}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          snapToInterval={CARD_WIDTH + CARD_MARGIN}
          decelerationRate="fast"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item, index }) => (
            <WalletCard
              item={item}
              index={index}
              currentIndex={activeWalletIndex}
              onTransferPress={handleTransferPress}
            />
          )}
        />
        
        {wallets.length > 1 && (
          <View style={styles.walletIndicators}>
            <DotIndicators 
              total={wallets.length} 
              activeIndex={activeWalletIndex} 
            />
          </View>
        )}
        
    
      </View>
    );
  };

  if (isLoading) {
    return <SkeletonHomeScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      <NetworkStatusIndicator isConnected={isConnected} />

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
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.walletsSection}>
          <View style={styles.sectionHeader}>
          
          </View>
          
          {renderWalletCarousel()}
        </View>


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

        {/* Recent Transactions */}
        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>{t('transactions.recent')}</Text>
            <View style={styles.recentHeaderRight}>
              <TouchableOpacity 
                onPress={() => fetchAllData()}
                style={styles.refreshButton}
              >
                <Ionicons name="refresh" size={18} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("AllTransactions")}>
                <Text style={styles.seeAll}>{t('common.seeAll')}</Text>
              </TouchableOpacity>
            </View>
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

const networkStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FF6B6B',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    paddingBottom: scale.hp(10),
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
    marginEnd: scale.wp(2.9),
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

  walletsSection: {
    marginTop: scale.hp(2.6),
    marginBottom: scale.hp(2.1),
    paddingHorizontal: scale.wp(4.9),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale.hp(2.1),
  },
  sectionTitle: {
    fontSize: scale.hp(2.35),
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  seeAllLink: {
    fontSize: scale.hp(1.8),
    color: Colors.primary,
    fontWeight: '600',
  },
  walletCarouselContainer: {
    position: 'relative',
    marginBottom: scale.hp(2.1),
  },
  walletCardContainer: {
    width: CARD_WIDTH,
    marginRight: CARD_MARGIN,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: scale.hp(1.05),
    },
    shadowOpacity: 0.2,
    shadowRadius: scale.hp(2.1),
    elevation: 8,
  },
  walletCardInactive: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
  walletCard: {
    height: scale.hp(24),
    borderRadius: scale.hp(3.1),
    padding: scale.hp(2.6),
    overflow: "hidden",
  },
  skeletonWalletCard: {
    height: scale.hp(24),
    borderRadius: scale.hp(3.1),
    padding: scale.hp(2.6),
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
    position: "relative",
    width: CARD_WIDTH,
  },
  cardPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternCircle1: {
    position: "absolute",
    top: scale.hp(-2.6),
    right: scale.hp(-2.6),
    width: scale.wp(31.2),
    height: scale.wp(31.2),
    borderRadius: scale.wp(15.6),
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  patternCircle2: {
    position: "absolute",
    bottom: scale.hp(-3.9),
    right: scale.wp(10.4),
    width: scale.wp(20.8),
    height: scale.wp(20.8),
    borderRadius: scale.wp(10.4),
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flex: 1,
  },
  balanceSection: {
    flex: 1,
  },
  walletLabel: {
    color: "#fff",
    opacity: 0.9,
    fontSize: scale.hp(1.8),
    fontWeight: "500",
    marginBottom: scale.hp(0.5),
  },
  balanceText: {
    color: "#fff",
    fontSize: scale.hp(4.2),
    fontWeight: "700",
    marginBottom: scale.hp(1.05),
  },
  walletInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletName: {
    color: "#fff",
    fontSize: scale.hp(2.1),
    opacity: 0.95,
    fontWeight: "600",
    marginRight: scale.wp(1.6),
  },
  commissionBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: scale.wp(2.1),
    paddingVertical: scale.hp(0.5),
    borderRadius: scale.hp(1.3),
  },
  commissionBadgeText: {
    color: '#fff',
    fontSize: scale.hp(1.4),
    fontWeight: '600',
  },
  walletIcon: {
    marginLeft: scale.wp(3.1),
  },
  walletIconGradient: {
    width: scale.wp(12.4),
    height: scale.wp(12.4),
    borderRadius: scale.wp(6.2),
    justifyContent: 'center',
    alignItems: 'center',
  },
  transferButton: {
    marginTop: scale.hp(2.1),
    borderRadius: scale.hp(1.55),
    overflow: "hidden",
  },
  transferGradient: {
    paddingHorizontal: scale.wp(4.2),
    paddingVertical: scale.hp(1.55),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  transferButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: scale.hp(1.8),
  },
  walletIndicators: {
    alignItems: 'center',
    marginTop: scale.hp(1.6),
  },
  totalBalanceContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: scale.hp(1.6),
    padding: scale.hp(1.6),
    marginTop: scale.hp(1.6),
    alignItems: 'center',
  },
  totalBalanceLabel: {
    fontSize: scale.hp(1.6),
    color: '#666',
    marginBottom: scale.hp(0.3),
  },
  totalBalanceValue: {
    fontSize: scale.hp(2.1),
    fontWeight: '700',
    color: Colors.primary,
  },
  noWalletsContainer: {
    height: scale.hp(20),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: scale.hp(3.1),
    padding: scale.hp(2.6),
  },
  noWalletsText: {
    marginTop: scale.hp(1.6),
    fontSize: scale.hp(1.8),
    color: '#666',
  },


  serviceSkeletonItem: {
    alignItems: 'center',
    width: '33%',
    marginBottom: scale.hp(2),
  },
  skeletonBlock: {
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
  },


  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: scale.wp(4.9),
    marginTop: scale.hp(2.6),
    marginBottom: scale.hp(2.6),
    justifyContent: "space-between",
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

  recentContainer: {
    backgroundColor: "#fff",
    borderRadius: scale.hp(2.1),
    padding: scale.hp(2.6),
    marginHorizontal: scale.wp(4.9),
    marginBottom: scale.hp(5),
    borderWidth: 1,
    borderColor: "#F3F3F3",
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale.hp(2.1),
  },
  recentHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  refreshButton: {
    padding: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
  },
  recentTitle: {
    color: Colors.textPrimary,
    fontSize: scale.hp(2.35),
    fontWeight: "700",
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
  txIconWrap: {
    width: scale.wp(11.7),
    height: scale.wp(11.7),
    borderRadius: scale.wp(5.85),
    justifyContent: "center",
    alignItems: "center",
    marginEnd: scale.wp(2.9),
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
    marginBottom: scale.hp(0.25),
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
});

const formatAF = (n) =>
  Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });