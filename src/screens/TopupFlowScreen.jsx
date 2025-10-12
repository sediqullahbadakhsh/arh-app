// src/screens/MerchantTopupFlowScreen.jsx
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import ServiceHeader from "../components/ServiceHeader";
import PrimaryButton from "../components/PrimaryButton";
import { codeToFlag } from "../utils/flag";
import { DIAL_CODES, guessOperator } from "../constants/dialing";
import { getCountries, makeRechargeAgent } from "../services/merchantApi";
import { getSetaraganMnoId } from "../utils/getCompanyIdForSetaragan";
import { getMnoLogo } from "../utils/getMnoLogo";
import * as Contacts from 'expo-contacts';
import { useSafeAreaInsets } from "react-native-safe-area-context";

import formatLocal from "../utils/formatLocal";
import TopUpStyles from "./topupScreen/TopupStyle";
import { useAuth } from "../auth/AuthProvider";

const { height: screenHeight } = Dimensions.get('window');
const BASE_STEPS = { COUNTRY: 0, NUMBER: 1, PAY: 2 };

export default function MerchantTopupFlowScreen({ navigation }) {
  const { user } = useAuth?.() || { user: null };
  const lastStep = BASE_STEPS.PAY;
  const [countries, setCountries] = useState([]);
  const [step, setStep] = useState(0);
  const [success, setSuccess] = useState(null);
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

  const [contactsSlideAnim] = useState(new Animated.Value(screenHeight));
  const [countriesSlideAnim] = useState(new Animated.Value(screenHeight));

  const dial = DIAL_CODES[country?.countryCode] || "";
  const operator = guessOperator(country?.countryCode, localNumber.replace(/\D/g, ""));
  const operatorId = getSetaraganMnoId(localNumber);
  const operatorLogo = getMnoLogo(operatorId);

  useEffect(() => {
    const getAllCountries = async () => {
      const res = await getCountries();
      setCountries(res?.data);
      const afgCountry = res.data.find((c) => c.countryCode === "AF");
      setCountry(afgCountry);
    };

    getAllCountries();
  }, []);

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
      
      const payload = {
        amount: amountAfn,
        companyId: "",
        countryId: country?.id,
        currency: "AFN",
        operator: operatorId,
        productId: 2,
        receiver: localNumber,
        source: "agent_stock"
      };

      const res = await makeRechargeAgent(payload);
      setSuccess({
        mobile: `${dial} ${formatLocal(localNumber)}`,
        amountAfn: amountAfn,
        txId: res?.txnNumber,
        date: new Date().toISOString(),
      });
      goNext();
      
    } catch (error) {
      console.log("Recharge error: ", error);
      const message =
        error.response?.data?.error ||
        error.message ||
        "Failed to Recharge";
    
      Alert.alert("Failed To Recharge", message);
    }
    setLoading(false);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader title="Mobile Top-up" onBack={goBack} />

      {success ? (
        <ScrollView
          contentContainerStyle={{ padding: 24, alignItems: "center" }}
        >
          <View style={TopUpStyles.successCircle}>
            <Ionicons name="checkmark" size={56} color="#4CAF50" />
          </View>
          <Text style={TopUpStyles.successTitle}>Topup Successful!</Text>

          <View style={TopUpStyles.kv}>
            <Text style={TopUpStyles.k}>Receiver Number</Text>
            <Text style={TopUpStyles.v}>{success.mobile}</Text>
          </View>
          <View style={TopUpStyles.kv}>
            <Text style={TopUpStyles.k}>Transaction ID</Text>
            <Text style={TopUpStyles.v}>{success.txId}</Text>
          </View>
          <View style={TopUpStyles.kv}>
            <Text style={TopUpStyles.k}>Date</Text>
            <Text style={TopUpStyles.v}>
              {new Date(success.date).toLocaleString()}
            </Text>
          </View>

          <View style={TopUpStyles.totalBox}>
            <Text style={TopUpStyles.totalLabel}>Total Amount</Text>
            <Text style={TopUpStyles.totalValue}>{success.amountAfn} AFN</Text>
          </View>

          <PrimaryButton
            label="Done"
            onPress={() => {
              navigation.popToTop();
            }}
            style={{ width: "100%" }}
          />
          <TouchableOpacity
            onPress={() => {
              setSuccess(null);
              setStep(0);
              setLocalNumber("");
              setAmountAfn("");
            }}
          >
            <Text
              style={{
                color: Colors.primary,
                marginTop: 14,
                fontWeight: "600",
              }}
            >
              Topup More
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
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
                }}
                onEditNumber={() => jumpTo(BASE_STEPS.NUMBER)}
              />
            )}

            <PrimaryButton
              label={step === lastStep ? "Send Top-up" : "Continue"}
              onPress={step === lastStep ? recharge : goNext}
              style={{ marginTop: 24, opacity: canNext ? 1 : 0.5 }}
              loading={loading}
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

function StepNumber({
  dial,
  country,
  value,
  onChange,
  localNumber,
  operator,
  operatorLogo,
  onEditCountry,
  openContacts,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const formatted = formatLocal(value);

  return (
    <View style={{ marginTop: 12 }}>
      <View style={TopUpStyles.editHeader}>
        <Text style={TopUpStyles.sectionTitle}>Mobile Number</Text>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <TouchableOpacity onPress={openContacts}>
            <Text style={TopUpStyles.editLink}>Contacts</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onEditCountry}>
            <Text style={TopUpStyles.editLink}>Change country</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[
        TopUpStyles.phoneRow,
        {
          borderColor: isFocused ? Colors.primary : '#E4E7EC',
          backgroundColor: '#FFFFFF',
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isFocused ? 0.15 : 0,
          shadowRadius: isFocused ? 10 : 0,
          elevation: isFocused ? 3 : 0,
          transform: [{ scale: isFocused ? 1.005 : 1 }]
        }
      ]}>
        <View style={TopUpStyles.phonePrefix}>
          <Text style={{ fontSize: 20, marginRight: 8 }}>
            {codeToFlag(country?.countryCode)}
          </Text>
          <Text style={{ fontWeight: "700", color: Colors.textPrimary, fontFamily: 'dmsansRegular' }}>
            {dial}
          </Text>
        </View>
        <TextInput
          value={formatted}
          onChangeText={(t) => {
            const trimmed = t.trim()
            if(t.startsWith("0") && trimmed.length == 0){
              Alert.alert(
                "Invalid Number",
                "Please start your phone number with 7 instead of 0, as the 0 is already included in your country code."
              );
              const numeric = trimmed.replace(/^0+/, "");
              onChange(numeric)
              return 
            }
            onChange(t.replace(/\D/g, "").slice(0, 9))
          }}
          keyboardType="number-pad"
          placeholder="700-000-000"
          placeholderTextColor="#9E9E9E"
          style={TopUpStyles.phoneInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        
        {/* Operator Image */}
        {localNumber.length > 1 && operatorLogo && (
          <View style={{ width: 40, height: 40, paddingHorizontal: 8, justifyContent: "center", alignItems: "center" }}>
            <Image 
              source={operatorLogo} 
              style={{ width: "100%", height: "100%", resizeMode: "contain", borderRadius: 8 }} 
            />
          </View>
        )}
        
        <TouchableOpacity
          onPress={openContacts}
          style={{ paddingHorizontal: 12, justifyContent: "center" }}
        >
          <Ionicons name="person-circle-outline" size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 10, minHeight: 24 }}>
        {operator ? (
          <View
            style={[
              TopUpStyles.operatorPill,
              {
                backgroundColor: hexFade(operator.color, 0.14),
                borderColor: operator.color,
              },
            ]}
          >
            <Ionicons
              name="radio-outline"
              size={14}
              color={operator.color}
              style={{ marginRight: 6 }}
            />
            <Text
              style={{ color: operator.color, fontWeight: "600", fontSize: 12, fontFamily: 'dmsansRegular' }}
            >
              {operator.name}
            </Text>
          </View>
        ) : (
          value.length > 0 && (
            <Text style={{ color: "#9E9E9E", fontSize: 12, fontFamily: 'dmsansRegular' }}>
              We'll detect the operator automatically
            </Text>
          )
        )}
      </View>
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