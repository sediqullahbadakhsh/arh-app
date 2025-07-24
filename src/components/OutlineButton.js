import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

export default function OutlineButton({ label, onPress, style }) {
    return (
        <TouchableOpacity style={[styles.button, style]} onPress={onPress} activeOpacity={0.8}>
            <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: Colors.white,
        borderRadius: 28,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.primary,
    },
    label: {
        color: Colors.primary,
        fontSize: 16,
        fontWeight: '600',
    },
});
