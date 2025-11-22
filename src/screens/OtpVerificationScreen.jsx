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
  Modal,
  ScrollView,
  AppState,
  Image,
} from "react-native";
import { Colors } from "../theme/colors";
import AuthHeader from "../components/AuthHeader";
import PrimaryButton from "../components/PrimaryButton";
import { useAuth } from "../auth/AuthProvider";
import { useTranslation } from "react-i18next";
import { scale } from "../utils/normalizeSize";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 120;


const useTimer = (initialTime) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const timerRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const endTimeRef = useRef(null);

  useEffect(() => {
    if (!endTimeRef.current) {
      endTimeRef.current = Date.now() + initialTime * 1000;
    }

    const calculateTimeLeft = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
      return remaining;
    };

    const updateTimer = () => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining > 0) {
        timerRef.current = setTimeout(updateTimer, 1000);
      }
    };

    const handleAppStateChange = (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        const remaining = calculateTimeLeft();
        setTimeLeft(remaining);
        
        if (remaining > 0) {
          timerRef.current = setTimeout(updateTimer, 1000);
        }
      }
      appStateRef.current = nextAppState;
    };


    updateTimer();

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      subscription.remove();
    };
  }, [initialTime]);

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    endTimeRef.current = Date.now() + initialTime * 1000;
    setTimeLeft(initialTime);
  };

  return { timeLeft, resetTimer };
};

const HelpModal = ({ 
  visible, 
  onClose, 
  target, 
  onResend, 
  onEditEmail 
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('otpVerification.helpModal.title')}</Text>
          <ScrollView style={styles.modalScrollView}>
            <Text style={styles.modalSubtitle}>
              {t('otpVerification.helpModal.subtitle')}
            </Text>
            
            <View style={styles.helpItem}>
              <Text style={styles.helpNumber}>1.</Text>
              <Text style={styles.helpText}>
                {t('otpVerification.helpModal.checkEmail')}
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.emailDisplay}
              onPress={onEditEmail}
            >
              <Text style={styles.emailText}>{target}</Text>
              <Text style={styles.editText}>{t('otpVerification.helpModal.edit')}</Text>
            </TouchableOpacity>

            <View style={styles.helpItem}>
              <Text style={styles.helpNumber}>2.</Text>
              <Text style={styles.helpText}>
                {t('otpVerification.helpModal.checkJunk')}
              </Text>
            </View>

            <View style={styles.helpItem}>
              <Text style={styles.helpNumber}>3.</Text>
              <Text style={styles.helpText}>
                {t('otpVerification.helpModal.checkMailbox')}
              </Text>
            </View>

            <View style={styles.helpItem}>
              <Text style={styles.helpNumber}>4.</Text>
              <Text style={styles.helpText}>
                {t('otpVerification.helpModal.checkDomain')}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.resendButton]}
              onPress={onResend}
            >
              <Text style={styles.resendButtonText}>
                {t('otpVerification.helpModal.resendOtp')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.closeButton]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>
                {t('otpVerification.helpModal.close')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function OtpVerificationScreen({ route, navigation }) {
  const {
    channel = "email",
    target = "",
    mode = "login",
  } = route?.params || {};
  const [codes, setCodes] = useState(Array(CODE_LENGTH).fill(""));
  const inputsRef = useRef([]);
  const { timeLeft, resetTimer } = useTimer(RESEND_SECONDS);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const auth = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

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
      Alert.alert(
        t('otpVerification.title'),
        t('otpVerification.enterCode', { length: CODE_LENGTH })
      );
      return;
    }

    try {
      if (mode === "login") {
        const res = await auth.loginOtpVerify({ identifier: target, otp: code });
        console.log("this is customer login response", res);
        navigation.replace("Tabs");
      } else if (mode === "signup_customer") {
        await auth.signupCustomerVerifyOtp({ identifier: target, otp: code });
        Alert.alert(
          t('otpVerification.success'),
          t('otpVerification.emailVerified')
        );
        navigation.replace("Login");
      } else {
        Alert.alert(
          t('otpVerification.unsupportedMode'),
          String(mode)
        );
      }
    } catch (e) {
      Alert.alert(
        t('otpVerification.title'),
        e.message || t('otpVerification.verificationFailed')
      );
    }
  };

  const resend = async () => {
    resetTimer();
    try {
      if (mode === "login") {
        await auth?.loginOtpResend?.({ identifier: target });
        Alert.alert(
          t('otpVerification.success'),
          t('otpVerification.otpResent')
        );
      } else if (mode === "signup_customer") {
        await auth?.signupCustomerResendOtp?.({ identifier: target });
        Alert.alert(
          t('otpVerification.success'),
          t('otpVerification.otpResent')
        );
      }
    } catch (e) {
      Alert.alert(
        t('otpVerification.title'),
        t('otpVerification.resendFailed')
      );
    }
  };

  const handleGoBackToEditEmail = () => {
    setShowHelpModal(false);
    navigation.goBack();
  };

  const handleModalResend = () => {
    setShowHelpModal(false);
    resend();
  };

  const getInfoText = () => {
    if (channel === "email") {
      return t('otpVerification.infoEmail', { length: CODE_LENGTH, target });
    } else {
      return t('otpVerification.infoPhone', { length: CODE_LENGTH, target });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <AuthHeader 
        title={t('otpVerification.title')} 
        onBack={() => navigation.goBack()} 
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        
        <View style={styles.container}>
          <Text style={styles.infoTxt}>
            {getInfoText()}
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
            <Text style={styles.resendText}>{t('otpVerification.resendText')}</Text>
            {timeLeft > 0 ? (
              <Text style={[styles.resendText, { color: Colors.primary }]}>
                {formatTime(timeLeft)}
              </Text>
            ) : (
              <TouchableOpacity onPress={resend}>
                <Text style={[styles.resendText, { color: Colors.primary }]}>
                  {t('otpVerification.resend')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
   <View style={styles.watermarkContainer}>
        <Image 
          source={require('../../assets/logo4.png')} 
          style={styles.watermarkLogo}
          resizeMode="contain"
        />
      </View>
          <TouchableOpacity 
            style={styles.helpLink}
            onPress={() => setShowHelpModal(true)}
          >
            <Text style={styles.helpLinkText}>
              {t('otpVerification.didNotReceive')}
            </Text>
          </TouchableOpacity>

          <PrimaryButton
            label={t('otpVerification.verify')}
            onPress={verify}
            style={{ marginTop: 28 }}
            disabled={codes.join("").length !== CODE_LENGTH}
          />
        </View>
      </KeyboardAvoidingView>

     
      <HelpModal
        visible={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        target={target}
        onResend={handleModalResend}
        onEditEmail={handleGoBackToEditEmail}
      />
    </SafeAreaView>
  );
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: scale.wp(6),
    paddingTop: scale.hp(3),
  },
  infoTxt: {
    fontSize: scale.hp(1.625),
    color: Colors.textSecondary,
    marginBottom: scale.hp(3),
  },
  codeRow: {
    flexDirection: 'row',
    direction: 'ltr',
    justifyContent: 'space-between',
    marginBottom: scale.hp(1.5),
  },
  watermarkContainer: {
    position: 'absolute',
    top: scale.hp(20),
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  watermarkLogo: {
    width: scale.wp(67.5),
    height: scale.hp(33.75),
    opacity: 0.1,
  },
  codeBox: {
    width: scale.wp(12),
    height: scale.hp(7),
    borderRadius: scale.hp(1.25),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    textAlign: 'center',
    fontSize: scale.hp(2.25),
    color: Colors.textPrimary,
    backgroundColor: '#fff',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale.hp(1),
    justifyContent: 'center',
  },
  resendText: {
    fontSize: scale.hp(1.625),
    color: Colors.textSecondary,
  },
  helpLink: {
    marginTop: scale.hp(2),
    alignItems: 'center',
  },
  helpLinkText: {
    fontSize: scale.hp(1.75),
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale.hp(2.5),
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: scale.hp(2),
    padding: scale.hp(3),
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: scale.hp(2.5),
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: scale.hp(2),
  },
  modalScrollView: {
    maxHeight: scale.hp(37.5),
  },
  modalSubtitle: {
    fontSize: scale.hp(2),
    color: Colors.textSecondary,
    marginBottom: scale.hp(2),
    fontWeight: '600',
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: scale.hp(2),
  },
  helpNumber: {
    fontSize: scale.hp(1.75),
    fontWeight: 'bold',
    color: Colors.primary,
    marginRight: scale.wp(2),
    lineHeight: scale.hp(2.5),
  },
  helpText: {
    fontSize: scale.hp(1.75),
    color: Colors.textPrimary,
    lineHeight: scale.hp(2.5),
    flex: 1,
  },
  emailDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: scale.hp(1.5),
    borderRadius: scale.hp(1),
    marginBottom: scale.hp(2),
    marginLeft: scale.wp(5),
  },
  emailText: {
    fontSize: scale.hp(1.75),
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  editText: {
    fontSize: scale.hp(1.75),
    color: Colors.primary,
    fontWeight: '500',
  },
  contactDomainButton: {
    backgroundColor: '#f0f0f0',
    padding: scale.hp(1.5),
    borderRadius: scale.hp(1),
    alignItems: 'center',
    marginTop: scale.hp(1),
    marginLeft: scale.wp(5),
  },
  contactDomainText: {
    fontSize: scale.hp(1.75),
    color: Colors.primary,
    fontWeight: '500',
  },
  modalButtons: {
    marginTop: scale.hp(3),
    gap: scale.hp(1.5),
  },
  modalButton: {
    padding: scale.hp(2),
    borderRadius: scale.hp(1.25),
    alignItems: 'center',
  },
  resendButton: {
    backgroundColor: Colors.primary,
  },
  resendButtonText: {
    color: Colors.white,
    fontSize: scale.hp(2),
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#f5f5f5',
  },
  closeButtonText: {
    color: Colors.textSecondary,
    fontSize: scale.hp(2),
    fontWeight: '600',
  },
});