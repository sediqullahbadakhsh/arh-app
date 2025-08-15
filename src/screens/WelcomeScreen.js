import React from "react";
import { View, Text, StyleSheet, Image, SafeAreaView } from "react-native";
import { Colors } from "../theme/colors";
import PrimaryButton from "../components/PrimaryButton";
import OutlineButton from "../components/OutlineButton";

const phoneIllustration = require("../../assets/images/phone-illustration.png");

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* illustration */}
        <View style={styles.illustrationWrapper}>
          <View style={styles.circleBackground}>
            <Image
              source={phoneIllustration}
              style={styles.phoneImage}
              resizeMode="contain"
            />
            {/* decorative dots */}
            <View
              style={[
                styles.dot,
                { backgroundColor: "#2DC5B4", top: 18, left: 100 },
              ]}
            />
            <View
              style={[
                styles.dot,
                { backgroundColor: "#FF3C5F", top: 40, right: 38 },
              ]}
            />
            <View
              style={[
                styles.dot,
                { backgroundColor: "#FBBF24", bottom: 18, left: 72 },
              ]}
            />
            <View
              style={[
                styles.dot,
                { backgroundColor: "#2196F3", bottom: 16, right: 64 },
              ]}
            />
            <View
              style={[
                styles.dot,
                { backgroundColor: "#6FE3C4", left: -18, top: 60 },
              ]}
            />
          </View>
        </View>

        {/* title & subtitle */}
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>
          Quickly top up your mobile or credit card balance anytime, anywhere.
          Sign in to continue or register to start recharging.
        </Text>

        {/* buttons */}
        <View style={styles.buttons}>
          <PrimaryButton
            label="Login"
            onPress={() => navigation.navigate("Login")}
            style={{ marginBottom: 16 }}
          />
          <OutlineButton
            label="Sign Up"
            onPress={() => navigation.navigate("SignUp")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  illustrationWrapper: { marginBottom: 32 },
  circleBackground: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#F2F2F2",
    justifyContent: "center",
    alignItems: "center",
  },
  phoneImage: { width: 70, height: 120 },
  dot: { position: "absolute", width: 14, height: 14, borderRadius: 7 },

  title: {
    fontSize: 28,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 40,
  },
  buttons: { width: "100%" },
});
