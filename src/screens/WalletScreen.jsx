// src/screens/WalletScreen.jsx
import React, { useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import DotIndicators from "../components/DotIndicators";
import ServiceHeader from "../components/ServiceHeader";

const { width } = Dimensions.get("window");

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
  const flatRef = useRef(null);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems?.length) setIndex(viewableItems[0].index);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 60 });

  const isCommission = useMemo(
    () => WALLETS[index]?.key === "commission",
    [index]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#D70000", "#E52421", "#F0533F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.greeting}>Hi,</Text>
        <Text style={styles.userName}>Ajmal Badakhsh</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Notifications")}
            style={styles.iconBtn}
          >
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={[styles.iconBtn, { marginLeft: 16 }]}>
            <Ionicons name="time-outline" size={22} color="#fff" />
          </View>
        </View>
      </LinearGradient>

      {/* Wallet pager */}
      <View style={{ marginTop: 10 }}>
        <FlatList
          ref={flatRef}
          data={WALLETS}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(it) => it.key}
          contentContainerStyle={{ paddingHorizontal: 24 }}
          snapToAlignment="center"
          decelerationRate="fast"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewConfig.current}
          renderItem={({ item }) => (
            <LinearGradient
              colors={["#D70000", "#E52421", "#F0533F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.walletCard, { width: width - 48 }]}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Text style={styles.walletLabel}>Wallet Balance</Text>

                {/* “Transfer To Primary” pill only on commission */}
                {item.key === "commission" && (
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("TransferToPrimary", {
                        balance: item.balance,
                      })
                    }
                    style={styles.transferPill}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.transferPillText}>
                      Transfer To Primary
                    </Text>
                    <Ionicons
                      name="swap-horizontal"
                      size={16}
                      color="#fff"
                      style={{ marginLeft: 6 }}
                    />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.balanceText}>
                {formatAF(item.balance)} AF
              </Text>
              <Text style={styles.walletName}>{item.label}</Text>
            </LinearGradient>
          )}
        />
        <View style={{ alignItems: "center", marginTop: 8 }}>
          <DotIndicators total={WALLETS.length} activeIndex={index} />
        </View>
      </View>

      {/* Recent transactions */}
      <View style={styles.recentContainer}>
        <Text style={styles.recentTitle}>Recent Transactions</Text>
        {TX.map((t) => (
          <View key={t.id} style={styles.txRow}>
            <View style={styles.txLeft}>
              <View style={styles.txIconWrap}>
                <Ionicons
                  name="sync-outline"
                  size={18}
                  color={Colors.primary}
                />
              </View>
              <View>
                <Text style={styles.txTitle}>{t.title}</Text>
                <Text style={styles.txSub}>
                  {t.date} • {t.wallet}
                </Text>
              </View>
            </View>
            <Text
              style={[
                styles.txAmount,
                { color: t.amount >= 0 ? "#0BA360" : Colors.primary },
              ]}
            >
              {t.amount >= 0 ? "+" : ""}
              {formatAF(Math.abs(t.amount))} AF
            </Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const formatAF = (n) =>
  Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });

const styles = StyleSheet.create({
  header: {
    height: 170,
    paddingHorizontal: 24,
    paddingTop: 24,
    justifyContent: "flex-start",
  },
  greeting: { color: "#fff", fontSize: 16, marginTop: 12 },
  userName: { color: "#fff", fontSize: 24, fontWeight: "700", marginTop: 4 },
  headerIcons: {
    position: "absolute",
    right: 24,
    top: 54,
    flexDirection: "row",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },

  walletCard: {
    height: 170,
    borderRadius: 20,
    padding: 18,
    marginRight: 16,
  },
  walletLabel: { color: "#fff", opacity: 0.9, fontSize: 13 },
  balanceText: { color: "#fff", fontSize: 36, fontWeight: "700", marginTop: 6 },
  walletName: {
    color: "#fff",
    fontSize: 15,
    marginTop: 18,
    opacity: 0.95,
    fontWeight: "600",
  },

  transferPill: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.24)",
    flexDirection: "row",
    alignItems: "center",
  },
  transferPillText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  recentContainer: {
    marginTop: 16,
    marginHorizontal: 24,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#F2F2F2",
  },
  recentTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F3F3",
  },
  txLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  txIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  txTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: "500" },
  txSub: { color: "#9E9E9E", fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: "700" },
});
