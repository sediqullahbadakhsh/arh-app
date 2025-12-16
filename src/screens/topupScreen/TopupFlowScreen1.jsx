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
  return useQuery({
    queryKey: QUERY_KEYS.COUNTRIES,
    queryFn: async () => {
      const response = await getCountries();
      return response?.data || [];
    },
    staleTime: 30 * 60 * 1000,
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

// REMOVED React Query polling and replaced with manual polling
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
      <View style={modalStyles.modalOverlay}>
        <View style={modalStyles.modalContent}>
          <View style={modalStyles.modalHeader}>
            <Text style={modalStyles.modalTitle}>{t('promoCode.applyPromo')}</Text>
            <TouchableOpacity onPress={handleClose} style={modalStyles.closeButton}>
              <Text style={modalStyles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={modalStyles.promoInputContainer}>
            <TextInput
              style={modalStyles.promoInput}
              placeholder={t('promoCode.enterCodePlaceholder')}
              value={promoCode}
              onChangeText={handleTextChange}
              placeholderTextColor="#999"
              autoCapitalize="characters"
              autoFocus={true}
            />
          </View>

          {promoError ? (
            <View style={modalStyles.errorContainer}>
              <Text style={modalStyles.errorText}>{promoError}</Text>
            </View>
          ) : null}

          <View style={modalStyles.modalButtons}>
            <TouchableOpacity 
              style={[modalStyles.modalButton, modalStyles.cancelButton]} 
              onPress={handleClose}
              disabled={validatingPromo}
            >
              <Text style={modalStyles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                modalStyles.modalButton, 
                modalStyles.applyButton, 
                (!promoCode.trim() || validatingPromo) && modalStyles.disabledButton
              ]} 
              onPress={handleApply}
              disabled={!promoCode.trim() || validatingPromo}
            >
              {validatingPromo ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={modalStyles.applyButtonText}>{t('promoCode.apply')}</Text>
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
  const pollingRef = useRef(null); // Manual polling reference
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

  // MANUAL POLLING FUNCTION - Same as DataFlowScreenMerchant
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
    const baseAmount = parseFloat(baseAfn) || 0;
    const targetProduct = productItem || product;
    
    if (!targetProduct) {
      return baseAmount;
    }

    let totalAmount = baseAmount;
    
    if (targetProduct.slabDetails?.percentage) {
      totalAmount += baseAmount * (targetProduct.slabDetails.percentage / 100);
    }
    
    if (targetProduct.serviceSlabDetails?.percentage) {
      totalAmount += baseAmount * (targetProduct.serviceSlabDetails.percentage / 100);
    }
    
    return totalAmount;
  };

  const calculateUsdAmount = (afnAmount, productItem = null) => {
    if (!exchangeRate || !afnAmount) return 0;
    
    const totalAfn = calculateTotalAfnAmount(afnAmount, productItem);
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
    
    if (targetProduct?.slabDetails?.percentage) {
      totalFee += baseAmount * (targetProduct.slabDetails.percentage / 100);
    }
    
    if (targetProduct?.serviceSlabDetails?.percentage) {
      totalFee += baseAmount * (targetProduct.serviceSlabDetails.percentage / 100);
    }
    
    return parseFloat(totalFee.toFixed(2));
  };

  const getActualAfnAmount = () => {
    if (product && product.price) {
      return parseFloat(product.price);
    }
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
    const originalUsd = calculateUsdAmount(getActualAfnAmount());
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
      const orderAmount = getActualAfnAmount();
      const response = await promoCodeValidation.mutateAsync({
        code: promoCode.trim(),
        orderAmount: orderAmount
      });

      let discount = 0;
      const baseUsdAmount = calculateUsdAmount(getActualAfnAmount());
      
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

  // Mobile number validation
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

  // Navigation
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

  // Reset local number when country changes
  useEffect(() => {
    setLocalNumber("");
  }, [country?.countryCode]);

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

    if (afn <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount greater than 0");
      return;
    }

    const originalUsdAmount = calculateUsdAmount(afn);

    const payload = {
      amount: afn,
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
      customAmount: customAfn || afn,
      serviceType: serviceType,
      promo_code: appliedPromoCode?.code || null,
      finalDiscountAmount: finalAmount,
      promodiscountamoun: discountAmount,
    };

    try {
      const response = await rechargeMutation.mutateAsync(payload);
      
      if (response.status === "queued" || response.status === "processing" || response.success) {
        // Set order details IMMEDIATELY with orderId - same as bundle activation
        const newOrderDetails = {
          orderId: response.orderId,
          txnNumber: response.txnNumber || `TXN-${Date.now()}`,
          mobile: `${dial} ${formatLocal(localNumber)}`,
          amountAfn: afn,
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
        
        // Start manual polling - same as bundle activation
        if (response.orderId) {
          await startPollingOrderStatus(response.orderId);
        }
        
        Alert.alert(
          "Success",
          "Topup initiated successfully!",
          [{ text: 'OK', onPress: () => {} }]
        );
      } else if (response.status === "requires_action") {
        const { error } = await confirmPayment(response.nextAction.clientSecret);
        if (error) {
          throw new Error(error.message);
        } else {
          // Set order details for requires_action case too
          const newOrderDetails = {
            orderId: response.orderId,
            txnNumber: response.txnNumber || `TXN-${Date.now()}`,
            mobile: `${dial} ${formatLocal(localNumber)}`,
            amountAfn: afn,
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
          
          // Start manual polling
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
        amountAfn: serviceType === 'bundle' ? (product?.price || 0) : afn,
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

  // Payment summaries
  const getPaymentSummaryForBundle = () => {
    const baseAfn = serviceType === 'bundle' && product ? parseFloat(product.price) : afn;
    const baseAmount = calculateBaseAmount(baseAfn);
    const feeAmount = calculateFeeAmount(baseAfn);
    const totalUsd = calculateUsdAmount(baseAfn);
    
    const slabPercent = product?.slabDetails?.percentage || 0;
    const serviceSlabPercent = product?.serviceSlabDetails?.percentage || 0;
    
    return {
      mobile: `${dial} ${formatLocal(localNumber)}`,
      usd: totalUsd,
      afn: baseAfn,
      totalAfn: calculateTotalAfnAmount(baseAfn),
      exchangeRate,
      slabPercentage: slabPercent,
      serviceSlabPercentage: serviceSlabPercent,
      baseAmount: baseAmount,
      feeAmount: feeAmount,
      totalAmount: totalUsd,
      product: product,
      serviceType: serviceType,
      finalAmount: finalAmount,
      discountAmount: discountAmount,
      appliedPromoCode: appliedPromoCode,
      onApplyPromoCode: handleApplyPromoCode,
      onRemovePromoCode: handleRemovePromoCode,
      openPromoModal: openPromoModal,
      closePromoModal: closePromoModal,
      validatingPromo: promoCodeValidation.isLoading,
      promoError: promoError
    };
  };

  const getPaymentSummaryForRecharge = () => {
    let baseAfn = 0;
    let baseAmount = 0;
    let feeAmount = 0;
    let totalUsd = 0;
    let totalAfn = 0;

    if (serviceType === 'bundle' && product) {
      baseAfn = parseFloat(product.price) || 0;
      baseAmount = calculateBaseAmount(baseAfn);
      feeAmount = calculateFeeAmount(baseAfn, product);
      totalUsd = calculateUsdAmount(baseAfn, product);
      totalAfn = calculateTotalAfnAmount(baseAfn, product);
    } else if (serviceType === 'recharge') {
      if (product && product.id) {
        baseAfn = parseFloat(product.price) || 0;
        baseAmount = calculateBaseAmount(baseAfn);
        feeAmount = calculateFeeAmount(baseAfn, product);
        totalUsd = calculateUsdAmount(baseAfn, product);
        totalAfn = calculateTotalAfnAmount(baseAfn, product);
      } else {
        baseAfn = getActualAfnAmount();
        baseAmount = calculateBaseAmount(baseAfn);
        feeAmount = calculateFeeAmount(baseAfn);
        totalUsd = calculateUsdAmount(baseAfn);
        totalAfn = calculateTotalAfnAmount(baseAfn);
      }
    }

    const slabPercent = product?.slabDetails?.percentage || 0;
    const serviceSlabPercent = product?.serviceSlabDetails?.percentage || 0;
    
    return {
      mobile: `${dial} ${formatLocal(localNumber)}`,
      usd: totalUsd,
      afn: baseAfn,
      totalAfn: totalAfn,
      exchangeRate,
      slabPercentage: slabPercent,
      serviceSlabPercentage: serviceSlabPercent,
      baseAmount: baseAmount,
      feeAmount: feeAmount,
      totalAmount: totalUsd,
      product: product,
      serviceType: serviceType,
      finalAmount: finalAmount,
      discountAmount: discountAmount,
      appliedPromoCode: appliedPromoCode,
      onApplyPromoCode: handleApplyPromoCode,
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
    
    // Clear polling interval
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    
    if (lottieRef.current) {
      lottieRef.current.reset();
    }
  };

  // Contact selection
  const handleContactSelect = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert(t('error'), t('invalidPhoneNumber'));
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

  // Status helpers
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
          : "Topup completed successfully! ";
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
        return serviceType === 'bundle' ? "Processing Request" : "Processing Topup";
      case ORDER_STATUS.SUCCEEDED:
        return serviceType === 'bundle' ? "Bundle Activated!" : "Topup Successful!";
      case ORDER_STATUS.FAILED:
        return serviceType === 'bundle' ? "Activation Failed" : "Topup Failed";
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

  // Modals
  const ContactsModal = () => {
    const { t } = useTranslation();
    
    return (
      <Modal
        visible={contactsModalVisible}
        transparent={true}
        animationType="none"
        statusBarTranslucent={true}
        onRequestClose={() => setContactsModalVisible(false)}
      >
        <View style={modalStyles.modalOverlay}>
          <TouchableOpacity 
            style={modalStyles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setContactsModalVisible(false)}
          />
          <Animated.View 
            style={[
              modalStyles.modalCard,
              { 
                transform: [{ translateY: contactsSlideAnim }],
                height: '80%',
                marginBottom: -insets.bottom
              }
            ]}
          >
            <View style={modalStyles.modalHeader}>
              <Text style={modalStyles.modalTitle}>{t('selectContact')}</Text>
              <TouchableOpacity 
                onPress={() => setContactsModalVisible(false)}
                style={modalStyles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={modalStyles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" style={modalStyles.searchIcon} />
              <TextInput
                placeholder={t('searchContacts')}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={modalStyles.searchInput}
                placeholderTextColor="#999"
              />
            </View>

            {loadingContacts ? (
              <View style={modalStyles.emptyContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={modalStyles.emptyText}>{t('loadingContacts')}</Text>
              </View>
            ) : filteredContacts.length > 0 ? (
              <FlatList
                data={filteredContacts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={modalStyles.contactItem}
                    onPress={() => {
                      if (item.phoneNumbers && item.phoneNumbers.length > 0) {
                        handleContactSelect(item.phoneNumbers[0].number);
                      }
                    }}
                  >
                    <View style={modalStyles.contactAvatar}>
                      <Text style={modalStyles.contactAvatarText}>
                        {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                      </Text>
                    </View>
                    <View style={modalStyles.contactInfo}>
                      <Text style={modalStyles.contactName}>{item.name}</Text>
                      {item.phoneNumbers && item.phoneNumbers.length > 0 && (
                        <Text style={modalStyles.contactPhone}>{item.phoneNumbers[0].number}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={modalStyles.contactSeparator} />}
              />
            ) : (
              <View style={modalStyles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="#999" />
                <Text style={modalStyles.emptyText}>{t('noContactsFound')}</Text>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    );
  };

  const CountriesModal = () => {
    const { t } = useTranslation();
    
    const filteredCountries = countrySearch
      ? countries.filter(c =>
        c.countryName.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.countryCode.toLowerCase().includes(countrySearch.toLowerCase())
      )
      : countries;
    
    return (
      <Modal
        visible={countryOpen}
        transparent={true}
        animationType="none"
        statusBarTranslucent={true}
        onRequestClose={() => setCountryOpen(false)}
      >
        <View style={modalStyles.modalOverlay}>
          <TouchableOpacity 
            style={modalStyles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setCountryOpen(false)}
          />
          <Animated.View 
            style={[
              modalStyles.modalCard,
              { 
                transform: [{ translateY: countriesSlideAnim }],
                height: '80%',
                marginBottom: -insets.bottom
              }
            ]}
          >
            <View style={modalStyles.modalHeader}>
              <Text style={modalStyles.modalTitle}>{t('selectCountry')}</Text>
              <TouchableOpacity 
                onPress={() => setCountryOpen(false)}
                style={modalStyles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={modalStyles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" style={modalStyles.searchIcon} />
              <TextInput
                placeholder={t('searchCountries')}
                value={countrySearch}
                onChangeText={setCountrySearch}
                style={modalStyles.searchInput}
                placeholderTextColor="#999"
              />
            </View>

            {loadingCountries ? (
              <View style={modalStyles.emptyContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={modalStyles.emptyText}>{t('loadingCountries')}</Text>
              </View>
            ) : (
              <FlatList
                data={filteredCountries}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={modalStyles.modalRow}
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
                ItemSeparatorComponent={() => <View style={modalStyles.contactSeparator} />}
              />
            )}
          </Animated.View>
        </View>
      </Modal>
    );
  };

  const OrderStatusScreen = () => {
    const receiptCaptureRef = useRef(null);
    const [hasMediaPermission, setHasMediaPermission] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);

    useEffect(() => {
      (async () => {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        setHasMediaPermission(status === 'granted');
      })();
    }, []);

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
      <View ref={ref} style={receiptStyles.receiptCaptureContainer}>
        <View style={receiptStyles.captureHeader}>
          <Image
            source={require('../../../assets/logoV.png')} 
            style={receiptStyles.captureLogo}
            resizeMode="contain"
          />
          <Text style={receiptStyles.captureTitle}>TRANSACTION RECEIPT</Text>
        </View>

        <View style={receiptStyles.captureStatusSection}>
          <Text style={receiptStyles.captureStatusTitle}>
            {getStatusTitle()}
          </Text>
        </View>

        <View style={receiptStyles.captureDetails}>
          <View style={receiptStyles.captureDetailRow}>
            <Text style={receiptStyles.captureDetailLabel}>Transaction ID:</Text>
            <Text style={receiptStyles.captureDetailValue}>{orderDetails?.txnNumber}</Text>
          </View>
          
          <View style={receiptStyles.captureDetailRow}>
            <Text style={receiptStyles.captureDetailLabel}>Date & Time:</Text>
            <Text style={receiptStyles.captureDetailValue}>
              {new Date(orderDetails?.date).toLocaleString()}
            </Text>
          </View>
          
          <View style={receiptStyles.captureDetailRow}>
            <Text style={receiptStyles.captureDetailLabel}>Receiver:</Text>
            <Text style={receiptStyles.captureDetailValue}>{orderDetails?.mobile}</Text>
          </View>

          {orderDetails?.productName && (
            <View style={receiptStyles.captureDetailRow}>
              <Text style={receiptStyles.captureDetailLabel}>Bundle Plan:</Text>
              <Text style={receiptStyles.captureDetailValue}>
                {orderDetails?.productName?.en || orderDetails?.productName}
              </Text>
            </View>
          )}

          <View style={receiptStyles.captureDetailRow}>
            <Text style={receiptStyles.captureDetailLabel}>Status:</Text>
            <Text style={[receiptStyles.captureDetailValue, { color: getStatusColor() }]}>
              {getStatusTitle()}
            </Text>
          </View>
        </View>

        <View style={receiptStyles.captureAmountSection}>
          <Text style={receiptStyles.captureAmountLabel}>TOTAL AMOUNT</Text>
          <Text style={receiptStyles.captureAmountValue}>
            {orderDetails?.amountAfn} AFN
          </Text>
          <Text style={receiptStyles.captureAmountSubValue}>
            ${orderDetails?.usdAmount} USD
          </Text>
        </View>

        <View style={receiptStyles.captureFooter}>
          <Text style={receiptStyles.captureFooterText}>Thank you for using our service!</Text>
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
              <Text style={TopUpStyles.detailLabel}>Receiver Number</Text>
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
              <Text style={TopUpStyles.detailLabel}>Transaction ID</Text>
              <Text style={TopUpStyles.detailValue}>{orderDetails?.txnNumber}</Text>
            </View>
            <View style={TopUpStyles.detailRow}>
              <Text style={TopUpStyles.detailLabel}>Date</Text>
              <Text style={TopUpStyles.detailValue}>
                {new Date(orderDetails?.date).toLocaleString()}
              </Text>
            </View>

            <View style={TopUpStyles.amountSection}>
              <Text style={TopUpStyles.amountLabel}>Total Amount</Text>
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
              label="Done"
              onPress={() => {
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

      <ContactsModal />
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

// Wrap the component with QueryClientProvider in your App or parent component
export default function TopupFlowScreenWrapper({ navigation, route }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TopupFlowScreen navigation={navigation} route={route} />
    </QueryClientProvider>
  );
}

const modalStyles = {
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center', 
    alignItems: 'center',
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
    borderTopLeftRadius: scale.hp(2.5),
    borderTopRightRadius: scale.hp(2.5),
    paddingTop: scale.hp(2),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale.wp(5),
    paddingBottom: scale.hp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: scale.hp(2.25),
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: scale.hp(0.5),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    margin: scale.wp(5),
    marginTop: scale.hp(2),
    paddingHorizontal: scale.wp(4),
    borderRadius: scale.hp(1.5),
    height: scale.hp(6),
  },
  searchIcon: {
    marginEnd: scale.wp(3),
  },
  searchInput: {
    flex: 1,
    fontSize: scale.hp(2),
    color: '#1F2937',
    height: '100%',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale.wp(5),
    paddingVertical: scale.hp(1.5),
  },
  contactAvatar: {
    width: scale.wp(10),
    height: scale.wp(10),
    borderRadius: scale.wp(5),
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: scale.wp(3),
  },
  contactAvatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: scale.hp(2),
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: scale.hp(2),
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: scale.hp(0.25),
  },
  contactPhone: {
    fontSize: scale.hp(1.75),
    color: '#6B7280',
  },
  contactSeparator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: scale.wp(18),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale.hp(7.5),
  },
  emptyText: {
    marginTop: scale.hp(1.5),
    fontSize: scale.hp(2),
    color: '#6B7280',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale.wp(5),
    paddingVertical: scale.hp(2),
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale.hp(2),
    padding: scale.hp(2.5),
    width: '100%',
    maxWidth: scale.wp(90),
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
};

const receiptStyles = StyleSheet.create({
  receiptCaptureContainer: {
    width: scale.wp(90),
    backgroundColor: '#ffffff',
    padding: scale.hp(3),
    borderRadius: scale.hp(1.5),
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale.hp(0.5) },
    shadowOpacity: 0.1,
    shadowRadius: scale.hp(1),
    elevation: 5,
  },
  captureHeader: {
    alignItems: 'center',
    marginBottom: scale.hp(2.5),
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    paddingBottom: scale.hp(2),
  },
  captureLogo: {
    width: scale.wp(50),
    height: scale.hp(6.25),
    marginBottom: scale.hp(1.25),
  },
  captureTitle: {
    fontSize: scale.hp(2.25),
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
  },
  captureStatusSection: {
    alignItems: 'center',
    marginBottom: scale.hp(2.5),
  },
  captureStatusTitle: {
    fontSize: scale.hp(2.5),
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  captureDetails: {
    marginBottom: scale.hp(2.5),
  },
  captureDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale.hp(1.25),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  captureDetailLabel: {
    fontSize: scale.hp(1.75),
    color: '#6B7280',
    fontWeight: '600',
    flex: 1,
  },
  captureDetailValue: {
    fontSize: scale.hp(1.75),
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  captureAmountSection: {
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: scale.hp(1),
    padding: scale.hp(2.5),
    marginBottom: scale.hp(2.5),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  captureAmountLabel: {
    fontSize: scale.hp(2),
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: scale.hp(1),
  },
  captureAmountValue: {
    fontSize: scale.hp(3),
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  captureAmountSubValue: {
    fontSize: scale.hp(2),
    color: '#6B7280',
    marginTop: scale.hp(0.5),
  },
  captureFooter: {
    alignItems: 'center',
    paddingTop: scale.hp(2),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  captureFooterText: {
    fontSize: scale.hp(1.75),
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: scale.hp(0.625),
  },
});