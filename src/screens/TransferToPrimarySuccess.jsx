// src/screens/TransferToPrimarySuccess.jsx
import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import ServiceHeader from "../components/ServiceHeader";

export default function TransferToPrimarySuccess({ navigation, route }) {
  const amount = route.params?.amount ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader
        title="Transfer To Primary Wallet"
        onBack={() => navigation.popToTop()}
      />
      <View style={styles.container}>
        <View style={styles.checkWrap}>
          <Ionicons name="checkmark" size={42} color="#4CAF50" />
        </View>
        <Text style={styles.title}>Success!</Text>
        <Text style={styles.sub}>
          Your amount {amount} AF has successfully{"\n"}transferred to primary
          wallet
        </Text>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.popToTop()}
        >
          <Text style={styles.btnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    paddingTop: 24,
  },
  checkWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(76,175,80,0.1)",
    borderWidth: 2,
    borderColor: "rgba(76,175,80,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: 8,
  },
  sub: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
  },
  btn: {
    marginTop: 22,
    width: "100%",
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
