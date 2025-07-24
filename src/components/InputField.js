import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';

export default function InputField({
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    secureTextEntry = false,
    rightIcon,
    onRightIconPress,
    editable = true,
}) {
    return (
        <View style={styles.container}>
            <TextInput
                style={[styles.input, !editable && { backgroundColor: '#F6F6F6', color: '#9E9E9E' }]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#BDBDBD"
                keyboardType={keyboardType}
                secureTextEntry={secureTextEntry}
                autoCapitalize="none"
                editable={editable}
            />
            {rightIcon && (
                <TouchableOpacity style={styles.iconRight} onPress={onRightIconPress}>
                    {rightIcon}
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { width: '100%', marginBottom: 16 },
    input: {
        width: '100%',
        height: 48,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingRight: 44,
        fontSize: 14,
        color: Colors.textPrimary,
    },
    iconRight: { position: 'absolute', right: 14, top: 12 },
});
