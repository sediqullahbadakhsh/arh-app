import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

export default function SelectedProductBanner({ product, usd, afn, isFixed }) {
    if (!product) return null;

    return (
        <View style={styles.box}>
            <Text style={styles.title}>Selected Product</Text>
            {product.custom ? (
                <>
                    <Text style={styles.rowText}>Custom Amount</Text>
                    <Text style={styles.rowText}>USD: {usd} | AFN: {afn}</Text>
                </>
            ) : (
                <>
                    <Text style={styles.rowText}>USD: {product.usd} | AFN: {product.afn}</Text>
                    <Text style={styles.rowText}>{isFixed ? 'Fixed Product' : 'Editable'}</Text>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    box: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#EEE',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    title: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },
    rowText: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
});
