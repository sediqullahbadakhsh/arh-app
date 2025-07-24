import React from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

export default function NotificationsScreen() {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
            <View style={styles.container}>
                <Text style={styles.title}>Notifications</Text>
                <Text style={styles.subtitle}>No notifications yet.</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    title: { fontSize: 20, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },
    subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});
