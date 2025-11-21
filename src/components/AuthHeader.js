import React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Fonts } from "../utils/fonts";
import { scale } from "../utils/normalizeSize";

export default function AuthHeader({ title, onBack }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{position:"relative"}}>
    <LinearGradient
      colors={["#9F0901", "#E20E02"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 2 }}
      style={[styles.gradient, { paddingTop: insets.top + 16 }]}
    >
      <TouchableOpacity
        style={styles.backBtn}
        onPress={onBack}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.title}>{title}</Text>
    </LinearGradient>
          <View style={{position: "absolute",  top:15, right: -186, backgroundColor: "#FFFFFF0A", height: 80, width: "100%",transform: [{ rotate: "130deg" }], // Rotate 45 degrees
    justifyContent: "center",
    alignItems: "center",}}></View>
    
          <View style={{position: "absolute",  top:15, right: -300, backgroundColor: "#FFFFFF14", height: 120, width: "100%",transform: [{ rotate: "130deg" }], // Rotate 45 degrees
    justifyContent: "center",
    alignItems: "center",}}></View>

    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    width: "100%",
    height: scale.hp(28.6),
    paddingHorizontal: scale.wp(6.2),
  },
  backBtn: {
    width: scale.wp(8.3),
    height: scale.wp(8.3),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scale.hp(2.1),
  },
  title: {
    fontSize: scale.hp(4.2),
    fontFamily: "dmsansBold",
    color: "#fff",
  },
});
