import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

export default function TransactionRow({ item, onPress }) {
    const icon = item.type === 'Top-up' ? 'phone-portrait-outline' : 'pie-chart-outline';

    return (
        <TouchableOpacity style={styles.row} onPress={() => onPress(item)}>
            <View style={styles.left}>
                <View style={styles.iconWrap}>
                    <Ionicons name={icon} size={20} color={Colors.primary} />
                </View>
                <View style={{ marginLeft: 12 }}>
                    <Text style={styles.title}>{item.type}</Text>
                    <Text style={styles.date}>{formatDate(item.date)}</Text>
                </View>
            </View>
            <View style={styles.right}>
                <Text style={styles.amount}>{item.amount}</Text>
                <Text style={styles.phone}>{item.phone}</Text>
            </View>
        </TouchableOpacity>
    );
}

function formatDate(dateStr) {
    // simple format: Nov 17
    const d = new Date(dateStr);
    const month = d.toLocaleString('en', { month: 'short' });
    const day = d.getDate();
    return `${month} ${day}`;
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F3F3',
        alignItems: 'center',
    },
    left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFF5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: { color: Colors.textPrimary, fontSize: 14, fontWeight: '500' },
    date: { color: '#9E9E9E', fontSize: 11, marginTop: 2 },
    right: { alignItems: 'flex-end' },
    amount: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
    phone: { color: '#9E9E9E', fontSize: 11, marginTop: 2 },
});
