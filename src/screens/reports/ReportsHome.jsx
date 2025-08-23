import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";
import { REPORT_TYPES, REPORT_META } from "../../constants/reports";

const ORDER = [
  "TOPUP",
  "DATA",
  "STOCK_TRANSFER",
  "STOCK_REVERSE",
  "ROLLBACK",
  "DOWNLINE",
];

export default function ReportsHome({ navigation }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader title="Reports" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <Text style={styles.label}>Select a report</Text>

        <View style={styles.grid}>
          {ORDER.map((k) => {
            const type = REPORT_TYPES[k];
            const meta = REPORT_META[type];
            return (
              <TouchableOpacity
                key={k}
                style={styles.tile}
                activeOpacity={0.9}
                onPress={() => navigation.navigate("ReportList", { type })}
              >
                <Ionicons name={meta.icon} size={22} color={Colors.primary} />
                <Text style={styles.tileText}>{meta.title}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  label: {
    fontSize: 13,
    color: Colors.textPrimary,
    marginBottom: 12,
    marginTop: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  tile: {
    width: "48%",
    height: 88,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EEE",
    backgroundColor: "#fff",
    marginBottom: 12,
    padding: 12,
    justifyContent: "space-between",
  },
  tileText: { color: Colors.textPrimary, fontWeight: "600", fontSize: 13 },
});
