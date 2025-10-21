// src/screens/WalletScreen.jsx
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

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 48;
const CARD_MARGIN = 16;

// Skeleton Loader Component
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

        // Process wallets data
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

        // Process transactions data
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

  // Skeleton for Wallet Card
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
    <View style={styles.txRow}>
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
          <Text style={styles.txTitle}>From {item.from_wallet_id}</Text>
          <Text style={styles.txSub}>
            {formatDateTime(item.createdAt)} • {item.to_wallet_id || "Activate Bundle"}
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
    </View>
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
            {!txLoading && (
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            )}
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
    paddingBottom: 24,
  },
  carouselContainer: {
    marginTop: 20,
    marginBottom: 16,
  },
  carouselContent: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  walletCardContainer: {
    width: CARD_WIDTH,
    marginRight: CARD_MARGIN,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  walletCard: {
    height: 200,
    borderRadius: 24,
    padding: 20,
    overflow: "hidden",
  },
  skeletonCard: {
    height: 200,
    borderRadius: 24,
    padding: 20,
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
    top: -20,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  patternCircle2: {
    position: "absolute",
    bottom: -30,
    right: 40,
    width: 80,
    height: 80,
    borderRadius: 40,
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
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  balanceText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  walletName: {
    color: "#fff",
    fontSize: 16,
    opacity: 0.95,
    fontWeight: "600",
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  transferButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  transferGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  transferButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  indicatorsContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  recentContainer: {
    marginHorizontal: 24,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: "#F2F2F2",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 200,
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
    fontWeight: "700",
  },
  seeAllText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F8F8",
  },
  txLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  txIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
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
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  txSub: {
    color: "#9E9E9E",
    fontSize: 12,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 8,
  },
  // Skeleton Styles
  skeleton: {
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
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
    width: 120,
    height: 14,
    marginBottom: 8,
    borderRadius: 7,
  },
  skeletonBalance: {
    width: 160,
    height: 32,
    marginBottom: 12,
    borderRadius: 8,
  },
  skeletonWalletName: {
    width: 140,
    height: 16,
    borderRadius: 8,
  },
  skeletonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  skeletonButton: {
    height: 44,
    borderRadius: 12,
    marginTop: 16,
  },
  skeletonTxIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  skeletonTxTitle: {
    width: 180,
    height: 15,
    marginBottom: 6,
    borderRadius: 4,
  },
  skeletonTxSub: {
    width: 140,
    height: 12,
    borderRadius: 4,
  },
  skeletonTxAmount: {
    width: 80,
    height: 15,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubText: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
  },
});