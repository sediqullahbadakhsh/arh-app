// src/screens/LoginScreen.jsx
import React, { useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import AuthHeader from "../components/AuthHeader";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import OutlineButton from "../components/OutlineButton";
import SocialButton from "../components/SocialButton";
import { useAuth } from "../auth/AuthProvider";
import RoundedInput from "../components/RoundedInput";
import WhiteSpinner from "../components/Spinner";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [canUsePassword, setCanUsePassword] = useState(false);
  const [canUseOtp, setCanUseOtp] = useState(false);
  const [nextReady, setNextReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState(null); 
  const auth = useAuth();

  const navigatePassword = () =>
    navigation.navigate("LoginPassword", { target: email.trim() });

  const navigateOtp = async () => {
    try {
      setLoading(true);
      await auth.loginOtpSend(email.trim()); 
      navigation.navigate("OtpVerification", {
        channel: "email",
        target: email.trim(),
        mode: "login",
      });
    } catch (e) {
      Alert.alert("OTP", e?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const start = async () => {
    const identifier = email.trim();
    if (!identifier) {
      Alert.alert("Login", "Please enter your email address.");
      return;
    }
    try {
      setLoading(true);
      const data = await auth.startAuth(identifier);
      const pw = !!data?.canUsePassword;
      const otp = !!data?.canUseOtp;

  
      if (data?.nextStep === "password" && pw && !otp) {
        navigatePassword();
        return;
      }
      if (data?.nextStep === "otp" && otp && !pw) {
        await navigateOtp();
        return;
      }

  
      setCanUsePassword(pw);
      setCanUseOtp(otp);
      setNextReady(true);

   
      if (!pw && otp)
        setHint("This account signs in via a one-time code (OTP).");
      else if (pw && !otp) setHint("This account signs in with a password.");
      else if (pw && otp) setHint("Choose Password or One-Time Code (OTP).");
      else setHint("No available sign-in method. Contact support.");
    } catch (e) {
   
      const nextStep = e?.response?.data?.nextStep || e?.nextStep;
      const canPw = !!e?.response?.data?.canUsePassword;
      const canO = !!e?.response?.data?.canUseOtp;

      if (nextStep === "password" && canPw && !canO) {
        navigatePassword();
        return;
      }
      if (nextStep === "otp" && canO && !canPw) {
        await navigateOtp();
        return;
      }
      Alert.alert("Login", e?.message || "Unable to start sign in.");
    } finally {
      setLoading(false);
    }
  };

  const goPassword = () => navigatePassword();
  const goOtp = () => navigateOtp();

  const goSignupChooser = () => navigation.navigate("SignUpChooser");

  // Allow changing email after next step is shown
  const editEmail = () => {
    setNextReady(false);
    setCanUsePassword(false);
    setCanUseOtp(false);
    setHint(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthHeader
        title={"Sign in to your\nAccount"}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.container}>
       <View style={{marginVertical: 20}}>
   
         <Text style={styles.label}>Email Address</Text>
        <RoundedInput
          value={email}
          onChangeText={setEmail}
          placeholder="ahmad@example.com"
          keyboardType="email-address"
          rightIcon={<Ionicons name="mail-outline" size={18} color="#344054" />}
          returnKeyType={nextReady ? "done" : "go"}
          onSubmitEditing={nextReady ? undefined : start}
        />

    
        {hint && (
          <Text style={styles.helperText} accessibilityRole="text">
            {hint}{" "}
            <Text onPress={editEmail} style={styles.helperLink}>
              Change email
            </Text>
          </Text>
        )}

        
       </View>

        {/* Primary action(s) */}
        {!nextReady ? (
          <PrimaryButton
            label={loading ? <WhiteSpinner/> : "Continue"}
            onPress={start}
            style={{ marginTop: 6, marginBottom: 14,}}
            disabled={loading}
          />
        ) : (
          <>
            {canUsePassword && (
              <PrimaryButton
                label="Continue with Password"
                onPress={goPassword}
                style={{ marginTop: 24, marginBottom: canUseOtp ? 10 : 20 }}
                disabled={loading}
              />
            )}
            {canUseOtp && (
              <OutlineButton
                label={loading ? "Sending OTP..." : "Sign in with OTP"}
                onPress={goOtp}
                disabled={loading}
              />
            )}
          </>
        )}


        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>if you have a merchant account</Text>
          <View style={styles.divider} />
        </View>

         <PrimaryButton
                label="Sign in with Email and Password"
                onPress={goPassword}
                style={{ marginTop: 10, marginBottom:10 }}
                disabled={loading}
              />

        {/* Sign up CTA */}
        <View style={{ height: 16 }} />
        <OutlineButton
        style={{borderColor: "#DB8510", fontFamily: "dmsansRegulars", color: "#E20E02"}}
          label="Register as Customer or Merchant"
          onPress={goSignupChooser}
        />

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>Or Continue with</Text>
          <View style={styles.divider} />
        </View>

        {/* Socials (static for now) */}
        <View style={styles.socialRow}>
          <SocialButton
            label="Google"
            icon={<Ionicons name="logo-google" size={20} color={Colors.primary} />}
            onPress={() => {}}
          />
          <View style={{ width: 16 }} />
          <SocialButton
            label="Facebook"
            icon={<Ionicons name="logo-facebook" size={22} color={"#1877F2"} />}
            onPress={() => {}}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.white },
  container: {
    flex: 1,
    paddingHorizontal: 40,
    paddingTop: 18,
    backgroundColor: Colors.pageBackColor,
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  helperLink: {
    color: Colors.primary,
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  divider: { flex: 1, height: 1, backgroundColor: Colors.divider },
  dividerText: { marginHorizontal: 12, color: "#666666", fontSize: 13, fontFamily: "dmsansMedium" },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  label: {
    fontFamily: "dmsansRegular",
    marginBottom: 4,
    fontSize: 14,
    lineHeight: 24,
    color: Colors.textTitle
  }
});
