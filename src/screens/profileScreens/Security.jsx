import { Text, View, Pressable,SafeAreaView, Alert, Modal, TouchableOpacity, Animated, Easing, Dimensions, StatusBar } from "react-native"
import { Colors } from "../../theme/colors";

import ServiceHeader from "../../components/ServiceHeader";
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useState, useEffect, use } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from "react-i18next";
import SuccessModal from "../../components/modals/SuccessModal";
import ErrorModal from "../../components/modals/ErrorModal";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";
import { scale } from "../../utils/normalizeSize";

const { width, height } = Dimensions.get('window');

const SecurityScreen = ({ navigation }) => {
    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
    

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    
    const [toggleAnim] = useState(new Animated.Value(0));
    const { t } = useTranslation();
    
    const goBack = () => navigation.goBack();

    useEffect(() => {
        loadBiometricPreference();
    }, []);

    useEffect(() => {
        Animated.spring(toggleAnim, {
            toValue: isBiometricEnabled ? 1 : 0,
            tension: 100,
            friction: 10,
            useNativeDriver: true,
        }).start();
    }, [isBiometricEnabled]);

    const showCustomSuccessModal = (message) => {
        setSuccessMessage(message);
        setShowSuccessModal(true);
    };

    const showCustomErrorModal = (message) => {
        setErrorMessage(message);
        setShowErrorModal(true);
    };

    const showConfirmationModal = () => {
        setShowConfirmModal(true);
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        setSuccessMessage("");
    };

    const handleErrorClose = () => {
        setShowErrorModal(false);
        setErrorMessage("");
    };

    const handleConfirmClose = () => {
        setShowConfirmModal(false);
    };

    const loadBiometricPreference = async () => {
        try {
            const value = await AsyncStorage.getItem('@biometric_enabled');
            if (value !== null) {
                setIsBiometricEnabled(JSON.parse(value));
            }
        } catch (error) {
            console.error('Error loading biometric preference:', error);
            showCustomErrorModal('Failed to load biometric settings. Please try again.');
        }
    };

    const saveBiometricPreference = async (value) => {
        try {
            await AsyncStorage.setItem('@biometric_enabled', JSON.stringify(value));
        } catch (error) {
            console.error('Error saving biometric preference:', error);
            showCustomErrorModal('Failed to save biometric settings. Please try again.');
        }
    };

    const checkBiometricAvailability = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            
            if (!hasHardware) {
                showCustomErrorModal('Biometric authentication is not available on this device.');
                return false;
            }
            
            if (!isEnrolled) {
                showCustomErrorModal('No biometric data found. Please set up biometric authentication in your device settings.');
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Biometric availability check error:', error);
            showCustomErrorModal('Failed to check biometric availability. Please try again.');
            return false;
        }
    };

    const authenticateWithBiometrics = async () => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to enable biometric login',
                fallbackLabel: 'Use passcode',
            });
            
            return result.success;
        } catch (error) {
            console.error('Biometric authentication error:', error);
            showCustomErrorModal('Biometric authentication failed. Please try again.');
            return false;
        }
    };

    const handleBiometricToggle = async () => {
        if (!isBiometricEnabled) {
            const isAvailable = await checkBiometricAvailability();
            if (!isAvailable) return;
            
            const isAuthenticated = await authenticateWithBiometrics();
            if (isAuthenticated) {
                setIsBiometricEnabled(true);
                await saveBiometricPreference(true);
                showCustomSuccessModal('Biometric authentication has been enabled successfully!');
            }
        } else {
            showConfirmationModal();
        }
    };

    const confirmDisableBiometric = async () => {
        try {
            setIsBiometricEnabled(false);
            await saveBiometricPreference(false);
            setShowConfirmModal(false);
            showCustomSuccessModal('Biometric authentication has been disabled.');
        } catch (error) {
            console.error('Error disabling biometric:', error);
            showCustomErrorModal('Failed to disable biometric authentication. Please try again.');
        }
    };

    const changePassword = () => {
        navigation.navigate('ChangePassword');
    };

    const CustomToggle = ({ isEnabled, onToggle }) => {
        const translateX = toggleAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [2, 26],
        });

        const backgroundColor = toggleAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['#E0E0E0', '#CD0202'],
        });

        return (
            <TouchableOpacity onPress={onToggle} activeOpacity={0.8}>
                <Animated.View style={[styles.toggleContainer, { backgroundColor }]}>
                    <Animated.View style={[styles.toggleCircle, { transform: [{ translateX }] }]}>
                        <Ionicons 
                            name={isEnabled ? "checkmark" : "close"} 
                            size={14} 
                            color={isEnabled ? "#CD0202" : "#9E9E9E"} 
                        />
                    </Animated.View>
                </Animated.View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
            <ServiceHeader title={t("security")} onBack={goBack} />
            
            <View style={styles.contentContainer}>
                <Pressable 
                    style={styles.optionRow}
                    onPress={handleBiometricToggle}
                >
                    <View style={styles.optionLeft}>
                        <View style={[styles.iconWrapper, isBiometricEnabled ? styles.iconEnabled : styles.iconDisabled]}>
                            <MaterialCommunityIcons 
                                name="fingerprint" 
                                size={22} 
                                color={isBiometricEnabled ? "#fff" : "#757575"} 
                            />
                        </View>
                        <View style={styles.optionText}>
                            <Text style={styles.optionTitle}>{t("biometricAuthentication")}</Text>
                            <Text style={styles.optionSubtitle}>
                                {isBiometricEnabled ? t('useFingerprintFaceID') : t('enableForFasterAccess')}
                            </Text>
                        </View>
                    </View>
                    <CustomToggle isEnabled={isBiometricEnabled} onToggle={handleBiometricToggle} />
                </Pressable>
{/* <Pressable 
  style={styles.optionRow}
  onPress={changePassword}
>
  <View style={styles.optionLeft}>
    <View style={[styles.iconWrapper, styles.passwordIcon]}>
      <MaterialIcons 
        name="lock" 
        size={22} 
        color="#fff" 
      />
    </View>
    <View style={styles.optionText}>
      <Text style={styles.optionTitle}>{t("changePassword")}</Text>
      <Text style={styles.optionSubtitle}>
        {t('updateYourPasswordRegularly')}
      </Text>
    </View>
  </View>
  <MaterialIcons 
    name="chevron-right" 
    size={24} 
    color="#BDBDBD" 
  />
</Pressable> */}
             
            </View>

      
            <SuccessModal
                visible={showSuccessModal}
                onClose={handleSuccessClose}
                title="Success!"
                message={successMessage}
                buttonText="Continue"
                autoHideDuration={3000}
            />

          
            <ErrorModal
                visible={showErrorModal}
                onClose={handleErrorClose}
                title="Error"
                message={errorMessage}
                buttonText="Try Again"
                showRetryButton={true}
            />

          
            <DeleteConfirmationModal
                visible={showConfirmModal}
                onCancel={handleConfirmClose}
                onConfirm={confirmDisableBiometric}
                title="Disable Biometric Authentication"
                message="Are you sure you want to disable biometric authentication? You'll need to use your password for login."
                confirmText="Disable"
                cancelText="Cancel"
                itemName="Biometric Authentication"
            />
        </SafeAreaView>
    );
};

const styles = {
  contentContainer: {
    marginTop: 0,
    paddingHorizontal: scale.wp(6.2),
  },
  optionRow: {
    paddingHorizontal: scale.wp(5.2),
    borderRadius: scale.hp(2.1),
    paddingVertical: scale.hp(2.6),
    marginBottom: scale.hp(2.1),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: "#F5F5F5",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale.hp(0.25) },
    shadowOpacity: 0.04,
    shadowRadius: scale.hp(1.55),
    elevation: 3,
  },
  passwordIcon: {
  backgroundColor: '#CD0202',
},
  optionLeft: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconWrapper: {
    width: scale.wp(11.4),
    height: scale.wp(11.4),
    borderRadius: scale.hp(1.55),
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: scale.wp(4.2),
  },
  iconEnabled: {
    backgroundColor: '#CD0202',
  },
  iconDisabled: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  passwordIcon: {
    backgroundColor: '#2196F3',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: scale.hp(2.1),
    fontWeight: '600',
    color: '#333',
    marginBottom: scale.hp(0.5),
  },
  optionSubtitle: {
    fontSize: scale.hp(1.8),
    color: '#666',
    lineHeight: scale.hp(2.35),
  },
  toggleContainer: {
    width: scale.wp(13.5),
    direction: "ltr",
    height: scale.hp(3.6),
    borderRadius: scale.hp(2.1),
    padding: scale.hp(0.25),
    justifyContent: 'center',
  },
  toggleCircle: {
    width: scale.wp(6.2),
    height: scale.wp(6.2),
    borderRadius: scale.wp(3.1),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale.hp(0.25) },
    shadowOpacity: 0.1,
    shadowRadius: scale.hp(0.4),
    elevation: 2,
  },
};

export default SecurityScreen;