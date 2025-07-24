import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ServiceHeader({ title, onBack }) {
    const insets = useSafeAreaInsets();
    return (
        <View>
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
            <View style={styles.roundedTop} />
        </View>
    );
}

const styles = StyleSheet.create({
    gradient: {
        width: '100%',
        height: 190,
        paddingHorizontal: 24,
    },
    backBtn: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
        marginTop: 4,
    },
    roundedTop: {
        height: 24,
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -24,
    },
});
