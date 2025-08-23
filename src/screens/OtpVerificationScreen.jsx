// src/screens/OtpVerificationScreen.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Colors } from "../theme/colors";
import AuthHeader from "../components/AuthHeader";
import PrimaryButton from "../components/PrimaryButton";
import { useAuth } from "../auth/AuthProvider";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 120;

export default function OtpVerificationScreen({ route, navigation }) {
  const {
    channel = "email",
    target = "",
    mode = "login",
  } = route?.params || {};
  const [codes, setCodes] = useState(Array(CODE_LENGTH).fill(""));
  const inputsRef = useRef([]);
  const [timeLeft, setTimeLeft] = useState(RESEND_SECONDS);
  const auth = useAuth();

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  const setFromString = (value, startIdx = 0) => {
    const arr = [...codes];
    const chars = value.replace(/\s+/g, "").split("");
    for (let i = 0; i < chars.length && startIdx + i < CODE_LENGTH; i++) {
      arr[startIdx + i] = chars[i];
    }
    setCodes(arr);
    const next = Math.min(startIdx + chars.length, CODE_LENGTH - 1);
    inputsRef.current[next]?.focus();
  };

  const handleChange = (text, idx) => {
    // If user pasted or autocomplete filled more than one char, spread them
    if (text.length > 1) {
      return setFromString(text, idx);
    }
    const arr = [...codes];
    arr[idx] = text;
    setCodes(arr);
    if (text && idx < CODE_LENGTH - 1) inputsRef.current[idx + 1]?.focus();
  };

  const handleKeyPress = (e, idx) => {
    if (e.nativeEvent.key === "Backspace" && !codes[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const verify = async () => {
    const code = codes.join("");
    if (code.length !== CODE_LENGTH) {
      Alert.alert("OTP", `Please enter the ${CODE_LENGTH}-digit code.`);
      return;
    }

    try {
      if (mode === "login") {
        await auth.loginOtpVerify({ identifier: target, otp: code });
        navigation.replace("Tabs");
      } else if (mode === "signup_customer") {
        await auth.signupCustomerVerifyOtp({ identifier: target, otp: code });
        Alert.alert("Success", "Your email is verified. You can now sign in.");
        navigation.replace("Login");
      } else {
        Alert.alert("Unsupported mode", String(mode));
      }
    } catch (e) {
      Alert.alert("OTP", e.message || "Verification failed");
    }
  };

  const resend = async () => {
    setTimeLeft(RESEND_SECONDS);
    // Safe optional calls if you add these later:
    try {
      if (mode === "login") {
        await auth?.loginOtpResend?.({ identifier: target });
      } else if (mode === "signup_customer") {
        await auth?.signupCustomerResendOtp?.({ identifier: target });
      }
    } catch (e) {
      // Not fatal for UI; timer restarted anyway
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <AuthHeader title="OTP Verification" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <Text style={styles.infoTxt}>
            {channel === "email"
              ? `We sent a ${CODE_LENGTH}-digit code to ${
                  target || "your email"
                }.`
              : `We sent a ${CODE_LENGTH}-digit code to ${
                  target || "your phone"
                }.`}
          </Text>

          <View style={styles.codeRow}>
            {codes.map((c, idx) => (
              <TextInput
                key={idx}
                ref={(r) => (inputsRef.current[idx] = r)}
                style={styles.codeBox}
                value={c}
                onChangeText={(t) =>
                  handleChange(t.replace(/[^0-9]/g, ""), idx)
                }
                maxLength={1}
                keyboardType="number-pad"
                onKeyPress={(e) => handleKeyPress(e, idx)}
                returnKeyType={idx === CODE_LENGTH - 1 ? "done" : "next"}
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                selectTextOnFocus
              />
            ))}
          </View>

          <View style={styles.resendRow}>
            <Text style={styles.resendText}>Send code reload in </Text>
            {timeLeft > 0 ? (
              <Text style={[styles.resendText, { color: Colors.primary }]}>
                {formatTime(timeLeft)}
              </Text>
            ) : (
              <TouchableOpacity onPress={resend}>
                <Text style={[styles.resendText, { color: Colors.primary }]}>
                  Resend
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <PrimaryButton
            label="Verify"
            onPress={verify}
            style={{ marginTop: 28 }}
            disabled={codes.join("").length !== CODE_LENGTH}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  infoTxt: { fontSize: 13, color: Colors.textSecondary, marginBottom: 24 },

  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  codeBox: {
    width: 48,
    height: 56,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    textAlign: "center",
    fontSize: 18,
    color: Colors.textPrimary,
    backgroundColor: "#fff",
  },

  resendRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  resendText: { fontSize: 13, color: Colors.textSecondary },
});
