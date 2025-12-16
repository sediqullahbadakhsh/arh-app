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

const { height: screenHeight } = Dimensions.get('window');
const BASE_STEPS = { COUNTRY: 0, NUMBER: 1, PRODUCT: 2, PAY: 3 };

const ORDER_STATUS = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  PENDING: 'pending'
};

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
    },
  },
});

const QUERY_KEYS = {
  COUNTRIES: ['countries'],
  BUNDLE_CATEGORIES: ['bundle-categories'],
  BUNDLE_TYPES: ['bundle-types'],
  DATA_PRODUCTS: (countryId, categoryId, typeId) => ['data-products', countryId, categoryId, typeId],
  CURRENCIES: ['currencies'],
  SLABS: ['slabs'],
  CONTACTS: ['contacts'],
};

const useCountries = () => {
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
  return useQuery({
    queryKey: QUERY_KEYS.BUNDLE_TYPES,
    queryFn: async () => {
      const response = await getBundleTypes();
      return response?.data || [];
    },
    staleTime: 30 * 60 * 1000,
  });
};

const useDataProducts = (countryId, categoryId, typeId, enabled = false) => {
  return useQuery({
    queryKey: QUERY_KEYS.DATA_PRODUCTS(countryId, categoryId, typeId),
    queryFn: async () => {
      if (!countryId) return [];
      
      const filter = {
        countryId,
        productCategoryId: categoryId,
        productTypeId: typeId,
        productFor: "BUNDLE"
      };
      
      const response = await getDataProductsCustomer(filter);
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

function DataFlowScreenMerchant({ navigation }) {
  const { user } = useAuth?.() || { user: null };
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
  const [localNumber, setLocalNumber] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [product, setProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [exchangeRate, setExchangeRate] = useState(null);
  const [slabPercentage, setSlabPercentage] = useState(0);
  const [paymentMethodId, setPaymentMethodId] = useState(null);
  const [cardDetailsComplete, setCardDetailsComplete] = useState(false);
  const { t } = useTranslation();  
  const [contactsSlideAnim] = useState(new Animated.Value(screenHeight));
  const [countriesSlideAnim] = useState(new Animated.Value(screenHeight));
  const insets = useSafeAreaInsets();
  
  const pollingRef = useRef(null);
  const lottieRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const dial = DIAL_CODES[country?.countryCode] || "";
  const operator = guessOperator(country?.countryCode, localNumber.replace(/\D/g, ""));

  const { data: countries = [], isLoading: loadingCountries } = useCountries();
  const { data: bundleCategories = [], isLoading: loadingCategories } = useBundleCategories();
  const { data: bundleTypes = [], isLoading: loadingTypes } = useBundleTypes();
  const { data: currenciesData, isLoading: loadingCurrencies } = useCurrencies();
  const { data: slabsData, isLoading: loadingSlabs } = useSlabs();
  const { 
    data: contacts = [], 
    isLoading: loadingContacts,
    refetch: refetchContacts 
  } = useContacts();
  const activateBundleMutation = useActivateBundle();
  
  const shouldFetchProducts = step >= BASE_STEPS.PRODUCT && !!country?.id;
  const { 
    data: products = [], 
    isLoading: loadingProducts 
  } = useDataProducts(
    country?.id, 
    selectedCategory?.id, 
    selectedType?.id,      
    shouldFetchProducts
  );

  // Manual polling function - same as social activation screen
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
    // Clean up polling on unmount
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

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.trim().toLowerCase();
    return products.filter((p) =>
      p.productName?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.price?.toString().includes(q)
    );
  }, [products, search]);

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
    setProduct(null);
  }, [country?.countryCode]);

  const activateBundle = async () => {
    if (!paymentMethodId) {
      Alert.alert("Payment Required", "Please enter your card details to proceed with the bundle activation.");
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
    };

    console.log("🔄 Customer Bundle Activation Payload:", payload);

    try {
      setLoading(true);
      const res = await activateBundleMutation.mutateAsync(payload);
      
      console.log("Customer Bundle Activation Response:", res);
      
      if (res.status === true || res.orderId) {
        // Set order details IMMEDIATELY with orderId - same as social activation
        const newOrderDetails = {
          orderId: res.orderId,
          txnNumber: res.txnNumber || `TXN-${Date.now()}`,
          mobile: `${dial} ${formatLocal(localNumber)}`,
          amountAfn: product?.price,
          usdAmount: product?.totalAmountInUSD || usd,
          productName: product?.productName,
          date: new Date().toISOString(),
          operator: operator?.name || "Unknown",
          message: res.message || "Bundle activation request submitted successfully! Payment processed and our backoffice team will activate your bundle shortly.",
          status: ORDER_STATUS.QUEUED,
        };
        
        setOrderDetails(newOrderDetails);
        setOrderStatus(ORDER_STATUS.QUEUED);
        
        // Start manual polling - same as social activation
        if (res.orderId) {
          await startPollingOrderStatus(res.orderId);
        }
        
        Alert.alert(
          "Success",
          "Bundle activation initiated successfully!",
          [{ text: 'OK', onPress: () => {} }]
        );
      } else {
        setOrderStatus(ORDER_STATUS.FAILED);
        setOrderDetails({
          mobile: `${dial} ${formatLocal(localNumber)}`,
          amountAfn: product?.price,
          usdAmount: usd,
          productName: product?.productName,
          date: new Date().toISOString(),
          error: res.error || "Bundle activation request failed. Please try again.",
        });
        Alert.alert("Error", res.error || "Bundle activation request failed.");
      }
    } catch (error) {
      console.error("❌ Failed To Activate Customer Bundle:", error);
      
      setOrderStatus(ORDER_STATUS.FAILED);
      setOrderDetails({
        mobile: `${dial} ${formatLocal(localNumber)}`,
        amountAfn: product?.price,
        usdAmount: usd,
        productName: product?.productName,
        date: new Date().toISOString(),
        error: error.response?.data?.error || error.message || "Bundle activation failed. Please try again.",
      });
      
      Alert.alert("Error", error.response?.data?.error || error.message || "Bundle activation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleContactSelect = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert("Error", "Invalid phone number selected");
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

  const resetFlow = () => {
    setOrderStatus(null);
    setOrderDetails(null);
    setStep(0);
    setProduct(null);
    setLocalNumber("");
    setPaymentMethodId(null);
    setCardDetailsComplete(false);
    
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
        return "Your bundle activation request has been submitted and payment processed. Our backoffice team will activate your bundle shortly.";
      case ORDER_STATUS.PROCESSING:
      case ORDER_STATUS.PENDING:
        return "Your bundle activation is being processed by our backoffice team. Please wait...";
      case ORDER_STATUS.SUCCEEDED:
        return "Bundle activated successfully! Our team has processed your request.";
      case ORDER_STATUS.FAILED:
        return orderDetails?.error || "Bundle activation failed. Please contact support if this continues.";
      default:
        return "Processing your request...";
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
        return "Request Submitted";
      case ORDER_STATUS.PROCESSING:
      case ORDER_STATUS.PENDING:
        return "Processing Request";
      case ORDER_STATUS.SUCCEEDED:
        return "Bundle Activated!";
      case ORDER_STATUS.FAILED:
        return "Activation Failed";
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

  const getPaymentSummary = () => {
    return {
      mobile: `${dial} ${formatLocal(localNumber)}`,
      product: product,
      afn: afn,
      usd: usd,
      calculateBaseAmount: () => baseAmount,
      calculateFeeAmount: () => feeAmount,
      slabPercentage: slabPercentage,
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
              <Text style={styles.detailLabel}>Receiver Number</Text>
              <Text style={styles.detailValue}>{orderDetails?.mobile}</Text>
            </View>
          
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bundle Plan</Text>
              <Text style={styles.detailValue}>{orderDetails?.productName?.en || orderDetails?.productName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction ID</Text>
              <Text style={styles.detailValue}>{orderDetails?.txnNumber}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {orderDetails?.date ? new Date(orderDetails.date).toLocaleString() : 'N/A'}
              </Text>
            </View>

            <View style={styles.amountSection}>
              <Text style={styles.amountLabel}>Total Amount</Text>
              <Text style={styles.amountSubValue}>${orderDetails?.usdAmount || usd} USD</Text>
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
                {orderStatus === ORDER_STATUS.QUEUED ? 'Queued' : 
                orderStatus === ORDER_STATUS.PROCESSING ? 'Processing' : 'Finalizing...'}
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
              <Text style={styles.doneButtonText}>Yes</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={resetFlow} style={styles.moreButton}>
            <Text style={styles.moreButtonText}>
              {orderStatus === ORDER_STATUS.FAILED ? "Try Again" : "Activate More"}
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
                placeholder="Search contacts..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                placeholderTextColor="#999"
              />
            </View>

            {loadingContacts ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.emptyText}>Loading contacts...</Text>
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
      if (!countrySearch) return countries;
      return countries.filter(c =>
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
              <Text style={styles.modalTitle}>Select Country</Text>
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
                placeholder="Search countries..."
                value={countrySearch}
                onChangeText={setCountrySearch}
                style={styles.searchInput}
                placeholderTextColor="#999"
              />
            </View>

            {loadingCountries ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.emptyText}>Loading countries...</Text>
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
        title="Internet Bundle" 
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
                bundleCategories={bundleCategories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                bundleTypes={bundleTypes}
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                search={search}
                setSearch={setSearch}
                products={filteredProducts}
                product={product}
                setProduct={setProduct}
                onEditNumber={() => jumpTo(BASE_STEPS.NUMBER)}
                summary={{ dial, localNumber, product }}
                isLoading={loadingCategories || loadingTypes}
                isLoadingProducts={loadingProducts}
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
                  ? "Pay"
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

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Processing Payment...</Text>
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

const styles = StyleSheet.create({
  // Status Screen Styles
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
    elevation: 4,
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
    marginRight: 12,
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
});