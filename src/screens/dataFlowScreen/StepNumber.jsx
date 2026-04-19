import { useState, useEffect } from "react";
import formatLocal from "../../utils/formatLocal";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Colors } from "../../theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import TopUpStyles from "../topupScreen/TopupStyle";

const OPERATOR_LOGOS = {
  '70': require('../../../assets/mnos/awcc.png'),
  '71': require('../../../assets/mnos/awcc.png'),
  '77': require('../../../assets/mnos/mtn.png'),
  '76': require('../../../assets/mnos/mtn.png'),
  '73': require('../../../assets/mnos/etisalat.png'),
  '74': require('../../../assets/mnos/salaam.png'),
  '72': require('../../../assets/mnos/roshan.png'),
  '79': require('../../../assets/mnos/roshan.png'),
  '78': require('../../../assets/mnos/etisalat.png'),
  'default': require('../../../assets/mnos/awcc.png'),
};

const OPERATOR_NAMES = {
  '70': 'AWCC',
  '71': 'AWCC',
  '72': 'MTN',
  '73': 'Etisalat',
  '74': 'Salaam',
  '76': 'Roshan',
  '77': 'Roshan',
  '78': 'Etisalat',
  '79': 'Salaam',
  'default': 'Unknown Operator',
};

const getOperatorFromPrefix = (prefix) => {
  return OPERATOR_NAMES[prefix] || OPERATOR_NAMES.default;
};

const getOperatorLogo = (prefix) => {
  return OPERATOR_LOGOS[prefix] || OPERATOR_LOGOS.default;
};

const VALID_PREFIXES = ['70', '71', '72', '73', '74', '76', '77', '78', '79'];

const validateMobileNumber = (number) => {
  const cleanNumber = number.replace(/\D/g, "");
  
  if (cleanNumber.length === 0) {
    return {
      isValid: true,
      message: ""
    };
  }
  
  if (cleanNumber.length > 0 && !cleanNumber.startsWith('7')) {
    return {
      isValid: false,
      message: "mobileNumberStartWith7"
    };
  }

  if (cleanNumber.startsWith('75')) {
    return {
      isValid: false,
      message: "invalidPrefix75"
    };
  }
  
  if (cleanNumber.length >= 2) {
    const prefix = cleanNumber.substring(0, 2);
    if (!VALID_PREFIXES.includes(prefix)) {
      return {
        isValid: false,
        message: `invalidPrefix ${prefix}`
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
  onPrefixChange,
}) {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [currentPrefix, setCurrentPrefix] = useState(null);
  const [operatorName, setOperatorName] = useState(null);
  
  const formatted = formatLocal(value);

  useEffect(() => {
    if (value.length >= 2) {
      const prefix = value.substring(0, 2);
      setCurrentPrefix(prefix);
      const operator = getOperatorFromPrefix(prefix);
      setOperatorName(operator);
      if (onPrefixChange) {
        onPrefixChange(prefix);
      }
    } else {
      setCurrentPrefix(null);
      setOperatorName(null);
      if (onPrefixChange) {
        onPrefixChange(null);
      }
    }
  }, [value, onPrefixChange]);

  const handleNumberChange = (input) => {
    const numericInput = input.replace(/\D/g, "");
    const limitedInput = numericInput.slice(0, 9);
    
    const validation = validateMobileNumber(limitedInput);
    
    if (!validation.isValid && limitedInput.length > 0) {
      const errorMessage = t(validation.message);
      setValidationError(errorMessage);
      
      if (limitedInput.startsWith('75') || !limitedInput.startsWith('7')) {
        onChange("");
        setCurrentPrefix(null);
        setOperatorName(null);
        if (onPrefixChange) {
          onPrefixChange(null);
        }
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
        const errorMessage = t(validation.message);
        setValidationError(errorMessage);
      }
    }
  };

  return (
    <View style={{ marginTop: 12 }}>
      <View style={TopUpStyles.editHeader}>
        <Text style={TopUpStyles.sectionTitle}>{t('mobileNumber')}</Text>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <TouchableOpacity onPress={openContacts}>
            <Text style={TopUpStyles.editLink}>{t('contacts')}</Text>
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
          {currentPrefix ? (
            <Image
              source={getOperatorLogo(currentPrefix)}
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
        <View style={{ 
          marginTop: 8, 
          flexDirection: 'row', 
          alignItems: 'center',
          backgroundColor: '#FEF2F2',
          padding: 8,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#FECACA'
        }}>
          <Ionicons name="warning-outline" size={16} color="#EF4444" />
          <Text style={{ 
            color: '#EF4444', 
            fontSize: 12, 
            fontFamily: 'dmsansRegular',
            marginLeft: 8,
            flex: 1
          }}>
            {validationError}
          </Text>
        </View>
      ) : value.length >= 2 && !operatorName ? (
        <View style={{ 
          marginTop: 8, 
          flexDirection: 'row', 
          alignItems: 'center',
          backgroundColor: '#FFFBEB',
          padding: 8,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#FDE68A'
        }}>
          <Ionicons name="information-circle-outline" size={16} color="#F59E0B" />
          <Text style={{ 
            color: '#92400E', 
            fontSize: 12, 
            fontFamily: 'dmsansRegular',
            marginLeft: 8,
            flex: 1
          }}>
            {t('enterFullNumberForOperatorDetection')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default StepNumber;