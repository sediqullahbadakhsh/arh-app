// src/components/StripePaymentModal.jsx
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Colors } from "../theme/colors";
import PrimaryButton from "./PrimaryButton";
import { makeRecharge } from "../services/merchantApi";
import { getSetaraganMnoId } from "../utils/getCompanyIdForSetaragan";

const StripePaymentModal = ({
  open,
  onClose,
  onSuccess,
  amount,
  phone,
  countryId,
  usdAmount,
}) => {
  const [loading, setLoading] = useState(false);

  const processStripePayment = async () => {
    try {
      setLoading(true);
      
      const operatorId = getSetaraganMnoId(phone);
      if (!operatorId) {
        Alert.alert(
          "Invalid Number",
          "The number you have added is not matching with any mobile network in Afghanistan"
        );
        return;
      }

      // Create payload for Stripe payment
      const payload = {
        receiver: phone.replace(/\s/g, ""),
        amount: parseFloat(amount),
        source: "stripe_card",
        operator: operatorId.toString(),
        currency: "AFN",
        countryId: countryId,
        productId: 2,
        cardCurrency: "USD",
        cardAmount: parseFloat(usdAmount),
        confirmNow: true,
      };

      // Make the recharge request
      const res = await makeRecharge(payload);
      
      // Handle success
      onSuccess(res.txnNumber);
    } catch (error) {
      console.log("Stripe payment error: ", error);
      const message =
        error.response?.data?.error ||
        error.message ||
        "Failed to process payment";
      
      Alert.alert("Payment Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      transparent
      visible={open}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Stripe Payment</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.paymentDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone Number:</Text>
              <Text style={styles.detailValue}>{phone}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount (AFN):</Text>
              <Text style={styles.detailValue}>{amount}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount (USD):</Text>
              <Text style={styles.detailValue}>{usdAmount}</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Processing payment...</Text>
            </View>
          ) : (
            <PrimaryButton
              label="Confirm Payment"
              onPress={processStripePayment}
              style={styles.confirmButton}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    fontSize: 24,
    color: Colors.textSecondary,
  },
  paymentDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: Colors.textSecondary,
  },
  confirmButton: {
    marginTop: 10,
  },
});

export default StripePaymentModal;