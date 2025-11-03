import React from "react";
import { View, StyleSheet, TouchableOpacity, Text, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Fonts } from "../utils/fonts";

export default function AuthHeaderSignIn({ title, onBack, onLanguagePress, selectedLang }) {
  const insets = useSafeAreaInsets();
  
  const renderLanguageFlag = () => {
    if (!selectedLang?.flag) {
      return (
        <View style={styles.flagPlaceholder}>
          <Ionicons name="language" size={16} color="#fff" />
        </View>
      );
    }
    return (
      <Image
        source={{ uri: selectedLang.flag }}
        style={styles.languageFlag}
        resizeMode="contain"
      />
    );
  };

  return (
    <View style={{position:"relative"}}>
      <LinearGradient
        colors={["#9F0901", "#E20E02"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 2 }}
        style={[styles.gradient, { paddingTop: insets.top + 16 }]}
      >
        {/* Header Row with Title on left and Language Button on right */}
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.languageButton}
            onPress={onLanguagePress}
            activeOpacity={0.7}
          >
            {renderLanguageFlag()}
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      <View style={{
        position: "absolute", 
        top: 15, 
        right: -50, 
        backgroundColor: "#FFFFFF0A", 
        height: 80, 
        width: "100%",
        transform: [{ rotate: "130deg" }],
        justifyContent: "center",
        alignItems: "center",
      }}></View>
      
      <View style={{
        position: "absolute", 
        top: 15, 
        right: -300, 
        backgroundColor: "#FFFFFF14", 
        height: 120, 
        width: "100%",
        transform: [{ rotate: "130deg" }],
        justifyContent: "center",
        alignItems: "center",
      }}></View>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    width: "100%",
    height: 220,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontFamily: "dmsansBold",
    color: "#fff",
  },
  languageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  languageFlag: {
    width: 24,
    height: 18,
    borderRadius: 3,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
});