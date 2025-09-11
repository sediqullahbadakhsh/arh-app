import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { CardField } from '@stripe/stripe-react-native';
import { Colors } from "../theme/colors";
const CardInput = ({ onCardChange, errors }) => {
  const [cardDetails, setCardDetails] = useState({
    complete: false,
    number: '',
    expiry: '',
    cvc: ''
  });

  const handleCardChange = (field, value, complete) => {
    const newDetails = {
      ...cardDetails,
      [field]: value,
      complete: cardDetails.complete && complete
    };
    
    setCardDetails(newDetails);
    onCardChange(newDetails);
  };

  return (
    <View style={styles.cardContainer}>
      {/* Card Number */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Card Number</Text>
        <CardField
          postalCodeEnabled={false}
          placeholders={{
            number: '1234 1234 1234 1234',
          }}
          cardStyle={styles.cardField}
          style={styles.cardNumberField}
          onCardChange={(details) => {
            handleCardChange('number', details.number, details.complete);
          }}
        />
        {errors.cardNumber && <Text style={styles.errorText}>{errors.cardNumber}</Text>}
      </View>

      <View style={styles.row}>
        {/* Expiry Date */}
        <View style={[styles.inputGroup, styles.expiryGroup]}>
          <Text style={styles.label}>Expiry Date</Text>
          <CardField
            postalCodeEnabled={false}
            placeholders={{
              expiration: 'MM/YY',
            }}
            cardStyle={styles.cardField}
            style={styles.smallField}
            onCardChange={(details) => {
              handleCardChange('expiry', details.expiry, details.complete);
            }}
          />
          {errors.cardExpiry && <Text style={styles.errorText}>{errors.cardExpiry}</Text>}
        </View>

        {/* CVC */}
        <View style={[styles.inputGroup, styles.cvcGroup]}>
          <Text style={styles.label}>CVC</Text>
          <CardField
            postalCodeEnabled={false}
            placeholders={{
              cvc: '123',
            }}
            cardStyle={styles.cardField}
            style={styles.smallField}
            onCardChange={(details) => {
              handleCardChange('cvc', details.cvc, details.complete);
            }}
          />
          {errors.cardCvc && <Text style={styles.errorText}>{errors.cardCvc}</Text>}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: 10,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expiryGroup: {
    flex: 2,
    marginRight: 12,
  },
  cvcGroup: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  cardField: {
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
    fontSize: 16,
    placeholderColor: '#B8B8B8',
  },
  cardNumberField: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
  },
  smallField: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 4,
  },
});

export default CardInput;