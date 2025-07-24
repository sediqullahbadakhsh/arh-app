import React, { useRef, useState, useEffect } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Colors } from '../theme/colors';
import ServiceHeader from '../components/ServiceHeader';
import PrimaryButton from '../components/PrimaryButton';

const CODE_LENGTH = 4;
const RESEND_SECONDS = 120;

export default function OtpVerificationScreen({ navigation, route }) {
    const { email, country, name } = route.params || {}; // whatever you passed
    const [codes, setCodes] = useState(Array(CODE_LENGTH).fill(''));
    const inputsRef = useRef([]);
    const [timeLeft, setTimeLeft] = useState(RESEND_SECONDS);

    useEffect(() => {
        inputsRef.current[0]?.focus();
    }, []);

    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timer);
    }, [timeLeft]);

    const handleChange = (text, idx) => {
        if (text.length > 1) text = text.slice(-1);
        const newCodes = [...codes];
        newCodes[idx] = text;
        setCodes(newCodes);

        if (text && idx < CODE_LENGTH - 1) {
            inputsRef.current[idx + 1]?.focus();
        }
    };

    const handleKeyPress = (e, idx) => {
        if (e.nativeEvent.key === 'Backspace' && !codes[idx] && idx > 0) {
            inputsRef.current[idx - 1]?.focus();
        }
    };

    const verify = () => {
        const code = codes.join('');
        if (code.length === CODE_LENGTH) {
            // mock success
            navigation.replace('Tabs');
        }
    };

    const resend = () => {
        // send code again (mock)
        setTimeLeft(RESEND_SECONDS);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
            <ServiceHeader title="OTP Verification" onBack={() => navigation.goBack()} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <View style={styles.container}>
                    <Text style={styles.infoTxt}>
                        Check your email to see the verification Code
                    </Text>

                    <View style={styles.codeRow}>
                        {codes.map((c, idx) => (
                            <TextInput
                                key={idx}
                                ref={(r) => (inputsRef.current[idx] = r)}
                                style={styles.codeBox}
                                value={c}
                                onChangeText={(t) => handleChange(t, idx)}
                                maxLength={1}
                                keyboardType="number-pad"
                                onKeyPress={(e) => handleKeyPress(e, idx)}
                            />
                        ))}
                    </View>

                    <View style={styles.resendRow}>
                        <Text style={styles.resendText}>Send code reload in </Text>
                        {timeLeft > 0 ? (
                            <Text style={[styles.resendText, { color: Colors.primary }]}>
                                {formatTime(timeLeft)}
                            </Text>
                        ) : (
                            <TouchableOpacity onPress={resend}>
                                <Text style={[styles.resendText, { color: Colors.primary }]}>Resend</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <PrimaryButton label="Verify" onPress={verify} style={{ marginTop: 32 }} />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
    infoTxt: { fontSize: 13, color: Colors.textSecondary, marginBottom: 24 },
    codeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    codeBox: {
        width: 52,
        height: 52,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        textAlign: 'center',
        fontSize: 18,
        color: Colors.textPrimary,
        backgroundColor: '#fff',
    },
    resendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    resendText: { fontSize: 13, color: Colors.textSecondary },
});
