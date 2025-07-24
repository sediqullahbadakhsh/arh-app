import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import InputField from './InputField';

export default function PasswordField({ value, onChangeText, placeholder }) {
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
        />
    );
}