// src/screens/HomeConsumerScreen.jsx
import React from "react";
import { SafeAreaView, View, Text, StyleSheet } from "react-native";
import { Colors } from "../theme/colors";

export default function HomeConsumerScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <View style={styles.center}>
        <Text style={styles.title}>B2C Home</Text>
        <Text style={styles.sub}>Consumer layout placeholder</Text>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "700", color: Colors.textPrimary },
  sub: { marginTop: 6, color: Colors.textSecondary },
});
