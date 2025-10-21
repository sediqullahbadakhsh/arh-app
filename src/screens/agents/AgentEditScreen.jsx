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
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";
import InputField from "../../components/InputField";
import PrimaryButton from "../../components/PrimaryButton";
import { COUNTRIES } from "../../constants/countries";
import { codeToFlag } from "../../utils/flag";
import { 
  updateAgentDetails, 
  getCountries, 
  getDistricts, 
  getProvinces,
  getAgentById 
} from "../../services/merchantApi";
import { useUser } from "../../context/userContext";

const LANGS = [
  { label: "English", value: "english" },
  { label: "Dari", value: "dari" },
  { label: "Pashto", value: "pashto" },
];

const STATUSES = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Suspended", value: "suspended" },
];

const ACCOUNT_TYPES = [
  { label: "Retailer", value: "retailer" },
  { label: "Merchant", value: "merchant" },
];

const GAP = 1;

export default function AgentEditScreen({ navigation, route }) {
  const { user } = useUser();
  const { agent, refreshAgentList } = route.params || {};
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [alternativeContact, setAlternativeContact] = useState("");
  const [country, setCountry] = useState(null);
  const [province, setProvince] = useState(null);
  const [district, setDistrict] = useState(null);
  const [address, setAddress] = useState("");
  const [messageLanguage, setMessageLanguage] = useState("");
  const [status, setStatus] = useState("active");
  const [accountType, setAccountType] = useState("retailer");
  const [commissionRate, setCommissionRate] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  
  const [countries, setCountries] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [picker, setPicker] = useState({ open: false, type: null });

  useEffect(() => {
    if (agent) {
      loadAgentData();
    }
    getAllCountries();
  }, [agent]);

  useEffect(() => {
    if (country?.id) {
      getAllProvinces(country.id);
    }
  }, [country?.id]);

  useEffect(() => {
    if (province?.id) {
      getAllDistricts(province.id);
    }
  }, [province?.id]);

  const loadAgentData = () => {
    if (!agent) return;

    // Extract first and last name from username
    const nameParts = agent.user?.username?.split(' ') || [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    setFirstName(firstName);
    setLastName(lastName);
    setEmail(agent.user?.email || '');
    setMobileNumber(agent.user?.mobileNumber || '');
    setAlternativeContact(agent.alternativeContact || '');
    setAddress(agent.address || '');
    setMessageLanguage(agent.messageLanguage || '');
    setStatus(agent.user?.status || 'active');
    setAccountType(agent.accountType || 'retailer');
    setCommissionRate(agent.commissionRateDetails?.percentage?.toString() || '');
    
    // Set location data (these will be properly set when countries/provinces/districts load)
    if (agent.countryDetails) {
      setCountry(agent.countryDetails);
    }
    if (agent.provinceDetails) {
      setProvince(agent.provinceDetails);
    }
    if (agent.districtDetails) {
      setDistrict(agent.districtDetails);
    }

    // Set profile picture if available
    if (agent.user?.profile_picture) {
      const IMG_BASE_URL = "YOUR_IMAGE_BASE_URL"; // Replace with your actual image base URL
      setProfilePicture(`${IMG_BASE_URL}${agent.user.profile_picture}`);
    }
  };

  const getAllCountries = async () => {
    try {
      const res = await getCountries();
      setCountries(res?.data || []);
      
      // After countries load, set the agent's country
      if (agent?.countryDetails) {
        const agentCountry = res?.data?.find(c => c.id === agent.countryDetails.id);
        if (agentCountry) setCountry(agentCountry);
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
    }
  };

  const getAllProvinces = async (countryId) => {
    try {
      const res = await getProvinces(countryId);
      setProvinces(res?.data || []);
      
      // After provinces load, set the agent's province
      if (agent?.provinceDetails && countryId === agent.countryDetails?.id) {
        const agentProvince = res?.data?.find(p => p.id === agent.provinceDetails.id);
        if (agentProvince) setProvince(agentProvince);
      }
    } catch (error) {
      console.error("Error fetching provinces:", error);
    }
  };

  const getAllDistricts = async (provinceId) => {
    try {
      const res = await getDistricts(provinceId);
      setDistricts(res?.data || []);
      
      // After districts load, set the agent's district
      if (agent?.districtDetails && provinceId === agent.provinceDetails?.id) {
        const agentDistrict = res?.data?.find(d => d.id === agent.districtDetails.id);
        if (agentDistrict) setDistrict(agentDistrict);
      }
    } catch (error) {
      console.error("Error fetching districts:", error);
    }
  };

  const next = () => {
    if (step === 0 && !validateStep1()) return;
    if (step === 1 && !validateStep2()) return;
    setStep((s) => Math.min(2, s + 1));
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const validateStep1 = () => {
    if (!firstName.trim()) {
      Alert.alert("Error", "First name is required");
      return false;
    }
    if (!lastName.trim()) {
      Alert.alert("Error", "Last name is required");
      return false;
    }
    if (!email.trim()) {
      Alert.alert("Error", "Email is required");
      return false;
    }
    if (!mobileNumber.trim()) {
      Alert.alert("Error", "Mobile number is required");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!country) {
      Alert.alert("Error", "Country is required");
      return false;
    }
    if (!province) {
      Alert.alert("Error", "Province is required");
      return false;
    }
    if (!district) {
      Alert.alert("Error", "District is required");
      return false;
    }
    if (!address.trim()) {
      Alert.alert("Error", "Address is required");
      return false;
    }
    if (!messageLanguage) {
      Alert.alert("Error", "Message language is required");
      return false;
    }
    return true;
  };

  const validateCommissionRate = () => {
    if (commissionRate) {
      const rate = parseFloat(commissionRate);
      if (isNaN(rate)) {
        Alert.alert("Error", "Commission rate must be a valid number");
        return false;
      }
      if (rate < 0) {
        Alert.alert("Error", "Commission rate cannot be negative");
        return false;
      }
      if (rate > 100) {
        Alert.alert("Error", "Commission rate cannot exceed 100%");
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions to change profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const submit = async () => {
    if (!validateCommissionRate()) return;

    try {
      setUpdating(true);
      
      const payload = {
        username: `${firstName} ${lastName}`.trim(),
        email: email.trim(),
        mobileNumber: mobileNumber.trim(),
        status: status,
        country: country?.id,
        province: province?.id,
        district: district?.id,
        address: address.trim(),
        alternativeContact: alternativeContact.trim(),
        messageLanguage: messageLanguage,
        accountType: accountType,
        commission_rate: commissionRate ? parseFloat(commissionRate) : 0,
        // Note: Profile picture upload would require FormData and separate handling
        // For now, we're not including it in the update
      };

      await updateAgentDetails(agent.id, payload);
      
      Alert.alert(
        "Success", 
        "Agent updated successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              refreshAgentList?.();
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error("Update agent error:", error);
      Alert.alert(
        "Error", 
        error.response?.data?.error || "Failed to update agent. Please try again."
      );
    } finally {
      setUpdating(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader
        title="Edit Agent"
        onBack={() => navigation.goBack()}
      />

      {/* Step indicator */}
      <View style={styles.stepperWrap}>
        <StepDot index={0} current={step} label="Personal" />
        <StepLine active={step >= 1} />
        <StepDot index={1} current={step} label="Location" />
        <StepLine active={step >= 2} />
        <StepDot index={2} current={step} label="Settings" />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && (
          <>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            {/* Profile Picture */}
            <View style={styles.profileSection}>
              <TouchableOpacity onPress={pickImage} style={styles.profileImageContainer}>
                {profilePicture ? (
                  <Image source={{ uri: profilePicture }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <Ionicons name="person" size={32} color="#9E9E9E" />
                  </View>
                )}
                <View style={styles.cameraIcon}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.profileHint}>Tap to change photo</Text>
            </View>

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
              placeholder="Enter Email Address"
              keyboardType="email-address"
              autoCapitalize="none"
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
            <Text style={styles.sectionTitle}>Location Information</Text>

            <DropField
              label="Country"
              value={country?.countryName || "Select Country"}
              onPress={() => setPicker({ open: true, type: "country" })}
              leftIcon={
                <Text style={{ fontSize: 18 }}>
                  {codeToFlag(country?.countryCode)}
                </Text>
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
              label="Full Address"
              value={address}
              onChangeText={setAddress}
              placeholder="Enter Full Address"
              required
            />
            <DropField
              label="Message Language"
              value={messageLanguage ? LANGS.find(l => l.value === messageLanguage)?.label : "Select Language"}
              onPress={() => setPicker({ open: true, type: "lang" })}
              required
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
            <Text style={styles.sectionTitle}>Account Settings</Text>

            <DropField
              label="Account Type"
              value={accountType ? ACCOUNT_TYPES.find(a => a.value === accountType)?.label : "Select Account Type"}
              onPress={() => setPicker({ open: true, type: "accountType" })}
              required
            />
            <DropField
              label="Status"
              value={status ? STATUSES.find(s => s.value === status)?.label : "Select Status"}
              onPress={() => setPicker({ open: true, type: "status" })}
              required
            />

            <LabeledInput
              label="Commission Rate (%)"
              value={commissionRate}
              onChangeText={setCommissionRate}
              placeholder="Enter Commission Rate"
              keyboardType="decimal-pad"
            />

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Update Summary</Text>
              <InfoRow label="Name" value={`${firstName} ${lastName}`} />
              <InfoRow label="Email" value={email} />
              <InfoRow label="Mobile" value={mobileNumber} />
              <InfoRow label="Country" value={country?.countryName} />
              <InfoRow label="Province" value={province?.provinceName} />
              <InfoRow label="District" value={district?.districtName} />
              <InfoRow label="Address" value={address} />
              <InfoRow label="Language" value={messageLanguage} />
              <InfoRow label="Account Type" value={accountType} />
              <InfoRow label="Status" value={status} />
              <InfoRow label="Commission Rate" value={commissionRate ? `${commissionRate}%` : "Not set"} />
            </View>

            <View style={styles.rowButtons}>
              <DarkButton
                label="Back"
                onPress={back}
                style={styles.halfButton}
                disabled={updating}
              />
              <PrimaryButton
                label={updating ? "Updating..." : "Update Agent"}
                onPress={submit}
                style={styles.halfButton}
                disabled={updating}
              />
            </View>
          </>
        )}
      </ScrollView>

      {/* Picker modal */}
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
                {picker.type === "country" && "Select Country"}
                {picker.type === "province" && "Select Province"}
                {picker.type === "district" && "Select District"}
                {picker.type === "lang" && "Select Language"}
                {picker.type === "status" && "Select Status"}
                {picker.type === "accountType" && "Select Account Type"}
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
                picker.type === "district" ? districts :
                picker.type === "lang" ? LANGS :
                picker.type === "status" ? STATUSES :
                picker.type === "accountType" ? ACCOUNT_TYPES : []
              }
              keyExtractor={(item) => item.value || item.id || item.countryCode}
              ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalRow}
                  onPress={() => {
                    if (picker.type === "country") {
                      setCountry(item);
                    } else if (picker.type === "province") {
                      setProvince(item);
                    } else if (picker.type === "district") {
                      setDistrict(item);
                    } else if (picker.type === "lang") {
                      setMessageLanguage(item.value);
                    } else if (picker.type === "status") {
                      setStatus(item.value);
                    } else if (picker.type === "accountType") {
                      setAccountType(item.value);
                    }
                    setPicker({ open: false });
                  }}
                  activeOpacity={0.85}
                >
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 15,
                      color: Colors.textPrimary,
                    }}
                  >
                    {item.countryName || item.provinceName || item.districtName || item.label}
                  </Text>
                  {((picker.type === "country" && item.id === country?.id) ||
                   (picker.type === "province" && item.id === province?.id) ||
                   (picker.type === "district" && item.id === district?.id) ||
                   (picker.type === "lang" && item.value === messageLanguage) ||
                   (picker.type === "status" && item.value === status) ||
                   (picker.type === "accountType" && item.value === accountType)) && (
                    <Ionicons
                      name="checkmark-circle"
                      color={Colors.primary}
                      size={18}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function LabeledInput({ label, placeholder, required, ...rest }) {
  return (
    <View style={{ marginBottom: GAP }}>
      <Text style={styles.label}>
        {required && <Text style={{ color: "#F44336" }}>* </Text>}
        {label}
      </Text>
      <InputField placeholder={placeholder} {...rest} />
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
          {leftIcon ? <View style={{ marginRight: 8 }}>{leftIcon}</View> : null}
          <Text style={{ 
            color: value && !value.includes("Select") ? Colors.textPrimary : "#6B7280", 
            fontSize: 14 
          }}>
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
          active && {
            backgroundColor: Colors.primary,
            borderColor: Colors.primary,
          },
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

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value || "Not set"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 140,
    gap: GAP,
    backgroundColor: Colors.white,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: "#fff",
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
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 6,
    fontWeight: "600",
  },
  label: { fontSize: 13, color: Colors.textPrimary, marginBottom: 4 },
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
  infoBox: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 16,
    marginVertical: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: 8,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 8,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  profilePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  profileHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
});