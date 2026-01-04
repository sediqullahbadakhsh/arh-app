import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Colors } from "../theme/colors";
import AuthHeader from "../components/AuthHeader";
import PrimaryButton from "../components/PrimaryButton";
import OutlineButton from "../components/OutlineButton";
import { useAuth } from "../auth/AuthProvider";
import RoundedInput from "../components/RoundedInput";
import Checkbox from "../components/Checkbox";
import { useUser } from "../context/userContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { scale } from "../utils/normalizeSize";
import { 
  requestMerchantPasswordReset,
  generateAgentForgotPasswordOtp,
  verifyAgentForgotPasswordOtp,
  resetAgentPasswordViaForgot 
} from "../services/authApi";
import { useTranslation } from "react-i18next";

export default function PasswordLoginScreen({ route, navigation }) {
  const { target = "" } = route.params || {}; 
  const { user, setUser } = useUser();
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState(target || "");
  const [rememberMe, setRememberMe] = useState(false);
  const [busy, setBusy] = useState(false);
  
  const [forgotPasswordModal, setForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState(target || "");
  const [sendingResetLink, setSendingResetLink] = useState(false);
  
  const [otpStep, setOtpStep] = useState("email"); 
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  
  const auth = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    const getRememberMeDetails = async () => {
      try {
        const storedData = await AsyncStorage.getItem("rememberMe");
        if (!storedData) return;

        const credentials = JSON.parse(storedData);

        if (!credentials?.email || !credentials?.password) return;

        setEmail(credentials.email);
        setPassword(credentials.password);
        setRememberMe(true);
      } catch (error) {
        console.error("Failed to fetch rememberMe data:", error);
      }
    };

    getRememberMeDetails();
  }, []);

  const onLogin = async () => {
    try {
      setBusy(true);

      const res = await auth.loginPassword({ identifier: email, password });
      console.log(res, "this is agent login res👏👏😜");

      const userInfo = {
        token: res.access_token,
        role: res.role,
        roleId: res.role_id,
        id: res.id,
        username: res.username,
        accountType: res?.accountType,
      };

      if (rememberMe) {
        const credentials = {
          email,
          password,
        };
        await AsyncStorage.setItem("rememberMe", JSON.stringify(credentials));
      } else {
        await AsyncStorage.removeItem("rememberMe");
      }

      await AsyncStorage.setItem("user", JSON.stringify(userInfo));
      setUser(userInfo);

      navigation.replace("Tabs");
    } catch (e) {
      Alert.alert(
        t('passwordLogin.title'),
        e?.message || t('passwordLogin.unableToSignIn')
      );
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = () => {
    setForgotPasswordModal(true);
    setForgotPasswordEmail(email);
    setOtpStep("email");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
  };

 const sendResetLink = async () => {
  if (!forgotPasswordEmail.trim()) {
    Alert.alert(t('common.error'), t('passwordLogin.enterEmailAddress'));
    return;
  }

  try {
    setSendingResetLink(true);
    
    const response = await generateAgentForgotPasswordOtp(forgotPasswordEmail.trim());
    
    if (response.status) {
      // Instead of showing an alert that requires user interaction,
      // immediately move to OTP step and show a success message
      setOtpStep("otp");
      
      // Optional: Show a toast or non-blocking success message
      Alert.alert(
        t('common.success'),
        t('passwordLogin.otpSent'),
        [{ text: t('common.ok') }] // No onPress needed since we already changed step
      );
    } else {
      Alert.alert(t('common.error'), response.error || t('passwordLogin.failedToSendOtp'));
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    Alert.alert(
      t('common.error'),
      error.response?.data?.error || error.message || t('passwordLogin.failedToSendOtpTryAgain')
    );
  } finally {
    setSendingResetLink(false);
  }
};
  const verifyOtp = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert(t('common.error'), t('passwordLogin.enterValidOtp'));
      return;
    }

    try {
      setOtpLoading(true);
      
      const response = await verifyAgentForgotPasswordOtp({ 
        email: forgotPasswordEmail.trim(), 
        otp: otp.trim() 
      });
      
      if (response.status) {
        Alert.alert(
          t('common.success'),
          t('passwordLogin.otpVerified'),
          [
            {
              text: t('common.ok'),
              onPress: () => setOtpStep("newPassword")
            }
          ]
        );
      } else {
        Alert.alert(t('common.error'), response.error || t('passwordLogin.invalidOtp'));
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      Alert.alert(
        t('common.error'),
        error.response?.data?.error || error.message || t('passwordLogin.invalidOtpTryAgain')
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert(t('common.error'), t('passwordLogin.enterBothPasswords'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('passwordLogin.passwordsDoNotMatch'));
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(t('common.error'), t('passwordLogin.passwordMinLength'));
      return;
    }

    try {
      setOtpLoading(true);
      
      const response = await resetAgentPasswordViaForgot({ 
        email: forgotPasswordEmail.trim(),
        otp: otp.trim(),
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim()
      });
      
      if (response.status) {
        Alert.alert(
          t('common.success'),
          t('passwordLogin.passwordResetSuccess'),
          [
            {
              text: t('common.ok'),
              onPress: () => {
                setForgotPasswordModal(false);
                setOtpStep("email");
                setOtp("");
                setNewPassword("");
                setConfirmPassword("");
              }
            }
          ]
        );
      } else {
        Alert.alert(t('common.error'), response.error || t('passwordLogin.failedToResetPassword'));
      }
    } catch (error) {
      console.error("Reset password error:", error);
      Alert.alert(
        t('common.error'),
        error.response?.data?.error || error.message || t('passwordLogin.failedToResetPasswordTryAgain')
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const renderForgotPasswordStep = () => {
    switch (otpStep) {
      case "email":
        return (
          <View>
            <Text style={styles.modalDescription}>
              {t('passwordLogin.forgotPasswordDescription')}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('passwordLogin.agentEmail')}</Text>
              <TextInput
                style={styles.emailInput}
                value={forgotPasswordEmail}
                onChangeText={setForgotPasswordEmail}
                placeholder={t('passwordLogin.enterAgentEmail')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!sendingResetLink}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setForgotPasswordModal(false)}
                disabled={sendingResetLink}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.submitButton,
                  sendingResetLink && { opacity: 0.7 }
                ]}
                onPress={sendResetLink}
                disabled={sendingResetLink || !forgotPasswordEmail.trim()}
              >
                {sendingResetLink ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>{t('passwordLogin.sendOtp')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );

      case "otp":
        return (
          <View>
            <Text style={styles.modalDescription}>
              {t('passwordLogin.otpDescription', { email: forgotPasswordEmail })}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('passwordLogin.sixDigitOtp')}</Text>
              <TextInput
                style={styles.otpInput}
                value={otp}
                onChangeText={setOtp}
                placeholder={t('passwordLogin.enterOtp')}
                keyboardType="number-pad"
                maxLength={6}
                editable={!otpLoading}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.backButton]}
                onPress={() => setOtpStep("email")}
                disabled={otpLoading}
              >
                <Text style={styles.backButtonText}>{t('common.back')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.submitButton,
                  otpLoading && { opacity: 0.7 }
                ]}
                onPress={verifyOtp}
                disabled={otpLoading || otp.length !== 6}
              >
                {otpLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>{t('passwordLogin.verifyOtp')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );

      case "newPassword":
        return (
          <View>
            <Text style={styles.modalDescription}>
              {t('passwordLogin.createNewPassword')}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('passwordLogin.newPassword')}</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder={t('passwordLogin.enterNewPassword')}
                  secureTextEntry={!passwordVisible}
                  editable={!otpLoading}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setPasswordVisible(!passwordVisible)}
                >
                  <Ionicons 
                    name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} 
                    size={22} 
                    color="#A9A9A9" 
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.passwordHint}>{t('passwordLogin.minimumCharacters')}</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('passwordLogin.confirmPassword')}</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder={t('passwordLogin.confirmNewPassword')}
                  secureTextEntry={!confirmPasswordVisible}
                  editable={!otpLoading}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                >
                  <Ionicons 
                    name={confirmPasswordVisible ? 'eye-off-outline' : 'eye-outline'} 
                    size={22} 
                    color="#A9A9A9" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.backButton]}
                onPress={() => setOtpStep("otp")}
                disabled={otpLoading}
              >
                <Text style={styles.backButtonText}>{t('common.back')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.submitButton,
                  otpLoading && { opacity: 0.7 }
                ]}
                onPress={resetPassword}
                disabled={otpLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              >
                {otpLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>{t('passwordLogin.resetPassword')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );
    }
  };

  const canSubmit = password.trim().length > 0 && !busy;
  const [hidden, setHidden] = useState(true);

  const ForgotPasswordModal = () => (
    <Modal
      visible={forgotPasswordModal}
      transparent={true}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => setForgotPasswordModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {otpStep === "email" ? t('passwordLogin.forgotPassword') : 
               otpStep === "otp" ? t('passwordLogin.verifyOtp') : 
               t('passwordLogin.resetPassword')}
            </Text>
            <TouchableOpacity 
              onPress={() => {
                setForgotPasswordModal(false);
                setOtpStep("email");
              }}
              disabled={otpLoading || sendingResetLink}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {renderForgotPasswordStep()}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthHeader 
        title={t('passwordLogin.agentLogin')} 
        onBack={() => navigation.goBack()} 
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >  
          <View style={styles.container}>
            <View style={{marginTop: 40}}>
              <View style={{marginBottom: 20}}> 
                <Text style={styles.label}>{t('passwordLogin.emailUsername')}</Text>
                <RoundedInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('passwordLogin.enterEmailUsername')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  rightIcon={<Ionicons name="mail-outline" size={24} color="#344054" />}
                  returnKeyType="done"
                  onSubmitEditing={canSubmit ? onLogin : undefined}
                  editable={!busy}
                />
              </View>
              
              <View>
                <Text style={styles.label}>{t('passwordLogin.password')}</Text>
                <RoundedInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('passwordLogin.enterPassword')}
                  secureTextEntry={hidden}
                  rightIcon={
                    <TouchableOpacity onPress={() => setHidden(!hidden)} disabled={busy}>
                      <Ionicons 
                        name={hidden ? 'eye-off-outline' : 'eye-outline'} 
                        size={22} 
                        color="#A9A9A9" 
                      />
                    </TouchableOpacity>
                  }
                  returnKeyType="done"
                  onSubmitEditing={canSubmit ? onLogin : undefined}
                  editable={!busy}
                />
              </View>
            </View>
            
            <View style={styles.optionsRow}>
              <View style={styles.rememberMeContainer}>
                <Checkbox 
                  checked={rememberMe} 
                  onToggle={() => setRememberMe(prev => !prev)}
                  disabled={busy}
                />
                <Text style={styles.rememberMeText}>{t('passwordLogin.rememberMe')}</Text>
              </View>
              
              <TouchableOpacity 
                onPress={handleForgotPassword}
                disabled={busy}
              >
                <Text style={styles.forgotPasswordText}>{t('passwordLogin.forgotPassword')}</Text>
              </TouchableOpacity>
            </View>

            <View style={{marginTop: 60}}>
              <PrimaryButton
                label={busy ? t('passwordLogin.signingIn') : t('passwordLogin.login')}
                onPress={onLogin}
                disabled={!canSubmit}
                style={{ marginTop: 8 }}
              />
            </View>

         
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ForgotPasswordModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
    paddingHorizontal: scale.wp(9.4),
    paddingTop: scale.hp(3.1),
    backgroundColor: Colors.pageBackColor,
  },
  label: {
    marginBottom: 6,
    fontSize: 16,
    fontFamily: 'dmsansMedium',
    color: Colors.textTitle,
  },
  optionsRow: {
    flexDirection: "row",
    marginTop: 8,
    justifyContent: "space-between",
    alignItems: "center",
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rememberMeText: {
    fontFamily: "dmsansRegular",
    fontSize: 14,
    marginStart: 8,
    color: Colors.textTitle,
  },
  forgotPasswordText: {
    fontFamily: "dmsansMedium",
    fontSize: 14,
    color: "#E48D08",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FF",
    padding: 15,
    borderRadius: 8,
    marginTop: 30,
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  infoText: {
    fontFamily: "dmsansRegular",
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 10,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "dmsansBold",
    color: Colors.textPrimary,
  },
  modalDescription: {
    fontSize: 14,
    fontFamily: "dmsansRegular",
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "dmsansMedium",
    color: Colors.textTitle,
    marginBottom: 8,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: "dmsansRegular",
    color: Colors.textPrimary,
    backgroundColor: "#fff",
  },
  otpInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontFamily: "dmsansBold",
    color: Colors.textPrimary,
    backgroundColor: "#fff",
    textAlign: "center",
    letterSpacing: 8,
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    fontFamily: "dmsansRegular",
    color: Colors.textPrimary,
  },
  eyeIcon: {
    padding: 10,
  },
  passwordHint: {
    fontSize: 12,
    fontFamily: "dmsansRegular",
    color: Colors.textSecondary,
    marginTop: 5,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    marginRight: 10,
  },
  cancelButtonText: {
    fontFamily: "dmsansMedium",
    fontSize: 16,
    color: Colors.textSecondary,
  },
  backButton: {
    backgroundColor: "#f5f5f5",
    marginRight: 10,
  },
  backButtonText: {
    fontFamily: "dmsansMedium",
    fontSize: 16,
    color: Colors.textSecondary,
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  submitButtonText: {
    fontFamily: "dmsansMedium",
    fontSize: 16,
    color: Colors.white,
  },
});