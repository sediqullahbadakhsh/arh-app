// src/screens/SignUpCustomerScreen.jsx
import React, { useMemo, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import AuthHeader from "../components/AuthHeader";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import { useAuth } from "../auth/AuthProvider";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUpCustomerScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const auth = useAuth();

  const valid = useMemo(() => EMAIL_RE.test(email.trim()), [email]);

  const onContinue = async () => {
    const identifier = email.trim();
    if (!valid) {
      Alert.alert("Sign up", "Please enter a valid email address.");
      return;
    }
    try {
      setBusy(true);
      await auth.signupCustomerSendOtp({
        identifier,
      });
      navigation.navigate("OtpVerification", {
        channel: "email",
        target: identifier,
        mode: "signup_customer",
      });
    } catch (e) {
      Alert.alert("Sign up", e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <AuthHeader title="Register" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Create your account</Text>

        {/* Email only (no tabs, no phone) */}
        <InputField
          value={email}
          onChangeText={setEmail}
          placeholder="Enter Your Email Address"
          keyboardType="email-address"
          rightIcon={<Ionicons name="mail-outline" size={18} color="#A9A9A9" />}
          returnKeyType="go"
          onSubmitEditing={onContinue}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {!valid && email.length > 0 && (
          <Text style={styles.helperWarn}>
            Enter a valid email like name@example.com
          </Text>
        )}

        <PrimaryButton
          label={busy ? "Sending code..." : "Continue"}
          onPress={onContinue}
          style={{ marginTop: 20 }}
          disabled={busy || !valid}
        />

        <Text style={styles.helperText}>
          We’ll send a one-time code (OTP) to your email to verify your account.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
    backgroundColor: Colors.white,
  },
  sectionTitle: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 10,
    fontWeight: "600",
  },
  helperText: {
    marginTop: 10,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  helperWarn: {
    marginTop: 6,
    fontSize: 12,
    color: "#D14343",
  },
});
