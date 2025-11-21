import React, { useState, useRef, useEffect, useMemo } from "react";
import { SafeAreaView, View, Text, StyleSheet, Alert, TouchableOpacity, FlatList, ActivityIndicator, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import { scale } from "../utils/normalizeSize";
import AuthHeader from "../components/AuthHeader";
import RoundedInput from "../components/RoundedInput";
import PrimaryButton from "../components/PrimaryButton";
import OutlineButton from "../components/OutlineButton";
import { useAuth } from "../auth/AuthProvider";
import Loader from "../components/Loader";
import { useTranslation } from "react-i18next";
import WhiteSpinner from "../components/Spinner";

const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'protonmail.com'];

export default function SignUpCustomerScreen({ navigation }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [showEmailError, setShowEmailError] = useState(false);
  const [emailSuggestions, setEmailSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [canUsePassword, setCanUsePassword] = useState(false);
  const [canUseOtp, setCanUseOtp] = useState(false);
  const [nextReady, setNextReady] = useState(false);
  const [hint, setHint] = useState(null);
  
  const inputRef = useRef(null);
  const auth = useAuth();

  const isValidEmail = (email) => {
    const emailValue = email.trim().toLowerCase();
    
    if (!emailValue) {
      return { isValid: false, message: t('enterEmailAddress') || "Please enter your email address" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      return { isValid: false, message: t('invalidEmailFormat') || "Please enter a valid email address" };
    }
    
    return { isValid: true, message: "" };
  };

  const generateEmailSuggestions = (input) => {
    if (!input || !input.includes('@')) {
      setEmailSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const [localPart, domainPart] = input.split('@');
    
    if (!domainPart) {
      setEmailSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const suggestions = commonDomains
      .filter(domain => domain.startsWith(domainPart.toLowerCase()))
      .map(domain => `${localPart}@${domain}`)
      .slice(0, 3);

    setEmailSuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0);
  };

  const validateAndSetEmail = (text) => {
    setEmail(text);
    generateEmailSuggestions(text);

    if (emailError) {
      setEmailError("");
      setShowEmailError(false);
    }

    if (nextReady) {
      setNextReady(false);
      setCanUsePassword(false);
      setCanUseOtp(false);
      setHint(null);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    setEmail(suggestion);
    setShowSuggestions(false);
    setEmailSuggestions([]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const validateEmailOnSubmit = () => {
    setShowSuggestions(false);
    setEmailSuggestions([]);
    
    const validation = isValidEmail(email.trim());
    if (!validation.isValid) {
      setEmailError(validation.message);
      setShowEmailError(true);
      return false;
    }
    setShowEmailError(false);
    setEmailError("");
    return true;
  };

  const navigateToOtp = async () => {
    if (!validateEmailOnSubmit()) return;
    
    try {
      setLoading(true);
      setShowLoader(true); 
      // Use the same loginOtpSend endpoint as LoginScreen
      await auth.loginOtpSend(email.trim());
      setShowLoader(false); 
      navigation.navigate("OtpVerification", {
        channel: "email",
        target: email.trim(),
        mode: "signup_customer", // Different mode for signup
      });
    } catch (e) {
      setShowLoader(false); 
      Alert.alert(t('otp'), e?.message || t('failedToSendOtp'));
    } finally {
      setLoading(false);
    }
  };

  const start = async () => {
    setShowSuggestions(false);
    setEmailSuggestions([]);
    
    if (!validateEmailOnSubmit()) {
      return;
    }

    const identifier = email.trim();

    try {
      setLoading(true);
      setShowLoader(true);
      setEmailError("");
      setShowEmailError(false);
      
      // Use the same startAuth endpoint as LoginScreen
      const data = await auth.startAuth(identifier);
      const pw = !!data?.canUsePassword;
      const otp = !!data?.canUseOtp;

      // For signup flow, if account exists and can use password, redirect to login
      if (data?.nextStep === "password" && pw) {
        setShowLoader(false);
        setHint(t('accountExistsPleaseLogin') || "An account with this email already exists. Please login instead.");
        setNextReady(true);
        setCanUsePassword(true);
        return;
      }

      // If OTP is available (new user or existing user with OTP), proceed with OTP
      if (data?.nextStep === "otp" && otp) {
        setShowLoader(false);
        await navigateToOtp();
        return;
      }

      setCanUsePassword(pw);
      setCanUseOtp(otp);
      setNextReady(true);
      setShowLoader(false);

      if (!pw && otp)
        setHint(t('signUpWithOtpHint') || "You can sign up with OTP");
      else if (pw && !otp) setHint(t('accountExistsPasswordHint') || "An account with this email already exists. Please use password to login.");
      else if (pw && otp) setHint(t('accountExistsChooseMethod') || "An account with this email exists. Please login instead.");
      else setHint(t('proceedWithSignup') || "You can proceed with sign up");

    } catch (e) {
      setShowLoader(false);
      const nextStep = e?.response?.data?.nextStep || e?.nextStep;
      const canPw = !!e?.response?.data?.canUsePassword;
      const canO = !!e?.response?.data?.canUseOtp;

      // If account exists and requires password, show login option
      if (nextStep === "password" && canPw) {
        setHint(t('accountExistsPleaseLogin') || "An account with this email already exists. Please login instead.");
        setNextReady(true);
        setCanUsePassword(true);
        return;
      }
      
      // If OTP is available or account doesn't exist, proceed with OTP signup
      if (nextStep === "otp" && canO) {
        await navigateToOtp();
        return;
      }

      // If 404 or "not found", it's a new user - proceed with OTP signup
      if (e?.response?.status === 404 || e?.message?.includes('not found')) {
        await navigateToOtp();
        return;
      }

      // For any other error, try OTP signup as fallback
      console.log('Auth error, attempting OTP signup as fallback:', e);
      await navigateToOtp();
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate("Login", { prefillEmail: email.trim() });
  };

  const editEmail = () => {
    setNextReady(false);
    setCanUsePassword(false);
    setCanUseOtp(false);
    setHint(null);
    setEmailError("");
    setShowEmailError(false);
    setShowSuggestions(false);
    setEmailSuggestions([]);
  };

  const renderSuggestionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionSelect(item)}
    >
      <Ionicons name="mail-outline" size={16} color={Colors.primary} />
      <Text style={styles.suggestionText}>{item}</Text>
    </TouchableOpacity>
  );

  const valid = useMemo(() => {
    const validation = isValidEmail(email);
    return validation.isValid;
  }, [email]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthHeader 
        title={t('register') || "Register"} 
        onBack={() => navigation.goBack()} 
      />
      
      <View style={styles.container}>
 

        <View style={{ marginVertical: 20 }}>
          <Text style={styles.label}>{t('emailAddress') || "Email Address"} </Text>
          <View>
            <RoundedInput
              ref={inputRef}
              value={email}
              onChangeText={validateAndSetEmail}
              placeholder={t('emailPlaceholder') || "Enter your email"}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              rightIcon={<Ionicons name="mail-outline" size={24} color="#344054" />}
              returnKeyType={nextReady ? "done" : "go"}
              onSubmitEditing={nextReady ? undefined : start}
              onBlur={() => {
                setTimeout(() => {
                  setShowSuggestions(false);
                }, 200);
              }}
              onFocus={() => {
                if (emailSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
            />
            
            {showSuggestions && emailSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <FlatList
                  data={emailSuggestions}
                  keyExtractor={(item) => item}
                  renderItem={renderSuggestionItem}
                  scrollEnabled={false}
                />
              </View>
            )}
          </View>

          {showEmailError && emailError ? (
            <Text style={styles.errorText} accessibilityRole="alert">
              {emailError}
            </Text>
          ) : null}
          
          {hint && !showEmailError && (
            <Text style={styles.helperText} accessibilityRole="text">
              {hint}{" "}
              {canUsePassword && (
                <Text onPress={navigateToLogin} style={styles.helperLink}>
                  {t('loginHere') || "Login here"}
                </Text>
              )}
              {!canUsePassword && !canUseOtp && (
                <Text onPress={editEmail} style={styles.helperLink}>
                  {t('changeEmail') || "Change email"}
                </Text>
              )}
            </Text>
          )}

          {!valid && email.length > 0 && !showEmailError && !hint && (
            <Text style={styles.helperWarn}>
              {t('enterValidEmailExample') || "Enter a valid email like name@example.com"}
            </Text>
          )}
        </View>

        {!nextReady ? (
          <PrimaryButton
            label={loading ? <WhiteSpinner /> : (t('continue') || "Continue")}
            onPress={start}
            style={{ marginTop: 6, marginBottom: 14 }}
            disabled={loading || !valid}
          />
        ) : (
          <>
            {canUseOtp && (
              <PrimaryButton
                label={t('signUpWithOtp') || "Sign Up with OTP"}
                onPress={navigateToOtp}
                style={{ marginTop: 24, marginBottom: canUsePassword ? 10 : 20 }}
                disabled={loading}
              />
            )}
            {canUsePassword && (
              <OutlineButton
                label={t('loginToExistingAccount') || "Login to Existing Account"}
                onPress={navigateToLogin}
                disabled={loading}
              />
            )}
          </>
        )}

    
      </View>
      
      {showLoader && <Loader />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: Colors.white 
  },
  container: {
    flex: 1,
    paddingHorizontal: scale.wp(10),
    paddingTop: scale.hp(2.25),
    backgroundColor: Colors.pageBackColor,
  },
  sectionTitle: {
    fontSize: scale.hp(2),
    color: Colors.textPrimary,
    marginBottom: scale.hp(1),
    fontWeight: "600",
    fontFamily: 'dmsansMedium',
  },
  label: {
    fontFamily: 'dmsansRegular',
    marginBottom: scale.hp(1),
    fontSize: scale.hp(2),
    lineHeight: scale.hp(3),
    color: Colors.textTitle,
  },
  helperText: {
    marginTop: scale.hp(0.75),
    fontSize: scale.hp(1.5),
    color: Colors.textSecondary,
    fontFamily: 'dmsansRegular',
  },
  helperInfo: {
    marginTop: scale.hp(1),
    fontSize: scale.hp(1.5),
    color: Colors.textSecondary,
    fontFamily: 'dmsansRegular',
    textAlign: 'center',
  },
  helperWarn: {
    marginTop: scale.hp(0.75),
    fontSize: scale.hp(1.5),
    color: '#D14343',
    fontFamily: 'dmsansRegular',
  },
  errorText: {
    marginTop: scale.hp(0.75),
    fontSize: scale.hp(1.5),
    color: '#E20E02',
    fontFamily: 'dmsansRegular',
  },
  helperLink: {
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: scale.hp(6),
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 1000,
    maxHeight: scale.hp(15),
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale.wp(4),
    paddingVertical: scale.hp(1.2),
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  suggestionText: {
    marginLeft: scale.wp(2),
    fontSize: scale.hp(1.6),
    color: Colors.textTitle,
    fontFamily: 'dmsansRegular',
  },
});