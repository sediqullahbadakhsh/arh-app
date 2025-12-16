import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Platform, Alert, AppState, Vibration, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import socketManager from '../utils/socketManager';

// Constants
const NOTIFICATIONS_STORAGE_KEY = 'yescharge_notifications';
const UNREAD_COUNT_STORAGE_KEY = 'yescharge_unread_count';
const PUSH_TOKEN_STORAGE_KEY = 'yescharge_push_token';
const USER_PUSH_REGISTERED_KEY = 'yescharge_push_registered';
const SOCKET_URL = 'http://3.67.144.22';
const BACKEND_URL = 'http://3.67.144.22';

// Notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children, navigation }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsAvailable, setNotificationsAvailable] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [isPushTokenRegistered, setIsPushTokenRegistered] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [fcmToken, setFcmToken] = useState(null);
  
  const { user, authed } = useAuth();
  
  // Use refs for subscriptions and state tracking
  const notificationSubscriptionRef = useRef(null);
  const responseSubscriptionRef = useRef(null);
  const isMountedRef = useRef(true);
  const hasAttemptedPushRegistrationRef = useRef(false);
  const socketConnectedRef = useRef(false);
  const lastRegistrationAttemptRef = useRef(0);
  const appStateRef = useRef(AppState.currentState);
  const setupCompleteRef = useRef(false);
  const initializationStartedRef = useRef(false);
  const authListenerRef = useRef(null);

  // Ref to track the actual current state
  const currentStateRef = useRef({
    user: null,
    authed: false,
    expoPushToken: null,
    fcmToken: null,
    isPushTokenRegistered: false,
    socketConnected: false,
  });

  const isExpoGo = Constants.appOwnership === 'expo';

  // Update the ref whenever state changes
  useEffect(() => {
    currentStateRef.current = {
      user,
      authed,
      expoPushToken,
      fcmToken,
      isPushTokenRegistered,
      socketConnected: socketConnectedRef.current,
    };
  }, [user, authed, expoPushToken, fcmToken, isPushTokenRegistered]);

  // ========== FCM CONFIGURATION CHECK ==========
  const verifyFCMConfiguration = useCallback(async () => {
    try {
      if (!isExpoGo) {
        try {
          const tokenData = await Notifications.getDevicePushTokenAsync();
          
          if (tokenData.type === 'fcm') {
            setFcmToken(tokenData.data);
            return {
              success: true,
              token: tokenData.data,
              fcmConfigured: true,
              tokenType: tokenData.type
            };
          }
          
          return { 
            success: true, 
            token: tokenData.data,
            fcmConfigured: true,
            tokenType: tokenData.type
          };
        } catch (tokenError) {
          return {
            success: false,
            error: tokenError.message,
            fcmConfigured: false
          };
        }
      }
      
      return { success: true, fcmConfigured: false };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        fcmConfigured: false
      };
    }
  }, [isExpoGo]);

  // ========== GET PUSH TOKEN (WITH FCM SUPPORT) ==========
 // ========== GET PUSH TOKEN (WITH FCM SUPPORT) ==========
const getPushToken = useCallback(async () => {
  try {
    if (!isExpoGo) {
      const fcmCheck = await verifyFCMConfiguration();
      
      if (!fcmCheck.success) {
        throw new Error('FCM configuration failed: ' + fcmCheck.error);
      }
      
      const tokenData = await Notifications.getDevicePushTokenAsync();
      
      console.log('📱 Device push token received:', {
        type: tokenData.type,
        dataPreview: tokenData.data.substring(0, 30) + '...',
        isFCM: tokenData.type === 'fcm',
        isExpo: tokenData.type === 'expo'
      });
      
      // Store FCM token
      if (tokenData.type === 'fcm') {
        setFcmToken(tokenData.data);
        // Also store as expoPushToken for compatibility
        setExpoPushToken(tokenData.data);
      } else {
        setExpoPushToken(tokenData.data);
      }
      
      return tokenData.data;
    } else {
      // For Expo Go
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      
      const token = tokenData.data;
      setExpoPushToken(token);
      return token;
    }
    
  } catch (error) {
    console.error('❌ Error getting push token:', error);
    
    if (!isExpoGo) {
      if (error.message.includes('FCM') || error.message.includes('Firebase')) {
        Alert.alert(
          'Firebase Configuration Required',
          'Please ensure:\n\n' +
          '1. google-services.json is in the root directory\n' +
          '2. Firebase project is properly configured\n' +
          '3. App is rebuilt with EAS Build\n\n' +
          'Push notifications will not work until FCM is properly configured.',
          [
            { 
              text: 'Check Configuration', 
              onPress: () => {
                if (navigation) {
                  navigation.navigate('FinalPushTest');
                }
              }
            },
            { text: 'OK' }
          ]
        );
      }
    }
    
    throw error;
  }
}, [isExpoGo, verifyFCMConfiguration, navigation]);
  // ========== PERMISSION REQUEST ==========
  const requestNotificationPermissions = useCallback(async () => {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        
        if (existingStatus === 'granted') {
          return 'granted';
        }
        
        Alert.alert(
          'Enable Notifications',
          'Get real-time updates about your orders and bookings. Enable notifications to stay informed.',
          [
            {
              text: 'Not Now',
              style: 'cancel',
              onPress: () => {}
            },
            {
              text: 'Enable',
              onPress: async () => {
                try {
                  const { status } = await Notifications.requestPermissionsAsync();
                  
                  if (status !== 'granted') {
                    Alert.alert(
                      'Notifications Disabled',
                      'You can enable notifications in:\nSettings > Apps > Yes Charge > Notifications',
                      [
                        { text: 'Open Settings', onPress: () => Linking.openSettings() },
                        { text: 'Later', style: 'cancel' }
                      ]
                    );
                  }
                } catch (error) {
                  console.error('Error requesting permissions:', error);
                }
              }
            }
          ]
        );
        
        return existingStatus;
      } else {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          return status;
        }
        
        return existingStatus;
      }
    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
      return 'undetermined';
    }
  }, []);

  // ========== FIXED PUSH TOKEN REGISTRATION FUNCTION ==========
 // ========== FIXED PUSH TOKEN REGISTRATION FUNCTION ==========
const registerPushTokenWithServer = useCallback(async (token) => {
  const currentState = currentStateRef.current;
  const currentUser = currentState.user;

  if (!currentUser?.id || !currentState.authed || !token || !currentUser?.token) {
    console.log('🚫 Cannot register push token: Missing requirements');
    return false;
  }

  try {
    const endpoint = `${BACKEND_URL}/backend/v1/notifications/register-push-token`;
    
    // DETECT TOKEN TYPE CORRECTLY
    const isExpoToken = token.startsWith('ExponentPushToken[');
    const isFCMToken = token.includes(':APA91b') || token.includes('fcm:') || token.startsWith('czP_');
    
    // Set correct token type
    let tokenType = 'expo';
    let fcmTokenValue = null;
    
    if (isFCMToken) {
      tokenType = 'fcm';
      fcmTokenValue = token;
    } else if (isExpoToken) {
      tokenType = 'expo';
      fcmTokenValue = currentState.fcmToken;
    }
    
    console.log('🔍 Token detection:', {
      tokenPreview: token.substring(0, 30) + '...',
      isExpoToken,
      isFCMToken,
      detectedTokenType: tokenType,
      tokenLength: token.length
    });

    const requestBody = {
      userId: currentUser.id.toString(),
      pushToken: token,
      platform: Platform.OS,
      deviceId: Device.deviceName || Device.model || 'Unknown',
      deviceType: Device.deviceType || 0,
      deviceYearClass: Device.deviceYearClass || null,
      deviceName: Device.deviceName || Device.model || 'Unknown',
      osName: Device.osName || Platform.OS,
      osVersion: Device.osVersion || Platform.Version,
      appName: 'Yes Charge',
      appVersion: Constants.expoConfig?.version || '1.0.0',
      appBuild: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1.0.0',
      isExpoGo: isExpoGo,
      appOwnership: Constants.appOwnership,
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
      // IMPORTANT FIX: Set fcmToken correctly
      fcmToken: fcmTokenValue,
      // IMPORTANT FIX: Set tokenType correctly
      tokenType: tokenType,
      firebaseProjectId: 'yes-charge',
      firebaseServiceAccount: 'firebase-adminsdk-fbsvc@yes-charge.iam.gserviceaccount.com'
    };

    console.log('📦 Request body for registration:', {
      tokenPreview: token.substring(0, 30) + '...',
      tokenType,
      hasFcmToken: !!fcmTokenValue,
      isExpoGo,
      projectId: requestBody.projectId
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentUser.token}`,
      },
      body: JSON.stringify(requestBody),
      timeout: 10000,
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Push token registered successfully with type:', tokenType);
      setIsPushTokenRegistered(true);
      await AsyncStorage.setItem(USER_PUSH_REGISTERED_KEY, 'true');
      lastRegistrationAttemptRef.current = Date.now();
      hasAttemptedPushRegistrationRef.current = true;
      
      // Store FCM token separately if it's an FCM token
      if (tokenType === 'fcm') {
        setFcmToken(token);
        await AsyncStorage.setItem('yescharge_fcm_token', token);
      }
      
      return true;
    } else {
      console.warn('⚠️ Failed to register push token with server:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Error registering push token:', error);
    return false;
  }
}, [isExpoGo]);
  // ========== IMPROVED TRIGGER PUSH REGISTRATION ==========
// ========== IMPROVED TRIGGER PUSH REGISTRATION ==========
const triggerPushTokenRegistration = useCallback(async (force = false) => {
  const currentState = currentStateRef.current;
  const currentUser = currentState.user;
  
  console.log('🚀 Triggering push registration:', {
    userId: currentUser?.id,
    hasToken: !!currentState.expoPushToken,
    authed: currentState.authed,
    force
  });
  
  // Get token
  let actualToken = currentState.expoPushToken;
  if (!actualToken) {
    try {
      const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
      if (storedToken) {
        actualToken = storedToken;
        console.log('📱 Retrieved token from storage');
      }
    } catch (error) {
      console.error('❌ Error checking AsyncStorage:', error);
    }
  }
  
  // If still no token, try to get a fresh one
  if (!actualToken) {
    try {
      console.log('🔄 No stored token, getting fresh token...');
      const freshToken = await getPushToken();
      if (freshToken) {
        actualToken = freshToken;
        setExpoPushToken(freshToken);
        await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, freshToken);
        console.log('✅ Got fresh token');
      }
    } catch (error) {
      console.error('❌ Failed to get push token:', error);
      return false;
    }
  }
  
  if (!actualToken) {
    console.log('❌ No push token available');
    return false;
  }
  
  // Verify all requirements
  if (!currentUser?.id || !currentState.authed || !currentUser?.token) {
    console.log('⏸️ Missing requirements for registration');
    return false;
  }
  
  // Check token type
  const isFCMToken = actualToken.includes(':APA91b') || actualToken.startsWith('czP_');
  console.log('🔍 Token analysis:', {
    tokenPreview: actualToken.substring(0, 30) + '...',
    isFCMToken,
    tokenLength: actualToken.length
  });
  
  // Check if we should skip (unless forced)
  const timeSinceLastAttempt = Date.now() - lastRegistrationAttemptRef.current;
  const shouldSkip = !force && timeSinceLastAttempt < 30000; // 30 seconds cooldown
  
  if (shouldSkip && currentState.isPushTokenRegistered) {
    console.log('⏭️ Skipping - already registered and recent attempt');
    return true;
  }
  
  console.log('🎯 Attempting registration with token type:', isFCMToken ? 'FCM' : 'Expo');
  
  try {
    const success = await registerPushTokenWithServer(actualToken);
    return success;
  } catch (error) {
    console.error('❌ Registration error:', error);
    return false;
  }
}, [registerPushTokenWithServer, getPushToken]);

  // ========== SETUP NOTIFICATIONS ==========
  const setupNotifications = useCallback(async () => {
    if (setupCompleteRef.current) {
      console.log('🔄 Setup already complete, skipping...');
      return;
    }

    try {
      // Request permissions first
      const permissionStatus = await requestNotificationPermissions();
      
      if (permissionStatus !== 'granted') {
        setNotificationsAvailable(false);
        
        if (permissionStatus === 'denied' && Platform.OS === 'android') {
          console.log('Permissions denied, will ask again later');
        }
        return;
      }
      
      // Verify FCM configuration for standalone builds
      if (!isExpoGo) {
        const fcmCheck = await verifyFCMConfiguration();
        
        if (!fcmCheck.success) {
          Alert.alert(
            'Firebase Setup Required',
            'Push notifications require Firebase setup.\n\n' +
            'Please ensure:\n' +
            '1. google-services.json is in root directory\n' +
            '2. Firebase project is linked\n' +
            '3. App is rebuilt with EAS\n\n' +
            'Socket notifications will work in the meantime.',
            [
              { 
                text: 'Check Setup', 
                onPress: () => {
                  if (navigation) {
                    navigation.navigate('FinalPushTest');
                  }
                }
              },
              { text: 'OK' }
            ]
          );
          setNotificationsAvailable(false);
          return;
        }
      }
      
      // Setup notification channels for Android
      if (Platform.OS === 'android') {
        try {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
            sound: 'default',
            enableVibrate: true,
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          });
        } catch (channelError) {
          console.warn('⚠️ Could not create notification channel:', channelError);
        }
      }
      
      // Get push token
      let token;
      try {
        token = await getPushToken();
      } catch (tokenError) {
        console.error('❌ Failed to get push token:', tokenError);
        
        if (!isExpoGo) {
          Alert.alert(
            'Firebase Setup Required',
            'Push notifications setup failed. Please ensure:\n\n' +
            '1. google-services.json is in root directory\n' +
            '2. Firebase project is properly configured\n' +
            '3. App is rebuilt with EAS Build\n\n' +
            'Socket notifications will work in the meantime.',
            [
              { 
                text: 'Check Setup', 
                onPress: () => {
                  if (navigation) {
                    navigation.navigate('FinalPushTest');
                  }
                }
              },
              { text: 'OK' }
            ]
          );
        }
        
        setNotificationsAvailable(false);
        return;
      }
      
      // Check if token changed
      const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
      if (storedToken !== token) {
        // Clear registration status when token changes
        await AsyncStorage.setItem(USER_PUSH_REGISTERED_KEY, 'false');
        setIsPushTokenRegistered(false);
        hasAttemptedPushRegistrationRef.current = false;
      }
      
      // Store token
      setExpoPushToken(token);
      await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
      
      // Mark notifications as available
      setNotificationsAvailable(true);
      
      // Setup listeners
      setupNotificationListeners();
      
      // Mark setup as complete
      setupCompleteRef.current = true;
      
      // Force registration if user is already authenticated
      const currentState = currentStateRef.current;
      if (currentState.authed && currentState.user?.id && currentState.user?.token) {
        setTimeout(() => {
          triggerPushTokenRegistration(true);
        }, 2000);
      }
      
    } catch (error) {
      console.error('💥 ERROR setting up notifications:', error);
      setNotificationsAvailable(false);
    }
  }, [requestNotificationPermissions, verifyFCMConfiguration, isExpoGo, navigation, getPushToken, triggerPushTokenRegistration]);

  // ========== HELPER FUNCTIONS ==========
  const setupNotificationListeners = useCallback(() => {
    cleanupNotificationListeners();
    
    notificationSubscriptionRef.current = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data;
      if (data) {
        addNotificationFromPush(data);
      }
      Vibration.vibrate(300);
    });
    
    responseSubscriptionRef.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.id) {
        markAsRead(data.id);
      }
      if (data) {
        handleNotificationTap(data);
      }
    });
  }, []);

  const cleanupNotificationListeners = useCallback(() => {
    if (notificationSubscriptionRef.current) {
      notificationSubscriptionRef.current.remove();
      notificationSubscriptionRef.current = null;
    }
    if (responseSubscriptionRef.current) {
      responseSubscriptionRef.current.remove();
      responseSubscriptionRef.current = null;
    }
  }, []);

  const loadNotificationsFromStorage = useCallback(async () => {
    try {
      const [savedNotifications, savedUnreadCount] = await Promise.all([
        AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY),
        AsyncStorage.getItem(UNREAD_COUNT_STORAGE_KEY)
      ]);

      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
      }
      if (savedUnreadCount) {
        const count = parseInt(savedUnreadCount, 10);
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
    }
  }, []);

  const loadPushTokenStatus = useCallback(async () => {
    try {
      const [savedToken, isRegistered] = await Promise.all([
        AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY),
        AsyncStorage.getItem(USER_PUSH_REGISTERED_KEY)
      ]);
      
      if (savedToken) {
        setExpoPushToken(savedToken);
      }
      
      if (isRegistered === 'true') {
        setIsPushTokenRegistered(true);
        hasAttemptedPushRegistrationRef.current = true;
      }
    } catch (error) {
      console.error('❌ Error loading push token status:', error);
    }
  }, []);

  const checkBackgroundNotifications = useCallback(async () => {
    try {
      const initialNotification = await Notifications.getLastNotificationResponseAsync();
      if (initialNotification) {
        const data = initialNotification.notification.request.content.data;
        if (data) {
          addNotificationFromPush(data);
          if (data.id) {
            markAsRead(data.id);
          }
          handleNotificationTap(data);
        }
      }
    } catch (error) {
      console.error('❌ Error checking background notifications:', error);
    }
  }, []);

  // ========== SOCKET CONNECTION HANDLER ==========
  const connectSocket = useCallback(() => {
    const currentState = currentStateRef.current;
    const currentUser = currentState.user;
    
    if (!currentUser?.id || !currentState.authed || !currentUser?.token) {
      return;
    }
    
    try {
      socketManager.disconnect();
      
      const socketInstance = socketManager.connect(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        auth: {
          token: currentUser.token,
          userId: currentUser.id.toString(),
        },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 10000,
        forceNew: true,
      });
      
      setSocket(socketInstance);
    } catch (error) {
      console.error('❌ Error connecting socket:', error);
    }
  }, []);

  const disconnectSocket = useCallback(() => {
    socketManager.disconnect();
    setSocket(null);
    setIsConnected(false);
    socketConnectedRef.current = false;
    currentStateRef.current.socketConnected = false;
  }, []);

  // ========== AUTH EFFECT ==========
  useEffect(() => {
    if (isInitializing) {
      return;
    }
    
    // Remove any existing listener
    if (authListenerRef.current) {
      clearTimeout(authListenerRef.current);
      authListenerRef.current = null;
    }
    
    // Debounce auth changes to prevent rapid reconnections
    authListenerRef.current = setTimeout(() => {
      if (authed && user?.id && user?.token) {
        connectSocket();
        
        if (expoPushToken && !isPushTokenRegistered) {
          setTimeout(() => {
            triggerPushTokenRegistration(true);
          }, 1000);
        }
      } else {
        disconnectSocket();
      }
    }, 500); // 500ms debounce
    
    return () => {
      if (authListenerRef.current) {
        clearTimeout(authListenerRef.current);
        authListenerRef.current = null;
      }
    };
  }, [authed, user?.id, user?.token, isInitializing, connectSocket, disconnectSocket, expoPushToken, isPushTokenRegistered, triggerPushTokenRegistration]);

  // ========== APP STATE EFFECT ==========
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // Check if we need to re-register push token
        if (authed && user?.id && expoPushToken && !isPushTokenRegistered) {
          setTimeout(() => {
            triggerPushTokenRegistration();
          }, 1000);
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [authed, user?.id, expoPushToken, isPushTokenRegistered, triggerPushTokenRegistration]);

  // ========== NOTIFICATION FUNCTIONS ==========
  const getNotifications = useCallback(() => {
    const currentSocket = socketManager.getSocket();
    if (currentSocket && socketManager.getIsConnected() && user?.id) {
      currentSocket.emit('get_notifications', { 
        userId: user.id,
        role: user.role || 'customer' 
      });
    }
  }, [user?.id, user?.role]);

  const refreshNotifications = useCallback(() => {
    getNotifications();
  }, [getNotifications]);

  const handleNotificationsUpdate = useCallback((notificationsList) => {
    setNotifications(prev => {
      const merged = [...prev];
      notificationsList.forEach(serverNotif => {
        const exists = merged.some(local => local.id === serverNotif.id);
        if (!exists) {
          merged.unshift({
            ...serverNotif,
            isRead: serverNotif.read || serverNotif.isRead || false
          });
        }
      });
      return merged.slice(0, 100);
    });
    
    const unread = notificationsList.filter(n => !(n.read || n.isRead)).length;
    setUnreadCount(unread);
    updateBadgeCount(unread);
  }, []);

  const addNotification = useCallback((notification) => {
    if (!isMountedRef.current || !notification) return;
    
    setNotifications(prev => {
      const exists = prev.some(notif => notif.id === notification.id);
      if (exists) return prev;
      
      const newNotification = {
        ...notification,
        isRead: notification.isRead || false,
        createdAt: notification.createdAt || new Date().toISOString()
      };
      
      return [newNotification, ...prev].slice(0, 100);
    });
    
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  const addNotificationFromPush = useCallback((notificationData) => {
    if (!notificationData) return;
    
    const newNotification = {
      id: notificationData.id || `push-${Date.now()}`,
      title: notificationData.title || { en: "Yes Charge" },
      description: notificationData.body || notificationData.description || { en: "New notification" },
      from: notificationData.from || "Yes Charge",
      isRead: notificationData.isRead || false,
      createdAt: notificationData.createdAt || new Date().toISOString(),
      notificationType: notificationData.notificationType || { name: "General" },
      data: notificationData,
      receivedViaPush: true,
    };

    addNotification(newNotification);
  }, [addNotification]);

  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
    
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    const currentSocket = socketManager.getSocket();
    if (currentSocket && socketManager.getIsConnected()) {
      currentSocket.emit('mark_as_read', { notificationId });
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    setUnreadCount(0);
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    
    const currentSocket = socketManager.getSocket();
    if (currentSocket && socketManager.getIsConnected() && user?.id) {
      currentSocket.emit('mark_all_read', { userId: user.id });
    }
  }, [user?.id]);

  const updateBadgeCount = useCallback(async (count) => {
    if (!notificationsAvailable) return;
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.log('Error updating badge count:', error);
    }
  }, [notificationsAvailable]);

  const handleNotificationTap = useCallback((notificationData) => {
    if (!notificationData || !navigation) return;
    
    const type = notificationData.type || notificationData.notificationType?.name?.toLowerCase();
    
    switch(type) {
      case 'order':
      case 'booking':
        if (notificationData.orderId) {
          navigation.navigate('OrderDetails', { orderId: notificationData.orderId });
        } else if (notificationData.bookingId) {
          navigation.navigate('BookingDetails', { bookingId: notificationData.bookingId });
        }
        break;
      default:
        navigation.navigate('Notifications');
        break;
    }
  }, [navigation]);

  const testDirectPushAPI = useCallback(async () => {
    const currentState = currentStateRef.current;
    const currentUser = currentState.user;
    
    if (!currentUser?.token) {
      Alert.alert('Error', 'No authentication token available');
      return { success: false, error: 'No token' };
    }
    
    try {
      const response = await fetch('http://3.67.144.22/backend/v1/notifications/test-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({
          userId: currentUser.id,
          title: 'Direct API Test',
          body: 'This is a test from direct API call',
          data: {
            type: 'test',
            timestamp: new Date().toISOString(),
            testId: `api-test-${Date.now()}`
          }
        }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        Alert.alert('Success', 'Direct push test sent! Check device.');
        return { success: true, data: result };
      } else {
        Alert.alert('Failed', result.error || 'Unknown error');
        return { success: false, error: result.error };
      }
    } catch (error) {
      Alert.alert('Error', error.message);
      return { success: false, error: error.message };
    }
  }, []);

  // ========== INITIALIZE ON MOUNT ==========
  useEffect(() => {
    // Prevent multiple initializations
    if (initializationStartedRef.current) {
      return;
    }
    
    initializationStartedRef.current = true;
    isMountedRef.current = true;
    
    const initialize = async () => {
      try {
        // Load existing data
        await loadNotificationsFromStorage();
        await loadPushTokenStatus();
        
        // Setup notifications
        await setupNotifications();
        
        // Check for background notifications
        await checkBackgroundNotifications();
        
        setIsInitializing(false);
        
      } catch (error) {
        console.error('❌ Error initializing SocketProvider:', error);
        setIsInitializing(false);
      }
    };
    
    initialize();
    
    // ========== SOCKET EVENT HANDLERS ==========
    const handleConnect = (socketId) => {
      if (!isMountedRef.current) return;
      
      setIsConnected(true);
      socketConnectedRef.current = true;
      currentStateRef.current.socketConnected = true;
      setSocket(socketManager.getSocket());
      
      // Get notifications after connection
      setTimeout(() => {
        getNotifications();
      }, 500);
      
      // Always try to register push token when socket connects
      const currentState = currentStateRef.current;
      const currentUser = currentState.user;
      
      if (!currentUser?.id || !currentState.authed || !currentUser?.token) {
        return;
      }
      
      // If we have a token but it's not registered, try to register
      if (currentState.expoPushToken && !currentState.isPushTokenRegistered) {
        setTimeout(() => {
          triggerPushTokenRegistration(true);
        }, 1000);
      }
    };
    
    const handleDisconnect = (reason) => {
      if (!isMountedRef.current) return;
      
      setIsConnected(false);
      socketConnectedRef.current = false;
      currentStateRef.current.socketConnected = false;
      setSocket(null);
    };
    
    const handleSystemNotification = (notification) => {
      if (!isMountedRef.current || !notification) return;
      
      addNotification(notification);
    };
    
    const handleAllNotifications = (notificationsList) => {
      if (!isMountedRef.current || !Array.isArray(notificationsList)) return;
      
      handleNotificationsUpdate(notificationsList);
    };
    
    // Add listeners
    socketManager.on('connect', handleConnect);
    socketManager.on('disconnect', handleDisconnect);
    socketManager.on('system_notification', handleSystemNotification);
    socketManager.on('all_notifications', handleAllNotifications);
    
    return () => {
      isMountedRef.current = false;
      initializationStartedRef.current = false;
      setupCompleteRef.current = false;
      
      cleanupNotificationListeners();
      
      // Remove listeners
      socketManager.off('connect', handleConnect);
      socketManager.off('disconnect', handleDisconnect);
      socketManager.off('system_notification', handleSystemNotification);
      socketManager.off('all_notifications', handleAllNotifications);
      
      disconnectSocket();
      
      // Clear any pending auth listener
      if (authListenerRef.current) {
        clearTimeout(authListenerRef.current);
        authListenerRef.current = null;
      }
    };
  }, [
    setupNotifications,
    loadNotificationsFromStorage,
    loadPushTokenStatus,
    checkBackgroundNotifications,
    getNotifications,
    handleNotificationsUpdate,
    addNotification,
    triggerPushTokenRegistration,
    cleanupNotificationListeners,
    disconnectSocket
  ]);

  // ========== CONTEXT VALUE ==========
  const value = {
    socket: socketManager.getSocket(),
    isConnected: socketManager.getIsConnected(),
    notifications,
    unreadCount,
    notificationsAvailable,
    expoPushToken,
    fcmToken,
    isPushTokenRegistered,
    getNotifications,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification: useCallback((notificationId) => {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      const currentSocket = socketManager.getSocket();
      if (currentSocket && socketManager.getIsConnected()) {
        currentSocket.emit('delete_notification', { notificationId });
      }
    }, [notifications]),
    clearNotifications: useCallback(() => {
      setNotifications([]);
      setUnreadCount(0);
      AsyncStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
      AsyncStorage.removeItem(UNREAD_COUNT_STORAGE_KEY);
    }, []),
    reconnect: connectSocket,
    disconnect: disconnectSocket,
    sendTestNotification: useCallback(() => {
      const currentSocket = socketManager.getSocket();
      if (currentSocket && socketManager.getIsConnected()) {
        currentSocket.emit('test_notification', { userId: user?.id });
      } else {
        Alert.alert('Error', 'Socket not connected');
      }
    }, [user?.id]),
    
    // Push registration functions
    triggerPushRegistrationNow: async (force = false) => {
      return await triggerPushTokenRegistration(force);
    },
    detectTokenType: (token) => {
    if (!token) return 'unknown';
    if (token.startsWith('ExponentPushToken[')) return 'expo';
    if (token.includes(':APA91b') || token.startsWith('czP_') || token.includes('fcm:')) return 'fcm';
    return 'unknown';
  },
  
  // Get token info
  getTokenInfo: () => {
    const currentState = currentStateRef.current;
    const token = currentState.expoPushToken;
    
    if (!token) return null;
    
    const isExpo = token.startsWith('ExponentPushToken[');
    const isFCM = token.includes(':APA91b') || token.startsWith('czP_') || token.includes('fcm:');
    
    return {
      token: token,
      tokenPreview: token.substring(0, 30) + '...',
      type: isExpo ? 'expo' : isFCM ? 'fcm' : 'unknown',
      length: token.length,
      isExpoToken: isExpo,
      isFCMToken: isFCM
    };
  },
    // Get push token status
    getPushTokenStatus: () => {
      const currentState = currentStateRef.current;
      const currentUser = currentState.user;
      
      return {
        hasToken: !!currentState.expoPushToken,
        token: currentState.expoPushToken,
        tokenPreview: currentState.expoPushToken ? currentState.expoPushToken.substring(0, 30) + '...' : null,
        hasFcmToken: !!currentState.fcmToken,
        fcmToken: currentState.fcmToken,
        userId: currentUser?.id,
        authed: currentState.authed,
        isRegistered: currentState.isPushTokenRegistered,
        hasUserToken: !!currentUser?.token,
        socketConnected: currentState.socketConnected,
        notificationsAvailable: notificationsAvailable,
        platform: Platform.OS,
        isExpoGo,
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
        firebaseConfigured: !isExpoGo && !!currentState.fcmToken
      };
    },
    
    // Send test push notification
    sendTestPushNotification: async () => {
      return await testDirectPushAPI();
    },
    
    testDirectPushAPI: async () => {
      return await testDirectPushAPI();
    },
    
    debugPushRegistration: () => {
      const currentState = currentStateRef.current;
      const currentUser = currentState.user;
      
      console.log('🔍 ===== PUSH REGISTRATION DEBUG =====');
      console.log('📱 Expo Push Token:', currentState.expoPushToken);
      console.log('🔥 FCM Token:', currentState.fcmToken);
      console.log('👤 User ID:', currentUser?.id);
      console.log('🔐 Authenticated:', currentState.authed);
      console.log('🏷️ Already Registered:', currentState.isPushTokenRegistered);
      console.log('🔑 User Token:', currentUser?.token ? 'Present' : 'Missing');
      console.log('🔌 Socket Connected:', currentState.socketConnected);
      console.log('📱 Platform:', Platform.OS);
      console.log('📱 Expo Go?', isExpoGo);
      console.log('🔥 Firebase Configured:', !isExpoGo && !!currentState.fcmToken);
      console.log('🔔 Notifications Available:', notificationsAvailable);
      console.log('📱 Project ID:', Constants.expoConfig?.extra?.eas?.projectId);
      console.log('📱 App Version:', Constants.expoConfig?.version);
      console.log('====================================');
      
      return {
        expoPushToken: currentState.expoPushToken,
        fcmToken: currentState.fcmToken,
        userId: currentUser?.id,
        authed: currentState.authed,
        isPushTokenRegistered: currentState.isPushTokenRegistered,
        hasUserToken: !!currentUser?.token,
        socketConnected: currentState.socketConnected,
        platform: Platform.OS,
        isExpoGo,
        firebaseConfigured: !isExpoGo && !!currentState.fcmToken,
        notificationsAvailable,
        projectId: Constants.expoConfig?.extra?.eas?.projectId
      };
    },
    
    manuallyRegisterPushToken: async () => {
      const currentState = currentStateRef.current;
      const currentUser = currentState.user;
      
      if (!currentState.expoPushToken) {
        Alert.alert('Error', 'No push token available');
        return false;
      }
      
      if (!currentUser?.id || !currentState.authed) {
        Alert.alert('Error', 'User not authenticated');
        return false;
      }
      
      const success = await registerPushTokenWithServer(currentState.expoPushToken);
      
      if (success) {
        Alert.alert('Success', 'Push token registered with backend!');
      } else {
        Alert.alert('Failed', 'Could not register push token');
      }
      
      return success;
    },
    
    forceReRegisterPushToken: async () => {
      await AsyncStorage.setItem(USER_PUSH_REGISTERED_KEY, 'false');
      setIsPushTokenRegistered(false);
      hasAttemptedPushRegistrationRef.current = false;
      return await triggerPushTokenRegistration(true);
    },
    
    resetPushConfiguration: async () => {
      try {
        await AsyncStorage.multiRemove([
          PUSH_TOKEN_STORAGE_KEY,
          USER_PUSH_REGISTERED_KEY,
          NOTIFICATIONS_STORAGE_KEY,
          UNREAD_COUNT_STORAGE_KEY
        ]);
        
        setExpoPushToken(null);
        setFcmToken(null);
        setIsPushTokenRegistered(false);
        setNotifications([]);
        setUnreadCount(0);
        hasAttemptedPushRegistrationRef.current = false;
        setupCompleteRef.current = false;
        
        // Setup notifications again
        await setupNotifications();
        
        return true;
      } catch (error) {
        console.error('❌ Error resetting push configuration:', error);
        return false;
      }
    },
    
    // Get fresh push token
    getFreshPushToken: async () => {
      try {
        const token = await getPushToken();
        if (token) {
          setExpoPushToken(token);
          await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
          return token;
        }
        return null;
      } catch (error) {
        console.error('❌ Error getting fresh push token:', error);
        return null;
      }
    },
    
    // Firebase specific functions
    verifyFirebaseConfiguration: async () => {
      return await verifyFCMConfiguration();
    },
    
    // Check if Firebase is properly configured
    checkFirebaseSetup: () => {
      const hasGoogleServices = !!Constants.expoConfig?.android?.googleServicesFile;
      const isStandalone = !isExpoGo;
      const hasFcmToken = !!fcmToken;
      
      return {
        hasGoogleServices,
        isStandalone,
        hasFcmToken,
        firebaseReady: isStandalone && hasFcmToken,
        serviceAccount: 'firebase-adminsdk-fbsvc@yes-charge.iam.gserviceaccount.com',
        firebaseProjectId: 'yes-charge'
      };
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};