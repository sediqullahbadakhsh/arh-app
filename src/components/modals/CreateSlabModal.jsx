// screens/modals/CreateSlabModal.js
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createSlabTypeByMerchant, getAllSlabTypesForMerchant } from "../../services/slabType";
import { createSlab } from "../../services/slabs";
import { 
  getCurrentMerchantProfile, 
} from "../../services/merchantProfileService";
import SuccessModal from "./SuccessModal";
import ErrorModal from "./ErrorModal";


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CreateSlabModal = ({ visible, onClose, onSuccess, userInfo }) => {
  const [step, setStep] = useState(1);
  const [fetching, setFetching] = useState(true);
  const [selectedSlabType, setSelectedSlabType] = useState(null);
  const [createNewType, setCreateNewType] = useState(false);
  const [agentId, setAgentId] = useState(null);
  const [merchantData, setMerchantData] = useState(null);
  const [payload, setPayload] = useState({
    title: "",
    manual_generated: true,
    slabTypeId: "",
    percentage: "",
    slabFor: "agent",
  });

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [errors, setErrors] = useState({});

  const { data: slabTypesData, refetch: refetchSlabTypes } = useQuery({
    queryKey: ["merchantSlabTypes"],
    queryFn: () => getAllSlabTypesForMerchant({ limit: 100 }),
  });

  const slabTypes = slabTypesData?.data || [];

  // Modal handlers
  const showCustomSuccessModal = (message) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
  };

  const showCustomErrorModal = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setSuccessMessage("");
  };

  const handleErrorClose = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  const fetchMerchantProfile = async () => {
    try {
      setFetching(true);
      const response = await getCurrentMerchantProfile();
      console.log(response, "this is merchant le")
      setMerchantData(response);
      if (response) {
        if (response.user_id) {
          setAgentId(response?.user_id);
        }
      }
    } catch (error) {
      console.error("Error fetching merchant profile:", error);
      showCustomErrorModal("Failed to load profile data");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchMerchantProfile();
  }, []);

  const createSlabTypeMutation = useMutation({
    mutationFn: createSlabTypeByMerchant,
    onSuccess: (response) => {
      const newSlabType = response.data;
      setSelectedSlabType(newSlabType);
      setPayload(prev => ({
        ...prev,
        slabTypeId: newSlabType.id
      }));
      setStep(2);
      refetchSlabTypes();
      showCustomSuccessModal("Slab type created successfully");
    },
    onError: (error) => {
      const message = error?.response?.data?.error || "Failed to create slab type";
      showCustomErrorModal(message);
    },
  });

  const createSlabMutation = useMutation({
    mutationFn: createSlab,
    onSuccess: () => {
      showCustomSuccessModal("Slab created successfully");
      resetForm();
      onSuccess?.();
      // Auto-close modal after success
      setTimeout(() => {
        handleClose();
      }, 2000);
    },
    onError: (error) => {
      const message = error?.response?.data?.error || "Failed to create slab";
      showCustomErrorModal(message);
    },
  });

  const resetForm = () => {
    setPayload({
      title: "",
      manual_generated: false,
      slabTypeId: "",
      percentage: "",
      slabFor: "agent",
    });
    setSelectedSlabType(null);
    setCreateNewType(false);
    setStep(1);
    setErrors({});
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (createNewType && !payload.title) {
      newErrors.title = "Slab type title is required";
    }
    if (!createNewType && !selectedSlabType) {
      newErrors.slabType = "Please select a slab type";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
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

  const handleNextStep = async () => {
    if (step === 1) {
      if (!validateStep1()) return;

      if (createNewType) {
        await createSlabTypeMutation.mutateAsync({
          title: payload.title,
          manual_generated: payload.manual_generated
        });
      } else {
        setPayload(prev => ({
          ...prev,
          slabTypeId: selectedSlabType.id
        }));
        setStep(2);
      }
    }
  };

  const handleCreateSlab = async () => {
    if (!validateStep2()) return;

    await createSlabMutation.mutateAsync({
      slabTypeId: payload.slabTypeId,
      percentage: parseFloat(payload.percentage),
      slabFor: payload.slabFor,
      isCountry: false,
      countryId: null,
      isProvider: false,
      providerId: null,
      userId: agentId 
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSuccessModalClose = () => {
    handleSuccessClose();
    // If we're on the final step and slab was created successfully, close the modal
    if (step === 2 && successMessage.includes("Slab created")) {
      handleClose();
    }
  };

  const loading = createSlabTypeMutation.isPending || createSlabMutation.isPending;

  return (
    <>
      <Modal
        visible={visible}
        animationType="fade"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleClose}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {step === 1 ? "Select Slab Type" : "Create Slab"}
              </Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {step === 1 && (
                <View style={styles.stepContent}>
                  <View style={styles.typeSelection}>
                    <TouchableOpacity
                      style={[
                        styles.typeOption,
                        !createNewType && styles.typeOptionActive,
                      ]}
                      onPress={() => setCreateNewType(false)}
                    >
                      <Text style={[
                        styles.typeOptionText,
                        !createNewType && styles.typeOptionTextActive,
                      ]}>
                        Select Existing Type
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.typeOption,
                        createNewType && styles.typeOptionActive,
                      ]}
                      onPress={() => setCreateNewType(true)}
                    >
                      <Text style={[
                        styles.typeOptionText,
                        createNewType && styles.typeOptionTextActive,
                      ]}>
                        Create New Type
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {!createNewType ? (
                    <View style={styles.slabTypeList}>
                      <Text style={styles.sectionLabel}>Select Slab Type *</Text>
                      {slabTypes.map((type) => (
                        <TouchableOpacity
                          key={type.id}
                          style={[
                            styles.slabTypeItem,
                            selectedSlabType?.id === type.id && styles.slabTypeItemSelected,
                          ]}
                          onPress={() => setSelectedSlabType(type)}
                        >
                          <Text style={styles.slabTypeName}>{type.title}</Text>
                          <View style={[
                            styles.radio,
                            selectedSlabType?.id === type.id && styles.radioSelected,
                          ]}>
                            {selectedSlabType?.id === type.id && (
                              <View style={styles.radioInner} />
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                      {errors.slabType && (
                        <Text style={styles.errorText}>{errors.slabType}</Text>
                      )}
                    </View>
                  ) : (
                    <View style={styles.createTypeForm}>
                      <Text style={styles.sectionLabel}>Create New Slab Type *</Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          errors.title && styles.inputError,
                        ]}
                        placeholder="Enter slab type title"
                        value={payload.title}
                        onChangeText={(value) => handlePayloadChange("title", value)}
                      />
                      {errors.title && (
                        <Text style={styles.errorText}>{errors.title}</Text>
                      )}
                    </View>
                  )}
                </View>
              )}

              {step === 2 && (
                <View style={styles.stepContent}>
                  <View style={styles.selectedTypeInfo}>
                    <Text style={styles.infoLabel}>Selected Slab Type:</Text>
                    <Text style={styles.infoValue}>{selectedSlabType?.title}</Text>
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
                </View>
              )}
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.modalFooter}>
              {step === 2 && (
                <TouchableOpacity
                  style={[styles.button, styles.backButton]}
                  onPress={() => setStep(1)}
                  disabled={loading}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              {step === 1 ? (
                <TouchableOpacity
                  style={[styles.button, styles.nextButton]}
                  onPress={handleNextStep}
                  disabled={loading}
                >
                  {createSlabTypeMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.nextButtonText}>Next</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.button, styles.createButton]}
                  onPress={handleCreateSlab}
                  disabled={loading}
                >
                  {createSlabMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.createButtonText}>Create Slab</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>


      <SuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Success!"
        message={successMessage}
        buttonText="Continue"
        autoHideDuration={successMessage.includes("Slab created") ? 2000 : 3000}
      />

 
      <ErrorModal
        visible={showErrorModal}
        onClose={handleErrorClose}
        title="Error"
        message={errorMessage}
        buttonText="Try Again"
        showRetryButton={true}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: screenWidth * 0.9,
    maxHeight: screenHeight * 0.8,
    overflow: "hidden",
    margin: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    maxHeight: 400,
  },
  stepContent: {
    padding: 16,
  },
  typeSelection: {
    flexDirection: "row",
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  typeOptionActive: {
    backgroundColor: Colors.primary,
  },
  typeOptionText: {
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  typeOptionTextActive: {
    color: "#fff",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  slabTypeList: {
    marginBottom: 16,
  },
  slabTypeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    marginBottom: 8,
  },
  slabTypeItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#fef2f2",
  },
  slabTypeName: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  createTypeForm: {
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  inputError: {
    borderColor: "#dc2626",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 12,
    marginTop: 4,
  },
  selectedTypeInfo: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  formGroup: {
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
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
  backButton: {
    backgroundColor: "#f3f4f6",
  },
  backButtonText: {
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  nextButton: {
    backgroundColor: Colors.primary,
  },
  nextButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  createButton: {
    backgroundColor: Colors.primary,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default CreateSlabModal;