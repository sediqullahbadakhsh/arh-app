import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from "../../theme/colors";
import { useNavigation } from '@react-navigation/native';
import notificationStyles from './NotificationStyles';
import SettingModal from './Components/SettingModal';
import DetailModal from './Components/DetailModal';
import NotificationsHeader from './Components/NotificationsHeader';
import { useNotifications } from '../../hooks/useNotifications';

const { width } = Dimensions.get('window');

const NotificationsScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  const navigation = useNavigation();
  
  // Use the real notifications hook
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    isConnected
  } = useNotifications();

  const goBack = () => {
    navigation.goBack();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  }, [refreshNotifications]);

  const handleNotificationPress = async (notification) => {
    setSelectedNotification(notification);
    setDetailModalVisible(true);
    
    // Mark as read if not already read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
  };

  const handleMarkAllAsRead = async () => {
    const success = await markAllAsRead();
    if (success) {
      Alert.alert('Success', 'All notifications marked as read');
    } else {
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const handleDeleteNotification = (notification, event) => {
    event.stopPropagation();
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            console.log('Delete notification:', notification.id);
            Alert.alert('Info', 'Delete functionality to be implemented');
          }
        }
      ]
    );
  };

  // Safe function to get notification type name
  const getNotificationTypeName = (notification) => {
    try {
      const notiType = notification.notificationType?.name;
      
      // Handle both string and object formats
      if (typeof notiType === 'string') {
        return notiType.toLowerCase();
      } else if (typeof notiType === 'object' && notiType !== null) {
        // Get English name from multi-language object
        return (notiType.en || notiType.ar || 'system').toLowerCase();
      }
      
      // Fallback to notiType field or default
      return (notification.notiType || 'system').toString().toLowerCase();
    } catch (error) {
      console.log('Error getting notification type:', error);
      return 'system';
    }
  };

  // Map notiType to icons and colors
  const getNotificationIcon = (notification) => {
    const notiType = getNotificationTypeName(notification);

    switch (notiType) {
      case 'success':
      case 'transaction_success':
      case 'payment_success':
        return { name: 'checkmark-circle', color: '#4CAF50' };
      
      case 'security':
      case 'security_alert':
      case 'login_alert':
        return { name: 'shield-checkmark', color: '#2196F3' };
      
      case 'promotion':
      case 'promotional':
      case 'offer':
        return { name: 'gift', color: '#FF9800' };
      
      case 'system':
      case 'system_update':
      case 'maintenance':
        return { name: 'construct', color: '#9C27B0' };
      
      case 'transaction':
      case 'payment':
      case 'transfer':
        return { name: 'arrow-up', color: '#00BCD4' };
      
      case 'warning':
      case 'alert':
      case 'low_balance':
        return { name: 'warning', color: '#FF5722' };
      
      case 'info':
      case 'information':
        return { name: 'information-circle', color: Colors.primary };
      
      case 'error':
      case 'failure':
        return { name: 'close-circle', color: '#f44336' };
      
      default:
        return { name: 'notifications', color: Colors.primary };
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Recently';
    
    try {
      const time = new Date(timeString);
      const now = new Date();
      const diffMs = now - time;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return time.toLocaleDateString();
    } catch (error) {
      return 'Recently';
    }
  };

  const getNotificationTitle = (notification) => {
    try {
      if (typeof notification.title === 'string') {
        return notification.title;
      }
      return notification.title?.en || notification.title || 'Notification';
    } catch (error) {
      return 'Notification';
    }
  };

  const getNotificationDescription = (notification) => {
    try {
      if (typeof notification.description === 'string') {
        return notification.description;
      }
      return notification.description?.en || notification.description || '';
    } catch (error) {
      return '';
    }
  };

  const renderNotificationItem = ({ item }) => {
    const icon = getNotificationIcon(item);
    const title = getNotificationTitle(item);
    const description = getNotificationDescription(item);
    
    return (
      <TouchableOpacity 
        style={[notificationStyles.notificationItem, !item.isRead && notificationStyles.unreadItem]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={notificationStyles.notificationContent}>
          <View style={[notificationStyles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
            <Ionicons name={icon.name} size={20} color={icon.color} />
          </View>
          
          <View style={notificationStyles.notificationText}>
            <Text style={notificationStyles.notificationTitle}>{title}</Text>
            <Text style={notificationStyles.notificationMessage} numberOfLines={2}>
              {description}
            </Text>
            <Text style={notificationStyles.notificationTime}>
              {formatTime(item.createdAt || item.created_at || item.time)}
            </Text>
          </View>
          
          {!item.isRead && <View style={notificationStyles.unreadDot} />}
          
          <TouchableOpacity 
            style={notificationStyles.deleteButton}
            onPress={(e) => handleDeleteNotification(item, e)}
          >
            <Ionicons name="close" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={notificationStyles.emptyState}>
      <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
      <Text style={notificationStyles.emptyStateText}>No notifications</Text>
      <Text style={notificationStyles.emptyStateSubText}>
        {isConnected 
          ? "You're all caught up! New notifications will appear here."
          : "Connect to the internet to receive notifications."
        }
      </Text>
      {!isConnected && (
        <TouchableOpacity style={notificationStyles.retryButton} onPress={refreshNotifications}>
          <Text style={notificationStyles.retryButtonText}>Retry Connection</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderErrorState = () => (
    <View style={notificationStyles.errorState}>
      <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
      <Text style={notificationStyles.errorStateText}>Failed to load notifications</Text>
      <Text style={notificationStyles.errorStateSubText}>{error}</Text>
      <TouchableOpacity style={notificationStyles.retryButton} onPress={refreshNotifications}>
        <Text style={notificationStyles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const handleNotificationAction = (notification) => {
    setDetailModalVisible(false);
    
    // You can add navigation logic based on notification type or content
    const notiType = getNotificationTypeName(notification);
    
    switch (notiType) {
      case 'transaction':
      case 'payment':
        navigation.navigate('TransactionHistory');
        break;
      case 'promotion':
      case 'offer':
        navigation.navigate('Promotions');
        break;
      case 'security_alert':
        navigation.navigate('Security');
        break;
      case 'low_balance':
        navigation.navigate('Topup');
        break;
      default:
        // Default action or no action
        break;
    }
  };

  return (
    <SafeAreaView style={notificationStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <NotificationsHeader 
        title="Notifications" 
        onBack={goBack} 
        onOpenModal={() => setSettingsModalVisible(true)} 
      />
      
      {/* Connection Status Indicator */}
      {!isConnected && (
        <View style={notificationStyles.connectionStatus}>
          <Ionicons name="cloud-offline" size={16} color="#fff" />
          <Text style={notificationStyles.connectionStatusText}>Offline</Text>
        </View>
      )}

      {error ? (
        renderErrorState()
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id?.toString()}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing || loading} 
              onRefresh={onRefresh} 
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={!loading ? renderEmptyState() : null}
          contentContainerStyle={notifications.length === 0 ? notificationStyles.emptyList : notificationStyles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {loading && !refreshing && (
        <View style={notificationStyles.loadingContainer}>
          <Text>Loading notifications...</Text>
        </View>
      )}

      <SettingModal 
        visible={settingsModalVisible} 
        onRequestClose={() => setSettingsModalVisible(false)} 
      />
     
      <DetailModal
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
        selectedNotification={selectedNotification}
        onNotificationAction={handleNotificationAction}
        getNotificationIcon={getNotificationIcon}
        getNotificationTitle={getNotificationTitle}
        getNotificationDescription={getNotificationDescription}
        formatTime={formatTime}
        getNotificationTypeName={getNotificationTypeName}
      />
    </SafeAreaView>
  );
};

export default NotificationsScreen;