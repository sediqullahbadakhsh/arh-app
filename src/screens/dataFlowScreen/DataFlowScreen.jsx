import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
import { useAuth } from "../../auth/AuthProvider";
import { 
  getCountries, 
  getDataProductsCustomer,
  getBundleCategories,
  getBundleTypes,
  getCurrencies,
  checkBundleOrderStatus,
  getSlabs
} from "../../services/merchantApi";
import { activateBundleByCustomer } from "../../services/customerAPIOrder";
import * as Contacts from 'expo-contacts';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import formatLocal from "../../utils/formatLocal";
import StepCountry from "./StepCountry";
import StepNumber from "./StepNumber";
import StepProducts from "./StepProducts";
import StepPay from "./StepPay";
import { useTranslation } from "react-i18next";
import LottieView from 'lottie-react-native';
import { useStripe } from "@stripe/stripe-react-native";
import { validatePromoCode } from "../../services/promoCodeApi";
import { scale } from "../../utils/normalizeSize";
import { useFocusEffect } from "@react-navigation/native";

const { height: screenHeight } = Dimensions.get('window');
const BASE_STEPS = { COUNTRY: 0, NUMBER: 1, PRODUCT: 2, PAY: 3 };

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
  BUNDLE_CATEGORIES: ['bundle-categories'],
  BUNDLE_TYPES: ['bundle-types'],
  DATA_PRODUCTS: (countryId, categoryId, typeId, prefix) => ['data-products', countryId, categoryId, typeId, prefix],
  CURRENCIES: ['currencies'],
  SLABS: ['slabs'],
  CONTACTS: ['contacts'],
};

const useCountries = () => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: QUERY_KEYS.COUNTRIES,
    queryFn: async () => {
      const response = await getCountries();
      return response?.data || [];
    },
    staleTime: 30 * 60 * 1000,
  });
};

const useBundleCategories = () => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: QUERY_KEYS.BUNDLE_CATEGORIES,
    queryFn: async () => {
      const response = await getBundleCategories();
      return response?.data || [];
    },
    staleTime: 30 * 60 * 1000,
  });
};

const useBundleTypes = () => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: QUERY_KEYS.BUNDLE_TYPES,
    queryFn: async () => {
      const response = await getBundleTypes();
      return response?.data || [];
    },
    staleTime: 30 * 60 * 1000,
  });
};

const useDataProducts = (countryId, categoryId, typeId, prefix, enabled = false) => {
  return useQuery({
    queryKey: QUERY_KEYS.DATA_PRODUCTS(countryId, categoryId, typeId, prefix),
    queryFn: async () => {
      if (!countryId) return [];
      
      const filter = {
        countryId,
        productCategoryId: categoryId,
        productTypeId: typeId,
        productFor: "BUNDLE"
      };
      
      const response = await getDataProductsCustomer(filter);
      console.log("Fetched Data Products:", response);
      return response?.data || [];
    },
    enabled: !!countryId && enabled,
    staleTime: 5 * 60 * 1000,
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

const useContacts = () => {
  return useQuery({
    queryKey: QUERY_KEYS.CONTACTS,
    queryFn: async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Contacts permission denied');
      }
      
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });
      
      return data || [];
    },
    enabled: false,
    staleTime: Infinity,
    cacheTime: Infinity,
  });
};

const useActivateBundle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload) => {
      const response = await activateBundleByCustomer(payload);
      return response;
    },
    onError: (error) => {
      console.error('Bundle activation mutation error:', error);
    },
  });
};

const usePromoCodeValidation = () => {
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
        throw new Error(data.error || 'Invalid promo code');
      }
    },
  });
};

const normalizePhoneNumber = (phoneNumber, countryDialCode) => {
  if (!phoneNumber) return "";
  
  let normalized = phoneNumber.replace(/\D/g, "");
  
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
  
 
  const sortedCountryCodes = [...countryCodes].sort((a, b) => b.length - a.length);
  
  for (const code of sortedCountryCodes) {
    if (normalized.startsWith(code)) {
      normalized = normalized.substring(code.length);
      break;
    }
  }
  
  normalized = normalized.replace(/^0+/, '');
  
  return normalized;
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
      <View style={promoModalStyles.modalOverlay}>
        <View style={promoModalStyles.modalContent}>
          <View style={promoModalStyles.modalHeader}>
            <Text style={promoModalStyles.modalTitle}>{t('promoCode.applyPromo')}</Text>
            <TouchableOpacity onPress={handleClose} style={promoModalStyles.closeButton}>
              <Text style={promoModalStyles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={promoModalStyles.promoInputContainer}>
            <TextInput
              style={promoModalStyles.promoInput}
              placeholder={t('promoCode.enterCodePlaceholder')}
              value={promoCode}
              onChangeText={handleTextChange}
              placeholderTextColor="#999"
              autoCapitalize="characters"
              autoFocus={true}
            />
          </View>

          {promoError ? (
            <View style={promoModalStyles.errorContainer}>
              <Text style={promoModalStyles.errorText}>{promoError}</Text>
            </View>
          ) : null}

          <View style={promoModalStyles.modalButtons}>
            <TouchableOpacity 
              style={[promoModalStyles.modalButton, promoModalStyles.cancelButton]} 
              onPress={handleClose}
              disabled={validatingPromo}
            >
              <Text style={promoModalStyles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                promoModalStyles.modalButton, 
                promoModalStyles.applyButton, 
                (!promoCode.trim() || validatingPromo) && promoModalStyles.disabledButton
              ]} 
              onPress={handleApply}
              disabled={!promoCode.trim() || validatingPromo}
            >
              {validatingPromo ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={promoModalStyles.applyButtonText}>{t('promoCode.apply')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

function DataFlowScreenMerchant({ navigation }) {
  const { user } = useAuth?.() || { user: null };
  const { confirmPayment } = useStripe();
  const { t } = useTranslation();
  const lastStep = BASE_STEPS.PAY;
  const [step, setStep] = useState(0);
  const [orderStatus, setOrderStatus] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [contactsModalVisible, setContactsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [country, setCountry] = useState(null);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [localNumber, setLocalNumber] = useState("");
  const [mobilePrefix, setMobilePrefix] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [product, setProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [exchangeRate, setExchangeRate] = useState(null);
  const [slabPercentage, setSlabPercentage] = useState(0);
  const [paymentMethodId, setPaymentMethodId] = useState(null);
  const [cardDetailsComplete, setCardDetailsComplete] = useState(false);
  const [contactsSlideAnim] = useState(new Animated.Value(screenHeight));
  const [countriesSlideAnim] = useState(new Animated.Value(screenHeight));
  const insets = useSafeAreaInsets();
  const [promoModalVisible, setPromoModalVisible] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const pollingRef = useRef(null);
  const lottieRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const dial = DIAL_CODES[country?.countryCode] || "";
  const operator = guessOperator(country?.countryCode, localNumber.replace(/\D/g, ""));
  const { data: countries = [], isLoading: loadingCountries, refetch: refetchCountries } = useCountries();
  const { data: bundleCategories = [], isLoading: loadingCategories, refetch: refetchCategories } = useBundleCategories();
  const { data: bundleTypes = [], isLoading: loadingTypes, refetch: refetchTypes } = useBundleTypes();
  const { data: currenciesData, isLoading: loadingCurrencies, refetch: refetchCurrencies } = useCurrencies();
  const { data: slabsData, isLoading: loadingSlabs, refetch: refetchSlabs } = useSlabs();
  const { 
    data: contacts = [], 
    isLoading: loadingContacts,
    refetch: refetchContacts 
  } = useContacts();
  const activateBundleMutation = useActivateBundle();
  const promoCodeValidation = usePromoCodeValidation();
  const shouldFetchProducts = step >= BASE_STEPS.PRODUCT && !!country?.id;
  const { 
    data: products = [], 
    isLoading: loadingProducts,
    refetch: refetchProducts 
  } = useDataProducts(
    country?.id, 
    selectedCategory?.id, 
    selectedType?.id,
    mobilePrefix,
    shouldFetchProducts
  );

  const handleNumberChange = (number) => {
    setLocalNumber(number);
    
    if (number.length >= 2) {
      const prefix = number.substring(0, 2);
      setMobilePrefix(prefix);
    } else {
      setMobilePrefix(null);
    }
  };


  const filteredProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    let filtered = products;
    

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((p) =>
        p.productName?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.price?.toString().includes(q)
      );
    }
    
 
    if (mobilePrefix) {
      filtered = filtered.filter((p) => {

        if (!p.prefix && p.prefix !== 0) return true;
        
        if (Array.isArray(p.prefix)) {
          return p.prefix.includes(parseInt(mobilePrefix));
        }
        
        return p.prefix.toString() === mobilePrefix;
      });
    }
    
    return filtered;
  }, [products, search, mobilePrefix]);

  
  useFocusEffect(
    useCallback(() => {
      console.log('DataFlowScreenMerchant focused');
      

      if (!orderStatus) {
        const refetchData = async () => {
          try {
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COUNTRIES });
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUNDLE_CATEGORIES });
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUNDLE_TYPES });
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CURRENCIES });
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SLABS });
            
            await Promise.all([
              refetchCountries(),
              refetchCategories(),
              refetchTypes(),
              refetchCurrencies(),
              refetchSlabs(),
            ]);
            
            console.log('All data refetched successfully');
          } catch (error) {
            console.error('Error refetching data:', error);
          }
        };
        
        refetchData();
      }
      
      return () => {
        console.log('DataFlowScreenMerchant unfocused');
      };
    }, [queryClient, orderStatus])
  );

  const startPollingOrderStatus = async (orderId) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    let pollCount = 0;
    const maxPolls = 60;

    pollingRef.current = setInterval(async () => {
      try {
        pollCount++;
        const statusResponse = await checkBundleOrderStatus(orderId);
        const currentStatus = statusResponse.data?.status;
        
        console.log(`Poll ${pollCount}: Bundle order status:`, currentStatus);
        
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
            console.log("Max polling attempts reached for bundle order");
          }
        }
      } catch (error) {
        console.error("Error polling bundle order status:", error);
        if (pollCount >= maxPolls) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    }, 3000);
  };

  useEffect(() => {
    if (countries.length > 0 && !country) {
      const afgCountry = countries.find((c) => c.countryCode === "AF") || countries[0];
      setCountry(afgCountry);
    }
  }, [countries]);

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


  useEffect(() => {
    if (product?.totalAmountInUSD) {
      const originalUsd = parseFloat(product.totalAmountInUSD);
      const newFinalAmount = Math.max(0, originalUsd - discountAmount);
      setFinalAmount(parseFloat(newFinalAmount.toFixed(2)));
    }
  }, [product, discountAmount]);

  useEffect(() => {
    if (lottieRef.current && (orderStatus === ORDER_STATUS.SUCCEEDED || orderStatus === ORDER_STATUS.FAILED)) {
      lottieRef.current.play();
    }
  }, [orderStatus]);

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

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts;
    return contacts.filter(contact =>
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phoneNumbers?.some(phone =>
        phone.number?.includes(searchQuery)
      )
    );
  }, [searchQuery, contacts]);

  const calculateUsdAmount = useCallback((afnAmount) => {
    if (!exchangeRate || !afnAmount) return 0;
    const usdAmount = afnAmount * exchangeRate;
    return parseFloat(usdAmount.toFixed(2));
  }, [exchangeRate]);

  const calculateBaseAmount = useCallback((afnAmount) => {
    if (!exchangeRate || !afnAmount) return 0;
    const baseAmount = parseFloat(afnAmount) * exchangeRate;
    return parseFloat(baseAmount.toFixed(2));
  }, [exchangeRate]);

  const calculateFeeAmount = useCallback((afnAmount) => {
    if (!exchangeRate || !afnAmount) return 0;
    const feeAmount = afnAmount * exchangeRate * (slabPercentage / 100);
    return parseFloat(feeAmount.toFixed(2));
  }, [exchangeRate, slabPercentage]);

  const calculateTotalAfnAmount = useCallback((baseAfn) => {
    const baseAmount = parseFloat(baseAfn) || 0;
    let totalAmount = baseAmount;
    
    if (slabPercentage > 0) {
      totalAmount += baseAmount * (slabPercentage / 100);
    }
    
    return totalAmount;
  }, [slabPercentage]);

  const afn = product ? parseFloat(product.price) : 0;
  const totalAfn = calculateTotalAfnAmount(afn);
  const usd = calculateUsdAmount(afn);
  const baseAmount = calculateBaseAmount(afn);
  const feeAmount = calculateFeeAmount(afn);

  const loadingData = loadingCurrencies || loadingSlabs;

  const canNext =
    (step === BASE_STEPS.COUNTRY && !!country) ||
    (step === BASE_STEPS.NUMBER && localNumber.replace(/\D/g, "").length >= 7) ||
    (step === BASE_STEPS.PRODUCT && !!product) ||
    (step === BASE_STEPS.PAY && cardDetailsComplete);

  const goBack = () => {
    if (orderStatus) {
      resetFlow();
    } else {
      step > 0 ? setStep(step - 1) : navigation.goBack();
    }
  };

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
    setMobilePrefix(null);
    setProduct(null);
  }, [country?.countryCode]);

  useEffect(() => {
    if (mobilePrefix && product) {
      if (product.prefix && product.prefix.toString() !== mobilePrefix) {
        setProduct(null);
      }
    }
  }, [mobilePrefix, product]);

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError(t('promoCode.enterCode'));
      return;
    }

    if (!product?.totalAmountInUSD) {
      setPromoError(t('promoCode.selectProductFirst'));
      return;
    }

    setPromoError("");

    try {
      const orderAmount = product?.totalAmountInUSD || afn;
      
      const response = await promoCodeValidation.mutateAsync({
        code: promoCode.trim(),
        orderAmount: orderAmount
      });

      let discount = 0;
      const baseUsdAmount = parseFloat(product.totalAmountInUSD);
      
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

  const activateBundle = async () => {
    if (!paymentMethodId) {
      Alert.alert(t('paymentRequired'), t('pleaseEnterCardDetails'));
      return;
    }

    const cleanedNumber = localNumber.replace(/\D/g, "");
    const receiverNumber = `${dial}${cleanedNumber}`.replace(/\s/g, "");
    
    const payload = {
      productId: product?.id,
      receiver: receiverNumber,
      currency: "AFN",
      cardCurrency: "USD",
      paymentMethodId: paymentMethodId,
      confirmNow: false,
      promo_code: appliedPromoCode?.code || null,
      finalDiscountAmount: discountAmount,
      promodiscountamoun: discountAmount,
    };

    console.log("Customer Bundle Activation Payload:", payload);

    try {
      setLoading(true);
      const res = await activateBundleMutation.mutateAsync(payload);
      
      console.log("Customer Bundle Activation Response:", res);
      
      if (res.status === true || res.orderId) {
        const newOrderDetails = {
          orderId: res.orderId,
          txnNumber: res.txnNumber || `TXN-${Date.now()}`,
          mobile: `${dial} ${formatLocal(localNumber)}`,
          amountAfn: product?.price,
          usdAmount: finalAmount,
          originalUsdAmount: product?.totalAmountInUSD || usd,
          discountAmount: discountAmount,
          promoCode: appliedPromoCode?.code,
          productName: product?.productName,
          date: new Date().toISOString(),
          operator: operator?.name || t('unknown'),
          message: res.message || t('bundleActivationRequestSubmitted'),
          status: ORDER_STATUS.QUEUED,
        };
        
        setOrderDetails(newOrderDetails);
        setOrderStatus(ORDER_STATUS.QUEUED);
        
        if (res.orderId) {
          await startPollingOrderStatus(res.orderId);
        }
        
      } else {
        setOrderStatus(ORDER_STATUS.FAILED);
        setOrderDetails({
          mobile: `${dial} ${formatLocal(localNumber)}`,
          amountAfn: product?.price,
          usdAmount: finalAmount,
          originalUsdAmount: product?.totalAmountInUSD || usd,
          discountAmount: discountAmount,
          promoCode: appliedPromoCode?.code,
          productName: product?.productName,
          date: new Date().toISOString(),
          error: res.error || t('bundleActivationRequestFailed'),
        });
        Alert.alert(t('error'), res.error || t('bundleActivationRequestFailed'));
      }
    } catch (error) {
      console.error("❌ Failed To Activate Customer Bundle:", error);
      
      setOrderStatus(ORDER_STATUS.FAILED);
      setOrderDetails({
        mobile: `${dial} ${formatLocal(localNumber)}`,
        amountAfn: product?.price,
        usdAmount: finalAmount,
        originalUsdAmount: product?.totalAmountInUSD || usd,
        discountAmount: discountAmount,
        promoCode: appliedPromoCode?.code,
        productName: product?.productName,
        date: new Date().toISOString(),
        error: error.response?.data?.error || error.message || t('bundleActivationFailed'),
      });
      
      Alert.alert(t('error'), error.response?.data?.error || error.message || t('bundleActivationFailed'));
    } finally {
      setLoading(false);
    }
  };

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
    
    if (normalizedNumber.length >= 2) {
      const prefix = normalizedNumber.substring(0, 2);
      setMobilePrefix(prefix);
      console.log("Extracted prefix:", prefix);
    } else {
      setMobilePrefix(null);
    }
    
    setContactsModalVisible(false);
    setSearchQuery('');
    
    Alert.alert(
      t('success'),
      t('contactNumberImportedSuccessfully', { number: normalizedNumber }),
      [{ text: t('ok') }]
    );
  }, [dial, t]);

  const resetFlow = () => {
    setOrderStatus(null);
    setOrderDetails(null);
    setStep(0);
    setProduct(null);
    setLocalNumber("");
    setMobilePrefix(null);
    setPaymentMethodId(null);
    setCardDetailsComplete(false);
    setAppliedPromoCode(null);
    setDiscountAmount(0);
    setFinalAmount(0);
    setPromoCode("");
    setPromoError("");
    setPromoModalVisible(false);
    setSelectedCategory(null);
    setSelectedType(null);
    setSearch("");
    
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    
    if (lottieRef.current) {
      lottieRef.current.reset();
    }
    
    if (country?.id) {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.DATA_PRODUCTS(country.id, selectedCategory?.id, selectedType?.id, mobilePrefix) 
      });
    }
  };

  const getStatusMessage = () => {
    switch (orderStatus) {
      case ORDER_STATUS.QUEUED:
        return t('bundleActivationSubmitted');
      case ORDER_STATUS.PROCESSING:
      case ORDER_STATUS.PENDING:
        return t('bundleProcessing');
      case ORDER_STATUS.SUCCEEDED:
        return t('bundleActivatedSuccessfully');
      case ORDER_STATUS.FAILED:
        return orderDetails?.error || t('bundleActivationFailedContactSupport');
      default:
        return t('processingYourRequest');
    }
  };

  const getStatusIcon = () => {
    switch (orderStatus) {
      case ORDER_STATUS.QUEUED:
        return (
          <View style={[styles.statusIconContainer, { backgroundColor: '#FFF3CD', borderColor: '#FFEAA7' }]}>
            <View style={styles.simpleClockContainer}>
              <Ionicons name="time-outline" size={48} color="#FFA500" />
            </View>
          </View>
        );
      case ORDER_STATUS.PROCESSING:
      case ORDER_STATUS.PENDING:
        return (
          <View style={[styles.statusIconContainer, { backgroundColor: '#D1ECF1', borderColor: '#B8DAE4' }]}>
            <View style={styles.simpleProcessingContainer}>
              <Ionicons name="sync" size={48} color={Colors.primary} />
            </View>
          </View>
        );
      case ORDER_STATUS.SUCCEEDED:
        return (
          <LottieView
            ref={lottieRef}
            source={require('../../../assets/lotties/succcess.json')}
            autoPlay={true}
            loop={false}
            style={styles.lottieAnimation}
            onAnimationFinish={() => {
              console.log('Success animation finished');
            }}
          />
        );
      case ORDER_STATUS.FAILED:
        return (
          <LottieView
            ref={lottieRef}
            source={require('../../../assets/lotties/error.json')}
            autoPlay={true}
            loop={false}
            style={styles.lottieAnimation}
            onAnimationFinish={() => {
              console.log('Error animation finished');
            }}
          />
        );
      default:
        return (
          <View style={[styles.statusIconContainer, { backgroundColor: '#E2E3E5', borderColor: '#D6D8DB' }]}>
            <Ionicons name="help-circle" size={36} color="#6C757D" />
          </View>
        );
    }
  };

  const getStatusTitle = () => {
    switch (orderStatus) {
      case ORDER_STATUS.QUEUED:
        return t('requestSubmitted');
      case ORDER_STATUS.PROCESSING:
      case ORDER_STATUS.PENDING:
        return t('processingRequest');
      case ORDER_STATUS.SUCCEEDED:
        return t('bundleActivated');
      case ORDER_STATUS.FAILED:
        return t('bundleActivationFailed');
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

  const getPaymentSummary = () => {
    return {
      mobile: `${dial} ${formatLocal(localNumber)}`,
      product: product,
      afn: afn,
      usd: usd,
      calculateBaseAmount: () => baseAmount,
      calculateFeeAmount: () => feeAmount,
      slabPercentage: slabPercentage,
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

  const handleCardDetailsChange = (complete, methodId) => {
    setCardDetailsComplete(complete);
    if (methodId) setPaymentMethodId(methodId);
  };

  const OrderStatusScreen = () => {
    return (
      <View style={{ flex: 1, paddingBottom: 100 }}>
        <ScrollView
          contentContainerStyle={{ 
            flexGrow: 1,
            padding: 24, 
            alignItems: "center",
            justifyContent: 'center'
          }}
        >
          <View style={styles.statusHeader}>
            {getStatusIcon()}
            <Text style={[styles.statusTitle, { color: getStatusColor() }]}>
              {getStatusTitle()}
            </Text>
          </View>

          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('receiverNumber')}</Text>
              <Text style={styles.detailValue}>{orderDetails?.mobile}</Text>
            </View>
          
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('bundle')}</Text>
              <Text style={styles.detailValue}>
                {orderDetails?.productName?.en || orderDetails?.productName}
              </Text>
            </View>

            {orderDetails?.promoCode && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('promoCode.promoCode')}</Text>
                <Text style={styles.detailValue}>{orderDetails?.promoCode}</Text>
              </View>
            )}

            {orderDetails?.discountAmount > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('promoCode.discount')}</Text>
                <Text style={[styles.detailValue, { color: '#10B981' }]}>
                  -${orderDetails?.discountAmount?.toFixed(2)} USD
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('transactionId')}</Text>
              <Text style={styles.detailValue}>{orderDetails?.txnNumber}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('date')}</Text>
              <Text style={styles.detailValue}>
                {orderDetails?.date ? new Date(orderDetails.date).toLocaleString() : 'N/A'}
              </Text>
            </View>

            <View style={styles.amountSection}>
              <Text style={styles.amountLabel}>{t('receipt.totalAmount')}</Text>
              <Text style={styles.amountValue}>
                {orderDetails?.amountAfn} AFN
              </Text>
              <Text style={styles.amountSubValue}>
                ${orderDetails?.usdAmount || finalAmount || usd} {t('usd')}
              </Text>
              {orderDetails?.originalUsdAmount && orderDetails?.originalUsdAmount > orderDetails?.usdAmount && (
                <Text style={[styles.amountSubValue, { fontSize: 14, color: '#666', textDecorationLine: 'line-through' }]}>
                  ${orderDetails?.originalUsdAmount} USD
                </Text>
              )}
            </View>
          </View>

          <View style={styles.statusMessageContainer}>
            <Text style={[styles.statusMessage, { color: getStatusColor() }]}>
              {getStatusMessage()}
            </Text>
          </View>

          {(orderStatus === ORDER_STATUS.QUEUED || orderStatus === ORDER_STATUS.PROCESSING || orderStatus === ORDER_STATUS.PENDING) && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: orderStatus === ORDER_STATUS.QUEUED ? '30%' : 
                            (orderStatus === ORDER_STATUS.PROCESSING ? '60%' : '80%'),
                      backgroundColor: getStatusColor()
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {orderStatus === ORDER_STATUS.QUEUED ? t('queued') : 
                orderStatus === ORDER_STATUS.PROCESSING ? t('processing') : t('finalizing')}
              </Text>
            </View>
          )}

          {(orderStatus === ORDER_STATUS.SUCCEEDED || orderStatus === ORDER_STATUS.FAILED) && (
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => {
                if (pollingRef.current) {
                  clearInterval(pollingRef.current);
                }
                navigation.popToTop();
              }}
            >
              <Text style={styles.doneButtonText}>{t('done')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={resetFlow} style={styles.moreButton}>
            <Text style={styles.moreButtonText}>
              {orderStatus === ORDER_STATUS.FAILED ? t('tryAgain') : t('activateMore')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
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
    t,
    loadingContacts
  }) => {
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
                placeholder={t('searchContacts')}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                placeholderTextColor="#999"
              />
            </View>

            {loadingContacts ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.emptyText}>{t('loading')}</Text>
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

  const CountriesModal = ({ 
    countryOpen, 
    setCountryOpen, 
    countriesSlideAnim, 
    insets, 
    countrySearch, 
    setCountrySearch, 
    countries, 
    setCountry,
    loadingCountries
  }) => {
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
                <Text style={styles.emptyText}>{t('loading')}</Text>
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
                      
                      // Invalidate products query for the new country
                      queryClient.invalidateQueries({ 
                        queryKey: QUERY_KEYS.DATA_PRODUCTS(item.id, selectedCategory?.id, selectedType?.id, mobilePrefix) 
                      });
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
            )}
          </Animated.View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader 
        title={t('dataBundle')} 
        onBack={orderStatus ? resetFlow : goBack} 
      />

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
                onChange={handleNumberChange}
                localNumber={localNumber}
                operator={operator}
                onEditCountry={() => jumpTo(BASE_STEPS.COUNTRY)}
                openContacts={() => setContactsModalVisible(true)}
                onPrefixChange={setMobilePrefix}
              />
            )}

            {step === BASE_STEPS.PRODUCT && (
              <StepProducts
                country={country}
                bundleCategories={bundleCategories}
                selectedCategory={selectedCategory}
                setSelectedCategory={(category) => {
                  setSelectedCategory(category);
                  if (country?.id) {
                    queryClient.invalidateQueries({ 
                      queryKey: QUERY_KEYS.DATA_PRODUCTS(country.id, category?.id, selectedType?.id, mobilePrefix) 
                    });
                  }
                }}
                bundleTypes={bundleTypes}
                selectedType={selectedType}
                setSelectedType={(type) => {
                  setSelectedType(type);
                  if (country?.id) {
                    queryClient.invalidateQueries({ 
                      queryKey: QUERY_KEYS.DATA_PRODUCTS(country.id, selectedCategory?.id, type?.id, mobilePrefix) 
                    });
                  }
                }}
                search={search}
                setSearch={setSearch}
                products={filteredProducts}
                product={product}
                setProduct={setProduct}
                onEditNumber={() => jumpTo(BASE_STEPS.NUMBER)}
                summary={{ dial, localNumber, product }}
                isLoading={loadingCategories || loadingTypes}
                isLoadingProducts={loadingProducts}
                mobilePrefix={mobilePrefix}
              />
            )}

            {step === BASE_STEPS.PAY && (
              <StepPay
                summary={getPaymentSummary()}
                onEditAmount={() => jumpTo(BASE_STEPS.PRODUCT)}
                onCardDetailsChange={handleCardDetailsChange}
              />
            )}

            <PrimaryButton
              label={
                step === lastStep
                  ? `${t('pay')} $${finalAmount.toFixed(2)} USD`
                  : t('continue')
              }
              onPress={goNext}
              style={{ marginTop: 24, opacity: canNext ? 1 : 0.5 }}
              loading={loading}
              disabled={step === lastStep && !paymentMethodId}
            />
            {step > 0 && (
              <PrimaryButton
                label={t('back')}
                onPress={goBack}
                style={{ marginTop: 12, marginBottom: 110, backgroundColor: "#4A4A4A" }}
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
        t={t}
        loadingContacts={loadingContacts}
      />

      <CountriesModal
        countryOpen={countryOpen}
        setCountryOpen={setCountryOpen}
        countriesSlideAnim={countriesSlideAnim}
        insets={insets}
        countrySearch={countrySearch}
        setCountrySearch={setCountrySearch}
        countries={countries}
        setCountry={setCountry}
        loadingCountries={loadingCountries}
      />

      <PromoCodeModal
        visible={promoModalVisible}
        onClose={closePromoModal}
        promoCode={promoCode}
        setPromoCode={setPromoCode}
        validatingPromo={promoCodeValidation.isLoading}
        promoError={promoError}
        onApply={handleApplyPromoCode}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{t('processingPayment')}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

export default function DataFlowScreenMerchantWrapper({ navigation }) {
  return (
    <QueryClientProvider client={queryClient}>
      <DataFlowScreenMerchant navigation={navigation} />
    </QueryClientProvider>
  );
}

const promoModalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center', 
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale.hp(2),
    padding: scale.hp(2.5),
    width: '100%',
    maxWidth: scale.wp(90),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale.hp(2),
  },
  modalTitle: {
    fontSize: scale.hp(2.25),
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: scale.hp(0.5),
  },
  closeButtonText: {
    fontSize: scale.hp(3),
    color: '#666',
  },
  promoInputContainer: {
    marginBottom: scale.hp(2),
  },
  promoInput: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: scale.hp(1),
    padding: scale.hp(1.5),
    fontSize: scale.hp(1.75),
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
    backgroundColor: '#F8F9FA',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: scale.hp(1),
    borderRadius: scale.hp(0.75),
    marginBottom: scale.hp(2),
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    color: '#DC2626',
    fontSize: scale.hp(1.5),
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: scale.wp(3),
  },
  modalButton: {
    flex: 1,
    paddingVertical: scale.hp(1.5),
    borderRadius: scale.hp(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: scale.hp(1.75),
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: Colors.primary,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: scale.hp(1.75),
    fontWeight: '600',
  },
});

const styles = StyleSheet.create({
  // OrderStatusScreen styles
  statusHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  lottieAnimation: {
    width: 140,
    height: 140,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // elevation: 4,
  },
  simpleClockContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  simpleProcessingContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  amountSection: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#f0f0f0',
  },
  amountLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  amountSubValue: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  statusMessageContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  statusMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  doneButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  moreButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  moreButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Modal styles
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
    marginTop: 12,
  },
  
  // Receipt capture styles (for OrderStatusScreen)
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
});