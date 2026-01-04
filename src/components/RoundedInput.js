import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing
} from 'react-native';
import { Colors } from '../theme/colors';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { scale } from '../utils/normalizeSize';
import { useLanguage } from '../context/LanguageContext';

export default function RoundedInput({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  rightIcon,
  onRightIconPress,
  editable = true,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;
  const { isRTL } = useLanguage();

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E4E7EC', Colors.primary],
  });

  const shadowOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15],
  });

  const shadowRadius = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });

  const scaleAnim = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.005],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          shadowOpacity,
          shadowRadius,
          borderColor,
          elevation: isFocused ? 3 : 0,
        },
      ]}
    >
      <View style={[styles.inputRow, isRTL && { flexDirection: 'row-reverse' }]}>
        <TextInput
          style={[styles.input, !editable && styles.disabled]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9E9E9E"
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          editable={editable}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.iconWrapper}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: scale.hp(1.25),
    borderRadius: scale.wp(15),
    borderWidth: scale.wp(0.4),
    backgroundColor: '#FFFFFF',
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: scale.hp(0.5),
    },
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale.wp(4),
  },
  input: {
    flex: 1,
    height: scale.hp(7.5),
    borderRadius: scale.wp(15),
    backgroundColor: 'transparent',
    lineHeight: scale.hp(3),
    fontSize: scale.hp(2),
    color: Colors.textPrimary,
    fontFamily: 'dmsansRegular',
  },
  disabled: {
    backgroundColor: '#F6F6F6',
    color: '#9E9E9E',
  },
  iconWrapper: {
    marginLeft: scale.wp(2),
  },
});