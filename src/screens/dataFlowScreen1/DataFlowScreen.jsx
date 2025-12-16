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
  activateDataBundle, 
  getCountries, 
  getDataProducts,
  getBundleCategories,
  getBundleTypes,
  getOrderStatus 
} from "../../services/merchantApi";
import * as Contacts from 'expo-contacts';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import formatLocal from "../../utils/formatLocal";
import DataStyles from "./DataStyles";
import StepCountry from "./StepCountry";
import StepNumber from "./StepNumber";
import StepProducts from "./StepProducts";
import StepPay from "./StepPay";
import { useTranslation } from "react-i18next";
import LottieView from 'lottie-react-native';

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

// Query Keys
const QUERY_KEYS = {
  COUNTRIES: ['countries'],
  BUNDLE_CATEGORIES: ['bundle-categories'],
  BUNDLE_TYPES: ['bundle-types'],
  DATA_PRODUCTS: (countryId, categoryId, typeId) => ['data-products', countryId, categoryId, typeId],
  ORDER_STATUS: (orderId) => ['order-status', orderId],
  CONTACTS: ['contacts'],
};

// API Service Functions with React Query
const useCountries = () => {
  return useQuery({
    queryKey: QUERY_KEYS.COUNTRIES,
    queryFn: async () => {
      const response = await getCountries();
      return response?.data || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
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
      
      const response = await getDataProducts(filter);
      return response?.data || [];
    },
    enabled: !!countryId && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

const useOrderStatus = (orderId, enabled = false) => {
  return useQuery({
    queryKey: QUERY_KEYS.ORDER_STATUS(orderId),
    queryFn: async () => {
      if (!orderId) return null;
      const response = await getOrderStatus(orderId);
      return response;
    },
    enabled: !!orderId && enabled,
    refetchInterval: (data) => {
      if (!data?.data?.status) return false;
      const status = data.data.status;
      return status === ORDER_STATUS.QUEUED || 
             status === ORDER_STATUS.PROCESSING || 
             status === ORDER_STATUS.PENDING ? 3000 : false;
    },
    refetchIntervalInBackground: true,
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
      const response = await activateDataBundle(payload);
      return response;
    },
    onSuccess: (data, variables) => {
      if (data.orderId) {
        // Invalidate order status query
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDER_STATUS(data.orderId) });
        
        // You might want to invalidate user transactions or balance here
        // queryClient.invalidateQueries({ queryKey: ['user-transactions'] });
        // queryClient.invalidateQueries({ queryKey: ['user-balance'] });
      }
    },
    onError: (error) => {
      console.error('Bundle activation mutation error:', error);
    },
  });
};

const OrderStatusScreen = ({ 
  orderStatus, 
  orderDetails, 
  getStatusIcon, 
  getStatusTitle, 
  getStatusColor, 
  getStatusMessage, 
  resetFlow, 
  navigation 
}) => {
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
            <Text style={styles.detailValue}>{orderDetails?.productName?.en}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={styles.detailValue}>{orderDetails?.txnNumber}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {new Date(orderDetails?.date).toLocaleString()}
            </Text>
          </View>

          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>{orderDetails?.amountAfn} AFN</Text>
          </View>
        </View>

        <View style={styles.statusMessageContainer}>
          <Text style={[styles.statusMessage, { color: getStatusColor() }]}>
            {getStatusMessage()}
            {orderDetails?.error && `\n\nError: ${orderDetails.error}`}
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
          <PrimaryButton
            label="Done"
            onPress={() => {
              navigation.popToTop();
            }}
            style={{ width: "100%", marginTop: 20 }}
          />
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

function DataFlowScreenMerchant({ navigation }) {
  const { user } = useAuth?.() || { user: null };
  const isB2B = (user?.role || "").toLowerCase().includes("b2b");
  const lastStep = isB2B ? BASE_STEPS.PRODUCT : BASE_STEPS.PAY;
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
  const { t } = useTranslation();  
  const [contactsSlideAnim] = useState(new Animated.Value(screenHeight));
  const [countriesSlideAnim] = useState(new Animated.Value(screenHeight));
  const insets = useSafeAreaInsets();
  
  const lottieRef = useRef(null);

  const dial = DIAL_CODES[country?.countryCode] || "";
  const operator = guessOperator(country?.countryCode, localNumber.replace(/\D/g, ""));

  // React Query hooks
  const { data: countries = [], isLoading: loadingCountries } = useCountries();
  const { data: bundleCategories = [], isLoading: loadingCategories } = useBundleCategories();
  const { data: bundleTypes = [], isLoading: loadingTypes } = useBundleTypes();
  const { 
    data: orderStatusData, 
    isFetching: pollingOrderStatus 
  } = useOrderStatus(orderDetails?.orderId, !!orderDetails?.orderId);
  const { 
    data: contacts = [], 
    isLoading: loadingContacts,
    refetch: refetchContacts 
  } = useContacts();
  const activateBundleMutation = useActivateBundle();
  
  // Enable products query only when country is selected and we're on PRODUCT step
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

  // Set initial country from cached data
  useEffect(() => {
    if (countries.length > 0 && !country) {
      const afgCountry = countries.find((c) => c.countryCode === "AF") || countries[0];
      setCountry(afgCountry);
    }
  }, [countries]);

  // Set initial category and type from cached data
  useEffect(() => {
    if (bundleCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(bundleCategories[0]);
    }
    if (bundleTypes.length > 0 && !selectedType) {
      setSelectedType(bundleTypes[0]);
    }
  }, [bundleCategories, bundleTypes]);

  // Update order status from React Query polling
  useEffect(() => {
    if (orderStatusData?.data?.status) {
      const currentStatus = orderStatusData.data.status;
      setOrderStatus(currentStatus);
      setOrderDetails(prev => ({
        ...prev,
        ...orderStatusData.data
      }));
    }
  }, [orderStatusData]);

  // Lottie animation
  useEffect(() => {
    if (lottieRef.current && (orderStatus === ORDER_STATUS.SUCCEEDED || orderStatus === ORDER_STATUS.FAILED)) {
      lottieRef.current.play();
    }
  }, [orderStatus]);

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

  // Filter products locally
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.trim().toLowerCase();
    return products.filter((p) =>
      p.productName?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.price?.toString().includes(q)
    );
  }, [products, search]);

  const canNext =
    (step === BASE_STEPS.COUNTRY && !!country) ||
    (step === BASE_STEPS.NUMBER && localNumber.replace(/\D/g, "").length >= 7) ||
    (step === BASE_STEPS.PRODUCT && !!product) ||
    (step === BASE_STEPS.PAY && !isB2B);

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

  // Reset local number and product when country changes
  useEffect(() => {
    setLocalNumber("");
    setProduct(null);
  }, [country?.countryCode]);

  const activateBundle = async () => {
    const cleanedNumber = localNumber.replace(/\D/g, "");
    const receiverNumber = `${dial}${cleanedNumber}`.replace(/\s/g, "");
    
    const payload = {
      productId: product?.id,
      receiver: receiverNumber,
    };

    console.log("🔄 Activation Payload:", payload);

    try {
      const res = await activateBundleMutation.mutateAsync(payload);
      
      console.log("✅ Activation Response:", res);
      
      if (res.success || res.status === "queued" || res.status === "processing") {
        setOrderStatus(res.status || ORDER_STATUS.QUEUED);
        setOrderDetails({
          orderId: res.orderId,
          txnNumber: res.txnNumber || `TXN-${Date.now()}`,
          mobile: `${dial} ${formatLocal(localNumber)}`,
          amountAfn: product?.price,
          productName: product?.productName,
          date: new Date().toISOString(),
          operator: operator?.name || "Unknown",
          message: res.message || "Bundle activation initiated successfully!",
        });
      } else {
        setOrderStatus(ORDER_STATUS.FAILED);
        setOrderDetails({
          mobile: `${dial} ${formatLocal(localNumber)}`,
          amountAfn: product?.price,
          productName: product?.productName,
          date: new Date().toISOString(),
          error: res.error || "Activation failed. Please try again.",
        });
      }
    } catch (error) {
      console.error("❌ Failed To Activate Bundle:", error);
      
      setOrderStatus(ORDER_STATUS.FAILED);
      setOrderDetails({
        mobile: `${dial} ${formatLocal(localNumber)}`,
        amountAfn: product?.price,
        productName: product?.productName,
        date: new Date().toISOString(),
        error: error.response?.data?.error || "Activation failed. Please try again.",
      });
    }
  };

  const handleContactSelect = useCallback((phoneNumber) => {
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
  }, [country]);

  const resetFlow = () => {
    setOrderStatus(null);
    setOrderDetails(null);
    setStep(0);
    setProduct(null);
    setLocalNumber("");
    
    if (lottieRef.current) {
      lottieRef.current.reset();
    }
  };

  // Status Helper Functions
  const getStatusMessage = useCallback(() => {
    switch (orderStatus) {
      case ORDER_STATUS.QUEUED:
        return "Your bundle activation has been queued and will be processed shortly.";
      case ORDER_STATUS.PROCESSING:
      case ORDER_STATUS.PENDING:
        return "Your bundle is being activated. Please wait...";
      case ORDER_STATUS.SUCCEEDED:
        return "Bundle activated successfully! ";
      case ORDER_STATUS.FAILED:
        return "Bundle activation failed. ";
      default:
        return "Processing your request...";
    }
  }, [orderStatus]);

  const getStatusIcon = useCallback(() => {
    switch (orderStatus) {
      case ORDER_STATUS.QUEUED:
        return (
          <View style={[styles.statusIcon, { backgroundColor: '#FFF3CD', borderColor: '#FFEAA7' }]}>
            <Ionicons name="time-outline" size={36} color="#FFA500" />
          </View>
        );
      case ORDER_STATUS.PROCESSING:
      case ORDER_STATUS.PENDING:
        return (
          <View style={[styles.statusIcon, { backgroundColor: '#D1ECF1', borderColor: '#B8DAE4' }]}>
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
            style={styles.lottieAnimation}
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
          />
        );
      default:
        return (
          <View style={[styles.statusIcon, { backgroundColor: '#E2E3E5', borderColor: '#D6D8DB' }]}>
            <Ionicons name="help-circle" size={36} color="#6C757D" />
          </View>
        );
    }
  }, [orderStatus]);

  const getStatusTitle = useCallback(() => {
    switch (orderStatus) {
      case ORDER_STATUS.QUEUED:
        return "Bundle Queued";
      case ORDER_STATUS.PROCESSING:
      case ORDER_STATUS.PENDING:
        return "Activating Bundle";
      case ORDER_STATUS.SUCCEEDED:
        return "Bundle Activated!";
      case ORDER_STATUS.FAILED:
        return "Activation Failed";
      default:
        return "Processing";
    }
  }, [orderStatus]);

  const getStatusColor = useCallback(() => {
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
  }, [orderStatus]);

  const loading = activateBundleMutation.isLoading || pollingOrderStatus;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader 
        title="Internet Bundle" 
        onBack={orderStatus ? resetFlow : goBack} 
      />

      {orderStatus ? (
        <OrderStatusScreen 
          orderStatus={orderStatus}
          orderDetails={orderDetails}
          getStatusIcon={getStatusIcon}
          getStatusTitle={getStatusTitle}
          getStatusColor={getStatusColor}
          getStatusMessage={getStatusMessage}
          resetFlow={resetFlow}
          navigation={navigation}
        />
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
                loading={loadingProducts}
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
          <Text style={styles.loadingText}>Activating Bundle...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// Wrap the component with QueryClientProvider
export default function DataFlowScreenMerchantWrapper({ navigation }) {
  return (
    <QueryClientProvider client={queryClient}>
      <DataFlowScreenMerchant navigation={navigation} />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  // Order Status Styles
  statusHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  lottieAnimation: {
    width: 80,
    height: 80,
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
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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

  // Modal Styles
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
  },
});