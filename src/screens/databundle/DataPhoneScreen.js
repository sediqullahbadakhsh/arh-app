import React, { useState, useCallback } from 'react';
import { SafeAreaView, View, StyleSheet, Text } from 'react-native';
import { Colors } from '../../theme/colors';
import ServiceHeader from '../../components/ServiceHeader';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import ConfirmAmountModal from '../../components/ConfirmAmountModal';
import SelectedProductBanner from '../../components/SelectedProductBanner';
import { Ionicons } from '@expo/vector-icons';
import { USD_TO_AFN } from '../../constants/rates';

export default function DataPhoneScreen({ navigation, route }) {
    const { product, country } = route.params || {};
    const [mobile, setMobile] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);

    const usdValue = Number(product.usd) || 0;
    const afnValue = product.afn || Math.round(usdValue * USD_TO_AFN);

    const openContacts = useCallback(() => {
        navigation.navigate('ContactPicker', {
            onSelect: (num) => setMobile(num),
        });
    }, [navigation]);

    const onContinue = () => setShowConfirm(true);

    const onConfirmClose = () => {
        setShowConfirm(false);
        navigation.navigate('DataPayment', {
            product,
            country,
            mobile,
            usdAmount: usdValue,
            afnAmount: afnValue,
        });
    };

    const onCancelModal = () => setShowConfirm(false);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
            <ServiceHeader title="Internet" onBack={() => navigation.goBack()} />
            <View style={styles.container}>
                <Text style={styles.topLabel}>Enter recipient mobile number</Text>

                <SelectedProductBanner product={product} usd={usdValue} afn={afnValue} isFixed />

                <Text style={styles.label}>
                    Mobile Number <Text style={styles.contactLink} onPress={openContacts}>Contact</Text>
                </Text>

                <InputField
                    value={mobile}
                    onChangeText={setMobile}
                    placeholder="Enter Mobile Number"
                    keyboardType="phone-pad"
                    rightIcon={<Ionicons name="person-circle-outline" size={24} color="#A9A9A9" />}
                    onRightIconPress={openContacts}
                />

                <PrimaryButton label="Continue" onPress={onContinue} style={{ marginTop: 32 }} />
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
    topLabel: { fontSize: 13, color: Colors.textPrimary, marginBottom: 16 },
    label: { fontSize: 13, color: Colors.textPrimary, marginBottom: 6, marginTop: 16 },
    contactLink: { color: Colors.primary, fontSize: 13 },
});
