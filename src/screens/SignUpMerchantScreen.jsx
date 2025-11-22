import React, { useState, useRef, useEffect, useMemo } from "react";
import { SafeAreaView, View, Text, StyleSheet, Alert, TouchableOpacity, FlatList, ActivityIndicator, TextInput, Modal, Image, ScrollView, Dimensions, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Colors } from "../theme/colors";
import { scale } from "../utils/normalizeSize";
import AuthHeader from "../components/AuthHeader";
import RoundedInput from "../components/RoundedInput";
import PrimaryButton from "../components/PrimaryButton";
import OutlineButton from "../components/OutlineButton";
import InputField from "../components/InputField";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { 
  getCountries, 
  getDistricts, 
  getProvinces, 
  generateOtpForMerchantSignup,
  completeMerchantSignup
} from "../services/merchantApi";
import { useTranslation } from "react-i18next";
import { useModal } from "../hooks/useModal";
import ValidationModal from "../components/ValidationModal";
import SuccessModal from "../components/modals/SuccessModal";
import ErrorModal from "../components/modals/ErrorModal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WhiteSpinner from "../components/Spinner";
import Loader from "../components/Loader";

const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'protonmail.com'];

const LANGS = [
  { code: "en", name: "English", flag: "🇺🇸", value: "english" },
  { code: "dr", name: "Dari", flag: "🇦🇫", value: "dari" },
  { code: "ps", name: "Pashto", flag: "🇦🇫", value: "pashto" }
];

const GAP = 1;
const { height: screenHeight } = Dimensions.get('window');

export default function SignUpMerchantScreen({ route, navigation }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { modal, showModal, hideModal } = useModal();
  const insets = useSafeAreaInsets();


  const [email, setEmail] = useState("");
  const [showLoader, setShowLoader] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [showEmailError, setShowEmailError] = useState(false);
  const [emailSuggestions, setEmailSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [canUsePassword, setCanUsePassword] = useState(false);
  const [canUseOtp, setCanUseOtp] = useState(false);
  const [nextReady, setNextReady] = useState(false);
  const [hint, setHint] = useState(null);
  
  const inputRef = useRef(null);


  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [alternativeContact, setAlternativeContact] = useState("");
  

  const [countries, setCountries] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [country, setCountry] = useState(null);
  const [province, setProvince] = useState(null);
  const [district, setDistrict] = useState(null);
  const [address, setAddress] = useState("");
  const [messageLanguage, setMessageLanguage] = useState("");
  

  const [photoUri, setPhotoUri] = useState(null);
  

  const [otpVerified, setOtpVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [picker, setPicker] = useState({ open: false, type: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [modalSlideAnim] = useState(new Animated.Value(screenHeight));

  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imagePickerSlideAnim] = useState(new Animated.Value(screenHeight));


  const isValidEmail = (email) => {
    const emailValue = email.trim().toLowerCase();
    
    if (!emailValue) {
      return { isValid: false, message: t('enterEmailAddress') || "Please enter your email address" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      return { isValid: false, message: t('invalidEmailFormat') || "Please enter a valid email address" };
    }
    
    return { isValid: true, message: "" };
  };

  const generateEmailSuggestions = (input) => {
    if (!input || !input.includes('@')) {
      setEmailSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const [localPart, domainPart] = input.split('@');
    
    if (!domainPart) {
      setEmailSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const suggestions = commonDomains
      .filter(domain => domain.startsWith(domainPart.toLowerCase()))
      .map(domain => `${localPart}@${domain}`)
      .slice(0, 3);

    setEmailSuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0);
  };

  const validateAndSetEmail = (text) => {
    setEmail(text);
    generateEmailSuggestions(text);

    if (emailError) {
      setEmailError("");
      setShowEmailError(false);
    }

    if (nextReady) {
      setNextReady(false);
      setCanUsePassword(false);
      setCanUseOtp(false);
      setHint(null);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    setEmail(suggestion);
    setShowSuggestions(false);
    setEmailSuggestions([]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const validateEmailOnSubmit = () => {
    setShowSuggestions(false);
    setEmailSuggestions([]);
    
    const validation = isValidEmail(email.trim());
    if (!validation.isValid) {
      setEmailError(validation.message);
      setShowEmailError(true);
      return false;
    }
    setShowEmailError(false);
    setEmailError("");
    return true;
  };

  const navigateToOtp = async () => {
    if (!validateEmailOnSubmit()) return;
    
    try {
      setLoading(true);
      setShowLoader(true); 
      
      const response = await generateOtpForMerchantSignup(email.trim());
      
      if (response.success) {
        setShowLoader(false); 
        navigation.navigate("MerchantOtpVerification", {
          email: email.trim(),
          mode: "signup_merchant",
        });
      } else {
        setShowLoader(false); 
        Alert.alert(t('otp'), response.message || t('failedToSendOtp'));
      }
    } catch (e) {
      setShowLoader(false); 
      Alert.alert(t('otp'), e?.message || t('failedToSendOtp'));
    } finally {
      setLoading(false);
    }
  };

  const start = async () => {
    setShowSuggestions(false);
    setEmailSuggestions([]);
    
    if (!validateEmailOnSubmit()) {
      return;
    }

    const identifier = email.trim();

    try {
      setLoading(true);
      setShowLoader(true);
      setEmailError("");
      setShowEmailError(false);
      

      await navigateToOtp();
      
    } catch (e) {
      setShowLoader(false);
      

      console.log('Auth error, attempting OTP signup as fallback:', e);
      await navigateToOtp();
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate("Login", { prefillEmail: email.trim() });
  };

  const editEmail = () => {
    setNextReady(false);
    setCanUsePassword(false);
    setCanUseOtp(false);
    setHint(null);
    setEmailError("");
    setShowEmailError(false);
    setShowSuggestions(false);
    setEmailSuggestions([]);
  };


useEffect(() => {
  if (route.params?.otpVerified) {
    setOtpVerified(true);
    setVerificationToken(route.params.verificationToken);
    

    if (route.params?.email) {
      setEmail(route.params.email);
    }
    
    setStep(1);

    navigation.setParams({
      otpVerified: undefined,
      verificationToken: undefined,
      email: undefined
    });
  }
}, [route.params]);


  useEffect(() => {
    const getAllCountries = async () => {
      try {
        const res = await getCountries();
        setCountries(res?.data || []);
      } catch (error) {
        console.error("Error fetching countries:", error);
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

  // Load districts when province changes
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

  // Modal animations
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
          item.name.toLowerCase().includes(query) ||
          item.code.toLowerCase().includes(query) ||
          item.value.toLowerCase().includes(query)
        );
      default:
        return [];
    }
  }, [searchQuery, picker.type, countries, provinces, districts]);

  const nextStep = async () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(3, s + 1));
    }
  };

  const backStep = () => {
    if (step === 1) {
      // If going back from personal info to email step, reset OTP verification
      setOtpVerified(false);
      setVerificationToken("");
    }
    setStep((s) => Math.max(0, s - 1));
  };

  const validateStep = (currentStep) => {
    switch (currentStep) {
      case 1: // Personal Information
        if (!firstName.trim() || !lastName.trim() || !mobileNumber.trim()) {
          showModal("Validation Error", "Please fill all required fields");
          return false;
        }
        return true;
      case 2: // Address Information
        if (!country || !province || !district || !address.trim()) {
          showModal("Validation Error", "Please fill all required address fields");
          return false;
        }
        return true;
     
      default:
        return true;
    }
  };

const submitApplication = async () => {
  if (!validateStep(3) || !otpVerified || !verificationToken) {
    Alert.alert("Error", "Please complete all steps including email verification.");
    return;
  }

  // Double check that email is not empty
  if (!email.trim()) {
    Alert.alert("Error", "Email is required.");
    return;
  }

  setSubmitting(true);
  try {
    const formData = new FormData();

    // Add profile photo if exists
    if (photoUri) {
      const filename = photoUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri: photoUri,
        name: filename || 'profile.jpg',
        type: type,
      });
    }

    // Create payload object for reference
    const payload = {
      verificationToken,
      username: `${firstName} ${lastName}`.toLowerCase().replace(/\s+/g, '_'),
      email: email.trim(),
      mobileNumber: mobileNumber,
      country: country?.id,
      province: province?.id,
      district: district?.id,
      address: address,
      alternativeContact: alternativeContact || '',
      messageLanguage: messageLanguage?.value || messageLanguage || 'english',
      accountType: "merchant",
      registrationType: "direct",
      parentAgentId: null,
    };

    console.log("📧 Complete Payload:", payload);

    // Append all fields explicitly
    formData.append('verificationToken', payload.verificationToken);
    formData.append('username', payload.username);
    formData.append('email', payload.email);
    formData.append('mobileNumber', payload.mobileNumber);
    formData.append('country', payload.country.toString());
    formData.append('province', payload.province.toString());
    formData.append('district', payload.district.toString());
    formData.append('address', payload.address);
    
    if (payload.alternativeContact) {
      formData.append('alternativeContact', payload.alternativeContact);
    }
    
    formData.append('messageLanguage', payload.messageLanguage);
    formData.append('accountType', payload.accountType);
    formData.append('registrationType', payload.registrationType);
    
    if (payload.parentAgentId) {
      formData.append('parentAgentId', payload.parentAgentId.toString());
    }

    // Debug: Log all FormData entries
    console.log("📦 FormData entries before submission:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    const response = await completeMerchantSignup(formData);
    
    if (response.success) {
      setShowSuccessModal(true);
    } else {
      const errorMsg = response.message || "Failed to submit application";
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    }
  } catch (error) {
    console.error("Application error:", error);
    
    let errorMsg = "Failed to submit application. Please try again.";
    
    if (error.response?.data) {
      errorMsg = error.response.data.message || JSON.stringify(error.response.data);
    } else if (error.message) {
      errorMsg = error.message;
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

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigation.navigate("Login");
  };

  const handleErrorClose = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };
useEffect(() => {
  console.log("📧 Current email state:", email);
}, [email]);


useEffect(() => {
  if (step === 1) {
    console.log("✅ Moving to step 1 with email:", email, "OTP verified:", otpVerified);
  }
}, [step]);
  const renderSuggestionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionSelect(item)}
    >
      <Ionicons name="mail-outline" size={16} color={Colors.primary} />
      <Text style={styles.suggestionText}>{item}</Text>
    </TouchableOpacity>
  );

  const validEmail = useMemo(() => {
    const validation = isValidEmail(email);
    return validation.isValid;
  }, [email]);

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
              item.code || item + index
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
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '500' }}>
                    {picker.type === 'country' ? item.countryName :
                     picker.type === 'province' ? item.provinceName :
                     picker.type === 'district' ? item.districtName : 
                     item.name}
                  </Text>
                </View>
                {(picker.type === 'country' && item.countryCode === country?.countryCode) ||
                 (picker.type === 'province' && item.id === province?.id) ||
                 (picker.type === 'district' && item.id === district?.id) ||
                 (picker.type === 'lang' && item.code === messageLanguage?.code) ? (
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

  if (step === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AuthHeader 
          title={t('registerAsMerchant') || "Register as Merchant"} 
          onBack={() => navigation.goBack()} 
        />
        
        <View style={styles.container}>
          <View style={{ marginVertical: 20 }}>
            <Text style={styles.label}>{t('emailAddress') || "Email Address"} </Text>
            <View>
              <RoundedInput
                ref={inputRef}
                value={email}
                onChangeText={validateAndSetEmail}
                placeholder={t('emailPlaceholder') || "Enter your email"}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                rightIcon={<Ionicons name="mail-outline" size={24} color="#344054" />}
                returnKeyType={nextReady ? "done" : "go"}
                onSubmitEditing={nextReady ? undefined : start}
                onBlur={() => {
                  setTimeout(() => {
                    setShowSuggestions(false);
                  }, 200);
                }}
                onFocus={() => {
                  if (emailSuggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
              />
              
              {showSuggestions && emailSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <FlatList
                    data={emailSuggestions}
                    keyExtractor={(item) => item}
                    renderItem={renderSuggestionItem}
                    scrollEnabled={false}
                  />
                </View>
              )}
            </View>

            {showEmailError && emailError ? (
              <Text style={styles.errorText} accessibilityRole="alert">
                {emailError}
              </Text>
            ) : null}
            
            {hint && !showEmailError && (
              <Text style={styles.helperText} accessibilityRole="text">
                {hint}{" "}
                {canUsePassword && (
                  <Text onPress={navigateToLogin} style={styles.helperLink}>
                    {t('loginHere') || "Login here"}
                  </Text>
                )}
                {!canUsePassword && !canUseOtp && (
                  <Text onPress={editEmail} style={styles.helperLink}>
                    {t('changeEmail') || "Change email"}
                  </Text>
                )}
              </Text>
            )}

            {!validEmail && email.length > 0 && !showEmailError && !hint && (
              <Text style={styles.helperWarn}>
                {t('enterValidEmailExample') || "Enter a valid email like name@example.com"}
              </Text>
            )}
          </View>

          {!nextReady ? (
            <PrimaryButton
              label={loading ? <WhiteSpinner /> : (t('continue') || "Continue")}
              onPress={start}
              style={{ marginTop: 6, marginBottom: 14 }}
              disabled={loading || !validEmail}
            />
          ) : (
            <>
              {canUseOtp && (
                <PrimaryButton
                  label={t('signUpWithOtp') || "Sign Up with OTP"}
                  onPress={navigateToOtp}
                  style={{ marginTop: 24, marginBottom: canUsePassword ? 10 : 20 }}
                  disabled={loading}
                />
              )}
              {canUsePassword && (
                <OutlineButton
                  label={t('loginToExistingAccount') || "Login to Existing Account"}
                  onPress={navigateToLogin}
                  disabled={loading}
                />
              )}
            </>
          )}
        </View>
        
        {showLoader && <Loader />}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <AuthHeader
        title="Register as Merchant"
        onBack={() => (step === 1 ? backStep() : navigation.goBack())}
      />
      
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        <ScrollView
          contentContainerStyle={styles.formContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ValidationModal
            visible={modal.visible}
            title={modal.title}
            message={modal.message}
            onClose={hideModal}
          />

          {step >= 1 && (
            <View style={styles.verificationBadge}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              <Text style={styles.verificationText}>Email Verified: {email}</Text>
            </View>
          )}

          {step === 1 && (
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
                onPress={nextStep}
                style={styles.fullButton}
              />
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.sectionTitle}>{t('addressInformation')}</Text>

              <DropField
                label={t("country")}
                value={country?.countryName || "Select Country"}
                onPress={() => setPicker({ open: true, type: "country" })}
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
                value={messageLanguage?.name || "Select Language"}
                onPress={() => setPicker({ open: true, type: "lang" })}
                leftIcon={
                  messageLanguage ? <Text style={{ fontSize: 18 }}>{messageLanguage.flag}</Text> : null
                }
              />

              <View style={styles.rowButtons}>
                <DarkButton
                  label={t("back")}
                  onPress={backStep}
                  style={styles.halfButton}
                />
                <PrimaryButton
                  label={t("continue")}
                  onPress={nextStep}
                  style={styles.halfButton}
                />
              </View>
            </>
          )}

          {step === 3 && (
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
                  onPress={backStep}
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
        subtitle="Your merchant account has been created successfully. and credentials have been sent to your email."
        buttonText="Continue to Login"
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
  safeArea: { 
    flex: 1, 
    backgroundColor: Colors.white 
  },
  container: {
    flex: 1,
    paddingHorizontal: scale.wp(10),
    paddingTop: scale.hp(2.25),
    backgroundColor: Colors.pageBackColor,
  },
  formContainer: {
    paddingHorizontal: scale.wp(6),
    paddingTop: scale.hp(1.75),
    paddingBottom: scale.hp(8.75),
    gap: GAP,
    backgroundColor: Colors.white,
  },
  label: {
    fontFamily: 'dmsansRegular',
    marginBottom: scale.hp(1),
    fontSize: scale.hp(2),
    lineHeight: scale.hp(3),
    color: Colors.textTitle,
  },
  helperText: {
    marginTop: scale.hp(0.75),
    fontSize: scale.hp(1.5),
    color: Colors.textSecondary,
    fontFamily: 'dmsansRegular',
  },
  helperWarn: {
    marginTop: scale.hp(0.75),
    fontSize: scale.hp(1.5),
    color: '#D14343',
    fontFamily: 'dmsansRegular',
  },
  errorText: {
    marginTop: scale.hp(0.75),
    fontSize: scale.hp(1.5),
    color: '#E20E02',
    fontFamily: 'dmsansRegular',
  },
  helperLink: {
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: scale.hp(6),
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 1000,
    maxHeight: scale.hp(15),
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale.wp(4),
    paddingVertical: scale.hp(1.2),
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  suggestionText: {
    marginLeft: scale.wp(2),
    fontSize: scale.hp(1.6),
    color: Colors.textTitle,
    fontFamily: 'dmsansRegular',
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
    borderTopLeftRadius: scale.hp(3),
    borderTopRightRadius: scale.hp(3),
    padding: scale.hp(2),
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: scale.hp(1),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale.hp(2),
    paddingBottom: scale.hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: scale.hp(2.25),
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
    borderRadius: scale.hp(1.25),
    paddingHorizontal: scale.wp(3),
    marginBottom: scale.hp(2),
    height: scale.hp(5.5),
  },
  searchIcon: {
    marginRight: scale.wp(2),
  },
  searchInput: {
    flex: 1,
    fontSize: scale.hp(2),
    color: Colors.textPrimary,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale.hp(1.5),
    paddingHorizontal: scale.wp(2),
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale.hp(5),
  },
  emptyText: {
    fontSize: scale.hp(2),
    color: '#999',
    marginTop: scale.hp(1.5),
  },
  imagePickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: scale.hp(3),
    borderTopRightRadius: scale.hp(3),
    padding: scale.hp(2),
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: scale.hp(1),
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale.hp(2.5),
  },
  pickerTitle: {
    fontSize: scale.hp(2.25),
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  pickerOptions: {
    gap: scale.hp(2),
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale.hp(1.5),
  },
  optionIcon: {
    width: scale.wp(11),
    height: scale.wp(11),
    borderRadius: scale.wp(5.5),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale.wp(4),
  },
  optionText: {
    fontSize: scale.hp(2),
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: scale.hp(2),
    color: Colors.textPrimary,
    marginBottom: scale.hp(0.75),
    fontWeight: "600",
  },
  subtitle: {
    fontSize: scale.hp(1.75),
    color: Colors.textSecondary,
    marginBottom: scale.hp(2),
  },
  dropField: {
    height: scale.hp(6.25),
    borderRadius: scale.hp(1),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: scale.wp(3),
    backgroundColor: "#f9f9f9",
    flexDirection: "row",
    alignItems: "center",
  },
  uploadSection: {
    marginBottom: scale.hp(2.5),
    alignItems: 'center',
  },
  uploadLabel: {
    fontSize: scale.hp(1.75),
    color: Colors.textPrimary,
    marginBottom: scale.hp(1),
    fontWeight: "500",
  },
  photoBox: {
    height: scale.hp(17.5),
    width: scale.hp(17.5),
    borderRadius: scale.hp(1),
    backgroundColor: "#F5F5F5",
    overflow: "hidden",
    marginBottom: scale.hp(1),
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E0E0E0",
  },
  photoPlaceholderText: {
    fontSize: scale.hp(1.75),
    color: "#9E9E9E",
    marginTop: scale.hp(1),
  },
  photoHint: {
    fontSize: scale.hp(1.5),
    color: "#666",
    textAlign: "center",
  },
  fullButton: { marginTop: scale.hp(1.5) },
  rowButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: scale.hp(1.5),
  },
  halfButton: { width: "48%" },
  darkBtn: {
    height: scale.hp(6.25),
    borderRadius: scale.hp(3.125),
    backgroundColor: "#2B2B2B",
    alignItems: "center",
    justifyContent: "center",
  },
  darkBtnText: {
    color: "#fff",
    fontSize: scale.hp(1.875),
    fontWeight: "600",
  },
  submitButton: {
    height: scale.hp(6.25),
    borderRadius: scale.hp(3.125),
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
    fontSize: scale.hp(1.875),
    fontWeight: "600",
    marginLeft: scale.wp(2),
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: scale.hp(1),
    borderRadius: scale.hp(1),
    marginBottom: scale.hp(2),
    alignSelf: 'flex-start',
  },
  verificationText: {
    color: Colors.primary,
    fontSize: scale.hp(1.5),
    fontWeight: '600',
    marginLeft: scale.wp(2),
  },
});