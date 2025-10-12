// In Components/DetailModal.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
  Easing,
  Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../../theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: screenHeight } = Dimensions.get('window');

function DetailModal({ 
  visible, 
  onRequestClose, 
  selectedNotification, 
  onNotificationAction,
  getNotificationIcon,
  getNotificationTitle,
  getNotificationDescription,
  formatTime,
  getNotificationTypeName
}) {
  const [modalSlideAnim] = useState(new Animated.Value(screenHeight));
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      Animated.timing(modalSlideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.back(1)),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(modalSlideAnim, {
        toValue: screenHeight,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!selectedNotification) return null;

  const icon = getNotificationIcon(selectedNotification);
  const title = getNotificationTitle(selectedNotification);
  const description = getNotificationDescription(selectedNotification);
  const time = formatTime(selectedNotification.createdAt || selectedNotification.created_at || selectedNotification.time);
  const notiType = getNotificationTypeName(selectedNotification);

  // Determine if we should show an action button based on notification type
  const shouldShowAction = () => {
    return ['transaction', 'payment', 'promotion', 'security_alert', 'low_balance'].includes(notiType);
  };

  const getActionButtonText = () => {
    switch (notiType) {
      case 'transaction':
      case 'payment':
        return 'View Transactions';
      case 'promotion':
        return 'View Offers';
      case 'security_alert':
        return 'Review Security';
      case 'low_balance':
        return 'Top Up Now';
      default:
        return 'View Details';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={onRequestClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onRequestClose}
        />
        <Animated.View 
          style={[
            styles.modalCard,
            { 
              transform: [{ translateY: modalSlideAnim }],
              height: '70%',
              marginBottom: -insets.bottom
            }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Notification Details</Text>
            <TouchableOpacity 
              onPress={onRequestClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollContent}>
            <View style={styles.detailHeader}>
              <View style={[styles.detailIconContainer, 
                { backgroundColor: `${icon.color}15` }]}>
                <Ionicons 
                  name={icon.name} 
                  size={24} 
                  color={icon.color} 
                />
              </View>
              <View style={styles.detailTitle}>
                <Text style={styles.detailTitleText}>{title}</Text>
                <Text style={styles.detailTime}>{time}</Text>
                <Text style={styles.notificationType}>
                  Type: {notiType.charAt(0).toUpperCase() + notiType.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.detailContent}>
              <Text style={styles.detailMessage}>{description}</Text>
              
              {shouldShowAction() && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => onNotificationAction(selectedNotification)}
                >
                  <Text style={styles.actionButtonText}>
                    {getActionButtonText()}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = {
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: Colors.textPrimary 
  },
  closeButton: {
    padding: 4,
  },
  modalScrollContent: {
    flex: 1,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailTitle: {
    flex: 1,
  },
  detailTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  detailTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  notificationType: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  detailContent: {
    marginBottom: 20,
  },
  detailMessage: {
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 24,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
};

export default DetailModal;