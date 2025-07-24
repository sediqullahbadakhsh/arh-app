import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Colors } from '../theme/colors';

export default function SocialButton({ label, icon, onPress }) {
    return (
        <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.9}>
            <View style={{ marginRight: 8 }}>{icon}</View>
            <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        paddingHorizontal: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#EFEFEF',
    },
    label: {
        fontSize: 15,
        color: Colors.textPrimary,
        fontWeight: '500',
    },
});