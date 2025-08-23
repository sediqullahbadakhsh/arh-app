// // src/screens/PasswordLoginScreen.jsx
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  Alert,
} from "react-native";
import { Colors } from "../theme/colors";
import AuthHeader from "../components/AuthHeader";
import PasswordField from "../components/PasswordField";
import PrimaryButton from "../components/PrimaryButton";
import { useAuth } from "../auth/AuthProvider";

export default function PasswordLoginScreen({ route, navigation }) {
  const { target = "" } = route.params || {}; // email / identifier
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const auth = useAuth();

  const onLogin = async () => {
    try {
      setBusy(true);
      await auth.loginPassword({ identifier: target, password });
      navigation.replace("Tabs");
    } catch (e) {
      Alert.alert("Login", e?.message || "Unable to sign in");
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = password.trim().length > 0 && !busy;

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthHeader title="Enter Password" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <Text style={styles.infoTxt}>
            Sign in as{" "}
            <Text style={{ color: Colors.textPrimary, fontWeight: "600" }}>
              {target || "your account"}
            </Text>
          </Text>

          <PasswordField
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            returnKeyType="done"
            onSubmitEditing={canSubmit ? onLogin : undefined}
            style={{ marginBottom: 16 }}
          />

          <PrimaryButton
            label={busy ? "Signing in..." : "Sign In"}
            onPress={onLogin}
            disabled={!canSubmit}
            style={{ marginTop: 8 }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.white },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    backgroundColor: Colors.white,
  },
  infoTxt: { fontSize: 13, color: Colors.textSecondary, marginBottom: 12 },
});
