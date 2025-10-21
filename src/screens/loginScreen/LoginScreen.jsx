import React, { useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import AuthHeader from "../../components/AuthHeader";
import {widthPercentageToDP as wp, heightPercentageToDP as hp} from 'react-native-responsive-screen';
import PrimaryButton from "../../components/PrimaryButton";
import OutlineButton from "../../components/OutlineButton";
import SocialButton from "../../components/SocialButton";
import { useAuth } from "../../auth/AuthProvider";
import RoundedInput from "../../components/RoundedInput";
import WhiteSpinner from "../../components/Spinner";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
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
      Alert.alert(t('otp'), e?.message || t('failedToSendOtp'));
    } finally {
      setLoading(false);
    }
  };

  const start = async () => {
    const identifier = email.trim();
    if (!identifier) {
      Alert.alert(t('login'), t('enterEmailAddress'));
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
        setHint(t('signInWithOtpHint'));
      else if (pw && !otp) setHint(t('signInWithPasswordHint'));
      else if (pw && otp) setHint(t('chooseSignInMethod'));
      else setHint(t('noSignInMethod'));
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
      Alert.alert(t('login'), e?.message || t('unableToStartSignIn'));
    } finally {
      setLoading(false);
    }
  };

  const goPassword = () => navigatePassword();
  const goOtp = () => navigateOtp();

  const goSignupChooser = () => navigation.navigate("SignUpChooser");

  const editEmail = () => {
    setNextReady(false);
    setCanUsePassword(false);
    setCanUseOtp(false);
    setHint(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={hp(2)} 
      > 
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        > 
          <AuthHeader
            title={t('signInToAccount')}
            onBack={() => navigation.goBack()}
          />

          <View style={styles.container}>
            <View style={{marginVertical: 20}}>
              <Text style={styles.label}>{t('emailAddress')}</Text>
              <RoundedInput
                value={email}
                onChangeText={setEmail}
                placeholder={t('emailPlaceholder')}
                keyboardType="email-address"
                rightIcon={<Ionicons name="mail-outline" size={24} color="#344054" />}
                returnKeyType={nextReady ? "done" : "go"}
                onSubmitEditing={nextReady ? undefined : start}
              />
              {hint && (
                <Text style={styles.helperText} accessibilityRole="text">
                  {hint}{" "}
                  <Text onPress={editEmail} style={styles.helperLink}>
                    {t('changeEmail')}
                  </Text>
                </Text>
              )}
            </View>

            {!nextReady ? (
              <PrimaryButton
                label={loading ? <WhiteSpinner/> : t('continue')}
                onPress={start}
                style={{ marginTop: 6, marginBottom: 14,}}
                disabled={loading}
              />
            ) : (
              <>
                {canUsePassword && (
                  <PrimaryButton
                    label={t('continueWithPassword')}
                    onPress={goPassword}
                    style={{ marginTop: 24, marginBottom: canUseOtp ? 10 : 20 }}
                    disabled={loading}
                  />
                )}
                {canUseOtp && (
                  <OutlineButton
                    label={loading ? t('sendingOtp') : t('signInWithOtp')}
                    onPress={goOtp}
                    disabled={loading}
                  />
                )}
              </>
            )}

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>{t('merchantAccountHint')}</Text>
              <View style={styles.divider} />
            </View>

            <PrimaryButton
              label={t('signInWithEmailPassword')}
              onPress={goPassword}
              style={{ marginTop: 10, marginBottom:10 }}
              disabled={loading}
            />

            <View style={{ height: 16 }} />
            <OutlineButton
              style={{borderColor: "#DB8510", fontFamily: "dmsansRegulars", color: "#E20E02"}}
              label={t('registerAsCustomerMerchant')}
              onPress={goSignupChooser}
            />

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>{t('orContinueWith')}</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialRow}>
              <SocialButton
                label={t('google')}
                icon={<Ionicons name="logo-google" size={20} color={Colors.primary} />}
                onPress={() => {}}
              />
              <View style={{ width: 16 }} />
              <SocialButton
                label={t('facebook')}
                icon={<Ionicons name="logo-facebook" size={22} color={"#1877F2"} />}
                onPress={() => {}}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.white },
  container: {
    flex: 1,
    paddingHorizontal: wp(10), 
    paddingTop: hp(2.25),      
    backgroundColor: Colors.pageBackColor,
  },
  helperText: {
    marginTop: hp(0.75),       
    fontSize: hp(1.5),         
    color: Colors.textSecondary,
  },
  helperLink: {
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(2.2),        
    marginBottom: hp(2.2),
  },
  divider: {
    flex: 1,
    height: hp(0.125),        
    backgroundColor: Colors.divider,
  },
  dividerText: {
    marginHorizontal: wp(3.2), 
    color: '#666666',
    fontSize: hp(1.6),        
    fontFamily: 'dmsansMedium',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: hp(2.5),     
  },
  label: {
    fontFamily: 'dmsansRegular',
    marginBottom: hp(1),       
    fontSize: hp(2),           
    lineHeight: hp(3),         
    color: Colors.textTitle,
  },
});