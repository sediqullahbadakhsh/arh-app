import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../auth/AuthProvider';

export const useNotifications = () => {
  const { socket, isConnected, notifications, unreadCount, markAsRead, markAllAsRead, getNotifications } = useSocket();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const loadNotifications = async () => {
    if (!isConnected || !user?.id) {
      setError('Not connected to server or user not available');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {

      console.log('📋 Loading notifications for user:', user.id);
      getNotifications();
    } catch (err) {
      setError('Failed to load notifications');
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    if (!isConnected) {
      setError('Not connected to server');
      return false;
    }

    try {
      markAsRead(notificationId);
      return true;
    } catch (err) {
      setError('Failed to mark notification as read');
      console.error('Error marking notification as read:', err);
      return false;
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!isConnected) {
      setError('Not connected to server');
      return false;
    }

    try {
      markAllAsRead();
      return true;
    } catch (err) {
      setError('Failed to mark all notifications as read');
      console.error('Error marking all notifications as read:', err);
      return false;
    }
  };

  // Format notification for display
  const formatNotification = (notification) => {
    return {
      ...notification,
      title: notification.title?.en || notification.title || 'Notification',
      description: notification.description?.en || notification.description || '',
      isRead: notification.isRead || notification.read || false,
    };
  };

  const formattedNotifications = notifications.map(formatNotification);

  useEffect(() => {
    if (isConnected && user?.id) {
      loadNotifications();
    }
  }, [isConnected, user?.id]);

  return {
    notifications: formattedNotifications,
    unreadCount,
    loading,
    error,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    refreshNotifications: loadNotifications,
    isConnected,
  };
};