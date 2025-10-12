import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Colors } from "../../theme/colors";
import AuthHeader from "../../components/AuthHeader";
import InputField from "../../components/InputField";
import PrimaryButton from "../../components/PrimaryButton";
import { COUNTRIES } from "../../constants/countries";
import { codeToFlag } from "../../utils/flag";
import { 
  getCountries, 
  getDistricts, 
  getProvinces, 
  merchantSignup 
} from "../../services/merchantApi";
import { useAuth } from "../../auth/AuthProvider";

const LANGS = ["english", "dari", "pashto"];
const GAP = 1;

export default function MerchantApplicationScreen({ navigation }) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);


  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [alternativeContact, setAlternativeContact] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [taxId, setTaxId] = useState("");


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
        Alert.alert("Error", "Failed to load countries");
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
          setProvince(null); // Reset province when country changes
          setDistrict(null); // Reset district when country changes
        } catch (error) {
          console.error("Error fetching provinces:", error);
        }
      };
      getAllProvinces();
    }
  }, [country?.id]);

  // Fetch districts when province is selected
  useEffect(() => {
    if (province?.id) {
      const getAllDistricts = async () => {
        try {
          const res = await getDistricts(province?.id);
          setDistricts(res?.data || []);
          setDistrict(null); // Reset district when province changes
        } catch (error) {
          console.error("Error fetching districts:", error);
        }
      };
      getAllDistricts();
    }
  }, [province?.id]);

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
          Alert.alert("Validation Error", "Please fill all required fields");
          return false;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
          Alert.alert("Validation Error", "Please enter a valid email address");
          return false;
        }
        return true;
     
       
      default:
        return true;
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
      name: file.name || "id_document",
      mimeType: file.mimeType,
    });
  };

  const pickBusinessDoc = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (res.canceled) return;
    const file = res.assets ? res.assets[0] : res;
    setBusinessDoc({
      uri: file.uri,
      name: file.name || "business_document",
      mimeType: file.mimeType,
    });
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
        registrationType: "indirect",
        parentAgentId: null,
      };

      const response = await merchantSignup(payload);
      
      if (response.success) {
        navigation.replace("ApplicationResult", {
          type: "merchant",
          title: "Application Submitted",
          message: "Your merchant application has been submitted successfully. We'll review your application and contact you within 3-5 business days.",
          cta: "Back to Profile",
        });
      } else {
        Alert.alert("Application Failed", response.message || "Failed to submit application");
      }
    } catch (error) {
      console.error("Application error:", error);
      Alert.alert("Error", "Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <AuthHeader
        title="Apply for Merchant Account"
        onBack={() => (step === 0 ? navigation.goBack() : back())}
      />

    
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <LabeledInput
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter First Name"
              required
            />
            <LabeledInput
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter Last Name"
              required
            />
            <LabeledInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter Your Email Address"
              keyboardType="email-address"
              required
            />
            <LabeledInput
              label="Mobile Number"
              value={mobileNumber}
              onChangeText={setMobileNumber}
              placeholder="Enter Mobile Number"
              keyboardType="phone-pad"
              required
            />
            <LabeledInput
              label="Alternative Contact"
              value={alternativeContact}
              onChangeText={setAlternativeContact}
              placeholder="Enter Alternative Contact"
              keyboardType="phone-pad"
            />

            <PrimaryButton
              label="Continue"
              onPress={next}
              style={styles.fullButton}
            />
          </>
        )}

        {step === 1 && (
          <>


            <DropField
              label="Country"
              value={country?.countryName || "Select Country"}
              onPress={() => setPicker({ open: true, type: "country" })}
              leftIcon={
                country ? <Text style={{ fontSize: 18 }}>{codeToFlag(country.countryCode)}</Text> : null
              }
              required
            />
            <DropField
              label="Province"
              value={province?.provinceName || "Select Province"}
              onPress={() => setPicker({ open: true, type: "province" })}
              required
            />
            <DropField
              label="District"
              value={district?.districtName || "Select District"}
              onPress={() => setPicker({ open: true, type: "district" })}
              required
            />
            <LabeledInput
              label="Full Business Address"
              value={address}
              onChangeText={setAddress}
              placeholder="Enter Full Business Address"
              required
            />
            <DropField
              label="Preferred Communication Language"
              value={messageLanguage || "Select Language"}
              onPress={() => setPicker({ open: true, type: "lang" })}
            />

            <View style={styles.rowButtons}>
              <DarkButton
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
            <Text style={styles.sectionTitle}>Document Upload</Text>
            <Text style={styles.subtitle}>Please upload the required documents for verification</Text>

        
            <View style={styles.uploadSection}>
              <Text style={styles.uploadLabel}>Profile Photo</Text>
              <View style={styles.photoBox}>
                {photoUri ? (
                  <Image
                    source={{ uri: photoUri }}
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="person" size={40} color="#9E9E9E" />
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={takePhoto}
              >
                <Ionicons name="camera-outline" size={18} color="#fff" />
                <Text style={styles.uploadButtonText}>
                  {photoUri ? "Change Photo" : "Take Photo"}
                </Text>
              </TouchableOpacity>
            </View>

     

            <View style={styles.rowButtons}>
              <DarkButton
                label="Back"
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
                    <Text style={styles.submitButtonText}>Submit Application</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Picker Modal */}
      <Modal
        transparent
        visible={picker.open}
        animationType="fade"
        statusBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={() => setPicker({ open: false })}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {picker.type === "country" ? "Select Country" :
                 picker.type === "province" ? "Select Province" :
                 picker.type === "district" ? "Select District" : "Select Language"}
              </Text>
              <TouchableOpacity
                onPress={() => setPicker({ open: false })}
                style={{ padding: 6 }}
              >
                <Ionicons name="close" size={20} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={
                picker.type === "country" ? countries :
                picker.type === "province" ? provinces :
                picker.type === "district" ? districts : LANGS
              }
              keyExtractor={(item, index) => 
                picker.type === "country" ? item.countryCode :
                picker.type === "province" ? item.id.toString() :
                picker.type === "district" ? item.id.toString() : item + index
              }
              ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalRow}
                  onPress={() => {
                    if (picker.type === "country") setCountry(item);
                    if (picker.type === "province") setProvince(item);
                    if (picker.type === "district") setDistrict(item);
                    if (picker.type === "lang") setMessageLanguage(item);
                    setPicker({ open: false });
                  }}
                  activeOpacity={0.85}
                >
                  {picker.type === "country" && (
                    <Text style={{ fontSize: 18, marginRight: 8 }}>
                      {codeToFlag(item.countryCode)}
                    </Text>
                  )}
                  <Text style={{ flex: 1, fontSize: 15, color: Colors.textPrimary }}>
                    {picker.type === "country" ? item.countryName :
                     picker.type === "province" ? item.provinceName :
                     picker.type === "district" ? item.districtName : item}
                  </Text>
                  {(picker.type === "country" && item.countryCode === country?.countryCode) ||
                   (picker.type === "province" && item.id === province?.id) ||
                   (picker.type === "district" && item.id === district?.id) ||
                   (picker.type === "lang" && item === messageLanguage) ? (
                    <Ionicons name="checkmark-circle" color={Colors.primary} size={18} />
                  ) : null}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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

function StepDot({ index, current, label }) {
  const active = current === index;
  const done = current > index;
  return (
    <View style={styles.stepItem}>
      <View
        style={[
          styles.stepDot,
          active && { backgroundColor: Colors.primary, borderColor: Colors.primary },
          done && { backgroundColor: Colors.primary },
        ]}
      >
        {done ? (
          <Ionicons name="checkmark" size={12} color="#fff" />
        ) : (
          <Text style={[styles.stepNum, active && { color: "#fff" }]}>
            {index + 1}
          </Text>
        )}
      </View>
      <Text style={styles.stepLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function StepLine({ active }) {
  return (
    <View
      style={[styles.stepLine, active && { backgroundColor: Colors.primary }]}
    />
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    maxHeight: "70%",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: "#fff",
  },

  // Stepper
  stepperWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 10,
    backgroundColor: Colors.white,
  },
  stepItem: { alignItems: "center" },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: { fontSize: 12, color: Colors.textPrimary, fontWeight: "700" },
  stepLabel: {
    fontSize: 10,
    marginTop: 4,
    color: Colors.textSecondary,
    width: 72,
    textAlign: "center",
  },
  stepLine: {
    height: 2,
    width: 28,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 8,
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

  // Upload Sections
  uploadSection: {
    marginBottom: 20,
  },
  uploadLabel: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 8,
    fontWeight: "500",
  },
  photoBox: {
    height: 120,
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

  // Buttons
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