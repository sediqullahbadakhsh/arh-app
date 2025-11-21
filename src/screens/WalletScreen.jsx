import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StatusBar,
  ScrollView,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import DotIndicators from "../components/DotIndicators";
import ServiceHeader from "../components/ServiceHeader";
import { getStockInOut, getUserWallets } from "../services/merchantApi";
import { useUser } from "../context/userContext";
import { formatDateTime } from "../utils/formatDate";
import ReceiptModal1 from "../components/ReceiptModal";
import { scale } from "../utils/normalizeSize";


const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 48;
const CARD_MARGIN = 16;

const SkeletonLoader = ({ style }) => (
  <View style={[styles.skeleton, style]}>
    <View style={styles.skeletonShimmer} />
  </View>
);

export default function WalletScreen({ navigation }) {
  const [index, setIndex] = useState(0);
  const { user, setUser } = useUser();
  const flatRef = useRef(null);
  const [wallets, setWallets] = useState([]);
  const [tx, setTx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(true);
  const scrollX = useRef(new Animated.Value(0)).current;
  
  // Receipt modal state
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems?.length) setIndex(viewableItems[0].index);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 60 });

  const isCommission = useMemo(
    () => wallets[index]?.key === "commission",
    [index, wallets]
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setTxLoading(true);
      
      try {
        const [walletsRes, stockRes] = await Promise.all([
          getUserWallets(user?.id),
          getStockInOut()
        ]);

   
        const commissionWallet = {
          ...walletsRes?.comissionWallet,
          key: "commission",
          label: "Commission Wallet",
        };
        const primaryWallet = {
          ...walletsRes?.primaryWallet,
          key: "primary",
          label: "Primary Wallet",
        };
        const data = [primaryWallet, commissionWallet];
        setWallets(data);


        setTx(stockRes?.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
        setTxLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const goBack = () => {
    navigation.goBack();
  };

 
  const handleTransactionPress = (transaction) => {
    setSelectedTransaction(transaction);
    setReceiptModalVisible(true);
  };


  const renderSkeletonCard = ({ item, index }) => {
    const inputRange = [
      (index - 1) * (CARD_WIDTH + CARD_MARGIN),
      index * (CARD_WIDTH + CARD_MARGIN),
      (index + 1) * (CARD_WIDTH + CARD_MARGIN),
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: "clamp",
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.7, 1, 0.7],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={[
          styles.walletCardContainer,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <View style={styles.skeletonCard}>
          <View style={styles.cardPattern}>
            <View style={styles.patternCircle1} />
            <View style={styles.patternCircle2} />
          </View>

          <View style={styles.cardHeader}>
            <View style={styles.balanceSection}>
              <SkeletonLoader style={styles.skeletonLabel} />
              <SkeletonLoader style={styles.skeletonBalance} />
              <SkeletonLoader style={styles.skeletonWalletName} />
            </View>

            <View style={styles.walletIcon}>
              <SkeletonLoader style={styles.skeletonIcon} />
            </View>
          </View>

          <SkeletonLoader style={styles.skeletonButton} />
        </View>
      </Animated.View>
    );
  };

  const renderWalletCard = ({ item, index }) => {
    const inputRange = [
      (index - 1) * (CARD_WIDTH + CARD_MARGIN),
      index * (CARD_WIDTH + CARD_MARGIN),
      (index + 1) * (CARD_WIDTH + CARD_MARGIN),
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: "clamp",
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.7, 1, 0.7],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={[
          styles.walletCardContainer,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <LinearGradient
          colors={["#D70000", "#E52421", "#F0533F"]}
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
              <Text style={styles.walletLabel}>Wallet Balance</Text>
              <Text style={styles.balanceText}>
                {formatAF(item.balance)} AF
              </Text>
              <Text style={styles.walletName}>{item.label}</Text>
            </View>

            <View style={styles.walletIcon}>
              <Ionicons name="wallet" size={32} color="#fff" />
            </View>
          </View>

    
          {item.key === "commission" && (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("TransferToPrimary", {
                  balance: item.balance,
                })
              }
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
                  Transfer To Primary
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

  // Skeleton for Transaction Item
  const renderSkeletonTransaction = ({ item, index }) => (
    <View style={styles.txRow}>
      <View style={styles.txLeft}>
        <SkeletonLoader style={styles.skeletonTxIcon} />
        <View style={styles.txInfo}>
          <SkeletonLoader style={styles.skeletonTxTitle} />
          <SkeletonLoader style={styles.skeletonTxSub} />
        </View>
      </View>
      <SkeletonLoader style={styles.skeletonTxAmount} />
    </View>
  );

  const renderTransactionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.txRow}
      onPress={() => handleTransactionPress(item)}
      activeOpacity={0.85}
    >
      <View style={styles.txLeft}>
        <View
          style={[
            styles.txIconWrap,
            item.type === "IN" ? styles.txInIcon : styles.txOutIcon,
          ]}
        >
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
            {formatDateTime(item.createdAt)} • {item.type === "IN" ? 
              `From ${item.from_wallet_id}` : 
              `To ${item.to_wallet_id || "Activate Bundle"}`}
          </Text>
        </View>
      </View>
      <Text
        style={[
          styles.txAmount,
          { color: item.type === "IN" ? "#0BA360" : Colors.primary },
        ]}
      >
        {item.type === "OUT" ? "-" : "+"}
        {formatAF(Math.abs(item.amount))} AF
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <ServiceHeader title="Wallet" onBack={goBack} />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.carouselContainer}>
          <Animated.FlatList
            ref={flatRef}
            data={loading ? [...Array(2)] : wallets}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => item?.key || `skeleton-${index}`}
            contentContainerStyle={styles.carouselContent}
            snapToInterval={CARD_WIDTH + CARD_MARGIN}
            decelerationRate="fast"
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewConfig.current}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
            renderItem={loading ? renderSkeletonCard : renderWalletCard}
          />
  
          {!loading && (
            <View style={styles.indicatorsContainer}>
              <DotIndicators total={wallets.length} activeIndex={index} />
            </View>
          )}
        </View>

        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Transactions</Text>
          </View>
          
          <FlatList
            data={txLoading ? [...Array(5)] : tx}
            keyExtractor={(item, index) => item?.id || `skeleton-tx-${index}`}
            renderItem={txLoading ? renderSkeletonTransaction : renderTransactionItem}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />

          {!txLoading && tx.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#CCCCCC" />
              <Text style={styles.emptyStateText}>No transactions yet</Text>
              <Text style={styles.emptyStateSubText}>
                Your transactions will appear here
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

  
      <ReceiptModal1
        visible={receiptModalVisible}
        onClose={() => setReceiptModalVisible(false)}
        transaction={selectedTransaction}
        transactionType="stock" 
      />
    </SafeAreaView>
  );
}

const formatAF = (n) =>
  Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: scale.hp(3.1),
  },
  carouselContainer: {
    marginTop: scale.hp(2.6),
    marginBottom: scale.hp(2.1),
  },
  carouselContent: {
    paddingHorizontal: scale.wp(6.2),
    paddingBottom: scale.hp(1.05),
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
  walletCard: {
    height: scale.hp(26),
    borderRadius: scale.hp(3.1),
    padding: scale.hp(2.6),
    overflow: "hidden",
  },
  skeletonCard: {
    height: scale.hp(26),
    borderRadius: scale.hp(3.1),
    padding: scale.hp(2.6),
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
    position: "relative",
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
  walletName: {
    color: "#fff",
    fontSize: scale.hp(2.1),
    opacity: 0.95,
    fontWeight: "600",
  },
  walletIcon: {
    width: scale.wp(12.4),
    height: scale.wp(12.4),
    borderRadius: scale.wp(6.2),
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: scale.wp(3.1),
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
  indicatorsContainer: {
    alignItems: "center",
    marginTop: scale.hp(2.1),
  },
  recentContainer: {
    backgroundColor: "#fff",
    borderRadius: scale.hp(2.6),
    marginBottom: scale.hp(13),
    paddingHorizontal: scale.wp(5.2),
    paddingVertical: scale.hp(2.6),
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: "#F3F3F3",
    minHeight: scale.hp(26),
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
    fontWeight: "700",
  },
  seeAllText: {
    color: Colors.primary,
    fontSize: scale.hp(1.8),
    fontWeight: "600",
  },
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scale.hp(1.55),
    borderBottomWidth: 1,
    borderBottomColor: "#F8F8F8",
  },
  txLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  txIconWrap: {
    width: scale.wp(10.4),
    height: scale.wp(10.4),
    borderRadius: scale.wp(5.2),
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale.wp(3.1),
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
    fontSize: scale.hp(2),
    fontWeight: "600",
    marginBottom: scale.hp(0.26),
  },
  txSub: {
    color: "#9E9E9E",
    fontSize: scale.hp(1.55),
  },
  txAmount: {
    fontSize: scale.hp(2),
    fontWeight: "700",
    marginLeft: scale.wp(2.1),
  },
  skeleton: {
    backgroundColor: "#E0E0E0",
    borderRadius: scale.hp(0.5),
    overflow: "hidden",
    position: "relative",
  },
  skeletonShimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#F5F5F5",
  },
  skeletonLabel: {
    width: scale.wp(31.2),
    height: scale.hp(1.8),
    marginBottom: scale.hp(1.05),
    borderRadius: scale.hp(0.9),
  },
  skeletonBalance: {
    width: scale.wp(41.6),
    height: scale.hp(4.2),
    marginBottom: scale.hp(1.55),
    borderRadius: scale.hp(1.05),
  },
  skeletonWalletName: {
    width: scale.wp(36.4),
    height: scale.hp(2.1),
    borderRadius: scale.hp(1.05),
  },
  skeletonIcon: {
    width: scale.wp(8.3),
    height: scale.wp(8.3),
    borderRadius: scale.wp(4.2),
  },
  skeletonButton: {
    height: scale.hp(5.7),
    borderRadius: scale.hp(1.55),
    marginTop: scale.hp(2.1),
  },
  skeletonTxIcon: {
    width: scale.wp(10.4),
    height: scale.wp(10.4),
    borderRadius: scale.wp(5.2),
    marginRight: scale.wp(3.1),
  },
  skeletonTxTitle: {
    width: scale.wp(46.8),
    height: scale.hp(2),
    marginBottom: scale.hp(0.8),
    borderRadius: scale.hp(0.5),
  },
  skeletonTxSub: {
    width: scale.wp(36.4),
    height: scale.hp(1.55),
    borderRadius: scale.hp(0.5),
  },
  skeletonTxAmount: {
    width: scale.wp(20.8),
    height: scale.hp(2),
    borderRadius: scale.hp(0.5),
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale.hp(5.2),
  },
  emptyStateText: {
    color: "#666",
    fontSize: scale.hp(2.1),
    fontWeight: "600",
    marginTop: scale.hp(1.55),
    marginBottom: scale.hp(0.5),
  },
  emptyStateSubText: {
    color: "#999",
    fontSize: scale.hp(1.8),
    textAlign: "center",
  },
});

