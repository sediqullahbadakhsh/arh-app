import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../auth/AuthProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATIONS_STORAGE_KEY = 'yescharge_notifications';
const UNREAD_COUNT_STORAGE_KEY = 'yescharge_unread_count';

export const useNotificationSync = () => {
  const { user } = useAuth();
  const { 
    socket, 
    isConnected, 
    notifications: socketNotifications, 
    addNotification: socketAddNotification,
    refreshNotifications,
    unreadCount: socketUnreadCount
  } = useSocket();
  
  const [syncedNotifications, setSyncedNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);


  const loadStoredNotifications = useCallback(async () => {
    try {
      const [savedNotifications, savedUnreadCount] = await Promise.all([
        AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY),
        AsyncStorage.getItem(UNREAD_COUNT_STORAGE_KEY)
      ]);

      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        console.log('Loaded notifications from storage in sync hook:', parsed.length);
        setSyncedNotifications(parsed);
      }
      
      if (savedUnreadCount) {
        const count = parseInt(savedUnreadCount, 10);
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('❌ Error loading notifications in sync hook:', error);
    }
  }, []);

  useEffect(() => {
    if (socketNotifications && Array.isArray(socketNotifications)) {
      console.log('Syncing socket notifications:', socketNotifications.length);
      
      setSyncedNotifications(prev => {
        const merged = [...socketNotifications];
        
        prev.forEach(notification => {
          if (!merged.some(n => n.id === notification.id)) {
            merged.push(notification);
          }
        });
        
        merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(merged));
        
        return merged;
      });
    }
  }, [socketNotifications]);

  useEffect(() => {
    if (socketUnreadCount !== undefined) {
      setUnreadCount(socketUnreadCount);
    }
  }, [socketUnreadCount]);

  const handlePushNotification = useCallback(async (notificationData) => {
    if (!notificationData) return null;
    
    console.log('Syncing push notification in sync hook:', notificationData.id || notificationData.notificationId);
    
    const formattedNotification = {
      id: notificationData.id || notificationData.notificationId || `push-${Date.now()}`,
      title: notificationData.title || { en: "Yes Charge" },
      description: notificationData.body || notificationData.description || { en: "New notification" },
      from: notificationData.from || "Yes Charge",
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

    if (socketAddNotification) {
      socketAddNotification(formattedNotification);
    }

    setSyncedNotifications(prev => {
      const exists = prev.some(n => n.id === formattedNotification.id);
      if (exists) {
        console.log('Notification already exists in sync state:', formattedNotification.id);
        return prev;
      }
      
      const updated = [formattedNotification, ...prev];
      
      AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      
      if (!formattedNotification.isRead) {
        const newUnreadCount = unreadCount + 1;
        setUnreadCount(newUnreadCount);
        AsyncStorage.setItem(UNREAD_COUNT_STORAGE_KEY, newUnreadCount.toString());
      }
      
      console.log('Added push notification to sync state:', formattedNotification.id);
      return updated;
    });

    return formattedNotification;
  }, [socketAddNotification, unreadCount]);

  const syncNow = useCallback(async () => {
    if (!isConnected) {
      console.log('Cannot sync - socket not connected');
      return false;
    }
    
    setIsSyncing(true);
    try {
      await refreshNotifications();
      
      await loadStoredNotifications();
      
      console.log('Sync completed successfully');
      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isConnected, refreshNotifications, loadStoredNotifications]);


  useEffect(() => {
    loadStoredNotifications();
  }, [loadStoredNotifications]);

  return {
    notifications: syncedNotifications,
    unreadCount,
    isSyncing,
    isConnected,
    handlePushNotification,
    syncNow,
    loadStoredNotifications,
    hasNotifications: syncedNotifications.length > 0,
    hasUnreadNotifications: unreadCount > 0
  };
};