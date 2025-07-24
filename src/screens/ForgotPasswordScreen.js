import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Colors } from '../theme/colors';
import AuthHeader from '../components/AuthHeader';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';

export default function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState('');

    const handleReset = () => {
        // no real action for now
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <AuthHeader title="Forgot Password" onBack={() => navigation.goBack()} />
            <View style={styles.container}>
                <Text style={styles.title}>Forgot Password</Text>
                <Text style={styles.subtitle}>Enter your email and we’ll send a reset link (TODO).</Text>
                <InputField value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" />
                <PrimaryButton label="Send" onPress={handleReset} style={{ marginTop: 24 }} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    container: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#fff',
        position: 'absolute',
        top: -96,
        left: 24,
    },
    subtitle: { color: Colors.textSecondary, fontSize: 13, marginBottom: 16, marginTop: 8 },
});