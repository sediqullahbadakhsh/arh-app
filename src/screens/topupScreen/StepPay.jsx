import { CardField, useStripe } from "@stripe/stripe-react-native";
import { Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Image } from "react-native";
import { View } from "react-native";
import TopUpStyles from "./TopupStyle";
import { useState } from "react";
import { Colors } from "../../theme/colors";
import { useTranslation } from "react-i18next";

function StepPay({
  summary,
  onEditAmount,
  onCardDetailsChange,
}) {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: ''
  });

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

  const handlePaymentMethodSelect = (methodId) => {
    setSelectedPaymentMethod(methodId);
    

    if (methodId !== 'card') {
      setCardDetails({ number: '', expiry: '', cvc: '' });
      onCardDetailsChange(false);
    }
  };

  const handleCardFieldChange = (field, value) => {
    const newDetails = {
      ...cardDetails,
      [field]: value.replace(/\s/g, '') 
    };
    
    setCardDetails(newDetails);
    

    const isComplete = 
      newDetails.number.length >= 16 && 
      newDetails.expiry.length >= 5 && 
      newDetails.cvc.length >= 3;
    
    onCardDetailsChange(isComplete);
  };

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/(\d{1,4})(\d{1,4})?(\d{1,4})?(\d{1,4})?/);
    if (match) {
      return [match[1], match[2], match[3], match[4]].filter(Boolean).join(' ');
    }
    return value;
  };

  const formatExpiry = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 3) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return value;
  };

  const getSelectedMethod = () => {
    return paymentMethods.find(method => method.id === selectedPaymentMethod);
  };

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <View style={{ marginTop: 12 }}>
        <Text style={TopUpStyles.sectionTitle}>
          {selectedPaymentMethod ? t('cardDetails') : t('paymentMethod')}
        </Text>

        {!selectedPaymentMethod ? (
          <View style={styles.paymentMethodContainer}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={styles.paymentMethodButton}
                onPress={() => handlePaymentMethodSelect(method.id)}
              >
                <View style={styles.paymentMethodContent}>
                  <Image 
                    source={method.icon} 
                    style={styles.paymentIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.paymentMethodText}>
                    {method.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
 
          <View>
    
            {selectedPaymentMethod === 'card' && (
              <View style={styles.cardDetailsContainer}>
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>{t('cardNumber')}</Text>
                  <View style={[
                    styles.inputContainer,
                    isFocused && cardDetails.number === '' && styles.inputContainerFocused
                  ]}>
                    <View style={styles.inputWithIcon}>
                      <Image 
                        source={require('../../../assets/images/credit-card.png')} 
                        style={styles.inputIcon} 
                        resizeMode="contain"
                      />
                      <TextInput
                        style={styles.textInput}
                        placeholder="1234 5678 9012 3456"
                        placeholderTextColor="#B8B8B8"
                        keyboardType="numeric"
                        maxLength={19}
                        value={formatCardNumber(cardDetails.number)}
                        onChangeText={(value) => handleCardFieldChange('number', value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.fieldContainer, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.fieldLabel}>{t('expiryDate')}</Text>
                    <View style={[
                      styles.inputContainer,
                      isFocused && cardDetails.expiry === '' && styles.inputContainerFocused
                    ]}>
                      <View style={styles.inputWithIcon}>
                        <Image 
                          source={require('../../../assets/images/calendar.png')} 
                          style={styles.inputIcon} 
                          resizeMode="contain"
                        />
                        <TextInput
                          style={styles.textInput}
                          placeholder="MM/YY"
                          placeholderTextColor="#B8B8B8"
                          keyboardType="numeric"
                          maxLength={5}
                          value={formatExpiry(cardDetails.expiry)}
                          onChangeText={(value) => handleCardFieldChange('expiry', value)}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={[styles.fieldContainer, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.fieldLabel}>{t('cvc')}</Text>
                    <View style={[
                      styles.inputContainer,
                      isFocused && cardDetails.cvc === '' && styles.inputContainerFocused
                    ]}>
                      <View style={styles.inputWithIcon}>
                        <Image 
                          source={require('../../../assets/images/lock.png')} 
                          style={styles.inputIcon} 
                          resizeMode="contain"
                        />
                        <TextInput
                          style={styles.textInput}
                          placeholder="123"
                          placeholderTextColor="#B8B8B8"
                          keyboardType="numeric"
                          maxLength={4}
                          value={cardDetails.cvc}
                          onChangeText={(value) => handleCardFieldChange('cvc', value)}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          secureTextEntry
                        />
                      </View>
                    </View>
                  </View>
                </View>

                <Text style={[TopUpStyles.smallLabel, { marginTop: 16 }]}>
                  {t('securePaymentNotice')}
                </Text>
              </View>
            )}

            {/* PayPal Payment Method */}
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
                <TouchableOpacity style={[styles.paymentButton, { backgroundColor: '#0070BA' }]}>
                  <Image 
                    source={require('../../../assets/images/paypal.png')} 
                    style={styles.buttonIcon} 
                    resizeMode="contain"
                  />
                  <Text style={styles.paymentButtonText}>{t('continueWithPaypal')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Google Pay Payment Method */}
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
                <TouchableOpacity style={[styles.paymentButton, { backgroundColor: '#4285F4' }]}>
                  <Image 
                    source={require('../../../assets/images/google-pay.png')} 
                    style={styles.buttonIcon} 
                    resizeMode="contain"
                  />
                  <Text style={styles.paymentButtonText}>{t('payWithGooglePay')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Order Summary - Always visible */}
        <View style={TopUpStyles.summaryCard}>
          <View style={TopUpStyles.summaryRow}>
            <Text style={TopUpStyles.summaryKey}>{t('mobileNumber')}</Text>
            <Text style={TopUpStyles.summaryValue}>{summary.mobile}</Text>
          </View>
          <View style={TopUpStyles.summaryRow}>
            <Text style={TopUpStyles.summaryKey}>{t('amountToSend')}</Text>
            <Text style={TopUpStyles.summaryValue}>{summary.afn} AFN</Text>
          </View>
          <View style={TopUpStyles.summaryRow}>
            <Text style={TopUpStyles.summaryKey}>{t('baseAmount')}</Text>
            <Text style={TopUpStyles.summaryValue}>${summary.calculateBaseAmount()} USD</Text>
          </View>
          {summary.slabPercentage > 0 && (
            <View style={TopUpStyles.summaryRow}>
              <Text style={TopUpStyles.summaryKey}>{t('fee')}</Text>
              <Text style={TopUpStyles.summaryValue}>${summary.calculateFeeAmount()} USD</Text>
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
              ${summary.usd} USD
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
  );
}

const styles = StyleSheet.create({
  paymentMethodContainer: {
    flexDirection: 'column',
    width: "100%",
    marginVertical: 12,
    gap: 8,
  },
  paymentMethodButton: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
    tintColor: Colors.textSecondary,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  cardDetailsContainer: {
    marginTop: 8,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    height: 50,
    justifyContent: 'center',
  },
  inputContainerFocused: {
    borderColor: Colors.primary,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    tintColor: '#B8B8B8',
  },
  textInput: {
    fontSize: 16,
    color: Colors.textPrimary,
    padding: 0,
    margin: 0,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  altPaymentContainer: {
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: '#F2DAD7',
    borderRadius: 12,
    backgroundColor: '#FFF',
    marginTop: 16,
  },
  paymentLogo: {
    width: 60,
    height: 60,
    marginBottom: 16,
  },
  altPaymentText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
  },
  buttonIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    tintColor: '#FFFFFF',
  },
  paymentButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StepPay;