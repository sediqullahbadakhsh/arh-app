import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Dimensions,
  SafeAreaView,
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
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const NotificationsScreen = () => {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  const navigation = useNavigation();
  
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    deleteNotification,
    isConnected,
    hasNotifications,
    hasUnreadNotifications
  } = useNotifications();

  const goBack = () => {
    navigation.goBack();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  }, [refreshNotifications]);

  const handleNotificationPress = useCallback(async (notification) => {
    try {
      // Store the notification first
      setSelectedNotification(notification);
      setDetailModalVisible(true);

      // Mark as read if needed (but don't wait for it)
      if (!notification.isRead) {
        setTimeout(async () => {
          try {
            await markAsRead(notification.id);
          } catch (err) {
            console.error('Error marking as read in background:', err);
          }
        }, 100); // Small delay to ensure modal opens first
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
      // Still show the modal
      setSelectedNotification(notification);
      setDetailModalVisible(true);
    }
  }, [markAsRead]);

  const handleMarkAllAsRead = useCallback(async () => {
    if (!hasUnreadNotifications) {
      Alert.alert(t('info'), t('allNotificationsRead'));
      return;
    }

    Alert.alert(
      t('markAllAsRead'),
      t('markAllAsReadConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('markAsRead'), 
          style: 'default',
          onPress: async () => {
            const success = await markAllAsRead();
            if (success) {
              Alert.alert(t('success'), t('allNotificationsMarkedRead'));
            } else {
              Alert.alert(t('error'), t('failedToMarkAllRead'));
            }
          }
        }
      ]
    );
  }, [hasUnreadNotifications, markAllAsRead, t]);

  const handleDeleteNotification = useCallback(async (notification, event) => {
    event?.stopPropagation?.();
    
    Alert.alert(
      t('deleteNotification'),
      t('deleteNotificationConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: async () => {
            const success = await deleteNotification(notification.id);
            if (success) {
              console.log('Notification deleted successfully:', notification.id);
            } else {
              Alert.alert(t('error'), t('failedToDeleteNotification'));
            }
          }
        }
      ]
    );
  }, [deleteNotification, t]);

  const handleDeleteAllNotifications = () => {
    if (!hasNotifications) {
      Alert.alert(t('info'), t('noNotificationsToDelete'));
      return;
    }

    Alert.alert(
      t('deleteAllNotifications'),
      t('deleteAllNotificationsConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('deleteAll'), 
          style: 'destructive',
          onPress: () => {
            Alert.alert(t('info'), t('deleteAllFunctionalityComing'));
          }
        }
      ]
    );
  };

  const getNotificationTypeName = useCallback((notification) => {
    try {
      if (!notification) return 'system';
      
      const notiType = notification.notificationType?.name || 
                      notification.notiType ||
                      'system';

      if (typeof notiType === 'string') {
        return notiType.toLowerCase();
      } else if (typeof notiType === 'object' && notiType !== null) {
        return (notiType.en || notiType.ar || 'system').toLowerCase();
      }
      
      return 'system';
    } catch (error) {
      console.log('Error getting notification type:', error);
      return 'system';
    }
  }, []);

  const getNotificationIcon = useCallback((notification) => {
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
  }, [getNotificationTypeName]);

  const formatTime = useCallback((timeString) => {
    if (!timeString) return t('recently');
    
    try {
      const time = new Date(timeString);
      const now = new Date();
      const diffMs = now - time;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return t('justNow');
      if (diffMins < 60) return t('minutesAgo', { count: diffMins });
      if (diffHours < 24) return t('hoursAgo', { count: diffHours });
      if (diffDays < 7) return t('daysAgo', { count: diffDays });
      
      return time.toLocaleDateString();
    } catch (error) {
      return t('recently');
    }
  }, [t]);

  const getNotificationTitle = useCallback((notification) => {
    try {
      if (!notification) return t('notification');
      
      if (typeof notification.title === 'string') {
        return notification.title;
      }
      
      if (notification.title && typeof notification.title === 'object') {
        return notification.title.en || notification.title.ar || t('notification');
      }
      
      return notification.title || t('notification');
    } catch (error) {
      console.log('Error getting notification title:', error);
      return t('notification');
    }
  }, [t]);

  const getNotificationDescription = useCallback((notification) => {
    try {
      if (!notification) return '';
      
      if (typeof notification.description === 'string') {
        return notification.description;
      }
      
      if (notification.description && typeof notification.description === 'object') {
        return notification.description.en || notification.description.ar || '';
      }
      
      return notification.description || '';
    } catch (error) {
      console.log('Error getting notification description:', error);
      return '';
    }
  }, []);

  const renderNotificationItem = useCallback(({ item, index }) => {
    const icon = getNotificationIcon(item);
    const title = getNotificationTitle(item);
    const description = getNotificationDescription(item);
    
    return (
      <TouchableOpacity 
        style={[
          notificationStyles.notificationItem, 
          !item.isRead && notificationStyles.unreadItem,
          index === 0 && notificationStyles.firstItem
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={notificationStyles.notificationContent}>
          <View style={[notificationStyles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
            <Ionicons name={icon.name} size={20} color={icon.color} />
          </View>
          
          <View style={notificationStyles.notificationText}>
            <Text style={[
              notificationStyles.notificationTitle,
              !item.isRead && notificationStyles.unreadTitle
            ]}>
              {title}
            </Text>
            {description ? (
              <Text style={notificationStyles.notificationMessage} numberOfLines={2}>
                {description}
              </Text>
            ) : null}
            <Text style={notificationStyles.notificationTime}>
              {formatTime(item.createdAt)}
            </Text>
          </View>
          
          <View style={notificationStyles.notificationActions}>
            {!item.isRead && (
              <View style={notificationStyles.unreadIndicator}>
                <View style={notificationStyles.unreadDot} />
              </View>
            )}
            
            <TouchableOpacity 
              style={notificationStyles.deleteButton}
              onPress={(e) => handleDeleteNotification(item, e)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={18} color="#999" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [getNotificationIcon, getNotificationTitle, getNotificationDescription, formatTime, handleNotificationPress, handleDeleteNotification]);

  const renderEmptyState = useCallback(() => (
    <View style={notificationStyles.emptyState}>
      <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
      <Text style={notificationStyles.emptyStateText}>{t('noNotifications')}</Text>
      <Text style={notificationStyles.emptyStateSubText}>
        {isConnected 
          ? t('allCaughtUp')
          : t('connectForNotifications')
        }
      </Text>
      {!isConnected && (
        <TouchableOpacity 
          style={notificationStyles.retryButton} 
          onPress={refreshNotifications}
        >
          <Text style={notificationStyles.retryButtonText}>{t('retryConnection')}</Text>
        </TouchableOpacity>
      )}
    </View>
  ), [isConnected, refreshNotifications, t]);

  const renderErrorState = useCallback(() => (
    <View style={notificationStyles.errorState}>
      <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
      <Text style={notificationStyles.errorStateText}>{t('failedToLoadNotifications')}</Text>
      <Text style={notificationStyles.errorStateSubText}>
        {error || t('checkConnectionAndTryAgain')}
      </Text>
      <TouchableOpacity 
        style={notificationStyles.retryButton} 
        onPress={refreshNotifications}
      >
        <Text style={notificationStyles.retryButtonText}>{t('tryAgain')}</Text>
      </TouchableOpacity>
    </View>
  ), [error, refreshNotifications, t]);

  const renderLoadingState = useCallback(() => (
    <View style={notificationStyles.loadingContainer}>
      <Ionicons name="notifications-outline" size={48} color={Colors.primary} />
      <Text style={notificationStyles.loadingText}>{t('loadingNotifications')}</Text>
    </View>
  ), [t]);

  const handleNotificationAction = useCallback((notification) => {
    setDetailModalVisible(false);
    
    const notiType = getNotificationTypeName(notification);
    
    switch (notiType) {
      case 'transaction':
      case 'payment':
      case 'transaction_success':
        navigation.navigate('TransactionHistory');
        break;
      case 'promotion':
      case 'promotional':
      case 'offer':
        navigation.navigate('Promotions');
        break;
      case 'security':
      case 'security_alert':
      case 'login_alert':
        navigation.navigate('Security');
        break;
      case 'low_balance':
      case 'warning':
        navigation.navigate('Topup');
        break;
      default:
        console.log('No specific action for notification type:', notiType);
        break;
    }
  }, [getNotificationTypeName, navigation]);

  const handleSettingsPress = useCallback(() => {
    setSettingsModalVisible(true);
  }, []);

  return (
    <SafeAreaView style={notificationStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <NotificationsHeader 
        title={t('notifications')} 
        onBack={goBack} 
        onOpenModal={handleSettingsPress} 
        unreadCount={unreadCount}
        onMarkAllAsRead={handleMarkAllAsRead}
        hasUnreadNotifications={hasUnreadNotifications}
      />
      
      {!isConnected && (
        <View style={notificationStyles.connectionStatus}>
          <Ionicons name="cloud-offline" size={16} color="#fff" />
          <Text style={notificationStyles.connectionStatusText}>{t('offline')}</Text>
          <Text style={notificationStyles.connectionStatusSubText}>
            {t('showingCachedNotifications')}
          </Text>
        </View>
      )}

      {error && !loading && renderErrorState()}

      {loading && !refreshing && renderLoadingState()}

      {!error && !loading && (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={!loading ? renderEmptyState() : null}
          contentContainerStyle={
            notifications.length === 0 
              ? notificationStyles.emptyList 
              : notificationStyles.listContainer
          }
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          extraData={notifications} // This ensures re-render when notifications change
        />
      )}

      <SettingModal 
        visible={settingsModalVisible} 
        onRequestClose={() => setSettingsModalVisible(false)}
        onDeleteAll={handleDeleteAllNotifications}
        hasNotifications={hasNotifications}
      />

      {selectedNotification && (
        <DetailModal
          visible={detailModalVisible}
          onRequestClose={() => {
            setDetailModalVisible(false);
            setSelectedNotification(null);
          }}
          selectedNotification={selectedNotification}
          onNotificationAction={handleNotificationAction}
          getNotificationIcon={getNotificationIcon}
          getNotificationTitle={getNotificationTitle}
          getNotificationDescription={getNotificationDescription}
          formatTime={formatTime}
          getNotificationTypeName={getNotificationTypeName}
          onMarkAsRead={markAsRead}
        />
      )}
    </SafeAreaView>
  );
};

export default NotificationsScreen;