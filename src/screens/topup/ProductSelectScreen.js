import React from 'react';
import { View, Text, SafeAreaView, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import ServiceHeader from '../../components/ServiceHeader';
import { TOPUP_PRODUCTS } from '../../constants/products';
import { scale } from '../../utils/normalizeSize';
import { useTranslation } from 'react-i18next';

export default function ProductSelectScreen({ navigation }) {
    const { t } = useTranslation();

    const onSelect = (item) => {
        navigation.navigate('TopupForm', { product: item });
    };

    const renderItem = ({ item }) => {
        if (item.custom) {
            return (
                <TouchableOpacity style={styles.customCard} onPress={() => onSelect(item)} activeOpacity={0.85}>
                    <Text style={styles.customText}>{t('customAmount')}</Text>
                </TouchableOpacity>
            );
        }
        return (
            <TouchableOpacity style={styles.card} onPress={() => onSelect(item)} activeOpacity={0.85}>
                <Text style={styles.usd}>${item.usd}</Text>
                <Text style={styles.afn}>{item.afn} {t('afn')}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
            <ServiceHeader title={t('mobileTopup')} onBack={() => navigation.goBack()} />

            <View style={styles.container}>
                <Text style={styles.sectionTitle}>{t('chooseProduct')}</Text>

                <FlatList
                    data={TOPUP_PRODUCTS}
                    numColumns={2}
                    columnWrapperStyle={{ justifyContent: 'space-between' }}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </SafeAreaView>
    );
}

const cardBase = {
    width: '48%',
    height: 100,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: scale.wp(6.2), 
    paddingTop: scale.hp(1.05), 
  },
  sectionTitle: {
    fontSize: scale.hp(2.6), 
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scale.hp(2.1), 
  },
  card: {
    ...cardBase,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: scale.hp(0.26) }, 
    shadowRadius: scale.hp(0.4), 
    elevation: 2,
  },
  usd: {
    fontSize: scale.hp(3.4), 
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: scale.hp(0.5), 
  },
  afn: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
  },
  customCard: {
    ...cardBase,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
  },
  customText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: scale.hp(2.3), 
  },
});