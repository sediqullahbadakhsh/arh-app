import React, { useRef, useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Colors } from "../theme/colors";
import AuthHeader from "../components/AuthHeader";
import PrimaryButton from "../components/PrimaryButton";
import { useAuth } from "../auth/AuthProvider";

const CODE_LENGTH = 4;
const RESEND_SECONDS = 120;

export default function OtpVerificationScreen({ navigation, route }) {
  const { channel, target, mode } = route.params || {};
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

  const handleChange = (text, idx) => {
    if (text.length > 1) text = text.slice(-1);
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

  const verify = () => {
    const code = codes.join("");
    if (code.length === CODE_LENGTH) {
      // UI-only branching
      if (mode === "signup_customer") {
        // customer sign-up completes, go to result then back to Login
        navigation.replace("SignupResult", { type: "customer" });
        return;
      }
      // LOGIN FLOW: verify via mock auth so role is set before Tabs
      const ok = auth.verifyOtp(code);
      if (ok) {
        navigation.replace("Tabs");
      } else {
        alert("Wrong code. (Demo: customer 1111, merchant 2222)");
      }
    }
  };

  const resend = () => setTimeLeft(RESEND_SECONDS);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      {/* Match Figma red header */}
      <AuthHeader title="OTP Verification" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <Text style={styles.infoTxt}>
            {channel === "email"
              ? "Check your email to see the verification Code"
              : "Check your phone to see the verification Code"}
          </Text>

          <View style={styles.codeRow}>
            {codes.map((c, idx) => (
              <TextInput
                key={idx}
                ref={(r) => (inputsRef.current[idx] = r)}
                style={styles.codeBox}
                value={c}
                onChangeText={(t) => handleChange(t, idx)}
                maxLength={1}
                keyboardType="number-pad"
                onKeyPress={(e) => handleKeyPress(e, idx)}
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
    width: 56,
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
