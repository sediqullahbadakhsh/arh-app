// screens/modals/UpdateSlabModal.js
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { useMutation } from "@tanstack/react-query";
import { updateSlab } from "../../services/slabs";
import { scale } from "../../utils/normalizeSize";

const UpdateSlabModal = ({ visible, onClose, onSuccess, slabData }) => {
  const [payload, setPayload] = useState({
    percentage: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (slabData && visible) {
      setPayload({
        percentage: slabData.percentage?.toString() || "",
      });
    }
  }, [slabData, visible]);

  const updateSlabMutation = useMutation({
    mutationFn: ({ id, data }) => updateSlab(id, data),
    onSuccess: () => {
      Alert.alert("Success", "Slab updated successfully");
      onSuccess?.();
    },
    onError: (error) => {
      const message = error?.response?.data?.error || "Failed to update slab";
      Alert.alert("Error", message);
    },
  });

  const validateForm = () => {
    const newErrors = {};
    
    if (!payload.percentage) {
      newErrors.percentage = "Percentage is required";
    } else if (isNaN(payload.percentage) || payload.percentage < 0 || payload.percentage > 100) {
      newErrors.percentage = "Percentage must be between 0 and 100";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayloadChange = (field, value) => {
    setPayload((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleUpdateSlab = async () => {
    if (!validateForm()) return;
    if (!slabData?.id) return;

    await updateSlabMutation.mutateAsync({
      id: slabData.id,
      data: {
        percentage: parseFloat(payload.percentage),
      }
    });
  };

  const handleClose = () => {
    setPayload({ percentage: "" });
    setErrors({});
    onClose();
  };

  const loading = updateSlabMutation.isPending;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update Slab</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.currentSlabInfo}>
              <Text style={styles.infoLabel}>Current Slab Type</Text>
              <Text style={styles.infoValue}>
                {slabData?.slabTypeDetails?.title || "N/A"}
              </Text>
              <Text style={styles.infoNote}>
                Note: Slab type cannot be changed after creation
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.sectionLabel}>Percentage *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  errors.percentage && styles.inputError,
                ]}
                placeholder="Enter percentage (0-100)"
                value={payload.percentage}
                onChangeText={(value) => handlePayloadChange("percentage", value)}
                keyboardType="numeric"
              />
              {errors.percentage && (
                <Text style={styles.errorText}>{errors.percentage}</Text>
              )}
            </View>

            <View style={styles.additionalInfo}>
              <Text style={styles.additionalInfoTitle}>Slab Details</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>For:</Text>
                <Text style={styles.infoValue}>{slabData?.slabFor || "N/A"}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Created:</Text>
                <Text style={styles.infoValue}>
                  {slabData?.createdAt ? new Date(slabData.createdAt).toLocaleDateString() : "N/A"}
                </Text>
              </View>
              {slabData?.updatedAt && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Last Updated:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(slabData.updatedAt).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.updateButton]}
              onPress={handleUpdateSlab}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.updateButtonText}>Update Slab</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: scale.hp(1.55),
    width: "90%",
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: scale.hp(2.1),
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: scale.hp(2.35),
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: scale.hp(0.5),
  },
  modalBody: {
    padding: scale.hp(2.1),
  },
  currentSlabInfo: {
    backgroundColor: "#f8f9fa",
    padding: scale.hp(1.55),
    borderRadius: scale.hp(1.05),
    marginBottom: scale.hp(2.1),
  },
  infoLabel: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
    marginBottom: scale.hp(0.5),
  },
  infoValue: {
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  infoNote: {
    fontSize: scale.hp(1.4),
    color: Colors.textSecondary,
    fontStyle: "italic",
    marginTop: scale.hp(0.5),
  },
  formGroup: {
    marginBottom: scale.hp(2.1),
  },
  sectionLabel: {
    fontSize: scale.hp(1.8),
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: scale.hp(1.05),
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: scale.hp(1.05),
    padding: scale.hp(1.55),
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
  },
  inputError: {
    borderColor: "#dc2626",
  },
  errorText: {
    color: "#dc2626",
    fontSize: scale.hp(1.55),
    marginTop: scale.hp(0.5),
  },
  additionalInfo: {
    backgroundColor: "#dbeafe",
    padding: scale.hp(1.55),
    borderRadius: scale.hp(1.05),
  },
  additionalInfoTitle: {
    fontSize: scale.hp(1.8),
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: scale.hp(1.05),
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: scale.hp(0.5),
  },
  modalFooter: {
    flexDirection: "row",
    padding: scale.hp(2.1),
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: scale.wp(2.1),
  },
  button: {
    flex: 1,
    paddingVertical: scale.hp(1.55),
    borderRadius: scale.hp(1.05),
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  updateButton: {
    backgroundColor: Colors.primary,
  },
  updateButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default UpdateSlabModal;