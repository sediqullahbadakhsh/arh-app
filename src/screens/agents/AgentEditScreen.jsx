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
import { scale } from "../../utils/normalizeSize";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const { agent, refreshAgentList } = route.params || {};
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [agentData, setAgentData] = useState(null);

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
  
  const [modal, setModal] = useState({ 
    open: false, 
    type: null,
    title: "",
    data: [],
    searchQuery: ""
  });

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
    
    if (agent.countryDetails) {
      setCountry(agent.countryDetails);
    }
    if (agent.provinceDetails) {
      setProvince(agent.provinceDetails);
    }
    if (agent.districtDetails) {
      setDistrict(agent.districtDetails);
    }

    if (agent.user?.profile_picture) {
      const IMG_BASE_URL = "http://3.67.144.22/uploads/profile_pictures/"; 
      setProfilePicture(`${IMG_BASE_URL}${agent.user.profile_picture}`);
    }
  };

  const getAllCountries = async () => {
    try {
      const res = await getCountries();
      setCountries(res?.data || []);
      
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
      Alert.alert(t('error'), t('firstNameRequired'));
      return false;
    }
    if (!lastName.trim()) {
      Alert.alert(t('error'), t('lastNameRequired'));
      return false;
    }
    if (!email.trim()) {
      Alert.alert(t('error'), t('emailRequired'));
      return false;
    }
    if (!mobileNumber.trim()) {
      Alert.alert(t('error'), t('mobileNumberRequired'));
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!country) {
      Alert.alert(t('error'), t('countryRequired'));
      return false;
    }
    if (!province) {
      Alert.alert(t('error'), t('provinceRequired'));
      return false;
    }
    if (!district) {
      Alert.alert(t('error'), t('districtRequired'));
      return false;
    }
    if (!address.trim()) {
      Alert.alert(t('error'), t('addressRequired'));
      return false;
    }
    if (!messageLanguage) {
      Alert.alert(t('error'), t('messageLanguageRequired'));
      return false;
    }
    return true;
  };

  const validateCommissionRate = () => {
    if (commissionRate) {
      const rate = parseFloat(commissionRate);
      if (isNaN(rate)) {
        Alert.alert(t('error'), t('commissionRateValidNumber'));
        return false;
      }
      if (rate < 0) {
        Alert.alert(t('error'), t('commissionRateNotNegative'));
        return false;
      }
      if (rate > 100) {
        Alert.alert(t('error'), t('commissionRateNotExceed'));
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('permissionRequired'), t('cameraRollPermission'));
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
      Alert.alert(t('error'), t('failedToPickImage'));
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
        t('error'), 
        error.response?.data?.error || t('updateAgentFailed')
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
        Alert.alert(t('error'), t('noAgentDataAvailable'));
        return;
      }

      const shareMessage = `${t('agentUpdatedSuccessfully')}

${t('updatedAgentInformation')}:
• ${t('name')}: ${agentData.agentName}
• ${t('email')}: ${agentData.email}
• ${t('mobile')}: ${agentData.mobileNumber}
• ${t('accountType')}: ${agentData.accountType}
• ${t('status')}: ${agentData.status}
• ${t('location')}: ${agentData.location}
• ${t('language')}: ${agentData.language}
• ${t('agentId')}: ${agentData.agentId}

📍 ${t('address')}: ${agentData.address}

📅 ${t('updated')}: ${new Date(agentData.timestamp).toLocaleDateString()}

${t('agentProfileUpdated')} ✅`;

      await Share.share({
        message: shareMessage,
        title: t('agentUpdatedSuccessfully')
      });

    } catch (error) {
      console.log('Error sharing agent details:', error);
      Alert.alert(t('shareError'), t('failedToShareAgent'));
    }
  };

  const getSuccessDetails = () => {
    if (!agentData) return [];
    
    return [
      {
        type: "agent",
        label: t('agentName'),
        value: agentData.agentName
      },
      {
        type: "email",
        label: t('emailAddress'),
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

  const getModalTitle = (type) => {
    switch (type) {
      case "country":
        return t('selectCountry');
      case "province":
        return t('selectProvince');
      case "district":
        return t('selectDistrict');
      case "lang":
        return t('selectLanguage');
      case "status":
        return t('selectStatus');
      case "accountType":
        return t('selectAccountType');
      default:
        return t('select');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader
        title={t('editAgent')}
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
              <Text style={styles.sectionTitle}>{t('personalInformation')}</Text>

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
                <Text style={styles.profileHint}>{t('tapToChangePhoto')}</Text>
              </View>

              <LabeledInput
                label={t('firstName')}
                value={firstName}
                onChangeText={setFirstName}
                placeholder={t('enterFirstName')}
                required
              />
              <LabeledInput
                label={t('lastName')}
                value={lastName}
                onChangeText={setLastName}
                placeholder={t('enterLastName')}
                required
              />
              <LabeledInput
                label={t('email')}
                value={email}
                onChangeText={setEmail}
                placeholder={t('enterEmailAddress')}
                keyboardType="email-address"
                autoCapitalize="none"
                required
              />
              <LabeledInput
                label={t('mobileNumber')}
                value={mobileNumber}
                onChangeText={setMobileNumber}
                placeholder={t('enterMobileNumber')}
                keyboardType="phone-pad"
                required
              />
              <LabeledInput
                label={t('alternativeContact')}
                value={alternativeContact}
                onChangeText={setAlternativeContact}
                placeholder={t('enterAlternativeContact')}
                keyboardType="phone-pad"
              />

              <PrimaryButton
                label={t('continue')}
                onPress={next}
                style={styles.fullButton}
              />
            </>
          )}

          {step === 1 && (
            <>
              <Text style={styles.sectionTitle}>{t('locationInformation')}</Text>

              <DropField
                label={t('country')}
                value={getSelectedValue("country")}
                onPress={() => openModal("country", t('selectCountry'), countries)}
                leftIcon={renderFlag(country?.countryCode)}
                required
              />
              <DropField
                label={t('province')}
                value={getSelectedValue("province")}
                onPress={() => openModal("province", t('selectProvince'), provinces)}
                required
              />
              <DropField
                label={t('district')}
                value={getSelectedValue("district")}
                onPress={() => openModal("district", t('selectDistrict'), districts)}
                required
              />
              <LabeledInput
                label={t('fullAddress')}
                value={address}
                onChangeText={setAddress}
                placeholder={t('enterFullAddress')}
                required
              />
              <DropField
                label={t('messageLanguage')}
                value={getSelectedValue("lang")}
                onPress={() => openModal("lang", t('selectLanguage'), LANGS)}
                required
              />

              <View style={styles.rowButtons}>
                <DarkButton
                  label={t('back')}
                  onPress={back}
                  style={styles.halfButton}
                />
                <PrimaryButton
                  label={t('continue')}
                  onPress={next}
                  style={styles.halfButton}
                />
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>{t('updateSummary')}</Text>
                <InfoRow label={t('name')} value={`${firstName} ${lastName}`} />
                <InfoRow label={t('email')} value={email} />
                <InfoRow label={t('mobile')} value={mobileNumber} />
                <InfoRow label={t('country')} value={country?.countryName} />
                <InfoRow label={t('province')} value={province?.provinceName} />
                <InfoRow label={t('district')} value={district?.districtName} />
                <InfoRow label={t('address')} value={address} />
                <InfoRow label={t('language')} value={getSelectedValue("lang")} />
                <InfoRow label={t('accountType')} value={getSelectedValue("accountType")} />
                <InfoRow label={t('status')} value={getSelectedValue("status")} />
                <InfoRow label={t('commissionRate')} value={commissionRate ? `${commissionRate}%` : t('notSet')} />
              </View>

              <View style={styles.rowButtons}>
                <DarkButton
                  label={t('back')}
                  onPress={back}
                  style={styles.halfButton}
                  disabled={updating}
                />
                <PrimaryButton
                  label={updating ? t('updating') : t('updateAgent')}
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
        title={t('agentUpdatedSuccessfully')}
        subtitle={t('agentProfileUpdatedSuccessfully')}
        details={getSuccessDetails()}
        primaryButtonText={t('continue')}
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
                placeholder={`${t('search')} ${modal.title.toLowerCase()}...`}
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
  const { t } = useTranslation();
  
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
  const { t } = useTranslation();
  
  const getPlaceholderText = () => {
    switch (label) {
      case t('country'):
        return t('selectCountry');
      case t('province'):
        return t('selectProvince');
      case t('district'):
        return t('selectDistrict');
      case t('messageLanguage'):
        return t('selectLanguage');
      default:
        return `${t('select')} ${label}`;
    }
  };

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
            {value || getPlaceholderText()}
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
  const { t } = useTranslation();
  
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value || t('notSet')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scale.wp(5.8),
    paddingTop: scale.hp(2.6),
    paddingBottom: scale.hp(18),
    backgroundColor: Colors.white,
  },
  sectionTitle: {
    fontSize: scale.hp(2.3),
    color: Colors.textPrimary,
    marginBottom: scale.hp(2.6),
    fontWeight: "700",
  },
  label: {
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
    marginBottom: scale.hp(1),
    fontWeight: '600',
  },
  dropField: {
    height: scale.hp(7.2),
    borderRadius: scale.hp(1.55),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: scale.wp(3.9),
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dropFieldText: {
    color: Colors.textPrimary,
    fontSize: scale.hp(2.1),
    fontWeight: '500',
  },
  placeholderText: {
    color: "#6B7280",
  },
  fullButton: {
    marginTop: scale.hp(2.6),
  },
  rowButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: scale.hp(2.6),
  },
  halfButton: {
    width: "48%",
  },
  darkBtn: {
    height: scale.hp(6.5),
    borderRadius: scale.hp(1.55),
    backgroundColor: "#2B2B2B",
    alignItems: "center",
    justifyContent: "center",
  },
  darkBtnText: {
    color: "#fff",
    fontSize: scale.hp(2.1),
    fontWeight: "600",
  },
  infoBox: {
    backgroundColor: "#f8f9fa",
    borderRadius: scale.hp(1.55),
    padding: scale.hp(2.6),
    marginVertical: scale.hp(2.1),
  },
  infoTitle: {
    fontSize: scale.hp(2.1),
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: scale.hp(2.1),
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scale.hp(0.8),
  },
  infoLabel: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: scale.wp(2),
  },
  profileSection: {
    alignItems: "center",
    marginBottom: scale.hp(2.6),
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: scale.hp(1),
  },
  profileImage: {
    width: scale.wp(24.3),
    height: scale.wp(24.3),
    borderRadius: scale.wp(12.15),
    borderWidth: scale.hp(0.4),
    borderColor: Colors.primary,
  },
  profilePlaceholder: {
    width: scale.wp(24.3),
    height: scale.wp(24.3),
    borderRadius: scale.wp(12.15),
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: scale.hp(0.4),
    borderColor: Colors.primary,
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: scale.wp(7.8),
    height: scale.wp(7.8),
    borderRadius: scale.wp(3.9),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: scale.hp(0.25),
    borderColor: Colors.white,
  },
  profileHint: {
    fontSize: scale.hp(1.55),
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
    fontSize: scale.hp(2.3),
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
    paddingHorizontal: scale.wp(2.9),
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
  modalContent: {
    paddingBottom: scale.hp(2.6),
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scale.hp(1.55),
    paddingHorizontal: scale.wp(2),
    borderRadius: scale.hp(1),
  },
  modalItemTitle: {
    fontSize: scale.hp(2.1),
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  modalItemSubtitle: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
    marginTop: scale.hp(0.25),
  },
  modalSeparator: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
});