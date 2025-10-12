import { Ionicons } from "@expo/vector-icons";
import { Text, TextInput, TouchableOpacity, View, Image, Alert } from "react-native";
import TopUpStyles from "./TopupStyle";
import { useState } from "react";
import { Colors } from "../../theme/colors";
import formatLocal from "../../utils/formatLocal";

// Operator logo mapping - replace these with your actual operator logo imports
const OPERATOR_LOGOS = {
  // Afghan operators
  'AWCC': require('../../../assets/mnos/awcc.png'),
  'Roshan': require('../../../assets/mnos/roshan.png'),
  'MTN': require('../../../assets/mnos/mtn.png'),
  'Salaam': require('../../../assets/mnos/salaam.png'),
  'Etisalat': require('../../../assets/mnos/etisalat.png'),
  'default': require('../../../assets/mnos/awcc.png'),
};

// Valid prefixes for Afghanistan mobile numbers
const VALID_PREFIXES = ['71', '72', '73', '74', '76', '77', '78', '79'];

// Function to get operator logo based on operator name
const getOperatorLogo = (operatorName) => {
  if (!operatorName) return OPERATOR_LOGOS.default;
  
  const normalizedName = operatorName.toLowerCase();
  
  if (normalizedName.includes('awcc')) return OPERATOR_LOGOS.AWCC;
  if (normalizedName.includes('roshan')) return OPERATOR_LOGOS.Roshan;
  if (normalizedName.includes('mtn')) return OPERATOR_LOGOS.MTN;
  if (normalizedName.includes('salaam')) return OPERATOR_LOGOS.Salaam;
  if (normalizedName.includes('etisalat')) return OPERATOR_LOGOS.Etisalat;
  
  return OPERATOR_LOGOS.default;
};

// Function to validate mobile number
const validateMobileNumber = (number) => {
  const cleanNumber = number.replace(/\D/g, "");
  
  // Check if number starts with 7
  if (cleanNumber.length > 0 && !cleanNumber.startsWith('7')) {
    return {
      isValid: false,
      message: "Mobile number must start with 7"
    };
  }
  
  // Check if number starts with invalid prefix 75
  if (cleanNumber.startsWith('75')) {
    return {
      isValid: false,
      message: "75 prefix is not valid for mobile numbers in Afghanistan"
    };
  }
  
  // Check if the prefix is valid
  if (cleanNumber.length >= 2) {
    const prefix = cleanNumber.substring(0, 2);
    if (!VALID_PREFIXES.includes(prefix)) {
      return {
        isValid: false,
        message: `Prefix ${prefix} is not valid. Valid prefixes are: ${VALID_PREFIXES.join(', ')}`
      };
    }
  }
  
  return {
    isValid: true,
    message: ""
  };
};

function StepNumber({
  dial,
  country,
  value,
  onChange,
  localNumber,
  operator,
  onEditCountry,
  openContacts,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState("");
  const formatted = formatLocal(value);

  const handleNumberChange = (input) => {
    // Remove all non-digit characters
    const numericInput = input.replace(/\D/g, "");
    
    // Limit to 9 digits
    const limitedInput = numericInput.slice(0, 9);
    
    // Validate the number
    const validation = validateMobileNumber(limitedInput);
    
    if (!validation.isValid && limitedInput.length > 0) {
      setValidationError(validation.message);
      
      // Show alert for major validation errors
      if (limitedInput.startsWith('75') || !limitedInput.startsWith('7')) {
  
  
        return;
      }
    } else {
      setValidationError("");
    }
    

    onChange(limitedInput);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setValidationError("");
  };

  const handleBlur = () => {
    setIsFocused(false);
    
   
    if (value.length > 0) {
      const validation = validateMobileNumber(value);
      if (!validation.isValid) {
        setValidationError(validation.message);
      }
    }
  };

  return (
    <View style={{ marginTop: 12 }}>
      <View style={TopUpStyles.editHeader}>
        <Text style={TopUpStyles.sectionTitle}>Mobile Number</Text>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <TouchableOpacity onPress={openContacts}>
            <Text style={TopUpStyles.editLink}>Contacts</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[
        TopUpStyles.phoneRow,
        {
          borderColor: validationError ? '#EF4444' : (isFocused ? Colors.primary : '#E4E7EC'),
          backgroundColor: '#FFFFFF',
          shadowColor: validationError ? '#EF4444' : Colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isFocused ? 0.15 : 0,
          shadowRadius: isFocused ? 10 : 0,
          elevation: isFocused ? 3 : 0,
          transform: [{ scale: isFocused ? 1.005 : 1 }]
        }
      ]}>
        <View style={TopUpStyles.phonePrefix}>
          {operator ? (
            <Image 
              source={getOperatorLogo(operator.name)}
              style={{
                width: 24,
                height: 24,
                marginRight: 8,
                borderRadius: 4,
              }}
              resizeMode="contain"
            />
          ) : (
            <View style={{
              width: 24,
              height: 24,
              marginRight: 8,
              borderRadius: 4,
              backgroundColor: '#E5E7EB',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Ionicons name="cellular-outline" size={16} color="#6B7280" />
            </View>
          )}
          <Text style={{ fontWeight: "700", color: Colors.textPrimary, fontFamily: 'dmsansRegular' }}>
            {dial}
          </Text>
        </View>
        <TextInput
          value={formatted}
          onChangeText={handleNumberChange}
          keyboardType="number-pad"
          placeholder="700-000-000"
          placeholderTextColor="#9E9E9E"
          style={[
            TopUpStyles.phoneInput,
            validationError && { color: '#EF4444' }
          ]}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        <TouchableOpacity
          onPress={openContacts}
          style={{ paddingHorizontal: 12, justifyContent: "center" }}
        >
          <Ionicons name="person-circle-outline" size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {validationError ? (
        <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="warning-outline" size={16} color="#EF4444" />
          <Text style={{ 
            color: '#EF4444', 
            fontSize: 12, 
            fontFamily: 'dmsansRegular',
            marginLeft: 4
          }}>
            {validationError}
          </Text>
        </View>
      ) : (
        <View style={{ marginTop: 10, minHeight: 24 }}>
     
        </View>
      )}


      {/* {value.length === 0 && (
        <Text style={{ 
          color: "#6B7280", 
          fontSize: 11, 
          fontFamily: 'dmsansRegular',
          marginTop: 8,
          fontStyle: 'italic'
        }}>
          Valid prefixes: 71, 72, 73, 74, 76, 77, 78, 79
        </Text>
      )} */}
    </View>
  );
}

function hexFade(hex, op) {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${op})`;
}

export default StepNumber;