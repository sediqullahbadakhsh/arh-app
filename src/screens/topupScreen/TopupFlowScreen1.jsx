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

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
const BASE_STEPS = { COUNTRY: 0, NUMBER: 1, AMOUNT: 2, PAY: 3 };

// ProgressBar Component
const ProgressBar = ({ duration = 2000, onComplete, color = Colors.primary }) => {
  const progress = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(progress, {
      toValue: 100,
      duration,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start(() => {
      if (onComplete) onComplete();
    });
  }, []);

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
            width: widthInterpolated,
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

// SuccessModal Component
const SuccessModal = ({
  visible = false,
  onClose,
  onShare,
  title = "topupSuccessful",
  subtitle = "topupSuccessfulMessage",
  details = [],
  primaryButtonText = "done",
  shareButtonText = "shareReceipt",
}) => {
  const { t } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const renderDetailIcon = (type) => {
    const iconMap = {
      amount: 'cash-outline',
      transaction: 'receipt-outline',
      time: 'time-outline',
      date: 'calendar-outline',
      user: 'person-outline',
      default: 'information-circle-outline'
    };

    return (
      <View style={successStyles.detailIcon}>
        <Ionicons 
          name={iconMap[type] || iconMap.default} 
          size={20} 
          color={Colors.primary} 
        />
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={successStyles.modalOverlay}>
        <Animated.View 
          style={[
            successStyles.successModal,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            }
          ]}
        >
          <View style={successStyles.successContent}>
            <View style={successStyles.successHeader}>
              <View style={successStyles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
              </View>
              <View style={successStyles.successConfetti}>
                <Ionicons name="sparkles" size={24} color="#FFD700" />
                <Ionicons name="sparkles" size={20} color="#FF6B6B" style={{ marginLeft: 8 }} />
                <Ionicons name="sparkles" size={22} color="#4ECDC4" style={{ marginLeft: 8 }} />
              </View>
            </View>
            
            <Text style={successStyles.successTitle}>{t(title)}</Text>
            <Text style={successStyles.successSubtitle}>{t(subtitle)}</Text>
            
            {details.length > 0 && (
              <View style={successStyles.successDetails}>
                {details.map((detail, index) => (
                  <View key={index} style={successStyles.detailRow}>
                    {renderDetailIcon(detail.type)}
                    <View style={successStyles.detailTextContainer}>
                      <Text style={successStyles.detailLabel}>{t(detail.label)}</Text>
                      <Text style={successStyles.detailValue}>{detail.value}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={successStyles.successActions}>
              {onShare && (
                <TouchableOpacity 
                  style={successStyles.shareButton}
                  onPress={onShare}
                >
                  <Ionicons name="share-outline" size={20} color={Colors.primary} />
                  <Text style={successStyles.shareButtonText}>{t(shareButtonText)}</Text>
                </TouchableOpacity>
              )}
              
              <PrimaryButton
                label={t(primaryButtonText)}
                onPress={onClose}
                style={{ 
                  flex: onShare ? 1 : undefined, 
                  marginLeft: onShare ? 12 : 0,
                  minWidth: onShare ? undefined : '100%'
                }}
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// FailedModal Component
const FailedModal = ({ 
  visible, 
  onClose, 
  onRetry,
  title = "paymentFailed",
  subtitle = "paymentFailedMessage",
  errorDetails = "",
  primaryButtonText = "tryAgain",
  secondaryButtonText = "cancel"
}) => {
  const { t } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
        ])
      ]).start();
    } else {
      scaleAnim.setValue(0);
      shakeAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={failedStyles.modalOverlay}>
        <Animated.View 
          style={[
            failedStyles.failedModal,
            {
              transform: [
                { scale: scaleAnim },
                { translateX: shakeAnim }
              ]
            }
          ]}
        >
          <View style={failedStyles.failedContent}>
            <View style={failedStyles.failedIconContainer}>
              <Ionicons name="close-circle" size={80} color="#FF6B6B" />
            </View>
            
            <Text style={failedStyles.failedTitle}>{t(title)}</Text>
            <Text style={failedStyles.failedSubtitle}>{t(subtitle)}</Text>
            
            {errorDetails ? (
              <View style={failedStyles.errorDetails}>
                <Text style={failedStyles.errorDetailsText}>{errorDetails}</Text>
              </View>
            ) : null}

            <View style={failedStyles.failedActions}>
              <TouchableOpacity 
                style={failedStyles.retryButton}
                onPress={onRetry}
              >
                <Ionicons name="refresh" size={20} color="white" />
                <Text style={failedStyles.retryButtonText}>{t(primaryButtonText)}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={failedStyles.cancelButton}
                onPress={onClose}
              >
                <Text style={failedStyles.cancelButtonText}>{t(secondaryButtonText)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// PendingModal Component
const PendingModal = ({ 
  visible, 
  onClose, 
  title = "paymentProcessing", 
  message = "paymentProcessingMessage",
  estimatedTime = "2-5 minutes"
}) => {
  const { t } = useTranslation();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={pendingStyles.modalOverlay}>
        <View style={pendingStyles.pendingModal}>
          <View style={pendingStyles.pendingContent}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Ionicons name="time" size={60} color="#FFA500" />
            </Animated.View>
            
            <Text style={pendingStyles.pendingTitle}>{t(title)}</Text>
            <Text style={pendingStyles.pendingMessage}>{t(message)}</Text>
            
            <View style={pendingStyles.timeEstimate}>
              <Ionicons name="information-circle" size={16} color="#666" />
              <Text style={pendingStyles.timeEstimateText}>
                {t('estimatedTime')}: {estimatedTime}
              </Text>
            </View>

            <View style={pendingStyles.loadingDots}>
              <Animated.View style={[pendingStyles.dot, { opacity: pulseAnim }]} />
              <Animated.View style={[pendingStyles.dot, { opacity: pulseAnim }]} />
              <Animated.View style={[pendingStyles.dot, { opacity: pulseAnim }]} />
            </View>
            
            <TouchableOpacity 
              style={pendingStyles.closeButton}
              onPress={onClose}
            >
              <Text style={pendingStyles.closeButtonText}>{t('iUnderstand')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Main TopupFlowScreen Component
export default function TopupFlowScreen({ navigation }) {
  const { t } = useTranslation();
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
  const continueButtonAnim = useRef(new Animated.Value(0)).current;

  // Modal states
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null);
  const [errorDetails, setErrorDetails] = useState("");

  const [contactsSlideAnim] = useState(new Animated.Value(screenHeight));
  const [countriesSlideAnim] = useState(new Animated.Value(screenHeight));
  const insets = useSafeAreaInsets();

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

  const [localNumber, setLocalNumber] = useState("");
  const dial = DIAL_CODES[country?.countryCode] || "";
  const operator = guessOperator(country?.countryCode, localNumber.replace(/\D/g, ""));

  const [product, setProduct] = useState(null);
  const [customAfn, setCustomAfn] = useState("");

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

  const [cardDetailsComplete, setCardDetailsComplete] = useState(false);

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
    const outcomes = ['success', 'pending', 'failed'];
    const randomOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
    
    if (randomOutcome === 'success') {
      setTransactionResult({
        mobile: `${dial} ${formatLocal(localNumber)}`,
        amountUsd: usd,
        amountAfn: afn,
        txId: `TX${Date.now()}`,
        date: new Date().toISOString(),
        status: "success"
      });
      setShowSuccessModal(true);
    } else if (randomOutcome === 'pending') {
      setShowPendingModal(true);
    } else {
      setErrorDetails(t('insufficientFundsError'));
      setShowFailedModal(true);
    }
  };

  const resetFlow = () => {
    setStep(0);
    setProduct(null);
    setCustomAfn("");
    setLocalNumber("");
    setCardDetailsComplete(false);
    setTransactionResult(null);
    setErrorDetails("");
  };

  const recharge = async () => {
    setLoading(true);
    setShowProgressModal(true);
    
    try {
      const operatorId = getSetaraganMnoId(localNumber);

      if (!operatorId) {
        setErrorDetails(t('invalidMobileNetwork'));
        setShowProgressModal(false);
        setShowFailedModal(true);
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

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // For demo purposes, we'll let handleProgressComplete handle the outcome
      // In real implementation, you would process the actual API response here

    } catch (error) {
      console.log("Payment error: ", error);
      const message = error.response?.data?.error || error.message || t('paymentFailedGeneric');
      setErrorDetails(message);
      setShowProgressModal(false);
      setShowFailedModal(true);
    }
    setLoading(false);
  };

  const handleRetryPayment = () => {
    setShowFailedModal(false);
    recharge();
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

  // Fixed ContactsModal Component
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

  // Fixed CountriesModal Component
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
        duration={3000}
        progressColor={Colors.primary}
        icon="sync-outline"
        iconColor={Colors.primary}
        onComplete={handleProgressComplete}
        cancelText="cancel"
      />

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          resetFlow();
          navigation.popToTop();
        }}
        onShare={() => {
          // Add share functionality here
          console.log("Share receipt");
        }}
        title="topupSuccessful"
        subtitle="topupSuccessfulMessage"
        details={[
          { type: 'amount', label: 'amount', value: `${transactionResult?.amountAfn} AFN` },
          { type: 'transaction', label: 'transactionId', value: transactionResult?.txId },
          { type: 'time', label: 'date', value: new Date(transactionResult?.date).toLocaleString() },
        ]}
        primaryButtonText="done"
        shareButtonText="shareReceipt"
      />

      {/* Failed Modal */}
      <FailedModal
        visible={showFailedModal}
        onClose={() => {
          setShowFailedModal(false);
          resetFlow();
        }}
        onRetry={handleRetryPayment}
        title="paymentFailed"
        subtitle="paymentFailedMessage"
        errorDetails={errorDetails}
        primaryButtonText="tryAgain"
        secondaryButtonText="cancel"
      />

      {/* Pending Modal */}
      <PendingModal
        visible={showPendingModal}
        onClose={() => {
          setShowPendingModal(false);
          resetFlow();
        }}
        title="paymentProcessing"
        message="paymentProcessingMessage"
        estimatedTime="2-5 minutes"
      />

      {/* Main Flow Content */}
      {!showProgressModal && !showSuccessModal && !showPendingModal && !showFailedModal && (
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
                onCardDetailsChange={(complete) => setCardDetailsComplete(complete)}
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

// Enhanced Styles (keep the same as before)
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

const successStyles = {
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successModal: {
    backgroundColor: 'white',
    borderRadius: 28,
    width: '90%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 15,
    overflow: 'hidden',
  },
  successContent: {
    alignItems: 'center',
    width: '100%',
    padding: 32,
  },
  successHeader: {
    position: 'relative',
    marginBottom: 8,
  },
  successIconContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 50,
    padding: 8,
  },
  successConfetti: {
    position: 'absolute',
    top: -10,
    right: -10,
    flexDirection: 'row',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  successDetails: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  successActions: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 14,
    flex: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  shareButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
};

const failedStyles = {
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  failedModal: {
    backgroundColor: 'white',
    borderRadius: 28,
    width: '90%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 15,
    overflow: 'hidden',
  },
  failedContent: {
    alignItems: 'center',
    width: '100%',
    padding: 32,
  },
  failedIconContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 50,
    padding: 8,
    marginBottom: 16,
  },
  failedTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  failedSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorDetails: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorDetailsText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  failedActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  retryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: Colors.primary,
    borderRadius: 14,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
};

const pendingStyles = {
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pendingModal: {
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
  pendingContent: {
    alignItems: 'center',
    width: '100%',
  },
  pendingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  pendingMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  timeEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 24,
  },
  timeEstimateText: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  loadingDots: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFA500',
    marginHorizontal: 4,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  closeButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
};