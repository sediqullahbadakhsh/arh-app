// screens/tickets/CreateTicketScreen.js
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";
import PrimaryButton from "../../components/PrimaryButton";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createTicket, getTicketTypes } from "../../services/ticketService";
import { useUser } from "../../context/userContext";
import SuccessModal from "../../components/modals/SuccessModal";
import ErrorModal from "../../components/modals/ErrorModal";
import { scale } from "../../utils/normalizeSize";
import { useTranslation } from "react-i18next";

export default function CreateTicketScreen({ navigation }) {
  const { t } = useTranslation();
  const { user } = useUser();
  const [formData, setFormData] = useState({
    ticketTypeId: "",
    mobileNumber: "",
    txnNumber: "",
    description: "",
  });
  const [attachment, setAttachment] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [selectedTicketType, setSelectedTicketType] = useState(null);
  const [showTicketTypes, setShowTicketTypes] = useState(false);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [createdTicket, setCreatedTicket] = useState(null);

  // Fetch ticket types
  const { data: ticketTypes = [], isLoading: loadingTypes } = useQuery({
    queryKey: ["ticketTypes"],
    queryFn: getTicketTypes,
  });

  // Create ticket mutation
  const mutation = useMutation({
    mutationFn: createTicket,
    onSuccess: (response) => {
      setCreatedTicket(response.data);
      setSuccessMessage(t('tickets.createSuccess'));
      setShowSuccessModal(true);
      resetForm();
    },
    onError: (error) => {
      console.error("Ticket creation failed:", error);
      setErrorMessage(error.response?.data?.message || t('tickets.createError'));
      setShowErrorModal(true);
    },
  });

  useEffect(() => {
    if (formData.ticketTypeId && ticketTypes) {
      const type = ticketTypes.find(t => t.id === parseInt(formData.ticketTypeId));
      setSelectedTicketType(type);
    } else {
      setSelectedTicketType(null);
    }
  }, [formData.ticketTypeId, ticketTypes]);

  const resetForm = () => {
    setFormData({
      ticketTypeId: "",
      mobileNumber: "",
      txnNumber: "",
      description: "",
    });
    setAttachment(null);
    setValidationErrors({});
    setSelectedTicketType(null);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setAttachment(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = () => {
    setAttachment(null);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.ticketTypeId) {
      errors.ticketTypeId = t('tickets.validation.ticketTypeRequired');
    }
    
    if (!formData.description) {
      errors.description = t('tickets.validation.descriptionRequired');
    }

    if (selectedTicketType) {
      const typeName = selectedTicketType.name.toLowerCase();
      
      if ((typeName.includes("mistaken") || typeName.includes("recharge")) && !formData.mobileNumber) {
        errors.mobileNumber = t('tickets.validation.mobileRequired');
      }
      
      if ((typeName.includes("mistaken") || typeName.includes("recharge")) && !formData.txnNumber) {
        errors.txnNumber = t('tickets.validation.transactionRequired');
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    const submitForm = new FormData();
    submitForm.append("agentId", user?.id);
    submitForm.append("ticketTypeId", formData.ticketTypeId);
    submitForm.append("description", formData.description);
    
    if (formData.mobileNumber) submitForm.append("mobileNumber", formData.mobileNumber);
    if (formData.txnNumber) submitForm.append("txnNumber", formData.txnNumber);
    
    if (attachment) {
      const fileType = attachment.uri.split('.').pop();
      submitForm.append("attachment", {
        uri: attachment.uri,
        type: `image/${fileType}`,
        name: `ticket_attachment.${fileType}`
      });
    }
    
    mutation.mutate(submitForm);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setSuccessMessage("");
    navigation.goBack();
  };

  const handleErrorClose = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  const renderTicketTypeItem = (type) => (
    <TouchableOpacity
      key={type.id}
      style={[
        styles.ticketTypeItem,
        formData.ticketTypeId === type.id.toString() && styles.ticketTypeItemSelected
      ]}
      onPress={() => {
        handleChange('ticketTypeId', type.id.toString());
        setShowTicketTypes(false);
      }}
    >
      <Text style={[
        styles.ticketTypeText,
        formData.ticketTypeId === type.id.toString() && styles.ticketTypeTextSelected
      ]}>
        {type.name}
      </Text>
      {formData.ticketTypeId === type.id.toString() && (
        <Ionicons name="checkmark" size={20} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ServiceHeader 
        title={t('tickets.createTicket')} 
        onBack={() => navigation.goBack()} 
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Ticket Type Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('tickets.ticketType')} *</Text>
          <TouchableOpacity
            style={[
              styles.dropdown,
              validationErrors.ticketTypeId && styles.inputError
            ]}
            onPress={() => setShowTicketTypes(!showTicketTypes)}
          >
            <Text style={[
              styles.dropdownText,
              !formData.ticketTypeId && styles.placeholderText
            ]}>
              {formData.ticketTypeId 
                ? ticketTypes.find(t => t.id === parseInt(formData.ticketTypeId))?.name
                : t('tickets.selectTicketType')
              }
            </Text>
            <Ionicons 
              name={showTicketTypes ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={Colors.textSecondary} 
            />
          </TouchableOpacity>
          {validationErrors.ticketTypeId && (
            <Text style={styles.errorText}>{validationErrors.ticketTypeId}</Text>
          )}

          {showTicketTypes && (
            <View style={styles.ticketTypesList}>
              {loadingTypes ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                ticketTypes.map(renderTicketTypeItem)
              )}
            </View>
          )}
        </View>

        {/* Conditional Fields */}
        {selectedTicketType && (
          <>
            {(selectedTicketType.name.toLowerCase().includes("mistaken") || 
              selectedTicketType.name.toLowerCase().includes("recharge")) && (
              <>
                <View style={styles.section}>
                  <Text style={styles.label}>{t('tickets.mobileNumber')} *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      validationErrors.mobileNumber && styles.inputError
                    ]}
                    value={formData.mobileNumber}
                    onChangeText={(text) => handleChange('mobileNumber', text)}
                    placeholder={t('tickets.enterMobileNumber')}
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                  />
                  {validationErrors.mobileNumber && (
                    <Text style={styles.errorText}>{validationErrors.mobileNumber}</Text>
                  )}
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>{t('tickets.transactionNumber')} *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      validationErrors.txnNumber && styles.inputError
                    ]}
                    value={formData.txnNumber}
                    onChangeText={(text) => handleChange('txnNumber', text)}
                    placeholder={t('tickets.enterTransactionNumber')}
                    placeholderTextColor="#999"
                  />
                  {validationErrors.txnNumber && (
                    <Text style={styles.errorText}>{validationErrors.txnNumber}</Text>
                  )}
                </View>
              </>
            )}
          </>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('tickets.description')} *</Text>
          <TextInput
            style={[
              styles.textArea,
              validationErrors.description && styles.inputError
            ]}
            value={formData.description}
            onChangeText={(text) => handleChange('description', text)}
            placeholder={t('tickets.enterDescription')}
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {validationErrors.description && (
            <Text style={styles.errorText}>{validationErrors.description}</Text>
          )}
        </View>

        {/* Attachment */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('tickets.attachment')}</Text>
          <TouchableOpacity style={styles.attachmentButton} onPress={pickImage}>
            <Ionicons name="camera-outline" size={24} color={Colors.primary} />
            <Text style={styles.attachmentButtonText}>
              {t('tickets.chooseAttachment')}
            </Text>
          </TouchableOpacity>

          {attachment && (
            <View style={styles.attachmentPreview}>
              <Image 
                source={{ uri: attachment.uri }} 
                style={styles.attachmentImage} 
              />
              <TouchableOpacity 
                style={styles.removeAttachmentButton}
                onPress={removeImage}
              >
                <Ionicons name="close-circle" size={24} color={Colors.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <PrimaryButton
          label={mutation.isLoading ? t('tickets.creating') : t('tickets.createTicket')}
          onPress={handleSubmit}
          style={styles.submitButton}
          loading={mutation.isLoading}
          disabled={mutation.isLoading}
        />
      </ScrollView>

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessClose}
        title={t('tickets.success')}
        message={successMessage}
        buttonText={t('tickets.continue')}
      />

      {/* Error Modal */}
      <ErrorModal
        visible={showErrorModal}
        onClose={handleErrorClose}
        title={t('tickets.error')}
        message={errorMessage}
        buttonText={t('tickets.tryAgain')}
        showRetryButton={true}
        onRetry={handleSubmit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: scale.wp(5),
  },
  section: {
    marginBottom: scale.hp(2.6),
  },
  label: {
    fontSize: scale.hp(1.8),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scale.hp(1.05),
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: scale.hp(1.3),
    paddingHorizontal: scale.wp(4.2),
    paddingVertical: scale.hp(1.55),
    backgroundColor: Colors.white,
  },
  dropdownText: {
    fontSize: scale.hp(2.1),
    color: Colors.textPrimary,
  },
  placeholderText: {
    color: '#9E9E9E',
  },
  ticketTypesList: {
    marginTop: scale.hp(1.05),
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: scale.hp(1.3),
    backgroundColor: Colors.white,
    maxHeight: scale.hp(20),
  },
  ticketTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale.wp(4.2),
    paddingVertical: scale.hp(1.55),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  ticketTypeItemSelected: {
    backgroundColor: '#F0F9FF',
  },
  ticketTypeText: {
    fontSize: scale.hp(2.1),
    color: Colors.textPrimary,
  },
  ticketTypeTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: scale.hp(1.3),
    paddingHorizontal: scale.wp(4.2),
    paddingVertical: scale.hp(1.55),
    fontSize: scale.hp(2.1),
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: scale.hp(1.3),
    paddingHorizontal: scale.wp(4.2),
    paddingVertical: scale.hp(2.1),
    fontSize: scale.hp(2.1),
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    minHeight: scale.hp(12),
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: scale.hp(1.55),
    marginTop: scale.hp(0.5),
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: scale.hp(1.3),
    paddingHorizontal: scale.wp(4.2),
    paddingVertical: scale.hp(1.55),
    backgroundColor: '#F0F9FF',
    borderStyle: 'dashed',
  },
  attachmentButtonText: {
    color: Colors.primary,
    fontSize: scale.hp(2.1),
    fontWeight: '500',
    marginLeft: scale.wp(2.1),
  },
  attachmentPreview: {
    marginTop: scale.hp(1.55),
    alignItems: 'center',
  },
  attachmentImage: {
    width: scale.wp(40),
    height: scale.wp(40),
    borderRadius: scale.hp(1.3),
  },
  removeAttachmentButton: {
    position: 'absolute',
    top: -scale.hp(1),
    right: -scale.hp(1),
    backgroundColor: Colors.white,
    borderRadius: scale.hp(1),
  },
  submitButton: {
    marginTop: scale.hp(2.1),
  },
});