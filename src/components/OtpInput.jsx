import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { scale } from "../utils/normalizeSize";
import { Colors } from "../theme/colors";

const OtpInput = ({ onOtpComplete, loading = false, codeLength = 6 }) => {
  const [otp, setOtp] = useState(Array(codeLength).fill(''));
  const inputsRef = useRef([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (text, index) => {
    if (text.length > 1) {
      // Handle paste
      const otpArray = text.split('').slice(0, codeLength);
      const newOtp = [...otp];
      otpArray.forEach((char, i) => {
        if (index + i < codeLength) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      
      // Focus last input
      const lastIndex = Math.min(index + otpArray.length, codeLength - 1);
      inputsRef.current[lastIndex]?.focus();
      
      // Check if OTP is complete
      if (otpArray.length === codeLength) {
        onOtpComplete(otpArray.join(''));
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < codeLength - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    // Check if OTP is complete
    if (newOtp.every(digit => digit !== '') && index === codeLength - 1) {
      onOtpComplete(newOtp.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const clearOtp = () => {
    setOtp(Array(codeLength).fill(''));
    inputsRef.current[0]?.focus();
  };

  return (
    <View style={styles.otpContainer}>
      <Text style={styles.otpLabel}>Enter verification code</Text>
      <View style={styles.otpInputsContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={ref => inputsRef.current[index] = ref}
            style={[
              styles.otpInput,
              digit && styles.otpInputFilled
            ]}
            value={digit}
            onChangeText={text => handleChange(text.replace(/[^0-9]/g, ""), index)}
            onKeyPress={e => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            editable={!loading}
            selectTextOnFocus
          />
        ))}
      </View>
      
      <TouchableOpacity onPress={clearOtp} style={styles.clearButton}>
        <Text style={styles.clearButtonText}>Clear</Text>
      </TouchableOpacity>

      {loading && (
        <Text style={styles.verifyingText}>Verifying...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  otpContainer: {
    alignItems: 'center',
    marginVertical: scale.hp(2),
  },
  otpLabel: {
    fontSize: scale.hp(1.75),
    color: '#666',
    marginBottom: scale.hp(2),
    textAlign: 'center',
  },
  otpInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: scale.hp(1),
  },
  otpInput: {
    width: scale.wp(12),
    height: scale.hp(6),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scale.hp(1),
    textAlign: 'center',
    fontSize: scale.hp(2.25),
    backgroundColor: '#fff',
    fontWeight: 'bold',
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: '#F0F8FF',
  },
  clearButton: {
    padding: scale.hp(1),
  },
  clearButtonText: {
    color: Colors.primary,
    fontSize: scale.hp(1.5),
    fontWeight: '500',
  },
  verifyingText: {
    marginTop: scale.hp(1),
    fontSize: scale.hp(1.5),
    color: '#666',
    fontStyle: 'italic',
  },
});

export default OtpInput;