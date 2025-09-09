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
    
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 12,
    
  },
  input: {
    flex: 1,
    height: 48,
    color: "#000",

  },
  icon: {
    marginLeft: 8,
  },
});