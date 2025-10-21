import { SafeAreaView, Text, View, Pressable, Alert, Modal, TouchableOpacity, Animated, Easing, Dimensions, StatusBar } from "react-native"
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useState, useEffect, use } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get('window');

const SecurityScreen = ({ navigation }) => {
    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalIcon, setModalIcon] = useState('checkmark-circle');
    const [confirmAction, setConfirmAction] = useState(null);
    const [scaleAnim] = useState(new Animated.Value(0));
    const [fadeAnim] = useState(new Animated.Value(0));
    const [confirmScaleAnim] = useState(new Animated.Value(0));
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

    const showCustomSuccessModal = (message, icon = 'checkmark-circle') => {
        setModalMessage(message);
        setModalIcon(icon);
        setShowSuccessModal(true);
        
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            })
        ]).start();

        setTimeout(() => {
            hideModal();
        }, 2000);
    };

    const showConfirmationModal = (action) => {
        setConfirmAction(() => action);
        setShowConfirmModal(true);
        
        Animated.spring(confirmScaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
        }).start();
    };

    const hideModal = () => {
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 0,
                duration: 200,
                easing: Easing.in(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                easing: Easing.in(Easing.ease),
                useNativeDriver: true,
            })
        ]).start(() => {
            setShowSuccessModal(false);
        });
    };

    const hideConfirmModal = () => {
        Animated.timing(confirmScaleAnim, {
            toValue: 0,
            duration: 200,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
        }).start(() => {
            setShowConfirmModal(false);
            setConfirmAction(null);
        });
    };

    const handleConfirm = () => {
        hideConfirmModal();
        if (confirmAction) {
            confirmAction();
        }
    };

    const loadBiometricPreference = async () => {
        try {
            const value = await AsyncStorage.getItem('@biometric_enabled');
            if (value !== null) {
                setIsBiometricEnabled(JSON.parse(value));
            }
        } catch (error) {
            console.error('Error loading biometric preference:', error);
        }
    };

    const saveBiometricPreference = async (value) => {
        try {
            await AsyncStorage.setItem('@biometric_enabled', JSON.stringify(value));
        } catch (error) {
            console.error('Error saving biometric preference:', error);
        }
    };

    const checkBiometricAvailability = async () => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        
        if (!hasHardware) {
            Alert.alert('Error', 'Biometric authentication is not available on this device.');
            return false;
        }
        
        if (!isEnrolled) {
            Alert.alert('Error', 'No biometric data found. Please set up biometric authentication in your device settings.');
            return false;
        }
        
        return true;
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
                showCustomSuccessModal('Biometric authentication has been enabled successfully!', 'checkmark-done');
            } else {
                Alert.alert('Authentication Failed', 'Could not enable biometric authentication. Please try again.');
            }
        } else {
            showConfirmationModal(async () => {
                setIsBiometricEnabled(false);
                await saveBiometricPreference(false);
                showCustomSuccessModal('Biometric authentication has been disabled.', 'checkmark-done');
            });
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

    const SuccessModal = () => (
        <Modal
            visible={showSuccessModal}
            transparent={true}
            animationType="none"
            statusBarTranslucent={true}
            onRequestClose={hideModal}
        >
            <View style={styles.fullScreenModal}>
                <StatusBar backgroundColor="rgba(0, 0, 0, 0.8)" barStyle="light-content" />
                <Animated.View style={[styles.fullScreenBackdrop, { opacity: fadeAnim }]}>
                    <TouchableOpacity 
                        style={styles.fullScreenBackdropTouchable}
                        activeOpacity={1}
                        onPress={hideModal}
                    />
                    
                    <Animated.View style={[
                        styles.modalContainer,
                        {
                            transform: [
                                { scale: scaleAnim },
                                {
                                    translateY: scaleAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [50, 0]
                                    })
                                }
                            ]
                        }
                    ]}>
                        <View style={styles.iconContainer}>
                            <Ionicons name={modalIcon} size={48} color="#fff" />
                        </View>
                        
                        <Text style={styles.successTitle}>{t('success!')}</Text>
                        <Text style={styles.successMessage}>
                            {modalMessage}
                        </Text>
                        
                        <View style={styles.progressBar}>
                            <Animated.View style={[
                                styles.progressFill,
                                {
                                    width: fadeAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%']
                                    })
                                }
                            ]} />
                        </View>
                    </Animated.View>
                </Animated.View>
            </View>
        </Modal>
    );

    const ConfirmationModal = () => (
        <Modal
            visible={showConfirmModal}
            transparent={true}
            animationType="none"
            statusBarTranslucent={true}
            onRequestClose={hideConfirmModal}
        >
            <View style={styles.fullScreenModal}>
                <StatusBar backgroundColor="rgba(0, 0, 0, 0.8)" barStyle="light-content" />
                <View style={styles.fullScreenBackdrop}>
                    <TouchableOpacity 
                        style={styles.fullScreenBackdropTouchable}
                        activeOpacity={1}
                        onPress={hideConfirmModal}
                    />
                    
                    <Animated.View style={[
                        styles.confirmModalContainer,
                        {
                            transform: [
                                { scale: confirmScaleAnim },
                                {
                                    translateY: confirmScaleAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [50, 0]
                                    })
                                }
                            ]
                        }
                    ]}>
                     
                        <View style={styles.confirmIconContainer}>
                            <Ionicons name="warning" size={100} color="#FF9800" />
                        </View>
                        
                     
                        <View style={styles.confirmContent}>
                            <Text style={styles.confirmTitle}>{t('disableBiometricAuth')}</Text>
                            <Text style={styles.confirmMessage}>
                           {t("you'llNeedPassword")}
                            </Text>
                        </View>
                        
                  
                        <View style={styles.confirmActions}>
                            <TouchableOpacity 
                                style={[styles.confirmButton, styles.cancelButton]}
                                onPress={hideConfirmModal}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.confirmButtonText, styles.cancelButtonText]}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.confirmButton, styles.disableButton]}
                                onPress={handleConfirm}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.confirmButtonText, styles.disableButtonText]}>{t("disable")}</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
            <ServiceHeader title="Security" onBack={goBack} />
            
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
                                {isBiometricEnabled ? t('useFingerprintFaceID') : Text('enableForFasterAccess')}
                            </Text>
                        </View>
                    </View>
                    <CustomToggle isEnabled={isBiometricEnabled} onToggle={handleBiometricToggle} />
                </Pressable> 
            </View>

            <SuccessModal />
            <ConfirmationModal />
        </SafeAreaView>
    );
};

const styles = {
    contentContainer: {
        marginTop: 0,
        paddingHorizontal: 24,
    },
    optionRow: {
        paddingHorizontal: 20,
        borderRadius: 16,
        paddingVertical: 20,
        marginBottom: 16,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: "#F5F5F5",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
    },
    optionLeft: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    iconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
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
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    optionSubtitle: {
        fontSize: 14,
        color: '#666',
        lineHeight: 18,
    },
    // Toggle Styles
    toggleContainer: {
        width: 52,
        height: 28,
        borderRadius: 16,
        padding: 2,
        justifyContent: 'center',
    },
    toggleCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    // Full Screen Modal Styles
    fullScreenModal: {
        flex: 1,
        width: width,
        height: height,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    fullScreenBackdrop: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenBackdropTouchable: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
    },
    // Success Modal Styles
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        marginHorizontal: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
        elevation: 20,
        maxWidth: 320,
        width: '100%',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#CD0202',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#CD0202',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    successMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    progressBar: {
        width: '100%',
        height: 4,
        backgroundColor: '#F0F0F0',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#CD0202',
        borderRadius: 2,
    },
    // Confirmation Modal Styles
    confirmModalContainer: {
        backgroundColor: '#fff',
        borderRadius: 24,
        marginHorizontal: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 25 },
        shadowOpacity: 0.5,
        shadowRadius: 40,
        elevation: 25,
        maxWidth: 340,
        width: '100%',
    },
    confirmIconContainer: {
        alignItems: 'center',
        paddingVertical: 10,
        backgroundColor: '#FFF3E0',
    },
    confirmContent: {
        paddingHorizontal: 28,
        paddingVertical: 28,
        alignItems: 'center',
    },
    confirmTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
        marginBottom: 16,
        textAlign: 'center',
    },
    confirmMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
    confirmActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 18,
        alignItems: 'center',
    },
    cancelButton: {
        borderRightWidth: 1,
        borderRightColor: '#F0F0F0',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    disableButton: {
        backgroundColor: 'transparent',
    },
    disableButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F44336',
    },
};

export default SecurityScreen;