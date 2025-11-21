import React, { useEffect,  useState, useRef, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, Text } from 'react-native';

import { Colors } from '../../theme/colors';
import ServiceHeader from '../../components/ServiceHeader';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import ConfirmAmountModal from '../../components/ConfirmAmountModal';
import SelectedProductBanner from '../../components/SelectedProductBanner';
import { Ionicons } from '@expo/vector-icons';
import { USD_TO_AFN } from '../../constants/rates';
import { scale } from '../../utils/normalizeSize';
import { useTranslation } from 'react-i18next';

export default function TopupFormScreen({ navigation, route }) {
    const { t } = useTranslation();
    const { product, selectedMobile } = route.params || {};

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
            onSelect: (num) => setMobile(num),  
        });
    }, [navigation, setMobile]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
            <ServiceHeader title={t('mobileTopup')} onBack={() => navigation.goBack()} />
            <View style={styles.container}>
                <SelectedProductBanner product={product} usd={usdValue} afn={afnValue} isFixed={isFixed} />

                <Text style={styles.label}>{t('mobileNumber')}</Text>
                <InputField
                    value={mobile}
                    onChangeText={setMobile}
                    placeholder={t('enterMobileNumber')}
                    keyboardType="phone-pad"
                    rightIcon={<Ionicons name="person-circle-outline" size={24} color="#A9A9A9" />}
                    onRightIconPress={openContacts}
                />

                <Text style={styles.label}>{t('amount')}</Text>
                <InputField
                    value={amount}
                    onChangeText={setAmount}
                    placeholder={t('enterAmount')}
                    keyboardType="decimal-pad"
                    editable={!isFixed}
                />

                <PrimaryButton label={t('continue')} onPress={handleContinuePress} style={{ marginTop: 32 }} />
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
  container: {
    flex: 1,
    paddingHorizontal: scale.wp(6.2),
    paddingTop: scale.hp(1.05),
  },
  label: {
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
    marginBottom: scale.hp(0.8),
    marginTop: scale.hp(2.1),
  },
});