// src/screens/SignUpMerchantScreen.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Colors } from "../theme/colors";
import AuthHeader from "../components/AuthHeader";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import { COUNTRIES } from "../constants/countries";
import { codeToFlag } from "../utils/flag";
import { 
  getCountries, 
  getDistricts, 
  getProvinces, 
  merchantSignup 
} from "../services/merchantApi";
import { useAuth } from "../auth/AuthProvider";
import { useTranslation } from "react-i18next";
import { useModal } from "../hooks/useModal";
import ValidationModal from "../components/ValidationModal";
import SuccessModal from "../components/modals/SuccessModal";
import ErrorModal from "../components/modals/ErrorModal";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LANGS = ["english", "dari", "pashto"];
const GAP = 1;
const { height: screenHeight } = Dimensions.get('window');

export default function SignUpMerchantScreen({ navigation }) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { modal, showModal, hideModal } = useModal();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [alternativeContact, setAlternativeContact] = useState("");
  const {t} = useTranslation();
  const [countries, setCountries] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [country, setCountry] = useState(null);
  const [province, setProvince] = useState(null);
  const [district, setDistrict] = useState(null);
  const [address, setAddress] = useState("");
  const [messageLanguage, setMessageLanguage] = useState("");


  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [photoUri, setPhotoUri] = useState(null);
  const [idFile, setIdFile] = useState(null);


  const [picker, setPicker] = useState({ open: false, type: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [modalSlideAnim] = useState(new Animated.Value(screenHeight));
  const insets = useSafeAreaInsets();


  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imagePickerSlideAnim] = useState(new Animated.Value(screenHeight));

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setMobileNumber(user.phoneNumber || "");
      if (user.fullName) {
        const names = user.fullName.split(' ');
        setFirstName(names[0] || "");
        setLastName(names.slice(1).join(' ') || "");
      }
    }
  }, [user]);

  useEffect(() => {
    const getAllCountries = async () => {
      try {
        const res = await getCountries();
        setCountries(res?.data || []);
      } catch (error) {
        console.error("Error fetching countries:", error);
        showModal("Error", "Failed to load countries");
      }
    };
    getAllCountries();
  }, []);

  useEffect(() => {
    if (country?.id) {
      const getAllProvinces = async () => {
        try {
          const res = await getProvinces(country?.id);
          setProvinces(res?.data || []);
          setProvince(null);
          setDistrict(null); 
        } catch (error) {
          console.error("Error fetching provinces:", error);
        }
      };
      getAllProvinces();
    }
  }, [country?.id]);

  useEffect(() => {
    if (province?.id) {
      const getAllDistricts = async () => {
        try {
          const res = await getDistricts(province?.id);
          setDistricts(res?.data || []);
          setDistrict(null); 
        } catch (error) {
          console.error("Error fetching districts:", error);
        }
      };
      getAllDistricts();
    }
  }, [province?.id]);

  // Bottom sheet animations
  useEffect(() => {
    if (picker.open) {
      Animated.timing(modalSlideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.back(1)),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(modalSlideAnim, {
        toValue: screenHeight,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [picker.open]);

  // Image picker modal animations
  useEffect(() => {
    if (showImagePicker) {
      Animated.timing(imagePickerSlideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.back(1)),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(imagePickerSlideAnim, {
        toValue: screenHeight,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [showImagePicker]);

  const filteredData = useMemo(() => {
    if (!searchQuery) {
      switch (picker.type) {
        case 'country': return countries;
        case 'province': return provinces;
        case 'district': return districts;
        case 'lang': return LANGS;
        default: return [];
      }
    }

    const query = searchQuery.toLowerCase();
    switch (picker.type) {
      case 'country':
        return countries.filter(item => 
          item.countryName?.toLowerCase().includes(query) ||
          item.countryCode?.toLowerCase().includes(query)
        );
      case 'province':
        return provinces.filter(item => 
          item.provinceName?.toLowerCase().includes(query)
        );
      case 'district':
        return districts.filter(item => 
          item.districtName?.toLowerCase().includes(query)
        );
      case 'lang':
        return LANGS.filter(item => 
          item.toLowerCase().includes(query)
        );
      default:
        return [];
    }
  }, [searchQuery, picker.type, countries, provinces, districts]);

  const next = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(2, s + 1));
    }
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const validateStep = (currentStep) => {
    switch (currentStep) {
      case 0:
        if (!firstName.trim() || !lastName.trim() || !email.trim() || !mobileNumber.trim()) {
          showModal("Validation Error", "Please fill all required fields");
          return false;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
          showModal("Validation Error", "Please enter a valid email address");
          return false;
        }
        return true;
      case 1:
        if (!country || !province || !district || !address.trim()) {
          showModal("Validation Error", "Please fill all required address fields");
          return false;
        }
        return true;
      case 2:
        if (!photoUri) {
          showModal("Validation Error", "Please take a profile photo");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

const submitApplication = async () => {
  if (!validateStep(2)) return;

  setSubmitting(true);
  try {
    const payload = {
      username: `${firstName} ${lastName}`,
      email: email,
      mobileNumber: mobileNumber,
      user_type: "agent",
      status: "active",
      profile_picture: null, 
      country: country?.id,
      province: province?.id,
      district: district?.id,
      address: address,
      alternativeContact: alternativeContact,
      messageLanguage: messageLanguage,
      accountType: "merchant",
      registrationType: "direct",
      parentAgentId: null,
    };

    const response = await merchantSignup(payload);
    
    // Fix: Check for success based on the actual API response structure
    if (response.status === "success" || response.success) {
      setShowSuccessModal(true);
    } else {
      // Handle API error response
      const errorMsg = response.message || response.error || "Failed to submit application";
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    }
  } catch (error) {
    console.error("Application error:", error);
    // Extract error message from different possible error formats
    let errorMsg = "Failed to submit application. Please try again.";
    
    if (error.response) {
      // Server responded with error status
      errorMsg = error.response.data?.error || error.response.data?.message || errorMsg;
    } else if (error.request) {
      // Request was made but no response received
      errorMsg = "Network error. Please check your connection and try again.";
    } else if (error.message) {
      // Error object has a message
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      // Error is a string
      errorMsg = error;
    } else if (error.error) {
      // Error has error property
      errorMsg = error.error;
    }
    
    setErrorMessage(errorMsg);
    setShowErrorModal(true);
  } finally {
    setSubmitting(false);
  }
};

  const takePhoto = async () => {
    setShowImagePicker(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        setErrorMessage("Camera permission is required.");
        setShowErrorModal(true);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      setErrorMessage("Failed to open camera. Please try again.");
      setShowErrorModal(true);
    }
  };

  const pickFromGallery = async () => {
    setShowImagePicker(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        setErrorMessage("Photo library permission is required.");
        setShowErrorModal(true);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setErrorMessage("Failed to open image gallery. Please try again.");
      setShowErrorModal(true);
    }
  };

  const removePhoto = () => {
    setShowImagePicker(false);
    setPhotoUri(null);
  };

  const pickIdFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (res.canceled) return;
    const file = res.assets ? res.assets[0] : res;
    setIdFile({
      uri: file.uri,
      name: file.name || "id_document",
      mimeType: file.mimeType,
    });
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);

  };

  const handleErrorClose = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  const PickerModal = () => (
    <Modal
      visible={picker.open}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={() => setPicker({ open: false })}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setPicker({ open: false })}
        />
        <Animated.View 
          style={[
            styles.modalCard,
            { 
              transform: [{ translateY: modalSlideAnim }],
              height: '70%',
              marginBottom: -insets.bottom
            }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {picker.type === 'country' && 'Select Country'}
              {picker.type === 'province' && 'Select Province'}
              {picker.type === 'district' && 'Select District'}
              {picker.type === 'lang' && 'Select Language'}
            </Text>
            <TouchableOpacity 
              onPress={() => setPicker({ open: false })}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              placeholder={`Search ${picker.type}...`}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              placeholderTextColor="#999"
            />
          </View>

          <FlatList
            data={filteredData}
            keyExtractor={(item, index) => 
              picker.type === 'country' ? item.countryCode : 
              picker.type === 'province' ? item.id :
              picker.type === 'district' ? item.id : 
              item + index
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalRow}
                onPress={() => {
                  switch (picker.type) {
                    case 'country': setCountry(item); break;
                    case 'province': setProvince(item); break;
                    case 'district': setDistrict(item); break;
                    case 'lang': setMessageLanguage(item); break;
                  }
                  setPicker({ open: false });
                  setSearchQuery('');
                }}
              >
                {picker.type === 'country' && (
                  <Text style={{ fontSize: 24, marginRight: 12 }}>
                    {codeToFlag(item.countryCode)}
                  </Text>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '500' }}>
                    {picker.type === 'country' ? item.countryName :
                     picker.type === 'province' ? item.provinceName :
                     picker.type === 'district' ? item.districtName : item}
                  </Text>
                  {picker.type === 'country' && (
                    <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>
                      +{item.dialCode}
                    </Text>
                  )}
                </View>
                {(picker.type === 'country' && item.countryCode === country?.countryCode) ||
                 (picker.type === 'province' && item.id === province?.id) ||
                 (picker.type === 'district' && item.id === district?.id) ||
                 (picker.type === 'lang' && item === messageLanguage) ? (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                ) : null}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color="#999" />
                <Text style={styles.emptyText}>No results found</Text>
              </View>
            }
          />
        </Animated.View>
      </View>
    </Modal>
  );

  const ImagePickerModal = () => (
    <Modal
      visible={showImagePicker}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={() => setShowImagePicker(false)}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowImagePicker(false)}
        />
        <Animated.View 
          style={[
            styles.imagePickerContainer,
            { transform: [{ translateY: imagePickerSlideAnim }] }
          ]}
        >
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Choose Profile Photo</Text>
            <TouchableOpacity 
              onPress={() => setShowImagePicker(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.pickerOptions}>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={takePhoto}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#007AFF' }]}>
                <Ionicons name="camera" size={24} color="#fff" />
              </View>
              <Text style={styles.optionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={pickFromGallery}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#34C759' }]}>
                <Ionicons name="images" size={24} color="#fff" />
              </View>
              <Text style={styles.optionText}>Choose from Gallery</Text>
            </TouchableOpacity>
            
            {photoUri && (
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={removePhoto}
              >
                <View style={[styles.optionIcon, { backgroundColor: '#FF3B30' }]}>
                  <Ionicons name="trash" size={24} color="#fff" />
                </View>
                <Text style={styles.optionText}>Remove Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <AuthHeader
        title="Register as Merchant"
        onBack={() => (step === 0 ? navigation.goBack() : back())}
      />
   <KeyboardAwareScrollView
  contentContainerStyle={{ flexGrow: 1 }}
  enableOnAndroid
  extraScrollHeight={20}
  keyboardShouldPersistTaps="handled"
>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ValidationModal
          visible={modal.visible}
          title={modal.title}
          message={modal.message}
          onClose={hideModal}
        />

        {step === 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('personalInformation')}</Text>

            <LabeledInput
              label={t("firstName")}
              value={firstName}
              onChangeText={setFirstName}
              placeholder={t("enterFirstName")}
              required
            />
            <LabeledInput
              label={t("lastName")}
              value={lastName}
              onChangeText={setLastName}
              placeholder={t("enterLastName")}
              required
            />
            <LabeledInput
              label={t("email")}
              value={email}
              onChangeText={setEmail}
              placeholder={t("enterYourEmailAddress")}
              keyboardType="email-address"
              required
            />
            <LabeledInput
              label={t("mobileNumber")}
              value={mobileNumber}
              onChangeText={setMobileNumber}
              placeholder={t("enterMobileNumber")}
              keyboardType="phone-pad"
              required
            />
            <LabeledInput
              label={t("alternativeContact")}
              value={alternativeContact}
              onChangeText={setAlternativeContact}
              placeholder={t("enterAlternativeContact")}
              keyboardType="phone-pad"
            />

            <PrimaryButton
              label={t("continue")}
              onPress={next}
              style={styles.fullButton}
            />
          </>
        )}

        {step === 1 && (
          <>
            <Text style={styles.sectionTitle}>{t('addressInformation')}</Text>

            <DropField
              label={t("country")}
              value={country?.countryName || "Select Country"}
              onPress={() => setPicker({ open: true, type: "country" })}
              leftIcon={
                country ? <Text style={{ fontSize: 18 }}>{codeToFlag(country.countryCode)}</Text> : null
              }
              required
            />
            <DropField
              label={t("province")}
              value={province?.provinceName || "Select Province"}
              onPress={() => setPicker({ open: true, type: "province" })}
              required
            />
            <DropField
              label={t("district")}
              value={district?.districtName || "Select District"}
              onPress={() => setPicker({ open: true, type: "district" })}
              required
            />
            <LabeledInput
              label={t("fulladdress")}
              value={address}
              onChangeText={setAddress}
              placeholder={t("enterFulladdress")}
              required
            />
            <DropField
              label={t("preferredCommunicationLanguage")}
              value={messageLanguage || "Select Language"}
              onPress={() => setPicker({ open: true, type: "lang" })}
            />

            <View style={styles.rowButtons}>
              <DarkButton
                label={t("back")}
                onPress={back}
                style={styles.halfButton}
              />
              <PrimaryButton
                label={t("continue")}
                onPress={next}
                style={styles.halfButton}
              />
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.sectionTitle}>{t('kycInformation')}</Text>
            <Text style={styles.subtitle}>{t('pleaseUploadRequiredDocsForVerification')}</Text>

            <View style={styles.uploadSection}>
              <Text style={styles.uploadLabel}>{t('profilePhoto')} *</Text>
              <TouchableOpacity 
                style={styles.photoBox}
                onPress={() => setShowImagePicker(true)}
              >
                {photoUri ? (
                  <Image
                    source={{ uri: photoUri }}
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="camera-outline" size={40} color="#9E9E9E" />
                    <Text style={styles.photoPlaceholderText}>Tap to add photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.photoHint}>
                {photoUri ? "Tap the photo to change" : "Tap to take or select a profile photo"}
              </Text>
            </View>

      
            <View style={styles.rowButtons}>
              <DarkButton
                label={t("back")}
                onPress={back}
                style={styles.halfButton}
              />
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={submitApplication}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send-outline" size={18} color="#fff" />
                    <Text style={styles.submitButtonText}>{t('submitApplication')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
</KeyboardAwareScrollView>
      <PickerModal />
      <ImagePickerModal />


      <SuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessClose}
        title="Application Submitted Successfully!"
        message="Your merchant application has been submitted. We'll review your application and contact you soon."
        buttonText="Continue"
        autoHideDuration={0}
      />


      <ErrorModal
        visible={showErrorModal}
        onClose={handleErrorClose}
        title="Application Failed"
        message={errorMessage}
        buttonText="Try Again"
        showRetryButton={true}
      />
    </SafeAreaView>
  );
}

function LabeledInput({ label, value, onChangeText, placeholder, keyboardType, required }) {
  return (
    <View style={{ marginBottom: 13 }}>
      <Text style={styles.label}>
        {required && <Text style={{ color: "#F44336" }}>* </Text>}
        {label}
      </Text>
      <InputField 
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );
}

function DropField({ label, value, onPress, leftIcon, required }) {
  return (
    <View style={{ marginBottom: 13 }}>
      <Text style={styles.label}>
        {required && <Text style={{ color: "#F44336" }}>* </Text>}
        {label}
      </Text>
      <TouchableOpacity
        style={styles.dropField}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          {leftIcon}
          <Text style={{ color: value.includes("Select") ? "#9E9E9E" : Colors.textPrimary, fontSize: 14 }}>
            {value}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={18} color="#7A7A7A" />
      </TouchableOpacity>
    </View>
  );
}

function DarkButton({ label, onPress, style, disabled }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      disabled={disabled}
      style={[styles.darkBtn, disabled && { opacity: 0.5 }, style]}
    >
      <Text style={styles.darkBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 150,
    gap: GAP,
    backgroundColor: Colors.white,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },


  imagePickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  pickerOptions: {
    gap: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },

  sectionTitle: {
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 6,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  label: { 
    fontSize: 13, 
    color: Colors.textPrimary, 
    marginBottom: 4,
    fontWeight: "500",
  },

  dropField: {
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
  },


  uploadSection: {
    marginBottom: 20,
    alignItems: 'center'
  },
  uploadLabel: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 8,
    fontWeight: "500",
  },
  photoBox: {
    height: 140,
    width: 140,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    overflow: "hidden",
    marginBottom: 8,
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E0E0E0",
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: "#9E9E9E",
    marginTop: 8,
  },
  photoHint: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  uploadButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  uploadBox: {
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D7D7D7",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9F9F9",
    padding: 16,
  },
  uploadBoxText: {
    color: "#9E9E9E",
    marginTop: 8,
    textAlign: "center",
  },
  uploadHint: {
    color: "#BDBDBD",
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },


  fullButton: { marginTop: 12 },
  rowButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  halfButton: { width: "48%" },
  darkBtn: {
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2B2B2B",
    alignItems: "center",
    justifyContent: "center",
  },
  darkBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  submitButton: {
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    width: "48%",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
});