import React, { useState, useEffect, useRef } from "react";
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
  Keyboard
} from "react-native";
import { CardField, useStripe } from "@stripe/stripe-react-native";
import TopUpStyles from "./TopupStyle";
import { Colors } from "../../theme/colors";
import { useTranslation } from "react-i18next";
import { scale } from "../../utils/normalizeSize";
import { Ionicons } from "@expo/vector-icons";

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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef(null);
  const cardFieldRef = useRef(null);

  const {
    appliedPromoCode,
    discountAmount,
    finalAmount,
    onApplyPromoCode,
    onRemovePromoCode,
    openPromoModal
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
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        // Scroll to make card field visible when keyboard appears
        setTimeout(() => {
          scrollToCardField();
        }, 100);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const scrollToCardField = () => {
    if (scrollViewRef.current && selectedPaymentMethod === 'card') {
      // Scroll to make card field visible
      scrollViewRef.current.scrollTo({ y: 200, animated: true });
    }
  };

  const handleCardFieldFocus = () => {
    setTimeout(() => {
      scrollToCardField();
    }, 300);
  };

  const getSummaryValue = (key, defaultValue = 0) => {
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

  const handlePaymentMethodSelect = (methodId) => {
    setSelectedPaymentMethod(methodId);
    setPaymentMethodId(null);
    setCardDetails(null);
    
    if (methodId !== 'card') {
      onCardDetailsChange(false, null);
    }
  };

  const handleCardFieldChange = (cardDetails) => {
    setCardDetails(cardDetails);
    if (!cardDetails.complete && paymentMethodId) {
      setPaymentMethodId(null);
      onCardDetailsChange(false, null);
    }
  };

  const clearCardDetails = () => {
    setCardDetails(null);
    setPaymentMethodId(null);
    onCardDetailsChange(false, null);
    Keyboard.dismiss();
  };

  const getBaseAmount = () => {
    if (summary?.calculateBaseAmount && typeof summary.calculateBaseAmount === 'function') {
      return summary.calculateBaseAmount();
    }
    return getSummaryValue('baseAmount', 0);
  };

  const getFeeAmount = () => {
    if (summary?.calculateFeeAmount && typeof summary.calculateFeeAmount === 'function') {
      return summary.calculateFeeAmount();
    }
    return getSummaryValue('feeAmount', 0);
  };

  const getAfnAmount = () => {
    return getSummaryValue('afn', 0);
  };

  const getTotalAfnAmount = () => {
    return getSummaryValue('totalAfn', getSummaryValue('afn', 0));
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          paddingBottom: keyboardHeight > 0 ? keyboardHeight + 20 : 40,
          paddingHorizontal: 16
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustContentInsets={false}
        scrollEventThrottle={16}
      >
        <View style={{ marginTop: 12 }}>
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
                    -${appliedPromoCode.discount_amount?.toFixed(2) || discountAmount.toFixed(2)}
                  </Text>
                </View>
                <TouchableOpacity onPress={onRemovePromoCode} style={styles.removePromoButton}>
                  <Text style={styles.removePromoText}>{t('promoCode.remove')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.promoButton} onPress={openPromoModal}>
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
              <TouchableOpacity style={[styles.paymentButton, { backgroundColor: '#CD0202' }]}>
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
              <TouchableOpacity style={[styles.paymentButton, { backgroundColor: '#CD0202' }]}>
                <Image 
                  source={require('../../../assets/images/google-pay.png')} 
                  style={styles.buttonIcon} 
                  resizeMode="contain"
                />
                <Text style={styles.paymentButtonText}>{t('payWithGooglePay')}</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={TopUpStyles.summaryCard}>
            <View style={TopUpStyles.summaryRow}>
              <Text style={TopUpStyles.summaryKey}>{t('mobileNumber')}</Text>
              <Text style={TopUpStyles.summaryValue}>{getSummaryValue('mobile', 'N/A')}</Text>
            </View>
            <View style={TopUpStyles.summaryRow}>
              <Text style={TopUpStyles.summaryKey}>{t('amountToSend')}</Text>
              <Text style={TopUpStyles.summaryValue}>{getAfnAmount()} AFN</Text>
            </View>
            <View style={TopUpStyles.summaryRow}>
              <Text style={TopUpStyles.summaryKey}>{t('baseAmount')}</Text>
              <Text style={TopUpStyles.summaryValue}>${getBaseAmount().toFixed(2)} USD</Text>
            </View>
            {getSummaryValue('slabPercentage', 0) > 0 && (
              <View style={TopUpStyles.summaryRow}>
                <Text style={TopUpStyles.summaryKey}>{t('fee')}</Text>
                <Text style={TopUpStyles.summaryValue}>${getFeeAmount().toFixed(2)} USD</Text>
              </View>
            )}
            
            {appliedPromoCode && (
              <View style={TopUpStyles.summaryRow}>
                <Text style={TopUpStyles.summaryKey}>{t('promoCode.discount')}</Text>
                <Text style={[TopUpStyles.summaryValue, { color: '#10B981' }]}>
                  -${appliedPromoCode.discount_amount?.toFixed(2) || discountAmount.toFixed(2)} USD
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
            
            <TouchableOpacity onPress={onEditAmount} style={{ marginTop: 8 }}>
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
    marginRight: scale.wp(2),
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
    marginLeft: scale.wp(2),
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