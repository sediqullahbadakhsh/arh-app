import React, { useState, useMemo } from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import ServiceHeader from '../../components/ServiceHeader';
import { BUNDLE_CATEGORIES, DATA_BUNDLES } from '../../constants/dataBundles';
import CategoryTabs from '../../components/CategoryTabs';

export default function DataProductScreen({ navigation, route }) {
    const { country } = route.params || {};
    const [category, setCategory] = useState(BUNDLE_CATEGORIES[0]);

    const allBundles = DATA_BUNDLES[country.code] || [];

    const filtered = useMemo(() => {
        if (!category) return allBundles;
        return allBundles.filter((b) => b.category === category);
    }, [allBundles, category]);

    const selectBundle = (product) => {
        navigation.navigate('DataPhone', { product, country });
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => selectBundle(item)}>
            <Text style={styles.desc}>{item.desc}</Text>
            <Text style={styles.price}>USD {item.usd} | AFN {item.afn}</Text>
        </TouchableOpacity>
    );
    const ListHeader = () => (
        <View>
            <Text style={styles.country}>{country.name}</Text>
            <Text style={styles.label}>Bundle Category</Text>
            <CategoryTabs categories={BUNDLE_CATEGORIES} active={category} onChange={setCategory} />
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
            <ServiceHeader title="Internet" onBack={() => navigation.goBack()} />
            <View style={styles.container}>


                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={ListHeader}
                    stickyHeaderIndices={[]} // leave empty or add [0] if you want tabs sticky
                    contentContainerStyle={{ paddingBottom: 24 }}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
    label: { fontSize: 13, color: Colors.textPrimary, marginBottom: 6, marginTop: 16 },
    country: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8 },
    card: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#EEE',
        borderRadius: 12,
        padding: 16,
    },
    desc: { fontSize: 15, color: Colors.textPrimary, marginBottom: 4 },
    price: { fontSize: 13, color: Colors.textSecondary },
});
