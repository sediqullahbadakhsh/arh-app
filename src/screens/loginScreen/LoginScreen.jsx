import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { View, Text, StyleSheet, Alert, SafeAreaView, TouchableOpacity, FlatList, Modal, Animated, Dimensions, TextInput, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import PrimaryButton from "../../components/PrimaryButton";
import OutlineButton from "../../components/OutlineButton";
import SocialButton from "../../components/SocialButton";
import { useAuth } from "../../auth/AuthProvider";
import RoundedInput from "../../components/RoundedInput";
import WhiteSpinner from "../../components/Spinner";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Platform, ScrollView, Image } from "react-native";
import { useTranslation } from "react-i18next";
import Loader from "../../components/Loader";
import AuthHeaderSignIn from "../../components/AuthHeaderSignIn";
import { useLanguage } from "../../context/LanguageContext";

const { height: screenHeight } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const { selectedLang, LANGS, changeLanguage, isChangingLanguage } = useLanguage();
  
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
  
  // Language modal state
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [changingLanguage, setChangingLanguage] = useState(false);
  const languageModalAnim = useRef(new Animated.Value(screenHeight)).current;

  const inputRef = useRef(null);
  const auth = useAuth();

  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];

  // Language modal handlers
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
    if (isChangingLanguage || changingLanguage) return;
    
    setChangingLanguage(true);
    try {
      const languageChanged = await changeLanguage(lang);
      
      if (!languageChanged) {
        throw new Error('Failed to change app language');
      }
      
      setLanguageModalVisible(false);
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(t('error'), t('failedToChangeLanguage'));
    } finally {
      setChangingLanguage(false);
    }
  };

  const filteredLanguages = useMemo(() => {
    if (!searchQuery) return LANGS || [];
    return (LANGS || []).filter(lang =>
      lang.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.value?.toLowerCase().includes(searchQuery.toLowerCase())
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
        disabled={isChangingLanguage || changingLanguage}
        style={[
          loginStyles.modalRow,
          index === 0 && loginStyles.modalRowFirst,
          index === filteredLanguages.length - 1 && loginStyles.modalRowLast,
        ]}
      >
        {renderFlag()}
        <View style={loginStyles.languageInfo}>
          <Text style={loginStyles.languageName}>{item.label}</Text>
          <Text style={loginStyles.languageCode}>{(item.code || item.value).toUpperCase()}</Text>
        </View>
        {(isChangingLanguage || changingLanguage) && selectedLang?.code === item.code ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : active ? (
          <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
        ) : null}
      </TouchableOpacity>
    );
  }, [selectedLang, filteredLanguages.length, isChangingLanguage, changingLanguage]);

  const LanguageModal = () => (
    <Modal
      visible={languageModalVisible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={() => setLanguageModalVisible(false)}
    >
      <View style={loginStyles.modalOverlay}>
        <TouchableOpacity 
          style={loginStyles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setLanguageModalVisible(false)}
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
              onPress={() => setLanguageModalVisible(false)}
              style={loginStyles.closeButton}
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
            />
          </View>

          {(isChangingLanguage || changingLanguage) && (
            <View style={loginStyles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={loginStyles.loadingText}>
                {t("ChangingLanguage") || "Changing language..."}
              </Text>
            </View>
          )}

          <FlatList
            data={filteredLanguages}
            keyExtractor={(item) => item.code || item.value || Math.random().toString()}
            renderItem={renderLanguageItem}
            ItemSeparatorComponent={() => <View style={loginStyles.modalSeparator} />}
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>
      </View>
    </Modal>
  );

  const isValidGmail = (email) => {
    const emailValue = email.trim().toLowerCase();
    
    if (!emailValue) {
      return { isValid: false, message: t('enterEmailAddress') };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      return { isValid: false, message: t('invalidEmailFormat') };
    }

    const domain = emailValue.split('@')[1];

    if (domain !== 'gmail.com') {
      return { isValid: false, message: t('onlyGmailAllowed') };
    }
    
    const gmailMisspellings = {
      'gmai.com': 'gmail.com',
      'gmal.com': 'gmail.com',
      'gmial.com': 'gmail.com',
      'gmaill.com': 'gmail.com',
      'gmail.cm': 'gmail.com',
      'gmail.con': 'gmail.com',
      'gmail.om': 'gmail.com',
      'gmail.cmo': 'gmail.com',
      'gmil.com': 'gmail.com',
      'gmeil.com': 'gmail.com',
      'gmali.com': 'gmail.com'
    };
    
    if (gmailMisspellings[domain]) {
      return { 
        isValid: false, 
        message: t('invalidGmailDidYouMean', { correct: `${emailValue.split('@')[0]}@gmail.com` }) 
      };
    }

    if (domain.includes('gmail') && domain !== 'gmail.com') {
      return { isValid: false, message: t('invalidGmailDomain') };
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
    
    const validation = isValidGmail(email.trim());
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
    if (!validateEmailOnSubmit()) return;
    navigation.navigate("LoginPassword", { target: email.trim() });
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

  return (
    <SafeAreaView style={styles.safeArea}>
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
            />

            <View style={styles.container}>
              <View style={{ marginVertical: 20 }}>
                <Text style={styles.label}>{t('emailAddress')} </Text>
                <View>
                  <RoundedInput
                    ref={inputRef}
                    value={email}
                    onChangeText={validateAndSetEmail}
                    placeholder={t('gmailPlaceholder')}
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
                style={{ marginTop: 10, marginBottom: 10 }}
                disabled={loading}
              />

              <View style={{ height: 16 }} />
              <OutlineButton
                style={{ borderColor: "#DB8510", fontFamily: "dmsansRegulars", color: "#E20E02" }}
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
                  onPress={() => { }}
                />
                <View style={{ width: 16 }} />
                <SocialButton
                  label={t('facebook')}
                  icon={<Ionicons name="logo-facebook" size={22} color={"#1877F2"} />}
                  onPress={() => { }}
                />
              </View>
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
    paddingHorizontal: wp(10),
    paddingTop: hp(2.25),
    backgroundColor: Colors.pageBackColor,
  },
  helperText: {
    marginTop: hp(0.75),
    fontSize: hp(1.5),
    color: Colors.textSecondary,
  },
  errorText: {
    marginTop: hp(0.75),
    fontSize: hp(1.5),
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
  gmailNote: {
    fontSize: hp(1.6),
    color: Colors.primary,
    fontFamily: 'dmsansMedium',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: hp(6),
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
    maxHeight: hp(15),
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  suggestionText: {
    marginLeft: wp(2),
    fontSize: hp(1.6),
    color: Colors.textTitle,
    fontFamily: 'dmsansRegular',
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
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
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
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
  },
  modalRowFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalRowLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  modalSeparator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 44,
  },
  languageFlag: {
    width: 24,
    height: 18,
    marginRight: 12,
    borderRadius: 3,
  },
  flagPlaceholder: {
    width: 24,
    height: 18,
    marginRight: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  languageCode: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.textSecondary,
  },
});