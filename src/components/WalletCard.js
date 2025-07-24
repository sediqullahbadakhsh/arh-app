import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

export default function WalletCard({ wallet, width }) {
    const [showBalance, setShowBalance] = useState(true);

    return (
        <LinearGradient
            colors={['#D70000', '#E52421', '#F0533F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, { width }]}
        >
            <Text style={styles.walletTitle}>{wallet.name}</Text>

            <View style={styles.row}>
                <Text style={styles.balanceText}>{showBalance ? wallet.balance : '••••'}</Text>
            </View>

            <View style={[styles.row, { marginTop: 12 }]}>
                <Text style={styles.masked}>{wallet.maskedNumber}</Text>
                <TouchableOpacity onPress={() => setShowBalance((p) => !p)} style={{ marginLeft: 8 }}>
                    <Ionicons name={showBalance ? 'eye-outline' : 'eye-off-outline'} size={18} color="#fff" />
                </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>
                {wallet.type === 'commission' ? 'Commission Wallet' : 'Personal Wallet'}
            </Text>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    card: {
        height: 170,
        borderRadius: 16,
        padding: 20,
        marginRight: 16,
    },
    walletTitle: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 8,
    },
    balanceText: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    masked: {
        color: '#fff',
        fontSize: 14,
        letterSpacing: 2,
    },
    subtitle: {
        color: '#fff',
        fontSize: 12,
        marginTop: 8,
        opacity: 0.8,
    },
});
