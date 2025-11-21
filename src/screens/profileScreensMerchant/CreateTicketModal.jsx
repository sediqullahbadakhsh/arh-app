import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { scale } from "../../utils/normalizeSize";
import { createTicketC } from "../../services/ticketService";
import { useAuth } from "../../auth/AuthProvider";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from 'expo-document-picker';

export default function CreateTicketModal({ visible, onClose, onSuccess, ticketTypes }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    ticketTypeId: "",
    mobileNumber: "",
    txnNumber: "",
    description: "",
  });
  const [attachment, setAttachment] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedTicketType, setSelectedTicketType] = useState(null);

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
    setErrors({});
    setSelectedTicketType(null);
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        setAttachment(result);
      }
    } catch (error) {
      console.error('Document picking error:', error);
      Alert.alert(t('error'), t('support.filePickError'));
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(t('permissionRequired'), t('support.cameraPermission'));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAttachment({
          name: `photo_${Date.now()}.jpg`,
          uri: asset.uri,
          type: 'image/jpeg',
          size: asset.fileSize || 0,
        });
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert(t('error'), t('support.cameraError'));
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.ticketTypeId) {
      newErrors.ticketTypeId = t('support.errors.ticketTypeRequired');
    }
    
    if (!formData.description) {
      newErrors.description = t('support.errors.descriptionRequired');
    }

    if (selectedTicketType) {
      const typeName = selectedTicketType.name.toLowerCase();
      
      if (typeName.includes("mistaken") || typeName.includes("recharge")) {
        if (!formData.mobileNumber) {
          newErrors.mobileNumber = t('support.errors.mobileNumberRequired');
        }
        
        if (!formData.txnNumber) {
          newErrors.txnNumber = t('support.errors.transactionNumberRequired');
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      const submitData = new FormData();
      submitData.append("agentId", user?.id);
      submitData.append("ticketTypeId", formData.ticketTypeId);
      submitData.append("description", formData.description);
      
      if (formData.mobileNumber) submitData.append("mobileNumber", formData.mobileNumber);
      if (formData.txnNumber) submitData.append("txnNumber", formData.txnNumber);
      if (attachment) {
        submitData.append("attachment", {
          uri: attachment.uri,
          name: attachment.name,
          type: attachment.mimeType || 'image/jpeg',
        });
      }

      await createTicketC(submitData);
      
      Alert.alert(
        t('support.success'),
        t('support.ticketCreatedSuccess'),
        [{ text: t('ok'), onPress: handleSuccess }]
      );
      
    } catch (error) {
      console.error("Ticket creation error:", error);
      Alert.alert(
        t('error'),
        error.response?.data?.message || t('support.ticketCreationFailed')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    resetForm();
    onSuccess();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('support.createTicket')}</Text>
            <TouchableOpacity onPress={handleClose} disabled={loading}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Ticket Type Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('support.ticketType')} *</Text>
              <View style={styles.dropdownContainer}>
                <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                  {ticketTypes.map(type => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.dropdownItem,
                        formData.ticketTypeId === type.id.toString() && styles.dropdownItemSelected
                      ]}
                      onPress={() => handleChange('ticketTypeId', type.id.toString())}
                    >
                      <Text style={styles.dropdownItemText}>{type.name}</Text>
                      {formData.ticketTypeId === type.id.toString() && (
                        <Ionicons name="checkmark" size={20} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              {errors.ticketTypeId && (
                <Text style={styles.errorText}>{errors.ticketTypeId}</Text>
              )}
            </View>

            {/* Conditional Fields */}
            {selectedTicketType && (
              <>
                {(selectedTicketType.name.toLowerCase().includes("mistaken") || 
                  selectedTicketType.name.toLowerCase().includes("recharge")) && (
                  <>
                    {/* Mobile Number */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>{t('support.mobileNumber')} *</Text>
                      <TextInput
                        style={[styles.input, errors.mobileNumber && styles.inputError]}
                        value={formData.mobileNumber}
                        onChangeText={(value) => handleChange('mobileNumber', value)}
                        placeholder={t('support.enterMobileNumber')}
                        keyboardType="phone-pad"
                        placeholderTextColor="#999"
                      />
                      {errors.mobileNumber && (
                        <Text style={styles.errorText}>{errors.mobileNumber}</Text>
                      )}
                    </View>

                    {/* Transaction Number */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>{t('support.transactionNumber')} *</Text>
                      <TextInput
                        style={[styles.input, errors.txnNumber && styles.inputError]}
                        value={formData.txnNumber}
                        onChangeText={(value) => handleChange('txnNumber', value)}
                        placeholder={t('support.enterTransactionNumber')}
                        placeholderTextColor="#999"
                      />
                      {errors.txnNumber && (
                        <Text style={styles.errorText}>{errors.txnNumber}</Text>
                      )}
                    </View>
                  </>
                )}
              </>
            )}

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('support.description')} *</Text>
              <TextInput
                style={[styles.textArea, errors.description && styles.inputError]}
                value={formData.description}
                onChangeText={(value) => handleChange('description', value)}
                placeholder={t('support.enterDescription')}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />
              {errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}
            </View>

            {/* Attachment */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('support.attachment')}</Text>
              
              {attachment ? (
                <View style={styles.attachmentContainer}>
                  <View style={styles.attachmentInfo}>
                    <Ionicons name="document-attach-outline" size={20} color={Colors.primary} />
                    <View style={styles.attachmentDetails}>
                      <Text style={styles.attachmentName} numberOfLines={1}>
                        {attachment.name}
                      </Text>
                      <Text style={styles.attachmentSize}>
                        {attachment.size ? `Size: ${(attachment.size / 1024 / 1024).toFixed(2)} MB` : ''}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={removeAttachment} disabled={loading}>
                    <Ionicons name="close-circle" size={20} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.attachmentOptions}>
                  <TouchableOpacity 
                    style={styles.attachmentOption}
                    onPress={pickDocument}
                    disabled={loading}
                  >
                    <Ionicons name="document-attach-outline" size={24} color={Colors.primary} />
                    <Text style={styles.attachmentOptionText}>{t('support.uploadFile')}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.attachmentOption}
                    onPress={takePhoto}
                    disabled={loading}
                  >
                    <Ionicons name="camera-outline" size={24} color={Colors.primary} />
                    <Text style={styles.attachmentOptionText}>{t('support.takePhoto')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>{t('support.createTicket')}</Text>
              )}
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
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: scale.hp(2.6),
    borderTopRightRadius: scale.hp(2.6),
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scale.hp(2.6),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: scale.hp(2.35),
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalContent: {
    padding: scale.hp(2.6),
    maxHeight: scale.hp(40),
  },
  inputGroup: {
    marginBottom: scale.hp(2.6),
  },
  label: {
    fontSize: scale.hp(1.8),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scale.hp(1.05),
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: scale.hp(1.3),
    maxHeight: scale.hp(15),
  },
  dropdownList: {
    maxHeight: scale.hp(15),
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scale.hp(1.55),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemSelected: {
    backgroundColor: '#F0F9FF',
  },
  dropdownItemText: {
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: scale.hp(1.3),
    paddingHorizontal: scale.wp(4.2),
    paddingVertical: scale.hp(1.55),
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
    height: scale.hp(6.2),
  },
  inputError: {
    borderColor: '#DC2626',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: scale.hp(1.3),
    paddingHorizontal: scale.wp(4.2),
    paddingVertical: scale.hp(1.55),
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
    minHeight: scale.hp(12),
    textAlignVertical: 'top',
  },
  attachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: scale.hp(1.3),
    padding: scale.hp(1.55),
    backgroundColor: '#F8FAFC',
  },
  attachmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  attachmentDetails: {
    marginLeft: scale.wp(2.1),
    flex: 1,
  },
  attachmentName: {
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  attachmentSize: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
    marginTop: scale.hp(0.25),
  },
  attachmentOptions: {
    flexDirection: 'row',
    gap: scale.wp(3.1),
  },
  attachmentOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: scale.hp(1.3),
    padding: scale.hp(2.1),
    backgroundColor: '#F8FAFC',
  },
  attachmentOptionText: {
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
    marginTop: scale.hp(0.5),
    textAlign: 'center',
  },
  errorText: {
    fontSize: scale.hp(1.55),
    color: '#DC2626',
    marginTop: scale.hp(0.5),
  },
  modalFooter: {
    flexDirection: 'row',
    padding: scale.hp(2.6),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: scale.wp(3.1),
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale.hp(1.3),
    padding: scale.hp(1.55),
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E4E7EC',
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    fontSize: scale.hp(1.8),
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  submitButtonText: {
    fontSize: scale.hp(1.8),
    fontWeight: '600',
    color: Colors.white,
  },
});