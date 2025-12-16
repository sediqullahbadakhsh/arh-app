import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../auth/AuthProvider';

export const useNotifications = () => {
  const { 
    socket, 
    isConnected, 
    notifications: contextNotifications, 
    unreadCount, 
    markAsRead: socketMarkAsRead, 
    markAllAsRead: socketMarkAllAsRead, 
    deleteNotification: socketDeleteNotification,
    getNotifications,
    refreshNotifications: socketRefreshNotifications
  } = useSocket();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();
  
  const isInitialLoadRef = useRef(false);

  const formatNotification = useCallback((notification) => {
    if (!notification) return null;
    
    return {
      id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: notification.title?.en || notification.title || 'Notification',
      description: notification.description?.en || notification.description || '',
      isRead: notification.isRead || notification.read || false,
      createdAt: notification.createdAt || notification.created_at || notification.time || new Date().toISOString(),
      notificationType: notification.notificationType || notification.notiType || { name: 'General' },
      notiType: notification.notiType || notification.notificationType?.name?.toLowerCase() || 'general',
      from: notification.from || 'Yes Charge',
      data: notification.data || {},
      ...notification
    };
  }, []);

  useEffect(() => {
    if (contextNotifications && contextNotifications.length > 0) {
      const formatted = contextNotifications
        .map(formatNotification)
        .filter(Boolean)
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA; 
        });
      
      setNotifications(formatted);
      
      if (error && formatted.length > 0) {
        setError(null);
      }
    } else if (contextNotifications && contextNotifications.length === 0) {
      setNotifications([]);
    }
  }, [contextNotifications, formatNotification, error]);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      setError('User not available');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading notifications for user:', user.id);
      
      if (isConnected && socket) {
        getNotifications();
      } else {
        console.log('Offline - loading notifications from local storage');
        await socketRefreshNotifications();
      }
    } catch (err) {
      setError('Failed to load notifications');
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isConnected, socket, getNotifications, socketRefreshNotifications]);

  const handleMarkAsRead = useCallback(async (notificationId) => {
    try {
      console.log('Marking notification as read:', notificationId);
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true } 
            : notif
        )
      );
      
      const success = await socketMarkAsRead(notificationId);
      
      if (!success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: false } 
              : notif
          )
        );
        setError('Failed to mark notification as read');
        return false;
      }
      
      return true;
    } catch (err) {
      setError('Failed to mark notification as read');
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, [socketMarkAsRead]);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      
      const success = await socketMarkAllAsRead();
      
      if (!success) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: false }))
        );
        setError('Failed to mark all notifications as read');
        return false;
      }
      
      return true;
    } catch (err) {
      setError('Failed to mark all notifications as read');
      console.error('Error marking all notifications as read:', err);
      return false;
    }
  }, [socketMarkAllAsRead]);

  const handleDeleteNotification = useCallback(async (notificationId) => {
    try {
      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );
      
      const success = await socketDeleteNotification(notificationId);
      
      if (!success) {
        loadNotifications();
        setError('Failed to delete notification');
        return false;
      }
      
      return true;
    } catch (err) {
      setError('Failed to delete notification');
      console.error('Error deleting notification:', err);
      return false;
    }
  }, [socketDeleteNotification, loadNotifications]);

  const refreshNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await socketRefreshNotifications();
    } catch (err) {
      setError('Failed to refresh notifications');
      console.error('Error refreshing notifications:', err);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }, [socketRefreshNotifications]);

  useEffect(() => {
    if (user?.id && !isInitialLoadRef.current) {
      isInitialLoadRef.current = true;
      loadNotifications();
    }
  }, [user?.id, loadNotifications]);

  useEffect(() => {
    if (isConnected && error) {
      setError(null);
    }
  }, [isConnected, error]);

  useEffect(() => {
    if (user?.id) {
      isInitialLoadRef.current = false;
    }
  }, [user?.id]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    isConnected,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDeleteNotification,
    refreshNotifications,
    hasNotifications: notifications.length > 0,
    hasUnreadNotifications: unreadCount > 0,
    

    formatNotification
  };
};