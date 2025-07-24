import React, { useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Colors } from '../../theme/colors';
import ServiceHeader from '../../components/ServiceHeader';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import PaymentMethodToggle from '../../components/PaymentMethodToggle';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PaymentMethodScreen({ navigation, route }) {
    const { product, mobile, usdAmount, afnAmount } = route.params || {};
    const insets = useSafeAreaInsets();

    const [method, setMethod] = useState('card');
    const [cardType, setCardType] = useState('Master Card');
    const [cardNumber, setCardNumber] = useState('');
    const [cvv, setCvv] = useState('');
    const [expDate, setExpDate] = useState('');
    const [saveCard, setSaveCard] = useState(false);
    const [paypalEmail, setPaypalEmail] = useState('');
    const methods = [
        { key: 'card', label: 'Card', icon: 'card-outline' },
        { key: 'paypal', label: 'PayPal', icon: 'logo-paypal' },
    ];
    const { titleOverride, resultRouteName = 'TopupResult' } = route.params || {};

    const onContinue = () => {
        const paymentPayload =
            method === 'card'
                ? { cardType, cardNumber, method: 'card' }
                : { paypalEmail, method: 'paypal' };

        navigation.replace('TopupResult', {
            mobile,
            usdAmount,
            afnAmount,
            product,
            transactionId: '#9Q87656B',
            date: new Date().toISOString(),
            status: 'success',
            ...paymentPayload,
        });
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
            <ServiceHeader title={titleOverride || 'Mobile Top-up'} onBack={() => navigation.goBack()} />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={{
                        paddingHorizontal: 24,
                        paddingTop: 8,
                        paddingBottom: 24 + insets.bottom,
                    }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.label}>Payment Method</Text>
                    <PaymentMethodToggle methods={methods} selected={method} onSelect={setMethod} />

                    {method === 'card' ? (
                        <>
                            <Text style={styles.label}>Card</Text>
                            <TouchableOpacity
                                style={styles.dropdown}
                                activeOpacity={0.8}
                                onPress={() => console.log('Open card selector modal (TODO)')}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="card-outline" size={20} color="#000" style={{ marginRight: 8 }} />
                                    <Text style={{ color: Colors.textPrimary }}>{cardType}</Text>
                                </View>
                                <Ionicons name="chevron-down" size={20} color="#000" />
                            </TouchableOpacity>

                            <Text style={styles.label}>Card Number</Text>
                            <InputField
                                value={cardNumber}
                                onChangeText={setCardNumber}
                                placeholder="1234–5678–9101–1121"
                                keyboardType="numeric"
                            />

                            <Text style={styles.label}>CVV/CVC</Text>
                            <InputField
                                value={cvv}
                                onChangeText={setCvv}
                                placeholder="***"
                                keyboardType="numeric"
                            />

                            <Text style={styles.label}>Expiration Date</Text>
                            <InputField
                                value={expDate}
                                onChangeText={setExpDate}
                                placeholder="04/25"
                                keyboardType="numeric"
                            />

                            <TouchableOpacity
                                onPress={() => setSaveCard(!saveCard)}
                                style={{ alignSelf: 'flex-end', marginTop: 4 }}
                            >
                                <Text style={{ color: Colors.primary, fontSize: 13 }}>
                                    {saveCard ? '-Remove this card' : '+Save this card'}
                                </Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.label}>PayPal Email</Text>
                            <InputField
                                value={paypalEmail}
                                onChangeText={setPaypalEmail}
                                placeholder="you@example.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <TouchableOpacity
                                style={styles.paypalBtn}
                                activeOpacity={0.85}
                                onPress={() => console.log('Mock PayPal flow')}
                            >
                                <Ionicons name="logo-paypal" size={20} color="#003087" style={{ marginRight: 8 }} />
                                <Text style={styles.paypalText}>Pay with PayPal</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    <PrimaryButton label="Continue" onPress={onContinue} style={{ marginTop: 28 }} />
                    <PrimaryButton
                        label="Back"
                        onPress={() => navigation.goBack()}
                        style={{ marginTop: 12, backgroundColor: '#4A4A4A' }}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    label: { fontSize: 13, color: Colors.textPrimary, marginBottom: 6, marginTop: 16 },
    dropdown: {
        height: 48,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center',
    },
    paypalBtn: {
        marginTop: 16,
        height: 48,
        borderRadius: 6,
        backgroundColor: '#F7F7F7',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    paypalText: { color: '#003087', fontSize: 14, fontWeight: '600' },
});
