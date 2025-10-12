import React from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import PrimaryButton from "../../components/PrimaryButton";


export default function SuccessScreen({ success, onDone, onTopupMore }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.successCircle}>
        <Ionicons name="checkmark" size={56} color="#4CAF50" />
      </View>
      <Text style={styles.successTitle}>Topup Successful!</Text>

      <View style={styles.kv}>
        <Text style={styles.k}>Receiver Number</Text>
        <Text style={styles.v}>{success.mobile}</Text>
      </View>
      <View style={styles.kv}>
        <Text style={styles.k}>Transaction ID</Text>
        <Text style={styles.v}>{success.txId}</Text>
      </View>
      <View style={styles.kv}>
        <Text style={styles.k}>Date</Text>
        <Text style={styles.v}>
          {new Date(success.date).toLocaleString()}
        </Text>
      </View>

      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>{success.amountUsd} AFN</Text>
      </View>

      <PrimaryButton
        label="Done"
        onPress={onDone}
        style={{ width: "100%" }}
      />
      <TouchableOpacity onPress={onTopupMore}>
        <Text style={styles.topupMoreText}>
          Topup More
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: "center",
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(76,175,80,0.1)",
    borderWidth: 2,
    borderColor: "rgba(76,175,80,0.35)",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  kv: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  k: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  v: {
    color: Colors.textPrimary,
    fontSize: 13,
  },
  totalBox: {
    width: "100%",
    backgroundColor: "#F5F5F7",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginVertical: 18,
  },
  totalLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  totalValue: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  topupMoreText: {
    color: Colors.primary,
    marginTop: 14,
    fontWeight: "600",
  },
});