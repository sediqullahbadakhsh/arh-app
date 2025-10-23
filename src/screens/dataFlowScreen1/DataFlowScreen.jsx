import React, { useMemo, useState, useEffect, useRef } from "react";
import {
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
  SafeAreaView,
  Easing,
  Dimensions,
  Image,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";
import PrimaryButton from "../../components/PrimaryButton";
import { codeToFlag } from "../../utils/flag";
import { DIAL_CODES, guessOperator } from "../../constants/dialing";
import { useAuth } from "../../auth/AuthProvider";
import { activateDataBundle, getCountries, getDataProducts } from "../../services/merchantApi";
import * as Contacts from 'expo-contacts';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import formatLocal from "../../utils/formatLocal";
import DataStyles from "./DataStyles";
import StepCountry from "./StepCountry";
import StepNumber from "./StepNumber";
import StepProducts from "./StepProducts";
import StepPay from "./StepPay";
import { useTranslation } from "react-i18next";
import SuccessModal from "../../components/modals/SuccessModal";
import ErrorModal from "../../components/modals/ErrorModal";

const { height: screenHeight } = Dimensions.get('window');
const BASE_STEPS = { COUNTRY: 0, NUMBER: 1, PRODUCT: 2, PAY: 3 };

export default function DataFlowScreenMerchant({ navigation }) {
  const { user } = useAuth?.() || { user: null };
  const isB2B = (user?.role || "").toLowerCase().includes("b2b");
  const lastStep = isB2B ? BASE_STEPS.PRODUCT : BASE_STEPS.PAY;
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
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("Data");
  const [product, setProduct] = useState(null);
  const [search, setSearch] = useState("");
  const {t} = useTranslation();  
  const [contactsSlideAnim] = useState(new Animated.Value(screenHeight));
  const [countriesSlideAnim] = useState(new Animated.Value(screenHeight));
  const insets = useSafeAreaInsets();

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successData, setSuccessData] = useState(null);

  const dial = DIAL_CODES[country?.countryCode] || "";
  const operator = guessOperator(country?.countryCode, localNumber.replace(/\D/g, ""));

  useEffect(() => {
    const getAllCountries = async () => {
      try {
        const res = await getCountries();
        setCountries(res?.data);
        const afgCountry = res?.data.find((c) => c.countryCode === "AF");
        setCountry(afgCountry);
      } catch (error) {
        console.error("Error loading countries:", error);
        setErrorMessage("Failed to load countries. Please try again.");
        setShowErrorModal(true);
      }
    };
    getAllCountries();
  }, []);

  useEffect(() => {
    const getProductsForAgent = async () => {
      if (!country?.id) return;
      
      try {
        const filter = {
          countryId: country?.id,
          productCategoryId: category?.id || 1
        };
        const res = await getDataProducts(filter);
        setProducts(res?.data || []);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
        setErrorMessage("Failed to load products. Please try again.");
        setShowErrorModal(true);
      }
    };

    getProductsForAgent();
  }, [country, category]);

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
        } else {
          setErrorMessage("No contacts found on your device.");
          setShowErrorModal(true);
        }
      } else {
        setErrorMessage("Cannot access contacts without permission. Please enable contacts permission in settings.");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      setErrorMessage("Failed to load contacts. Please try again.");
      setShowErrorModal(true);
    }
  };

  const canNext =
    (step === BASE_STEPS.COUNTRY && !!country) ||
    (step === BASE_STEPS.NUMBER && localNumber.replace(/\D/g, "").length >= 7) ||
    (step === BASE_STEPS.PRODUCT && !!product) ||
    (step === BASE_STEPS.PAY && !isB2B);

  const goBack = () => (step > 0 ? setStep(step - 1) : navigation.goBack());

  const goNext = () => {
    if (!canNext) return;

    if (step === lastStep) {
      activateBundle();
      return;
    }
    setStep(step + 1);
  };

  const jumpTo = (i) => setStep(i);

  useEffect(() => {
    setLocalNumber("");
    setProduct(null);
  }, [country?.countryCode]);

  const activateBundle = async () => {
    setLoading(true);
    try {
      const payload = {
        productId: product?.id,
        customerMobileNumber: localNumber
      };

      const res = await activateDataBundle(payload);
      
      const successData = {
        mobile: `${dial} ${formatLocal(localNumber)}`,
        txId: res?.txnNumber || "#DB" + Math.floor(100000 + Math.random() * 899999),
        date: new Date().toISOString(),
        product,
        amount: product?.price,
      };

      setSuccessData(successData);
      setShowSuccessModal(true);
      
      // Reset form
      setProduct(null);
      setLocalNumber("");
      setStep(0);
    } catch (error) {
      console.error("Failed To Activate Bundle:", error);
      const message = error.response?.data?.error || error.message || "Oops, Something Went Wrong!";
      setErrorMessage(message);
      setShowErrorModal(true);
    }
    setLoading(false);
  };

  const handleContactSelect = (phoneNumber) => {
    if (!phoneNumber) {
      setErrorMessage("Invalid phone number selected");
      setShowErrorModal(true);
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

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setSuccessData(null);
  };

  const handleErrorClose = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.trim().toLowerCase();
    return products.filter((p) =>
      p.productName?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.price?.toString().includes(q)
    );
  }, [products, search]);

  const ContactsModal = () => (
    <Modal
      visible={contactsModalVisible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={() => setContactsModalVisible(false)}
    >
      <View style={DataStyles.modalOverlay}>
        <TouchableOpacity 
          style={DataStyles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setContactsModalVisible(false)}
        />
        <Animated.View 
          style={[
            DataStyles.modalCard,
            { 
              transform: [{ translateY: contactsSlideAnim }],
              height: '80%',
              marginBottom: -insets.bottom
            }
          ]}
        >
          <View style={DataStyles.modalHeader}>
            <Text style={DataStyles.modalTitle}>{t("selectContact")}</Text>
            <TouchableOpacity 
              onPress={() => setContactsModalVisible(false)}
              style={DataStyles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={DataStyles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={DataStyles.searchIcon} />
            <TextInput
              placeholder="Search contacts..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={DataStyles.searchInput}
              placeholderTextColor="#999"
            />
          </View>

          {filteredContacts.length > 0 ? (
            <FlatList
              data={filteredContacts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={DataStyles.contactItem}
                  onPress={() => {
                    if (item.phoneNumbers && item.phoneNumbers.length > 0) {
                      handleContactSelect(item.phoneNumbers[0].number);
                    }
                  }}
                >
                  <View style={DataStyles.contactAvatar}>
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>
                      {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                    </Text>
                  </View>
                  <View style={DataStyles.contactInfo}>
                    <Text style={DataStyles.contactName}>{item.name}</Text>
                    {item.phoneNumbers && item.phoneNumbers.length > 0 && (
                      <Text style={DataStyles.contactPhone}>{item.phoneNumbers[0].number}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={DataStyles.contactSeparator} />}
            />
          ) : (
            <View style={DataStyles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#999" />
              <Text style={DataStyles.emptyText}>{t("noContactsFound")}</Text>
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
      <View style={DataStyles.modalOverlay}>
        <TouchableOpacity 
          style={DataStyles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setCountryOpen(false)}
        />
        <Animated.View 
          style={[
            DataStyles.modalCard,
            { 
              transform: [{ translateY: countriesSlideAnim }],
              height: '80%',
              marginBottom: -insets.bottom
            }
          ]}
        >
          <View style={DataStyles.modalHeader}>
            <Text style={DataStyles.modalTitle}>Select Country</Text>
            <TouchableOpacity 
              onPress={() => setCountryOpen(false)}
              style={DataStyles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={DataStyles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={DataStyles.searchIcon} />
            <TextInput
              placeholder="Search countries..."
              value={countrySearch}
              onChangeText={setCountrySearch}
              style={DataStyles.searchInput}
              placeholderTextColor="#999"
            />
          </View>

          <FlatList
            data={countries.filter(c =>
              c.countryName?.toLowerCase().includes(countrySearch.toLowerCase()) ||
              c.countryCode?.toLowerCase().includes(countrySearch.toLowerCase())
            )}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={DataStyles.modalRow}
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
            ItemSeparatorComponent={() => <View style={DataStyles.contactSeparator} />}
          />
        </Animated.View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader title="Internet Bundle" onBack={goBack} />

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

          {step === BASE_STEPS.PRODUCT && (
            <StepProducts
              country={country}
              category={category}
              setCategory={setCategory}
              search={search}
              setSearch={setSearch}
              products={filteredProducts}
              product={product}
              setProduct={setProduct}
              onEditNumber={() => jumpTo(BASE_STEPS.NUMBER)}
              summary={{ dial, localNumber, product }}
            />
          )}

          {step === BASE_STEPS.PAY && !isB2B && (
            <StepPay
              summary={{
                mobile: `${dial} ${formatLocal(localNumber)}`,
                product: product,
                amount: product?.price,
              }}
              onEditProduct={() => jumpTo(BASE_STEPS.PRODUCT)}
            />
          )}

          <PrimaryButton
            label={
              step === lastStep
                ? isB2B
                  ? "Activate Bundle"
                  : `Pay ${product?.price} AFN`
                : "Continue"
            }
            onPress={goNext}
            style={{ marginTop: 24, opacity: canNext ? 1 : 0.5 }}
            loading={loading}
          />
          {step > 0 && (
            <PrimaryButton
              label="Back"
              onPress={goBack}
              style={{ marginTop: 12, marginBottom: 110, backgroundColor: "#4A4A4A" }}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessClose}
        title="Bundle Activated Successfully!"
        message={`Your ${successData?.product?.productName} bundle has been activated for ${successData?.mobile}. Transaction ID: ${successData?.txId}`}
        buttonText="Continue"
        autoHideDuration={0}
      />

      {/* Error Modal */}
      <ErrorModal
        visible={showErrorModal}
        onClose={handleErrorClose}
        title="Operation Failed"
        message={errorMessage}
        buttonText="Try Again"
        showRetryButton={true}
      />

      <ContactsModal />
      <CountriesModal />

      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Activating Bundle...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = {
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
};