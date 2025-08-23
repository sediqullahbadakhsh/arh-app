// src/screens/GameCoinsScreen.jsx
import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Colors } from "../theme/colors";
import { Ionicons } from "@expo/vector-icons";

export default function GameCoinsScreen({ navigation }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <View style={styles.center}>
        <View style={styles.badge}>
          <Ionicons
            name="game-controller-outline"
            size={28}
            color={Colors.primary}
          />
        </View>
        <Text style={styles.title}>Game Coins</Text>
        <Text style={styles.sub}>This feature is coming soon.</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.btn}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  sub: { color: Colors.textSecondary, marginBottom: 16 },
  btn: {
    paddingHorizontal: 18,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: "#fff", fontWeight: "600" },
});
