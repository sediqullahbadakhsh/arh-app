import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

export default function PrimaryButton({ label, onPress, style }) {
    return (
        <TouchableOpacity style={[styles.button, style]} onPress={onPress} activeOpacity={0.8}>
            <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: Colors.primary,
        borderRadius: 28,
        paddingVertical: 14,
        alignItems: 'center',
    },
    label: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
});
