import React, { useState } from "react";
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
    WhatsApp_number: existingData?.WhatsApp_number || "",
    facebook_link: existingData?.facebook_link || "",
    tiktok_link: existingData?.tiktok_link || "",
    instagram_link: existingData?.instagram_link || "",
    document: null,
  });
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // if (!formData.WhatsApp_number.trim()) {
    //   newErrors.WhatsApp_number = t('promoCode.errors.whatsappRequired');
    // }

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

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>{t('promoCode.socialMediaLinks')}</Text>
        <Text style={styles.sectionSubtitle}>
          {t('promoCode.socialMediaDescription')}
        </Text>

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
              editable={canEdit}
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
              editable={canEdit}
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
              editable={canEdit}
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
              editable={canEdit}
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
          </Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleDocumentUpload}
            disabled={!canEdit || uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <Ionicons 
                  name="document-attach" 
                  size={20} 
                  color={Colors.primary} 
                  style={styles.uploadIcon} 
                />
                <Text style={styles.uploadText}>
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
        </View>

        {/* Status Message */}
        {existingData && (
          <View style={[
            styles.statusMessage,
            existingData.status === 'accepted' && styles.statusAccepted,
            existingData.status === 'rejected' && styles.statusRejected,
            existingData.status === 'pending' && styles.statusPending,
          ]}>
            <Ionicons 
              name={
                existingData.status === 'accepted' ? "checkmark-circle" :
                existingData.status === 'rejected' ? "close-circle" : "time"
              } 
              size={20} 
              color={
                existingData.status === 'accepted' ? "#4CAF50" :
                existingData.status === 'rejected' ? "#F44336" : "#FF9800"
              } 
            />
            <Text style={styles.statusMessageText}>
              {existingData.status === 'accepted' ? t('promoCode.applicationApproved') :
               existingData.status === 'rejected' ? t('promoCode.applicationRejected') :
               t('promoCode.applicationPending')}
            </Text>
          </View>
        )}

        {/* Submit Button */}
        {canEdit && (
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>
                  {existingData ? t('promoCode.updateApplication') : t('promoCode.submitApplication')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  formSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
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
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 16,
    backgroundColor: "#FFF5F5",
  },
  uploadIcon: {
    marginRight: 10,
  },
  uploadText: {
    color: Colors.primary,
    fontWeight: "500",
  },
  documentName: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    fontStyle: "italic",
  },
  statusMessage: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusAccepted: {
    backgroundColor: "#E8F5E8",
  },
  statusRejected: {
    backgroundColor: "#FFEBEE",
  },
  statusPending: {
    backgroundColor: "#FFF3E0",
  },
  statusMessageText: {
    marginLeft: 8,
    fontWeight: "500",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
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
});

export default PromoCodeForm;