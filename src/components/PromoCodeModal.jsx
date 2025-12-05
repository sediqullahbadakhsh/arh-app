import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from "react-native";

import { useTranslation } from "react-i18next";
import { scale } from "../utils/normalizeSize";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";

function PromoCodeModal({
  visible,
  onClose,
  onApplyPromoCode,
  isLoading = false
}) {
  const { t } = useTranslation();
  const [promoCode, setPromoCode] = useState("");
  const [error, setError] = useState("");

  const handleApply = async () => {
    if (!promoCode.trim()) {
      setError(t('promoCode.enterCode'));
      return;
    }

    setError("");
    const success = await onApplyPromoCode(promoCode.trim());
    
    if (success) {
      setPromoCode("");
      // Don't close automatically - let parent handle it
    }
  };

  const handleClose = () => {
    setPromoCode("");
    setError("");
    onClose();
  };

  const handleInputChange = (text) => {
    setPromoCode(text);
    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('promoCode.applyPromoCode')}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.modalBody}>
            <View style={styles.inputContainer}>
              <Ionicons name="pricetag-outline" size={20} color={Colors.primary} />
              <TextInput
                style={styles.textInput}
                placeholder={t('promoCode.enterPromoCode')}
                placeholderTextColor={Colors.textSecondary}
                value={promoCode}
                onChangeText={handleInputChange}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!isLoading}
                returnKeyType="done"
                onSubmitEditing={handleApply}
              />
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="warning-outline" size={16} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : (
              <Text style={styles.helperText}>
                {t('promoCode.enterCodeDescription')}
              </Text>
            )}

            {/* Promo Code Benefits */}
            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>
                {t('promoCode.benefits')}
              </Text>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.benefitText}>
                  {t('promoCode.discountOnFees')}
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.benefitText}>
                  {t('promoCode.instantApplication')}
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.benefitText}>
                  {t('promoCode.oneTimeUse')}
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.applyButton,
                (!promoCode.trim() || isLoading) && styles.applyButtonDisabled
              ]}
              onPress={handleApply}
              disabled={!promoCode.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.applyButtonText}>
                    {t('promoCode.applyCode')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: scale.hp(2.5),
    borderTopRightRadius: scale.hp(2.5),
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: scale.hp(2),
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: scale.hp(2.25),
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
  },
  closeButton: {
    padding: scale.hp(0.5),
  },
  modalBody: {
    padding: scale.hp(2),
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: scale.hp(1.5),
    paddingHorizontal: scale.hp(1.5),
    paddingVertical: scale.hp(1),
    backgroundColor: "#FFFFFF",
    marginBottom: scale.hp(1),
  },
  textInput: {
    flex: 1,
    fontSize: scale.hp(1.75),
    color: Colors.textPrimary,
    marginLeft: scale.hp(1),
    padding: 0,
    includeFontPadding: false,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    padding: scale.hp(1),
    borderRadius: scale.hp(1),
    marginBottom: scale.hp(1),
  },
  errorText: {
    color: "#DC2626",
    fontSize: scale.hp(1.5),
    fontWeight: "500",
    marginLeft: scale.hp(0.5),
  },
  helperText: {
    color: Colors.textSecondary,
    fontSize: scale.hp(1.5),
    marginBottom: scale.hp(2),
  },
  benefitsContainer: {
    backgroundColor: "#F8FAFC",
    padding: scale.hp(1.5),
    borderRadius: scale.hp(1),
    marginTop: scale.hp(1),
  },
  benefitsTitle: {
    fontSize: scale.hp(1.75),
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: scale.hp(1),
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale.hp(0.5),
  },
  benefitText: {
    fontSize: scale.hp(1.5),
    color: Colors.textSecondary,
    marginLeft: scale.hp(0.5),
  },
  modalFooter: {
    flexDirection: "row",
    padding: scale.hp(2),
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: scale.hp(1),
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale.hp(1.5),
    borderRadius: scale.hp(1),
    gap: scale.hp(0.5),
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: scale.hp(1.75),
    fontWeight: "600",
  },
  applyButton: {
    backgroundColor: Colors.primary,
  },
  applyButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.6,
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: scale.hp(1.75),
    fontWeight: "600",
  },
});

export default PromoCodeModal;