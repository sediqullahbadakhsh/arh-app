import React from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

export default function TransactionsScreen() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.text}>Contacts</Text>
                <Text style={styles.sub}>List your contacts here (TODO).</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.white },
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    text: { fontSize: 20, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },
    sub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});
