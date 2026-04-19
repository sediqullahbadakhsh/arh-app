//screens/topupscreen/StepPay.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Alert, 
  View,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  LayoutAnimation,
  UIManager
} from "react-native";
import { CardField, useStripe } from "@stripe/stripe-react-native";
import TopUpStyles from "./TopupStyle";
import { Colors } from "../../theme/colors";
import { useTranslation } from "react-i18next";
import { scale } from "../../utils/normalizeSize";
import { Ionicons } from "@expo/vector-icons";

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

function StepPay({
  summary,
  onEditAmount,
  onCardDetailsChange,
}) {
  const { t } = useTranslation();
  const { createPaymentMethod } = useStripe();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState(null);
  const [isCreatingPaymentMethod, setIsCreatingPaymentMethod] = useState(false);
  const [paymentMethodId, setPaymentMethodId] = useState(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollViewRef = useRef(null);
  const cardFieldRef = useRef(null);

  const {
    mobile,
    afn = 0,
    totalAfn = 0,
    baseAmount = 0,
    feeAmount = 0,
    totalAmount = 0,
    slabPercentage = 0,
    serviceSlabPercentage = 0,
    appliedPromoCode,
    discountAmount = 0,
    finalAmount = 0,
    onApplyPromoCode,
    onRemovePromoCode,
    openPromoModal,
    product
  } = summary;

  const paymentMethods = [
    { 
      id: 'card', 
      label: t('creditDebitCard'), 
      icon: require('../../../assets/images/credit-card.png'),
      showCardDetails: true
    },
    { 
      id: 'paypal', 
      label: t('paypal'), 
      icon: require('../../../assets/images/paypal.png'),
      showCardDetails: false
    },
    { 
      id: 'googlepay', 
      label: t('googlePay'), 
      icon: require('../../../assets/images/google-pay.png'),
      showCardDetails: false
    },
  ];

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKeyboardVisible(true);
        
        if (selectedPaymentMethod === 'card') {
          setTimeout(() => {
            scrollToCardField();
          }, 250);
        }
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [selectedPaymentMethod]);

  const scrollToCardField = useCallback(() => {
    if (scrollViewRef.current && selectedPaymentMethod === 'card') {
      scrollViewRef.current.scrollTo({ y: 200, animated: true });
    }
  }, [selectedPaymentMethod]);

  const handleCardFieldFocus = useCallback(() => {
    setTimeout(() => {
      scrollToCardField();
    }, 300);
  }, [scrollToCardField]);

  const getSummaryValue = (key, defaultValue = 0) => {
    if (summary && typeof summary[key] === 'function') {
      return summary[key]();
    }
    return summary && summary[key] !== undefined ? summary[key] : defaultValue;
  };

  useEffect(() => {
    const createStripePaymentMethod = async () => {
      if (!cardDetails?.complete || isCreatingPaymentMethod) return;

      setIsCreatingPaymentMethod(true);
      
      try {
        console.log('Creating PaymentMethod with Stripe CardField...');

        const { paymentMethod, error } = await createPaymentMethod({
          paymentMethodType: 'Card',
        });

        if (error) {
          console.error('Error creating PaymentMethod:', error);
          Alert.alert(t('paymentError'), error.message);
          onCardDetailsChange(false, null);
          setPaymentMethodId(null);
        } else if (paymentMethod) {
          console.log('PaymentMethod created successfully:', paymentMethod.id);
          setPaymentMethodId(paymentMethod.id);
          onCardDetailsChange(true, paymentMethod.id);
        }
      } catch (error) {
        console.error('Exception creating PaymentMethod:', error);
        Alert.alert(t('error'), t('paymentMethodCreationFailed'));
        onCardDetailsChange(false, null);
        setPaymentMethodId(null);
      } finally {
        setIsCreatingPaymentMethod(false);
      }
    };

    if (selectedPaymentMethod === 'card' && cardDetails?.complete) {
      const timer = setTimeout(() => {
        createStripePaymentMethod();
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setPaymentMethodId(null);
      onCardDetailsChange(false, null);
    }
  }, [cardDetails, selectedPaymentMethod]);

  const handlePaymentMethodSelect = useCallback((methodId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedPaymentMethod(methodId);
    setPaymentMethodId(null);
    setCardDetails(null);

    Keyboard.dismiss();
    
    if (methodId !== 'card') {
      onCardDetailsChange(false, null);
    }
  }, [onCardDetailsChange]);

  const handleCardFieldChange = useCallback((cardDetails) => {
    setCardDetails(cardDetails);
    if (!cardDetails.complete && paymentMethodId) {
      setPaymentMethodId(null);
      onCardDetailsChange(false, null);
    }
  }, [paymentMethodId, onCardDetailsChange]);

  const clearCardDetails = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCardDetails(null);
    setPaymentMethodId(null);
    onCardDetailsChange(false, null);
    Keyboard.dismiss();
  }, [onCardDetailsChange]);

  const getBaseAmount = () => {
    if (product?.basePriceInUSD) {
      return parseFloat(product.basePriceInUSD);
    }
    return getSummaryValue('baseAmount', 0);
  };

  const getAfnAmount = () => {
    if (product?.basePrice) {
      return parseFloat(product.basePrice);
    }
    return getSummaryValue('afn', 0);
  };

  const getTotalUsdAmount = () => {
    if (product?.totalAmountInUSD) {
      return parseFloat(product.totalAmountInUSD);
    }
    return getSummaryValue('totalAmount', 0);
  };

  const getServiceFee = () => {
    const baseAmount = getBaseAmount();
    const totalAmount = getTotalUsdAmount();
    
    return Math.max(0, totalAmount - baseAmount);
  };

  const getServiceSlabPercentage = () => {
    if (product?.serviceSlabPercentage) {
      return parseFloat(product.serviceSlabPercentage);
    }
    return getSummaryValue('serviceSlabPercentage', 0);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 20
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustContentInsets={false}
        scrollEventThrottle={16}
        onScrollEndDrag={Keyboard.dismiss}
        contentInsetAdjustmentBehavior="never"
      >
        <View>
          <Text style={TopUpStyles.sectionTitle}>
            {t('paymentMethod')}
          </Text>
          <View style={styles.paymentMethodContainer}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethodButton,
                  selectedPaymentMethod === method.id && styles.paymentMethodButtonSelected
                ]}
                onPress={() => handlePaymentMethodSelect(method.id)}
                disabled={isCreatingPaymentMethod}
              >
                <View style={styles.paymentMethodContent}>
                  <Image 
                    source={method.icon} 
                    style={[
                      styles.paymentIcon,
                      selectedPaymentMethod === method.id && styles.paymentIconSelected
                    ]}
                    resizeMode="contain"
                  />
                  <Text style={[
                    styles.paymentMethodText,
                    selectedPaymentMethod === method.id && styles.paymentMethodTextSelected
                  ]}>
                    {method.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.promoSection}>
            {appliedPromoCode ? (
              <View style={styles.appliedPromoContainer}>
                <View style={styles.appliedPromoInfo}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={styles.appliedPromoText}>
                    {t('promoCode.applied')}: {appliedPromoCode.code}
                  </Text>
                  <Text style={styles.discountText}>
                    -${discountAmount.toFixed(2)}
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => {
                    Keyboard.dismiss();
                    onRemovePromoCode();
                  }} 
                  style={styles.removePromoButton}
                >
                  <Text style={styles.removePromoText}>{t('promoCode.remove')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.promoButton} 
                onPress={() => {
                  Keyboard.dismiss();
                  openPromoModal();
                }}
              >
                <Ionicons name="pricetag-outline" size={20} color={Colors.primary} />
                <Text style={styles.promoButtonText}>{t('promoCode.havePromoCode')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {selectedPaymentMethod === 'card' && (
            <View style={styles.cardDetailsContainer}>
              <View style={styles.fieldContainer}>
                <View style={styles.fieldHeader}>
                  <Text style={styles.fieldLabel}>{t('cardDetails')}</Text>
                  {cardDetails && (
                    <TouchableOpacity onPress={clearCardDetails} style={styles.clearButton}>
                      <Text style={styles.clearButtonText}>{t('clear')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity 
                  activeOpacity={1}
                  onPress={handleCardFieldFocus}
                  style={styles.cardFieldWrapper}
                >
                  <CardField
                    ref={cardFieldRef}
                    postalCodeEnabled={false}
                    placeholders={{
                      number: '1234 1234 1234 1234',
                      expiration: 'MM/YY',
                      cvc: 'CVC',
                    }}
                    cardStyle={{
                      backgroundColor: '#FFFFFF',
                      textColor: '#000000',
                      borderWidth: 1,
                      borderColor: cardDetails?.complete ? '#10B981' : '#E0E0E0',
                      borderRadius: 8,
                      fontSize: 16,
                    }}
                    style={{
                      width: '100%',
                      height: 50,
                      marginVertical: 8,
                    }}
                    onCardChange={handleCardFieldChange}
                    onFocus={handleCardFieldFocus}
                  />
                </TouchableOpacity>
                {cardDetails?.error && (
                  <Text style={styles.errorText}>
                    {cardDetails.error.message || t('cardError')}
                  </Text>
                )}
              </View>
              <Text style={[TopUpStyles.smallLabel, { marginTop: 16 }]}>
                {t('securePaymentNotice')}
              </Text>
            </View>
          )}

          {selectedPaymentMethod === 'paypal' && (
            <View style={styles.altPaymentContainer}>
              <Image 
                source={require('../../../assets/images/paypal.png')} 
                style={styles.paymentLogo} 
                resizeMode="contain"
              />
              <Text style={styles.altPaymentText}>
                {t('paypalRedirect')}
              </Text>
              <TouchableOpacity 
                style={[styles.paymentButton, { backgroundColor: '#CD0202' }]}
                onPress={() => Keyboard.dismiss()}
              >
                <Image 
                  source={require('../../../assets/images/paypal.png')} 
                  style={styles.buttonIcon} 
                  resizeMode="contain"
                />
                <Text style={styles.paymentButtonText}>{t('continueWithPaypal')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {selectedPaymentMethod === 'googlepay' && (
            <View style={styles.altPaymentContainer}>
              <Image 
                source={require('../../../assets/images/google-pay.png')} 
                style={styles.paymentLogo} 
                resizeMode="contain"
              />
              <Text style={styles.altPaymentText}>
                {t('googlePayRedirect')}
              </Text>
              <TouchableOpacity 
                style={[styles.paymentButton, { backgroundColor: '#CD0202' }]}
                onPress={() => Keyboard.dismiss()}
              >
                <Image 
                  source={require('../../../assets/images/google-pay.png')} 
                  style={styles.buttonIcon} 
                  resizeMode="contain"
                />
                <Text style={styles.paymentButtonText}>{t('payWithGooglePay')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={[TopUpStyles.summaryCard, { marginTop: 20 }]}>
            <View style={TopUpStyles.summaryRow}>
              <Text style={TopUpStyles.summaryKey}>{t('mobileNumber')}</Text>
              <Text style={TopUpStyles.summaryValue}>{getSummaryValue('mobile', 'N/A')}</Text>
            </View>
            
            <View style={TopUpStyles.summaryRow}>
              <Text style={TopUpStyles.summaryKey}>{t('amountToSend')}</Text>
              <Text style={TopUpStyles.summaryValue}>{getAfnAmount().toFixed(2)} AFN</Text>
            </View>
            
            {/* <View style={TopUpStyles.summaryRow}>
              <Text style={TopUpStyles.summaryKey}>{t('baseAmount')}</Text>
              <Text style={TopUpStyles.summaryValue}>${getBaseAmount().toFixed(2)} USD</Text>
            </View> */}
            
            {/* {getServiceFee() > 0 && (
              <View style={TopUpStyles.summaryRow}>
                <Text style={TopUpStyles.summaryKey}>
                  {t('serviceFee')} ({getServiceSlabPercentage()}%)
                </Text>
                <Text style={TopUpStyles.summaryValue}>
                  ${getServiceFee().toFixed(2)} USD
                </Text>
              </View>
            )} */}
            
            {appliedPromoCode && (
              <View style={TopUpStyles.summaryRow}>
                <Text style={TopUpStyles.summaryKey}>{t('promoCode.discount')}</Text>
                <Text style={[TopUpStyles.summaryValue, { color: '#10B981' }]}>
                  -${discountAmount.toFixed(2)} USD
                </Text>
              </View>
            )}

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
                ${finalAmount.toFixed(2)} USD
              </Text>
            </View>
            
            <TouchableOpacity 
              onPress={() => {
                Keyboard.dismiss();
                onEditAmount();
              }} 
              style={{ marginTop: 8 }}
            >
              <Text style={[TopUpStyles.editLink, { alignSelf: "flex-end" }]}>
                {t('changeAmount')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  paymentMethodContainer: {
    flexDirection: 'column',
    width: '100%',
    marginVertical: scale.hp(1.5),
    gap: scale.hp(1),
  },
  paymentMethodButton: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: scale.hp(1.5),
    paddingHorizontal: scale.wp(4),
    borderRadius: scale.hp(1.5),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    marginBottom: scale.hp(1),
  },
  paymentMethodButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentIcon: {
    width: scale.wp(6),
    height: scale.wp(6),
    marginEnd: scale.wp(2),
    tintColor: Colors.textSecondary,
  },
  paymentIconSelected: {
    tintColor: Colors.primary,
  },
  paymentMethodText: {
    fontSize: scale.hp(1.75),
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  paymentMethodTextSelected: {
    color: Colors.primary,
  },
  promoSection: {
    marginVertical: scale.hp(2),
  },
  promoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale.hp(1.5),
    paddingHorizontal: scale.wp(4),
    borderRadius: scale.hp(1),
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  promoButtonText: {
    color: Colors.primary,
    fontSize: scale.hp(1.75),
    fontWeight: '600',
    marginStart: scale.wp(2),
  },
  appliedPromoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale.hp(1.5),
    borderRadius: scale.hp(1),
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  appliedPromoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appliedPromoText: {
    color: '#065F46',
    fontSize: scale.hp(1.75),
    fontWeight: '600',
    marginLeft: scale.wp(2),
    marginRight: scale.wp(2),
  },
  discountText: {
    color: '#10B981',
    fontSize: scale.hp(1.75),
    fontWeight: '700',
  },
  removePromoButton: {
    padding: scale.hp(0.5),
  },
  removePromoText: {
    color: '#EF4444',
    fontSize: scale.hp(1.5),
    fontWeight: '500',
  },
  cardDetailsContainer: {
    marginTop: scale.hp(1),
  },
  fieldContainer: {
    marginBottom: scale.hp(2),
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale.hp(1),
  },
  fieldLabel: {
    fontSize: scale.hp(1.75),
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  clearButton: {
    padding: scale.hp(0.5),
  },
  clearButtonText: {
    color: Colors.primary,
    fontSize: scale.hp(1.5),
    fontWeight: '500',
  },
  altPaymentContainer: {
    alignItems: 'center',
    padding: scale.hp(2.5),
    borderWidth: 1,
    borderColor: '#F2DAD7',
    borderRadius: scale.hp(1.5),
    backgroundColor: '#FFF',
    marginTop: scale.hp(2),
  },
  paymentLogo: {
    width: scale.wp(15),
    height: scale.wp(15),
    marginBottom: scale.hp(2),
  },
  altPaymentText: {
    fontSize: scale.hp(1.75),
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: scale.hp(2),
    lineHeight: scale.hp(2.5),
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale.hp(1.5),
    paddingHorizontal: scale.wp(6),
    borderRadius: scale.hp(1),
    width: '100%',
  },
  buttonIcon: {
    width: scale.wp(5),
    height: scale.wp(5),
    marginRight: scale.wp(2.5),
    tintColor: '#FFFFFF',
  },
  paymentButtonText: {
    color: '#FFFFFF',
    fontSize: scale.hp(2),
    fontWeight: '600',
  },
  errorText: {
    color: '#DC2626',
    fontSize: scale.hp(1.5),
    fontWeight: '500',
    marginTop: scale.hp(0.5),
  },
  cardFieldWrapper: {
    width: '100%',
  },
});

export default StepPay;