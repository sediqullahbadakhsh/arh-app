import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import ServiceHeader from '../../components/ServiceHeader';
import { TOPUP_PRODUCTS } from '../../constants/products';

export default function ProductSelectScreen({ navigation }) {
    const onSelect = (item) => {
        navigation.navigate('TopupForm', { product: item });
    };

    const renderItem = ({ item }) => {
        if (item.custom) {
            return (
                <TouchableOpacity style={styles.customCard} onPress={() => onSelect(item)} activeOpacity={0.85}>
                    <Text style={styles.customText}>Custom Amount</Text>
                </TouchableOpacity>
            );
        }
        return (
            <TouchableOpacity style={styles.card} onPress={() => onSelect(item)} activeOpacity={0.85}>
                <Text style={styles.usd}>${item.usd}</Text>
                <Text style={styles.afn}>{item.afn} AFN</Text>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
            <ServiceHeader title="Mobile Top-up" onBack={() => navigation.goBack()} />

            <View style={styles.container}>
                <Text style={styles.sectionTitle}>Choose a Product</Text>

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
    container: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 16 },
    card: {
        ...cardBase,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 3,
        elevation: 2,
    },
    usd: { fontSize: 22, fontWeight: '600', color: Colors.primary, marginBottom: 4 },
    afn: { fontSize: 13, color: Colors.textSecondary },
    customCard: { ...cardBase, borderStyle: 'dashed', borderColor: Colors.primary },
    customText: { color: Colors.primary, fontWeight: '600', fontSize: 15 },
});
