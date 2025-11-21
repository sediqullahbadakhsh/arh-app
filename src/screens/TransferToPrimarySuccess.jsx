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
import { scale } from "../utils/normalizeSize";

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
    paddingHorizontal: scale.wp(6.2),
    alignItems: "center",
    paddingTop: scale.hp(3.1),
  },
  checkWrap: {
    width: scale.wp(23),
    height: scale.wp(23),
    borderRadius: scale.wp(11.5),
    backgroundColor: "rgba(76,175,80,0.1)",
    borderWidth: scale.hp(0.26),
    borderColor: "rgba(76,175,80,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: scale.hp(1.8),
  },
  title: {
    fontSize: scale.hp(2.35),
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: scale.hp(1.05),
  },
  sub: {
    color: Colors.textSecondary,
    fontSize: scale.hp(1.7),
    textAlign: "center",
    marginTop: scale.hp(1.3),
    lineHeight: scale.hp(2.6),
  },
  btn: {
    marginTop: scale.hp(2.9),
    width: "100%",
    height: scale.hp(6.8),
    borderRadius: scale.hp(3.4),
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: scale.hp(2.1),
    fontWeight: "600",
  },
});
