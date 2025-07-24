import React, { useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { COUNTRIES } from '../constants/dataBundles';
import { codeToFlag } from '../utils/flag';

export default function CountrySelectScreen({ navigation, route }) {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(null);

    const goContinue = () => {
        // Send what you need (name/email/password) from previous step
        const signupPayload = route.params || {};
        navigation.navigate('OtpVerification', {
            ...signupPayload,
            country: selected,
        });
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.row}
            onPress={() => {
                setSelected(item);
                setOpen(false);
            }}
        >
            <Text style={styles.flag}>{codeToFlag(item.code)}</Text>
            <Text style={styles.name}>{item.name}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <LinearGradient
                colors={['#D70000', '#E52421']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <Text style={styles.title}>Welcome</Text>
            </LinearGradient>

            <View style={styles.body}>
                {/* Dropdown mock */}
                <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setOpen(!open)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.dropdownLabel}>
                        {selected ? selected.name : 'Select your country'}
                    </Text>
                    <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color="#fff" />
                </TouchableOpacity>

                {open && (
                    <View style={styles.listBox}>
                        <FlatList
                            data={COUNTRIES}
                            keyExtractor={(item) => item.code}
                            renderItem={renderItem}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.continueBtn, { opacity: selected ? 1 : 0.4 }]}
                    disabled={!selected}
                    onPress={goContinue}
                >
                    <Text style={styles.continueText}>Continue</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const DROPDOWN_HEIGHT = 50;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.white },
    header: { height: 200, justifyContent: 'center', alignItems: 'center' },
    title: { color: '#fff', fontSize: 28, fontWeight: '700' },

    body: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    dropdown: {
        height: DROPDOWN_HEIGHT,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fff',
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownLabel: { color: '#fff', fontSize: 14 },
    listBox: {
        marginTop: 12,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#EEE',
        backgroundColor: '#fff',
        maxHeight: 240,
    },
    row: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 14,
        alignItems: 'center',
    },
    flag: { fontSize: 18, marginRight: 10 },
    name: { fontSize: 14, color: Colors.textPrimary },
    separator: { height: 1, backgroundColor: '#EEE', marginLeft: 44 },
    continueBtn: {
        marginTop: 40,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#F5A623',
        justifyContent: 'center',
        alignItems: 'center',
    },
    continueText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
