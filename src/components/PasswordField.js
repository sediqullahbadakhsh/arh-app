import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import InputField from './InputField';

export default function PasswordField({ value, onChangeText, placeholder, style }) {
    const [hidden, setHidden] = useState(true);
    return (
        <InputField
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            
            secureTextEntry={hidden}
            rightIcon={
                <TouchableOpacity onPress={() => setHidden(!hidden)}>
                    <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={22} color="#A9A9A9" />
                </TouchableOpacity>
            }
            style={style}
        />
    );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 60,
    borderRadius: 30, // Half of height for pill shape
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E4E7EC',
    paddingHorizontal: 20,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  input: {
    width: '100%',
    height: '100%',
    fontSize: 16,
    color: '#000',
    fontFamily: 'dmsansRegular',
    paddingRight: 44, // Space for icon
  },
  icon: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -11 }],
  },
});