import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../auth/AuthProvider';
import { Platform, Alert, AppState, Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Configure how notifications should be handled when the app is in foreground
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
  
  const listenersRegisteredRef = useRef(false);
  const socketRef = useRef(null);
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  // Check if running in Expo Go
  const isExpoGo = Constants.appOwnership === 'expo';

  // Initialize notifications
  useEffect(() => {
    console.log('🔧 Initializing Expo notifications...');
    console.log('🏠 App ownership:', Constants.appOwnership);
    
    if (isExpoGo) {
      console.log('🚫 Running in Expo Go - push notifications disabled, using local notifications only');
    }

    const initializeNotifications = async () => {
      try {
        // Request permissions
        const { status } = await Notifications.requestPermissionsAsync();
        console.log('🔧 Notification permission status:', status);
        
        if (status !== 'granted') {
          console.log('🚫 Notification permissions not granted');
          setNotificationsAvailable(false);
          return;
        }

        // Only try to get push token if not in Expo Go
        let token = null;
        if (!isExpoGo) {
          try {
            token = await Notifications.getExpoPushTokenAsync();
            console.log('📱 Expo push token:', token);
          } catch (tokenError) {
            console.error('❌ Push token fetch failed, using local notifications only:', tokenError);
            // Continue with local notifications even without push token
          }
        } else {
          console.log('📱 Skipping push token (Expo Go)');
        }

        // Listen for notifications received while the app is foregrounded
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
          console.log('📱 Notification received in foreground:', notification);
          Vibration.vibrate(500);
        });

        // Listen for notification responses (user tapped on notification)
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
          console.log('👆 Notification tapped:', response);
          handleNotificationTap(response.notification.request.content.data || {});
        });

        setNotificationsAvailable(true);
        console.log('✅ Expo notifications initialized successfully');

        // Test local notifications after a delay
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

    // Cleanup function
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Test local notification capability
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
        trigger: null, // Send immediately
      });
      
      console.log('✅ Local test notification sent successfully');
    } catch (error) {
      console.error('❌ Local test notification failed:', error);
      console.error('❌ Error details:', error.message);
    }
  };

  // Test push notification capability (only if not in Expo Go)
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

  // Show notification
  const showNotification = async (notification) => {
    console.log('📱 Showing notification:', {
      id: notification.id,
      notificationsAvailable,
      isExpoGo
    });

    // Extract notification content
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

    // Always try local notifications first
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
          trigger: null, // Send immediately
        });
        
        console.log('✅ Local notification shown successfully');
        return;
        
      } catch (error) {
        console.error('❌ Local notification failed:', error);
        console.error('❌ Error details:', error.message);
        // Fall through to fallback
      }
    }

    // Fallback: Use system alert with vibration
    console.log('📱 Using fallback notification');
    showFallbackNotification(title, message);
  };

  // Enhanced fallback notification
  const showFallbackNotification = (title, message) => {
    // Vibrate device
    Vibration.vibrate(500);
    
    // Show alert
    Alert.alert(
      title,
      message,
      [{ text: 'OK', onPress: () => console.log('Notification alert closed') }],
      { cancelable: true }
    );
  };

  const handleNotificationTap = (notificationData) => {
    console.log('👆 Notification tapped:', notificationData);
    // Handle navigation or other actions when notification is tapped
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

  // Socket setup
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

    // Listen for system_notification
    socketInstance.on('system_notification', (notification) => {
      console.log('📨 New notification received:', {
        id: notification.id,
        title: notification.title,
        receiver: notification.receiver,
        type: notification.notificationType?.name
      });
      
      if (notification.receiver === 'customer' || 
          (notification.receiverDetails && notification.receiverDetails.id === user?.id)) {
        
        setNotifications(prev => {
          const exists = prev.some(notif => notif.id === notification.id);
          if (exists) {
            console.log('🔄 Notification already exists, skipping duplicate');
            return prev;
          }
          
          const newNotifications = [notification, ...prev.slice(0, 49)];
          console.log('📋 Notifications count after add:', newNotifications.length);
          return newNotifications;
        });
        
        setUnreadCount(prev => prev + 1);

        // Show notification
        showNotification(notification);
      } else {
        console.log('📭 Notification not for current user, skipping');
      }
    });

    // Also listen for new_notification for backward compatibility
    socketInstance.on('new_notification', (notification) => {
      console.log('📨 New notification (legacy event):', notification);
      setNotifications(prev => {
        const exists = prev.some(notif => notif.id === notification.id);
        if (exists) return prev;
        return [notification, ...prev.slice(0, 49)];
      });
      setUnreadCount(prev => prev + 1);
      
      // Show notification
      showNotification(notification);
    });

    socketInstance.on('notification_read', (data) => {
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === data.notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Update badge count
      updateBadgeCount(Math.max(0, unreadCount - 1));
    });

    socketInstance.on('all_notifications', (notificationsList) => {
      setNotifications(notificationsList);
      const unread = notificationsList.filter(n => !n.read).length;
      setUnreadCount(unread);
      
      // Update badge count
      updateBadgeCount(unread);
    });

    // Online users update
    socketInstance.on('online_users', (users) => {
      console.log('👥 Online users:', users.length);
    });

    // Test response
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
      // Disconnect existing socket first
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      const serverUrl = 'http://192.168.0.106:8081';
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
    getNotifications();
  };

  const markAsRead = async (notificationId) => {
    console.log('📝 Marking notification as read:', notificationId);
    
    if (socket && isConnected) {
      socket.emit('mark_as_read', { notificationId });
    }
    
    // Update local state immediately
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // Update badge count
    updateBadgeCount(Math.max(0, unreadCount - 1));
    
    return true;
  };

  const markAllAsRead = async () => {
    console.log('📝 Marking all notifications as read');
    
    if (socket && isConnected && user?.id) {
      socket.emit('mark_all_read', { userId: user.id });
    }
    
    // Update local state immediately
    setUnreadCount(0);
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    
    // Clear badge count
    updateBadgeCount(0);
    
    return true;
  };

  const clearNotifications = () => {
    console.log('🗑️ Clearing all notifications');
    setNotifications([]);
    setUnreadCount(0);
    updateBadgeCount(0);
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

  // Fetch initial notifications when connected
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






// import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
// import io from 'socket.io-client';
// import { useAuth } from '../auth/AuthProvider';
// import { Platform, Alert, AppState, Vibration } from 'react-native';
// import * as Notifications from 'expo-notifications';

// // Configure how notifications should be handled when the app is in foreground
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

// const SocketContext = createContext();

// export const useSocket = () => {
//   const context = useContext(SocketContext);
//   if (!context) {
//     throw new Error('useSocket must be used within a SocketProvider');
//   }
//   return context;
// };

// export const SocketProvider = ({ children }) => {
//   const [socket, setSocket] = useState(null);
//   const [isConnected, setIsConnected] = useState(false);
//   const [notifications, setNotifications] = useState([]);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [notificationsAvailable, setNotificationsAvailable] = useState(false);
//   const reconnectAttempts = useRef(0);
//   const maxReconnectAttempts = 5;
//   const { user, authed } = useAuth();
  
//   const listenersRegisteredRef = useRef(false);
//   const socketRef = useRef(null);
//   const notificationListener = useRef(null);
//   const responseListener = useRef(null);

//   // Initialize notifications
//   useEffect(() => {
//     console.log('🔧 Initializing Expo notifications...');
    
//     const initializeNotifications = async () => {
//       try {
//         // Request permissions
//         const { status } = await Notifications.requestPermissionsAsync();
//         console.log('🔧 Notification permission status:', status);
        
//         if (status !== 'granted') {
//           console.log('🚫 Notification permissions not granted');
//           setNotificationsAvailable(false);
//           return;
//         }

//         // Get the token (for push notifications)
//         const token = await Notifications.getExpoPushTokenAsync();
//         console.log('📱 Expo push token:', token);

//         // Listen for notifications received while the app is foregrounded
//         notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
//           console.log('📱 Notification received in foreground:', notification);
//           Vibration.vibrate(500);
//         });

//         // Listen for notification responses (user tapped on notification)
//         responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
//           console.log('👆 Notification tapped:', response);
//           handleNotificationTap(response.notification.request.content.data || {});
//         });

//         setNotificationsAvailable(true);
//         console.log('✅ Expo notifications initialized successfully');

//         // Test notifications after a delay
//         setTimeout(() => {
//           testNotificationCapability();
//         }, 2000);

//       } catch (error) {
//         console.error('💥 Error initializing notifications:', error);
//         console.error('💥 Error details:', error.message);
//         setNotificationsAvailable(false);
//       }
//     };

//     initializeNotifications();

//     // Cleanup function
//     return () => {
//       if (notificationListener.current) {
//         Notifications.removeNotificationSubscription(notificationListener.current);
//       }
//       if (responseListener.current) {
//         Notifications.removeNotificationSubscription(responseListener.current);
//       }
//     };
//   }, []);

//   // Test notification capability
//   const testNotificationCapability = async () => {
//     console.log('🧪 Testing notification capability...');
    
//     if (!notificationsAvailable) {
//       console.log('🚫 Cannot test: Notifications not available');
//       return;
//     }

//     try {
//       console.log('🧪 Sending test notification...');
      
//       await Notifications.scheduleNotificationAsync({
//         content: {
//           title: "AFH App",
//           body: "Notifications are working!",
//           data: { 
//             id: 'test-notification',
//             type: 'test'
//           },
//           sound: true,
//           badge: 1,
//         },
//         trigger: null, // Send immediately
//       });
      
//       console.log('✅ Test notification sent successfully');
//     } catch (error) {
//       console.error('❌ Test notification failed:', error);
//       console.error('❌ Error details:', error.message);
//       setNotificationsAvailable(false);
//     }
//   };

//   // Show notification
//   const showNotification = async (notification) => {
//     console.log('📱 Showing notification:', {
//       id: notification.id,
//       notificationsAvailable
//     });

//     // Extract notification content
//     let title = 'New Notification';
//     let message = '';
    
//     if (typeof notification.title === 'object') {
//       title = notification.title.en || notification.title.ar || title;
//     } else if (typeof notification.title === 'string') {
//       title = notification.title;
//     }
    
//     if (typeof notification.description === 'object') {
//       message = notification.description.en || notification.description.ar || message;
//     } else if (typeof notification.description === 'string') {
//       message = notification.description;
//     }

//     console.log('📱 Notification content:', { title, message });

//     // Try native notification first if available
//     if (notificationsAvailable) {
//       try {
//         console.log('📱 Attempting native notification...');
        
//         await Notifications.scheduleNotificationAsync({
//           content: {
//             title: title,
//             body: message,
//             data: {
//               id: notification.id,
//               type: getNotificationType(notification),
//             },
//             sound: true,
//             badge: unreadCount + 1,
//           },
//           trigger: null, // Send immediately
//         });
        
//         console.log('✅ Native notification shown successfully');
//         return;
        
//       } catch (error) {
//         console.error('❌ Native notification failed:', error);
//         console.error('❌ Error details:', error.message);
//         setNotificationsAvailable(false);
//         // Fall through to fallback
//       }
//     }

//     // Fallback: Use system alert with vibration
//     console.log('📱 Using fallback notification');
//     showFallbackNotification(title, message);
//   };

//   // Enhanced fallback notification
//   const showFallbackNotification = (title, message) => {
//     // Vibrate device
//     Vibration.vibrate(500);
    
//     // Show alert
//     Alert.alert(
//       title,
//       message,
//       [{ text: 'OK', onPress: () => console.log('Notification alert closed') }],
//       { cancelable: true }
//     );
//   };

//   const handleNotificationTap = (notificationData) => {
//     console.log('👆 Notification tapped:', notificationData);
//     // Handle navigation or other actions when notification is tapped
//   };

//   const updateBadgeCount = async (count) => {
//     if (!notificationsAvailable) {
//       return;
//     }
    
//     try {
//       await Notifications.setBadgeCountAsync(count);
//       console.log('📱 Badge count updated:', count);
//     } catch (error) {
//       console.log('Error updating badge count:', error);
//     }
//   };

//   const getNotificationType = (notification) => {
//     try {
//       const notiType = notification.notificationType?.name;
      
//       if (typeof notiType === 'string') {
//         return notiType.toLowerCase();
//       } else if (typeof notiType === 'object' && notiType !== null) {
//         return (notiType.en || notiType.ar || 'system').toLowerCase();
//       }
      
//       return (notification.notiType || 'system').toString().toLowerCase();
//     } catch (error) {
//       return 'system';
//     }
//   };

//   // Socket setup (same as before)
//   const setupSocketListeners = (socketInstance) => {
//     socketInstance.removeAllListeners();

//     socketInstance.on('connect', () => {
//       console.log('✅ Socket connected');
//       setIsConnected(true);
//       reconnectAttempts.current = 0;
      
//       if (user?.id && user?.token) {
//         console.log('👤 Registering user with socket server');
        
//         const userId = user.id.toString();
        
//         socketInstance.emit('register', {
//           userId: userId,
//           role: 'customer',
//           username: user.username || user.fullName || 'Customer',
//           email: user.email || '',
//           type: 'customer',
//         });
        
//         console.log('📨 User registration sent');
//       }
//     });

//     socketInstance.on('disconnect', (reason) => {
//       console.log('❌ Socket disconnected:', reason);
//       setIsConnected(false);
//     });

//     socketInstance.on('connect_error', (error) => {
//       console.log('⚠️ Socket connection error:', error.message);
//       setIsConnected(false);
//     });

//     socketInstance.on('reconnect_attempt', (attempt) => {
//       console.log('🔁 Socket reconnect attempt:', attempt);
//       reconnectAttempts.current = attempt;
//     });

//     socketInstance.on('reconnect_failed', () => {
//       console.log('🚫 Socket reconnection failed');
//       if (reconnectAttempts.current >= maxReconnectAttempts) {
//         Alert.alert(
//           'Connection Issue',
//           'Unable to connect to server. Some features may not work properly.',
//           [{ text: 'OK' }]
//         );
//       }
//     });

//     // Listen for system_notification
//     socketInstance.on('system_notification', (notification) => {
//       console.log('📨 New notification received:', {
//         id: notification.id,
//         title: notification.title,
//         receiver: notification.receiver,
//         type: notification.notificationType?.name
//       });
      
//       if (notification.receiver === 'customer' || 
//           (notification.receiverDetails && notification.receiverDetails.id === user?.id)) {
        
//         setNotifications(prev => {
//           const exists = prev.some(notif => notif.id === notification.id);
//           if (exists) {
//             console.log('🔄 Notification already exists, skipping duplicate');
//             return prev;
//           }
          
//           const newNotifications = [notification, ...prev.slice(0, 49)];
//           console.log('📋 Notifications count after add:', newNotifications.length);
//           return newNotifications;
//         });
        
//         setUnreadCount(prev => prev + 1);

//         // Show notification
//         showNotification(notification);
//       } else {
//         console.log('📭 Notification not for current user, skipping');
//       }
//     });

//     // Also listen for new_notification for backward compatibility
//     socketInstance.on('new_notification', (notification) => {
//       console.log('📨 New notification (legacy event):', notification);
//       setNotifications(prev => {
//         const exists = prev.some(notif => notif.id === notification.id);
//         if (exists) return prev;
//         return [notification, ...prev.slice(0, 49)];
//       });
//       setUnreadCount(prev => prev + 1);
      
//       // Show notification
//       showNotification(notification);
//     });

//     socketInstance.on('notification_read', (data) => {
//       setNotifications(prev =>
//         prev.map(notif =>
//           notif.id === data.notificationId ? { ...notif, read: true } : notif
//         )
//       );
//       setUnreadCount(prev => Math.max(0, prev - 1));
      
//       // Update badge count
//       updateBadgeCount(Math.max(0, unreadCount - 1));
//     });

//     socketInstance.on('all_notifications', (notificationsList) => {
//       setNotifications(notificationsList);
//       const unread = notificationsList.filter(n => !n.read).length;
//       setUnreadCount(unread);
      
//       // Update badge count
//       updateBadgeCount(unread);
//     });

//     // Online users update
//     socketInstance.on('online_users', (users) => {
//       console.log('👥 Online users:', users.length);
//     });

//     // Test response
//     socketInstance.on('test_response', (data) => {
//       console.log('🧪 Test response:', data);
//     });
//   };

//   // Rest of your socket connection methods remain the same...
//   const connectSocket = async () => {
//     console.log('🧪 connectSocket() called');

//     if (!authed || !user?.id || !user?.token) {
//       console.warn('🚫 Missing user.id or token, skipping socket connection');
//       return;
//     }

//     try {
//       // Disconnect existing socket first
//       if (socketRef.current) {
//         socketRef.current.disconnect();
//         socketRef.current = null;
//       }

//       const serverUrl = 'http://192.168.0.106:8081';
//       console.log('🔗 Connecting to socket server:', serverUrl);

//       const socketInstance = io(serverUrl, {
//         transports: ['websocket', 'polling'],
//         auth: {
//           token: user.token,
//         },
//         reconnection: true,
//         reconnectionAttempts: maxReconnectAttempts,
//         reconnectionDelay: 1000,
//         reconnectionDelayMax: 5000,
//         timeout: 20000,
//       });

//       console.log('🧱 Socket instance created:', !!socketInstance);

//       setupSocketListeners(socketInstance);
//       setSocket(socketInstance);
//       socketRef.current = socketInstance;
//       listenersRegisteredRef.current = true;

//     } catch (error) {
//       console.error('💥 Socket connection error:', error);
//     }
//   };

//   const disconnectSocket = () => {
//     if (socketRef.current) {
//       console.log('🔌 Disconnecting socket');
//       socketRef.current.removeAllListeners();
//       socketRef.current.disconnect();
//       socketRef.current = null;
//     }
//     setSocket(null);
//     setIsConnected(false);
//     listenersRegisteredRef.current = false;
//   };

//   const getNotifications = () => {
//     if (socket && isConnected && user?.id) {
//       console.log('📋 Requesting notifications from server for user:', user.id);
//       socket.emit('get_notifications', { userId: user.id });
//     } else {
//       console.log('⚠️ Cannot get notifications: socket not connected or no user');
//     }
//   };

//   const refreshNotifications = async () => {
//     console.log('🔄 Refreshing notifications');
//     getNotifications();
//   };

//   const markAsRead = async (notificationId) => {
//     console.log('📝 Marking notification as read:', notificationId);
    
//     if (socket && isConnected) {
//       socket.emit('mark_as_read', { notificationId });
//     }
    
//     // Update local state immediately
//     setNotifications(prev =>
//       prev.map(notif =>
//         notif.id === notificationId ? { ...notif, isRead: true } : notif
//       )
//     );
//     setUnreadCount(prev => Math.max(0, prev - 1));
    
//     // Update badge count
//     updateBadgeCount(Math.max(0, unreadCount - 1));
    
//     return true;
//   };

//   const markAllAsRead = async () => {
//     console.log('📝 Marking all notifications as read');
    
//     if (socket && isConnected && user?.id) {
//       socket.emit('mark_all_read', { userId: user.id });
//     }
    
//     // Update local state immediately
//     setUnreadCount(0);
//     setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    
//     // Clear badge count
//     updateBadgeCount(0);
    
//     return true;
//   };

//   const clearNotifications = () => {
//     console.log('🗑️ Clearing all notifications');
//     setNotifications([]);
//     setUnreadCount(0);
//     updateBadgeCount(0);
//   };

//   const testSocketConnection = () => {
//     if (socket && isConnected) {
//       socket.emit('test', { 
//         message: 'Test from React Native customer app',
//         timestamp: Date.now(),
//         userId: user?.id
//       });
//     }
//   };

//   // Fetch initial notifications when connected
//   useEffect(() => {
//     if (isConnected && user?.id) {
//       console.log('📋 Fetching initial notifications for user:', user.id);
//       getNotifications();
//     }
//   }, [isConnected, user?.id]);

//   useEffect(() => {
//     const hasValidUser = Boolean(authed && user?.id && user?.token);

//     console.log('🔐 authed:', authed);
//     console.log('🔍 hasValidUser:', hasValidUser);

//     if (hasValidUser) {
//       console.log('🧪 connectSocket() conditions met');
//       connectSocket();
//     } else {
//       console.log('🚫 Incomplete user object, skipping socket connection');
//       disconnectSocket();
//       setNotifications([]);
//       setUnreadCount(0);
//     }

//     return () => {
//       disconnectSocket();
//     };
//   }, [authed, user?.id, user?.token]);

//   useEffect(() => {
//     const handleAppStateChange = (nextAppState) => {
//       if (nextAppState === 'active' && !isConnected && authed && user?.id && user?.token) {
//         console.log('🔄 App came to foreground, reconnecting socket');
//         connectSocket();
//       }
//     };

//     const subscription = AppState.addEventListener('change', handleAppStateChange);
//     return () => subscription.remove();
//   }, [isConnected, authed, user?.id, user?.token]);

//   const value = {
//     socket,
//     isConnected,
//     notifications,
//     unreadCount,
//     pushNotificationAvailable: notificationsAvailable,
//     getNotifications,
//     refreshNotifications,
//     markAsRead,
//     markAllAsRead,
//     clearNotifications,
//     reconnect: connectSocket,
//     testConnection: testSocketConnection,
//     testPushNotification: testNotificationCapability,
//   };

//   console.log('🔌 SocketProvider render - State:', {
//     isConnected,
//     notificationsCount: notifications.length,
//     unreadCount,
//     pushNotificationAvailable: notificationsAvailable
//   });

//   return (
//     <SocketContext.Provider value={value}>
//       {children}
//     </SocketContext.Provider>
//   );
// };