import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const checkBiometricStatus = async () => {
    try {
        const value = await AsyncStorage.getItem('@biometric_enabled');
        return value !== null ? JSON.parse(value) : false;
    } catch (error) {
        console.error('Error checking biometric status:', error);
        return false;
    }
};

export const authenticateOnAppStart = async () => {
    try {
        const isBiometricEnabled = await checkBiometricStatus();
        
        if (!isBiometricEnabled) {
            return true; 
        }

        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        
        if (!hasHardware || !isEnrolled) {
            Alert.alert(
                'Biometric Error',
                'Biometric authentication is not available. Please use alternative login method.',
                [{ text: 'OK' }]
            );
            return false;
        }

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authenticate to access the app',
            fallbackLabel: 'Use passcode',
        });

        return result.success;
    } catch (error) {
        console.error('Biometric authentication error:', error);
        return false;
    }
};