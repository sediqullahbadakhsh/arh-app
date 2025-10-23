import React, { useEffect, useMemo, useState, useRef } from "react";
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
  Animated,
  Easing,
  Dimensions,
  Share
} from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";
import InputField from "../../components/InputField";
import PrimaryButton from "../../components/PrimaryButton";
import { 
  updateAgentDetails, 
  getCountries, 
  getDistricts, 
  getProvinces,
  getAgentById 
} from "../../services/merchantApi";
import { useUser } from "../../context/userContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SuccessModal from "../../components/modals/SuccessModal";

const { height: screenHeight } = Dimensions.get('window');

const LANGS = [
  { label: "English", value: "english", code: "en" },
  { label: "Dari", value: "dari", code: "fa" },
  { label: "Pashto", value: "pashto", code: "ps" },
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

const GAP = 16;

export default function AgentEditScreen({ navigation, route }) {
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const { agent, refreshAgentList } = route.params || {};
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [agentData, setAgentData] = useState(null);

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
  
  // Data states
  const [countries, setCountries] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  
  // Modal states
  const [modal, setModal] = useState({ 
    open: false, 
    type: null,
    title: "",
    data: [],
    searchQuery: ""
  });

  // Animation
  const [modalSlideAnim] = useState(new Animated.Value(screenHeight));

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

  useEffect(() => {
    if (modal.open) {
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
  }, [modal.open]);

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
      const IMG_BASE_URL = "http://3.67.144.22/uploads/profile_pictures/"; // Replace with your actual image base URL
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

  const openModal = (type, title, data) => {
    setModal({ 
      open: true, 
      type, 
      title, 
      data,
      searchQuery: "" 
    });
  };

  const closeModal = () => {
    setModal({ open: false, type: null, title: "", data: [], searchQuery: "" });
  };

  const handleSelect = (item) => {
    switch (modal.type) {
      case "country":
        setCountry(item);
        break;
      case "province":
        setProvince(item);
        break;
      case "district":
        setDistrict(item);
        break;
      case "lang":
        setMessageLanguage(item.value);
        break;
      case "status":
        setStatus(item.value);
        break;
      case "accountType":
        setAccountType(item.value);
        break;
    }
    closeModal();
  };

  const getSelectedValue = (type) => {
    switch (type) {
      case "country":
        return country?.countryName;
      case "province":
        return province?.provinceName;
      case "district":
        return district?.districtName;
      case "lang":
        return LANGS.find(l => l.value === messageLanguage)?.label;
      case "status":
        return STATUSES.find(s => s.value === status)?.label;
      case "accountType":
        return ACCOUNT_TYPES.find(a => a.value === accountType)?.label;
      default:
        return "";
    }
  };

  const getModalData = () => {
    let data = modal.data;
    if (modal.searchQuery) {
      const query = modal.searchQuery.toLowerCase();
      data = data.filter(item => 
        item.countryName?.toLowerCase().includes(query) ||
        item.provinceName?.toLowerCase().includes(query) ||
        item.districtName?.toLowerCase().includes(query) ||
        item.label?.toLowerCase().includes(query) ||
        item.value?.toLowerCase().includes(query)
      );
    }
    return data;
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
      };

      await updateAgentDetails(agent.user_id, payload);
      

      const updatedAgentData = {
        agentName: `${firstName} ${lastName}`.trim(),
        email: email.trim(),
        mobileNumber: mobileNumber.trim(),
        accountType: getSelectedValue("accountType"),
        status: getSelectedValue("status"),
        location: `${district?.districtName}, ${province?.provinceName}, ${country?.countryName}`,
        address: address.trim(),
        language: getSelectedValue("lang"),
        timestamp: new Date().toISOString(),
        agentId: agent.user_id || `AG${Date.now()}`,
      };
      
      setAgentData(updatedAgentData);
      setIsSuccessVisible(true);
      
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

  const handleSuccessClose = () => {
    setIsSuccessVisible(false);
    refreshAgentList?.();
    navigation.goBack();
  };

  const handleShareAgent = async () => {
    try {
      if (!agentData) {
        Alert.alert("Error", "No agent data available to share");
        return;
      }

      const shareMessage = `👤 Agent Updated Successfully!

🤝 Updated Agent Information:
• Name: ${agentData.agentName}
• Email: ${agentData.email}
• Mobile: ${agentData.mobileNumber}
• Account Type: ${agentData.accountType}
• Status: ${agentData.status}
• Location: ${agentData.location}
• Language: ${agentData.language}
• Agent ID: ${agentData.agentId}

📍 Address: ${agentData.address}

📅 Updated: ${new Date(agentData.timestamp).toLocaleDateString()}

Agent profile has been successfully updated! ✅`;

      await Share.share({
        message: shareMessage,
        title: 'Agent Updated Successfully'
      });

    } catch (error) {
      console.log('Error sharing agent details:', error);
      Alert.alert("Share Error", "Failed to share agent details. Please try again.");
    }
  };

  const getSuccessDetails = () => {
    if (!agentData) return [];
    
    return [
      {
        type: "agent",
        label: "Agent Name",
        value: agentData.agentName
      },
      {
        type: "email",
        label: "Email Address",
        value: agentData.email
      },
    
    ];
  };

  const renderFlag = (countryCode) => {
    if (!countryCode) return null;
    

    const flagEmojis = {
      'AF': '🇦🇫',
      'US': '🇺🇸',
      'GB': '🇬🇧',
      'CA': '🇨🇦',
      'AU': '🇦🇺',
      'IN': '🇮🇳',
      'PK': '🇵🇰',
      'CN': '🇨🇳',
      'JP': '🇯🇵',
      'KR': '🇰🇷',
      'DE': '🇩🇪',
      'FR': '🇫🇷',
      'IT': '🇮🇹',
      'ES': '🇪🇸',
      'BR': '🇧🇷',
      'RU': '🇷🇺',
    };
    
    return (
      <Text style={{ fontSize: 18, marginRight: 12 }}>
        {flagEmojis[countryCode] || '🏳️'}
      </Text>
    );
  };

  const renderModalItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.modalRow} 
      onPress={() => handleSelect(item)}
      activeOpacity={0.7}
    >
      {modal.type === "country" && renderFlag(item.countryCode)}
      
      <View style={{ flex: 1 }}>
        <Text style={styles.modalItemTitle}>
          {item.countryName || item.provinceName || item.districtName || item.label}
        </Text>
        {modal.type === "country" && item.countryCode && (
          <Text style={styles.modalItemSubtitle}>
            {item.countryCode}
          </Text>
        )}
        {modal.type === "lang" && item.code && (
          <Text style={styles.modalItemSubtitle}>
            {item.code.toUpperCase()}
          </Text>
        )}
      </View>
      
      {isItemSelected(item) && (
        <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );

  const isItemSelected = (item) => {
    switch (modal.type) {
      case "country":
        return item.id === country?.id;
      case "province":
        return item.id === province?.id;
      case "district":
        return item.id === district?.id;
      case "lang":
        return item.value === messageLanguage;
      case "status":
        return item.value === status;
      case "accountType":
        return item.value === accountType;
      default:
        return false;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader
        title="Edit Agent"
        onBack={() => navigation.goBack()}
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
        >
          {step === 0 && (
            <>
              <Text style={styles.sectionTitle}>Personal Information</Text>

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
                value={getSelectedValue("country")}
                onPress={() => openModal("country", "Select Country", countries)}
                leftIcon={renderFlag(country?.countryCode)}
                required
              />
              <DropField
                label="Province"
                value={getSelectedValue("province")}
                onPress={() => openModal("province", "Select Province", provinces)}
                required
              />
              <DropField
                label="District"
                value={getSelectedValue("district")}
                onPress={() => openModal("district", "Select District", districts)}
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
                value={getSelectedValue("lang")}
                onPress={() => openModal("lang", "Select Language", LANGS)}
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
           
              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Update Summary</Text>
                <InfoRow label="Name" value={`${firstName} ${lastName}`} />
                <InfoRow label="Email" value={email} />
                <InfoRow label="Mobile" value={mobileNumber} />
                <InfoRow label="Country" value={country?.countryName} />
                <InfoRow label="Province" value={province?.provinceName} />
                <InfoRow label="District" value={district?.districtName} />
                <InfoRow label="Address" value={address} />
                <InfoRow label="Language" value={getSelectedValue("lang")} />
                <InfoRow label="Account Type" value={getSelectedValue("accountType")} />
                <InfoRow label="Status" value={getSelectedValue("status")} />
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
      </KeyboardAwareScrollView>

  
      <SuccessModal
        visible={isSuccessVisible}
        onClose={handleSuccessClose}
        title="Agent Updated Successfully!"
        subtitle="The agent profile has been updated successfully with all the new information."
        details={getSuccessDetails()}
        primaryButtonText="Continue"
        showConfetti={true}
        showAnimation={true}
        animationSize={120}
      />


      <Modal
        visible={modal.open}
        transparent={true}
        animationType="none"
        statusBarTranslucent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeModal}
          />
          <Animated.View 
            style={[
              styles.modalCard,
              { 
                transform: [{ translateY: modalSlideAnim }],
                height: '80%',
                marginBottom: -insets.bottom
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modal.title}</Text>
              <TouchableOpacity 
                onPress={closeModal}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                placeholder={`Search ${modal.title.toLowerCase()}...`}
                value={modal.searchQuery}
                onChangeText={(text) => setModal(prev => ({ ...prev, searchQuery: text }))}
                style={styles.searchInput}
                placeholderTextColor="#999"
              />
            </View>

            <FlatList
              data={getModalData()}
              keyExtractor={(item) => item.id?.toString() || item.value || item.code || Math.random().toString()}
              renderItem={renderModalItem}
              ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalContent}
            />
          </Animated.View>
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
    <View style={{ marginBottom: GAP }}>
      <Text style={styles.label}>
        {required && <Text style={{ color: "#F44336" }}>* </Text>}
        {label}
      </Text>
      <TouchableOpacity
        style={styles.dropField}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.selectedContent}>
          {leftIcon && <View style={{ marginRight: 12 }}>{leftIcon}</View>}
          <Text style={[styles.dropFieldText, !value && styles.placeholderText]}>
            {value || `Select ${label}`}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color="#7A7A7A" />
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
    paddingTop: 20,
    paddingBottom: 140,
    backgroundColor: Colors.white,
  },
  sectionTitle: {
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 20,
    fontWeight: "700",
  },
  label: { 
    fontSize: 14, 
    color: Colors.textPrimary, 
    marginBottom: 8,
    fontWeight: '600'
  },
  dropField: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedContent: {
    flexDirection: "row", 
    alignItems: "center", 
    flex: 1
  },
  dropFieldText: {
    color: Colors.textPrimary, 
    fontSize: 16,
    fontWeight: '500'
  },
  placeholderText: {
    color: "#6B7280",
  },
  fullButton: { 
    marginTop: 20 
  },
  rowButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  halfButton: { 
    width: "48%" 
  },
  darkBtn: {
    height: 50,
    borderRadius: 12,
    backgroundColor: "#2B2B2B",
    alignItems: "center",
    justifyContent: "center",
  },
  darkBtnText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "600" 
  },
  infoBox: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
    color: Colors.textPrimary 
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
  modalContent: {
    paddingBottom: 20,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  modalItemTitle: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  modalItemSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  modalSeparator: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
});