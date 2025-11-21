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
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Colors } from "../../theme/colors";
import AuthHeader from "../../components/AuthHeader";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import InputField from "../../components/InputField";
import PrimaryButton from "../../components/PrimaryButton";
import { COUNTRIES } from "../../constants/countries";
import { codeToFlag } from "../../utils/flag";
import { 
  getCountries, 
  getDistricts, 
  getProvinces, 
  applyForMerchant,
  getMyMerchantApplication
} from "../../services/merchantApi";
import { useAuth } from "../../auth/AuthProvider";
import { useTranslation } from "react-i18next";
import { useModal } from "../../hooks/useModal";
import ValidationModal from "../../components/ValidationModal";
import SuccessModal from "../../components/modals/SuccessModal";
import ErrorModal from "../../components/modals/ErrorModal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scale } from "../../utils/normalizeSize";

const LANGS = ["english", "dari", "pashto"];
const GAP = 1;
const { height: screenHeight } = Dimensions.get('window');

const STATUS_CONFIG = {
  pending: {
    color: "#FFA500",
    bgColor: "#FFF3E0",
    icon: "time-outline",
    title: "applicationPending",
    message: "applicationUnderReview"
  },
  accepted: {
    color: "#4CAF50",
    bgColor: "#E8F5E8",
    icon: "checkmark-circle-outline",
    title: "applicationAccepted",
    message: "applicationApproved"
  },
  rejected: {
    color: "#F44336",
    bgColor: "#FFEBEE",
    icon: "close-circle-outline",
    title: "applicationRejected",
    message: "applicationRejectedMessage"
  },
  abandoned: {
    color: "#9E9E9E",
    bgColor: "#F5F5F5",
    icon: "alert-circle-outline",
    title: "applicationAbandoned",
    message: "applicationAbandonedMessage"
  }
};

export default function MerchantApplicationScreen({ navigation }) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { modal, showModal, hideModal } = useModal();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [alternativeContact, setAlternativeContact] = useState("");
  const { t } = useTranslation();
  const [countries, setCountries] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [country, setCountry] = useState(null);
  const [province, setProvince] = useState(null);
  const [district, setDistrict] = useState(null);
  const [address, setAddress] = useState("");
  const [messageLanguage, setMessageLanguage] = useState("");
  const [photoUri, setPhotoUri] = useState(null);

  const [picker, setPicker] = useState({ open: false, type: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [modalSlideAnim] = useState(new Animated.Value(screenHeight));
  const insets = useSafeAreaInsets();

  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imagePickerSlideAnim] = useState(new Animated.Value(screenHeight));

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [existingApplication, setExistingApplication] = useState(null);
  const [applicationLoading, setApplicationLoading] = useState(true);

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
    checkExistingApplication();
  }, []);

  const checkExistingApplication = async () => {
    try {
      setApplicationLoading(true);
      const response = await getMyMerchantApplication();
      if (response.success && response.data) {
        setExistingApplication(response.data);
        
        if (response.data.status !== "rejected") {
          showModal(
            t('existingApplication'),
            t('existingApplicationMessage', { status: response.data.status })
          );
        }
      }
    } catch (error) {
      console.error("Error checking existing application:", error);
    } finally {
      setApplicationLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkExistingApplication();
    setRefreshing(false);
  };

  useEffect(() => {
    const getAllCountries = async () => {
      try {
        const res = await getCountries();
        setCountries(res?.data || []);
      } catch (error) {
        console.error("Error fetching countries:", error);
        showModal(t('error'), t('failedToLoadCountries'));
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
          showModal(t('validationError'), t('fillAllRequiredFields'));
          return false;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
          showModal(t('validationError'), t('enterValidEmail'));
          return false;
        }
        return true;
      case 1:
        if (!country?.id || !province?.id || !district?.id || !address.trim()) {
          showModal(t('validationError'), t('fillAllAddressFields'));
          return false;
        }
        return true;
      case 2:
        if (!photoUri) {
          showModal(t('validationError'), t('takeProfilePhoto'));
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const submitApplication = async () => {
    if (!validateStep(2)) return;

    // Check if user has an existing application that's not rejected
    if (existingApplication && existingApplication.status !== "rejected") {
      showModal(
        t('existingApplication'), 
        t('cannotSubmitNewApplication', { status: existingApplication.status })
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        alternativeContact,
        country: country?.id,
        province: province?.id,
        district: district?.id,
        address,
        messageLanguage,
      };

      const response = await applyForMerchant(payload);
      
      if (response.success) {
        setExistingApplication(response.data);
        setShowSuccessModal(true);
      } else {
        setErrorMessage(response.message || t('failedToSubmitApplication'));
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Application error:", error);
      let errorMsg = t('failedToSubmitApplication');
      
      if (error.response) {
        errorMsg = error.response.data?.error || error.response.data?.message || errorMsg;
        if (error.response.data.existingApplication) {
          setExistingApplication(error.response.data.existingApplication);
        }
      } else if (error.request) {
        errorMsg = t('networkError');
      } else if (error.message) {
        errorMsg = error.message;
      } else if (typeof error === 'string') {
        errorMsg = error;
      } else if (error.error) {
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
        setErrorMessage(t('cameraPermissionRequired'));
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
      setErrorMessage(t('failedToOpenCamera'));
      setShowErrorModal(true);
    }
  };

  const pickFromGallery = async () => {
    setShowImagePicker(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        setErrorMessage(t('photoLibraryPermissionRequired'));
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
      setErrorMessage(t('failedToOpenGallery'));
      setShowErrorModal(true);
    }
  };

  const removePhoto = () => {
    setShowImagePicker(false);
    setPhotoUri(null);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigation.goBack();
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
              {picker.type === 'country' && t('selectCountry')}
              {picker.type === 'province' && t('selectProvince')}
              {picker.type === 'district' && t('selectDistrict')}
              {picker.type === 'lang' && t('selectLanguage')}
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
              placeholder={`${t('search')} ${picker.type}...`}
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
                <Text style={styles.emptyText}>{t('noResultsFound')}</Text>
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
            <Text style={styles.pickerTitle}>{t('chooseProfilePhoto')}</Text>
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
              <Text style={styles.optionText}>{t('takePhoto')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={pickFromGallery}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#34C759' }]}>
                <Ionicons name="images" size={24} color="#fff" />
              </View>
              <Text style={styles.optionText}>{t('chooseFromGallery')}</Text>
            </TouchableOpacity>
            
            {photoUri && (
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={removePhoto}
              >
                <View style={[styles.optionIcon, { backgroundColor: '#FF3B30' }]}>
                  <Ionicons name="trash" size={24} color="#fff" />
                </View>
                <Text style={styles.optionText}>{t('removePhoto')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  // Render application status if exists
  if (applicationLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
        <AuthHeader
          title={t('applyForMerchantAccount')}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{t('checkingApplicationStatus')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (existingApplication && existingApplication.status !== "rejected") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
        <AuthHeader
          title={t('applicationStatus')}
          onBack={() => navigation.goBack()}
        />
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <ApplicationStatusCard application={existingApplication} />
          
          {existingApplication.status === "pending" && (
            <View style={styles.pendingActions}>
              <Text style={styles.pendingInfo}>
                {t('applicationUnderReviewInfo')}
              </Text>
            </View>
          )}

          {existingApplication.status === "accepted" && (
            <View style={styles.acceptedActions}>
              <Text style={styles.acceptedInfo}>
                {t('applicationApprovedInfo')}
              </Text>
              <PrimaryButton
                label={t('goToMerchantDashboard')}
                onPress={() => navigation.replace("MerchantDashboard")}
                style={styles.fullButton}
              />
            </View>
          )}

          {existingApplication.status === "abandoned" && (
            <View style={styles.abandonedActions}>
              <Text style={styles.abandonedInfo}>
                {t('applicationAbandonedInfo')}
              </Text>
              <TouchableOpacity 
                style={styles.contactSupportBtn}
                onPress={() => navigation.navigate("Support")}
              >
                <Ionicons name="chatbubble-outline" size={18} color={Colors.primary} />
                <Text style={styles.contactSupportText}>{t('contactSupport')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <AuthHeader
        title={t('applyForMerchantAccount')}
        onBack={() => (step === 0 ? navigation.goBack() : back())}
      />

      {existingApplication?.status === "rejected" && (
        <View style={styles.rejectedBanner}>
          <Ionicons name="information-circle" size={20} color="#FFF" />
          <Text style={styles.rejectedBannerText}>
            {t('previousApplicationRejected')}
          </Text>
        </View>
      )}

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
                value={country?.countryName || t("selectCountry")}
                onPress={() => setPicker({ open: true, type: "country" })}
                leftIcon={
                  country ? <Text style={{ fontSize: 18 }}>{codeToFlag(country.countryCode)}</Text> : null
                }
                required
              />
              <DropField
                label={t("province")}
                value={province?.provinceName || t("selectProvince")}
                onPress={() => setPicker({ open: true, type: "province" })}
                required
              />
              <DropField
                label={t("district")}
                value={district?.districtName || t("selectDistrict")}
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
                value={messageLanguage || t("selectLanguage")}
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
                      <Text style={styles.photoPlaceholderText}>{t('tapToAddPhoto')}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={styles.photoHint}>
                  {photoUri ? t('tapPhotoToChange') : t('tapToTakeOrSelectPhoto')}
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
        title={t('applicationSubmittedSuccessfully')}
        message={t('applicationSubmittedMessage')}
        buttonText={t('continue')}
        autoHideDuration={0}
      />

      <ErrorModal
        visible={showErrorModal}
        onClose={handleErrorClose}
        title={t('applicationFailed')}
        message={errorMessage}
        buttonText={t('tryAgain')}
        showRetryButton={true}
      />
    </SafeAreaView>
  );
}

// Application Status Card Component
const ApplicationStatusCard = ({ application }) => {
  const { t } = useTranslation();
  const statusConfig = STATUS_CONFIG[application.status] || STATUS_CONFIG.pending;
  
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={[styles.statusCard, { backgroundColor: statusConfig.bgColor }]}>
      <View style={styles.statusHeader}>
        <View style={[styles.statusIcon, { backgroundColor: statusConfig.color }]}>
          <Ionicons name={statusConfig.icon} size={24} color="#FFF" />
        </View>
        <View style={styles.statusTextContainer}>
          <Text style={[styles.statusTitle, { color: statusConfig.color }]}>
            {t(statusConfig.title)}
          </Text>
          <Text style={styles.statusMessage}>
            {t(statusConfig.message)}
          </Text>
        </View>
      </View>
      
      <View style={styles.statusDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('applicationId')}:</Text>
          <Text style={styles.detailValue}>#{application.id}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('submitted')}:</Text>
          <Text style={styles.detailValue}>{formatDate(application.appliedAt)}</Text>
        </View>
        {application.reviewedAt && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('reviewed')}:</Text>
            <Text style={styles.detailValue}>{formatDate(application.reviewedAt)}</Text>
          </View>
        )}
        {application.rejectionReason && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('reason')}:</Text>
            <Text style={[styles.detailValue, styles.rejectionReason]}>
              {application.rejectionReason}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// Keep the existing helper components (LabeledInput, DropField, DarkButton) the same
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
    paddingHorizontal: scale.wp(6.2),
    paddingTop: scale.hp(1.8),
    paddingBottom: scale.hp(19.5),
    gap: GAP,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: scale.hp(1.55),
    fontSize: scale.hp(2.1),
    color: Colors.textSecondary,
  },
  rejectedBanner: {
    backgroundColor: "#FF6B35",
    flexDirection: "row",
    alignItems: "center",
    padding: scale.hp(1.55),
    marginHorizontal: scale.wp(4.2),
    borderRadius: scale.hp(1.05),
    marginTop: scale.hp(1.05),
  },
  rejectedBannerText: {
    color: "#FFF",
    marginLeft: scale.wp(2),
    flex: 1,
    fontSize: scale.hp(1.8),
  },
  statusCard: {
    borderRadius: scale.hp(1.55),
    padding: scale.hp(2.1),
    marginBottom: scale.hp(2.1),
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: scale.hp(1.55),
  },
  statusIcon: {
    width: scale.wp(10.4),
    height: scale.wp(10.4),
    borderRadius: scale.wp(5.2),
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale.wp(3.1),
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: scale.hp(2.35),
    fontWeight: "700",
    marginBottom: scale.hp(0.5),
  },
  statusMessage: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
    lineHeight: scale.hp(2.6),
  },
  statusDetails: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
    paddingTop: scale.hp(1.55),
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: scale.hp(1.05),
  },
  detailLabel: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: scale.wp(2),
  },
  rejectionReason: {
    color: "#F44336",
    fontStyle: "italic",
  },
  pendingActions: {
    alignItems: "center",
    padding: scale.hp(2.1),
  },
  pendingInfo: {
    textAlign: "center",
    color: Colors.textSecondary,
    marginBottom: scale.hp(2.1),
    lineHeight: scale.hp(2.6),
  },
  acceptedActions: {
    alignItems: "center",
    padding: scale.hp(2.1),
  },
  acceptedInfo: {
    textAlign: "center",
    color: Colors.textSecondary,
    marginBottom: scale.hp(2.1),
    lineHeight: scale.hp(2.6),
  },
  abandonedActions: {
    alignItems: "center",
    padding: scale.hp(2.1),
  },
  abandonedInfo: {
    textAlign: "center",
    color: Colors.textSecondary,
    marginBottom: scale.hp(2.1),
    lineHeight: scale.hp(2.6),
  },
  contactSupportBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale.hp(1.55),
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: scale.hp(1.05),
  },
  contactSupportText: {
    color: Colors.primary,
    fontWeight: "600",
    marginLeft: scale.wp(2),
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
    borderTopLeftRadius: scale.hp(3.2),
    borderTopRightRadius: scale.hp(3.2),
    padding: scale.hp(2.1),
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -scale.hp(0.25) },
    shadowOpacity: 0.25,
    shadowRadius: scale.hp(0.5),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale.hp(2.1),
    paddingBottom: scale.hp(1.55),
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: scale.hp(2.35),
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: scale.hp(0.5),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: scale.hp(1.3),
    paddingHorizontal: scale.wp(3.1),
    marginBottom: scale.hp(2.1),
    height: scale.hp(5.7),
  },
  searchIcon: {
    marginRight: scale.wp(2),
  },
  searchInput: {
    flex: 1,
    fontSize: scale.hp(2.1),
    color: Colors.textPrimary,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale.hp(1.55),
    paddingHorizontal: scale.wp(2.1),
  },
  separator: {
    height: scale.hp(0.13),
    backgroundColor: '#F0F0F0',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale.hp(5.2),
  },
  emptyText: {
    fontSize: scale.hp(2.1),
    color: '#999',
    marginTop: scale.hp(1.55),
  },
  imagePickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: scale.hp(3.2),
    borderTopRightRadius: scale.hp(3.2),
    padding: scale.hp(2.1),
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -scale.hp(0.25) },
    shadowOpacity: 0.25,
    shadowRadius: scale.hp(0.5),
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale.hp(2.6),
  },
  pickerTitle: {
    fontSize: scale.hp(2.35),
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  pickerOptions: {
    gap: scale.hp(2.1),
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale.hp(1.55),
  },
  optionIcon: {
    width: scale.wp(11.4),
    height: scale.wp(11.4),
    borderRadius: scale.wp(5.7),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale.wp(4.2),
  },
  optionText: {
    fontSize: scale.hp(2.1),
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: scale.hp(2.1),
    color: Colors.textPrimary,
    marginBottom: scale.hp(0.8),
    fontWeight: "600",
  },
  subtitle: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
    marginBottom: scale.hp(2.1),
  },
  label: {
    fontSize: scale.hp(1.7),
    color: Colors.textPrimary,
    marginBottom: scale.hp(0.5),
    fontWeight: "500",
  },
  dropField: {
    height: scale.hp(6),
    borderRadius: scale.hp(1.05),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: scale.wp(3.1),
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
  },
  uploadSection: {
    marginBottom: scale.hp(2.6),
    alignItems: 'center',
  },
  uploadLabel: {
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
    marginBottom: scale.hp(1.05),
    fontWeight: "500",
  },
  photoBox: {
    height: scale.hp(18.2),
    width: scale.wp(36.4),
    borderRadius: scale.hp(1.05),
    backgroundColor: "#F5F5F5",
    overflow: "hidden",
    marginBottom: scale.hp(1.05),
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E0E0E0",
  },
  photoPlaceholderText: {
    fontSize: scale.hp(1.8),
    color: "#9E9E9E",
    marginTop: scale.hp(1.05),
  },
  photoHint: {
    fontSize: scale.hp(1.55),
    color: "#666",
    textAlign: "center",
  },
  fullButton: {
    marginTop: scale.hp(1.55),
  },
  rowButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: scale.hp(1.55),
  },
  halfButton: {
    width: "48%",
  },
  darkBtn: {
    height: scale.hp(6.5),
    borderRadius: scale.hp(3.2),
    backgroundColor: "#2B2B2B",
    alignItems: "center",
    justifyContent: "center",
  },
  darkBtnText: {
    color: "#fff",
    fontSize: scale.hp(2),
    fontWeight: "600",
  },
  submitButton: {
    height: scale.hp(6.5),
    borderRadius: scale.hp(3.2),
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
    fontSize: scale.hp(2),
    fontWeight: "600",
    marginLeft: scale.wp(2),
  },
});