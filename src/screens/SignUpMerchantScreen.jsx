// src/screens/SignUpMerchantScreen.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Image,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Colors } from "../theme/colors";
import AuthHeader from "../components/AuthHeader";
import PrimaryButton from "../components/PrimaryButton";
import { COUNTRIES } from "../constants/countries";
import { codeToFlag } from "../utils/flag";
import { getCountries, getDistricts, getProvinces, merchantSignup } from "../services/merchantApi";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: screenHeight } = Dimensions.get('window');
const LANGS = ["english", "dari", "pashto"];

export default function SignUpMerchantScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const insets = useSafeAreaInsets();

  // Animation values for bottom sheets
  const [modalSlideAnim] = useState(new Animated.Value(screenHeight));
  const [searchQuery, setSearchQuery] = useState('');

  // Step 1
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [alternativeContact, setAlternativeContact] = useState("");

  // Step 2
  const defaultAf = useMemo(() => COUNTRIES.find((c) => c.code === "AF") || COUNTRIES[0], []);
  const [countries, setCountries] = useState([])
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [country, setCountry] = useState(defaultAf);
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [messageLanguage, setMessageLanguage] = useState("")
  const [picker, setPicker] = useState({ open: false, type: null });

  // Step 3 (KYC)
  const [photoUri, setPhotoUri] = useState(null);
  const [idFile, setIdFile] = useState(null);

  // Input focus states
  const [focusedInput, setFocusedInput] = useState(null);

  const next = () => setStep((s) => Math.min(2, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  useEffect(() => {
    const getAllCountries = async() => {
      const res = await getCountries()
      setCountries(res?.data)
    }
    getAllCountries()
  }, [])

  useEffect(() => {
    if(country?.id){
      const getAllProvinces = async() => {
        const res = await getProvinces(country?.id)
        setProvinces(res?.data)
      }
      getAllProvinces()
    }
  }, [country?.id])

  useEffect(() => {
    if(province?.id){
      const getAllDistricts = async() => {
        const res = await getDistricts(province?.id)
        setDistricts(res?.data)
      }
      getAllDistricts()
    }
  }, [province?.id])

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
          item.countryName.toLowerCase().includes(query) ||
          item.countryCode.toLowerCase().includes(query)
        );
      case 'province':
        return provinces.filter(item => 
          item.provinceName.toLowerCase().includes(query)
        );
      case 'district':
        return districts.filter(item => 
          item.districtName.toLowerCase().includes(query)
        );
      case 'lang':
        return LANGS.filter(item => 
          item.toLowerCase().includes(query)
        );
      default:
        return [];
    }
  }, [searchQuery, picker.type, countries, provinces, districts]);

  const submit = async () => {
    try {
      const payload = {
        username: `${firstName} ${lastName}`,
        email,
        mobileNumber: mobileNumber,
        user_type: "agent",
        status: "active",
        profile_picture: null,
        country: country?.id,
        province: province?.id,
        district: district?.id,
        address,
        alternativeContact,
        messageLanguage,
        accountType: "merchant",
        registrationType: "direct",
        parentAgentId: null,
      };
      await merchantSignup(payload);
      navigation.replace("SignupResult", {
        type: "merchant",
        title: "Application Submitted",
        message: "Your application has been submitted. We'll email you updates.",
        cta: "Go Back",
      });
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Camera permission is required.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (!res.canceled) {
      const uri = res.assets?.[0]?.uri;
      if (uri) setPhotoUri(uri);
    }
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
      name: file.name || "document",
      mimeType: file.mimeType,
    });
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <AuthHeader
        title="Register as Merchant"
        onBack={() => (step === 0 ? navigation.goBack() : back())}
      />

      {/* Premium Stepper */}
      <View style={styles.stepperContainer}>
        {[0, 1, 2].map((index) => (
          <View key={index} style={styles.stepContainer}>
            <View style={[
              styles.stepCircle,
              step >= index && styles.stepCircleActive
            ]}>
              {step > index ? (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              ) : (
                <Text style={[
                  styles.stepNumber,
                  step >= index && styles.stepNumberActive
                ]}>
                  {index + 1}
                </Text>
              )}
            </View>
            <Text style={[
              styles.stepLabel,
              step >= index && styles.stepLabelActive
            ]}>
              {index === 0 ? 'Personal' : index === 1 ? 'Additional' : 'KYC'}
            </Text>
            {index < 2 && (
              <View style={[
                styles.stepLine,
                step > index && styles.stepLineActive
              ]} />
            )}
          </View>
        ))}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 0 && (
            <>
              <Text style={styles.sectionTitle}>Personal Information</Text>

              <InputField
                label="First Name *"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter First Name"
                isFocused={focusedInput === 'firstName'}
                onFocus={() => setFocusedInput('firstName')}
                onBlur={() => setFocusedInput(null)}
              />

              <InputField
                label="Last Name *"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter Last Name"
                isFocused={focusedInput === 'lastName'}
                onFocus={() => setFocusedInput('lastName')}
                onBlur={() => setFocusedInput(null)}
              />

              <InputField
                label="Email *"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter Your Email Address"
                keyboardType="email-address"
                isFocused={focusedInput === 'email'}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
              />

              <InputField
                label="Mobile Number *"
                value={mobileNumber}
                onChangeText={setMobileNumber}
                placeholder="Enter Mobile Number"
                keyboardType="phone-pad"
                isFocused={focusedInput === 'mobileNumber'}
                onFocus={() => setFocusedInput('mobileNumber')}
                onBlur={() => setFocusedInput(null)}
              />
            
              <InputField
                label="Alternative Contact"
                value={alternativeContact}
                onChangeText={setAlternativeContact}
                placeholder="Enter Alternative Contact"
                keyboardType="phone-pad"
                isFocused={focusedInput === 'alternativeContact'}
                onFocus={() => setFocusedInput('alternativeContact')}
                onBlur={() => setFocusedInput(null)}
              />

              <PrimaryButton
                label="Continue"
                onPress={next}
                style={styles.continueButton}
              />
            </>
          )}

          {step === 1 && (
            <>
              <Text style={styles.sectionTitle}>Additional Information</Text>

              <DropField
                label="Country *"
                value={country?.countryName || "Select Country"}
                onPress={() => setPicker({ open: true, type: "country" })}
                leftIcon={
                  <Text style={{ fontSize: 20 }}>
                    {codeToFlag(country?.countryCode)}
                  </Text>
                }
              />

              <DropField
                label="Province *"
                value={province?.provinceName || "Select Province"}
                onPress={() => setPicker({ open: true, type: "province" })}
              />

              <DropField
                label="District *"
                value={district?.districtName || "Select District"}
                onPress={() => setPicker({ open: true, type: "district" })}
              />

              <InputField
                label="Full Address *"
                value={address}
                onChangeText={setAddress}
                placeholder="Enter Full Address"
                isFocused={focusedInput === 'address'}
                onFocus={() => setFocusedInput('address')}
                onBlur={() => setFocusedInput(null)}
              />

              <DropField
                label="Message Language *"
                value={messageLanguage ? messageLanguage.charAt(0).toUpperCase() + messageLanguage.slice(1) : "Select Language"}
                onPress={() => setPicker({ open: true, type: "lang" })}
              />

              <View style={styles.buttonRow}>
                <SecondaryButton
                  label="Back"
                  onPress={back}
                  style={styles.halfButton}
                />
                <PrimaryButton
                  label="Continue"
                  onPress={next}
                  style={styles.halfButton}
                />
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.sectionTitle}>KYC Information</Text>

              <View style={styles.kycSection}>
                <Text style={styles.kycLabel}>Profile Photo</Text>
                <View style={styles.photoContainer}>
                  {photoUri ? (
                    <Image
                      source={{ uri: photoUri }}
                      style={styles.photoImage}
                    />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
                      <Text style={styles.photoPlaceholderText}>No photo taken</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={takePhoto}
                >
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                  <Text style={styles.photoButtonText}>Take Photo</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.kycSection}>
                <Text style={styles.kycLabel}>ID Document</Text>
                <TouchableOpacity
                  style={styles.uploadContainer}
                  onPress={pickIdFile}
                >
                  <Ionicons name="cloud-upload-outline" size={32} color={Colors.primary} />
                  <Text style={styles.uploadText}>
                    {idFile ? idFile.name : "Upload ID Document"}
                  </Text>
                  <Text style={styles.uploadSubtext}>
                    Supports: JPG, PNG, PDF (Max 5MB)
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.buttonRow}>
                <SecondaryButton
                  label="Back"
                  onPress={back}
                  style={styles.halfButton}
                />
                <PrimaryButton
                  label="Submit Application"
                  onPress={submit}
                  style={styles.halfButton}
                />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <PickerModal />
    </SafeAreaView>
  );
}

// Component Definitions
function InputField({ label, value, onChangeText, placeholder, keyboardType, isFocused, onFocus, onBlur }) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[
        styles.inputWrapper,
        isFocused && styles.inputWrapperFocused
      ]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          style={styles.textInput}
          keyboardType={keyboardType}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </View>
    </View>
  );
}

function DropField({ label, value, onPress, leftIcon }) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.dropdownWrapper}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.dropdownContent}>
          {leftIcon && <View style={styles.dropdownIcon}>{leftIcon}</View>}
          <Text style={[
            styles.dropdownText,
            !value.includes('Select') && { color: Colors.textPrimary }
          ]}>
            {value}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );
}

function SecondaryButton({ label, onPress, style }) {
  return (
    <TouchableOpacity
      style={[styles.secondaryButton, style]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = {
  container: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  
  // Stepper Styles
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: Colors.white,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  stepCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: Colors.primary,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: Colors.primary,
  },

  // Section Styles
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 24,
    textAlign: 'center',
  },

  // Input Styles
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  inputWrapper: {
    height: 56,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  inputWrapperFocused: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  textInput: {
    fontSize: 16,
    color: Colors.textPrimary,
    padding: 0,
  },

  // Dropdown Styles
  dropdownWrapper: {
    height: 56,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownIcon: {
    marginRight: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: '#9CA3AF',
  },

  // Button Styles
  continueButton: {
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  halfButton: {
    width: '48%',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  // KYC Styles
  kycSection: {
    marginBottom: 32,
  },
  kycLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  photoContainer: {
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 12,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  photoButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  uploadContainer: {
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },

  // Modal Styles
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
};