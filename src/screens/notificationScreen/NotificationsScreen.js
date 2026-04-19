import React, { useState, useCallback, useEffect } from 'react';
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
    hasUnreadNotifications,
    syncNow
  } = useNotifications();

  useEffect(() => {
    console.log('📱 NotificationsScreen - Current state:', {
      notificationsCount: notifications.length,
      unreadCount,
      loading,
      error: error?.substring(0, 50),
      isConnected
    });
    
    if (notifications.length > 0) {
      console.log('First notification sample:', {
        id: notifications[0].id,
        title: notifications[0].title,
        description: notifications[0].description,
        isRead: notifications[0].isRead,
        createdAt: notifications[0].createdAt
      });
    }
  }, [notifications, unreadCount, loading, error, isConnected]);

  const goBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    console.log('Manual refresh triggered');
    setRefreshing(true);
    try {
      await refreshNotifications();
    } catch (err) {
      console.error('❌ Refresh error:', err);
      Alert.alert(t('error'), t('failedToRefresh'));
    } finally {
      setRefreshing(false);
    }
  }, [refreshNotifications, t]);

  const handleNotificationPress = useCallback(async (notification) => {
    try {
      const notificationId = notification.id || notification.data?.id;
      
      console.log('Notification pressed:', notificationId, notification.title);
      
      setSelectedNotification(notification);
      setDetailModalVisible(true);
      if (!notification.isRead && notificationId) {
        setTimeout(async () => {
          try {
            await markAsRead(notificationId);
          } catch (err) {
            console.error('Error marking as read:', err);
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
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
              console.log('All notifications marked as read');
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
    
    const notificationId = notification.id || notification.data?.id;
    
    Alert.alert(
      t('deleteNotification'),
      t('deleteNotificationConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: async () => {
            if (notificationId) {
              const success = await deleteNotification(notificationId);
              if (success) {
                console.log('✅ Notification deleted:', notificationId);
              } else {
                Alert.alert(t('error'), t('failedToDeleteNotification'));
              }
            }
          }
        }
      ]
    );
  }, [deleteNotification, t]);

  const handleDeleteAllNotifications = useCallback(() => {
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
          onPress: async () => {
            try {
              Alert.alert(t('info'), t('deleteAllFunctionalityComing'));
            } catch (error) {
              Alert.alert(t('error'), t('failedToDeleteAll'));
            }
          }
        }
      ]
    );
  }, [hasNotifications, t]);

  const getNotificationTypeName = useCallback((notification) => {
    try {
      if (!notification) return 'system';
      
      if (notification.notificationType?.name) {
        const typeName = notification.notificationType.name;
        if (typeof typeName === 'string') {
          return typeName.toLowerCase();
        } else if (typeof typeName === 'object' && typeName !== null) {
          return (typeName.en || typeName.dr || typeName.ps || 'system').toLowerCase();
        }
      }
      
      const notiType = notification.notiType || 
                      notification.notificationType?.id ||
                      notification.type ||
                      'system';

      if (typeof notiType === 'string') {
        return notiType.toLowerCase();
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
      case 'order successful':
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
      case 'stock transferred to your wallet':
      case 'loan stock request accepted':
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
      case 'order failed':
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
      console.log('Error formatting time:', error);
      return t('recently');
    }
  }, [t]);

  const getNotificationTitle = useCallback((notification) => {
    try {
      if (!notification) return t('notification');
      
      if (notification.title && typeof notification.title === 'object') {
        return notification.title.en || notification.title.dr || notification.title.ps || t('notification');
      }
      
      if (typeof notification.title === 'string') {
        return notification.title;
      }
      
      return t('notification');
    } catch (error) {
      console.log('Error getting notification title:', error);
      return t('notification');
    }
  }, [t]);

  const getNotificationDescription = useCallback((notification) => {
    try {
      if (!notification) return '';
      if (notification.description && typeof notification.description === 'object') {
        return notification.description.en || notification.description.dr || notification.description.ps || '';
      }
      
      if (typeof notification.description === 'string') {
        return notification.description;
      }
      
      return '';
    } catch (error) {
      console.log('Error getting notification description:', error);
      return '';
    }
  }, []);

  const renderNotificationItem = useCallback(({ item, index }) => {
    const notification = {
      id: item.id || item.data?.id,
      title: getNotificationTitle(item),
      description: getNotificationDescription(item),
      isRead: item.isRead === true,
      createdAt: item.createdAt || item.data?.createdAt,
      notiType: item.notiType || item.notificationType?.name,
      notificationType: item.notificationType,
      from: item.from || item.data?.from || 'YES Charge',
    };
    
    const icon = getNotificationIcon(notification);
    
    return (
      <TouchableOpacity 
        style={[
          notificationStyles.notificationItem, 
          !notification.isRead && notificationStyles.unreadItem,
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
              !notification.isRead && notificationStyles.unreadTitle
            ]} numberOfLines={2}>
              {notification.title}
            </Text>
            {notification.description ? (
              <Text style={notificationStyles.notificationMessage} numberOfLines={2}>
                {notification.description}
              </Text>
            ) : null}
            <Text style={notificationStyles.notificationTime}>
              {formatTime(notification.createdAt)}
            </Text>
          </View>
          
          <View style={notificationStyles.notificationActions}>
            {!notification.isRead && (
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
  }, [getNotificationTitle, getNotificationDescription, getNotificationIcon, formatTime, handleNotificationPress, handleDeleteNotification]);

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
        {error?.substring(0, 100) || t('checkConnectionAndTryAgain')}
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
    setSelectedNotification(null);
    
    const notiType = getNotificationTypeName(notification);
    
    console.log('📍 Navigating for notification type:', notiType);
    
    switch (notiType) {
      case 'transaction':
      case 'payment':
      case 'transaction_success':
      case 'order successful':
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
      case 'stock transferred to your wallet':
      case 'loan stock request accepted':
        navigation.navigate('Wallet');
        break;
      case 'order failed':
      case 'error':
      case 'failure':
        navigation.navigate('TransactionHistory');
        break;
      default:
        console.log('No specific action for notification type:', notiType);
        break;
    }
  }, [getNotificationTypeName, navigation]);

  const handleSettingsPress = useCallback(() => {
    setSettingsModalVisible(true);
  }, []);

  const handleSyncPress = useCallback(async () => {
    if (!isConnected) {
      Alert.alert(t('offline'), t('connectToSyncNotifications'));
      return;
    }
    
    setRefreshing(true);
    try {
      const success = await syncNow();
      if (success) {
        console.log('✅ Sync completed successfully');
      } else {
        Alert.alert(t('error'), t('syncFailed'));
      }
    } catch (err) {
      console.error('❌ Sync error:', err);
      Alert.alert(t('error'), t('syncFailed'));
    } finally {
      setRefreshing(false);
    }
  }, [isConnected, syncNow, t]);

  const renderContent = () => {
    if (error && !loading) {
      return renderErrorState();
    }

    if (loading && !refreshing) {
      return renderLoadingState();
    }

    if (!error && !loading && notifications.length === 0) {
      return renderEmptyState();
    }

    return (
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item, index) => {
          const id = item.id || item.data?.id || `notification-${index}`;
          return id.toString();
        }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={
          notifications.length === 0 
            ? notificationStyles.emptyList 
            : notificationStyles.listContainer
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    );
  };

  return (
    <SafeAreaView style={notificationStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#9F0901" />
      
      <NotificationsHeader 
        title={t('notifications')} 
        onBack={goBack} 
        onOpenModal={handleSettingsPress} 
        unreadCount={unreadCount}
        onMarkAllAsRead={handleMarkAllAsRead}
        hasUnreadNotifications={hasUnreadNotifications}
        onSync={handleSyncPress}
      />
      
      {/* {!isConnected && (
        <View style={notificationStyles.connectionStatus}>
          <Ionicons name="cloud-offline" size={16} color="#fff" />
          <Text style={notificationStyles.connectionStatusText}>{t('offline')}</Text>
          <Text style={notificationStyles.connectionStatusSubText}>
            {t('showingCachedNotifications')}
          </Text>
        </View>
      )} */}

      {renderContent()}

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