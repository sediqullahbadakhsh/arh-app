import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { scale } from "../../utils/normalizeSize";
import { useTranslation } from "react-i18next";

export default function ReverseStockSuccessModal({ visible, onClose, payload }) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={48} color="#059669" />
          </View>
          
          <Text style={styles.title}>{t('reverseStock.successTitle')}</Text>
          <Text style={styles.message}>{t('reverseStock.successMessage')}</Text>

          {payload && (
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('reverseStock.retailer')}:</Text>
                <Text style={styles.detailValue}>{payload.reversedFrom?.user?.username}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('reverseStock.amount')}:</Text>
                <Text style={styles.detailValue}>AFN {parseFloat(payload.amount).toFixed(2)}</Text>
              </View>
              {payload.comment && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('reverseStock.comment')}:</Text>
                  <Text style={styles.detailValue}>{payload.comment}</Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>{t('continue')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale.wp(5),
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderRadius: scale.hp(2.6),
    padding: scale.hp(3.1),
    width: '100%',
    maxWidth: scale.wp(90),
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: scale.hp(2.1),
  },
  title: {
    fontSize: scale.hp(2.35),
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: scale.hp(1.05),
    textAlign: 'center',
  },
  message: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: scale.hp(2.6),
    lineHeight: scale.hp(2.35),
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: scale.hp(1.3),
    padding: scale.hp(2.1),
    marginBottom: scale.hp(2.6),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: scale.hp(1.05),
  },
  detailLabel: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: scale.hp(1.3),
    paddingHorizontal: scale.wp(6.2),
    paddingVertical: scale.hp(1.55),
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: scale.hp(1.8),
    fontWeight: '600',
  },
});