import React, { useState, useEffect } from "react";
import {
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
import { Colors } from "../theme/colors";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import { saveFiles } from "../utils/imageHelpers";

const PromoCodeForm = ({ onSubmit, loading, existingData }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    WhatsApp_number: "",
    facebook_link: "",
    tiktok_link: "",
    instagram_link: "",
    document: null,
  });
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (existingData) {
      setFormData({
        WhatsApp_number: existingData.WhatsApp_number || "",
        facebook_link: existingData.facebook_link || "",
        tiktok_link: existingData.tiktok_link || "",
        instagram_link: existingData.instagram_link || "",
        document: existingData.document || null,
      });
    }
  }, [existingData]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.WhatsApp_number.trim()) {
      newErrors.WhatsApp_number = t('promoCode.errors.whatsappRequired');
    }

    // if (!formData.facebook_link.trim()) {
    //   newErrors.facebook_link = t('promoCode.errors.facebookRequired');
    // } else if (!isValidUrl(formData.facebook_link)) {
    //   newErrors.facebook_link = t('promoCode.errors.validUrl');
    // }

    // if (!formData.tiktok_link.trim()) {
    //   newErrors.tiktok_link = t('promoCode.errors.tiktokRequired');
    // } else if (!isValidUrl(formData.tiktok_link)) {
    //   newErrors.tiktok_link = t('promoCode.errors.validUrl');
    // }

    // if (!formData.instagram_link.trim()) {
    //   newErrors.instagram_link = t('promoCode.errors.instagramRequired');
    // } else if (!isValidUrl(formData.instagram_link)) {
    //   newErrors.instagram_link = t('promoCode.errors.validUrl');
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleDocumentUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t('error'), t('errors.permissionDenied'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploading(true);
        const savedFiles = await saveFiles(
          [result.assets[0]],
          "public/uploads/promo_code_documents"
        );
        
        setFormData(prev => ({
          ...prev,
          document: savedFiles[0].fileName
        }));
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      Alert.alert(t('error'), t('errors.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const canEdit = !existingData || existingData.status === 'pending';

  const getStatusConfig = () => {
    if (!existingData) return null;
    
    switch (existingData.status) {
      case 'accepted':
        return {
          icon: "checkmark-circle",
          color: "#4CAF50",
          backgroundColor: "#E8F5E8",
          message: t('promoCode.applicationApproved')
        };
      case 'rejected':
        return {
          icon: "close-circle",
          color: "#F44336",
          backgroundColor: "#FFEBEE",
          message: t('promoCode.applicationRejected')
        };
      case 'pending':
        return {
          icon: "time",
          color: "#FF9800",
          backgroundColor: "#FFF3E0",
          message: t('promoCode.applicationPending')
        };
      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Status Display */}
      {statusConfig && (
        <View style={[styles.statusMessage, { backgroundColor: statusConfig.backgroundColor }]}>
          <Ionicons name={statusConfig.icon} size={24} color={statusConfig.color} />
          <Text style={styles.statusMessageText}>{statusConfig.message}</Text>
        </View>
      )}

      {/* Application Instructions */}
      <View style={styles.instructionsContainer}>
        <Ionicons name="information-circle" size={20} color={Colors.primary} />
        <Text style={styles.instructionsText}>
          {existingData 
            ? t('promoCode.editApplicationDescription')
            : t('promoCode.newApplicationDescription')
          }
        </Text>
      </View>

      {/* Form Fields */}
      <View style={styles.formSection}>
        {/* WhatsApp Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {t('promoCode.whatsappNumber')} *
          </Text>
          <View style={[
            styles.inputContainer,
            errors.WhatsApp_number && styles.inputError
          ]}>
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('promoCode.enterWhatsapp')}
              value={formData.WhatsApp_number}
              onChangeText={(text) => handleChange("WhatsApp_number", text)}
              keyboardType="phone-pad"
              editable={canEdit && !loading}
              placeholderTextColor="#999"
            />
          </View>
          {errors.WhatsApp_number && (
            <Text style={styles.errorText}>{errors.WhatsApp_number}</Text>
          )}
        </View>

        {/* Facebook Link */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {t('promoCode.facebookLink')} *
          </Text>
          <View style={[
            styles.inputContainer,
            errors.facebook_link && styles.inputError
          ]}>
            <Ionicons name="logo-facebook" size={20} color="#1877F2" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('promoCode.enterFacebook')}
              value={formData.facebook_link}
              onChangeText={(text) => handleChange("facebook_link", text)}
              autoCapitalize="none"
              editable={canEdit && !loading}
              placeholderTextColor="#999"
            />
          </View>
          {errors.facebook_link && (
            <Text style={styles.errorText}>{errors.facebook_link}</Text>
          )}
        </View>

        {/* TikTok Link */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {t('promoCode.tiktokLink')} *
          </Text>
          <View style={[
            styles.inputContainer,
            errors.tiktok_link && styles.inputError
          ]}>
            <Ionicons name="logo-tiktok" size={20} color="#000000" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('promoCode.enterTiktok')}
              value={formData.tiktok_link}
              onChangeText={(text) => handleChange("tiktok_link", text)}
              autoCapitalize="none"
              editable={canEdit && !loading}
              placeholderTextColor="#999"
            />
          </View>
          {errors.tiktok_link && (
            <Text style={styles.errorText}>{errors.tiktok_link}</Text>
          )}
        </View>

        {/* Instagram Link */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {t('promoCode.instagramLink')} *
          </Text>
          <View style={[
            styles.inputContainer,
            errors.instagram_link && styles.inputError
          ]}>
            <Ionicons name="logo-instagram" size={20} color="#E4405F" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('promoCode.enterInstagram')}
              value={formData.instagram_link}
              onChangeText={(text) => handleChange("instagram_link", text)}
              autoCapitalize="none"
              editable={canEdit && !loading}
              placeholderTextColor="#999"
            />
          </View>
          {errors.instagram_link && (
            <Text style={styles.errorText}>{errors.instagram_link}</Text>
          )}
        </View>

        {/* Document Upload */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {t('promoCode.document')}
            <Text style={styles.optionalText}> ({t('common.optional')})</Text>
          </Text>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              !canEdit && styles.uploadButtonDisabled
            ]}
            onPress={handleDocumentUpload}
            disabled={!canEdit || uploading || loading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <Ionicons 
                  name={formData.document ? "checkmark-circle" : "document-attach"} 
                  size={20} 
                  color={formData.document ? "#4CAF50" : Colors.primary} 
                  style={styles.uploadIcon} 
                />
                <Text style={[
                  styles.uploadText,
                  formData.document && styles.uploadTextSuccess
                ]}>
                  {formData.document 
                    ? t('promoCode.documentUploaded') 
                    : t('promoCode.uploadDocument')
                  }
                </Text>
              </>
            )}
          </TouchableOpacity>
          {formData.document && (
            <Text style={styles.documentName}>
              {t('promoCode.document')}: {formData.document}
            </Text>
          )}
          <Text style={styles.helpText}>
            {t('promoCode.documentHelp')}
          </Text>
        </View>

        {/* Submit Button */}
        {canEdit && (
          <TouchableOpacity
            style={[
              styles.submitButton,
              (loading || uploading) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={loading || uploading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons 
                  name={existingData ? "refresh" : "send"} 
                  size={20} 
                  color="#fff" 
                />
                <Text style={styles.submitButtonText}>
                  {existingData 
                    ? t('promoCode.updateApplication') 
                    : t('promoCode.submitApplication')
                  }
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Read-only Notice */}
        {!canEdit && existingData && (
          <View style={styles.readOnlyNotice}>
            <Ionicons name="lock-closed" size={16} color="#666" />
            <Text style={styles.readOnlyText}>
              {t('promoCode.applicationLocked')}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 100,
    backgroundColor: Colors.white,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  statusMessage: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    margin: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusMessageText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  instructionsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#E3F2FD",
    padding: 12,
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  instructionsText: {
    marginLeft: 8,
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  formSection: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  optionalText: {
    color: Colors.textSecondary,
    fontWeight: "normal",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.white,
  },
  inputError: {
    borderColor: "#F44336",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  errorText: {
    color: "#F44336",
    fontSize: 12,
    marginTop: 4,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 16,
    backgroundColor: "#F8F9FA",
  },
  uploadButtonDisabled: {
    borderColor: "#E0E0E0",
    backgroundColor: "#F5F5F5",
  },
  uploadIcon: {
    marginRight: 10,
  },
  uploadText: {
    color: Colors.primary,
    fontWeight: "500",
  },
  uploadTextSuccess: {
    color: "#4CAF50",
  },
  documentName: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    fontStyle: "italic",
  },
  helpText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    fontStyle: "italic",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.white,
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  readOnlyNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    marginTop: 20,
  },
  readOnlyText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
});

export default PromoCodeForm;