import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Colors } from "../theme/colors";
import AuthHeader from "../components/AuthHeader";
import { Ionicons } from "@expo/vector-icons";

export default function SignupResultScreen({ navigation, route }) {
  const { type = "customer", title, message, cta } = route.params || {};

  const heading = title || (type === "customer" ? "Success!" : "Success!");
  const body =
    message ||
    (type === "customer"
      ? "Your account has been created. Please sign in to continue."
      : "Your application document has been successfully submitted. We’ll notify you on your email.");

  const buttonLabel = cta || (type === "customer" ? "Go to Login" : "Go Back");

  const onPress = () => navigation.replace("Login");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <AuthHeader
        title={type === "customer" ? "Register" : "Transfer To Primary Wallet"}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.wrap}>
        <View style={styles.circleOuter}>
          <View style={styles.circleInner}>
            <Ionicons name="checkmark" size={30} color="#22C55E" />
          </View>
        </View>

        <Text style={styles.h1}>{heading}</Text>
        <Text style={styles.p}>{body}</Text>

        <TouchableOpacity
          style={styles.btn}
          activeOpacity={0.9}
          onPress={onPress}
        >
          <Text style={styles.btnText}>{buttonLabel}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  circleOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  circleInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E8FFF1",
    alignItems: "center",
    justifyContent: "center",
  },
  h1: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  p: {
    marginTop: 8,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  btn: {
    marginTop: 20,
    height: 50,
    paddingHorizontal: 20,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
