// src/screens/HomeConsumerScreen.jsx
import React, { useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import ServiceButton from "../components/ServiceButton";

export default function HomeConsumerScreen({ navigation }) {
  const userName = "Test User"; // mock

  const goToNotifications = () => navigation.navigate("Notifications");
  const goToAllTransactions = () => navigation.navigate("Transactions");

  const SERVICES_B2C = useMemo(
    () => [
      {
        key: "MobileTopup",
        label: "Mobile Top-up",
        icon: "phone-portrait-outline",
        onPress: () => navigation.navigate("Topup"),
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

  // Dummy recent transactions (same shape you already used)
  const recentTx = [
    {
      id: "t1",
      type: "Mobile Topup",
      amount: 200,
      date: "Nov 17",
      phone: "(+93)787710623",
      icon: "phone-portrait-outline",
    },
    {
      id: "t2",
      type: "Data Bundle (30GB)",
      amount: 1200,
      date: "Nov 17",
      phone: "(+93)787710623",
      icon: "pie-chart-outline",
    },
    {
      id: "t3",
      type: "Mobile Topup",
      amount: 200,
      date: "Nov 17",
      phone: "(+93)787710623",
      icon: "phone-portrait-outline",
    },
  ];

  const TransactionRow = ({ item }) => (
    <TouchableOpacity
      style={styles.txRow}
      onPress={() => navigation.navigate("Transactions", { id: item.id })}
      activeOpacity={0.85}
    >
      <View style={styles.txLeft}>
        <View style={styles.txIconWrap}>
          <Ionicons name={item.icon} size={20} color={Colors.primary} />
        </View>
        <View>
          <Text style={styles.txTitle}>{item.type}</Text>
          <Text style={styles.txSub}>{item.date}</Text>
        </View>
      </View>
      <View style={styles.txRight}>
        <Text style={styles.txAmount}>{item.amount}</Text>
        <Text style={styles.txPhone}>{item.phone}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={["#D70000", "#E52421", "#F0533F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.greeting}>Hi,</Text>
        <Text style={styles.userName}>{userName}</Text>

        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={goToNotifications} style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Services (only 3) */}
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

        {/* Recent Transactions */}
        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={goToAllTransactions}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {recentTx.map((tx) => (
            <TransactionRow key={tx.id} item={tx} />
          ))}
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
    marginLeft: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },

  servicesHeader: { paddingHorizontal: 24, marginBottom: 12, marginTop: 16 },
  servicesTitle: { fontSize: 16, fontWeight: "600", color: Colors.textPrimary },

  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    justifyContent: "flex-start",
    gap: 10,
    marginBottom: 24,
  },

  recentContainer: {
    marginHorizontal: 24,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#F2F2F2",
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  recentTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: "600" },
  seeAll: { color: Colors.primary, fontSize: 13, fontWeight: "500" },

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
  txRight: { alignItems: "flex-end" },
  txAmount: { color: Colors.textPrimary, fontSize: 14, fontWeight: "600" },
  txPhone: { color: "#9E9E9E", fontSize: 11, marginTop: 2 },
});
