import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet, // Add this import
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { scale } from "../../utils/normalizeSize";
import { useTranslation } from "react-i18next";

export default function ReverseStockErrorModal({ 
  visible, 
  onClose, 
  onRetry,
  title,
  error,
  payload 
}) {
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
          <View style={styles.errorIcon}>
            <Ionicons name="close-circle" size={48} color="#DC2626" />
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{error}</Text>

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
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.retryButton]} 
              onPress={onRetry}
            >
              <Text style={styles.retryButtonText}>{t('retry')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
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
  errorIcon: {
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
    backgroundColor: '#FEF2F2',
    borderRadius: scale.hp(1.3),
    padding: scale.hp(2.1),
    marginBottom: scale.hp(2.6),
    borderWidth: 1,
    borderColor: '#FECACA',
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
  buttonContainer: {
    flexDirection: 'row',
    gap: scale.wp(3.1),
    width: '100%',
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale.hp(1.3),
    padding: scale.hp(1.55),
  },
  retryButton: {
    backgroundColor: Colors.primary,
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E4E7EC',
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: scale.hp(1.8),
    fontWeight: '600',
  },
  cancelButtonText: {
    color: Colors.textPrimary,
    fontSize: scale.hp(1.8),
    fontWeight: '600',
  },
});