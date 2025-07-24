import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    FlatList,
    ScrollView,
    Dimensions,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import WalletCard from '../components/WalletCard';
import DotIndicators from '../components/DotIndicators';
import ServiceButton from '../components/ServiceButton';
import { SERVICES } from '../constants/services';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
    const [walletIndex, setWalletIndex] = useState(0);
    const flatRef = useRef(null);

    const userName = 'Ajmal Badakhsh'; // test user

    const wallets = [
        { id: '1', name: 'Top-up Wallet', balance: 2400, maskedNumber: '•••• 5678', type: 'personal' },
        { id: '2', name: 'Commission Wallet', balance: 1230, maskedNumber: '•••• 9012', type: 'commission' },
    ];

    // Dummy recent transactions
    const recentTx = [
        {
            id: 't1',
            type: 'Mobile Topup',
            amount: 200,
            date: 'Nov 17',
            phone: '(+93)787710623',
            icon: 'phone-portrait-outline',
        },
        {
            id: 't2',
            type: 'Data Bundle (30GB)',
            amount: 1200,
            date: 'Nov 17',
            phone: '(+93)787710623',
            icon: 'pie-chart-outline',
        },
        {
            id: 't3',
            type: 'Mobile Topup',
            amount: 200,
            date: 'Nov 17',
            phone: '(+93)787710623',
            icon: 'phone-portrait-outline',
        },
        {
            id: 't4',
            type: 'Mobile Topup',
            amount: 200,
            date: 'Nov 17',
            phone: '(+93)787710623',
            icon: 'phone-portrait-outline',
        },
    ];

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems && viewableItems.length > 0) {
            setWalletIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

    const goToService = (routeName, title) => navigation.navigate(routeName, { title });
    const goToNotifications = () => navigation.navigate('Notifications');
    const goToAllTransactions = () => navigation.navigate('Transactions');

    const TransactionRow = ({ item }) => (
        <TouchableOpacity
            style={styles.txRow}
            onPress={() => navigation.navigate('Transactions', { id: item.id })} // or a TxDetails screen later
        >
            <View style={styles.txLeft}>
                <View style={styles.txIconWrap}>
                    <Ionicons name={item.icon} size={20} color={Colors.primary} />
                </View>
                <View>
                    <Text style={styles.txTitle}>{item.type}</Text>
                    <Text style={styles.txSub}>{item.date}</Text>
                </View>
            </View>
            <View style={styles.txRight}>
                <Text style={styles.txAmount}>{item.amount}</Text>
                <Text style={styles.txPhone}>{item.phone}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient
                colors={['#D70000', '#E52421', '#F0533F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <Text style={styles.greeting}>Hi,</Text>
                <Text style={styles.userName}>{userName}</Text>

                <View style={styles.headerIcons}>
                    <TouchableOpacity onPress={goToNotifications} style={styles.iconBtn}>
                        <Ionicons name="notifications-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => goToService('Cards', 'Cards')} style={styles.iconBtn}>
                        <Ionicons name="card-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Content */}
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Wallet Carousel */}
                <View style={styles.carouselWrapper}>
                    <FlatList
                        ref={flatRef}
                        data={wallets}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => <WalletCard wallet={item} width={width - 48} />}
                        snapToAlignment="center"
                        decelerationRate="fast"
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={viewConfigRef.current}
                        contentContainerStyle={{ paddingHorizontal: 24 }}
                    />
                    <DotIndicators total={wallets.length} activeIndex={walletIndex} />
                </View>

                {/* Services */}
                <View style={styles.servicesHeader}>
                    <Text style={styles.servicesTitle}>Services</Text>
                </View>
                <View style={styles.servicesGrid}>
                    {SERVICES.map((s) => (
                        <ServiceButton
                            key={s.key}
                            label={s.label}
                            icon={s.icon}
                            onPress={() => {
                                if (s.key === 'MobileTopup') {
                                    navigation.navigate('TopupProducts');
                                } else if (s.key === 'DataBundle') {
                                    navigation.navigate('DataCountry');
                                } else {
                                    navigation.navigate('ServiceTodo', { title: s.label });
                                }
                            }}
                        />
                    ))}
                </View>

                {/* Recent Transactions Card */}
                <View style={styles.recentContainer}>
                    <View style={styles.recentHeader}>
                        <Text style={styles.recentTitle}>Recent Transactions</Text>
                        <TouchableOpacity onPress={goToAllTransactions}>
                            <Text style={styles.seeAll}>See all</Text>
                        </TouchableOpacity>
                    </View>

                    {recentTx.map((tx) => (
                        <TransactionRow key={tx.id} item={tx} />
                    ))}
                </View>
            </ScrollView>
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

    carouselWrapper: { marginTop: 10, marginBottom: 24 },

    servicesHeader: { paddingHorizontal: 24, marginBottom: 12 },
    servicesTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },

    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
        justifyContent: 'space-between',
        marginBottom: 24,
    },

    // Recent Transactions
    recentContainer: {
        marginHorizontal: 24,
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: '#F2F2F2',
    },
    recentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    recentTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
    seeAll: { color: Colors.primary, fontSize: 13, fontWeight: '500' },

    txRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F3F3',
    },
    txLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    txIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFF5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    txTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '500' },
    txSub: { color: '#9E9E9E', fontSize: 11, marginTop: 2 },

    txRight: { alignItems: 'flex-end' },
    txAmount: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
    txPhone: { color: '#9E9E9E', fontSize: 11, marginTop: 2 },
});
