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

export default function HomeMerchantScreen({ navigation }) {
  const userName = "Test Merchant"; // dummy

  // keep it to the 4 tiles we want for B2B
  const services = useMemo(
    () => [
      {
        key: "StockTransfer",
        label: "Stock Transfer",
        icon: "swap-horizontal",
      },
      {
        key: "MobileTopup",
        label: "Mobile Top-up",
        icon: "phone-portrait-outline",
      },
      { key: "DataBundle", label: "Data Bundle", icon: "wifi-outline" },
      {
        key: "GameCoins",
        label: "Game Coins",
        icon: "game-controller-outline",
      },
    ],
    []
  );

  // simple fake recents
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
      icon: "wifi-outline",
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

  const goToService = (s) => {
    switch (s.key) {
      case "StockTransfer":
        navigation.navigate("StockTransfer");
        break;
      case "MobileTopup":
        navigation.navigate("Topup"); // role-aware TopupFlowScreen (B2B skips pay)
        break;
      case "DataBundle":
        navigation.navigate("Data"); // role-aware DataFlowScreen (B2B skips pay)
        break;
      case "GameCoins":
        navigation.navigate("GameCoins"); // your existing screen
        break;
      default:
        break;
    }
  };

  const goToNotifications = () => navigation.navigate("Notifications");

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
        {/* Services */}
        <View style={styles.servicesHeader}>
          <Text style={styles.servicesTitle}>Services</Text>
        </View>
        <View style={styles.servicesGrid}>
          {services.map((s) => (
            <ServiceButton
              key={s.key}
              label={s.label}
              icon={s.icon}
              onPress={() => goToService(s)}
            />
          ))}
        </View>

        {/* Recent Transactions */}
        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Transactions</Text>
          </View>

          {recentTx.map((tx) => (
            <View key={tx.id} style={styles.txRow}>
              <View style={styles.txLeft}>
                <View style={styles.txIconWrap}>
                  <Ionicons name={tx.icon} size={20} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.txTitle}>{tx.type}</Text>
                  <Text style={styles.txSub}>{tx.date}</Text>
                </View>
              </View>
              <View style={styles.txRight}>
                <Text style={styles.txAmount}>{tx.amount}</Text>
                <Text style={styles.txPhone}>{tx.phone}</Text>
              </View>
            </View>
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

  servicesHeader: { paddingHorizontal: 24, marginBottom: 12, marginTop: 10 },
  servicesTitle: { fontSize: 16, fontWeight: "600", color: Colors.textPrimary },

  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    justifyContent: "space-between",
    marginBottom: 24,
  },

  // Recent
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
