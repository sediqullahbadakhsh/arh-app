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
import { useTranslation } from "react-i18next";
import { scale } from "../../../utils/normalizeSize";

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
  const { t } = useTranslation();
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

 
  const shouldShowAction = () => {
    return ['transaction', 'payment', 'promotion', 'security_alert', 'low_balance'].includes(notiType);
  };

  const getActionButtonText = () => {
    switch (notiType) {
      case 'transaction':
      case 'payment':
        return t('viewTransactions');
      case 'promotion':
        return t('viewOffers');
      case 'security_alert':
        return t('reviewSecurity');
      case 'low_balance':
        return t('topUpNow');
      default:
        return t('viewDetails');
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
            <Text style={styles.modalTitle}>{t('notificationDetails')}</Text>
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
                  {t('type')}: {notiType.charAt(0).toUpperCase() + notiType.slice(1)}
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
    borderTopLeftRadius: scale.hp(3.2),
    borderTopRightRadius: scale.hp(3.2),
    padding: scale.hp(2.1),
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -scale.hp(0.25) },
    shadowOpacity: 0.25,
    shadowRadius: scale.hp(0.5),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale.hp(2.1),
    paddingBottom: scale.hp(1.55),
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: scale.hp(2.35),
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: scale.hp(0.5),
  },
  modalScrollContent: {
    flex: 1,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale.hp(2.6),
  },
  detailIconContainer: {
    width: scale.wp(11.7),
    height: scale.wp(11.7),
    borderRadius: scale.wp(5.85),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale.wp(2.9),
  },
  detailTitle: {
    flex: 1,
  },
  detailTitleText: {
    fontSize: scale.hp(2.35),
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: scale.hp(0.5),
  },
  detailTime: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
    marginBottom: scale.hp(0.25),
  },
  notificationType: {
    fontSize: scale.hp(1.4),
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  detailContent: {
    marginBottom: scale.hp(2.6),
  },
  detailMessage: {
    fontSize: scale.hp(2.1),
    color: Colors.textPrimary,
    lineHeight: scale.hp(3.1),
    marginBottom: scale.hp(2.6),
  },
  actionButton: {
    backgroundColor: Colors.primary,
    padding: scale.hp(2.1),
    borderRadius: scale.hp(1.55),
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: scale.hp(2.1),
    fontWeight: '600',
  },
};

export default DetailModal;