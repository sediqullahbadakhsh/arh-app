import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
  Animated,
  Easing,
  Dimensions,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LottieView from 'lottie-react-native';
import { Colors } from "../theme/colors";
import ServiceHeader from "../components/ServiceHeader";
import PrimaryButton from "../components/PrimaryButton";
import { codeToFlag } from "../utils/flag";
import { DIAL_CODES, guessOperator } from "../constants/dialing";
import { getCountries, makeRechargeAgent, getOrderStatus } from "../services/merchantApi";
import { getSetaraganMnoId } from "../utils/getCompanyIdForSetaragan";
import { getMnoLogo } from "../utils/getMnoLogo";
import * as Contacts from 'expo-contacts';
import { useSafeAreaInsets } from "react-native-safe-area-context";

import formatLocal from "../utils/formatLocal";
import TopUpStyles from "./topupScreen/TopupStyle";
import { useAuth } from "../auth/AuthProvider";
import { useTranslation } from "react-i18next";
import { isRTL } from "../utils/rtl";

const { height: screenHeight } = Dimensions.get('window');
const BASE_STEPS = { COUNTRY: 0, NUMBER: 1, PAY: 2 };

// Status types
const ORDER_STATUS = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  PENDING: 'pending'
};

export default function MerchantTopupFlowScreen({ navigation }) {
  const { user } = useAuth?.() || { user: null };
  const lastStep = BASE_STEPS.PAY;
  const [countries, setCountries] = useState([]);
  const [step, setStep] = useState(0);
  const [orderStatus, setOrderStatus] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [contactsModalVisible, setContactsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [country, setCountry] = useState(null);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [localNumber, setLocalNumber] = useState("");
  const [amountAfn, setAmountAfn] = useState("");
  const insets = useSafeAreaInsets();
  const pollingRef = useRef(null);
  const lottieRef = useRef(null);

  const [contactsSlideAnim] = useState(new Animated.Value(screenHeight));
  const [countriesSlideAnim] = useState(new Animated.Value(screenHeight));

  const dial = DIAL_CODES[country?.countryCode] || "";
  const operator = guessOperator(country?.countryCode, localNumber.replace(/\D/g, ""));
  const operatorId = getSetaraganMnoId(localNumber);
  const operatorLogo = getMnoLogo(operatorId);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Play Lottie animation when status changes
  useEffect(() => {
    if (lottieRef.current && (orderStatus === ORDER_STATUS.SUCCEEDED || orderStatus === ORDER_STATUS.FAILED)) {
      lottieRef.current.play();
    }
  }, [orderStatus]);

  useEffect(() => {
    const getAllCountries = async () => {
      const res = await getCountries();
      setCountries(res?.data);
      const afgCountry = res.data.find((c) => c.countryCode === "AF");
      setCountry(afgCountry);
    };

    getAllCountries();
  }, []);

  // Polling function to check order status
  const startPollingOrderStatus = async (orderId) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    let pollCount = 0;
    const maxPolls = 60; // 3 minutes maximum (60 polls * 3 seconds)

    pollingRef.current = setInterval(async () => {
      try {
        pollCount++;
        const statusResponse = await getOrderStatus(orderId);
        const currentStatus = statusResponse.data?.status;
        
        console.log(`Poll ${pollCount}: Order status:`, currentStatus);
        
        setOrderStatus(currentStatus);
        setOrderDetails(prev => ({
          ...prev,
          ...statusResponse.data
        }));

        // Stop polling if we reach a final state or max polls
        if (currentStatus === ORDER_STATUS.SUCCEEDED || 
            currentStatus === ORDER_STATUS.FAILED || 
            pollCount >= maxPolls) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          
          if (pollCount >= maxPolls) {
            setOrderStatus(ORDER_STATUS.FAILED);
            console.log("Max polling attempts reached");
          }
        }
      } catch (error) {
        console.error("Error polling order status:", error);
        // Continue polling even if there's an error, but stop after max attempts
        if (pollCount >= maxPolls) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setOrderStatus(ORDER_STATUS.FAILED);
        }
      }
    }, 3000); // Poll every 3 seconds
  };

  useEffect(() => {
    if (contactsModalVisible) {
      Animated.timing(contactsSlideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.back(1)),
        useNativeDriver: true,
      }).start();
      loadContacts();
    } else {
      Animated.timing(contactsSlideAnim, {
        toValue: screenHeight,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [contactsModalVisible]);

  useEffect(() => {
    if (countryOpen) {
      Animated.timing(countriesSlideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.back(1)),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(countriesSlideAnim, {
        toValue: screenHeight,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [countryOpen]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = contacts.filter(contact =>
        contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phoneNumbers?.some(phone =>
          phone.number?.includes(searchQuery)
        )
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchQuery, contacts]);

  const loadContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        });

        if (data.length > 0) {
          setContacts(data);
          setFilteredContacts(data);
        }
      } else {
        Alert.alert('Permission denied', 'Cannot access contacts without permission');
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    }
  };

  const defaultAf = useMemo(
    () => countries.find((c) => c.countryCode === "AF") || countries[0],
    [countries]
  );

  const filteredCountries = countrySearch
    ? countries.filter(c =>
      c.countryName.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.countryCode.toLowerCase().includes(countrySearch.toLowerCase())
    )
    : countries;

  const canNext =
    (step === BASE_STEPS.COUNTRY && !!country) ||
    (step === BASE_STEPS.NUMBER && localNumber.replace(/\D/g, "").length >= 7 && amountAfn > 0) ||
    (step === BASE_STEPS.PAY);

  const goBack = () => (step > 0 ? setStep(step - 1) : navigation.goBack());

  const goNext = () => {
    if (!canNext) return;
    setStep(step + 1);
  };

  const jumpTo = (i) => setStep(i);

  useEffect(() => {
    setLocalNumber("");
  }, [country?.countryCode]);

  const handleContactSelect = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Invalid phone number selected');
      return;
    }

    let number = phoneNumber.replace(/\D/g, "");

    const countryDialCode = country?.dialCode?.replace('+', '') || DIAL_CODES[country?.countryCode]?.replace('+', '') || '';
    if (countryDialCode && number.startsWith(countryDialCode)) {
      number = number.substring(countryDialCode.length);
    }
    number = number.replace(/^0+/, '');
    setLocalNumber(number);
    setContactsModalVisible(false);
    setSearchQuery('');
  };

  const recharge = async () => {
    setLoading(true);
    try {
      const operatorId = getSetaraganMnoId(localNumber);

      if (!operatorId) {
        Alert.alert("Invalid Number", "The number you have added is not matching with any mobile network in Afghanistan");
        setLoading(false);
        return;
      }

      // Validate amount
      const amountValue = parseFloat(amountAfn);
      if (isNaN(amountValue) || amountValue <= 0) {
        Alert.alert("Invalid Amount", "Please enter a valid amount greater than 0");
        setLoading(false);
        return;
      }

      // Check minimum amount for Setaragan
      if (amountValue < 10) {
        Alert.alert("Minimum Amount", "The minimum topup amount for Setaragan is 50 AFN");
        setLoading(false);
        return;
      }

      const payload = {
        source: "agent_stock",
        receiver: localNumber,
        operator: operatorId,
        customAmount: amountValue,
        currency: "AFN",
        countryId: country?.id,
        companyId: "", 
        productId: 1, 
      };

      console.log("Sending recharge payload:", payload);

      const res = await makeRechargeAgent(payload);
      
      if (res.status === "queued") {
        setOrderStatus(ORDER_STATUS.QUEUED);
        setOrderDetails({
          orderId: res.orderId,
          txnNumber: res.txnNumber,
          mobile: `${dial} ${formatLocal(localNumber)}`,
          amountAfn: amountAfn,
          date: new Date().toISOString(),
          operator: operator?.name || "Unknown",
        });
        
        // Start polling for status updates
        await startPollingOrderStatus(res.orderId);
        goNext();
      } else {
        throw new Error(res.error || "Failed to process recharge");
      }
      
    } catch (error) {
      console.log("Recharge error: ", error);
      const message =
        error.response?.data?.error ||
        error.response?.data?.details ||
        error.message ||
        "Failed to Recharge";
    
      Alert.alert("Failed To Recharge", message);
    }
    setLoading(false);
  };

  const getStatusMessage = () => {
    switch (orderStatus) {
      case ORDER_STATUS.QUEUED:
        return "Your topup has been queued and will be processed shortly.";
      case ORDER_STATUS.PROCESSING:
      case ORDER_STATUS.PENDING:
        return "Your topup is being processed. Please wait...";
      case ORDER_STATUS.SUCCEEDED:
        return "Topup completed successfully! The amount has been credited to the recipient's account.";
      case ORDER_STATUS.FAILED:
        return "Topup failed. The amount has been refunded to your wallet. Please try again.";
      default:
        return "Processing your request...";
    }
  };

  const getStatusIcon = () => {
    switch (orderStatus) {
      case ORDER_STATUS.QUEUED:
        return (
          <View style={[TopUpStyles.statusIcon, { backgroundColor: '#FFF3CD', borderColor: '#FFEAA7' }]}>
            <Ionicons name="time-outline" size={36} color="#FFA500" />
          </View>
        );
      case ORDER_STATUS.PROCESSING:
      case ORDER_STATUS.PENDING:
        return (
          <View style={[TopUpStyles.statusIcon, { backgroundColor: '#D1ECF1', borderColor: '#B8DAE4' }]}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        );
      case ORDER_STATUS.SUCCEEDED:
        return (
          <LottieView
            ref={lottieRef}
            source={require('../../assets/lotties/succcess.json')}
            autoPlay={true}
            loop={false}
            style={TopUpStyles.lottieAnimation}
          />
        );
      case ORDER_STATUS.FAILED:
        return (
          <LottieView
            ref={lottieRef}
            source={require('../../assets/lotties/error.json')}
            autoPlay={true}
            loop={false}
            style={TopUpStyles.lottieAnimation}
          />
        );
      default:
        return (
          <View style={[TopUpStyles.statusIcon, { backgroundColor: '#E2E3E5', borderColor: '#D6D8DB' }]}>
            <Ionicons name="help-circle" size={36} color="#6C757D" />
          </View>
        );
    }
  };

  const getStatusTitle = () => {
    switch (orderStatus) {
      case ORDER_STATUS.QUEUED:
        return "Topup Queued";
      case ORDER_STATUS.PROCESSING:
      case ORDER_STATUS.PENDING:
        return "Processing Topup";
      case ORDER_STATUS.SUCCEEDED:
        return "Topup Successful!";
      case ORDER_STATUS.FAILED:
        return "Topup Failed";
      default:
        return "Processing";
    }
  };

  const getStatusColor = () => {
    switch (orderStatus) {
      case ORDER_STATUS.QUEUED:
        return "#FFA500";
      case ORDER_STATUS.PROCESSING:
      case ORDER_STATUS.PENDING:
        return Colors.primary;
      case ORDER_STATUS.SUCCEEDED:
        return "#28A745";
      case ORDER_STATUS.FAILED:
        return "#DC3545";
      default:
        return "#6C757D";
    }
  };

  const resetFlow = () => {
    setOrderStatus(null);
    setOrderDetails(null);
    setStep(0);
    setLocalNumber("");
    setAmountAfn("");
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    if (lottieRef.current) {
      lottieRef.current.reset();
    }
  };

  const ContactsModal = () => (
    <Modal
      visible={contactsModalVisible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={() => setContactsModalVisible(false)}
    >
      <View style={TopUpStyles.modalOverlay}>
        <TouchableOpacity 
          style={TopUpStyles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setContactsModalVisible(false)}
        />
        <Animated.View 
          style={[
            TopUpStyles.modalCard,
            { 
              transform: [{ translateY: contactsSlideAnim }],
              height: '80%',
              marginBottom: -insets.bottom
            }
          ]}
        >
          <View style={TopUpStyles.modalHeader}>
            <Text style={TopUpStyles.modalTitle}>Select Contact</Text>
            <TouchableOpacity 
              onPress={() => setContactsModalVisible(false)}
              style={TopUpStyles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={TopUpStyles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={TopUpStyles.searchIcon} />
            <TextInput
              placeholder="Search contacts..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={TopUpStyles.searchInput}
              placeholderTextColor="#999"
            />
          </View>

          {filteredContacts.length > 0 ? (
            <FlatList
              data={filteredContacts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={TopUpStyles.contactItem}
                  onPress={() => {
                    if (item.phoneNumbers && item.phoneNumbers.length > 0) {
                      handleContactSelect(item.phoneNumbers[0].number);
                    }
                  }}
                >
                  <View style={TopUpStyles.contactAvatar}>
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>
                      {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                    </Text>
                  </View>
                  <View style={TopUpStyles.contactInfo}>
                    <Text style={TopUpStyles.contactName}>{item.name}</Text>
                    {item.phoneNumbers && item.phoneNumbers.length > 0 && (
                      <Text style={TopUpStyles.contactPhone}>{item.phoneNumbers[0].number}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={TopUpStyles.contactSeparator} />}
            />
          ) : (
            <View style={TopUpStyles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#999" />
              <Text style={TopUpStyles.emptyText}>No contacts found</Text>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );

  const CountriesModal = () => (
    <Modal
      visible={countryOpen}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={() => setCountryOpen(false)}
    >
      <View style={TopUpStyles.modalOverlay}>
        <TouchableOpacity 
          style={TopUpStyles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setCountryOpen(false)}
        />
        <Animated.View 
          style={[
            TopUpStyles.modalCard,
            { 
              transform: [{ translateY: countriesSlideAnim }],
              height: '80%',
              marginBottom: -insets.bottom
            }
          ]}
        >
          <View style={TopUpStyles.modalHeader}>
            <Text style={TopUpStyles.modalTitle}>Select Country</Text>
            <TouchableOpacity 
              onPress={() => setCountryOpen(false)}
              style={TopUpStyles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={TopUpStyles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={TopUpStyles.searchIcon} />
            <TextInput
              placeholder="Search countries..."
              value={countrySearch}
              onChangeText={setCountrySearch}
              style={TopUpStyles.searchInput}
              placeholderTextColor="#999"
            />
          </View>

          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={TopUpStyles.modalRow}
                onPress={() => {
                  setCountry(item);
                  setCountryOpen(false);
                  setCountrySearch('');
                }}
              >
                <Text style={{ fontSize: 24, marginRight: 12 }}>
                  {codeToFlag(item.countryCode)}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '500' }}>
                    {item.countryName}
                  </Text>
                  <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>
                    {DIAL_CODES[item.countryCode] || ""}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={TopUpStyles.contactSeparator} />}
          />
        </Animated.View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white, paddingBottom: 100, }}>
      <ServiceHeader title="Mobile Top-up" onBack={goBack} />

      {orderStatus ? (

        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ 
              flexGrow: 1,
              padding: 24, 
              alignItems: "center",
              justifyContent: 'center'
            }}
          >
            <View style={TopUpStyles.statusHeader}>
              {getStatusIcon()}
              <Text style={[TopUpStyles.statusTitle, { color: getStatusColor() }]}>
                {getStatusTitle()}
              </Text>
            </View>

            <View style={TopUpStyles.detailsCard}>
              <View style={TopUpStyles.detailRow}>
                <Text style={TopUpStyles.detailLabel}>Receiver Number</Text>
                <Text style={TopUpStyles.detailValue}>{orderDetails?.mobile}</Text>
              </View>
              {/* <View style={TopUpStyles.detailRow}>
                <Text style={TopUpStyles.detailLabel}>Operator</Text>
                <Text style={TopUpStyles.detailValue}>{orderDetails?.operator}</Text>
              </View> */}
              <View style={TopUpStyles.detailRow}>
                <Text style={TopUpStyles.detailLabel}>Transaction ID</Text>
                <Text style={TopUpStyles.detailValue}>{orderDetails?.txnNumber}</Text>
              </View>
              {/* <View style={TopUpStyles.detailRow}>
                <Text style={TopUpStyles.detailLabel}>Order ID</Text>
                <Text style={TopUpStyles.detailValue}>{orderDetails?.orderId}</Text>
              </View> */}
              <View style={TopUpStyles.detailRow}>
                <Text style={TopUpStyles.detailLabel}>Date</Text>
                <Text style={TopUpStyles.detailValue}>
                  {new Date(orderDetails?.date).toLocaleString()}
                </Text>
              </View>

              <View style={TopUpStyles.amountSection}>
                <Text style={TopUpStyles.amountLabel}>Total Amount</Text>
                <Text style={TopUpStyles.amountValue}>{orderDetails?.amountAfn} AFN</Text>
              </View>
            </View>

            <View style={TopUpStyles.statusMessageContainer}>
              <Text style={[TopUpStyles.statusMessage, { color: getStatusColor() }]}>
                {getStatusMessage()}
              </Text>
            </View>

            {(orderStatus === ORDER_STATUS.QUEUED || orderStatus === ORDER_STATUS.PROCESSING || orderStatus === ORDER_STATUS.PENDING) && (
              <View style={TopUpStyles.progressContainer}>
                <View style={TopUpStyles.progressBar}>
                  <View 
                    style={[
                      TopUpStyles.progressFill,
                      { 
                        width: orderStatus === ORDER_STATUS.QUEUED ? '30%' : 
                              (orderStatus === ORDER_STATUS.PROCESSING ? '60%' : '80%'),
                        backgroundColor: getStatusColor()
                      }
                    ]} 
                  />
                </View>
                <Text style={TopUpStyles.progressText}>
                  {orderStatus === ORDER_STATUS.QUEUED ? 'Queued' : 
                  orderStatus === ORDER_STATUS.PROCESSING ? 'Processing' : 'Finalizing...'}
                </Text>
              </View>
            )}

            {(orderStatus === ORDER_STATUS.SUCCEEDED || orderStatus === ORDER_STATUS.FAILED) && (
              <PrimaryButton
                label="Done"
                onPress={() => {
                  if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                  }
                  navigation.popToTop();
                }}
                style={{ width: "100%", marginTop: 20 }}
              />
            )}

            <TouchableOpacity onPress={resetFlow} style={TopUpStyles.moreButton}>
              <Text style={TopUpStyles.moreButtonText}>
                {orderStatus === ORDER_STATUS.FAILED ? "Try Again" : "Topup More"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      ) : (
        // Regular Flow (unchanged)
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 30 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {step === BASE_STEPS.COUNTRY && (
              <StepCountry
                country={country}
                onOpen={() => setCountryOpen(true)}
              />
            )}

            {step === BASE_STEPS.NUMBER && (
              <View style={{ marginTop: 12 }}>
                <StepNumber
                  dial={dial}
                  country={country}
                  value={localNumber}
                  onChange={setLocalNumber}
                  localNumber={localNumber}
                  operator={operator}
                  operatorLogo={operatorLogo}
                  onEditCountry={() => jumpTo(BASE_STEPS.COUNTRY)}
                  openContacts={() => setContactsModalVisible(true)}
                />

                <Text style={TopUpStyles.sectionTitle}>Amount</Text>
                <AmountInput
                  value={amountAfn}
                  onChangeText={setAmountAfn}
                />
              </View>
            )}

            {step === BASE_STEPS.PAY && (
              <StepPay
                summary={{
                  mobile: `${dial} ${formatLocal(localNumber)}`,
                  amount: amountAfn,
                  operator: operator?.name || "Unknown"
                }}
                onEditNumber={() => jumpTo(BASE_STEPS.NUMBER)}
              />
            )}

            <PrimaryButton
              label={step === lastStep ? "Send Top-up" : "Continue"}
              onPress={step === lastStep ? recharge : goNext}
              style={{ marginTop: 24, opacity: canNext ? 1 : 0.5 }}
              loading={loading}
              disabled={!canNext || loading}
            />
            {step > 0 && (
              <PrimaryButton
                label="Back"
                onPress={goBack}
                style={{ marginTop: 12, backgroundColor: "#4A4A4A" }}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <ContactsModal />
      <CountriesModal />
    </SafeAreaView>
  );
}

/* ---------- Step Components ---------- */

function StepCountry({ country, onOpen }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={{ marginTop: 16 }}>
      <Text style={TopUpStyles.sectionTitle}>Select country you want to send</Text>
      <TouchableOpacity
        style={[
          TopUpStyles.dropField,
          {
            borderColor: isFocused ? Colors.primary : '#E4E7EC',
            backgroundColor: '#FFFFFF',
            shadowColor: Colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isFocused ? 0.15 : 0,
            shadowRadius: isFocused ? 10 : 0,
            elevation: isFocused ? 3 : 0,
          }
        ]}
        onPress={onOpen}
        activeOpacity={0.85}
        onPressIn={() => setIsFocused(true)}
        onPressOut={() => setIsFocused(false)}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <Text style={{ fontSize: 24, marginRight: 12 }}>
            {codeToFlag(country?.countryCode)}
          </Text>
          <View>
            <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '500', fontFamily: 'dmsansRegular' }}>
              {country?.countryName}
            </Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 14, fontFamily: 'dmsansRegular' }}>
              {DIAL_CODES[country?.countryCode] || ""}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-down" size={20} color="#7A7A7A" />
      </TouchableOpacity>
    </View>
  );
}

const OPERATOR_LOGOS = {

  'AWCC': require('../../assets/mnos/awcc.png'),
  'Roshan': require('../../assets/mnos/roshan.png'),
  'MTN': require('../../assets/mnos/mtn.png'),
  'Salaam': require('../../assets/mnos/salaam.png'),
  'Etisalat': require('../../assets/mnos/etisalat.png'),
  'default': require('../../assets/mnos/awcc.png'),
};
const getOperatorLogo = (operatorName) => {
  if (!operatorName) return OPERATOR_LOGOS.default;
  
  const normalizedName = operatorName.toLowerCase();
  
  if (normalizedName.includes('awcc')) return OPERATOR_LOGOS.AWCC;
  if (normalizedName.includes('roshan')) return OPERATOR_LOGOS.Roshan;
  if (normalizedName.includes('mtn')) return OPERATOR_LOGOS.MTN;
  if (normalizedName.includes('salaam')) return OPERATOR_LOGOS.Salaam;
  if (normalizedName.includes('etisalat')) return OPERATOR_LOGOS.Etisalat;
  
  return OPERATOR_LOGOS.default;
};

const VALID_PREFIXES = ['71', '72', '73', '74', '76', '77', '78', '79'];
const validateMobileNumber = (number) => {
  const cleanNumber = number.replace(/\D/g, "");
  

  if (cleanNumber.length > 0 && !cleanNumber.startsWith('7')) {
    return {
      isValid: false,
      message: "mobileNumberStartWith7"
    };
  }

  if (cleanNumber.startsWith('75')) {
    return {
      isValid: false,
      message: "invalidPrefix75"
    };
  }
  

  if (cleanNumber.length >= 2) {
    const prefix = cleanNumber.substring(0, 2);
    if (!VALID_PREFIXES.includes(prefix)) {
      return {
        isValid: false,
        message: `invalidPrefix ${prefix}`
      };
    }
  }
  
  return {
    isValid: true,
    message: ""
  };
};
function StepNumber({
  dial,
  country,
  value,
  onChange,
  localNumber,
  operator,
  onEditCountry,
  openContacts,
}) {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState("");
  const formatted = formatLocal(value);

  const handleNumberChange = (input) => {

    const numericInput = input.replace(/\D/g, "");
    

    const limitedInput = numericInput.slice(0, 9);
    
  
    const validation = validateMobileNumber(limitedInput);
    
    if (!validation.isValid && limitedInput.length > 0) {
      const errorMessage = t(validation.message);
      setValidationError(errorMessage);
      
 
      if (limitedInput.startsWith('75') || !limitedInput.startsWith('7')) {
        return;
      }
    } else {
      setValidationError("");
    }
    

    onChange(limitedInput);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setValidationError("");
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    if (value.length > 0) {
      const validation = validateMobileNumber(value);
      if (!validation.isValid) {
        const errorMessage = t(validation.message);
        setValidationError(errorMessage);
      }
    }
  };

  return (
    <View style={{ marginTop: 12 }}>
      <View style={TopUpStyles.editHeader}>
        <Text style={TopUpStyles.sectionTitle}>{t('mobileNumber')}</Text>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <TouchableOpacity onPress={openContacts}>
            <Text style={TopUpStyles.editLink}>{t('contacts')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[
        TopUpStyles.phoneRow,
        {
          borderColor: validationError ? '#EF4444' : (isFocused ? Colors.primary : '#E4E7EC'),
          backgroundColor: '#FFFFFF',
          shadowColor: validationError ? '#EF4444' : Colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isFocused ? 0.15 : 0,
          shadowRadius: isFocused ? 10 : 0,
          elevation: isFocused ? 3 : 0,
          transform: [{ scale: isFocused ? 1.005 : 1 }]
        }
      ]}>
        <View style={TopUpStyles.phonePrefix}>
          {operator ? (
            <Image 
              source={getOperatorLogo(operator.name)}
              style={{
                width: 24,
                height: 24,
                marginRight: 8,
                borderRadius: 4,
              }}
              resizeMode="contain"
            />
          ) : (
            <View style={{
              width: 24,
              height: 24,
              marginRight: 8,
              borderRadius: 4,
              backgroundColor: '#E5E7EB',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Ionicons name="cellular-outline" size={16} color="#6B7280" />
            </View>
          )}
          <Text style={{ fontWeight: "700", color: Colors.textPrimary, fontFamily: 'dmsansRegular' }}>
            {dial}
          </Text>
        </View>
        <TextInput
          value={formatted}
          onChangeText={handleNumberChange}
          keyboardType="number-pad"
          placeholder="700-000-000"
          placeholderTextColor="#9E9E9E"
          style={[
            TopUpStyles.phoneInput,
            validationError && { color: '#EF4444' }
          ]}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        <TouchableOpacity
          onPress={openContacts}
          style={{ paddingHorizontal: 12, justifyContent: "center" }}
        >
          <Ionicons name="person-circle-outline" size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {validationError ? (
        <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="warning-outline" size={16} color="#EF4444" />
          <Text style={{ 
            color: '#EF4444', 
            fontSize: 12, 
            fontFamily: 'dmsansRegular',
            marginLeft: 4
          }}>
            {validationError}
          </Text>
        </View>
      ) : (
        <View style={{ marginTop: 10, minHeight: 24 }}>
        </View>
      )}
    </View>
  );
}

function AmountInput({ value, onChangeText }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[
      TopUpStyles.customRow,
      {
        borderColor: isFocused ? Colors.primary : '#2e2e2eff',
        backgroundColor: '#FFFFFF',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isFocused ? 0.15 : 0,
        shadowRadius: isFocused ? 10 : 0,
        elevation: isFocused ? 3 : 0,
      }
    ]}>
      <Text style={TopUpStyles.currencyTag}>AFN</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="0"
        keyboardType="decimal-pad"
        style={TopUpStyles.customInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {value && (
        <TouchableOpacity
          style={[TopUpStyles.clearBtn, { opacity: value ? 1 : 0.5 }]}
          disabled={!value}
          onPress={() => onChangeText("")}
        >
          <Ionicons name="close-circle" size={18} color="#A3A3A3" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function StepPay({
  summary,
  onEditNumber,
}) {
  return (
    <View style={{ marginTop: 12 }}>
      <View style={TopUpStyles.editHeader}>
        <Text style={TopUpStyles.sectionTitle}>Confirm Top-up</Text>
        <TouchableOpacity onPress={onEditNumber}>
          <Text style={TopUpStyles.editLink}>Change number</Text>
        </TouchableOpacity>
      </View>

      <View style={TopUpStyles.summaryCard}>
        <View style={TopUpStyles.summaryRow}>
          <Text style={TopUpStyles.summaryKey}>Mobile Number</Text>
          <Text style={TopUpStyles.summaryValue}>{summary.mobile}</Text>
        </View>
        <View style={TopUpStyles.summaryRow}>
          <Text style={TopUpStyles.summaryKey}>Operator</Text>
          <Text style={TopUpStyles.summaryValue}>{summary.operator}</Text>
        </View>
        <View style={TopUpStyles.summaryRow}>
          <Text style={TopUpStyles.summaryKey}>Amount</Text>
          <Text style={TopUpStyles.summaryValue}>{summary.amount} AFN</Text>
        </View>
        <View
          style={[
            TopUpStyles.summaryRow,
            {
              borderTopWidth: 1,
              borderTopColor: "#F2F2F2",
              paddingTop: 8,
              marginTop: 6,
            },
          ]}
        >
          <Text style={[TopUpStyles.summaryKey, { fontWeight: "700" }]}>
            Total Amount
          </Text>
          <Text
            style={[
              TopUpStyles.summaryValue,
              { color: Colors.primary, fontWeight: "700" },
            ]}
          >
            {summary.amount} AFN
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ---------- utils ---------- */

function hexFade(hex, op) {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${op})`;
}