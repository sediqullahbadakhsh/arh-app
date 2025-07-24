import React, { useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { TRANSACTIONS } from '../constants/transactions';
import TransactionRow from '../components/TransactionRow';
import TransactionDetailModal from '../components/TransactionDetailModal';

export default function TransactionsScreen({ navigation }) {
    const userName = 'Ajmal Badakhsh'; // same as home

    const [selectedTx, setSelectedTx] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const openDetail = (tx) => {
        setSelectedTx(tx);
        setModalVisible(true);
    };

    const closeDetail = () => {
        setModalVisible(false);
        setSelectedTx(null);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header gradient like home */}
            <LinearGradient
                colors={['#D70000', '#E52421', '#F0533F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <Text style={styles.greeting}>Hi</Text>
                <Text style={styles.userName}>{userName}</Text>

                <View style={styles.headerIcons}>
                    <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.iconBtn}>
                        <Ionicons name="notifications-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Cards')} style={styles.iconBtn}>
                        <Ionicons name="card-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Body */}
            <View style={styles.body}>
                <Text style={styles.sectionTitle}>Transactions</Text>

                <FlatList
                    data={TRANSACTIONS}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <TransactionRow item={item} onPress={openDetail} />}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    showsVerticalScrollIndicator={false}
                />
            </View>

            <TransactionDetailModal
                visible={modalVisible}
                onClose={closeDetail}
                tx={selectedTx}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.white },
    header: { height: 170, paddingHorizontal: 24, paddingTop: 24, justifyContent: 'flex-start' },
    greeting: { color: '#fff', fontSize: 16, marginTop: 12 },
    userName: { color: '#fff', fontSize: 24, fontWeight: '700', marginTop: 4 },
    headerIcons: { position: 'absolute', right: 24, top: 54, flexDirection: 'row' },
    iconBtn: {
        marginLeft: 16,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    body: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: 8,
    },
});
