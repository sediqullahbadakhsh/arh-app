import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';

export default function TopupResultScreen({ navigation, route }) {
    const { mobile, usdAmount, cardType, cardNumber, transactionId, date, status } = route.params || {};
    const last4 = cardNumber ? cardNumber.slice(-4) : '****';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.popToTop()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => console.log('Print or share')} style={styles.printBtn}>
                    <Ionicons name="print-outline" size={22} color="#000" />
                </TouchableOpacity>
            </View>

            <View style={styles.container}>
                <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={56} color="#fff" />
                </View>
                <Text style={styles.title}>{status === 'success' ? 'Topup Successful!' : 'Topup Failed'}</Text>

                <View style={styles.detailRow}>
                    <Text style={styles.key}>Card Type</Text>
                    <Text style={styles.value}>{cardType || '-'}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.key}>Card Number</Text>
                    <Text style={styles.value}>{last4 === '****' ? '****' : `**** **** **** ${last4}`}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.key}>Mobile Number</Text>
                    <Text style={styles.value}>{mobile || '-'}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.key}>Transaction ID</Text>
                    <Text style={styles.value}>{transactionId || '-'}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.key}>Date</Text>
                    <Text style={styles.value}>{date ? new Date(date).toLocaleString() : '-'}</Text>
                </View>

                <View style={styles.totalBox}>
                    <Text style={styles.totalLabel}>Total Topup Amount</Text>
                    <Text style={styles.totalValue}>{usdAmount || 0}</Text>
                </View>

                <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.popToTop()}>
                    <Text style={styles.doneText}>Done</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        height: 120,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    backBtn: { padding: 6 },
    printBtn: { padding: 6 },

    container: { flex: 1, paddingHorizontal: 24, alignItems: 'center', paddingTop: 16 },
    checkCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: { fontSize: 20, fontWeight: '600', color: Colors.textPrimary, marginBottom: 24 },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingVertical: 6,
    },
    key: { color: Colors.textSecondary, fontSize: 13 },
    value: { color: Colors.textPrimary, fontSize: 13 },
    totalBox: {
        width: '100%',
        backgroundColor: '#F44336',
        borderRadius: 12,
        paddingVertical: 16,
        marginTop: 24,
        marginBottom: 24,
        alignItems: 'center',
    },
    totalLabel: { color: '#fff', fontSize: 13, marginBottom: 4 },
    totalValue: { color: '#fff', fontSize: 24, fontWeight: '600' },
    doneBtn: {
        width: '100%',
        height: 52,
        borderRadius: 26,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    doneText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
