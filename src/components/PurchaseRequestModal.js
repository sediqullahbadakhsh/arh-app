import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import { useTranslation } from "react-i18next";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Picker } from "@react-native-picker/picker";

const PurchaseRequestModal = ({ 
  visible, 
  onClose, 
  onSubmit,
  isLoading 
}) => {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    payment_method: "",
    amount: "",
    note: "",
  });
  
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  const paymentMethods = [
    { value: "Cash", label: t("cash") },
    { value: "Bank", label: t("bank") },
    { value: "Online", label: t("online") },
  ];

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const pickFile = async () => {
    try {
      setIsUploading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsUploading(false);
        return;
      }

      const file = result.assets[0];
      
      // Check file size (10MB limit)
      const fileInfo = await FileSystem.getInfoAsync(file.uri);
      const fileSizeMB = fileInfo.size / (1024 * 1024);
      
      if (fileSizeMB > 10) {
        Alert.alert(
          t('common.error'),
          t('purchaseStock.fileSizeLimit', { size: 10 })
        );
        setIsUploading(false);
        return;
      }

      setFile({
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
        size: fileInfo.size,
      });
      setIsUploading(false);

    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert(t('common.error'), t('purchaseStock.filePickError'));
      setIsUploading(false);
    }
  };

  const takePhoto = async () => {
    try {
      setIsUploading(true);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          t('common.permissionRequired'),
          t('purchaseStock.cameraPermission')
        );
        setIsUploading(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (result.canceled) {
        setIsUploading(false);
        return;
      }

      const photo = result.assets[0];
      
      const fileInfo = await FileSystem.getInfoAsync(photo.uri);
      const fileSizeMB = fileInfo.size / (1024 * 1024);
      
      if (fileSizeMB > 10) {
        Alert.alert(
          t('common.error'),
          t('purchaseStock.fileSizeLimit', { size: 10 })
        );
        setIsUploading(false);
        return;
      }

      const fileName = `photo_${Date.now()}.jpg`;
      
      setFile({
        uri: photo.uri,
        name: fileName,
        type: 'image/jpeg',
        size: fileInfo.size,
      });
      setIsUploading(false);
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert(t('common.error'), t('purchaseStock.cameraError'));
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.payment_method) {
      newErrors.payment_method = t('purchaseStock.paymentMethodRequired');
    }
    
    if (!formData.amount || Number(formData.amount) <= 0) {
      newErrors.amount = t('purchaseStock.amountRequired');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData, file);
      // Reset form will be handled by parent on success
    } catch (error) {
      console.error('Submit error:', error);
      // Error handling is done in parent component
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {t("purchaseStock.createRequest")}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Payment Method */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                {t("paymentM")} *
              </Text>
              <View style={[
                styles.pickerContainer,
                errors.payment_method && styles.inputError
              ]}>
                <Picker
                  selectedValue={formData.payment_method}
                  onValueChange={(value) => handleChange('payment_method', value)}
                  style={styles.picker}
                >
                  <Picker.Item 
                    label={t("purchaseStock.selectPaymentMethod")} 
                    value="" 
                  />
                  {paymentMethods.map((method) => (
                    <Picker.Item
                      key={method.value}
                      label={method.label}
                      value={method.value}
                    />
                  ))}
                </Picker>
              </View>
              {errors.payment_method && (
                <Text style={styles.errorText}>{errors.payment_method}</Text>
              )}
            </View>

            {/* Amount */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                {t("amount")} *
              </Text>
              <View style={[
                styles.inputContainer,
                errors.amount && styles.inputError
              ]}>
                <Text style={styles.currencySymbol}>AFN</Text>
                <TextInput
                  style={styles.input}
                  value={formData.amount}
                  onChangeText={(value) => handleChange('amount', value)}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#999"
                />
              </View>
              {errors.amount && (
                <Text style={styles.errorText}>{errors.amount}</Text>
              )}
            </View>

            {/* Note */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                {t("noteO")}
              </Text>
              <TextInput
                style={[styles.textArea, styles.inputContainer]}
                value={formData.note}
                onChangeText={(value) => handleChange('note', value)}
                placeholder={t("purchaseStock.notePlaceholder")}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />
            </View>

            {/* Attachment */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                {t("attachment")}
              </Text>
              
              {file ? (
                <View style={styles.fileContainer}>
                  <View style={styles.fileInfo}>
                    <Ionicons 
                      name={file.type === 'application/pdf' ? 'document-outline' : 'image-outline'} 
                      size={24} 
                      color={Colors.primary} 
                    />
                    <View style={styles.fileDetails}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {file.name}
                      </Text>
                      <Text style={styles.fileSize}>
                        {formatFileSize(file.size)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={removeFile}
                    style={styles.removeFileButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadOptions}>
                  <TouchableOpacity
                    style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
                    onPress={pickFile}
                    disabled={isUploading}
                  >
                    <Ionicons name="document-attach-outline" size={24} color={Colors.primary} />
                    <Text style={styles.uploadButtonText}>
                      {t("purchaseStock.uploadFile")}
                    </Text>
                    <Text style={styles.uploadSubtext}>
                      JPG, PNG, PDF (Max 10MB)
                    </Text>
                    {isUploading && <ActivityIndicator size="small" color={Colors.primary} />}
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
                    onPress={takePhoto}
                    disabled={isUploading}
                  >
                    <Ionicons name="camera-outline" size={24} color={Colors.primary} />
                    <Text style={styles.uploadButtonText}>
                      {t("purchaseStock.takePhoto")}
                    </Text>
                    {isUploading && <ActivityIndicator size="small" color={Colors.primary} />}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isLoading || isUploading}
            >
              <Text style={styles.cancelButtonText}>
                {t("cancel")}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.submitButton,
                (isLoading || isUploading) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isLoading || isUploading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {t("submit")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    borderRadius: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    minHeight: 50,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    padding: 0,
    height: 50,
  },
  textArea: {
    minHeight: 100,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#DC2626',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E4E7EC',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  removeFileButton: {
    padding: 4,
    marginLeft: 8,
  },
  uploadOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderStyle: 'dashed',
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  uploadSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 14,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  submitButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});

export default PurchaseRequestModal;