// src/screens/TopupTabScreen.jsx
import React from "react";
import { SafeAreaView, View, Text, StyleSheet } from "react-native";
import { Colors } from "../theme/colors";
import { scale } from "../utils/normalizeSize";
export default function TopupTabScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <View style={styles.center}>
        <Text style={styles.title}>Top-up</Text>
        <Text style={styles.sub}>Landing placeholder</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: scale.hp(2.6),
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  sub: {
    marginTop: scale.hp(0.8),
    color: Colors.textSecondary,
  },
});
