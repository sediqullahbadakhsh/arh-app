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

const WALLETS = [
  { key: "primary", label: "Primary Wallet", balance: 2400 },
  { key: "commission", label: "Commission Wallet", balance: 240 },
];

const TX = [
  {
    id: "1",
    title: " to primary wallet",
    amount: +100000,
    wallet: "Primary Wallet",
    date: "Nov 17",
  },
  {
    id: "2",
    title: "commission wallet",
    amount: +4000,
    wallet: "Commission Wallet",
    date: "Nov 17",
  },
  {
    id: "3",
    title: "Transfer amount to agent [id]",
    amount: -105000,
    wallet: "Primary Wallet",
    date: "Nov 17",
  },
  {
    id: "4",
    title: "Transfer amount to agent [id]",
    amount: -105000,
    wallet: "Primary Wallet",
    date: "Nov 17",
  },
];

export default function WalletScreen({ navigation }) {
  const [index, setIndex] = useState(0);
  const { user, setUser } = useUser();
  const flatRef = useRef(null);
  const [wallets, setWallets] = useState([]);
  const [tx, setTx] = useState([]);
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
    console.log("💖💖💖💖 before: ");
    const getStock = async () => {
      const stockRes = await getStockInOut();
      console.log("💖💖💖💖: ", stockRes);
    };

    getStock();
  }, []);

  useEffect(() => {
    const getWalletsInfo = async () => {
      const res = await getUserWallets(user?.id);
      const commissionWallet = {
        ...res?.comissionWallet,
        key: "commission",
        label: "Commission Wallet",
      };
      const primaryWallet = {
        ...res?.primaryWallet,
        key: "primary",
        label: "Primary Wallet",
      };
      const data = [primaryWallet, commissionWallet];

      setWallets(data);
    };

    getWalletsInfo();
  }, []);

  useEffect(() => {
    console.log("💖💖💖💖 before: ");
    const getStock = async () => {
      const stockRes = await getStockInOut();
      setTx(stockRes?.data);
      console.log("💖💖💖💖: ", "later");
    };

    getStock();
  }, []);

  const goBack = () => {
    navigation.goBack();
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
          {/* Background Pattern */}
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

          {/* "Transfer To Primary" button only for commission wallet */}
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
        {/* Wallet Cards Carousel */}
        <View style={styles.carouselContainer}>
          <Animated.FlatList
            ref={flatRef}
            data={wallets}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.key}
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
            renderItem={renderWalletCard}
          />
          
          {/* Dot Indicators */}
          <View style={styles.indicatorsContainer}>
            <DotIndicators total={wallets.length} activeIndex={index} />
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={tx}
            keyExtractor={(item) => item.id}
            renderItem={renderTransactionItem}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
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
});