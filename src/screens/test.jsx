import React, { useMemo, useState, useEffect } from "react";
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

console.log("this is sdf")


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
    (step === BASE_STEPS.NUMBER &&
      localNumber.replace(/\D/g, "").length >= 7) ||
    (step === BASE_STEPS.AMOUNT && afn > 0) || 
    (step === BASE_STEPS.PAY && cardDetailsComplete);


  const goBack = () => (step > 0 ? setStep(step - 1) : navigation.goBack());

  const goNext = () => {
    if (!canNext) return;
    setStep(step + 1);
  };

  const jumpTo = (i) => setStep(i);


  useEffect(() => {
    setLocalNumber("");
  }, [country?.countryCode]);


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
          </ScrollView>
        </KeyboardAvoidingView>
      )}


      <Modal
        transparent
        visible={countryOpen}
        animationType="slide"
        onRequestClose={() => setCountryOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { height: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity
                onPress={() => setCountryOpen(false)}
                style={{ padding: 6 }}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#7A7A7A" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search countries..."
                value={countrySearch}
                onChangeText={setCountrySearch}
              />
              {countrySearch ? (
                <TouchableOpacity onPress={() => setCountrySearch('')}>
                  <Ionicons name="close-circle" size={20} color="#7A7A7A" />
                </TouchableOpacity>
              ) : null}
            </View>
            
            <FlatList
              data={filteredCountries}
              keyExtractor={(it) => it.countryCode}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#F0F0F0' }} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalRow}
                  onPress={() => {
                    setCountry(item);
                    setCountryOpen(false);
                    setCountrySearch('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 24, marginRight: 12 }}>
                    {codeToFlag(item.countryCode)}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, color: Colors.textPrimary, fontWeight: '500' }}>
                      {item.countryName}
                    </Text>
                    <Text style={{ fontSize: 14, color: "#7A7A7A", marginTop: 2 }}>
                      {DIAL_CODES[item.countryCode] || ""}
                    </Text>
                  </View>
                  {item.countryCode === country?.countryCode && (
                    <Ionicons
                      name="checkmark"
                      color={Colors.primary}
                      size={20}
                    />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="alert-circle-outline" size={40} color="#CCC" />
                  <Text style={styles.emptyText}>No countries found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

   
      <Modal
        transparent
        visible={contactsModalVisible}
        animationType="slide"
        onRequestClose={() => setContactsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { height: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Contact</Text>
              <TouchableOpacity
                onPress={() => setContactsModalVisible(false)}
                style={{ padding: 6 }}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
          
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#7A7A7A" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search contacts..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#7A7A7A" />
                </TouchableOpacity>
              ) : null}
            </View>
            
            {filteredContacts.length > 0 ? (
              <FlatList
                data={filteredContacts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.contactItem}
                    onPress={() => {
                      if (!item.phoneNumbers || item.phoneNumbers.length === 0) {
                        Alert.alert('No Phone Number', 'This contact doesn\'t have a phone number');
                        return;
                      }
                      
                      const validPhoneNumbers = item.phoneNumbers.filter(phone => phone.number);
                      
                      if (validPhoneNumbers.length === 0) {
                        Alert.alert('No Valid Numbers', 'No valid phone numbers found for this contact');
                        return;
                      }
                      
                      if (validPhoneNumbers.length === 1) {
                        handleContactSelect(validPhoneNumbers[0].number);
                      } else {
                       
                        Alert.alert(
                          "Select Phone Number",
                          null,
                          validPhoneNumbers.map(phone => ({
                            text: phone.number,
                            onPress: () => handleContactSelect(phone.number)
                          })),
                          { cancelable: true }
                        );
                      }
                    }}
                  >
                    <View style={styles.contactAvatar}>
                      <Ionicons name="person" size={24} color="#FFF" />
                    </View>
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{item.name}</Text>
                      {item.phoneNumbers && item.phoneNumbers.length > 0 && (
                        <Text style={styles.contactPhone}>
                          {item.phoneNumbers[0].number}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.contactSeparator} />}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={40} color="#CCC" />
                <Text style={styles.emptyText}>No contacts found</Text>
                <Text style={[styles.emptyText, { fontSize: 14, marginTop: 8 }]}>
                  {contacts.length === 0 ? "You need to grant contacts permission" : "Try a different search term"}
                </Text>
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
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={{ marginTop: 12 }}>
      <View style={styles.editHeader}>
        <Text style={styles.sectionTitle}>How much do you want Top-up?</Text>
        <TouchableOpacity onPress={onEditNumber}>
          <Text style={styles.editLink}>Change number</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.smallLabel}>Amount (AFN)</Text>
      <View style={[
        styles.customRow,
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
      
      {loadingData ? (
        <Text style={styles.equivText}>Calculating USD equivalent...</Text>
      ) : (
        <Text style={styles.equivText}>
          ${usd} USD (est.)
          {slabPercentage > 0 && ` (includes ${slabPercentage}% fee)`}
        </Text>
      )}

      {/* ... rest of the component remains the same ... */}
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
    fontWeight: "600",
    color: Colors.textPrimary,
    // marginBottom: 12,
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

  // Modal styles
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
  
  // Empty state styles
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
  
  // Contact list styles
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