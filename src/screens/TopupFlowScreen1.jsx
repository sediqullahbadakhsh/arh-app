import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import ServiceHeader from "../components/ServiceHeader";
import PrimaryButton from "../components/PrimaryButton";
import DotIndicators from "../components/DotIndicators";
import { COUNTRIES } from "../constants/countries";
import { TOPUP_PRODUCTS } from "../constants/products";
import { codeToFlag } from "../utils/flag";
import { DIAL_CODES, guessOperator } from "../constants/dialing";
import { useAuth } from "../auth/AuthProvider";
import { getCountries, makeRecharge, getCurrencies, getSlabs } from "../services/customerAPIOrder";
import { getSetaraganMnoId } from "../utils/getCompanyIdForSetaragan";
import * as Contacts from 'expo-contacts';

import { useStripe, CardField } from '@stripe/stripe-react-native';

const BASE_STEPS = { COUNTRY: 0, NUMBER: 1, AMOUNT: 2, PAY: 3 };

export default function TopupFlowScreen({ navigation }) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { user } = useAuth?.() || { user: null };
  const stepsCount = 4;
  const lastStep = BASE_STEPS.PAY;
  const [countries, setCountries] = useState([])
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
 
  const [exchangeRate, setExchangeRate] = useState(null);
  const [slabPercentage, setSlabPercentage] = useState(0);
  const [loadingData, setLoadingData] = useState(false);
  const [serviceType, setServiceType] = useState('recharge'); // 'recharge' or 'bundle'
  
  // New states for animation
  const [showPopularAmounts, setShowPopularAmounts] = useState(true);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const continueButtonAnim = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    const getAllCountries = async()=>{
      const res = await getCountries()
      setCountries(res?.data)
      const afgCountry = res.data.find((c)=> c.countryCode === "AF" )
      setCountry(afgCountry)
    }

    getAllCountries()
  },[])

  useEffect(() => {
    if (contactsModalVisible) {
      loadContacts();
    }
  }, [contactsModalVisible]);

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

  useEffect(() => {
    // Show/hide popular amounts based on custom input
    if (customAfn && customAfn.length > 0) {
      setShowPopularAmounts(false);
      if (!showContinueButton) {
        setShowContinueButton(true);
        Animated.timing(continueButtonAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      }
    } else {
      setShowPopularAmounts(true);
      if (showContinueButton) {
        Animated.timing(continueButtonAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start(() => setShowContinueButton(false));
      }
    }
  }, [customAfn]);
  
  useEffect(() => {
    const fetchRateAndSlab = async () => {
      if (!country) return;

      setLoadingData(true);
      try {
        const rateData = await getCurrencies();
        console.log("Rate API Response:", JSON.stringify(rateData, null, 2));
        
        if (rateData && rateData.success && rateData.data && rateData.data.length > 0) {
          const usdToAfnRate = parseFloat(rateData.data[0].target_amount);
          console.log("USD to AFN Rate:", usdToAfnRate);
          console.log("Exchange Rate (1/rate):", 1 / usdToAfnRate);
          setExchangeRate(1 / usdToAfnRate);
        } else {
          console.log("Using fallback exchange rate: 0.012");
          setExchangeRate(0.012); 
        }

        const slabData = await getSlabs();
        console.log("Slab API Response:", JSON.stringify(slabData, null, 2));
        
        if (slabData && slabData.success && slabData.data && slabData.data.length > 0) {
    
          const countrySlabs = slabData.data.filter(slab => slab.countryId === country.id);
          console.log("All country slabs:", countrySlabs);
          
   
          const totalPercentage = countrySlabs.reduce((sum, slab) => {
            return sum + parseFloat(slab.percentage || 0);
          }, 0);
          
          console.log("Total slab percentage for country:", totalPercentage + "%");
          
          setSlabPercentage(totalPercentage);
        } else {
          console.log("No slab data, setting to 0");
          setSlabPercentage(0);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setExchangeRate(0.012);
        setSlabPercentage(0);
      } finally {
        setLoadingData(false);
      }
    };
    
   if (country) {
      const timer = setTimeout(() => {
        fetchRateAndSlab();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [country]);

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
    []
  );

  const filteredCountries = countrySearch 
    ? countries.filter(c => 
        c.countryName.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.countryCode.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : countries;

 
  const [localNumber, setLocalNumber] = useState("");
  const dial = DIAL_CODES[country?.countryCode] || "";
  const operator = guessOperator(country?.countryCode, localNumber.replace(/\D/g, ""));

  const [product, setProduct] = useState(null);
  const [customAfn, setCustomAfn] = useState(""); 

  const calculateUsdAmount = (afnAmount) => {
    if (!exchangeRate || !afnAmount) {
      console.log("calculateUsdAmount - missing values:", { exchangeRate, afnAmount });
      return 0;
    }
    
    const baseAmount = parseFloat(afnAmount) * exchangeRate;
    const feeAmount = baseAmount * (slabPercentage / 100);
    const totalAmount = baseAmount + feeAmount;
    
    console.log("USD Calculation:", {
      afnAmount,
      exchangeRate,
      slabPercentage,
      baseAmount,
      feeAmount,
      totalAmount
    });
    
    return totalAmount.toFixed(2);
  };
  
  const calculateFeeAmount = (afnAmount) => {
    if (!exchangeRate || !afnAmount) return 0;
    
    const baseAmount = parseFloat(afnAmount) * exchangeRate;
    const feeAmount = baseAmount * (slabPercentage / 100);
    
    return feeAmount.toFixed(2);
  };

  const calculateBaseAmount = (afnAmount) => {
    if (!exchangeRate || !afnAmount) return 0;
    
    const baseAmount = parseFloat(afnAmount) * exchangeRate;
    return baseAmount.toFixed(2);
  };

  const afn = (product && typeof product.afn === "number" ? product.afn : null) ?? (customAfn ? Number(customAfn) : 0);
  const usd = calculateUsdAmount(afn);

  const [cardDetailsComplete, setCardDetailsComplete] = useState(false);

  const canNext =
    (step === BASE_STEPS.COUNTRY && !!country) ||
    (step === BASE_STEPS.NUMBER && localNumber.replace(/\D/g, "").length >= 7) ||
    (step === BASE_STEPS.AMOUNT && serviceType === 'recharge' && afn > 0) || 
    (step === BASE_STEPS.AMOUNT && serviceType === 'bundle') || // Allow proceeding to payment for bundle (will show error)
    (step === BASE_STEPS.PAY && cardDetailsComplete);

  const goBack = () => (step > 0 ? setStep(step - 1) : navigation.goBack());

  const goNext = () => {
    if (!canNext) return;
    

    if (step === BASE_STEPS.AMOUNT && serviceType === 'bundle') {
      Alert.alert("Coming Soon", "Bundle packages will be available soon!");
      return;
    }
    
    setStep(step + 1);
  };

  const jumpTo = (i) => setStep(i);

  useEffect(() => {
    setLocalNumber("");
  }, [country?.countryCode]);

  const handleSelectPopularAmount = (amount) => {
    setCustomAfn(String(amount.afn));
    setProduct(null);
    
    // Auto-proceed after a short delay
    setTimeout(() => {
      if (canNext) {
        goNext();
      }
    }, 300);
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const operatorId = getSetaraganMnoId(localNumber);
      
      if (!operatorId) {
        Alert.alert("Invalid Number", "The number you have added is not matching with any mobile network in Afghanistan");
        setLoading(false);
        return;
      }
      
      const payload = {
        amount: afn,
        companyId: "",
        countryId: country?.id,
        currency: "AFN",
        operator: operatorId,
        productId: 2,
        receiver: localNumber,
        source: "stripe_card",
        cardCurrency: "USD",
        cardAmount: usd,
        confirmNow: true,
        paymentMethodId: "pm_card_visa" 
      };

      const res = await makeRecharge(payload);
      
      if (res.status === "requires_action" && res.nextAction) {
        const { error, paymentIntent } = await confirmPayment(res.nextAction.clientSecret);
        
        if (error) {
          Alert.alert("Payment Failed", error.message);
          setLoading(false);
          return;
        }
        
        if (paymentIntent.status === "Succeeded") {
          setSuccess({
            mobile: `${dial} ${formatLocal(localNumber)}`,
            amountUsd: usd,
            amountAfn: afn,
            txId: res?.txnNumber,
            date: new Date().toISOString(),
          });
          goNext();
        }
      } else if (res.status === "processing" || res.status === "succeeded") {
        setSuccess({
          mobile: `${dial} ${formatLocal(localNumber)}`,
          amountUsd: usd,
          amountAfn: afn,
          txId: res?.txnNumber,
          date: new Date().toISOString(),
        });
        goNext();
      } else {
        Alert.alert("Payment Error", `Payment status: ${res.status}`);
      }
    } catch (error) {
      console.log("Payment error: ", error);
      const message = error.response?.data?.error || error.message || "Failed to process payment";
      Alert.alert("Payment Error", message);
    }
    setLoading(false);
  };

  const recharge = async () => {
    await handlePayment();
  };

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader title="Mobile Top-up" onBack={goBack} />

      {success ? (
        <ScrollView
          contentContainerStyle={{ padding: 24, alignItems: "center" }}
        >
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={56} color="#4CAF50" />
          </View>
          <Text style={styles.successTitle}>Topup Successful!</Text>

          <View style={styles.kv}>
            <Text style={styles.k}>Receiver Number</Text>
            <Text style={styles.v}>{success.mobile}</Text>
          </View>
          <View style={styles.kv}>
            <Text style={styles.k}>Transaction ID</Text>
            <Text style={styles.v}>{success.txId}</Text>
          </View>
          <View style={styles.kv}>
            <Text style={styles.k}>Date</Text>
            <Text style={styles.v}>
              {new Date(success.date).toLocaleString()}
            </Text>
          </View>

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{success.amountAfn} AFN</Text>
            <Text style={[styles.totalValue, {fontSize: 16}]}>${success.amountUsd} USD</Text>
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
              setProduct(null);
              setCustomAfn("");
              setLocalNumber("");
              setCardDetailsComplete(false);
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
              <StepNumber
                dial={dial}
                country={country}
                value={localNumber}
                onChange={setLocalNumber}
                localNumber={localNumber}
                operator={operator}
                onEditCountry={() => jumpTo(BASE_STEPS.COUNTRY)}
                openContacts={() => setContactsModalVisible(true)}
              />
            )}

            {step === BASE_STEPS.AMOUNT && (
              <StepAmount
                product={product}
                setProduct={setProduct}
                customAfn={customAfn}
                setCustomAfn={(v) => {
                  setCustomAfn(v);
                  if (product && !product.custom) setProduct(null);
                }}
                usd={usd}
                afn={afn}
                onEditNumber={() => jumpTo(BASE_STEPS.NUMBER)}
                exchangeRate={exchangeRate}
                slabPercentage={slabPercentage}
                calculateBaseAmount={calculateBaseAmount}
                calculateFeeAmount={calculateFeeAmount}
                loadingData={loadingData}
                serviceType={serviceType}
                setServiceType={setServiceType}
                showPopularAmounts={showPopularAmounts}
                onSelectPopularAmount={handleSelectPopularAmount}
                showContinueButton={showContinueButton}
                continueButtonAnim={continueButtonAnim}
                onContinue={goNext}
                canContinue={canNext}
              />
            )}

            {step === BASE_STEPS.PAY && (
              <StepPay
                summary={{
                  mobile: `${dial} ${formatLocal(localNumber)}`,
                  usd,
                  afn,
                  exchangeRate,
                  slabPercentage,
                  calculateBaseAmount: () => calculateBaseAmount(afn),
                  calculateFeeAmount: () => calculateFeeAmount(afn),
                }}
                onEditAmount={() => jumpTo(BASE_STEPS.AMOUNT)}
                onCardDetailsChange={(complete) => setCardDetailsComplete(complete)}
              />
            )}

           {step !== BASE_STEPS.AMOUNT && (
  <>
    <PrimaryButton
      label={
        step === lastStep
          ? `Pay $${usd} USD`
          : "Continue"
      }
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
  </>
)}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Country Selection Modal */}
      <Modal visible={countryOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setCountryOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                placeholder="Search countries..."
                value={countrySearch}
                onChangeText={setCountrySearch}
                style={styles.searchInput}
                placeholderTextColor="#999"
              />
            </View>

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalRow}
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
              ItemSeparatorComponent={() => <View style={styles.contactSeparator} />}
            />
          </View>
        </View>
      </Modal>

      {/* Contacts Modal */}
      <Modal visible={contactsModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Contact</Text>
              <TouchableOpacity onPress={() => setContactsModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                placeholder="Search contacts..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                placeholderTextColor="#999"
              />
            </View>

            {filteredContacts.length > 0 ? (
              <FlatList
                data={filteredContacts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.contactItem}
                    onPress={() => {
                      if (item.phoneNumbers && item.phoneNumbers.length > 0) {
                        handleContactSelect(item.phoneNumbers[0].number);
                      }
                    }}
                  >
                    <View style={styles.contactAvatar}>
                      <Text style={{ color: 'white', fontWeight: 'bold' }}>
                        {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                      </Text>
                    </View>
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{item.name}</Text>
                      {item.phoneNumbers && item.phoneNumbers.length > 0 && (
                        <Text style={styles.contactPhone}>{item.phoneNumbers[0].number}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.contactSeparator} />}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="#999" />
                <Text style={styles.emptyText}>No contacts found</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StepCountry({ country, onOpen }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={{ marginTop: 16 }}>
      <Text style={styles.sectionTitle}>Select country you want to send</Text>
      <TouchableOpacity
        style={[
          styles.dropField,
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
  onEditCountry,
  openContacts,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const formatted = formatLocal(value);

  return (
    <View style={{ marginTop: 12 }}>
      <View style={styles.editHeader}>
        <Text style={styles.sectionTitle}>Mobile Number</Text>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <TouchableOpacity onPress={openContacts}>
            <Text style={styles.editLink}>Contacts</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[
        styles.phoneRow,
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
        <View style={styles.phonePrefix}>
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
          style={styles.phoneInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
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
              styles.operatorPill,
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

function StepAmount({
  product,
  setProduct,
  customAfn,
  setCustomAfn,
  usd,
  afn,
  onEditNumber,
  exchangeRate,
  slabPercentage,
  calculateBaseAmount,
  calculateFeeAmount,
  loadingData,
  serviceType,
  setServiceType,
  showPopularAmounts,
  onSelectPopularAmount,
  showContinueButton,
  continueButtonAnim,
  onContinue,
  canContinue,
}) {
  const [isFocused, setIsFocused] = useState(false);
  
  const rechargeAmounts = [
    { afn: 50, usd: calculateUsdAmount(50, exchangeRate, slabPercentage) },
    { afn: 100, usd: calculateUsdAmount(100, exchangeRate, slabPercentage) },
    { afn: 150, usd: calculateUsdAmount(150, exchangeRate, slabPercentage) },
    { afn: 250, usd: calculateUsdAmount(250, exchangeRate, slabPercentage) },
    { afn: 500, usd: calculateUsdAmount(500, exchangeRate, slabPercentage) },
    { afn: 1000, usd: calculateUsdAmount(1000, exchangeRate, slabPercentage) },
  ];

  return (
    <View style={{ marginTop: 12 }}>
      <View style={styles.serviceTypeToggle}>
        <TouchableOpacity
          style={[
            styles.toggleOption,
            serviceType === 'recharge' && styles.toggleOptionActive
          ]}
          onPress={() => setServiceType('recharge')}
        >
          <Text style={[
            styles.toggleText,
            serviceType === 'recharge' && styles.toggleTextActive
          ]}>
            Recharge
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleOption,
            serviceType === 'bundle' && styles.toggleOptionActive
          ]}
          onPress={() => setServiceType('bundle')}
        >
          <Text style={[
            styles.toggleText,
            serviceType === 'bundle' && styles.toggleTextActive
          ]}>
            Bundle
          </Text>
        </TouchableOpacity>
      </View>

      {serviceType === 'recharge' ? (
        <>
          <Text style={styles.sectionTitle}>Enter Amount</Text>
          

          {/* <Text style={styles.smallLabel}>Or enter custom amount (AFN)</Text> */}
          <View style={[
            styles.customRow,
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
            <Text style={styles.currencyTag}>AFN</Text>
            <TextInput
              value={customAfn}
              onChangeText={setCustomAfn}
              placeholder="0"
              keyboardType="decimal-pad"
              style={styles.customInput}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            
            {customAfn && !loadingData && (
              <View style={styles.usdEquivalentContainer}>
                <Text style={styles.usdEquivalentText}>
                  ≈ ${usd} USD
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              style={[styles.clearBtn, { opacity: customAfn ? 1 : 0.5 }]}
              disabled={!customAfn}
              onPress={() => {
                setCustomAfn("");
                setProduct(null);
              }}
            >
              <Ionicons name="close-circle" size={18} color="#A3A3A3" />
            </TouchableOpacity>
          </View>
          
          {/* {loadingData && (
            <Text style={styles.equivText}>Calculating USD equivalent...</Text>
          )} */}

          {/* Popular amounts with conditional rendering */}
          {showPopularAmounts && (
            <View style={styles.quickAmountsContainer}>
              <Text style={styles.quickAmountsTitle}>Popular amounts</Text>
              <View style={styles.quickAmountsList}>
                {rechargeAmounts.map((amount) => {
                  const isSelected = afn === amount.afn;
                  
                  return (
                    <TouchableOpacity
                      key={amount.afn}
                      style={[
                        styles.quickAmountItem,
                        isSelected && styles.quickAmountItemSelected
                      ]}
                      onPress={() => onSelectPopularAmount(amount)}
                    >
                      <View style={styles.amountInfo}>
                        <Text style={[
                          styles.amountValue,
                          isSelected && styles.amountValueSelected
                        ]}>
                          {amount.afn} AFN
                        </Text>
                        <Text style={[
                          styles.amountSubtext,
                          isSelected && styles.amountSubtextSelected
                        ]}>
                          ${amount.usd} USD
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

       
       {showContinueButton && (
  <Animated.View 
    style={{
      opacity: continueButtonAnim,
      transform: [{
        translateY: continueButtonAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0]
        })
      }]
    }}
  >
    <PrimaryButton
      label="Continue"
      onPress={onContinue}
      style={{ 
        marginTop: 24, 
        opacity: canContinue ? 1 : 0.5 
      }}
    />
  </Animated.View>
)}

          {!loadingData && afn > 0 && (
            <View style={styles.breakdownContainer}>
              <Text style={styles.breakdownTitle}>Cost Breakdown:</Text>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Base Amount:</Text>
                <Text style={styles.breakdownValue}>${calculateBaseAmount(afn)} USD</Text>
              </View>
              {slabPercentage > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Fee ({slabPercentage}%):</Text>
                  <Text style={styles.breakdownValue}>${calculateFeeAmount(afn)} USD</Text>
                </View>
              )}
              <View style={[styles.breakdownRow, styles.breakdownTotal]}>
                <Text style={styles.breakdownLabel}>Total:</Text>
                <Text style={styles.breakdownValue}>${usd} USD</Text>
              </View>
            </View>
          )}
        </>
      ) : (
        <View style={styles.comingSoonContainer}>
          <Ionicons name="time-outline" size={64} color={Colors.primary} />
          <Text style={styles.comingSoonTitle}>Coming Soon</Text>
          <Text style={styles.comingSoonText}>
            Bundle packages will be available soon. Stay tuned for exciting data and call bundles!
          </Text>
        </View>
      )}
    </View>
  );
}

function StepPay({
  summary,
  onEditAmount,
  onCardDetailsChange,
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={{ marginTop: 12 }}>
      <Text style={styles.sectionTitle}>Payment Information</Text>
       <Text style={[styles.smallLabel, { marginTop: 16 }]}>
        Enter your card details
      </Text>

      <CardField
        postalCodeEnabled={false}
          onFocus={() => setIsFocused(true)}
  onBlur={() => setIsFocused(false)}

        placeholders={{
          number: '1234 1234 1234 1234',
        }}
        cardStyle={{
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
    borderWidth: 1,
    borderColor: isFocused ? '#CD0202' : '#E0E0E0', 
    borderRadius: 8,
    fontSize: 16,
    placeholderColor: '#B8B8B8',

        }}
        style={{
          width: '100%',
          height: 50,
          marginVertical: 10,
        }}
        onCardChange={(cardDetails) => {
          onCardDetailsChange(cardDetails.complete);
        }}
      />

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>Mobile Number</Text>
          <Text style={styles.summaryValue}>{summary.mobile}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>Amount to send</Text>
          <Text style={styles.summaryValue}>{summary.afn} AFN</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>Base Amount</Text>
          <Text style={styles.summaryValue}>${summary.calculateBaseAmount()} USD</Text>
        </View>
        {summary.slabPercentage > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Fee ({summary.slabPercentage}%)</Text>
            <Text style={styles.summaryValue}>${summary.calculateFeeAmount()} USD</Text>
          </View>
        )}
        <View
          style={[
            styles.summaryRow,
            {
              borderTopWidth: 1,
              borderTopColor: "#F2F2F2",
              paddingTop: 8,
              marginTop: 6,
            },
          ]}
        >
          <Text style={[styles.summaryKey, { fontWeight: "700" }]}>
            Total Amount
          </Text>
          <Text
            style={[
              styles.summaryValue,
              { color: Colors.primary, fontWeight: "700" },
            ]}
          >
            ${summary.usd} USD
          </Text>
        </View>
        <TouchableOpacity onPress={onEditAmount} style={{ marginTop: 8 }}>
          <Text style={[styles.editLink, { alignSelf: "flex-end" }]}>
            Change amount
          </Text>
        </TouchableOpacity>
      </View>

     
      <Text style={[styles.smallLabel, { marginTop: 16 }]}>
        Payment will be processed securely using Stripe. Your card details are never stored on our servers.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: "600",
    color: Colors.textPrimary,

  },
  smallLabel: {
    fontSize: 13,
    color: Colors.textPrimary,
    marginBottom: 6,
    marginTop: 12,
  },

  dropField: {
    height: 65,
    borderRadius: 50,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  editHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  editLink: { color: Colors.primary, fontSize: 16, fontWeight: "600" },

  phoneRow: {
    flexDirection: "row",
    height: 65,
    borderRadius: 50,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E6E6E6",
    backgroundColor: "#fff",
  },
  phonePrefix: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#EEE",
    backgroundColor: "#FAFAFA",
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.textPrimary,
  },

  operatorPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  customRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 50,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    height: 65,
  },
  currencyTag: { fontWeight: "700", marginRight: 8, color: Colors.textPrimary },
  customInput: { flex: 1, fontSize: 16, color: Colors.textPrimary },
  clearBtn: { padding: 6 },
  equivText: { fontSize: 12, color: "#9E9E9E", marginTop: 6 },

  amountCell: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFF7F4",
    borderWidth: 1,
    borderColor: "#F7E7E5",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amountCellActive: { backgroundColor: "#FFECE8", borderColor: Colors.primary },
  afnLeft: { fontSize: 15, color: Colors.textPrimary, fontWeight: "600" },
  usdRight: { fontSize: 14, color: Colors.textSecondary },

  breakdownContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  breakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
    marginTop: 4,
  },
  breakdownLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  breakdownValue: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: "500",
  },

  summaryCard: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: "#F2DAD7",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  summaryKey: { color: Colors.textSecondary, fontSize: 13 },
  summaryValue: { color: Colors.textPrimary, fontSize: 13 },

  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(76,175,80,0.1)",
    borderWidth: 2,
    borderColor: "rgba(76,175,80,0.35)",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  kv: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  k: { color: Colors.textSecondary, fontSize: 13 },
  v: { color: Colors.textPrimary, fontSize: 13 },
  totalBox: {
    width: "100%",
    backgroundColor: "#F5F5F7",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginVertical: 18,
  },
  totalLabel: { color: Colors.textSecondary, fontSize: 12 },
  totalValue: { color: Colors.textPrimary, fontSize: 20, fontWeight: "700" },


serviceTypeToggle: {
  flexDirection: 'row',
  backgroundColor: '#F5F5F5',
  borderRadius: 50,
  padding: 4,
  marginBottom: 20,
  width: '100%', 
},
  toggleOption: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleOptionActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.white,
  },

 quickAmountsList: {
    marginTop: 12,
  },
  quickAmountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickAmountItemSelected: {
    backgroundColor: '#FFF5F5',
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  amountInfo: {
    display: 'flex', flexDirection: 'row',
    justifyContent: "space-between",
    alignItems: 'center',
    width: "100%",
  },
 amountValue: {
  fontSize: 18,
  fontWeight: '600',
  color: Colors.textPrimary,
  fontFamily: 'dmsansRegular',
},

amountValueSelected: {
  color: Colors.primary, 
},

amountSubtext: {
  fontSize: 16,
  color: Colors.white,
  fontFamily: 'dmsansRegular',
  padding: 12,
  backgroundColor: '#E48D08',
  borderRadius: 50,
},

amountSubtextSelected: {
  color: Colors.white, 
},

  amountSubtextSelected: {
    color: Colors.primaryLight,
  },
  selectedIndicator: {
    padding: 4,
  },
  quickAmountsContainer: {
    marginTop: 24,
  },
  quickAmountsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  quickAmountButton: {
    width: '30%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quickAmountButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  quickAmountTextSelected: {
    color: Colors.white,
  },
  quickAmountSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  quickAmountSubtextSelected: {
    color: Colors.white,
  },


  comingSoonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    marginTop: 20,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },


  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
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
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
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

  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  contactPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  contactSeparator: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  
});

function formatLocal(s) {
  if (!s) return "";
  const d = s.replace(/\D/g, "");
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 9)}`;
}

function hexFade(hex, op) {
  if (!hex) return `rgba(0,0,0,${op})`;
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${op})`;
}


function calculateUsdAmount(afnAmount, exchangeRate, slabPercentage) {
  if (!exchangeRate || !afnAmount) return 0;
  
  const baseAmount = parseFloat(afnAmount) * exchangeRate;
  const feeAmount = baseAmount * (slabPercentage / 100);
  const totalAmount = baseAmount + feeAmount;
  
  return totalAmount.toFixed(2);
}