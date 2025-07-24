import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AuthHeader({ title, onBack }) {
    const insets = useSafeAreaInsets();

    return (
        <LinearGradient
            colors={['#D70000', '#E52421', '#F0533F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, { paddingTop: insets.top + 16 }]}
        >
            <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.title}>{title}</Text>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: {
        width: '100%',
        height: 220,
        paddingHorizontal: 24,
    },
    backBtn: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        lineHeight: 34,
    },
});
