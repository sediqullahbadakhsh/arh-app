//screens/topupscreen/TopupFlowScreen1.jsx
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
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from "@expo/vector-icons";
import LottieView from 'lottie-react-native';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";
import PrimaryButton from "../../components/PrimaryButton";
import { codeToFlag } from "../../utils/flag";
import { DIAL_CODES, guessOperator } from "../../constants/dialing";
import {
  getCountries,
  makeRecharge,
  getCurrencies,
  getSlabs,
  getOrderStatus,
  activateBundleByCustomer,
} from "../../services/customerAPIOrder";
import { getSetaraganMnoId } from "../../utils/getCompanyIdForSetaragan";
import * as Contacts from 'expo-contacts';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StepCountry from "./StepCountry";
import StepNumber from "./StepNumber";
import StepAmount from "./StepAmount";
import StepPay from "./StepPay";
import StepPayBundle from "./StepPayBundle";
import TopUpStyles from "./TopupStyle";
import formatLocal from "../../utils/formatLocal";
import { useTranslation } from "react-i18next";
import { useStripe } from "@stripe/stripe-react-native";
import { scale } from "../../utils/normalizeSize";
import { validatePromoCode } from "../../services/promoCodeApi";

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
const BASE_STEPS = { COUNTRY: 0, NUMBER: 1, AMOUNT: 2, PAY: 3 };

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
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 1,
    },
  },
});

const QUERY_KEYS = {
  COUNTRIES: ['countries'],
  CURRENCIES: ['currencies'],
  SLABS: ['slabs'],
  ORDER_STATUS: (orderId) => ['order-status', orderId],
  PROMO_CODE: (code, amount) => ['promo-code', code, amount],
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
    staleTime: 30 * 60 * 1000,
    onError: (error) => {
      console.error('Error fetching countries:', error);
      Alert.alert(t('common.error'), t('failedToLoadCountries'));
    },
  });
};

const useCurrencies = () => {
  return useQuery({
    queryKey: QUERY_KEYS.CURRENCIES,
    queryFn: async () => {
      const response = await getCurrencies();
      return response;
    },
    staleTime: 5 * 60 * 1000,
  });
};

const useSlabs = () => {
  return useQuery({
    queryKey: QUERY_KEYS.SLABS,
    queryFn: async () => {
      const response = await getSlabs();
      return response;
    },
    staleTime: 10 * 60 * 1000,
  });
};

const usePromoCodeValidation = () => {
  const { t } = useTranslation();
  
  return useMutation({
    mutationFn: async ({ code, orderAmount }) => {
      const response = await validatePromoCode({
        code,
        orderAmount
      });
      return response;
    },
    onSuccess: (data) => {
      if (!data.status) {
        throw new Error(data.error || t('promoCode.invalidCode'));
      }
    },
    onError: (error) => {
      console.error('Promo code validation error:', error);
    },
  });
};

const useRechargeMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload) => {
      const response = await makeRecharge(payload);
      return response;
    },
    onError: (error) => {
      console.error('Recharge mutation error:', error);
    },
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
    enabled: false,
    staleTime: Infinity,
    cacheTime: Infinity,
    onError: (error) => {
      console.error('Error loading contacts:', error);
      Alert.alert(t('common.error'), t('failedToLoadContacts'));
    },
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

const PromoCodeModal = React.memo(({ 
  visible, 
  onClose, 
  promoCode = "", 
  setPromoCode, 
  validatingPromo, 
  promoError = "", 
  onApply 
}) => {
  const { t } = useTranslation();
  
  const handleTextChange = useCallback((text) => {
    setPromoCode(text.toUpperCase());
  }, [setPromoCode]);

  const handleApply = useCallback(() => {
    onApply?.();
  }, [onApply]);

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.promoModalContent}>
          <View style={styles.promoModalHeader}>
            <Text style={styles.promoModalTitle}>{t('promoCode.applyPromo')}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.promoCloseButton}>
              <Text style={styles.promoCloseButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.promoInputContainer}>
            <TextInput
              style={styles.promoInput}
              placeholder={t('promoCode.enterCodePlaceholder')}
              value={promoCode}
              onChangeText={handleTextChange}
              placeholderTextColor="#999"
              autoCapitalize="characters"
              autoFocus={true}
            />
          </View>

          {promoError ? (
            <View style={styles.promoErrorContainer}>
              <Text style={styles.promoErrorText}>{promoError}</Text>
            </View>
          ) : null}

          <View style={styles.promoModalButtons}>
            <TouchableOpacity 
              style={[styles.promoModalButton, styles.promoCancelButton]} 
              onPress={handleClose}
              disabled={validatingPromo}
            >
              <Text style={styles.promoCancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.promoModalButton, 
                styles.promoApplyButton, 
                (!promoCode.trim() || validatingPromo) && styles.promoDisabledButton
              ]} 
              onPress={handleApply}
              disabled={!promoCode.trim() || validatingPromo}
            >
              {validatingPromo ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.promoApplyButtonText}>{t('promoCode.apply')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

function TopupFlowScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { confirmPayment } = useStripe();
  const lastStep = BASE_STEPS.PAY;
  const [step, setStep] = useState(0);
  const [orderStatus, setOrderStatus] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [contactsModalVisible, setContactsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [country, setCountry] = useState(null);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [exchangeRate, setExchangeRate] = useState(null);
  const [slabPercentage, setSlabPercentage] = useState(0);
  const [serviceType, setServiceType] = useState('recharge');
  const [showPopularAmounts, setShowPopularAmounts] = useState(true);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [paymentMethodId, setPaymentMethodId] = useState(null);
  const [product, setProduct] = useState(null);
  const [customAfn, setCustomAfn] = useState("");
  const [localNumber, setLocalNumber] = useState("");
  const [cardDetailsComplete, setCardDetailsComplete] = useState(false);
  const [bundleActivated, setBundleActivated] = useState(false);
  const [contactsSlideAnim] = useState(new Animated.Value(screenHeight));
  const [countriesSlideAnim] = useState(new Animated.Value(screenHeight));
  const insets = useSafeAreaInsets();
  const continueButtonAnim = useRef(new Animated.Value(0)).current;
  const pollingRef = useRef(null); 
  const lottieRef = useRef(null);
  const [promoModalVisible, setPromoModalVisible] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);

  const { data: countries = [], isLoading: loadingCountries } = useCountries();
  const { data: currenciesData, isLoading: loadingCurrencies } = useCurrencies();
  const { data: slabsData, isLoading: loadingSlabs } = useSlabs();
  const promoCodeValidation = usePromoCodeValidation();
  const rechargeMutation = useRechargeMutation();
  const { 
    data: contacts = [], 
    isLoading: loadingContacts,
    refetch: refetchContacts 
  } = useContacts();

  const dial = DIAL_CODES[country?.countryCode] || "";
  const operator = guessOperator(country?.countryCode, localNumber.replace(/\D/g, ""));

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
        
        console.log(`Poll ${pollCount}: Topup order status:`, currentStatus);
        
        setOrderStatus(currentStatus);
        setOrderDetails(prev => ({
          ...prev,
          ...statusResponse.data
        }));

        if (
          currentStatus === ORDER_STATUS.SUCCEEDED || 
          currentStatus === ORDER_STATUS.FAILED || 
          pollCount >= maxPolls
        ) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          
          if (pollCount >= maxPolls) {
            console.log("Max polling attempts reached for topup order");
          }
        }
      } catch (error) {
        console.error("Error polling topup order status:", error);
        if (pollCount >= maxPolls) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    }, 3000);
  };

  const calculateTotalAfnAmount = (baseAfn, productItem = null) => {
    const targetProduct = productItem || product;
    
    // If we have product with totalAmountInProductCurrency, use that
    if (targetProduct?.totalAmountInProductCurrency) {
      return parseFloat(targetProduct.totalAmountInProductCurrency);
    }
    
    const baseAmount = parseFloat(baseAfn) || 0;
    
    if (!targetProduct) {
      return baseAmount;
    }

    let totalAmount = baseAmount;
    
    if (targetProduct.slabPercentage) {
      totalAmount += baseAmount * (targetProduct.slabPercentage / 100);
    }
    
    if (targetProduct.serviceSlabPercentage) {
      totalAmount += baseAmount * (targetProduct.serviceSlabPercentage / 100);
    }
    
    return totalAmount;
  };

  const calculateUsdAmount = (afnAmount, productItem = null) => {
    const targetProduct = productItem || product;
    
    // If we have product with totalAmountInUSD, use that
    if (targetProduct?.totalAmountInUSD) {
      return parseFloat(targetProduct.totalAmountInUSD);
    }
    
    if (!exchangeRate || !afnAmount) return 0;
    
    const totalAfn = calculateTotalAfnAmount(afnAmount, targetProduct);
    const usdAmount = totalAfn * exchangeRate;
    return parseFloat(usdAmount.toFixed(2));
  };

  const calculateBaseAmount = (afnAmount) => {
    if (!exchangeRate || !afnAmount) return 0;
    const baseAmount = parseFloat(afnAmount) * exchangeRate;
    return parseFloat(baseAmount.toFixed(2));
  };

  const calculateFeeAmount = (afnAmount, productItem = null) => {
    if (!exchangeRate || !afnAmount) return 0;
    
    const baseAmount = parseFloat(afnAmount) * exchangeRate;
    const targetProduct = productItem || product;
    let totalFee = 0;
    
    if (targetProduct?.slabPercentage) {
      totalFee += baseAmount * (targetProduct.slabPercentage / 100);
    }
    
    if (targetProduct?.serviceSlabPercentage) {
      totalFee += baseAmount * (targetProduct.serviceSlabPercentage / 100);
    }
    
    return parseFloat(totalFee.toFixed(2));
  };

  const getActualAfnAmount = () => {
    console.log("getActualAfnAmount debug:", {
      product,
      productPrice: product?.price,
      productBasePrice: product?.basePrice,
      customAfn
    });
    
    if (product) {
      // First check for customAmount (for custom topups)
      if (product.customAmount && !isNaN(parseFloat(product.customAmount))) {
        return parseFloat(product.customAmount);
      }
      // Then check for price
      if (product.price && !isNaN(parseFloat(product.price))) {
        return parseFloat(product.price);
      }
      // Then check for basePrice
      if (product.basePrice && !isNaN(parseFloat(product.basePrice))) {
        return parseFloat(product.basePrice);
      }
    }
    
    // Fallback to customAfn input
    if (customAfn && !isNaN(parseFloat(customAfn))) {
      return parseFloat(customAfn);
    }
    
    return 0;
  };

  const afn = getActualAfnAmount();
  const totalAfn = calculateTotalAfnAmount(afn);
  const usd = calculateUsdAmount(afn);

  // Set initial country
  useEffect(() => {
    if (countries.length > 0 && !country) {
      const afgCountry = countries.find((c) => c.countryCode === "AF") || countries[0];
      setCountry(afgCountry);
    }
  }, [countries]);

  // Update exchange rate and slab percentage
  useEffect(() => {
    if (currenciesData && currenciesData.success && currenciesData.data && currenciesData.data.length > 0) {
      const afnToUsdRate = parseFloat(currenciesData.data[0].target_amount);
      const usdToAfnRate = parseFloat(currenciesData.data[0].source_amount);
      setExchangeRate(1 / usdToAfnRate);
    } else {
      setExchangeRate(0.012);
    }
  }, [currenciesData]);

  useEffect(() => {
    if (slabsData && slabsData.success && slabsData.data && slabsData.data.length > 0 && country) {
      const countrySlabs = slabsData.data.filter(slab => slab.countryId === country.id);
      const totalPercentage = countrySlabs.reduce((sum, slab) => {
        return sum + parseFloat(slab.percentage || 0);
      }, 0);
      setSlabPercentage(totalPercentage);
    } else {
      setSlabPercentage(0);
    }
  }, [slabsData, country]);

  // Update final amount
  useEffect(() => {
    let originalUsd = 0;
    
    if (product?.totalAmountInUSD) {
      originalUsd = parseFloat(product.totalAmountInUSD);
    } else {
      originalUsd = calculateUsdAmount(getActualAfnAmount());
    }
    
    const newFinalAmount = Math.max(0, originalUsd - discountAmount);
    setFinalAmount(parseFloat(newFinalAmount.toFixed(2)));
  }, [usd, discountAmount, product, customAfn, exchangeRate]);

  // Lottie animation
  useEffect(() => {
    if (lottieRef.current && (orderStatus === ORDER_STATUS.SUCCEEDED || orderStatus === ORDER_STATUS.FAILED)) {
      lottieRef.current.play();
    }
  }, [orderStatus]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Bundle activation
  const handleBundleActivated = () => {
    setBundleActivated(true);
    setTimeout(() => {
      setBundleActivated(false);
    }, 2000);
  };

  // Animation effects
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

  // Filter contacts
  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts;
    return contacts.filter(contact =>
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phoneNumbers?.some(phone =>
        phone.number?.includes(searchQuery)
      )
    );
  }, [searchQuery, contacts]);

  // Continue button animation
  useEffect(() => {
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

  // Promo code handling
  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError(t('promoCode.enterCode'));
      return;
    }

    setPromoError("");

    try {
      let orderAmount = getActualAfnAmount();
      
      if (product?.totalAmountInUSD) {
        const totalUsd = parseFloat(product.totalAmountInUSD);
        orderAmount = exchangeRate ? totalUsd / exchangeRate : orderAmount;
      }
      
      const response = await promoCodeValidation.mutateAsync({
        code: promoCode.trim(),
        orderAmount: orderAmount
      });

      let discount = 0;
      let baseUsdAmount = 0;
      
      if (product?.totalAmountInUSD) {
        baseUsdAmount = parseFloat(product.totalAmountInUSD);
      } else {
        baseUsdAmount = calculateUsdAmount(getActualAfnAmount());
      }
      
      if (response.discount_type === 'percentage') {
        discount = (baseUsdAmount * response.discount_value) / 100;
      } else {
        discount = response.discount_value;
      }

      if (response.max_discount && discount > response.max_discount) {
        discount = response.max_discount;
      }

      setDiscountAmount(discount);
      setAppliedPromoCode({
        code: promoCode.trim(),
        discount_type: response.discount_type,
        discount_value: response.discount_value,
        discount_amount: discount
      });
      
      setPromoModalVisible(false);
      Alert.alert(t('success'), t('promoCode.appliedSuccessfully'));
    } catch (error) {
      setPromoError(error.message || t('promoCode.invalidCode'));
    }
  };

  const handleRemovePromoCode = () => {
    setAppliedPromoCode(null);
    setDiscountAmount(0);
    setPromoError("");
  };

  const openPromoModal = () => {
    setPromoModalVisible(true);
    setPromoError("");
  };

  const closePromoModal = () => {
    setPromoModalVisible(false);
    setPromoError("");
  };

  // Handle resend order
  useEffect(() => {
    const resendOrder = route.params?.resendOrder;
    
    if (resendOrder) {
      setStep(BASE_STEPS.COUNTRY);
      setProduct(null);
      setCustomAfn("");
      
      setTimeout(() => {
        if (resendOrder.receiver) {
          const cleanNumber = resendOrder.receiver.replace(/\D/g, "");
          setLocalNumber(cleanNumber);
        }
        
        if (resendOrder.amount) {
          const amount = parseFloat(resendOrder.amount);
          if (!isNaN(amount) && amount > 0) {
            setCustomAfn(amount.toString());
            setProduct(null);
          }
        }

        setTimeout(() => {
          setStep(BASE_STEPS.AMOUNT);
        }, 300);
      }, 100);
    }
  }, [route.params?.resendOrder]);


  const validateMobileNumber = (number, dialCode = "+93") => {
    const cleanNumber = number.replace(/\D/g, "");
    
    let processedNumber = cleanNumber;
    if (cleanNumber.startsWith('93')) {
      processedNumber = cleanNumber.substring(2);
    }
    
    if (processedNumber.length > 0 && !processedNumber.startsWith('7')) {
      return {
        isValid: false,
        message: "mobileNumberStartWith7"
      };
    }

    if (processedNumber.startsWith('75')) {
      return {
        isValid: false,
        message: "invalidPrefix75"
      };
    }

    if (processedNumber.length >= 2) {
      const prefix = processedNumber.substring(0, 2);
      const VALID_PREFIXES = ['70','71', '72', '73', '74', '76', '77', '78', '79'];
      if (!VALID_PREFIXES.includes(prefix)) {
        return {
          isValid: false,
          message: `invalidPrefix ${prefix}`
        };
      }
    }
    
    if (processedNumber.length > 0 && processedNumber.length !== 9) {
      return {
        isValid: false,
        message: "mobileNumberMustBe9Digits"
      };
    }
    
    return {
      isValid: true,
      message: ""
    };
  };


  const canNext =
    (step === BASE_STEPS.COUNTRY && !!country) ||
    (step === BASE_STEPS.NUMBER && localNumber.replace(/\D/g, "").length === 9 && validateMobileNumber(localNumber).isValid) ||
    (step === BASE_STEPS.AMOUNT && serviceType === 'recharge' && afn > 0) ||
    (step === BASE_STEPS.AMOUNT && serviceType === 'bundle' && product) ||
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

  const handleContactSelect = useCallback((phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert(t('error'), t('invalidPhoneNumber'));
      return;
    }

    console.log("Selected contact phone number:", phoneNumber);
    

    let normalizedNumber = normalizePhoneNumber(phoneNumber, dial.replace('+', ''));
    
    console.log("Normalized number after removing country codes:", normalizedNumber);
    
    normalizedNumber = normalizedNumber.replace(/^0+/, '');
    
    console.log("Final normalized number:", normalizedNumber);
    
    if (normalizedNumber.length < 7) {
      Alert.alert(t('error'), t('invalidPhoneNumberLength'));
      return;
    }

    setLocalNumber(normalizedNumber);

    setContactsModalVisible(false);
    setSearchQuery('');
    

   
  }, [dial, t]);

  // Handle popular amount selection
  const handleSelectPopularAmount = (selectedAmount) => {
    if (selectedAmount.product) {
      setProduct(selectedAmount.product);
    }
    
    setCustomAfn("");
    
    setTimeout(() => {
      setStep(BASE_STEPS.PAY);
    }, 100);
  };

  // Recharge function with manual polling
  const recharge = async () => {
    if (!paymentMethodId) {
      Alert.alert(t('error'), t('pleaseEnterCardDetails'));
      return;
    }

    const operatorId = getSetaraganMnoId(localNumber);

    if (!operatorId) {
      Alert.alert("Invalid Number", "The number you have added is not matching with any mobile network in Afghanistan");
      return;
    }

    // Get amounts directly from product or custom input
    let afnAmount = 0;
    let originalUsdAmount = 0;
    
    if (product) {
      afnAmount = parseFloat(product.basePrice) || parseFloat(product.price) || 0;
      originalUsdAmount = parseFloat(product.totalAmountInUSD) || 0;
    } else if (customAfn && !isNaN(parseFloat(customAfn))) {
      afnAmount = parseFloat(customAfn);
      originalUsdAmount = calculateUsdAmount(afnAmount);
    }

    if (afnAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount greater than 0");
      return;
    }

    const payload = {
      amount: afnAmount,
      companyId: "",
      countryId: country?.id,
      currency: "AFN",
      operator: operatorId,
      productId: product?.id || null,
      receiver: localNumber.replace(/\D/g, ""),
      source: "stripe_card",
      cardCurrency: "USD",
      cardAmount: finalAmount,
      confirmNow: true,
      paymentMethodId: paymentMethodId,
      customAmount: customAfn || afnAmount,
      serviceType: serviceType,
      promo_code: appliedPromoCode?.code || null,
      finalDiscountAmount: discountAmount,
      promodiscountamoun: discountAmount,
    };

    console.log("Recharge payload:", payload);

    try {
      const response = await rechargeMutation.mutateAsync(payload);
      
      if (response.status === "queued" || response.status === "processing" || response.success) {
        const newOrderDetails = {
          orderId: response.orderId,
          txnNumber: response.txnNumber || `TXN-${Date.now()}`,
          mobile: `${dial} ${formatLocal(localNumber)}`,
          amountAfn: afnAmount,
          usdAmount: finalAmount,
          originalUsdAmount: originalUsdAmount,
          discountAmount: discountAmount,
          promoCode: appliedPromoCode?.code,
          date: new Date().toISOString(),
          operator: operator?.name || "Unknown",
          serviceType: serviceType,
          message: "Topup request submitted successfully!",
          status: ORDER_STATUS.QUEUED,
        };
        
        setOrderDetails(newOrderDetails);
        setOrderStatus(ORDER_STATUS.QUEUED);
        
        if (response.orderId) {
          await startPollingOrderStatus(response.orderId);
        }
      } else if (response.status === "requires_action") {
        const { error } = await confirmPayment(response.nextAction.clientSecret);
        if (error) {
          throw new Error(error.message);
        } else {
          const newOrderDetails = {
            orderId: response.orderId,
            txnNumber: response.txnNumber || `TXN-${Date.now()}`,
            mobile: `${dial} ${formatLocal(localNumber)}`,
            amountAfn: afnAmount,
            usdAmount: finalAmount,
            originalUsdAmount: originalUsdAmount,
            discountAmount: discountAmount,
            promoCode: appliedPromoCode?.code,
            date: new Date().toISOString(),
            operator: operator?.name || "Unknown",
            serviceType: serviceType,
            message: "Payment requires additional action.",
            status: ORDER_STATUS.QUEUED,
          };
          
          setOrderDetails(newOrderDetails);
          setOrderStatus(ORDER_STATUS.QUEUED);
          
          if (response.orderId) {
            await startPollingOrderStatus(response.orderId);
          }
        }
      } else {
        throw new Error(response.error || 'Payment failed');
      }
    } catch (error) {
      const message = error.response?.data?.error || error.message || t('paymentFailedGeneric');
      
      setOrderStatus(ORDER_STATUS.FAILED);
      setOrderDetails({
        mobile: `${dial} ${formatLocal(localNumber)}`,
        amountAfn: serviceType === 'bundle' ? (product?.price || 0) : afnAmount,
        usdAmount: finalAmount,
        originalUsdAmount: originalUsdAmount,
        discountAmount: discountAmount,
        promoCode: appliedPromoCode?.code,
        productName: serviceType === 'bundle' ? product?.productName : undefined,
        date: new Date().toISOString(),
        operator: operator?.name || "Unknown",
        error: message,
        serviceType: serviceType,
      });
      
      Alert.alert("Error", message);
    }
  };

  const getPaymentSummaryForBundle = () => {
    console.log("getPaymentSummaryForBundle debug:", {
      product,
      price: product?.price,
      basePriceInUSD: product?.basePriceInUSD,
      totalAmountInUSD: product?.totalAmountInUSD,
      serviceSlabPercentage: product?.serviceSlabPercentage,
      finalAmount,
      discountAmount
    });
    
    // Get values directly from product
    let afnAmount = 0;
    let baseUsd = 0;
    let totalUsd = 0;
    let feeUsd = 0;
    
    if (product) {
      afnAmount = parseFloat(product.price) || parseFloat(product.basePrice) || 0;
      baseUsd = parseFloat(product.basePriceInUSD) || calculateBaseAmount(afnAmount);
      totalUsd = parseFloat(product.totalAmountInUSD) || calculateUsdAmount(afnAmount);
      
      // Calculate fee: totalAmountInUSD - basePriceInUSD
      feeUsd = Math.max(0, totalUsd - baseUsd);
    }
    
    const slabPercent = product?.slabPercentage || 0;
    const serviceSlabPercent = product?.serviceSlabPercentage || 0;
    
    console.log("Bundle Payment Summary Values:", {
      afnAmount,
      baseUsd,
      totalUsd,
      feeUsd,
      slabPercent,
      serviceSlabPercent,
      finalAmount,
      discountAmount
    });
    
    return {
      mobile: `${dial} ${formatLocal(localNumber)}`,
      afn: afnAmount,
      totalAfn: product?.totalAmountInProductCurrency || afnAmount,
      baseAmount: baseUsd,
      feeAmount: feeUsd,
      totalAmount: totalUsd,
      slabPercentage: slabPercent,
      serviceSlabPercentage: serviceSlabPercent,
      exchangeRate,
      product: product,
      serviceType: serviceType,
      finalAmount: finalAmount,
      discountAmount: discountAmount,
      appliedPromoCode: appliedPromoCode,
      
      onApplyPromoCode: openPromoModal,
      onRemovePromoCode: handleRemovePromoCode,
      openPromoModal: openPromoModal,
      closePromoModal: closePromoModal,
      validatingPromo: promoCodeValidation.isLoading,
      promoError: promoError
    };
  };

  const getPaymentSummaryForRecharge = () => {
    console.log("getPaymentSummaryForRecharge debug:", {
      product,
      basePrice: product?.basePrice,
      basePriceInUSD: product?.basePriceInUSD,
      totalAmountInUSD: product?.totalAmountInUSD,
      serviceSlabPercentage: product?.serviceSlabPercentage,
      customAfn,
      finalAmount,
      discountAmount
    });
    
    // Get values directly from product
    let afnAmount = 0;
    let baseUsd = 0;
    let totalUsd = 0;
    let feeUsd = 0;
    
    if (product) {
      // Use product values directly
      afnAmount = parseFloat(product.basePrice) || 0;
      baseUsd = parseFloat(product.basePriceInUSD) || 0;
      totalUsd = parseFloat(product.totalAmountInUSD) || 0;
      
      // Calculate fee: totalAmountInUSD - basePriceInUSD
      feeUsd = Math.max(0, totalUsd - baseUsd);
    } else if (customAfn && !isNaN(parseFloat(customAfn))) {
      // For custom amounts without product
      afnAmount = parseFloat(customAfn);
      baseUsd = calculateBaseAmount(afnAmount);
      totalUsd = calculateUsdAmount(afnAmount);
      feeUsd = calculateFeeAmount(afnAmount);
    }
    
    const slabPercent = product?.slabPercentage || slabPercentage;
    const serviceSlabPercent = product?.serviceSlabPercentage || 0;
    
    console.log("Payment Summary Values:", {
      afnAmount,
      baseUsd,
      totalUsd,
      feeUsd,
      slabPercent,
      serviceSlabPercent,
      finalAmount,
      discountAmount
    });
    
    return {
      mobile: `${dial} ${formatLocal(localNumber)}`,
      afn: afnAmount,
      totalAfn: product?.totalAmountInProductCurrency || afnAmount,
      baseAmount: baseUsd,
      feeAmount: feeUsd,
      totalAmount: totalUsd,
      slabPercentage: slabPercent,
      serviceSlabPercentage: serviceSlabPercent,
      exchangeRate,
      product: product,
      serviceType: serviceType,
      finalAmount: finalAmount,
      discountAmount: discountAmount,
      appliedPromoCode: appliedPromoCode,
      
      onApplyPromoCode: openPromoModal,
      onRemovePromoCode: handleRemovePromoCode,
      openPromoModal: openPromoModal,
      closePromoModal: closePromoModal,
      validatingPromo: promoCodeValidation.isLoading,
      promoError: promoError
    };
  };

  // Reset flow
  const resetFlow = () => {
    setOrderStatus(null);
    setOrderDetails(null);
    setStep(0);
    setProduct(null);
    setCustomAfn("");
    setLocalNumber("");
    setCardDetailsComplete(false);
    setPaymentMethodId(null);
    setAppliedPromoCode(null);
    setDiscountAmount(0);
    setFinalAmount(0);
    setPromoCode("");
    setPromoError("");
    setPromoModalVisible(false);
    
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    
    if (lottieRef.current) {
      lottieRef.current.reset();
    }
  };

  const getStatusMessage = () => {
    switch (orderStatus) {
      case ORDER_STATUS.QUEUED:
        return serviceType === 'bundle' 
          ? "Your bundle activation request has been submitted and payment processed. Our backoffice team will activate your bundle shortly."
          : "Your topup has been queued and will be processed shortly.";
      case ORDER_STATUS.PROCESSING:
      case ORDER_STATUS.PENDING:
        return serviceType === 'bundle'
          ? "Your bundle activation is being processed by our backoffice team. Please wait..."
          : "Your topup is being processed. Please wait...";
      case ORDER_STATUS.SUCCEEDED:
        return serviceType === 'bundle'
          ? "Bundle activated successfully! Our team has processed your request."
          : t("topupCompletedSuccessfully");
      case ORDER_STATUS.FAILED:
        return serviceType === 'bundle'
          ? "Bundle activation failed. Please contact support if this continues."
          : "Topup failed. ";
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
            source={require('../../../assets/lotties/succcess.json')}
            autoPlay={true}
            loop={false}
            style={TopUpStyles.lottieAnimation}
          />
        );
      case ORDER_STATUS.FAILED:
        return (
          <LottieView
            ref={lottieRef}
            source={require('../../../assets/lotties/error.json')}
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
        return serviceType === 'bundle' ? "Request Submitted" : "Topup Queued";
      case ORDER_STATUS.PROCESSING:
      case ORDER_STATUS.PENDING:
        return serviceType === 'bundle' ? "Processing Request" : t("processingTopup");
      case ORDER_STATUS.SUCCEEDED:
        return serviceType === 'bundle' ? "Bundle Activated!" : t("topupSuccessful");
      case ORDER_STATUS.FAILED:
        return serviceType === 'bundle' ? "Activation Failed" : t("topupFailed");
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


const filteredCountries = useMemo(() => {
  let availableCountries = countries.filter(c => 
    c.countryCode !== 'IR' && c.countryName !== 'Iran'
  );
  
  if (!countrySearch) return availableCountries;
  
  return availableCountries.filter(c =>
    c.countryName?.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.countryCode?.toLowerCase().includes(countrySearch.toLowerCase())
  );
}, [countries, countrySearch]);

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

  const OrderStatusScreen = () => {
    const receiptCaptureRef = useRef(null);
    const [hasMediaPermission, setHasMediaPermission] = useState(null);
    const [isCapturing, setIsCapturing] = useState(false);

    const captureReceipt = async () => {
      try {
        setIsCapturing(true);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (receiptCaptureRef.current) {
          const uri = await captureRef(receiptCaptureRef.current, {
            format: 'png',
            quality: 1.0,
            result: 'tmpfile',
          });
          
          return uri;
        } else {
          throw new Error('Receipt capture ref not available');
        }
      } catch (error) {
        console.error('Error capturing receipt:', error);
        throw error;
      } finally {
        setIsCapturing(false);
      }
    };

    const shareReceipt = async () => {
      try {
        if (isCapturing) {
          Alert.alert('Please Wait', 'Preparing receipt for sharing...');
          return;
        }

        const receiptUri = await captureReceipt();
        
        if (receiptUri) {
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(receiptUri, {
              mimeType: 'image/png',
              dialogTitle: 'Share Receipt',
              UTI: 'public.png'
            });
          } else {
            const shareOptions = {
              url: receiptUri,
              type: 'image/png',
              title: 'Share Receipt'
            };

            await Share.share(shareOptions);
          }
        } else {
          throw new Error('Failed to capture receipt');
        }
      } catch (error) {
        console.error('Error sharing receipt:', error);
        
        const receiptText = `
🎫 Transaction Receipt
Total Amount: ${orderDetails?.amountAfn} AFN
Receiver: ${orderDetails?.mobile}
Status: ${orderStatus === ORDER_STATUS.SUCCEEDED ? 'Succeeded' : orderStatus === ORDER_STATUS.FAILED ? 'Failed' : 'Processing'}
Date & Time: ${new Date(orderDetails?.date).toLocaleString()}
Transaction ID: ${orderDetails?.txnNumber}

Thank you for using our service!
        `.trim();

        await Share.share({
          message: receiptText,
          title: 'Transaction Receipt',
        });
      }
    };

    const downloadReceipt = async () => {
      try {
        if (isCapturing) {
          Alert.alert('Please Wait', 'Preparing receipt for download...');
          return;
        }

        if (!hasMediaPermission) {
          Alert.alert(
            'Permission Required',
            'Please grant media library permissions to download receipts',
            [{ text: 'OK' }]
          );
          return;
        }

        const receiptUri = await captureReceipt();
        
        if (receiptUri) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `Receipt-${orderDetails?.txnNumber}-${timestamp}.png`;
          
          const asset = await MediaLibrary.createAssetAsync(receiptUri);
          const album = await MediaLibrary.getAlbumAsync('Receipts');
          
          if (album) {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          } else {
            await MediaLibrary.createAlbumAsync('Receipts', asset, false);
          }
          
          Alert.alert(
            'Download Successful',
            'Receipt has been saved to your gallery',
            [{ text: 'OK' }]
          );
        } else {
          throw new Error('Failed to capture receipt');
        }
      } catch (error) {
        console.error('Error downloading receipt:', error);
        Alert.alert(
          'Download Error',
          'Failed to download receipt. Please try again.',
          [{ text: 'OK' }]
        );
      }
    };

    const ReceiptContent = React.forwardRef((props, ref) => (
      <View ref={ref} style={styles.receiptCaptureContainer}>
        <View style={styles.captureHeader}>
          <Image
            source={require('../../../assets/logoV.png')} 
            style={styles.captureLogo}
            resizeMode="contain"
          />
          <Text style={styles.captureTitle}>TRANSACTION RECEIPT</Text>
        </View>

        <View style={styles.captureStatusSection}>
          <Text style={styles.captureStatusTitle}>
            {getStatusTitle()}
          </Text>
        </View>

        <View style={styles.captureDetails}>
          <View style={styles.captureDetailRow}>
            <Text style={styles.captureDetailLabel}>Transaction ID:</Text>
            <Text style={styles.captureDetailValue}>{orderDetails?.txnNumber}</Text>
          </View>
          
          <View style={styles.captureDetailRow}>
            <Text style={styles.captureDetailLabel}>Date & Time:</Text>
            <Text style={styles.captureDetailValue}>
              {new Date(orderDetails?.date).toLocaleString()}
            </Text>
          </View>
          
          <View style={styles.captureDetailRow}>
            <Text style={styles.captureDetailLabel}>Receiver:</Text>
            <Text style={styles.captureDetailValue}>{orderDetails?.mobile}</Text>
          </View>

          {orderDetails?.productName && (
            <View style={styles.captureDetailRow}>
              <Text style={styles.captureDetailLabel}>Bundle Plan:</Text>
              <Text style={styles.captureDetailValue}>
                {orderDetails?.productName?.en || orderDetails?.productName}
              </Text>
            </View>
          )}

          <View style={styles.captureDetailRow}>
            <Text style={styles.captureDetailLabel}>Status:</Text>
            <Text style={[styles.captureDetailValue, { color: getStatusColor() }]}>
              {getStatusTitle()}
            </Text>
          </View>
        </View>

        <View style={styles.captureAmountSection}>
          <Text style={styles.captureAmountLabel}>TOTAL AMOUNT</Text>
          <Text style={styles.captureAmountValue}>
            {orderDetails?.amountAfn} AFN
          </Text>
          <Text style={styles.captureAmountSubValue}>
            ${orderDetails?.usdAmount} USD
          </Text>
        </View>

        <View style={styles.captureFooter}>
          <Text style={styles.captureFooterText}>Thank you for using our service!</Text>
        </View>
      </View>
    ));

    return (
      <View style={{ flex: 1, paddingBottom: 100 }}>
        <View style={{ position: 'absolute', left: -1000 }}>
          <ReceiptContent ref={receiptCaptureRef} />
        </View>

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
              <Text style={TopUpStyles.detailLabel}>{t("receiverNumber")}</Text>
              <Text style={TopUpStyles.detailValue}>{orderDetails?.mobile}</Text>
            </View>
           
            {orderDetails?.productName && (
              <View style={TopUpStyles.detailRow}>
                <Text style={TopUpStyles.detailLabel}>Bundle Plan</Text>
                <Text style={TopUpStyles.detailValue}>
                  {orderDetails?.productName?.en || orderDetails?.productName}
                </Text>
              </View>
            )}
           
            <View style={TopUpStyles.detailRow}>
              <Text style={TopUpStyles.detailLabel}>{t("transactionIdLabel")}</Text>
              <Text style={TopUpStyles.detailValue}>{orderDetails?.txnNumber}</Text>
            </View>
            <View style={TopUpStyles.detailRow}>
              <Text style={TopUpStyles.detailLabel}>{t("date")}</Text>
              <Text style={TopUpStyles.detailValue}>
                {new Date(orderDetails?.date).toLocaleString()}
              </Text>
            </View>

            <View style={TopUpStyles.amountSection}>
              <Text style={TopUpStyles.amountLabel}>{t("totalAmount")}</Text>
              <View>
                <Text style={TopUpStyles.amountValue}>{orderDetails?.amountAfn} AFN</Text>
                <Text style={[TopUpStyles.detailValue, { fontSize: 14, textAlign: 'center' }]}>
                  ${orderDetails?.usdAmount} USD
                </Text>
              </View>
            </View>
          </View>

          <View style={TopUpStyles.statusMessageContainer}>
            <Text style={[TopUpStyles.statusMessage, { color: getStatusColor() }]}>
              {getStatusMessage()}
              {orderDetails?.error && `\n\nError: ${orderDetails.error}`}
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
              label={t("done")}
              onPress={() => {
                navigation.popToTop();
              }}
              style={{ width: "100%", marginTop: 20 }}
            />
          )}

          <TouchableOpacity onPress={resetFlow} style={TopUpStyles.moreButton}>
            <Text style={TopUpStyles.moreButtonText}>
              {orderStatus === ORDER_STATUS.FAILED ? t("tryAgain") : t("topupMore")}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  const loadingData = loadingCurrencies || loadingSlabs;
  const loading = rechargeMutation.isLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ServiceHeader title={t('mobileTopup')} onBack={orderStatus ? resetFlow : goBack} />

      {orderStatus ? (
        <OrderStatusScreen />
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
                loading={loadingCountries}
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
                setCustomAfn={setCustomAfn}
                usd={usd}
                afn={afn}
                totalAfn={totalAfn}
                onEditNumber={() => jumpTo(BASE_STEPS.NUMBER)}
                exchangeRate={exchangeRate}
                slabPercentage={slabPercentage}
                calculateBaseAmount={calculateBaseAmount}
                calculateFeeAmount={calculateFeeAmount}
                calculateTotalAfnAmount={calculateTotalAfnAmount}
                calculateUsdAmount={calculateUsdAmount}
                loadingData={loadingData}
                serviceType={serviceType}
                setServiceType={setServiceType}
                showPopularAmounts={showPopularAmounts}
                onSelectPopularAmount={handleSelectPopularAmount}
                showContinueButton={showContinueButton}
                continueButtonAnim={continueButtonAnim}
                onContinue={goNext}
                canContinue={canNext}
                country={country}
                localNumber={localNumber}
                dial={dial}
                onBundleActivated={handleBundleActivated}
                goNext={goNext}
              />
            )}

            {step === BASE_STEPS.PAY && (
              serviceType === 'bundle' ? (
                <StepPayBundle
                  summary={getPaymentSummaryForBundle()}
                  onEditAmount={() => jumpTo(BASE_STEPS.AMOUNT)}
                  onCardDetailsChange={(complete, methodId) => {
                    setCardDetailsComplete(complete);
                    if (methodId) setPaymentMethodId(methodId);
                  }}
                />
              ) : (
                <StepPay
                  summary={getPaymentSummaryForRecharge()}
                  onEditAmount={() => jumpTo(BASE_STEPS.AMOUNT)}
                  onCardDetailsChange={(complete, methodId) => {
                    setCardDetailsComplete(complete);
                    if (methodId) setPaymentMethodId(methodId);
                  }}
                />
              )
            )}

            {step !== BASE_STEPS.AMOUNT && (
              <>
                <PrimaryButton
                  label={
                    step === lastStep
                      ? `${t('pay')} $${finalAmount.toFixed(2)} USD`
                      : t('continue')
                  }
                  onPress={step === lastStep ? recharge : goNext}
                  style={{ marginTop: 24, opacity: canNext ? 1 : 0.5 }}
                  loading={loading}
                  disabled={step === lastStep && !paymentMethodId}
                />
                {step > 0 && (
                  <PrimaryButton
                    label={t('back')}
                    onPress={goBack}
                    style={{ marginTop: 12, marginBottom: 110, backgroundColor: "#6B7280" }}
                  />
                )}
              </>
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
      
      <PromoCodeModal
        visible={promoModalVisible}
        onClose={closePromoModal}
        promoCode={promoCode}
        setPromoCode={setPromoCode}
        validatingPromo={promoCodeValidation.isLoading}
        promoError={promoError}
        onApply={handleApplyPromoCode}
      />
    </SafeAreaView>
  );
}

export default function TopupFlowScreenWrapper({ navigation, route }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TopupFlowScreen navigation={navigation} route={route} />
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
  
  // Promo Modal Styles
  promoModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  promoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  promoModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  promoCloseButton: {
    padding: 4,
  },
  promoCloseButtonText: {
    fontSize: 24,
    color: '#666',
  },
  promoInputContainer: {
    marginBottom: 16,
  },
  promoInput: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
    backgroundColor: '#F8F9FA',
  },
  promoErrorContainer: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  promoErrorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
  },
  promoModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  promoModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoCancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  promoCancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  promoApplyButton: {
    backgroundColor: Colors.primary,
  },
  promoDisabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  promoApplyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Receipt Styles
  receiptCaptureContainer: {
    width: 350,
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  captureHeader: {
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    paddingBottom: 16,
  },
  captureLogo: {
    width: 200,
    height: 50,
    marginBottom: 10,
  },
  captureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
  },
  captureStatusSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  captureStatusTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  captureDetails: {
    marginBottom: 20,
  },
  captureDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  captureDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    flex: 1,
  },
  captureDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  captureAmountSection: {
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  captureAmountLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 8,
  },
  captureAmountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  captureAmountSubValue: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  captureFooter: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  captureFooterText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
});