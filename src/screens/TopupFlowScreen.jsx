// screens/topupscreen/MerchantTopupFlowScreen.jsx
import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
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
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import LottieView from 'lottie-react-native';
import { Colors } from "../theme/colors";
import ServiceHeader from "../components/ServiceHeader";
import PrimaryButton from "../components/PrimaryButton";
import { codeToFlag } from "../utils/flag";
import { DIAL_CODES, guessOperator } from "../constants/dialing";
import { 
  getCountries, 
  makeRechargeAgent, 
  getOrderStatus,
  getTopupProductsCustomer 
} from "../services/merchantApi";
import { getSetaraganMnoId } from "../utils/getCompanyIdForSetaragan";
import { getMnoLogo } from "../utils/getMnoLogo";
import * as Contacts from 'expo-contacts';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import formatLocal from "../utils/formatLocal";
import TopUpStyles from "./topupScreen/TopupStyle";
import { useAuth } from "../auth/AuthProvider";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";

const { height: screenHeight } = Dimensions.get('window');
const BASE_STEPS = { COUNTRY: 0, NUMBER: 1, PAY: 2 };

const ORDER_STATUS = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  PENDING: 'pending'
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      cacheTime: 0,
      retry: 1,
      refetchOnMount: 'always', 
      refetchOnWindowFocus: true, 
    },
  },
});

const QUERY_KEYS = {
  COUNTRIES: ['countries'],
  CONTACTS: ['contacts'],
};

const useCountries = () => {
  const { t } = useTranslation();
  
  return useQuery({
    queryKey: QUERY_KEYS.COUNTRIES,
    queryFn: async () => {
      const response = await getCountries();
      return response?.data || [];
    },
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: 'always',
  });
};

const useContacts = () => {
  const { t } = useTranslation();
  
  return useQuery({
    queryKey: QUERY_KEYS.CONTACTS,
    queryFn: async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error(t('permissionDenied'));
      }
      
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });
      
      return data || [];
    },
    staleTime: 0, // Force immediate refetch
    cacheTime: 0, // No caching
    refetchOnMount: 'always',
    enabled: false, // Only fetch when explicitly called
  });
};

// Function to normalize phone numbers by removing country codes
const normalizePhoneNumber = (phoneNumber, countryDialCode) => {
  if (!phoneNumber) return "";
  
  // Remove all non-digit characters
  let normalized = phoneNumber.replace(/\D/g, "");
  
  // Common country codes to remove (including +)
  const countryCodes = [
    '+1', '1',  // USA/Canada
    '+44', '44', // UK
    '+91', '91', // India
    '+92', '92', // Pakistan
    '+93', '93', // Afghanistan
    '+94', '94', // Sri Lanka
    '+95', '95', // Myanmar
    '+96', '96', // 
    '+97', '97', // UAE
    '+98', '98', // Iran
    '+99', '99', // 
    '+20', '20', // Egypt
    '+30', '30', // Greece
    '+31', '31', // Netherlands
    '+32', '32', // Belgium
    '+33', '33', // France
    '+34', '34', // Spain
    '+39', '39', // Italy
    '+40', '40', // Romania
    '+41', '41', // Switzerland
    '+43', '43', // Austria
    '+45', '45', // Denmark
    '+46', '46', // Sweden
    '+47', '47', // Norway
    '+48', '48', // Poland
    '+49', '49', // Germany
    '+51', '51', // Peru
    '+52', '52', // Mexico
    '+53', '53', // Cuba
    '+54', '54', // Argentina
    '+55', '55', // Brazil
    '+56', '56', // Chile
    '+57', '57', // Colombia
    '+58', '58', // Venezuela
    '+60', '60', // Malaysia
    '+61', '61', // Australia
    '+62', '62', // Indonesia
    '+63', '63', // Philippines
    '+64', '64', // New Zealand
    '+65', '65', // Singapore
    '+66', '66', // Thailand
    '+81', '81', // Japan
    '+82', '82', // South Korea
    '+84', '84', // Vietnam
    '+86', '86', // China
    '+90', '90', // Turkey
    '+212', '212', // Morocco
    '+213', '213', // Algeria
    '+216', '216', // Tunisia
    '+218', '218', // Libya
    '+220', '220', // Gambia
    '+221', '221', // Senegal
    '+222', '222', // Mauritania
    '+223', '223', // Mali
    '+224', '224', // Guinea
    '+225', '225', // Ivory Coast
    '+226', '226', // Burkina Faso
    '+227', '227', // Niger
    '+228', '228', // Togo
    '+229', '229', // Benin
    '+230', '230', // Mauritius
    '+231', '231', // Liberia
    '+232', '232', // Sierra Leone
    '+233', '233', // Ghana
    '+234', '234', // Nigeria
    '+235', '235', // Chad
    '+236', '236', // Central African Republic
    '+237', '237', // Cameroon
    '+238', '238', // Cape Verde
    '+239', '239', // Sao Tome and Principe
    '+240', '240', // Equatorial Guinea
    '+241', '241', // Gabon
    '+242', '242', // Republic of the Congo
    '+243', '243', // Democratic Republic of the Congo
    '+244', '244', // Angola
    '+245', '245', // Guinea-Bissau
    '+246', '246', // Diego Garcia
    '+247', '247', // Ascension Island
    '+248', '248', // Seychelles
    '+249', '249', // Sudan
    '+250', '250', // Rwanda
    '+251', '251', // Ethiopia
    '+252', '252', // Somalia
    '+253', '253', // Djibouti
    '+254', '254', // Kenya
    '+255', '255', // Tanzania
    '+256', '256', // Uganda
    '+257', '257', // Burundi
    '+258', '258', // Mozambique
    '+260', '260', // Zambia
    '+261', '261', // Madagascar
    '+262', '262', // Reunion
    '+263', '263', // Zimbabwe
    '+264', '264', // Namibia
    '+265', '265', // Malawi
    '+266', '266', // Lesotho
    '+267', '267', // Botswana
    '+268', '268', // Eswatini
    '+269', '269', // Comoros
    '+290', '290', // Saint Helena
    '+291', '291', // Eritrea
    '+297', '297', // Aruba
    '+298', '298', // Faroe Islands
    '+299', '299', // Greenland
    '+350', '350', // Gibraltar
    '+351', '351', // Portugal
    '+352', '352', // Luxembourg
    '+353', '353', // Ireland
    '+354', '354', // Iceland
    '+355', '355', // Albania
    '+356', '356', // Malta
    '+357', '357', // Cyprus
    '+358', '358', // Finland
    '+359', '359', // Bulgaria
    '+370', '370', // Lithuania
    '+371', '371', // Latvia
    '+372', '372', // Estonia
    '+373', '373', // Moldova
    '+374', '374', // Armenia
    '+375', '375', // Belarus
    '+376', '376', // Andorra
    '+377', '377', // Monaco
    '+378', '378', // San Marino
    '+379', '379', // Vatican City
    '+380', '380', // Ukraine
    '+381', '381', // Serbia
    '+382', '382', // Montenegro
    '+383', '383', // Kosovo
    '+385', '385', // Croatia
    '+386', '386', // Slovenia
    '+387', '387', // Bosnia and Herzegovina
    '+389', '389', // North Macedonia
    '+420', '420', // Czech Republic
    '+421', '421', // Slovakia
    '+423', '423', // Liechtenstein
    '+500', '500', // Falkland Islands
    '+501', '501', // Belize
    '+502', '502', // Guatemala
    '+503', '503', // El Salvador
    '+504', '504', // Honduras
    '+505', '505', // Nicaragua
    '+506', '506', // Costa Rica
    '+507', '507', // Panama
    '+508', '508', // Saint Pierre and Miquelon
    '+509', '509', // Haiti
    '+590', '590', // Guadeloupe
    '+591', '591', // Bolivia
    '+592', '592', // Guyana
    '+593', '593', // Ecuador
    '+594', '594', // French Guiana
    '+595', '595', // Paraguay
    '+596', '596', // Martinique
    '+597', '597', // Suriname
    '+598', '598', // Uruguay
    '+599', '599', // Caribbean Netherlands
    '+670', '670', // East Timor
    '+672', '672', // Australian External Territories
    '+673', '673', // Brunei
    '+674', '674', // Nauru
    '+675', '675', // Papua New Guinea
    '+676', '676', // Tonga
    '+677', '677', // Solomon Islands
    '+678', '678', // Vanuatu
    '+679', '679', // Fiji
    '+680', '680', // Palau
    '+681', '681', // Wallis and Futuna
    '+682', '682', // Cook Islands
    '+683', '683', // Niue
    '+685', '685', // Samoa
    '+686', '686', // Kiribati
    '+687', '687', // New Caledonia
    '+688', '688', // Tuvalu
    '+689', '689', // French Polynesia
    '+690', '690', // Tokelau
    '+691', '691', // Micronesia
    '+692', '692', // Marshall Islands
    '+850', '850', // North Korea
    '+852', '852', // Hong Kong
    '+853', '853', // Macau
    '+855', '855', // Cambodia
    '+856', '856', // Laos
    '+880', '880', // Bangladesh
    '+886', '886', // Taiwan
    '+960', '960', // Maldives
    '+961', '961', // Lebanon
    '+962', '962', // Jordan
    '+963', '963', // Syria
    '+964', '964', // Iraq
    '+965', '965', // Kuwait
    '+966', '966', // Saudi Arabia
    '+967', '967', // Yemen
    '+968', '968', // Oman
    '+970', '970', // Palestine
    '+971', '971', // United Arab Emirates
    '+972', '972', // Israel
    '+973', '973', // Bahrain
    '+974', '974', // Qatar
    '+975', '975', // Bhutan
    '+976', '976', // Mongolia
    '+977', '977', // Nepal
    '+992', '992', // Tajikistan
    '+993', '993', // Turkmenistan
    '+994', '994', // Azerbaijan
    '+995', '995', // Georgia
    '+996', '996', // Kyrgyzstan
    '+998', '998', // Uzbekistan
  ];
  
  // Sort country codes by length (longest first) to avoid partial matches
  const sortedCountryCodes = [...countryCodes].sort((a, b) => b.length - a.length);
  
  // Remove country codes
  for (const code of sortedCountryCodes) {
    if (normalized.startsWith(code)) {
      normalized = normalized.substring(code.length);
      break;
    }
  }
  
  // Remove leading zeros (common after country code removal)
  normalized = normalized.replace(/^0+/, '');
  
  return normalized;
};

const ContactsModal = ({ 
  contactsModalVisible, 
  setContactsModalVisible, 
  contactsSlideAnim, 
  insets, 
  searchQuery, 
  setSearchQuery, 
  filteredContacts, 
  handleContactSelect,
  loadingContacts
}) => {
  const { t } = useTranslation();
  
  return (
    <Modal
      visible={contactsModalVisible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={() => setContactsModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setContactsModalVisible(false)}
        />
        <Animated.View 
          style={[
            styles.modalCard,
            { 
              transform: [{ translateY: contactsSlideAnim }],
              height: '80%',
              marginBottom: -insets.bottom
            }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("selectContact")}</Text>
            <TouchableOpacity 
              onPress={() => setContactsModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              placeholder={t("searchContacts")}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              placeholderTextColor="#999"
            />
          </View>

          {loadingContacts ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.emptyText}>{t("loadingContacts")}</Text>
            </View>
          ) : filteredContacts.length > 0 ? (
            <FlatList
              data={filteredContacts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={() => {
                    if (item.phoneNumbers && item.phoneNumbers.length > 0) {
                      // Pass the phone number to handleContactSelect
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
              <Text style={styles.emptyText}>{t("noContactsFound")}</Text>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

function MerchantTopupFlowScreen({ navigation }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth?.() || { user: null };
  const lastStep = BASE_STEPS.PAY;
  const [step, setStep] = useState(0);
  const [orderStatus, setOrderStatus] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [contactsModalVisible, setContactsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [country, setCountry] = useState(null);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [localNumber, setLocalNumber] = useState("");
  const [amountAfn, setAmountAfn] = useState("");
  const [product, setProduct] = useState(null);
  const [rechargeProducts, setRechargeProducts] = useState([]);
  const [selectedPopularAmount, setSelectedPopularAmount] = useState(null);
  const [customProduct, setCustomProduct] = useState(null);
  const [amountValidationError, setAmountValidationError] = useState("");
  const insets = useSafeAreaInsets();
  const pollingRef = useRef(null);
  const lottieRef = useRef(null);

  const [contactsSlideAnim] = useState(new Animated.Value(screenHeight));
  const [countriesSlideAnim] = useState(new Animated.Value(screenHeight));

  const dial = DIAL_CODES[country?.countryCode] || "";
  const operator = guessOperator(country?.countryCode, localNumber.replace(/\D/g, ""));
  const operatorId = getSetaraganMnoId(localNumber);
  const operatorLogo = getMnoLogo(operatorId);

  // Function to get minimum amount based on phone number prefix
  const getMinimumAmount = useCallback((phoneNumber) => {
    const cleanNumber = phoneNumber.replace(/\D/g, "");
    if (cleanNumber.length >= 2) {
      const prefix = cleanNumber.substring(0, 2);
      // For prefixes 78 and 73, minimum amount is 1
      if (prefix === '78' || prefix === '73') {
        return 1;
      }
    }
    // For all other prefixes (70,71,72,74,76,77,79), minimum amount is 25
    return 25;
  }, []);

  // Function to validate amount based on phone number
  const validateAmount = useCallback((amount, phoneNumber) => {
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      return { isValid: false, message: t('enterValidAmountGreaterThanZero') };
    }
    
    const minimumAmount = getMinimumAmount(phoneNumber);
    if (amountValue < minimumAmount) {
      return { 
        isValid: false, 
        message: t('minimumAmountIs', { amount: minimumAmount }) 
      };
    }
    
    return { isValid: true, message: "" };
  }, [getMinimumAmount, t]);

  const { data: countries = [], isLoading: loadingCountries, refetch: refetchCountries } = useCountries();
  const { 
    data: contacts = [], 
    isLoading: loadingContacts,
    refetch: refetchContacts 
  } = useContacts();

  // Use focus effect to refetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused, refetching all data...');
      
      // Invalidate and refetch all queries
      queryClient.invalidateQueries(QUERY_KEYS.COUNTRIES);
      queryClient.invalidateQueries(QUERY_KEYS.CONTACTS);
      
      // Reset all local state
      resetState();
      
      return () => {
        console.log('Screen unfocused, cleaning up...');
        // Clean up polling interval
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      };
    }, [])
  );

  // Function to reset all state
  const resetState = () => {
    setStep(0);
    setOrderStatus(null);
    setOrderDetails(null);
    setLocalNumber("");
    setAmountAfn("");
    setProduct(null);
    setSelectedPopularAmount(null);
    setSearchQuery('');
    setCountrySearch('');
    setAmountValidationError("");
    
    // Reset animations
    contactsSlideAnim.setValue(screenHeight);
    countriesSlideAnim.setValue(screenHeight);
    
    // Reset Lottie animation
    if (lottieRef.current) {
      lottieRef.current.reset();
    }
  };

  // Filter contacts locally
  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts;
    return contacts.filter(contact =>
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phoneNumbers?.some(phone =>
        phone.number?.includes(searchQuery)
      )
    );
  }, [searchQuery, contacts]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (lottieRef.current && (orderStatus === ORDER_STATUS.SUCCEEDED || orderStatus === ORDER_STATUS.FAILED)) {
      lottieRef.current.play();
    }
  }, [orderStatus]);

  useEffect(() => {
    // Always refetch countries when component mounts or screen focuses
    if (!country) {
      // Find Afghanistan first, then fallback to first country
      const afgCountry = countries.find((c) => c.countryCode === "AF") || countries[0];
      setCountry(afgCountry);
    }
  }, [countries]);

  useEffect(() => {
    const fetchRechargeProducts = async () => {
      if (!country?.id) return;
      
      try {
        setLoadingProducts(true);
        const filter = { 
          countryId: country.id,
          productFor: "TOPUP"
        };
        
        console.log("Fetching topup products for merchant:", filter);
        const res = await getTopupProductsCustomer(filter);
        console.log("Merchant products response:", res);
        
        setRechargeProducts(res?.data || []);
        
        const customProd = res?.data?.find(p => 
          p.basePrice === 0 && 
          (p.productName?.toLowerCase().includes('custom') || 
           p.productName?.toLowerCase().includes('topup'))
        );
        setCustomProduct(customProd || null);
        
      } catch (error) {
        console.error("Error fetching merchant products:", error);
        setRechargeProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    if (country?.id) {
      fetchRechargeProducts();
    }
  }, [country]);

  const rechargeAmounts = React.useMemo(() => {
    if (rechargeProducts.length > 0) {
      return rechargeProducts
        .filter(product => product.basePrice > 0)
        .map(product => {
          const basePrice = parseFloat(product.basePrice);
          
          return {
            id: product.id,
            afn: basePrice,
            basePrice: basePrice,
            productName: product.productName?.en || product.productName,
            product: product,
          };
        })
        .sort((a, b) => a.afn - b.afn);
    }
    
    const defaultAmounts = [50, 100, 150, 250, 500, 1000];
    return defaultAmounts.map(amount => ({
      id: amount.toString(),
      afn: amount,
      basePrice: amount,
      productName: `${amount} AFN Topup`,
      product: null,
    }));
  }, [rechargeProducts]);

  const handlePopularAmountSelect = (selectedAmount) => {
    if (selectedAmount.product) {
      setProduct(selectedAmount.product);
      setAmountAfn(selectedAmount.afn.toString());
    } else {
      setAmountAfn(selectedAmount.afn.toString());
      setProduct(null);
    }
    
    setSelectedPopularAmount(selectedAmount);
    
    // Validate amount after selection
    if (localNumber) {
      const validation = validateAmount(selectedAmount.afn.toString(), localNumber);
      setAmountValidationError(validation.isValid ? "" : validation.message);
    }
  };

  const handleCustomAmountChange = (text) => {
    const cleanedText = text.replace(/[^0-9.]/g, '');
    setAmountAfn(cleanedText);
    setSelectedPopularAmount(null);
    setAmountValidationError("");
    
    // Validate amount when user types
    if (cleanedText && localNumber) {
      const validation = validateAmount(cleanedText, localNumber);
      if (!validation.isValid) {
        setAmountValidationError(validation.message);
      }
    }
    
    if (cleanedText && customProduct) {
      console.log("Setting custom product for amount:", cleanedText);
      const customAmount = parseFloat(cleanedText) || 0;
      
      setProduct({
        ...customProduct,
        customAmount: customAmount,
        basePrice: customAmount,
        price: customAmount,
      });
    } else {
      setProduct(null);
    }
  };

  const startPollingOrderStatus = async (orderId) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    let pollCount = 0;
    const maxPolls = 60;

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
        if (pollCount >= maxPolls) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setOrderStatus(ORDER_STATUS.FAILED);
        }
      }
    }, 3000);
  };

  useEffect(() => {
    if (contactsModalVisible) {
      Animated.timing(contactsSlideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.back(1)),
        useNativeDriver: true,
      }).start();
      refetchContacts();
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

  // Update canNext to include amount validation
  const canNext =
    (step === BASE_STEPS.COUNTRY && !!country) ||
    (step === BASE_STEPS.NUMBER && 
     localNumber.replace(/\D/g, "").length >= 7 && 
     amountAfn > 0 && 
     !amountValidationError) ||
    (step === BASE_STEPS.PAY);

  const goBack = () => (step > 0 ? setStep(step - 1) : navigation.goBack());

  const goNext = () => {
    if (!canNext) return;
    
    // Additional validation before proceeding
    if (step === BASE_STEPS.NUMBER) {
      const validation = validateAmount(amountAfn, localNumber);
      if (!validation.isValid) {
        setAmountValidationError(validation.message);
        return;
      }
    }
    
    setStep(step + 1);
  };

  const jumpTo = (i) => setStep(i);

  useEffect(() => {
    setLocalNumber("");
    setAmountAfn("");
    setProduct(null);
    setSelectedPopularAmount(null);
    setAmountValidationError("");
  }, [country?.countryCode]);

  const handleContactSelect = useCallback((phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert(t('error'), t('invalidPhoneNumber'));
      return;
    }

    console.log("Selected contact phone number:", phoneNumber);
    
    // Normalize the phone number by removing country codes
    let normalizedNumber = normalizePhoneNumber(phoneNumber, dial.replace('+', ''));
    
    console.log("Normalized number after removing country codes:", normalizedNumber);
    
    // If the number starts with 0, remove it (common for local numbers)
    normalizedNumber = normalizedNumber.replace(/^0+/, '');
    
    console.log("Final normalized number:", normalizedNumber);
    
    // Validate the number has at least 7 digits
    if (normalizedNumber.length < 7) {
      Alert.alert(t('error'), t('invalidPhoneNumberLength'));
      return;
    }
    
    // Set the local number
    setLocalNumber(normalizedNumber);
    
    // Re-validate amount after phone number change
    if (amountAfn) {
      const validation = validateAmount(amountAfn, normalizedNumber);
      setAmountValidationError(validation.isValid ? "" : validation.message);
    }
    
    // Close contacts modal
    setContactsModalVisible(false);
    setSearchQuery('');
    
    // Show success message
    Alert.alert(
      t('success'),
      t('contactNumberImportedSuccessfully', { number: normalizedNumber }),
      [{ text: t('ok') }]
    );
  }, [dial, t, amountAfn, validateAmount]);

  const recharge = async () => {
    setLoading(true);
    try {
      const operatorId = getSetaraganMnoId(localNumber);

      if (!operatorId) {
        Alert.alert(t('invalidNumber'), t('invalidMobileNetwork'));
        setLoading(false);
        return;
      }

      const amountValue = parseFloat(amountAfn);
      if (isNaN(amountValue) || amountValue <= 0) {
        Alert.alert(t('invalidNumber'), t('enterValidAmountGreaterThanZero'));
        setLoading(false);
        return;
      }

      // Validate minimum amount based on phone number prefix
      const minimumAmount = getMinimumAmount(localNumber);
      if (amountValue < minimumAmount) {
        Alert.alert(t('invalidNumber'), t('minimumAmountIs', { amount: minimumAmount }));
        setLoading(false);
        return;
      }

      let productId = null;
      let customAmount = null;
      
      if (product) {
        if (product.customAmount) {
          productId = product.id;
          customAmount = product.customAmount;
        } else {
          productId = product.id;
          customAmount = product.basePrice || product.price;
        }
      } else if (amountAfn && !isNaN(parseFloat(amountAfn))) {
        if (customProduct) {
          productId = customProduct.id;
          customAmount = parseFloat(amountAfn);
        } else if (rechargeProducts.length > 0) {
          const firstProduct = rechargeProducts[0];
          productId = firstProduct.id;
          customAmount = parseFloat(amountAfn);
        } else {
          productId = 1;
          customAmount = parseFloat(amountAfn);
        }
      }

      if (!productId || !customAmount || customAmount <= 0) {
        Alert.alert(t('invalidNumber'), t('enterValidAmountGreaterThanZero'));
        setLoading(false);
        return;
      }

      const payload = {
        source: "agent_stock",
        receiver: localNumber,
        operator: operatorId,
        customAmount: customAmount,
        currency: "AFN",
        countryId: country?.id,
        companyId: "",
        productId: productId, // Use the determined product ID
      };

      console.log("Sending recharge payload:", payload);

      const res = await makeRechargeAgent(payload);
      
      if (res.status === "queued" || res.success) {
        setOrderStatus(ORDER_STATUS.QUEUED);
        setOrderDetails({
          orderId: res.orderId,
          txnNumber: res.txnNumber || `TXN-${Date.now()}`,
          mobile: `${dial} ${formatLocal(localNumber)}`,
          amountAfn: customAmount,
          date: new Date().toISOString(),
          operator: operator?.name || t('common.unknown'),
        });
        
        // Start polling for status updates
        if (res.orderId) {
          await startPollingOrderStatus(res.orderId);
        }
        
        goNext();
      } else {
        throw new Error(res.error || t('failedToRecharge'));
      }
      
    } catch (error) {
      console.log("Recharge error: ", error);
      const message =
        error.response?.data?.error ||
        error.response?.data?.details ||
        error.message ||
        t('failedToRecharge');
    
      Alert.alert(t('rechargeFailed'), message);
    }
    setLoading(false);
  };

  const getStatusMessage = () => {
    switch (orderStatus) {
      case ORDER_STATUS.QUEUED:
        return t('topupQueued');
      case ORDER_STATUS.PROCESSING:
      case ORDER_STATUS.PENDING:
        return t('topupProcessing');
      case ORDER_STATUS.SUCCEEDED:
        return t('topupCompletedSuccessfully');
      case ORDER_STATUS.FAILED:
        return t('topupFailed');
      default:
        return t('processingYourRequest');
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
        return t('status.queued');
      case ORDER_STATUS.PROCESSING:
      case ORDER_STATUS.PENDING:
        return t('processing');
      case ORDER_STATUS.SUCCEEDED:
        return t('topupSuccessful');
      case ORDER_STATUS.FAILED:
        return t('topupFailed');
      default:
        return t('processing');
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
    setProduct(null);
    setSelectedPopularAmount(null);
    
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    if (lottieRef.current) {
      lottieRef.current.reset();
    }

    setTimeout(() => {
      navigation.navigate('Home', { refresh: true });
    }, 500);
  };

  const filteredCountries = countrySearch
    ? countries.filter(c =>
      c.countryName.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.countryCode.toLowerCase().includes(countrySearch.toLowerCase())
    )
    : countries;

  const CountriesModal = () => {
    const { t } = useTranslation();
    
    return (
      <Modal
        visible={countryOpen}
        transparent={true}
        animationType="none"
        statusBarTranslucent={true}
        onRequestClose={() => setCountryOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setCountryOpen(false)}
          />
          <Animated.View 
            style={[
              styles.modalCard,
              { 
                transform: [{ translateY: countriesSlideAnim }],
                height: '80%',
                marginBottom: -insets.bottom
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectCountry')}</Text>
              <TouchableOpacity 
                onPress={() => setCountryOpen(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                placeholder={t('searchCountries')}
                value={countrySearch}
                onChangeText={setCountrySearch}
                style={styles.searchInput}
                placeholderTextColor="#999"
              />
            </View>

            {loadingCountries ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.emptyText}>{t("loadingCountries")}</Text>
              </View>
            ) : (
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
                    <Text style={{ fontSize: 24, marginEnd: 12 }}>
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
            )}
          </Animated.View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white, paddingBottom: 100 }}>
      <ServiceHeader title={t('mobileTopup')} onBack={goBack} />

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
                <Text style={TopUpStyles.detailLabel}>{t('receiverNumber')}</Text>
                <Text style={TopUpStyles.detailValue}>{orderDetails?.mobile}</Text>
              </View>
              <View style={TopUpStyles.detailRow}>
                <Text style={TopUpStyles.detailLabel}>{t('transactionId')}</Text>
                <Text style={TopUpStyles.detailValue}>{orderDetails?.txnNumber}</Text>
              </View>
              <View style={TopUpStyles.detailRow}>
                <Text style={TopUpStyles.detailLabel}>{t('date')}</Text>
                <Text style={TopUpStyles.detailValue}>
                  {new Date(orderDetails?.date).toLocaleString()}
                </Text>
              </View>

              <View style={TopUpStyles.amountSection}>
                <Text style={TopUpStyles.amountLabel}>{t('totalAmount')}</Text>
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
                  {orderStatus === ORDER_STATUS.QUEUED ? t('queued') : 
                  orderStatus === ORDER_STATUS.PROCESSING ? t('processing') : t('finalizing')}
                </Text>
              </View>
            )}

            {(orderStatus === ORDER_STATUS.SUCCEEDED || orderStatus === ORDER_STATUS.FAILED) && (
              <PrimaryButton
                label={t('done')}
                onPress={() => {
                  if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                  }
                  navigation.popToTop();
                  navigation.navigate('Home', { refresh: true });
                }}
                style={{ width: "100%", marginTop: 20 }}
              />
            )}

            <TouchableOpacity onPress={resetFlow} style={TopUpStyles.moreButton}>
              <Text style={TopUpStyles.moreButtonText}>
                {orderStatus === ORDER_STATUS.FAILED ? t('tryAgain') : t('topupMore')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
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

                <Text style={TopUpStyles.sectionTitle}>{t('enterAmount')}</Text>
                
                {/* Custom Amount Input */}
                <View style={[
                  TopUpStyles.customRow,
                  {
                    borderColor: amountValidationError ? '#EF4444' : '#2e2e2eff',
                    backgroundColor: '#FFFFFF',
                  }
                ]}>
                  <Text style={TopUpStyles.currencyTag}>AFN</Text>
                  <TextInput
                    value={amountAfn}
                    onChangeText={handleCustomAmountChange}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    style={TopUpStyles.customInput}
                  />
                  
                  {amountAfn && (
                    <TouchableOpacity
                      style={[TopUpStyles.clearBtn, { opacity: amountAfn ? 1 : 0.5 }]}
                      disabled={!amountAfn}
                      onPress={() => {
                        setAmountAfn("");
                        setProduct(null);
                        setSelectedPopularAmount(null);
                        setAmountValidationError("");
                      }}
                    >
                      <Ionicons name="close-circle" size={18} color="#A3A3A3" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Amount Validation Error Message */}
                {amountValidationError ? (
                  <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="warning-outline" size={16} color="#EF4444" />
                    <Text style={{ 
                      color: '#EF4444', 
                      fontSize: 12, 
                      fontFamily: 'dmsansRegular',
                      marginLeft: 4
                    }}>
                      {amountValidationError}
                    </Text>
                  </View>
                ) : localNumber && amountAfn && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ 
                      color: '#6B7280', 
                      fontSize: 12, 
                      fontFamily: 'dmsansRegular'
                    }}>
                      {t('minimumAmountNote', { amount: getMinimumAmount(localNumber) })}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {step === BASE_STEPS.PAY && (
              <StepPay
                summary={{
                  mobile: `${dial} ${formatLocal(localNumber)}`,
                  amount: amountAfn,
                  operator: operator?.name || t('common.unknown'),
                  product: product,
                }}
                onEditNumber={() => jumpTo(BASE_STEPS.NUMBER)}
              />
            )}

            <PrimaryButton
              label={step === lastStep ? t('sendTopup') : t('continue')}
              onPress={step === lastStep ? recharge : goNext}
              style={{ marginTop: 24, opacity: canNext ? 1 : 0.5 }}
              loading={loading}
              disabled={!canNext || loading}
            />
            {step > 0 && (
              <PrimaryButton
                label={t('back')}
                onPress={goBack}
                style={{ marginTop: 12, backgroundColor: "#4A4A4A" }}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <ContactsModal
        contactsModalVisible={contactsModalVisible}
        setContactsModalVisible={setContactsModalVisible}
        contactsSlideAnim={contactsSlideAnim}
        insets={insets}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredContacts={filteredContacts}
        handleContactSelect={handleContactSelect}
        loadingContacts={loadingContacts}
      />
      
      <CountriesModal />
    </SafeAreaView>
  );
}

/* ---------- Step Components ---------- */

function StepCountry({ country, onOpen }) {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={{ marginTop: 16 }}>
      <Text style={TopUpStyles.sectionTitle}>{t('selectCountryYouWantToSend')}</Text>
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
          <Text style={{ fontSize: 24, marginEnd: 12 }}>
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
      message: "phoneNumberStartWith7"
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
        message: "invalidPrefix"
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

function StepPay({
  summary,
  onEditNumber,
}) {
  const { t } = useTranslation();
  
  return (
    <View style={{ marginTop: 12 }}>
      <View style={TopUpStyles.editHeader}>
        <Text style={TopUpStyles.sectionTitle}>{t('confirmTopup')}</Text>
        <TouchableOpacity onPress={onEditNumber}>
          <Text style={TopUpStyles.editLink}>{t('changeNumber')}</Text>
        </TouchableOpacity>
      </View>

      <View style={TopUpStyles.summaryCard}>
        <View style={TopUpStyles.summaryRow}>
          <Text style={TopUpStyles.summaryKey}>{t('receiverNumber')}</Text>
          <Text style={TopUpStyles.summaryValue}>{summary.mobile}</Text>
        </View>
        <View style={TopUpStyles.summaryRow}>
          <Text style={TopUpStyles.summaryKey}>{t('common.operator')}</Text>
          <Text style={TopUpStyles.summaryValue}>{summary.operator}</Text>
        </View>
        {summary.product?.productName && (
          <View style={TopUpStyles.summaryRow}>
            <Text style={TopUpStyles.summaryKey}>Product</Text>
            <Text style={TopUpStyles.summaryValue}>
              {summary.product.productName?.en || summary.product.productName}
            </Text>
          </View>
        )}
        <View style={TopUpStyles.summaryRow}>
          <Text style={TopUpStyles.summaryKey}>{t('amount')}</Text>
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
            {t('totalAmount')}
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

// Wrapper component with QueryClientProvider
export default function MerchantTopupFlowScreenWrapper({ navigation }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MerchantTopupFlowScreen navigation={navigation} />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    margin: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    height: '100%',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  contactSeparator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 72,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
});