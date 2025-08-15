// src/screens/ReportScreen.jsx
import React from "react";
import { SafeAreaView, View, Text, StyleSheet } from "react-native";
import { Colors } from "../theme/colors";
export default function ReportScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <View style={styles.center}>
        <Text style={styles.title}>Report</Text>
        <Text style={styles.sub}>B2B reports placeholder</Text>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "700", color: Colors.textPrimary },
  sub: { marginTop: 6, color: Colors.textSecondary },
});
