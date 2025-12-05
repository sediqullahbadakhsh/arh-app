import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Platform, Alert, AppState, Vibration } from 'react-native';
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
  
  const { user, authed } = useAuth();
  
  // Use refs for subscriptions
  const notificationSubscriptionRef = useRef(null);
  const responseSubscriptionRef = useRef(null);
  const isMountedRef = useRef(true);
  const hasAttemptedPushRegistrationRef = useRef(false);
  const socketConnectedRef = useRef(false);
  const lastRegistrationAttemptRef = useRef(0);

  // Ref to track the actual current state
  const currentStateRef = useRef({
    user: null,
    authed: false,
    expoPushToken: null,
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
      isPushTokenRegistered,
      socketConnected: socketConnectedRef.current,
    };
    
    console.log('🔄 Updated currentStateRef:', {
      userId: user?.id,
      authed,
      hasExpoPushToken: !!expoPushToken,
      isPushTokenRegistered
    });
  }, [user, authed, expoPushToken, isPushTokenRegistered]);

  // ========== FIXED PUSH TOKEN REGISTRATION FUNCTION ==========
  const registerPushTokenWithServer = useCallback(async (token) => {
    console.log('🎯 ========== REGISTER PUSH TOKEN CALLED ==========');
    
    const currentState = currentStateRef.current;
    const currentUser = currentState.user;
    
    console.log('🔍 Registration prerequisites:', {
      hasUserId: !!currentUser?.id,
      userId: currentUser?.id,
      authed: currentState.authed,
      hasToken: !!token,
      tokenLength: token?.length,
      tokenPreview: token?.substring(0, 30) + '...',
      hasUserToken: !!currentUser?.token
    });

    if (!currentUser?.id || !currentState.authed || !token || !currentUser?.token) {
      console.log('🚫 Cannot register push token: Missing requirements');
      return false;
    }

    try {
      // Use /backend prefix since NGINX doesn't strip it
      const endpoint = `${BACKEND_URL}/backend/v1/notifications/register-push-token`;
      console.log('🌐 Using endpoint:', endpoint);
      
      const requestBody = {
        userId: currentUser.id.toString(), // Ensure string
        pushToken: token,
        platform: Platform.OS,
        deviceId: Device.deviceName || 'Unknown',
        appName: 'Yes Charge',
        appVersion: '1.0.0'
      };
      
      console.log('📦 Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Response status:', response.status);
      
      const result = await response.json();
      console.log('📦 Response data:', result);
      
      if (response.ok && result.success) {
        console.log('✅ Push token registered with server successfully!');
        setIsPushTokenRegistered(true);
        await AsyncStorage.setItem(USER_PUSH_REGISTERED_KEY, 'true');
        lastRegistrationAttemptRef.current = Date.now();
        console.log('💾 Registration status saved locally');
        return true;
      } else {
        console.warn('⚠️ Failed to register push token with server:', result);
        return false;
      }
    } catch (error) {
      console.error('❌ Error registering push token:', error);
      return false;
    }
  }, []);

  // ========== IMPROVED TRIGGER PUSH REGISTRATION ==========
  const triggerPushTokenRegistration = useCallback(async (force = false) => {
    console.log('🚀 ===== TRIGGERING PUSH TOKEN REGISTRATION =====');
    
    const currentState = currentStateRef.current;
    const currentUser = currentState.user;
    
    console.log('🔍 CURRENT LIVE STATE from ref:', {
      userId: currentUser?.id,
      authed: currentState.authed,
      userToken: !!currentUser?.token,
      isPushTokenRegistered: currentState.isPushTokenRegistered,
      hasExpoPushToken: !!currentState.expoPushToken,
      forceMode: force
    });
    
    // Get token
    let actualToken = currentState.expoPushToken;
    if (!actualToken) {
      try {
        const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
        if (storedToken) {
          actualToken = storedToken;
        }
      } catch (error) {
        console.error('❌ Error checking AsyncStorage:', error);
      }
    }
    
    if (!actualToken) {
      console.log('❌ No push token available');
      return false;
    }
    
    // Verify all requirements
    if (!currentUser?.id || !currentState.authed || !currentUser?.token) {
      console.log('⏸️ Missing requirements:', {
        missingUserId: !currentUser?.id,
        notAuthed: !currentState.authed,
        missingUserToken: !currentUser?.token
      });
      return false;
    }
    
    // Check if we should skip (unless forced)
    const timeSinceLastAttempt = Date.now() - lastRegistrationAttemptRef.current;
    const shouldSkip = !force && timeSinceLastAttempt < 30000; // 30 seconds cooldown
    
    if (shouldSkip) {
      console.log('⏭️ Skipping registration - attempted recently');
      return false;
    }
    
    console.log('🎯 All conditions met! Registering push token...');
    
    try {
      const success = await registerPushTokenWithServer(actualToken);
      
      if (success) {
        console.log('🎉 Push token registered successfully!');
        return true;
      } else {
        console.log('⚠️ Push token registration failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      return false;
    }
  }, [registerPushTokenWithServer]);

  // ========== AUTH EFFECT ==========
  useEffect(() => {
    if (isInitializing) {
      return;
    }
    
    console.log('🔐 Auth state changed:', {
      authed,
      userId: user?.id,
      userToken: !!user?.token,
      isPushTokenRegistered,
      socketConnected: socketConnectedRef.current
    });
    
    if (authed && user?.id && user?.token) {
      console.log('🔐 User authenticated, connecting socket...');
      connectSocket();
    } else {
      console.log('🔐 User not authenticated, disconnecting socket...');
      disconnectSocket();
    }
  }, [authed, user?.id, user?.token, isInitializing]);

  // ========== SOCKET CONNECTION HANDLER ==========
  const connectSocket = useCallback(() => {
    console.log('🔗 Attempting socket connection via manager...');
    
    const currentState = currentStateRef.current;
    const currentUser = currentState.user;
    
    if (!currentUser?.id || !currentState.authed || !currentUser?.token) {
      console.log('🚫 No valid user, skipping socket connection');
      return;
    }
    
    console.log('🔗 Connecting with user:', {
      userId: currentUser.id,
      tokenPreview: currentUser.token.substring(0, 20) + '...'
    });
    
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
      console.log('🔗 Socket connection initiated');
    } catch (error) {
      console.error('❌ Error connecting socket:', error);
    }
  }, []);

  // ========== INITIALIZE ON MOUNT ==========
  useEffect(() => {
    console.log('🔧 ========== SOCKET PROVIDER MOUNTED ==========');
    isMountedRef.current = true;
    
   const initialize = async () => {
  try {
    console.log('📂 Loading initial data from storage...');
    await loadNotificationsFromStorage();
    await loadPushTokenStatus();
    await setupNotifications();
    await checkBackgroundNotifications();
    
    // FORCE re-registration for standalone apps
    if (!isExpoGo) {
      console.log('🚀 Standalone app detected - forcing push registration');
      // Clear any old registration status
      await AsyncStorage.setItem(USER_PUSH_REGISTERED_KEY, 'false');
      setIsPushTokenRegistered(false);
      hasAttemptedPushRegistrationRef.current = false;
    }
    
    setIsInitializing(false);
    console.log('✅ SocketProvider initialization complete');
  } catch (error) {
    console.error('❌ Error initializing SocketProvider:', error);
    setIsInitializing(false);
  }
};
    
    initialize();
    
    // ========== SOCKET EVENT HANDLERS ==========
    const handleConnect = (socketId) => {
      if (!isMountedRef.current) return;
      
      console.log('✅ Socket connected via manager - ID:', socketId);
      setIsConnected(true);
      socketConnectedRef.current = true;
      currentStateRef.current.socketConnected = true;
      setSocket(socketManager.getSocket());
      
      // Get notifications
      setTimeout(() => {
        getNotifications();
      }, 500);
      
      // ALWAYS try to register push token when socket connects
      console.log('🔔 Socket connected - attempting push token registration');
      
      const currentState = currentStateRef.current;
      const currentUser = currentState.user;
      
      if (!currentUser?.id || !currentState.authed || !currentUser?.token) {
        console.log('⏸️ Cannot register push token - user not authenticated');
        return;
      }
      
      // Always try to register on socket connect (with cooldown)
      setTimeout(() => {
        triggerPushTokenRegistration();
      }, 1000);
    };
    
    const handleDisconnect = (reason) => {
      if (!isMountedRef.current) return;
      
      console.log('❌ Socket disconnected via manager:', reason);
      setIsConnected(false);
      socketConnectedRef.current = false;
      currentStateRef.current.socketConnected = false;
      setSocket(null);
    };
    
    const handleSystemNotification = (notification) => {
      if (!isMountedRef.current) return;
      
      console.log('📨 Socket notification received:', notification?.id);
      if (notification) {
        addNotification(notification);
      }
    };
    
    const handleAllNotifications = (notificationsList) => {
      if (!isMountedRef.current) return;
      
      console.log('📋 Received notifications:', notificationsList?.length || 0);
      if (Array.isArray(notificationsList)) {
        handleNotificationsUpdate(notificationsList);
      }
    };
    
    // Add listeners
    socketManager.on('connect', handleConnect);
    socketManager.on('disconnect', handleDisconnect);
    socketManager.on('system_notification', handleSystemNotification);
    socketManager.on('all_notifications', handleAllNotifications);
    
    return () => {
      console.log('🧹 SocketProvider cleanup');
      isMountedRef.current = false;
      cleanupNotificationListeners();
      
      // Remove listeners
      socketManager.off('connect', handleConnect);
      socketManager.off('disconnect', handleDisconnect);
      socketManager.off('system_notification', handleSystemNotification);
      socketManager.off('all_notifications', handleAllNotifications);
      
      disconnectSocket();
    };
  }, [triggerPushTokenRegistration]);

  // ========== HELPER FUNCTIONS ==========
  const cleanupNotificationListeners = () => {
    if (notificationSubscriptionRef.current) {
      notificationSubscriptionRef.current.remove();
    }
    if (responseSubscriptionRef.current) {
      responseSubscriptionRef.current.remove();
    }
  };

  const loadNotificationsFromStorage = async () => {
    try {
      const [savedNotifications, savedUnreadCount] = await Promise.all([
        AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY),
        AsyncStorage.getItem(UNREAD_COUNT_STORAGE_KEY)
      ]);

      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      }
      if (savedUnreadCount) {
        setUnreadCount(parseInt(savedUnreadCount, 10));
      }
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
    }
  };

  const loadPushTokenStatus = async () => {
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
  };

  const setupNotifications = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: { allowAlert: true, allowBadge: true, allowSound: true },
        });
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        setNotificationsAvailable(false);
        return;
      }
      
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('yescharge-default', {
          name: 'Yes Charge',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });
      }
      
     let token;
    if (isExpoGo) {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig.extra.eas.projectId,
      })).data;
    } else {
      token = (await Notifications.getExpoPushTokenAsync()).data;
    }
    
    console.log('📱 Expo push token received:', token);
    console.log('📱 Token length:', token.length);
    console.log('📱 Is Expo Go?', isExpoGo);
    console.log('📱 Is Standalone?', !isExpoGo);
    
    // Check if token changed from what's stored
    const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
    if (storedToken !== token) {
      console.log('🔄 Push token changed! Clearing registration status.');
      console.log('Old token:', storedToken?.substring(0, 20) + '...');
      console.log('New token:', token.substring(0, 20) + '...');
      
      // Clear registration status when token changes
      await AsyncStorage.setItem(USER_PUSH_REGISTERED_KEY, 'false');
      setIsPushTokenRegistered(false);
      hasAttemptedPushRegistrationRef.current = false;
    }
    
    setExpoPushToken(token);
    await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
      
      setNotificationsAvailable(true);
      setupNotificationListeners();
      
    } catch (error) {
      console.error('💥 Error setting up notifications:', error);
      setNotificationsAvailable(false);
    }
  };

  const setupNotificationListeners = () => {
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
  };

  const checkBackgroundNotifications = async () => {
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
  };

  const disconnectSocket = () => {
    socketManager.disconnect();
    setSocket(null);
    setIsConnected(false);
    socketConnectedRef.current = false;
    currentStateRef.current.socketConnected = false;
  };

  const getNotifications = () => {
    const currentSocket = socketManager.getSocket();
    if (currentSocket && socketManager.getIsConnected() && user?.id) {
      currentSocket.emit('get_notifications', { 
        userId: user.id,
        role: user.role || 'customer' 
      });
    }
  };

  const refreshNotifications = () => {
    getNotifications();
  };

  const handleNotificationsUpdate = (notificationsList) => {
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
  };

  const addNotification = (notification) => {
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
  };

  const addNotificationFromPush = (notificationData) => {
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
  };

  const markAsRead = (notificationId) => {
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
  };

  const markAllAsRead = () => {
    setUnreadCount(0);
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    
    const currentSocket = socketManager.getSocket();
    if (currentSocket && socketManager.getIsConnected() && user?.id) {
      currentSocket.emit('mark_all_read', { userId: user.id });
    }
  };

  const updateBadgeCount = async (count) => {
    if (!notificationsAvailable) return;
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.log('Error updating badge count:', error);
    }
  };

  const handleNotificationTap = (notificationData) => {
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
  };

  const testSocketNotification = () => {
    const currentSocket = socketManager.getSocket();
    if (currentSocket && socketManager.getIsConnected()) {
      currentSocket.emit('test_notification', { userId: user?.id });
    } else {
      Alert.alert('Error', 'Socket not connected');
    }
  };

  // ========== CONTEXT VALUE ==========
  const value = {
  socket: socketManager.getSocket(),
  isConnected: socketManager.getIsConnected(),
  notifications,
  unreadCount,
  notificationsAvailable,
  expoPushToken,
  isPushTokenRegistered,
  getNotifications,
  refreshNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification: (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    const currentSocket = socketManager.getSocket();
    if (currentSocket && socketManager.getIsConnected()) {
      currentSocket.emit('delete_notification', { notificationId });
    }
  },
  clearNotifications: () => {
    setNotifications([]);
    setUnreadCount(0);
    AsyncStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    AsyncStorage.removeItem(UNREAD_COUNT_STORAGE_KEY);
  },
  reconnect: connectSocket,
  disconnect: disconnectSocket,
  sendTestNotification: testSocketNotification,
  
  // Push registration functions
  triggerPushRegistrationNow: async (force = false) => {
    return await triggerPushTokenRegistration(force);
  },
  
  // ADD THIS MISSING FUNCTION:
  getPushTokenStatus: () => {
    const currentState = currentStateRef.current;
    const currentUser = currentState.user;
    
    return {
      hasToken: !!currentState.expoPushToken,
      token: currentState.expoPushToken,
      userId: currentUser?.id,
      authed: currentState.authed,
      isRegistered: currentState.isPushTokenRegistered,
      hasUserToken: !!currentUser?.token,
      socketConnected: currentState.socketConnected
    };
  },
  
  // Also add this function that your test screen might be using:
  sendTestPushNotification: async () => {
    return await testDirectPushAPI();
  },
  
  // Rename the existing function to match what your test expects
  testDirectPushAPI: async () => {
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
  },
  
  debugPushRegistration: () => {
    const currentState = currentStateRef.current;
    const currentUser = currentState.user;
    
    console.log('🔍 ===== PUSH REGISTRATION DEBUG =====');
    console.log('📱 Expo Push Token:', currentState.expoPushToken);
    console.log('👤 User ID:', currentUser?.id);
    console.log('🔐 Authenticated:', currentState.authed);
    console.log('🏷️ Already Registered:', currentState.isPushTokenRegistered);
    console.log('🔑 User Token:', currentUser?.token ? 'Present' : 'Missing');
    console.log('🔌 Socket Connected:', currentState.socketConnected);
    console.log('====================================');
    
    return {
      expoPushToken: currentState.expoPushToken,
      userId: currentUser?.id,
      authed: currentState.authed,
      isPushTokenRegistered: currentState.isPushTokenRegistered,
      hasUserToken: !!currentUser?.token,
      socketConnected: currentState.socketConnected,
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

    
    debugPushRegistration: () => {
      const currentState = currentStateRef.current;
      const currentUser = currentState.user;
      
      return {
        expoPushToken: currentState.expoPushToken,
        userId: currentUser?.id,
        authed: currentState.authed,
        isPushTokenRegistered: currentState.isPushTokenRegistered,
        hasUserToken: !!currentUser?.token,
        socketConnected: currentState.socketConnected,
      };
    },
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};