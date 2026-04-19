import React, { useEffect, useState, useCallback, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/auth/AuthProvider";
import AccessFromAuth from "./src/acl/AccessFromAuth";
import { UserProvider } from "./src/context/userContext";
import { SocketProvider } from "./src/context/SocketContext"; 
import * as Font from "expo-font";
import { Fonts } from "./src/utils/fonts";
import { StripeProvider } from '@stripe/stripe-react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dmsansRegular from './assets/fonts/dmsansRegular.ttf';
import dmsansMedium from './assets/fonts/dmsansMedium.ttf';
import dmsansBold from './assets/fonts/dmsansBold.ttf';
import { LanguageProvider, useLanguage } from "./src/context/LanguageContext";
import { initI18n } from "./src/locales/i18n";
import { View, ActivityIndicator, Text, LogBox, Platform, Alert } from "react-native";
import { I18nManager } from 'react-native';
import { getAppLanguage } from './src/utils/setupLanguage';
import { isRTL } from './src/utils/rtl';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import './src/utils/polyfills';
import InternetConnectionMonitor from "./src/components/InternetConnectionMonitor";

LogBox.ignoreAllLogs();


const checkBiometricStatus = async () => {
    try {
        const value = await AsyncStorage.getItem('@biometric_enabled');
        return value !== null ? JSON.parse(value) : false;
    } catch (error) {
        console.error('Error checking biometric status:', error);
        return false;
    }
};

const authenticateWithBiometrics = async () => {
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
                [{ text: 'OK', onPress: () => {} }]
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

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.log('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text>Something went wrong. Please restart the app.</Text>
                </View>
            );
        }

        return this.props.children;
    }
}

const CustomNavigationContainer = ({ children }) => {
    const { currentLanguage } = useLanguage();
    const [navKey, setNavKey] = useState(0);

    useEffect(() => {
        setNavKey(prev => prev + 1);
    }, [currentLanguage]);

    return (
        <ErrorBoundary>
            <NavigationContainer key={navKey}>
                {children}
            </NavigationContainer>
        </ErrorBoundary>
    );
};

function MainAppContent() {
    const navigationRef = useRef();

      const handleInternetDisconnected = useCallback(() => {
  
    if (navigationRef.current) {
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    }
  }, []);
    return (
        <QueryClientProvider client={new QueryClient()}>
            <SafeAreaProvider>
                <StripeProvider
                    publishableKey={"pk_live_51PjnW7Dm4BYR9WtRSJE00wPLN2IcZnGsFz3hICqy4rmJc7CuSgm4ZeHaxOeCgN2lj6ST2vWEKEYChsQJC7V0JShi00bIrFHtrs"}
                >
                    <UserProvider>
                          
                        <AuthProvider>
                          <SocketProvider>
                            <AccessFromAuth>
                                  <InternetConnectionMonitor 
                    onInternetDisconnected={handleInternetDisconnected} 
                  />
              
                                <CustomNavigationContainer>
                                    <RootNavigator />
                                </CustomNavigationContainer>
                            </AccessFromAuth>
                          </SocketProvider>
                        </AuthProvider>
                          
                    </UserProvider>
                </StripeProvider>
            </SafeAreaProvider>
        </QueryClientProvider>
    );
}

function LanguageAwareApp() {
    const { needsRestart, resetRestart, currentLanguage } = useLanguage();
    const [showLoading, setShowLoading] = useState(false);
    
    useEffect(() => {
        if (needsRestart) {
            setShowLoading(true);
            
            const shouldBeRTL = isRTL(currentLanguage);
            I18nManager.allowRTL(shouldBeRTL);
            I18nManager.forceRTL(shouldBeRTL);

            const timer = setTimeout(() => {
                resetRestart();
                setShowLoading(false);
            }, 500);
            
            return () => clearTimeout(timer);
        }
    }, [needsRestart, currentLanguage, resetRestart]);
    
    if (needsRestart && showLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#D70000" />
                <Text style={{ marginTop: 10 }}>Updating layout...</Text>
            </View>
        );
    }

    return <MainAppContent />;
}


function BiometricAuthWrapper({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    useEffect(() => {
        const checkAuthentication = async () => {
            try {
                const authResult = await authenticateWithBiometrics();
                setIsAuthenticated(authResult);
            } catch (error) {
                console.error('Authentication error:', error);
                setIsAuthenticated(false);
            } finally {
                setIsCheckingAuth(false);
            }
        };

        checkAuthentication();
    }, []);

    if (isCheckingAuth) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white }}>
                <ActivityIndicator size="large" color="#D70000" />
                <Text style={{ marginTop: 10 }}>Verifying identity...</Text>
            </View>
        );
    }

    if (!isAuthenticated) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white }}>
                <Text style={{ fontSize: 18, marginBottom: 20, textAlign: 'center' }}>
                    Authentication failed
                </Text>
                <Text style={{ textAlign: 'center', marginBottom: 30, color: '#666' }}>
                    Please restart the app and try again.
                </Text>
                <Pressable 
                    style={{ 
                        backgroundColor: '#D70000', 
                        paddingHorizontal: 20, 
                        paddingVertical: 10, 
                        borderRadius: 5 
                    }}
                    onPress={() => {
                        setIsCheckingAuth(true);
                        setIsAuthenticated(false);
                        setTimeout(async () => {
                            const authResult = await authenticateWithBiometrics();
                            setIsAuthenticated(authResult);
                            setIsCheckingAuth(false);
                        }, 500);
                    }}
                >
                    <Text style={{ color: 'white' }}>Try Again</Text>
                </Pressable>
            </View>
        );
    }

    return children;
}

export default function App() {
    const [fontsLoaded, setFontsLoaded] = useState(false);
    const [i18nInitialized, setI18nInitialized] = useState(false);
    const [appKey, setAppKey] = useState(0);
    const [biometricChecked, setBiometricChecked] = useState(false);
    const [skipBiometric, setSkipBiometric] = useState(false);

    const handleLanguageChange = useCallback((newLanguage, rtlChanged) => {
        if (rtlChanged) {
            setAppKey(prevKey => prevKey + 1);
        }
    }, []);

    useEffect(() => {
        if (Platform.OS === 'android') {
            const originalCreateElement = React.createElement;
            React.createElement = function (type, props, ...children) {
                if (props && props.onTouchEnd) {
                    const originalOnTouchEnd = props.onTouchEnd;
                    props.onTouchEnd = (e) => {
                        try {
                            return originalOnTouchEnd(e);
                        } catch (error) {
                            if (!error.message.includes('trackedTouchCount')) {
                                console.error(error);
                            }
                        }
                    };
                }
                return originalCreateElement.apply(this, [type, props, ...children]);
            };
        }

        async function prepareApp() {
            try {
                await Font.loadAsync({
                    [Fonts.REGULAR]: dmsansRegular,
                    [Fonts.MEDIUM]: dmsansMedium,
                    [Fonts.BOLD]: dmsansBold,
                });

                await initI18n();
                
                const langCode = await getAppLanguage();
                const shouldBeRTL = isRTL(langCode);
                
                if (I18nManager.isRTL !== shouldBeRTL) {
                    I18nManager.allowRTL(shouldBeRTL);
                    I18nManager.forceRTL(shouldBeRTL);
                }

                setFontsLoaded(true);
                setI18nInitialized(true);
            } catch (error) {
                console.error('Error preparing app:', error);
                setFontsLoaded(true);
                setI18nInitialized(true);
            }
        }

        prepareApp();
    }, []);

    if (!fontsLoaded || !i18nInitialized) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#D70000" />
            </View>
        );
    }

    return (
        <ErrorBoundary>
            <LanguageProvider onLanguageChange={handleLanguageChange}>
                <BiometricAuthWrapper>
                    <LanguageAwareApp key={appKey} />
                </BiometricAuthWrapper>
            </LanguageProvider>
        </ErrorBoundary>
    );
}


const Colors = {
    white: '#FFFFFF',

};