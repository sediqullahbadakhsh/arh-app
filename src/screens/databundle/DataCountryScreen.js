import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Colors } from '../../theme/colors';
import ServiceHeader from '../../components/ServiceHeader';
import { COUNTRIES } from '../../constants/dataBundles';
import { codeToFlag } from '../../utils/flag';

export default function DataCountryScreen({ navigation }) {
    const goNext = (country) => navigation.navigate('DataProducts', { country });

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.row} onPress={() => goNext(item)}>
            <Text style={styles.flag}>{codeToFlag(item.code)}</Text>
            <Text style={styles.name}>{item.name}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
            <ServiceHeader title="Internet" onBack={() => navigation.goBack()} />
            <View style={styles.container}>
                <Text style={styles.label}>Select Country</Text>
                <FlatList
                    data={COUNTRIES}
                    keyExtractor={(item) => item.code}
                    renderItem={renderItem}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
    label: { fontSize: 13, color: Colors.textPrimary, marginBottom: 12, marginTop: 16 },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
    flag: { fontSize: 22, marginRight: 12 },
    name: { fontSize: 15, color: Colors.textPrimary },
    separator: { height: 1, backgroundColor: '#EEE' },
});
