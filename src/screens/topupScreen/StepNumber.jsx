import { Ionicons } from "@expo/vector-icons";
import { Text, TextInput, TouchableOpacity, View, Image, Alert } from "react-native";
import TopUpStyles from "./TopupStyle";
import { useState, forwardRef, useImperativeHandle } from "react";
import { Colors } from "../../theme/colors";
import formatLocal from "../../utils/formatLocal";
import { isRTL } from "../../utils/rtl";
import { useTranslation } from "react-i18next";
import { scale } from "../../utils/normalizeSize";

const OPERATOR_LOGOS = {
  'AWCC': require('../../../assets/mnos/awcc.png'),
  'Roshan': require('../../../assets/mnos/roshan.png'),
  'MTN': require('../../../assets/mnos/mtn.png'),
  'Salaam': require('../../../assets/mnos/salaam.png'),
  'Etisalat': require('../../../assets/mnos/etisalat.png'),
  'default': require('../../../assets/mnos/awcc.png'),
};

const VALID_PREFIXES = ['70','71', '72', '73', '74', '76', '77', '78', '79'];

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

const validateMobileNumberForTyping = (number, dialCode = "+93") => {
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

const processContactNumber = (contactNumber, dialCode = "+93") => {
  let cleanNumber = contactNumber.replace(/[^\d+]/g, "");
  
  if (cleanNumber.startsWith('+93')) {
    return cleanNumber.substring(3);
  } else if (cleanNumber.startsWith('93')) {
    return cleanNumber.substring(2);
  } else if (cleanNumber.startsWith('0')) {
    return cleanNumber.substring(1);
  }
  
  return cleanNumber;
};

const StepNumber = forwardRef(({
  dial,
  country,
  value,
  onChange,
  localNumber,
  operator,
  onEditCountry,
  openContacts,
}, ref) => {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [showLengthError, setShowLengthError] = useState(false);
  const formatted = formatLocal(value);


  useImperativeHandle(ref, () => ({
    validate: () => {
      const validation = validateMobileNumber(value, dial);
      if (!validation.isValid) {
        const errorMessage = t(validation.message);
        setValidationError(errorMessage);
        if (validation.message === "mobileNumberMustBe9Digits") {
          setShowLengthError(true);
        }
        return false;
      }
      setValidationError("");
      setShowLengthError(false);
      return true;
    },
    clearValidation: () => {
      setValidationError("");
      setShowLengthError(false);
    }
  }));

  const handleNumberChange = (input) => {
    const numericInput = input.replace(/\D/g, "");
    const limitedInput = numericInput.slice(0, 9);
    

    const validation = validateMobileNumberForTyping(limitedInput, dial);
    
    if (!validation.isValid && limitedInput.length > 0) {
      const errorMessage = t(validation.message);
      setValidationError(errorMessage);
      

      if (limitedInput.startsWith('75') || !limitedInput.startsWith('7')) {
        return;
      }
    } else {

      if (!showLengthError) {
        setValidationError("");
      }
    }
    
    onChange(limitedInput);
  };

  const handleOpenContacts = async () => {
    try {
      const contactNumber = await openContacts();
      
      if (contactNumber) {
        const processedNumber = processContactNumber(contactNumber, dial);
        

        const validation = validateMobileNumber(processedNumber, dial);
        
        if (validation.isValid && processedNumber.length === 9) {
          onChange(processedNumber);
          setValidationError("");
          setShowLengthError(false);
        } else {
          let errorMessage = "";
          if (processedNumber.length !== 9) {
            errorMessage = t("mobileNumberMustBe9Digits");
            setShowLengthError(true);
          } else {
            errorMessage = t(validation.message || "invalidNumberFormat");
          }
          setValidationError(errorMessage);
          
          Alert.alert(
            t("invalidContact"),
            t("selectedContactInvalid"),
            [{ text: t("ok") }]
          );
        }
      }
    } catch (error) {
      console.error("Error processing contact:", error);
      openContacts();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (!showLengthError) {
      setValidationError("");
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    if (value.length > 0) {
      const validation = validateMobileNumberForTyping(value, dial);
      if (!validation.isValid) {
        const errorMessage = t(validation.message);
        setValidationError(errorMessage);
      } else if (!showLengthError) {
        setValidationError("");
      }
    }
  };


  const displayError = validationError || (showLengthError && value.length > 0 && value.length !== 9 ? t("mobileNumberMustBe9Digits") : "");

  return (
    <View style={{ marginTop: 12 }}>
      <View style={TopUpStyles.editHeader}>
        <Text style={TopUpStyles.sectionTitle}>{t('mobileNumber')}</Text>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <TouchableOpacity onPress={handleOpenContacts}>
            <Text style={TopUpStyles.editLink}>{t('contacts')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[
        TopUpStyles.phoneRow,
        {
          borderColor: displayError ? '#EF4444' : (isFocused ? Colors.primary : '#E4E7EC'),
          backgroundColor: '#FFFFFF',
          shadowColor: displayError ? '#EF4444' : Colors.primary,
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
            displayError && { color: '#EF4444' }
          ]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={11}
        />
        <TouchableOpacity
          onPress={handleOpenContacts}
          style={{ paddingHorizontal: 12, justifyContent: "center" }}
        >
          <Ionicons name="person-circle-outline" size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {displayError ? (
        <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="warning-outline" size={16} color="#EF4444" />
          <Text style={{ 
            color: '#EF4444', 
            fontSize: 12, 
            fontFamily: 'dmsansRegular',
            marginLeft: 4
          }}>
            {displayError}
          </Text>
        </View>
      ) : (
        <View style={{ marginTop: 0, minHeight: 24 }}>
        
        </View>
      )}
       <View style={styles.watermarkContainer}>
              <Image 
                source={require('../../../assets/logo4.png')} 
                style={styles.watermarkLogo}
                resizeMode="contain"
              />
            </View>
    </View>
  );
});
const styles = {
 watermarkContainer: {
    position: 'absolute',
    top: scale.hp(53), 
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  watermarkLogo: {
    width: scale.wp(67.5),  
    height: scale.wp(67.5),
    opacity: 0.1,
  },

};


export default StepNumber;