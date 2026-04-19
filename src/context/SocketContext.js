// contexts/SocketProvider.js
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Platform, Alert, AppState, Vibration, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import socketManager from '../utils/socketManager';

const NOTIFICATIONS_STORAGE_KEY = 'yescharge_notifications';
const UNREAD_COUNT_STORAGE_KEY = 'yescharge_unread_count';
const PUSH_TOKEN_STORAGE_KEY = 'yescharge_push_token';
const USER_PUSH_REGISTERED_KEY = 'yescharge_push_registered';
const SOCKET_URL = 'https://prod-admin.yes-charge.com/';
const BACKEND_URL = 'https://prod-admin.yes-charge.com/';

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
  const listenersSetupRef = useRef(false);

  const currentStateRef = useRef({
    user: null,
    authed: false,
    expoPushToken: null,
    fcmToken: null,
    isPushTokenRegistered: false,
    socketConnected: false,
  });

  const isExpoGo = Constants.appOwnership === 'expo';

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
        
        if (tokenData.type === 'fcm') {
          setFcmToken(tokenData.data);
          setExpoPushToken(tokenData.data);
        } else {
          setExpoPushToken(tokenData.data);
        }
        
        return tokenData.data;
      } else {
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

 const requestNotificationPermissions = useCallback(async () => {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      if (existingStatus === 'granted') {
        return 'granted';
      }

      const { status } = await Notifications.requestPermissionsAsync();
      return status;
    } else {
      return 'granted';
    }
  } catch (error) {
    console.error('❌ Error requesting permissions:', error);
    return 'undetermined';
  }
}, []);

  const registerPushTokenWithServer = useCallback(async (token) => {
    const currentState = currentStateRef.current;
    const currentUser = currentState.user;

   const userId = currentUser?.id || currentUser?.uid;
  
  if (!userId || !currentState.authed || !token || !currentUser?.token) {
    console.log('Cannot register push token: Missing requirements');
    return false;
  }
    try {
      const endpoint = `${BACKEND_URL}/backend/v1/notifications/register-push-token`;
      
      const isExpoToken = token.startsWith('ExponentPushToken[');
      const isFCMToken = token.includes(':APA91b') || token.includes('fcm:') || token.startsWith('czP_');
      
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
        userId: userId.toString(),
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
        fcmToken: fcmTokenValue,
        tokenType: tokenType,
        firebaseProjectId: 'yes-charge',
        firebaseServiceAccount: 'firebase-adminsdk-fbsvc@yes-charge.iam.gserviceaccount.com'
      };

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

  const triggerPushTokenRegistration = useCallback(async (force = false) => {
    const currentState = currentStateRef.current;
    const currentUser = currentState.user;
    
    const userId = currentUser?.id || currentUser?.uid;
      console.log('🚀 Triggering push registration:', {
    userId: userId,
    hasId: !!currentUser?.id,
    hasUid: !!currentUser?.uid,
    hasToken: !!currentState.expoPushToken,
    authed: currentState.authed,
    force
  });
    
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
    
   if (!userId || !currentState.authed || !currentUser?.token) {
    console.log('❌ Missing requirements for registration');
    return false;
  }
    
    const isFCMToken = actualToken.includes(':APA91b') || actualToken.startsWith('czP_');
    console.log('🔍 Token analysis:', {
      tokenPreview: actualToken.substring(0, 30) + '...',
      isFCMToken,
      tokenLength: actualToken.length
    });
    
    const timeSinceLastAttempt = Date.now() - lastRegistrationAttemptRef.current;
    const shouldSkip = !force && timeSinceLastAttempt < 30000;
    
    if (shouldSkip && currentState.isPushTokenRegistered) {
      console.log('⏭️ Skipping - already registered and recent attempt');
      return true;
    }
    
    console.log('📤 Attempting registration with token type:', isFCMToken ? 'FCM' : 'Expo');
    
    try {
      const success = await registerPushTokenWithServer(actualToken);
      return success;
    } catch (error) {
      console.error('❌ Registration error:', error);
      return false;
    }
  }, [registerPushTokenWithServer, getPushToken]);

  const setupNotifications = useCallback(async () => {
    if (setupCompleteRef.current) {
      console.log('⏭️ Setup already complete, skipping...');
      return;
    }

    try {
      const permissionStatus = await requestNotificationPermissions();
      
      if (permissionStatus !== 'granted') {
        setNotificationsAvailable(false);
        
        if (permissionStatus === 'denied' && Platform.OS === 'android') {
          console.log('Permissions denied, will ask again later');
        }
        return;
      }
      
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
          console.warn('Could not create notification channel:', channelError);
        }
      }
      
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
      
      const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
      if (storedToken !== token) {
        await AsyncStorage.setItem(USER_PUSH_REGISTERED_KEY, 'false');
        setIsPushTokenRegistered(false);
        hasAttemptedPushRegistrationRef.current = false;
      }
      
      setExpoPushToken(token);
      await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
      
      setNotificationsAvailable(true);
      
      setupNotificationListeners();
      
      setupCompleteRef.current = true;
      
      const currentState = currentStateRef.current;
      if (currentState.authed && currentState.user?.id && currentState.user?.token) {
        setTimeout(() => {
          triggerPushTokenRegistration(true);
        }, 2000);
      }
      
    } catch (error) {
      console.error('❌ ERROR setting up notifications:', error);
      setNotificationsAvailable(false);
    }
  }, [requestNotificationPermissions, verifyFCMConfiguration, isExpoGo, navigation, getPushToken, triggerPushTokenRegistration]);

  const setupNotificationListeners = useCallback(() => {
    cleanupNotificationListeners();
    
    notificationSubscriptionRef.current = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data;
      console.log('📱 Push notification received:', data);
      if (data) {
        handleNotificationFromPush(data);
      }
      Vibration.vibrate(300);
    });
    
    responseSubscriptionRef.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('👆 Push notification tapped:', data);
      if (data?.id) {
        handleMarkAsRead(data.id);
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

  const handleNotificationFromPush = useCallback((notificationData) => {
    if (!notificationData) return;
    
    console.log('📱 Processing push notification:', {
      id: notificationData.id || notificationData.notificationId,
      type: notificationData.type,
      data: notificationData
    });
    

    const newNotification = {
      id: notificationData.id || notificationData.notificationId || `push-${Date.now()}`,
      title: notificationData.title || { en: "YES Charge" },
      description: notificationData.body || notificationData.description || { en: "New notification" },
      from: notificationData.from || "YES Charge",
      isRead: notificationData.isRead || false,
      createdAt: notificationData.createdAt || notificationData.timestamp || new Date().toISOString(),
      notificationType: notificationData.notificationType || { name: notificationData.type || "General" },
      notiType: notificationData.notiType || notificationData.type || 'general',
      data: notificationData,
      receivedViaPush: true,
      type: notificationData.type,
      receiver: notificationData.receiver,
      orderId: notificationData.orderId,
      txnNumber: notificationData.txnNumber
    };

    console.log('📝 Adding push notification to state:', newNotification.id);
    addNotification(newNotification);
    

    const currentSocket = socketManager.getSocket();
    if (currentSocket && socketManager.getIsConnected() && user?.id) {
      console.log('📡 Also emitting push notification via socket');
      currentSocket.emit('push_notification_received', {
        notificationId: newNotification.id,
        userId: user.id
      });
    }
  }, [user?.id]);

  const addNotification = useCallback((notification) => {
    if (!isMountedRef.current || !notification) return;
    
    console.log('➕ Adding notification to state:', notification.id);
    
    setNotifications(prev => {
      const exists = prev.some(notif => notif.id === notification.id);
      if (exists) {
        console.log('⚠️ Notification already exists:', notification.id);
        return prev;
      }
      
      const newNotification = {
        ...notification,
        isRead: notification.isRead || false,
        createdAt: notification.createdAt || new Date().toISOString()
      };
      
      const updated = [newNotification, ...prev].slice(0, 100);
      
      console.log('💾 Saving notifications to storage:', updated.length);
      AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      
      return updated;
    });
    
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
      AsyncStorage.setItem(UNREAD_COUNT_STORAGE_KEY, (unreadCount + 1).toString());
    }
  }, [unreadCount]);

  const handleNotificationsUpdate = useCallback((notificationsList) => {
  if (!Array.isArray(notificationsList)) return;
  
  console.log('📡 SocketProvider: Received all_notifications:', notificationsList.length);
  
  const formattedNotifications = notificationsList.map(notif => ({
    id: notif.id,
    title: notif.title,
    description: notif.description,
    isRead: notif.isRead || notif.isReead || false,
    createdAt: notif.createdAt,
    notificationType: notif.notificationType,
    notiType: notif.notiType,
    from: notif.from,
    data: notif.data || {},
  }));

  setNotifications(formattedNotifications);
  
  const unread = formattedNotifications.filter(n => !n.isRead).length;
  setUnreadCount(unread);

  AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(formattedNotifications));
  AsyncStorage.setItem(UNREAD_COUNT_STORAGE_KEY, unread.toString());
  
  console.log('💾 SocketProvider: Saved notifications to storage:', formattedNotifications.length);
}, []);
  const handleSystemNotification = useCallback((notification) => {
    if (!notification) return;
    
    console.log('📡 SocketProvider: Received system notification:', notification.id);
    
    const newNotification = {
      id: notification.id || `socket-${Date.now()}`,
      title: notification.title,
      description: notification.description,
      from: notification.from || "Yes Charge",
      isRead: notification.isRead || false,
      createdAt: notification.createdAt || new Date().toISOString(),
      notificationType: notification.notificationType || { name: "General" },
      data: notification,
      receivedViaSocket: true,
    };

    addNotification(newNotification);
  }, [addNotification]);

  const loadStoredNotifications = useCallback(async () => {
    try {
      const [savedNotifications, savedUnreadCount] = await Promise.all([
        AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY),
        AsyncStorage.getItem(UNREAD_COUNT_STORAGE_KEY)
      ]);

      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        console.log('📂 SocketProvider: Loaded notifications from storage:', parsed.length);
        setNotifications(parsed);
      }
      if (savedUnreadCount) {
        const count = parseInt(savedUnreadCount, 10);
        setUnreadCount(count);
        console.log('📊 SocketProvider: Loaded unread count from storage:', count);
      }
    } catch (error) {
      console.error('❌ SocketProvider: Error loading notifications:', error);
    }
  }, []);

  const checkBackgroundNotifications = useCallback(async () => {
    try {
      const initialNotification = await Notifications.getLastNotificationResponseAsync();
      if (initialNotification) {
        const data = initialNotification.notification.request.content.data;
        if (data) {
          console.log('📱 SocketProvider: Found background notification:', data.id);
          handleNotificationFromPush(data);
          if (data.id) {
            handleMarkAsRead(data.id);
          }
          handleNotificationTap(data);
        }
      }
    } catch (error) {
      console.error('❌ SocketProvider: Error checking background notifications:', error);
    }
  }, [handleNotificationFromPush]);

  const connectSocket = useCallback(() => {
    const currentState = currentStateRef.current;
    const currentUser = currentState.user;
    const userId = currentUser?.id || currentUser?.uid;
   console.log('🔌 SocketProvider.connectSocket() called:', {
    hasUser: !!currentUser,
    userId: userId,
    hasId: !!currentUser?.id,
    hasUid: !!currentUser?.uid,
    isAuthed: currentState.authed,
    hasToken: !!currentUser?.token,
    alreadyConnected: socketManager.getIsConnected()
  });
    
   if (socketManager.getIsConnected()) {
    console.log('✅ SocketProvider: Already connected, skipping connection');
    setIsConnected(true);
    socketConnectedRef.current = true;
    currentStateRef.current.socketConnected = true;
    return;
  }
    
    if (!userId || !currentState.authed || !currentUser?.token) {
    console.log('🚫 SocketProvider: Cannot connect socket - missing requirements');
    return;
  }
  
  console.log('🔄 SocketProvider: Creating new socket connection...');
  
    
    try {
        if (socketManager.getSocket()) {
          console.log('🔌 SocketProvider: Disconnecting existing socket...');
          socketManager.disconnect();
        }
        
        const socketInstance = socketManager.connect(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        auth: {
          token: currentUser.token,
          userId: userId.toString(), 
          role: currentUser.role || 'customer',
          email: currentUser.email || '',
          username: currentUser.username || ''
        },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 15000,
        forceNew: true,
        query: {
          userId: userId.toString(),
          platform: Platform.OS,
          appVersion: Constants.expoConfig?.version || '1.0.0',
          timestamp: Date.now()
        }
      });
      
      console.log('✅ SocketProvider: Socket instance created:', !!socketInstance);
      setSocket(socketInstance);
      
    } catch (error) {
      console.error('❌ SocketProvider: Error connecting socket:', error);
    }
  }, []);

  const disconnectSocket = useCallback(() => {
    console.log('🔌 SocketProvider: Disconnecting socket');
    socketManager.disconnect();
    setSocket(null);
    setIsConnected(false);
    socketConnectedRef.current = false;
    currentStateRef.current.socketConnected = false;
  }, []);

  const setupSocketListeners = useCallback(() => {
  if (listenersSetupRef.current) {
    console.log('⏭️ SocketProvider: Listeners already setup, skipping...');
    return () => {};
  }
  
  console.log('🎧 SocketProvider: Setting up socket listeners...');
  listenersSetupRef.current = true;
  
  const handleConnect = (socketId) => {
    console.log('🎉 SocketProvider: Socket connected via manager! ID:', socketId);
    if (!isMountedRef.current) return;
    
    setIsConnected(true);
    socketConnectedRef.current = true;
    currentStateRef.current.socketConnected = true;
    
    console.log('✅ SocketProvider: Connection state updated');
    

    const currentSocket = socketManager.getSocket();
    if (currentSocket && user?.id && user?.token) {
      console.log('📝 SocketProvider: Registering user with socket server');
      currentSocket.emit('register', {
        userId: user.id.toString(),
        role: user.role || 'customer',
        username: user.username,
        email: user.email,
        token: user.token
      });
    }
    

    setTimeout(() => {
      if (socketManager.getIsConnected() && user?.id) {
        console.log('📡 SocketProvider: Fetching notifications after connection');
        getNotifications();
      }
    }, 500);
    
    const currentState = currentStateRef.current;
    const currentUser = currentState.user;
    
    if (currentState.expoPushToken && !currentState.isPushTokenRegistered) {
      setTimeout(() => {
        triggerPushTokenRegistration(true);
      }, 1000);
    }
  };
  
  const handleDisconnect = (reason) => {
    console.log('🔌 SocketProvider: Socket disconnected via manager. Reason:', reason);
    if (!isMountedRef.current) return;
    
    setIsConnected(false);
    socketConnectedRef.current = false;
    currentStateRef.current.socketConnected = false;
    listenersSetupRef.current = false; // Reset the ref
  };
  
  const handleSystemNotification = (notification) => {
    console.log('📡 SocketProvider: Received system notification via manager:', notification.id);
    if (!isMountedRef.current) return;
    
    // Call the actual handler
    const newNotification = {
      id: notification.id || `socket-${Date.now()}`,
      title: notification.title,
      description: notification.description,
      from: notification.from || "Yes Charge",
      isRead: notification.isRead || false,
      createdAt: notification.createdAt || new Date().toISOString(),
      notificationType: notification.notificationType || { name: "General" },
      data: notification,
      receivedViaSocket: true,
    };

    addNotification(newNotification);
  };
  
  const handleAllNotifications = (notificationsList) => {
    console.log('📡 SocketProvider: Received all_notifications via manager:', notificationsList?.length);
    if (!isMountedRef.current) return;
    
    handleNotificationsUpdate(notificationsList);
  };
  
  const handleConnectError = (error) => {
    console.error('❌ SocketProvider: Connection error via manager:', error);
    if (!isMountedRef.current) return;
    
    setIsConnected(false);
    socketConnectedRef.current = false;
    currentStateRef.current.socketConnected = false;
  };
  
  // Add listeners to socket manager
  socketManager.on('connect', handleConnect);
  socketManager.on('disconnect', handleDisconnect);
  socketManager.on('system_notification', handleSystemNotification);
  socketManager.on('all_notifications', handleAllNotifications);
  socketManager.on('connect_error', handleConnectError);
  
  console.log('✅ SocketProvider: Socket listeners setup complete');
  
  // Return cleanup function
  return () => {
    console.log('🧹 SocketProvider: Cleaning up socket listeners');
    socketManager.off('connect', handleConnect);
    socketManager.off('disconnect', handleDisconnect);
    socketManager.off('system_notification', handleSystemNotification);
    socketManager.off('all_notifications', handleAllNotifications);
    socketManager.off('connect_error', handleConnectError);
    listenersSetupRef.current = false;
  };
}, [user, getNotifications, triggerPushTokenRegistration, handleNotificationsUpdate, addNotification]);

  const getNotifications = useCallback(() => {
    const currentSocket = socketManager.getSocket();
    const userId = user?.id || user?.uid;
    
    if (currentSocket && socketManager.getIsConnected() && userId) {
      console.log('📡 SocketProvider: Requesting notifications for user:', userId);
      currentSocket.emit('get_notifications', { 
        userId: userId.toString(),
        userType: user?.role || 'customer'
      });
    } else {
      console.log('⚠️ SocketProvider: Cannot get notifications:', {
        socket: !!currentSocket,
        connected: socketManager.getIsConnected(),
        userId
      });
    }
  }, [user?.id, user?.uid, user?.role]);

  const handleMarkAsRead = useCallback(async (notificationId) => {
    const currentSocket = socketManager.getSocket();
    if (currentSocket && socketManager.getIsConnected()) {
      console.log('📝 SocketProvider: Marking notification as read via socket:', notificationId);
      currentSocket.emit('mark_as_read', { notificationId });
      return true;
    }
    console.log('⚠️ SocketProvider: Cannot mark as read - socket not connected');
    return false;
  }, []);

  const handleDeleteNotification = useCallback(async (notificationId) => {
    const currentSocket = socketManager.getSocket();
    if (currentSocket && socketManager.getIsConnected()) {
      console.log('🗑️ SocketProvider: Deleting notification via socket:', notificationId);
      currentSocket.emit('delete_notification', { notificationId });
      return true;
    }
    console.log('⚠️ SocketProvider: Cannot delete - socket not connected');
    return false;
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    const currentSocket = socketManager.getSocket();
    const userId = user?.id || user?.uid;
    
    if (currentSocket && socketManager.getIsConnected() && userId) {
      console.log('📝 SocketProvider: Marking all notifications as read for user:', userId);
      currentSocket.emit('mark_all_read', { userId: userId.toString() });
      return true;
    }
    console.log('⚠️ SocketProvider: Cannot mark all as read - socket not connected or user not available');
    return false;
  }, [user?.id, user?.uid]);

  const handleRefreshNotifications = useCallback(async () => {
    console.log('🔄 SocketProvider: Refreshing notifications');
    getNotifications();
  }, [getNotifications]);

  const handleNotificationTap = useCallback((notificationData) => {
    if (!notificationData || !navigation) return;
    
    console.log('👆 SocketProvider: Notification tapped:', notificationData.type);
    
    const type = notificationData.type || notificationData.notificationType?.name?.toLowerCase();
    
    switch(type) {
      case 'order':
      case 'booking':
        if (notificationData.orderId) {
          console.log('📍 SocketProvider: Navigating to OrderDetails:', notificationData.orderId);
          navigation.navigate('OrderDetails', { orderId: notificationData.orderId });
        } else if (notificationData.bookingId) {
          console.log('📍 SocketProvider: Navigating to BookingDetails:', notificationData.bookingId);
          navigation.navigate('BookingDetails', { bookingId: notificationData.bookingId });
        }
        break;
      default:
        console.log('📍 SocketProvider: Navigating to Notifications screen');
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
      const response = await fetch(`${BACKEND_URL}/backend/v1/notifications/test-push`, {
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

  // Handle auth changes
  useEffect(() => {
    if (isInitializing) {
      return;
    }
    
    if (authListenerRef.current) {
      clearTimeout(authListenerRef.current);
      authListenerRef.current = null;
    }
    
    authListenerRef.current = setTimeout(() => {
      const userId = user?.id || user?.uid;
      const isUserAuthed = authed && userId && user?.token;
      
      console.log('🔐 SocketProvider: Auth state check:', {
        authed,
        userId,
        hasToken: !!user?.token,
        isUserAuthed,
        alreadyConnected: socketManager.getIsConnected()
      });
      
      if (isUserAuthed) {
        // Only connect if not already connected
        if (!socketManager.getIsConnected()) {
          console.log('🔌 SocketProvider: User authenticated, connecting socket...');
          connectSocket();
        } else {
          console.log('✅ SocketProvider: Already connected, skipping connection');
          setIsConnected(true);
          socketConnectedRef.current = true;
          currentStateRef.current.socketConnected = true;
        }
        
        // Always try to get notifications if connected
        setTimeout(() => {
          if (socketManager.getIsConnected() && userId) {
            console.log('📡 SocketProvider: Fetching notifications...');
            getNotifications();
          }
        }, 1000);
        
        // Push registration
        if (expoPushToken && !isPushTokenRegistered) {
          setTimeout(() => {
            triggerPushTokenRegistration(true);
          }, 2000);
        }
      } else {
        console.log('🔌 SocketProvider: User not authenticated, disconnecting socket');
        disconnectSocket();
      }
    }, 500);
    
    return () => {
      if (authListenerRef.current) {
        clearTimeout(authListenerRef.current);
        authListenerRef.current = null;
      }
    };
  }, [authed, user, isInitializing, connectSocket, disconnectSocket, expoPushToken, isPushTokenRegistered, triggerPushTokenRegistration, getNotifications]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('📱 SocketProvider: App came to foreground, refreshing notifications');
        
        // Refresh notifications
        setTimeout(() => {
          getNotifications();
        }, 500);
        
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
  }, [authed, user?.id, expoPushToken, isPushTokenRegistered, triggerPushTokenRegistration, getNotifications]);

  // Initial setup
  useEffect(() => {
    if (initializationStartedRef.current) {
      return;
    }
    
    initializationStartedRef.current = true;
    isMountedRef.current = true;
    
    const initialize = async () => {
      try {
        console.log('🚀 SocketProvider: Initializing...');
        await loadStoredNotifications();
        
        await setupNotifications();
        
        await checkBackgroundNotifications();
        
        setIsInitializing(false);
        console.log('✅ SocketProvider: Initialized');
        
      } catch (error) {
        console.error('❌ SocketProvider: Error initializing:', error);
        setIsInitializing(false);
      }
    };
    
    initialize();
    
    return () => {
      console.log('🧹 SocketProvider: Cleaning up');
      isMountedRef.current = false;
      initializationStartedRef.current = false;
      setupCompleteRef.current = false;
      listenersSetupRef.current = false;
      
      cleanupNotificationListeners();
      
      disconnectSocket();
      if (authListenerRef.current) {
        clearTimeout(authListenerRef.current);
        authListenerRef.current = null;
      }
    };
  }, [
    setupNotifications,
    loadStoredNotifications,
    checkBackgroundNotifications,
    cleanupNotificationListeners,
    disconnectSocket
  ]);

  // Setup socket listeners when socket is available
  useEffect(() => {
    console.log('🔍 SocketProvider: Checking if should setup socket listeners');
    
    const socketInstance = socketManager.getSocket();
    const isManagerConnected = socketManager.getIsConnected();
    
    console.log('🔍 SocketProvider: Socket status:', {
      hasSocket: !!socketInstance,
      isManagerConnected,
      socketConnected: socketInstance?.connected
    });
    
    if (socketInstance || isManagerConnected) {
      console.log('🎧 SocketProvider: Setting up listeners...');
      const cleanup = setupSocketListeners();
      
      // If already connected, trigger connect handler
      if (isManagerConnected && socketInstance?.id) {
        console.log('🔍 SocketProvider: Socket already connected, triggering connect handler');
        setTimeout(() => {
          setIsConnected(true);
          socketConnectedRef.current = true;
          currentStateRef.current.socketConnected = true;
          
          // Get notifications
          const userId = user?.id || user?.uid;
          if (userId) {
            setTimeout(() => {
              getNotifications();
            }, 1000);
          }
        }, 100);
      }
      
      return cleanup;
    } else {
      console.log('⚠️ SocketProvider: Cannot setup listeners - no socket or not connected');
      return () => {};
    }
  }, [setupSocketListeners, user, getNotifications]);

  // Debug: Log notifications state changes
  useEffect(() => {
    console.log('📊 SocketProvider: Notifications state updated:', {
      count: notifications.length,
      unreadCount,
      isConnected,
      socketConnected: socketManager.getIsConnected()
    });
  }, [notifications, unreadCount, isConnected]);

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
    refreshNotifications: handleRefreshNotifications,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDeleteNotification,
    reconnect: () => {
      console.log('🔄 SocketProvider: Manual reconnect triggered');
      connectSocket();
    },
    disconnect: disconnectSocket,
    triggerPushRegistrationNow: async (force = false) => {
      return await triggerPushTokenRegistration(force);
    },
    sendTestPushNotification: async () => {
      return await testDirectPushAPI();
    },
    testDirectPushAPI: async () => {
      return await testDirectPushAPI();
    },
    addNotification,
    checkConnection: () => {
      console.log('🔍 SocketProvider: Connection check:', {
        socketManagerStatus: socketManager.getIsConnected(),
        localIsConnected: isConnected,
        userAuthed: authed,
        userId: user?.id || user?.uid
      });
    },
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};