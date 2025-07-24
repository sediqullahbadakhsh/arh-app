import React, { useEffect, useState, useRef, useCallback } from 'react';
import { SafeAreaView, View, StyleSheet, Text } from 'react-native';
import { Colors } from '../../theme/colors';
import ServiceHeader from '../../components/ServiceHeader';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import ConfirmAmountModal from '../../components/ConfirmAmountModal';
import SelectedProductBanner from '../../components/SelectedProductBanner';
import { Ionicons } from '@expo/vector-icons';
import { USD_TO_AFN } from '../../constants/rates';

export default function TopupFormScreen({ navigation, route }) {
    const { product, selectedMobile } = route.params || {};

    // Keep initial amount only once
    const initialAmount = useRef(product?.usd ? String(product.usd) : '');
    const [mobile, setMobile] = useState('');
    const [amount, setAmount] = useState(initialAmount.current);
    const [showConfirm, setShowConfirm] = useState(false);

    const isFixed = !!product?.fixed;

    useEffect(() => {
        if (selectedMobile) setMobile(selectedMobile);
    }, [selectedMobile]);

    const usdValue = Number(amount) || 0;
    const afnValue = product?.afn ? product.afn : Math.round(usdValue * USD_TO_AFN);

    const handleContinuePress = () => setShowConfirm(true);

    const onConfirmClose = () => {
        setShowConfirm(false);
        navigation.navigate('TopupPayment', {
            product,
            mobile,
            usdAmount: usdValue,
            afnAmount: afnValue,
        });
    };

    const onCancelModal = () => setShowConfirm(false);

    const openContacts = useCallback(() => {
        navigation.navigate('ContactPicker', {
            onSelect: (num) => setMobile(num),  // callback to update state
        });
    }, [navigation, setMobile]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
            <ServiceHeader title="Mobile Top-up" onBack={() => navigation.goBack()} />
            <View style={styles.container}>
                <SelectedProductBanner product={product} usd={usdValue} afn={afnValue} isFixed={isFixed} />

                <Text style={styles.label}>Mobile Number</Text>
                <InputField
                    value={mobile}
                    onChangeText={setMobile}
                    placeholder="Enter Mobile Number"
                    keyboardType="phone-pad"
                    rightIcon={<Ionicons name="person-circle-outline" size={24} color="#A9A9A9" />}
                    onRightIconPress={openContacts}
                />

                <Text style={styles.label}>Amount</Text>
                <InputField
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="Enter Amount"
                    keyboardType="decimal-pad"
                    editable={!isFixed}
                />

                <PrimaryButton label="Continue" onPress={handleContinuePress} style={{ marginTop: 32 }} />
            </View>

            <ConfirmAmountModal
                visible={showConfirm}
                onConfirm={onConfirmClose}
                onCancel={onCancelModal}
                usd={usdValue}
                afn={afnValue}
                autoCloseSec={0}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
    label: { fontSize: 13, color: Colors.textPrimary, marginBottom: 6, marginTop: 16 },
});
