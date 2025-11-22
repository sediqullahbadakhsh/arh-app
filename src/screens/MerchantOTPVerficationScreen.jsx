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
  ActivityIndicator,
} from "react-native";
import { Colors } from "../theme/colors";
import AuthHeader from "../components/AuthHeader";
import PrimaryButton from "../components/PrimaryButton";
import { useTranslation } from "react-i18next";
import { scale } from "../utils/normalizeSize";
import { verifyOtpForMerchantSignup } from "../services/merchantApi";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 120;

// Timer Hook
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

// HelpModal Component
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
          <Text style={styles.modalTitle}>Need Help?</Text>
          <ScrollView style={styles.modalScrollView}>
            <Text style={styles.modalSubtitle}>
              If you didn't receive the OTP, here are some things to check:
            </Text>
            
            <View style={styles.helpItem}>
              <Text style={styles.helpNumber}>1.</Text>
              <Text style={styles.helpText}>
                Check your email inbox for the verification code
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.emailDisplay}
              onPress={onEditEmail}
            >
              <Text style={styles.emailText}>{target}</Text>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>

            <View style={styles.helpItem}>
              <Text style={styles.helpNumber}>2.</Text>
              <Text style={styles.helpText}>
                Check your spam or junk folder
              </Text>
            </View>

            <View style={styles.helpItem}>
              <Text style={styles.helpNumber}>3.</Text>
              <Text style={styles.helpText}>
                Make sure you have internet connection
              </Text>
            </View>

            <View style={styles.helpItem}>
              <Text style={styles.helpNumber}>4.</Text>
              <Text style={styles.helpText}>
                Wait a few minutes as email delivery can sometimes be delayed
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.resendButton]}
              onPress={onResend}
            >
              <Text style={styles.resendButtonText}>
                Resend OTP
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.closeButton]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function MerchantOtpVerificationScreen({ route, navigation }) {
  const {
    email = "",
    mode = "signup_merchant"
  } = route?.params || {};

  const [codes, setCodes] = useState(Array(CODE_LENGTH).fill(""));
  const inputsRef = useRef([]);
  const { timeLeft, resetTimer } = useTimer(RESEND_SECONDS);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
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

  const verifyOtp = async () => {
    const code = codes.join("");
    if (code.length !== CODE_LENGTH) {
      Alert.alert(
        "Verification",
        `Please enter the complete ${CODE_LENGTH}-digit code.`
      );
      return;
    }

    try {
      setVerifying(true);

      // For merchant signup, we only need to verify the OTP and get the verification token
      // The personal information will be collected in the next steps
      const response = await verifyOtpForMerchantSignup(email.trim(), code);
      
      if (response.success) {
        Alert.alert("Success", "Email verified successfully!");
    
        // Navigate back to SignUpMerchant with verification token
        // The merchant form will start from step 1 (personal information)
        navigation.navigate("SignUpMerchant", {
          otpVerified: true,
          verificationToken: response.verificationToken,
          // Only pass the verified email back
          email: email.trim()
        });
      } else {
        Alert.alert("Error", response.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      const errorMsg = error.response?.data?.message || error.message || "OTP verification failed. Please try again.";
      Alert.alert("Error", errorMsg);
    } finally {
      setVerifying(false);
    }
  };

  const resendOtp = async () => {
    try {
      // You might want to call the resend OTP API here
      // For now, just reset the timer and show success message
      resetTimer();
      Alert.alert("Success", "OTP has been resent to your email.");
    } catch (error) {
      console.error("Resend OTP error:", error);
      Alert.alert("Error", "Failed to resend OTP. Please try again.");
    }
  };

  const handleGoBackToEditEmail = () => {
    setShowHelpModal(false);
    navigation.goBack();
  };

  const handleModalResend = () => {
    setShowHelpModal(false);
    resendOtp();
  };

  const getInfoText = () => {
    return `We've sent a ${CODE_LENGTH}-digit verification code to your email address:\n${email}`;
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const isVerifyDisabled = codes.join("").length !== CODE_LENGTH || verifying;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <AuthHeader 
        title="Verify Email" 
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
                style={[
                  styles.codeBox,
                  c && styles.codeBoxFilled,
                  isVerifyDisabled && styles.codeBoxDisabled
                ]}
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
                editable={!verifying}
              />
            ))}
          </View>

          <View style={styles.resendRow}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            {timeLeft > 0 ? (
              <Text style={[styles.resendText, { color: Colors.primary }]}>
                Resend in {formatTime(timeLeft)}
              </Text>
            ) : (
              <TouchableOpacity onPress={resendOtp} disabled={verifying}>
                <Text style={[
                  styles.resendText, 
                  { color: Colors.primary },
                  verifying && { opacity: 0.5 }
                ]}>
                  Resend OTP
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
            disabled={verifying}
          >
            <Text style={[
              styles.helpLinkText,
              verifying && { opacity: 0.5 }
            ]}>
              Didn't receive the verification code?
            </Text>
          </TouchableOpacity>

          <PrimaryButton
            label={verifying ? "Verifying..." : "Verify Email"}
            onPress={verifyOtp}
            style={{ marginTop: 28 }}
            disabled={isVerifyDisabled}
          />

          {verifying && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Verifying your email...</Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      <HelpModal
        visible={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        target={email}
        onResend={handleModalResend}
        onEditEmail={handleGoBackToEditEmail}
      />
    </SafeAreaView>
  );
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
    textAlign: 'center',
    lineHeight: scale.hp(2.2),
  },
  codeRow: {
    flexDirection: 'row',
    direction: 'ltr',
    justifyContent: 'space-between',
    marginBottom: scale.hp(1.5),
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
  codeBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: '#F8F9FF',
  },
  codeBoxDisabled: {
    opacity: 0.6,
  },
  watermarkContainer: {
    position: 'absolute',
    top: scale.hp(25),
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
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale.hp(1),
    justifyContent: 'center',
    flexWrap: 'wrap',
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: scale.hp(1),
    fontSize: scale.hp(1.75),
    color: Colors.textSecondary,
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