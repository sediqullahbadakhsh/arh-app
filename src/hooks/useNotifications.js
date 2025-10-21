import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../auth/AuthProvider';

export const useNotifications = () => {
  const { 
    socket, 
    isConnected, 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    getNotifications,
    refreshNotifications: socketRefreshNotifications
  } = useSocket();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const loadNotifications = async () => {
    if (!user?.id) {
      setError('User not available');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('📋 Loading notifications for user:', user.id);
      
      if (isConnected) {
        getNotifications();
      } else {
        console.log('📱 Offline - loading notifications from local storage');
        await socketRefreshNotifications();
      }
    } catch (err) {
      setError('Failed to load notifications');
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const success = await markAsRead(notificationId);
      if (!success) {
        setError('Failed to mark notification as read');
        return false;
      }
      return true;
    } catch (err) {
      setError('Failed to mark notification as read');
      console.error('Error marking notification as read:', err);
      return false;
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const success = await markAllAsRead();
      if (!success) {
        setError('Failed to mark all notifications as read');
        return false;
      }
      return true;
    } catch (err) {
      setError('Failed to mark all notifications as read');
      console.error('Error marking all notifications as read:', err);
      return false;
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      const success = await deleteNotification(notificationId);
      if (!success) {
        setError('Failed to delete notification');
        return false;
      }
      return true;
    } catch (err) {
      setError('Failed to delete notification');
      console.error('Error deleting notification:', err);
      return false;
    }
  };

  const refreshNotifications = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await socketRefreshNotifications();
    } catch (err) {
      setError('Failed to refresh notifications');
      console.error('Error refreshing notifications:', err);
    } finally {
      setLoading(false);
    }
  };


  const formatNotification = (notification) => {
    return {
      id: notification.id,
      title: notification.title?.en || notification.title || 'Notification',
      description: notification.description?.en || notification.description || '',
      isRead: notification.isRead || notification.read || false,
      createdAt: notification.createdAt || notification.created_at || notification.time,
      notificationType: notification.notificationType,
      notiType: notification.notiType,
      ...notification
    };
  };

  const formattedNotifications = notifications.map(formatNotification);


  const sortedNotifications = formattedNotifications.sort((a, b) => {
    const dateA = new Date(a.createdAt || 0);
    const dateB = new Date(b.createdAt || 0);
    return dateB - dateA;
  });

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [isConnected, user?.id]);


  useEffect(() => {
    if (isConnected && error) {
      setError(null);
    }
  }, [isConnected]);

  return {

    notifications: sortedNotifications,
    unreadCount,
    

    loading,
    error,
    
    
    isConnected,
    

    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDeleteNotification,
    refreshNotifications,
    
 
    hasNotifications: sortedNotifications.length > 0,
    hasUnreadNotifications: unreadCount > 0,
  };
};