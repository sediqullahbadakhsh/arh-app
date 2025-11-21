import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
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

function SettingModal({ visible, onRequestClose }) {
  const { t } = useTranslation();
  const [modalSlideAnim] = useState(new Animated.Value(screenHeight));
  const insets = useSafeAreaInsets();
  
  const [notificationSettings, setNotificationSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    transactionAlerts: true,
    securityAlerts: true,
    promotionalOffers: false,
    systemUpdates: true
  });

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

  const toggleSetting = (setting) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
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
              height: '87%',
              marginBottom: -insets.bottom
            }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('notificationSettings')}</Text>
            <TouchableOpacity 
              onPress={onRequestClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollContent}>
            <Text style={styles.settingsSectionTitle}>{t('pushNotifications')}</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications" size={20} color="#333" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>{t('pushNotifications')}</Text>
                  <Text style={styles.settingDescription}>{t('receiveNotificationsDevice')}</Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.pushNotifications}
                onValueChange={() => toggleSetting('pushNotifications')}
                trackColor={{ false: '#f0f0f0', true: `${Colors.primary}50` }}
                thumbColor={notificationSettings.pushNotifications ? Colors.primary : '#f4f3f4'}
              />
            </View>

            <Text style={styles.settingsSectionTitle}>{t('notificationTypes')}</Text>
            
            {[
              { key: 'transactionAlerts', icon: 'arrow-up', title: t('transactionAlerts'), desc: t('transactionAlertsDesc') },
              { key: 'securityAlerts', icon: 'shield-checkmark', title: t('securityAlerts'), desc: t('securityAlertsDesc') },
              { key: 'promotionalOffers', icon: 'gift', title: t('promotionalOffers'), desc: t('promotionalOffersDesc') },
              { key: 'systemUpdates', icon: 'construct', title: t('systemUpdates'), desc: t('systemUpdatesDesc') },
            ].map((setting) => (
              <View key={setting.key} style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Ionicons name={setting.icon} size={20} color="#333" />
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>{setting.title}</Text>
                    <Text style={styles.settingDescription}>{setting.desc}</Text>
                  </View>
                </View>
                <Switch
                  value={notificationSettings[setting.key]}
                  onValueChange={() => toggleSetting(setting.key)}
                  trackColor={{ false: '#f0f0f0', true: `${Colors.primary}50` }}
                  thumbColor={notificationSettings[setting.key] ? Colors.primary : '#f4f3f4'}
                />
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={onRequestClose}
            >
              <Text style={styles.saveButtonText}>{t('saveSettings')}</Text>
            </TouchableOpacity>
          </View>
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
    paddingBottom: scale.hp(12.9),
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
  settingsSectionTitle: {
    fontSize: scale.hp(2.1),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: scale.hp(2.1),
    marginBottom: scale.hp(1.55),
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale.hp(1.55),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: scale.wp(2.9),
    flex: 1,
  },
  settingTitle: {
    fontSize: scale.hp(2.1),
    color: Colors.textPrimary,
    marginBottom: scale.hp(0.25),
  },
  settingDescription: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
    lineHeight: scale.hp(2.1),
  },
  modalActions: {
    marginTop: scale.hp(2.1),
    paddingTop: scale.hp(2.1),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    padding: scale.hp(2.1),
    borderRadius: scale.hp(1.55),
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: scale.hp(2.1),
    fontWeight: '600',
  },
};
export default SettingModal;