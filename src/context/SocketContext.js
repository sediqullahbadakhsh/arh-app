import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../auth/AuthProvider';
import { Platform, Alert, AppState, Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

const NOTIFICATIONS_STORAGE_KEY = 'notifications_data';
const UNREAD_COUNT_STORAGE_KEY = 'unread_count';

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

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsAvailable, setNotificationsAvailable] = useState(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const { user, authed } = useAuth();
  const { i18n } = useTranslation();
  
  const listenersRegisteredRef = useRef(false);
  const socketRef = useRef(null);
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  const isExpoGo = Constants.appOwnership === 'expo';

 
  useEffect(() => {
    loadNotificationsFromStorage();
  }, []);


  useEffect(() => {
    saveNotificationsToStorage();
  }, [notifications, unreadCount]);


  useEffect(() => {
    const handleLanguageChange = () => {
      console.log('🌐 Language changed, refreshing notifications');
      refreshNotifications();
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);


  const loadNotificationsFromStorage = async () => {
    try {
      const [savedNotifications, savedUnreadCount] = await Promise.all([
        AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY),
        AsyncStorage.getItem(UNREAD_COUNT_STORAGE_KEY)
      ]);

      if (savedNotifications) {
        const parsedNotifications = JSON.parse(savedNotifications);
        setNotifications(parsedNotifications);
        console.log('📂 Loaded notifications from storage:', parsedNotifications.length);
      }

      if (savedUnreadCount) {
        const parsedCount = parseInt(savedUnreadCount, 10);
        setUnreadCount(parsedCount);
        console.log('📂 Loaded unread count from storage:', parsedCount);
      }
    } catch (error) {
      console.error('❌ Error loading notifications from storage:', error);
    }
  };


  const saveNotificationsToStorage = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications)),
        AsyncStorage.setItem(UNREAD_COUNT_STORAGE_KEY, unreadCount.toString())
      ]);
      console.log('💾 Saved notifications to storage:', notifications.length);
    } catch (error) {
      console.error('❌ Error saving notifications to storage:', error);
    }
  };


  useEffect(() => {
    if (!authed) {
      clearStorage();
    }
  }, [authed]);

  const clearStorage = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(NOTIFICATIONS_STORAGE_KEY),
        AsyncStorage.removeItem(UNREAD_COUNT_STORAGE_KEY)
      ]);
      console.log('🧹 Cleared notification storage');
    } catch (error) {
      console.error('❌ Error clearing storage:', error);
    }
  };

  useEffect(() => {
    console.log('🔧 Initializing Expo notifications...');
    console.log('🏠 App ownership:', Constants.appOwnership);
    
    if (isExpoGo) {
      console.log('🚫 Running in Expo Go - push notifications disabled, using local notifications only');
    }

    const initializeNotifications = async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        console.log('🔧 Notification permission status:', status);
        
        if (status !== 'granted') {
          console.log('🚫 Notification permissions not granted');
          setNotificationsAvailable(false);
          return;
        }

        let token = null;
        if (!isExpoGo) {
          try {
            token = await Notifications.getExpoPushTokenAsync();
            console.log('📱 Expo push token:', token);
          } catch (tokenError) {
            console.error('❌ Push token fetch failed, using local notifications only:', tokenError);
          }
        } else {
          console.log('📱 Skipping push token (Expo Go)');
        }

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
          console.log('📱 Notification received in foreground:', notification);
          Vibration.vibrate(500);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
          console.log('👆 Notification tapped:', response);
          handleNotificationTap(response.notification.request.content.data || {});
        });

        setNotificationsAvailable(true);
        console.log('✅ Expo notifications initialized successfully');

        setTimeout(() => {
          testLocalNotification();
        }, 2000);

      } catch (error) {
        console.error('💥 Error initializing notifications:', error);
        console.error('💥 Error details:', error.message);
        setNotificationsAvailable(false);
      }
    };

    initializeNotifications();

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const testLocalNotification = async () => {
    console.log('🧪 Testing local notification capability...');
    
    if (!notificationsAvailable) {
      console.log('🚫 Cannot test: Notifications not available');
      return;
    }

    try {
      console.log('🧪 Sending local test notification...');
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "AFH App",
          body: "Local notifications are working!",
          data: { 
            id: 'test-local-notification',
            type: 'test'
          },
          sound: true,
          badge: 1,
        },
        trigger: null, 
      });
      
      console.log('✅ Local test notification sent successfully');
    } catch (error) {
      console.error('❌ Local test notification failed:', error);
      console.error('❌ Error details:', error.message);
    }
  };

  const testPushNotification = async () => {
    if (isExpoGo) {
      console.log('🚫 Push notifications not available in Expo Go');
      Alert.alert(
        'Push Notifications',
        'Push notifications are not available in Expo Go. Please use a development build for full functionality.',
        [{ text: 'OK' }]
      );
      return;
    }

    console.log('🧪 Testing push notification capability...');
    
    if (!notificationsAvailable) {
      console.log('🚫 Cannot test: Notifications not available');
      return;
    }

    try {
      console.log('🧪 Sending push test notification...');
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "AFH App",
          body: "Push notifications are working!",
          data: { 
            id: 'test-push-notification',
            type: 'test'
          },
          sound: true,
          badge: 1,
        },
        trigger: null,
      });
      
      console.log('✅ Push test notification sent successfully');
    } catch (error) {
      console.error('❌ Push test notification failed:', error);
      console.error('❌ Error details:', error.message);
    }
  };

  const playNotificationSound = async () => {
    try {
      const { Audio } = require('expo-av');
      const soundObject = new Audio.Sound();
      
      try {

        await soundObject.loadAsync(
          require('../../assets/sounds/notification.mp3') 
        );
        await soundObject.playAsync();
        

        setTimeout(() => {
          soundObject.unloadAsync();
        }, 2000);
        
      } catch (soundError) {
        console.log('Custom sound not found, using system sound');
        

        Vibration.vibrate(500);
      }
    } catch (error) {
      console.log('Error playing notification sound:', error);
      Vibration.vibrate(500);
    }
  };

  const playNotificationVibration = () => {
    Vibration.vibrate([0, 500, 200, 500]); 
  };

  const showNotification = async (notification) => {
    console.log('📱 Showing notification:', {
      id: notification.id,
      notificationsAvailable,
      isExpoGo
    });

    let title = 'New Notification';
    let message = '';
    
    if (typeof notification.title === 'object') {
      title = notification.title.en || notification.title.ar || title;
    } else if (typeof notification.title === 'string') {
      title = notification.title;
    }
    
    if (typeof notification.description === 'object') {
      message = notification.description.en || notification.description.ar || message;
    } else if (typeof notification.description === 'string') {
      message = notification.description;
    }

    console.log('📱 Notification content:', { title, message });


    await playNotificationSound();

    if (notificationsAvailable) {
      try {
        console.log('📱 Attempting local notification...');
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: title,
            body: message,
            data: {
              id: notification.id,
              type: getNotificationType(notification),
            },
            sound: true, 
            badge: unreadCount + 1,

          },
          trigger: null, 
        });
        
        console.log('✅ Local notification shown successfully');
        return;
        
      } catch (error) {
        console.error('❌ Local notification failed:', error);
        console.error('❌ Error details:', error.message);
      }
    }

    console.log('📱 Using fallback notification');
    showFallbackNotification(title, message);
  };

  const showFallbackNotification = (title, message) => {
    Vibration.vibrate(500);
    
    Alert.alert(
      title,
      message,
      [{ text: 'OK', onPress: () => console.log('Notification alert closed') }],
      { cancelable: true }
    );
  };

  const handleNotificationTap = (notificationData) => {
    console.log('👆 Notification tapped:', notificationData);
  };

  const updateBadgeCount = async (count) => {
    if (!notificationsAvailable) {
      return;
    }
    
    try {
      await Notifications.setBadgeCountAsync(count);
      console.log('📱 Badge count updated:', count);
    } catch (error) {
      console.log('Error updating badge count:', error);
    }
  };

  const getNotificationType = (notification) => {
    try {
      const notiType = notification.notificationType?.name;
      
      if (typeof notiType === 'string') {
        return notiType.toLowerCase();
      } else if (typeof notiType === 'object' && notiType !== null) {
        return (notiType.en || notiType.ar || 'system').toLowerCase();
      }
      
      return (notification.notiType || 'system').toString().toLowerCase();
    } catch (error) {
      return 'system';
    }
  };


  const addNotification = (notification) => {
    setNotifications(prev => {
      const exists = prev.some(notif => notif.id === notification.id);
      if (exists) {
        console.log('🔄 Notification already exists, skipping duplicate');
        return prev;
      }
      
      const newNotification = {
        ...notification,
        isRead: false,
        createdAt: notification.createdAt || notification.created_at || new Date().toISOString()
      };
      
      const newNotifications = [newNotification, ...prev];
      console.log('📋 Notifications count after add:', newNotifications.length);
      return newNotifications;
    });
    
    setUnreadCount(prev => prev + 1);
    showNotification(notification);
  };

  const markAsRead = async (notificationId) => {
    console.log('📝 Marking notification as read:', notificationId);
    

    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
    

    setUnreadCount(prev => Math.max(0, prev - 1));
    

    updateBadgeCount(Math.max(0, unreadCount - 1));
    

    if (socket && isConnected) {
      socket.emit('mark_as_read', { notificationId });
    }
    
    return true;
  };

  const deleteNotification = async (notificationId) => {
    console.log('🗑️ Deleting notification:', notificationId);
    
    setNotifications(prev => {
      const notificationToDelete = prev.find(notif => notif.id === notificationId);
      const newNotifications = prev.filter(notif => notif.id !== notificationId);
      

      if (notificationToDelete && !notificationToDelete.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return newNotifications;
    });
    

    if (socket && isConnected) {
      socket.emit('delete_notification', { notificationId });
    }
    
    return true;
  };

  const markAllAsRead = async () => {
    console.log('📝 Marking all notifications as read');
    

    setUnreadCount(0);
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    
 
    updateBadgeCount(0);
    

    if (socket && isConnected && user?.id) {
      socket.emit('mark_all_read', { userId: user.id });
    }
    
    return true;
  };

  const clearNotifications = () => {
    console.log('🗑️ Clearing all notifications');
    setNotifications([]);
    setUnreadCount(0);
    updateBadgeCount(0);
    clearStorage();
  };


  const setupSocketListeners = (socketInstance) => {
    socketInstance.removeAllListeners();

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected');
      setIsConnected(true);
      reconnectAttempts.current = 0;
      
      if (user?.id && user?.token) {
        console.log('👤 Registering user with socket server');
        
        const userId = user.id.toString();
        
        socketInstance.emit('register', {
          userId: userId,
          role: 'customer',
          username: user.username || user.fullName || 'Customer',
          email: user.email || '',
          type: 'customer',
        });
        
        console.log('📨 User registration sent');
        
      
        getNotifications();
      }
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.log('⚠️ Socket connection error:', error.message);
      setIsConnected(false);
    });

    socketInstance.on('reconnect_attempt', (attempt) => {
      console.log('🔁 Socket reconnect attempt:', attempt);
      reconnectAttempts.current = attempt;
    });

    socketInstance.on('reconnect_failed', () => {
      console.log('🚫 Socket reconnection failed');
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        Alert.alert(
          'Connection Issue',
          'Unable to connect to server. Some features may not work properly.',
          [{ text: 'OK' }]
        );
      }
    });

    socketInstance.on('system_notification', (notification) => {
      console.log('📨 New notification received:', {
        id: notification.id,
        title: notification.title,
        receiver: notification.receiver,
        type: notification.notificationType?.name
      });
      
      if (notification.receiver === 'customer' || 
          (notification.receiverDetails && notification.receiverDetails.id === user?.id)) {
        addNotification(notification);
      } else {
        console.log('📭 Notification not for current user, skipping');
      }
    });

    socketInstance.on('new_notification', (notification) => {
      console.log('📨 New notification (legacy event):', notification);
      addNotification(notification);
    });

    socketInstance.on('notification_read', (data) => {
      console.log('📖 Notification read confirmed by server:', data);
    });

    socketInstance.on('all_notifications', (notificationsList) => {
      console.log('📋 Received all notifications from server:', notificationsList.length);
      

      setNotifications(prev => {
        const mergedNotifications = [...prev];
        
        notificationsList.forEach(serverNotif => {
          const exists = mergedNotifications.some(localNotif => localNotif.id === serverNotif.id);
          if (!exists) {
            mergedNotifications.unshift({
              ...serverNotif,
              isRead: serverNotif.read || serverNotif.isRead || false
            });
          }
        });
        
        return mergedNotifications.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.created_at || a.time);
          const dateB = new Date(b.createdAt || b.created_at || b.time);
          return dateB - dateA;
        });
      });
      
      const unread = notificationsList.filter(n => !n.read && !n.isRead).length;
      setUnreadCount(unread);
      updateBadgeCount(unread);
    });

    socketInstance.on('online_users', (users) => {
      console.log('👥 Online users:', users.length);
    });

    socketInstance.on('test_response', (data) => {
      console.log('🧪 Test response:', data);
    });
  };

  const connectSocket = async () => {
    console.log('🧪 connectSocket() called');

    if (!authed || !user?.id || !user?.token) {
      console.warn('🚫 Missing user.id or token, skipping socket connection');
      return;
    }

    try {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      const serverUrl = 'http://3.67.144.22';
      console.log('🔗 Connecting to socket server:', serverUrl);

      const socketInstance = io(serverUrl, {
        transports: ['websocket', 'polling'],
        auth: {
          token: user.token,
        },
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      console.log('🧱 Socket instance created:', !!socketInstance);

      setupSocketListeners(socketInstance);
      setSocket(socketInstance);
      socketRef.current = socketInstance;
      listenersRegisteredRef.current = true;

    } catch (error) {
      console.error('💥 Socket connection error:', error);
    }
  };

  const disconnectSocket = () => {
    if (socketRef.current) {
      console.log('🔌 Disconnecting socket');
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setSocket(null);
    setIsConnected(false);
    listenersRegisteredRef.current = false;
  };

  const getNotifications = () => {
    if (socket && isConnected && user?.id) {
      console.log('📋 Requesting notifications from server for user:', user.id);
      socket.emit('get_notifications', { userId: user.id });
    } else {
      console.log('⚠️ Cannot get notifications: socket not connected or no user');
    }
  };

  const refreshNotifications = async () => {
    console.log('🔄 Refreshing notifications');
    if (socket && isConnected) {
      getNotifications();
    } else {
      // If offline, just reload from local storage
      await loadNotificationsFromStorage();
    }
  };

  const testSocketConnection = () => {
    if (socket && isConnected) {
      socket.emit('test', { 
        message: 'Test from React Native customer app',
        timestamp: Date.now(),
        userId: user?.id
      });
    }
  };

  useEffect(() => {
    if (isConnected && user?.id) {
      console.log('📋 Fetching initial notifications for user:', user.id);
      getNotifications();
    }
  }, [isConnected, user?.id]);

  useEffect(() => {
    const hasValidUser = Boolean(authed && user?.id && user?.token);

    console.log('🔐 authed:', authed);
    console.log('🔍 hasValidUser:', hasValidUser);

    if (hasValidUser) {
      console.log('🧪 connectSocket() conditions met');
      connectSocket();
    } else {
      console.log('🚫 Incomplete user object, skipping socket connection');
      disconnectSocket();
      setNotifications([]);
      setUnreadCount(0);
    }

    return () => {
      disconnectSocket();
    };
  }, [authed, user?.id, user?.token]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active' && !isConnected && authed && user?.id && user?.token) {
        console.log('🔄 App came to foreground, reconnecting socket');
        connectSocket();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isConnected, authed, user?.id, user?.token]);

  const value = {
    socket,
    isConnected,
    notifications,
    unreadCount,
    pushNotificationAvailable: notificationsAvailable && !isExpoGo,
    localNotificationAvailable: notificationsAvailable,
    isExpoGo,
    getNotifications,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearNotifications,
    reconnect: connectSocket,
    testConnection: testSocketConnection,
    testLocalNotification,
    testPushNotification,
  };

  console.log('🔌 SocketProvider render - State:', {
    isConnected,
    notificationsCount: notifications.length,
    unreadCount,
    pushNotificationAvailable: notificationsAvailable && !isExpoGo,
    localNotificationAvailable: notificationsAvailable,
    isExpoGo
  });

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};