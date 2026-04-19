import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../auth/AuthProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATIONS_STORAGE_KEY = 'yescharge_notifications';
const UNREAD_COUNT_STORAGE_KEY = 'yescharge_unread_count';

export const useNotifications = () => {
  const { user } = useAuth();
  const { 
    socket,
    isConnected, 
    emitWithAck
  } = useSocket();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const hasNotifications = notifications.length > 0;
  const hasUnreadNotifications = unreadCount > 0;
  
  useEffect(() => {
    console.log('useNotifications - User object:', {
      userExists: !!user,
      user: user,
      userId: user?.id,
      userUid: user?.uid
    });
  }, [user]);

  const processNotification = useCallback((rawNotification) => {
    if (!rawNotification) return null;
    
    let notification = rawNotification;
    
    if (rawNotification.data && typeof rawNotification.data === 'object') {
      notification = {
        ...rawNotification.data,
        id: rawNotification.data.id || rawNotification.id,
        title: rawNotification.title || rawNotification.data.title,
        description: rawNotification.description || rawNotification.data.description,
        createdAt: rawNotification.createdAt || rawNotification.data.createdAt,
        isRead: rawNotification.isRead !== undefined ? rawNotification.isRead : (rawNotification.data.isRead || false),
        notiType: rawNotification.notiType || rawNotification.data.notiType,
        notificationType: rawNotification.notificationType || rawNotification.data.notificationType,
        from: rawNotification.from || rawNotification.data.from || 'YES Charge',
      };
    }
    
    return {
      id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: typeof notification.title === 'object' 
        ? (notification.title.en || notification.title.dr || notification.title.ps || 'Notification')
        : (notification.title || 'Notification'),
      description: typeof notification.description === 'object'
        ? (notification.description.en || notification.description.dr || notification.description.ps || '')
        : (notification.description || ''),
      isRead: notification.isRead === true,
      createdAt: notification.createdAt || notification.created_at || notification.time || new Date().toISOString(),
      notificationType: notification.notificationType || notification.notiType || { name: 'General' },
      notiType: notification.notiType || notification.notificationType?.name || 'general',
      from: notification.from || 'YES Charge',
      data: notification.data || {},
      ...notification
    };
  }, []);

  const loadStoredNotifications = useCallback(async () => {
    try {
      console.log('Loading notifications from storage...');
      
      const [savedNotifications, savedUnreadCount] = await Promise.all([
        AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY),
        AsyncStorage.getItem(UNREAD_COUNT_STORAGE_KEY)
      ]);

      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        console.log('Loaded notifications from storage:', parsed.length);
        setNotifications(parsed);
      }
      
      if (savedUnreadCount) {
        const count = parseInt(savedUnreadCount, 10);
        setUnreadCount(count);
        console.log('Loaded unread count from storage:', count);
      }
      
      return true;
    } catch (error) {
      console.error('Error loading notifications:', error);
      return false;
    }
  }, []);

  const saveNotificationsToStorage = useCallback(async (notificationsList) => {
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notificationsList));
      
      const unread = notificationsList.filter(n => !n.isRead).length;
      await AsyncStorage.setItem(UNREAD_COUNT_STORAGE_KEY, unread.toString());
      setUnreadCount(unread);
      
      console.log('Saved notifications to storage:', notificationsList.length, 'Unread:', unread);
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }, []);

  const handleAllNotifications = useCallback((notificationsData) => {
    console.log('Processing all_notifications event:', notificationsData?.length);
    
    if (!notificationsData || !Array.isArray(notificationsData)) {
      console.log('Invalid notifications data received');
      return;
    }
    
    const processedNotifications = notificationsData
      .map(processNotification)
      .filter(n => n !== null);
    const sortedNotifications = processedNotifications.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    const newUnreadCount = sortedNotifications.filter(n => !n.isRead).length;
    
    setNotifications(sortedNotifications);
    setUnreadCount(newUnreadCount);
    setError(null);
    saveNotificationsToStorage(sortedNotifications);
    
    console.log(`Loaded ${sortedNotifications.length} notifications, ${newUnreadCount} unread`);
  }, [processNotification, saveNotificationsToStorage]);

  const handleNewNotification = useCallback((notificationData) => {
    console.log('New notification received:', notificationData);
    
    const newNotification = processNotification(notificationData);
    if (!newNotification) return;
    
    setNotifications(prev => {
      const exists = prev.some(n => n.id === newNotification.id);
      if (exists) return prev;
      
      const updated = [newNotification, ...prev];
      
      const newUnreadCount = updated.filter(n => !n.isRead).length;
      setUnreadCount(newUnreadCount);
      
      saveNotificationsToStorage(updated);
      
      return updated;
    });
  }, [processNotification, saveNotificationsToStorage]);

  const handleNotificationRead = useCallback((data) => {
    const notificationId = data?.notificationId || data?.id;
    console.log('Notification marked as read:', notificationId);
    
    if (!notificationId) return;
    
    setNotifications(prev => {
      const updated = prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      );
      
      const newUnreadCount = updated.filter(n => !n.isRead).length;
      setUnreadCount(newUnreadCount);
      
      saveNotificationsToStorage(updated);
      
      return updated;
    });
  }, [saveNotificationsToStorage]);

  const handleAllNotificationsRead = useCallback(() => {
    console.log('All notifications marked as read');
    
    setNotifications(prev => {
      const updated = prev.map(notification => ({ ...notification, isRead: true }));
      setUnreadCount(0);
      
      saveNotificationsToStorage(updated);
      
      return updated;
    });
  }, [saveNotificationsToStorage]);

  const handleNotificationDeleted = useCallback((data) => {
    const notificationId = data?.notificationId || data?.id;
    console.log('Notification deleted:', notificationId);
    
    if (!notificationId) return;
    
    setNotifications(prev => {
      const updated = prev.filter(notification => notification.id !== notificationId);
      const newUnreadCount = updated.filter(n => !n.isRead).length;
      
      setUnreadCount(newUnreadCount);
      saveNotificationsToStorage(updated);
      
      return updated;
    });
  }, [saveNotificationsToStorage]);

  const requestNotifications = useCallback(async () => {
    const userId = user?.id || user?.uid;
    
    if (!socket || !isConnected) {
      console.log('Cannot request notifications: socket not connected');
      return false;
    }
    
    if (!userId) {
      console.log('Cannot request notifications: no user ID');
      return false;
    }
    
    console.log('Requesting notifications for user:', userId);
    
    try {
      socket.emit('get_notifications', { userId });
      return true;
    } catch (error) {
      console.error('Error requesting notifications:', error);
      return false;
    }
  }, [socket, isConnected, user?.id, user?.uid]);

  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('Socket not connected, skipping listener setup');
      return;
    }

    console.log('Setting up notification socket listeners...');
    socket.on('all_notifications', handleAllNotifications);
    socket.on('new_notification', handleNewNotification);
    socket.on('notification_read', handleNotificationRead);
    socket.on('all_notifications_read', handleAllNotificationsRead);
    socket.on('notification_deleted', handleNotificationDeleted);

    const userId = user?.id || user?.uid;
    if (userId) {
      console.log('Requesting initial notifications for user:', userId);
      socket.emit('get_notifications', { userId });
    }

    return () => {
      console.log('Cleaning up notification socket listeners...');
      socket.off('all_notifications', handleAllNotifications);
      socket.off('new_notification', handleNewNotification);
      socket.off('notification_read', handleNotificationRead);
      socket.off('all_notifications_read', handleAllNotificationsRead);
      socket.off('notification_deleted', handleNotificationDeleted);
    };
  }, [socket, isConnected, user?.id, user?.uid, handleAllNotifications, handleNewNotification, handleNotificationRead, handleAllNotificationsRead, handleNotificationDeleted]);

  const loadNotifications = useCallback(async () => {
    const userId = user?.id || user?.uid;
    
    if (!userId) {
      console.log('No user ID available, loading stored notifications only');
      setError(null);
    } else {
      console.log('Loading notifications for user:', userId);
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await loadStoredNotifications();
      
      if (isConnected && userId) {
        console.log('🔌 Connected - requesting fresh notifications');
        await requestNotifications();
      } else {
        console.log('Offline or no user - using stored notifications');
      }
      
      setLoading(false);
      
    } catch (err) {
      console.error('❌ Error loading notifications:', err);
      setError('Failed to load notifications');
      setLoading(false);
    }
  }, [user?.id, user?.uid, isConnected, loadStoredNotifications, requestNotifications]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      console.log('Marking notification as read:', notificationId);
      
      setNotifications(prev => {
        const updated = prev.map(notif =>
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        );
        
        saveNotificationsToStorage(updated);
        return updated;
      });

      if (socket && isConnected && (user?.id || user?.uid)) {
        try {
          const response = await emitWithAck('mark_notification_read', { 
            notificationId, 
            userId: user?.id || user?.uid 
          });
          if (!response?.success) {
            console.log('Failed to mark as read on server');
          }
        } catch (err) {
          console.error('Error marking as read on server:', err);
        }
      }

      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, [socket, isConnected, user?.id, user?.uid, emitWithAck, saveNotificationsToStorage]);

  const markAllAsRead = useCallback(async () => {
    try {
      console.log('Marking all notifications as read');
      
      setNotifications(prev => {
        const updated = prev.map(notif => ({ ...notif, isRead: true }));
        
        saveNotificationsToStorage(updated);
        return updated;
      });

      if (socket && isConnected && (user?.id || user?.uid)) {
        try {
          const response = await emitWithAck('mark_all_notifications_read', { 
            userId: user?.id || user?.uid 
          });
          if (!response?.success) {
            console.log('Failed to mark all as read on server');
          }
        } catch (err) {
          console.error('Error marking all as read on server:', err);
        }
      }

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }, [socket, isConnected, user?.id, user?.uid, emitWithAck, saveNotificationsToStorage]);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      console.log('Deleting notification:', notificationId);
      
      setNotifications(prev => {
        const updated = prev.filter(notif => notif.id !== notificationId);
        saveNotificationsToStorage(updated);
        return updated;
      });

      if (socket && isConnected && (user?.id || user?.uid)) {
        try {
          const response = await emitWithAck('delete_notification', { 
            notificationId, 
            userId: user?.id || user?.uid 
          });
          if (!response?.success) {
            console.log('Failed to delete notification on server');
          }
        } catch (err) {
          console.error('Error deleting notification on server:', err);
        }
      }

      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }, [socket, isConnected, user?.id, user?.uid, emitWithAck, saveNotificationsToStorage]);

  const refreshNotifications = useCallback(async () => {
    console.log('Manually refreshing notifications...');
    setIsSyncing(true);
    
    try {
      await loadNotifications();
      console.log('Manual refresh completed');
    } catch (err) {
      console.error('Error in manual refresh:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [loadNotifications]);

  const syncNow = useCallback(async () => {
    if (!socket || !isConnected) {
      console.log('Cannot sync - socket not connected');
      return false;
    }
    
    const userId = user?.id || user?.uid;
    if (!userId) {
      console.log('Cannot sync - no user ID');
      return false;
    }
    
    console.log('Syncing notifications now...');
    setIsSyncing(true);
    
    try {
      socket.emit('get_notifications', { userId });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await loadStoredNotifications();
      
      console.log('✅ Sync completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Sync failed:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [socket, isConnected, user?.id, user?.uid, loadStoredNotifications]);

  useEffect(() => {
    let mounted = true;
    
    const initialize = async () => {
      if (mounted) {
        await loadNotifications();
      }
    };

    const timer = setTimeout(() => {
      initialize();
    }, 500);
    
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [loadNotifications]);

  useEffect(() => {
    if ((user?.id || user?.uid) && error === 'User not available') {
      console.log('User now available, retrying notification load');
      setError(null);
      loadNotifications();
    }
  }, [user?.id, user?.uid, error, loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading: loading || isSyncing,
    error,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    syncNow,
    hasNotifications,
    hasUnreadNotifications,
    formatNotification: processNotification
  };
};