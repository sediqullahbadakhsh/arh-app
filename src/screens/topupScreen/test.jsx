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
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";
import PrimaryButton from "../../components/PrimaryButton";
import { codeToFlag } from "../../utils/flag";
import { DIAL_CODES, guessOperator } from "../../constants/dialing";
import { getCountries, makeRecharge, getCurrencies, getSlabs } from "../../services/customerAPIOrder";
import { getSetaraganMnoId } from "../../utils/getCompanyIdForSetaragan";
import * as Contacts from 'expo-contacts';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StepCountry from "./StepCountry";
import StepNumber from "./StepNumber";
import StepAmount from "./StepAmount";
import StepPay from "./StepPay";
import TopUpStyles from "./TopupStyle";
import formatLocal from "../../utils/formatLocal";
import { useTranslation } from "react-i18next";
import { useStripe } from "@stripe/stripe-react-native";

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
const BASE_STEPS = { COUNTRY: 0, NUMBER: 1, AMOUNT: 2, PAY: 3 };

// ProgressBar Component
const ProgressBar = ({ duration = 2000, onComplete, color = Colors.primary }) => {
  const progress = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (duration === 0) {
      // Infinite progress - just set to 50% and let it spin
      progress.setValue(50);
      return;
    }
    
    Animated.timing(progress, {
      toValue: 100,
      duration,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start(() => {
      if (onComplete) onComplete();
    });
  }, [duration]);

  const widthInterpolated = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={progressStyles.container}>
      <Animated.View 
        style={[
          progressStyles.bar, 
          { 
            width: duration === 0 ? '50%' : widthInterpolated,
            backgroundColor: color
          }
        ]} 
      />
    </View>
  );
};

// ProgressModal Component
const ProgressModal = ({
  visible = false,
  onCancel,
  title = "processingPayment",
  message = "processingPaymentMessage",
  duration = 3000,
  progressColor = Colors.primary,
  icon = "sync-outline",
  iconColor = Colors.primary,
  onComplete,
  cancelText = "cancel"
}) => {
  const { t } = useTranslation();
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [visible]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={progressStyles.modalOverlay}>
        <View style={progressStyles.progressModal}>
          <View style={progressStyles.progressContent}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons name={icon} size={52} color={iconColor} />
            </Animated.View>
            <Text style={progressStyles.progressTitle}>{t(title)}</Text>
            <Text style={progressStyles.progressText}>{t(message)}</Text>
            
            <ProgressBar 
              duration={duration} 
              onComplete={onComplete}
              color={progressColor}
            />
            
            {onCancel && (
              <TouchableOpacity 
                style={progressStyles.cancelButton}
                onPress={onCancel}
              >
                <Text style={progressStyles.cancelButtonText}>{t(cancelText)}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ReceiptModal Component
const ReceiptModal = ({ visible, onClose, transaction }) => {
  const [slideAnim] = useState(new Animated.Value(screenHeight));
  const { t } = useTranslation();

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'succeeded':
        return '#10B981';
      case 'failed':
        return '#EF4444';
      case 'pending':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'succeeded':
        return 'checkmark-circle';
      case 'failed':
        return 'close-circle';
      case 'pending':
        return 'time';
      default:
        return 'help-circle';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'succeeded':
        return t('status.succeeded');
      case 'failed':
        return t('status.failed');
      case 'pending':
        return t('status.pending');
      default:
        return status;
    }
  };

  const getServiceName = (source) => {
    switch (source) {
      case 'stripe_card':
        return t('services.mobileTopup');
      case 'data_bundle':
        return t('services.dataBundle');
      case 'game_coins':
        return t('services.gameCoins');
      default:
        return t('transaction');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const shareReceipt = async () => {
    try {
      const receiptText = `
🎫 Transaction Receipt

Service: ${getServiceName(transaction.source)}
Amount: ${Number(transaction.amount).toFixed(2)} ${transaction.currency}
Receiver: ${transaction.receiver}
Status: ${getStatusText(transaction.status)}
Date: ${formatDate(transaction.createdAt)}
Transaction ID: ${transaction.txnNumber}

Thank you for your business!
      `.trim();

      await Share.share({
        message: receiptText,
        title: 'Transaction Receipt',
      });
    } catch (error) {
      console.error('Error sharing receipt:', error);
      Alert.alert('Error', 'Failed to share receipt');
    }
  };

  const downloadPDF = async () => {
    Alert.alert(
      'Download PDF',
      'PDF download functionality will be implemented soon.',
      [{ text: 'OK' }]
    );
  };

  if (!transaction) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={receiptStyles.receiptModalOverlay}>
        <TouchableOpacity 
          style={receiptStyles.receiptModalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View 
          style={[
            receiptStyles.receiptModalContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={receiptStyles.receiptHeader}>
            <View style={receiptStyles.receiptHeaderLeft}>
              <TouchableOpacity onPress={onClose} style={receiptStyles.receiptCloseButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={receiptStyles.receiptHeaderCenter}>
              <Text style={receiptStyles.receiptTitle}>Receipt</Text>
            </View>
            
            <View style={receiptStyles.receiptHeaderRight}>
              <TouchableOpacity onPress={shareReceipt} style={receiptStyles.receiptHeaderActionButton}>
                <Ionicons name="share-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={downloadPDF} style={receiptStyles.receiptHeaderActionButton}>
                <Ionicons name="download-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={receiptStyles.receiptContent}>
            <View style={receiptStyles.receiptStatusSection}>
              <View style={[
                receiptStyles.receiptStatusIconContainer,
                { backgroundColor: `${getStatusColor(transaction.status)}15` }
              ]}>
                <Ionicons 
                  name={getStatusIcon(transaction.status)} 
                  size={80} 
                  color={getStatusColor(transaction.status)} 
                />
              </View>
            </View>

            <View style={receiptStyles.receiptTopSection}>
              <Text style={receiptStyles.receiptAmountValueTop}>
                {transaction.status === 'succeeded' ? 'Top-Up Success' : 
                 transaction.status === 'failed' ? 'Top-Up Failed' : 
                 'Processing Top-Up'}
              </Text>
            </View>

            <View style={receiptStyles.receiptDetailsGrid}>
              <View style={receiptStyles.receiptDetailItem}>
                <Text style={receiptStyles.receiptDetailLabel}>Transaction ID</Text>
                <Text style={receiptStyles.receiptDetailValue} numberOfLines={1} ellipsizeMode="middle">
                  {transaction.txnNumber}
                </Text>
              </View>
              
              <View style={receiptStyles.receiptDetailItem}>
                <Text style={receiptStyles.receiptDetailLabel}>Date & Time</Text>
                <Text style={receiptStyles.receiptDetailValue}>
                  {formatDate(transaction.createdAt)}
                </Text>
              </View>
              
              <View style={receiptStyles.receiptDetailItem}>
                <Text style={receiptStyles.receiptDetailLabel}>Receiver</Text>
                <Text style={receiptStyles.receiptDetailValue}>
                  {transaction.receiver}
                </Text>
              </View>
              
              <View style={receiptStyles.receiptDetailItem}>
                <Text style={receiptStyles.receiptDetailLabel}>Service</Text>
                <Text style={receiptStyles.receiptDetailValue}>
                  {getServiceName(transaction.source)}
                </Text>
              </View>

              <View style={receiptStyles.receiptDetailItem}>
                <Text style={receiptStyles.receiptDetailLabel}>Amount (AFN)</Text>
                <Text style={receiptStyles.receiptDetailValue}>
                  {transaction.afnAmount} AFN
                </Text>
              </View>

              <View style={receiptStyles.receiptDetailItem}>
                <Text style={receiptStyles.receiptDetailLabel}>Amount (USD)</Text>
                <Text style={receiptStyles.receiptDetailValue}>
                  ${transaction.amount} USD
                </Text>
              </View>
            </View>

            <View style={receiptStyles.receiptAmountSection}>
              <Text style={receiptStyles.receiptAmountLabel}>Total Amount</Text>
              <Text style={receiptStyles.receiptAmountValue}>
                ${transaction.amount} USD
              </Text>
            </View>

            <View style={receiptStyles.receiptAdditionalInfo}>
              <View style={receiptStyles.receiptInfoRow}>
                <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                <Text style={receiptStyles.receiptInfoText}>
                  {transaction.status === 'succeeded' 
                    ? 'Your transaction was completed successfully.' 
                    : transaction.status === 'failed'
                    ? 'Your transaction failed. Please try again.'
                    : 'Your transaction is being processed.'}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={receiptStyles.receiptActions}>
            <TouchableOpacity 
              style={receiptStyles.receiptPrimaryButton}
              onPress={onClose}
            >
              <Text style={receiptStyles.receiptPrimaryButtonText}>Done</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={receiptStyles.receiptShareButton}
              onPress={shareReceipt}
            >
              <Ionicons name="share-outline" size={20} color={Colors.primary} />
              <Text style={receiptStyles.receiptShareButtonText}>Share Receipt</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Main TopupFlowScreen Component
export default function TopupFlowScreen({ navigation }) {
  const { t } = useTranslation();
  const { confirmPayment } = useStripe();
  const lastStep = BASE_STEPS.PAY;
  const [countries, setCountries] = useState([])
  const [step, setStep] = useState(0);
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
  const [serviceType, setServiceType] = useState('recharge');
  const [showPopularAmounts, setShowPopularAmounts] = useState(true);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [paymentMethodId, setPaymentMethodId] = useState(null);
  const [product, setProduct] = useState(null);
  const [customAfn, setCustomAfn] = useState("");
  const [localNumber, setLocalNumber] = useState("");
  const [cardDetailsComplete, setCardDetailsComplete] = useState(false);

  // Modal states
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null);

  const [contactsSlideAnim] = useState(new Animated.Value(screenHeight));
  const [countriesSlideAnim] = useState(new Animated.Value(screenHeight));
  const insets = useSafeAreaInsets();
  const continueButtonAnim = useRef(new Animated.Value(0)).current;

  const dial = DIAL_CODES[country?.countryCode] || "";
  const operator = guessOperator(country?.countryCode, localNumber.replace(/\D/g, ""));

  const calculateUsdAmount = (afnAmount) => {
    if (!exchangeRate || !afnAmount) return 0;
    const baseAmount = parseFloat(afnAmount) * exchangeRate;
    const feeAmount = baseAmount * (slabPercentage / 100);
    const totalAmount = baseAmount + feeAmount;
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

  useEffect(() => {
    const getAllCountries = async () => {
      const res = await getCountries()
      setCountries(res?.data)
      const afgCountry = res.data.find((c) => c.countryCode === "AF")
      setCountry(afgCountry)
    }
    getAllCountries()
  }, [])

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
          const afnToUsdRate = parseFloat(rateData.data[0].target_amount);
          const usdToAfnRate = parseFloat(rateData.data[0].source_amount);
          
          console.log("AFN to USD Rate:", afnToUsdRate);
          console.log("USD to AFN Rate:", usdToAfnRate);
          
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
        Alert.alert(t('permissionDenied'), t('contactsPermissionDenied'));
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert(t('error'), t('failedToLoadContacts'));
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

  const canNext =
    (step === BASE_STEPS.COUNTRY && !!country) ||
    (step === BASE_STEPS.NUMBER && localNumber.replace(/\D/g, "").length >= 7) ||
    (step === BASE_STEPS.AMOUNT && serviceType === 'recharge' && afn > 0) ||
    (step === BASE_STEPS.AMOUNT && serviceType === 'bundle') ||
    (step === BASE_STEPS.PAY && cardDetailsComplete);

  const goBack = () => (step > 0 ? setStep(step - 1) : navigation.goBack());

  const goNext = () => {
    if (!canNext) return;
    if (step === BASE_STEPS.AMOUNT && serviceType === 'bundle') {
      Alert.alert(t('comingSoon'), t('bundleComingSoon'));
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
    setTimeout(() => {
      if (canNext) {
        goNext();
      }
    }, 300);
  };

  const handleProgressComplete = () => {
    setShowProgressModal(false);
    
    // Simulate different outcomes for demo
    const outcomes = ['success', 'failed'];
    const randomOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
    
    if (randomOutcome === 'success') {
      setTransactionResult({
        status: 'succeeded',
        source: 'stripe_card',
        amount: usd,
        currency: 'USD',
        receiver: `${dial} ${formatLocal(localNumber)}`,
        createdAt: new Date().toISOString(),
        txnNumber: `TX${Date.now()}`,
        afnAmount: afn
      });
      setShowReceiptModal(true);
    } else {
      setTransactionResult({
        status: 'failed',
        source: 'stripe_card',
        amount: usd,
        currency: 'USD',
        receiver: `${dial} ${formatLocal(localNumber)}`,
        createdAt: new Date().toISOString(),
        txnNumber: `TX${Date.now()}`,
        afnAmount: afn,
        error: t('paymentFailedGeneric')
      });
      setShowReceiptModal(true);
    }
  };

  const resetFlow = () => {
    setStep(0);
    setProduct(null);
    setCustomAfn("");
    setLocalNumber("");
    setCardDetailsComplete(false);
    setPaymentMethodId(null);
    setTransactionResult(null);
  };

 const recharge = async () => {
  if (!paymentMethodId) {
    Alert.alert(t('error'), t('pleaseEnterCardDetails'));
    return;
  }

  setLoading(true);
  setShowProgressModal(true);
  
  try {
    const operatorId = getSetaraganMnoId(localNumber);

    if (!operatorId) {
      setTransactionResult({
        status: 'failed',
        source: 'stripe_card',
        amount: usd,
        currency: 'USD',
        receiver: `${dial} ${formatLocal(localNumber)}`,
        createdAt: new Date().toISOString(),
        txnNumber: `TX${Date.now()}`,
        afnAmount: afn,
        error: t('invalidMobileNetwork')
      });
      setShowProgressModal(false);
      setShowReceiptModal(true);
      setLoading(false);
      return;
    }

    const payload = {
      amount: afn,
      companyId: "",
      countryId: country?.id,
      currency: "AFN",
      operator: operatorId,
      productId: 1,
      receiver: localNumber.replace(/\D/g, ""),
      source: "stripe_card",
      cardCurrency: "USD",
      cardAmount: usd,
      confirmNow: true,
      paymentMethodId: paymentMethodId,
      customAmount: afn,
    };

    console.log("Sending recharge payload:", payload);

    const response = await makeRecharge(payload);
    
    // Handle the actual API response instead of simulating
    if (response.status === "processing" || response.status === "queued" || response.success) {
      setTransactionResult({
        status: 'succeeded',
        source: 'stripe_card',
        amount: usd,
        currency: 'USD',
        receiver: `${dial} ${formatLocal(localNumber)}`,
        createdAt: new Date().toISOString(),
        txnNumber: response.txnNumber || `TX${Date.now()}`,
        afnAmount: afn
      });
    } else if (response.status === "requires_action") {
      const { error } = await confirmPayment(response.nextAction.clientSecret);
      if (error) {
        throw new Error(error.message);
      } else {
        setTransactionResult({
          status: 'succeeded',
          source: 'stripe_card',
          amount: usd,
          currency: 'USD',
          receiver: `${dial} ${formatLocal(localNumber)}`,
          createdAt: new Date().toISOString(),
          txnNumber: response.txnNumber || `TX${Date.now()}`,
          afnAmount: afn
        });
      }
    } else {
      throw new Error(response.error || 'Payment failed');
    }

  } catch (error) {
    console.log("Payment error: ", error);
    const message = error.response?.data?.error || error.message || t('paymentFailedGeneric');
    setTransactionResult({
      status: 'failed',
      source: 'stripe_card',
      amount: usd,
      currency: 'USD',
      receiver: `${dial} ${formatLocal(localNumber)}`,
      createdAt: new Date().toISOString(),
      txnNumber: `TX${Date.now()}`,
      afnAmount: afn,
      error: message
    });
  } finally {
    setLoading(false);
    setShowProgressModal(false);
    setShowReceiptModal(true);
  }
};

  const handleRetryPayment = () => {
    setShowReceiptModal(false);
    recharge();
  };

  const handleReceiptClose = () => {
    setShowReceiptModal(false);
    if (transactionResult?.status === 'succeeded') {
      resetFlow();
      navigation.popToTop();
    }
  };

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

            {filteredContacts.length > 0 ? (
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
              ItemSeparatorComponent={() => <View style={modalStyles.contactSeparator} />}
            />
          </Animated.View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ServiceHeader title={t('mobileTopup')} onBack={goBack} />

      {/* Progress Modal */}
    <ProgressModal
  visible={showProgressModal}
  onCancel={() => {
    setShowProgressModal(false);
    setLoading(false);
  }}
  title="processingPayment"
  message="processingPaymentMessage"
  duration={0} // Set to 0 or remove to make it indefinite
  progressColor={Colors.primary}
  icon="sync-outline"
  iconColor={Colors.primary}
  // Remove onComplete prop - we'll handle completion in recharge function
  cancelText="cancel"
/>

      {/* Receipt Modal */}
      <ReceiptModal
        visible={showReceiptModal}
        onClose={handleReceiptClose}
        transaction={transactionResult}
      />

      {/* Main Flow Content */}
      {!showProgressModal && !showReceiptModal && (
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
                calculateUsdAmount={calculateUsdAmount}
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
                onCardDetailsChange={(complete, methodId) => {
                  setCardDetailsComplete(complete);
                  if (methodId) setPaymentMethodId(methodId);
                }}
              />
            )}

            {step !== BASE_STEPS.AMOUNT && (
              <>
                <PrimaryButton
                  label={
                    step === lastStep
                      ? `${t('pay')} $${usd} USD`
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

      {/* Add retry button for failed transactions */}
      {showReceiptModal && transactionResult?.status === 'failed' && (
        <View style={receiptStyles.retryContainer}>
          <PrimaryButton
            label={t('tryAgain')}
            onPress={handleRetryPayment}
            style={receiptStyles.retryButton}
          />
        </View>
      )}

      <ContactsModal />
      <CountriesModal />
    </SafeAreaView>
  );
}

const modalStyles = {
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
    paddingTop: 16,
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
  contactAvatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
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
};

const progressStyles = {
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  progressModal: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  progressContent: {
    alignItems: 'center',
    width: '100%',
  },
  progressTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    height: 8,
    width: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 8,
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
};

const receiptStyles = {
  receiptModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  receiptModalContainer: {
    width: '90%',
    maxWidth: 400,
    height: '90%',
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  receiptHeaderLeft: {
    flex: 1,
  },
  receiptHeaderCenter: {
    flex: 2,
    alignItems: 'center',
  },
  receiptHeaderRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  receiptCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptHeaderActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  receiptContent: {
    flex: 1,
    padding: 20,
  },
  receiptStatusSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  receiptStatusIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptTopSection: {
    alignItems: 'center',
  },
  receiptAmountValueTop: {
    fontSize: 24,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 24,
    color: Colors.textPrimary,
  },
  receiptDetailsGrid: {
    marginBottom: 24,
  },
  receiptDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  receiptDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  receiptDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  receiptAmountSection: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
  },
  receiptAmountLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  receiptAmountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  receiptAdditionalInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  receiptInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptInfoText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  receiptActions: {
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  receiptPrimaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "100%",
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptPrimaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  receiptShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  receiptShareButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  retryContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
  },
};