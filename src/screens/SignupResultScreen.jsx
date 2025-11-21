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
import { scale } from "../utils/normalizeSize";

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
  const goBack = () => navigation.goBack(type === "Retailer" ? "AgentList": "ReportsHome");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <AuthHeader
        title={type === "customer" ? "Register" : type === "Retailer" ? "Donwline Agent Registration" : "Transfer To Primary Wallet"}
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
          onPress={goBack}
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
    paddingHorizontal: scale.wp(6.2),
    paddingTop: scale.hp(3.6),
  },
  circleOuter: {
    width: scale.wp(23),
    height: scale.wp(23),
    borderRadius: scale.wp(11.5),
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  circleInner: {
    width: scale.wp(14.5),
    height: scale.wp(14.5),
    borderRadius: scale.wp(7.25),
    backgroundColor: "#E8FFF1",
    alignItems: "center",
    justifyContent: "center",
  },
  h1: {
    marginTop: scale.hp(2.1),
    fontSize: scale.hp(2.35),
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  p: {
    marginTop: scale.hp(1.05),
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: scale.hp(2.35),
  },
  btn: {
    marginTop: scale.hp(2.6),
    height: scale.hp(6.5),
    paddingHorizontal: scale.wp(5.2),
    backgroundColor: Colors.primary,
    borderRadius: scale.hp(1.55),
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: scale.hp(2),
    fontWeight: "600",
  },
});