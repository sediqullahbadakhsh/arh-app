import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  View,
  SafeAreaView,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  FlatList,
  Modal,
  Animated,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Platform,
  ScrollView,
  Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import PrimaryButton from "../../components/PrimaryButton";
import OutlineButton from "../../components/OutlineButton";
import SocialButton from "../../components/SocialButton";
import { useAuth } from "../../auth/AuthProvider";
import RoundedInput from "../../components/RoundedInput";
import WhiteSpinner from "../../components/Spinner";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useTranslation } from "react-i18next";
import Loader from "../../components/Loader";
import AuthHeaderSignIn from "../../components/AuthHeaderSignIn";
import { useLanguage } from "../../context/LanguageContext";
import { scale } from "../../utils/normalizeSize";

import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

const { height: screenHeight } = Dimensions.get('window');

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const { selectedLang, LANGS, changeLanguage, isChangingLanguage, needsRestart } = useLanguage();
  
  const [email, setEmail] = useState("");
  const [canUsePassword, setCanUsePassword] = useState(false);
  const [canUseOtp, setCanUseOtp] = useState(false);
  const [nextReady, setNextReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState(null);
  const [emailError, setEmailError] = useState("");
  const [showEmailError, setShowEmailError] = useState(false); 
  const [showLoader, setShowLoader] = useState(false);
  const [emailSuggestions, setEmailSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [googleLoading, setGoogleLoading] = useState(false);

  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const languageModalAnim = useRef(new Animated.Value(screenHeight)).current;

  const inputRef = useRef(null);
  const auth = useAuth();

  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'protonmail.com'];

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '586500268839-5fvgp3l6s5n4ma3lqk0i2t0n3l6b6l6q.apps.googleusercontent.com', 
    androidClientId: '586500268839-5fvgp3l6s5n4ma3lqk0i2t0n3l6b6l6q.apps.googleusercontent.com',
    iosClientId: '586500268839-5fvgp3l6s5n4ma3lqk0i2t0n3l6b6l6q.apps.googleusercontent.com', 
    webClientId: '586500268839-5fvgp3l6s5n4ma3lqk0i2t0n3l6b6l6q.apps.googleusercontent.com', 
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleSignInSuccess(response.authentication);
    }
  }, [response]);

  useEffect(() => {
    if (needsRestart) {
      setLanguageModalVisible(false);
      setSearchQuery('');
    }
  }, [needsRestart]);

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      const result = await promptAsync();
      
      if (result?.type !== 'success') {
        if (result?.type === 'cancel' || result?.type === 'dismiss') {
          return;
        }
        throw new Error(result?.type || 'Sign-in failed');
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      if (error.message !== 'User canceled authentication') {
        Alert.alert(t('error'), t('googleSignInFailed'));
      }
      setGoogleLoading(false);
    }
  };

  const handleGoogleSignInSuccess = async (authentication) => {
    try {
      if (!authentication?.accessToken) {
        throw new Error('No access token received');
      }

      const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${authentication.accessToken}` },
      });

      if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userInfo = await userInfoResponse.json();
      
      const googleEmail = userInfo.email;
      
      if (!googleEmail) {
        throw new Error('No email received from Google');
      }

      console.log('Google Sign-In Successful:', { email: googleEmail, userInfo });

      navigation.navigate("OtpVerification", {
        channel: "email",
        target: googleEmail,
        mode: "login",
        isGoogleAuth: true,
      });

    } catch (error) {
      console.error('Google Auth Error:', error);
      Alert.alert(
        t('authenticationError'),
        error.message || t('googleAuthenticationFailed')
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleMockGoogleSignIn = () => {
    setGoogleLoading(true);
    
    setTimeout(() => {
      const mockEmail = "test.user@gmail.com";
      setEmail(mockEmail);
      setGoogleLoading(false);
      
      Alert.alert(
        "Development Mode",
        "Mock Google authentication successful!\n\nIn production, this would use real Google OAuth.",
        [
          {
            text: "Continue to OTP",
            onPress: () => {
              navigation.navigate("OtpVerification", {
                channel: "email",
                target: mockEmail,
                mode: "login",
                isGoogleAuth: true,
              });
            }
          }
        ]
      );
    }, 1000);
  };

  useEffect(() => {
    if (languageModalVisible) {
      Animated.timing(languageModalAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(languageModalAnim, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }).start();
      setSearchQuery('');
    }
  }, [languageModalVisible]);

  const handleLanguageChange = async (lang) => {
    if (isChangingLanguage || selectedLang?.code === lang.code) return;
    
    try {
      await changeLanguage(lang);
      // Close modal after successful language change
      setTimeout(() => {
        setLanguageModalVisible(false);
      }, 500);
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(t('error'), t('failedToChangeLanguage'));
    }
  };

  const filteredLanguages = useMemo(() => {
    if (!searchQuery) return LANGS || [];
    return (LANGS || []).filter(lang =>
      lang.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lang.nativeName && lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, LANGS]);

  const renderLanguageItem = useCallback(({ item, index }) => {
    const active = selectedLang?.code === item.code;
    
    const renderFlag = () => {
      if (!item?.flag) {
        return <View style={loginStyles.flagPlaceholder} />;
      }
      return (
        <Image
          source={{ uri: item.flag }}
          style={loginStyles.languageFlag}
          resizeMode="contain"
        />
      );
    };

    return (
      <TouchableOpacity
        onPress={() => handleLanguageChange(item)}
        activeOpacity={0.8}
        disabled={isChangingLanguage}
        style={[
          loginStyles.modalRow,
          index === 0 && loginStyles.modalRowFirst,
          index === filteredLanguages.length - 1 && loginStyles.modalRowLast,
        ]}
      >
        {renderFlag()}
        <View style={loginStyles.languageInfo}>
          <Text style={loginStyles.languageName}>{item.label}</Text>
          <Text style={loginStyles.languageCode}>
            {item.nativeName || item.code.toUpperCase()}
          </Text>
        </View>
        {isChangingLanguage && active ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : active ? (
          <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
        ) : null}
      </TouchableOpacity>
    );
  }, [selectedLang, filteredLanguages.length, isChangingLanguage]);

  const LanguageModal = () => {
    const handleClose = useCallback(() => {
      if (!isChangingLanguage) {
        setLanguageModalVisible(false);
      }
    }, [isChangingLanguage]);

    return (
      <Modal
        visible={languageModalVisible}
        transparent={true}
        animationType="none"
        statusBarTranslucent={true}
        onRequestClose={handleClose}
      >
        <View style={loginStyles.modalOverlay}>
          <TouchableOpacity 
            style={loginStyles.modalBackdrop}
            activeOpacity={1}
            onPress={handleClose}
            disabled={isChangingLanguage}
          />
          <Animated.View 
            style={[
              loginStyles.modalCard,
              { 
                transform: [{ translateY: languageModalAnim }],
                maxHeight: '70%',
              }
            ]}
          >
            <View style={loginStyles.modalHeader}>
              <Text style={loginStyles.modalTitle}>{t('selectLanguage') || "Select Language"}</Text>
              <TouchableOpacity 
                onPress={handleClose}
                style={loginStyles.closeButton}
                disabled={isChangingLanguage}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={loginStyles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" style={loginStyles.searchIcon} />
              <TextInput
                placeholder={t('searchLanguages') || "Search languages..."}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={loginStyles.searchInput}
                placeholderTextColor="#999"
                editable={!isChangingLanguage}
              />
            </View>

            {isChangingLanguage && (
              <View style={loginStyles.loadingOverlay}>
                <View style={loginStyles.loadingContainer}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={loginStyles.loadingText}>
                    {t("ChangingLanguage") || "Changing language..."}
                  </Text>
                </View>
              </View>
            )}

            <FlatList
              data={filteredLanguages}
              keyExtractor={(item) => item.code || item.value || Math.random().toString()}
              renderItem={renderLanguageItem}
              ItemSeparatorComponent={() => <View style={loginStyles.modalSeparator} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
            />
          </Animated.View>
        </View>
      </Modal>
    );
  };

  const isValidEmail = (email) => {
    const emailValue = email.trim().toLowerCase();
    
    if (!emailValue) {
      return { isValid: false, message: t('enterEmailAddress') };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      return { isValid: false, message: t('invalidEmailFormat') };
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

  const navigatePassword = () => {
    const trimmedEmail = email.trim();
    setShowEmailError(false);
    setEmailError("");
    navigation.navigate("LoginPassword", { target: trimmedEmail });
  };

  const navigateOtp = async () => {
    if (!validateEmailOnSubmit()) return;
    
    try {
      setLoading(true);
      setShowLoader(true); 
      await auth.loginOtpSend(email.trim());
      setShowLoader(false); 
      navigation.navigate("OtpVerification", {
        channel: "email",
        target: email.trim(),
        mode: "login",
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
      const data = await auth.startAuth(identifier);
      const pw = !!data?.canUsePassword;
      const otp = !!data?.canUseOtp;

      if (data?.nextStep === "password" && pw && !otp) {
        setShowLoader(false);
        navigatePassword();
        return;
      }
      if (data?.nextStep === "otp" && otp && !pw) {
        setShowLoader(false);
        await navigateOtp();
        return;
      }

      setCanUsePassword(pw);
      setCanUseOtp(otp);
      setNextReady(true);
      setShowLoader(false);

      if (!pw && otp)
        setHint(t('signInWithOtpHint'));
      else if (pw && !otp) setHint(t('signInWithPasswordHint'));
      else if (pw && otp) setHint(t('chooseSignInMethod'));
      else setHint(t('noSignInMethod'));
    } catch (e) {
      setShowLoader(false);
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
  
  const goOtp = () => {
    setShowLoader(true); 
    setTimeout(() => {
      navigateOtp();
    }, 500);
  };

  const goSignupChooser = () => navigation.navigate("SignUpChooser");

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

  const handleGoogleSignInPress = () => {
    if (__DEV__) {
      handleMockGoogleSignIn();
    } else {
      handleGoogleSignIn();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <AuthHeaderSignIn
              title={t('signInToAccount')}
              onLanguagePress={() => setLanguageModalVisible(true)}
              selectedLang={selectedLang}
              isChangingLanguage={isChangingLanguage}
            />

            <View style={styles.container}>
              <View style={{ marginVertical: 20 }}>
                <Text style={styles.label}>{t('emailAddress')} </Text>
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
                    editable={!loading && !isChangingLanguage}
                  />
                  
                  {showSuggestions && emailSuggestions.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                      <FlatList
                        data={emailSuggestions}
                        renderItem={renderSuggestionItem}
                        keyExtractor={(item, index) => `suggestion-${index}`}
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
                    <Text onPress={editEmail} style={styles.helperLink}>
                      {t('changeEmail')}
                    </Text>
                  </Text>
                )}
              </View>

              {!nextReady ? (
                <PrimaryButton
                  label={loading ? <WhiteSpinner /> : t('continue')}
                  onPress={start}
                  style={{ marginTop: 6, marginBottom: 14 }}
                  disabled={loading || isChangingLanguage}
                />
              ) : (
                <>
                  {canUsePassword && (
                    <PrimaryButton
                      label={t('continueWithPassword')}
                      onPress={goPassword}
                      style={{ marginTop: 24, marginBottom: canUseOtp ? 10 : 20 }}
                      disabled={loading || isChangingLanguage}
                    />
                  )}
                  {canUseOtp && (
                    <OutlineButton
                      label={loading ? t('sendingOtp') : t('signInWithOtp')}
                      onPress={goOtp}
                      disabled={loading || isChangingLanguage}
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
                style={{ marginTop: 10, marginBottom: 10 }}
                disabled={loading || isChangingLanguage}
              />

              <View style={{ height: 16 }} />
              <OutlineButton
                style={{ borderColor: "#DB8510", fontFamily: "dmsansRegulars", color: "#E20E02" }}
                label={t('registerAsCustomerMerchant')}
                onPress={goSignupChooser}
                disabled={isChangingLanguage}
              />

              {/* <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>{t('orContinueWith')}</Text>
                <View style={styles.divider} />
              </View>

              <View style={styles.socialRow}>
                <SocialButton
                  label={googleLoading ? t('signingIn') : t('google')}
                  icon={
                    googleLoading ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <Ionicons name="logo-google" size={20} color={Colors.primary} />
                    )
                  }
                  onPress={handleGoogleSignInPress}
                  disabled={googleLoading || isChangingLanguage}
                />
                <View style={{ width: 16 }} />
                <SocialButton
                  label={t('facebook')}
                  icon={<Ionicons name="logo-facebook" size={22} color={"#1877F2"} />}
                  onPress={() => { }}
                  disabled={isChangingLanguage}
                />
              </View>

              {__DEV__ && (
                <Text style={styles.devInfo}>
                  Development: Using mock Google authentication
                </Text>
              )} */}
            </View>
          </ScrollView>
        </View>
      </KeyboardAwareScrollView>
      {showLoader && <Loader />}
      <LanguageModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.white },
  container: {
    flex: 1,
    paddingHorizontal: scale.wp(10),
    paddingTop: scale.hp(2.25),
    backgroundColor: Colors.pageBackColor,
  },
  helperText: {
    marginTop: scale.hp(0.75),
    fontSize: scale.hp(1.5),
    color: Colors.textSecondary,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale.hp(2.2),
    marginBottom: scale.hp(2.2),
  },
  divider: {
    flex: 1,
    height: scale.hp(0.125),
    backgroundColor: Colors.divider,
  },
  dividerText: {
    marginHorizontal: scale.wp(3.2),
    color: '#666666',
    fontSize: scale.hp(1.6),
    fontFamily: 'dmsansMedium',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: scale.hp(2.5),
  },
  label: {
    fontFamily: 'dmsansRegular',
    marginBottom: scale.hp(1),
    fontSize: scale.hp(2),
    lineHeight: scale.hp(3),
    color: Colors.textTitle,
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
  devInfo: {
    textAlign: 'center',
    fontSize: scale.hp(1.4),
    color: '#666',
    marginTop: scale.hp(1),
    fontStyle: 'italic',
  },
});

const loginStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalCard: {
    position: 'absolute',
    bottom: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : 35,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: scale.hp(3),
    borderTopRightRadius: scale.hp(3),
    padding: scale.hp(2.5),
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale.hp(2),
    paddingBottom: scale.hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: scale.hp(2.5),
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: scale.hp(0.5),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: scale.hp(1.5),
    paddingHorizontal: scale.wp(4),
    marginBottom: scale.hp(2),
    height: scale.hp(6),
  },
  searchIcon: {
    marginRight: scale.wp(3),
  },
  searchInput: {
    flex: 1,
    fontSize: scale.hp(2),
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scale.hp(1.75),
    paddingHorizontal: scale.wp(2),
    backgroundColor: '#fff',
  },
  modalRowFirst: {
    borderTopLeftRadius: scale.hp(1.5),
    borderTopRightRadius: scale.hp(1.5),
  },
  modalRowLast: {
    borderBottomLeftRadius: scale.hp(1.5),
    borderBottomRightRadius: scale.hp(1.5),
  },
  modalSeparator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: scale.wp(11),
  },
  languageFlag: {
    width: scale.wp(6),
    height: scale.hp(2.25),
    marginEnd: scale.wp(3),
    borderRadius: scale.hp(0.5),
  },
  flagPlaceholder: {
    width: scale.wp(6),
    height: scale.hp(2.25),
    marginEnd: scale.wp(3), 
    backgroundColor: '#F0F0F0',
    borderRadius: scale.hp(0.5),
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: scale.hp(2),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scale.hp(0.25),
  },
  languageCode: {
    fontSize: scale.hp(1.75),
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
});