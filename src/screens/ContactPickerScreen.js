import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { Colors } from '../theme/colors';
import ServiceHeader from '../components/ServiceHeader';

export default function ContactPickerScreen({ navigation, route }) {
    const [list, setList] = useState([]);
    const [query, setQuery] = useState('');
    const { onSelect } = route.params || {};

    useEffect(() => {
        async function loadContacts() {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status === 'granted') {
                const { data } = await Contacts.getContactsAsync({
                    fields: [Contacts.Fields.PhoneNumbers],
                    pageSize: 2000,
                });
                const withNumbers = data.filter((c) => c.phoneNumbers && c.phoneNumbers.length);
                // sort by name
                withNumbers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                setList(withNumbers);
            }
        }
        loadContacts();
    }, []);

    const normalize = (str = '') => str.replace(/[^\d+]/g, '').toLowerCase();
    const lc = (str = '') => str.toLowerCase();

    const filteredList = useMemo(() => {
        if (!query) return list;
        const q = lc(query);
        const qNum = normalize(query);
        return list.filter((c) => {
            const nameMatch = lc(c.name || '').includes(q);
            const num = c.phoneNumbers?.[0]?.number || '';
            const numMatch = normalize(num).includes(qNum);
            return nameMatch || numMatch;
        });
    }, [list, query]);

    // const selectNumber = useCallback(
    //     (number) => {
    //         navigation.navigate({
    //             name: 'TopupForm',
    //             params: { selectedMobile: number },
    //             merge: true,
    //         });
    //     },
    //     [navigation]
    // );
    const selectNumber = (number) => {
        if (onSelect) onSelect(number);  // call the callback to set state
        navigation.goBack();
    };

    const renderItem = useCallback(
        ({ item }) => {
            const primaryNum = item.phoneNumbers?.[0]?.number || '';
            return (
                <TouchableOpacity style={styles.row} onPress={() => selectNumber(primaryNum)}>
                    <Text style={styles.name}>{item.name || 'Unknown'}</Text>
                    <Text style={styles.number}>{primaryNum}</Text>
                </TouchableOpacity>
            );
        },
        [selectNumber]
    );

    const Separator = useCallback(() => <View style={styles.separator} />, []);

    const SearchBar = (
        <View style={styles.searchWrapper}>
            <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search name or number..."
                placeholderTextColor="#BDBDBD"
                style={styles.searchInput}
                autoCapitalize="none"
                autoCorrect={false}
            />
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
            <ServiceHeader title="Select Contact" onBack={() => navigation.goBack()} />
            <View style={styles.container}>
                <FlatList
                    data={filteredList}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    ItemSeparatorComponent={Separator}
                    ListHeaderComponent={SearchBar}
                    keyboardShouldPersistTaps="handled"
                    initialNumToRender={20}
                    maxToRenderPerBatch={20}
                    removeClippedSubviews
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
    row: { paddingVertical: 14 },
    name: { fontSize: 15, color: Colors.textPrimary, marginBottom: 4 },
    number: { fontSize: 13, color: Colors.textSecondary },
    separator: { height: 1, backgroundColor: '#EEE' },
    searchWrapper: {
        paddingVertical: 8,
        marginBottom: 8,
    },
    searchInput: {
        height: 42,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingHorizontal: 12,
        backgroundColor: '#fff',
        fontSize: 14,
        color: Colors.textPrimary,
    },
});
