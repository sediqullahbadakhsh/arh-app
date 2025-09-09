import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Colors } from '../../theme/colors';
import ServiceHeader from '../../components/ServiceHeader';
import { COUNTRIES } from '../../constants/dataBundles';
import { codeToFlag } from '../../utils/flag';
import { getCountries } from '../../services/merchantApi';

export default function DataCountryScreen({ navigation }) {
    const [countries, setCountries]  = useState([])
    const goNext = (country) => navigation.navigate('DataProducts', { country });

    useEffect(()=>{
        const getAllCountries = async()=>{
            const res = await getCountries()
            setCountries(res?.data)
        }

        getAllCountries()
    },[])

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.row} onPress={() => goNext(item)}>
            <Text style={styles.flag}>{codeToFlag(item.countryCode)}</Text>
            <Text style={styles.name}>{item.countryName}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
            <ServiceHeader title="Internet" onBack={() => navigation.goBack()} />
            <View style={styles.container}>
                <Text style={styles.label}>Select Country</Text>
                <FlatList
                    data={countries}
                    keyExtractor={(item) => item.countryCode}
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
