import React, { useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Animated,
    LayoutAnimation,
    Platform,
    UIManager
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}


const NOTIFICATIONS = [
    {
        id: '1',
        title: 'Payment Received',
        message: 'You have received a payment of $250 from John Doe. The amount has been credited to your wallet.',
        time: '2 hours ago',
        category: 'payments',
        read: false,
        icon: 'cash-outline'
    },
    {
        id: '2',
        title: 'Security Alert',
        message: 'A new device signed in to your account. If this was you, you can ignore this message.',
        time: '5 hours ago',
        category: 'security',
        read: false,
        icon: 'shield-checkmark-outline'
    },
    {
        id: '3',
        title: 'Promotional Offer',
        message: 'Special discount of 20% on all transactions this weekend. Use code WEEKEND20 to avail the offer.',
        time: '1 day ago',
        category: 'promotions',
        read: true,
        icon: 'pricetag-outline'
    },
    {
        id: '4',
        title: 'Account Updated',
        message: 'Your profile information has been successfully updated with the new changes you made.',
        time: '2 days ago',
        category: 'account',
        read: true,
        icon: 'person-outline'
    },
    {
        id: '5',
        title: 'Weekly Summary',
        message: 'Your weekly spending summary is ready. You spent $450 this week across 12 transactions.',
        time: '3 days ago',
        category: 'reports',
        read: true,
        icon: 'stats-chart-outline'
    },
    {
        id: '6',
        title: 'Card Transaction',
        message: 'Your card ending with 4567 was used for a purchase of $89.50 at Amazon.com.',
        time: '4 days ago',
        category: 'payments',
        read: true,
        icon: 'card-outline'
    },
];

const CATEGORIES = ['All', 'Payments', 'Security', 'Promotions', 'Account', 'Reports'];

export default function NotificationsScreen({ navigation }) {
    const userName = 'Ajmal Badakhsh';
    const [expandedId, setExpandedId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [notifications, setNotifications] = useState(NOTIFICATIONS);

    const toggleExpand = (id) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(expandedId === id ? null : id);
        

        if (expandedId !== id) {
            setNotifications(notifications.map(notif => 
                notif.id === id ? {...notif, read: true} : notif
            ));
        }
    };

    const filterNotifications = () => {
        return notifications.filter(notif => {
            const matchesSearch = notif.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 notif.message.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesCategory = selectedCategory === 'All' || 
                                   notif.category.toLowerCase() === selectedCategory.toLowerCase();
            
            return matchesSearch && matchesCategory;
        });
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(notif => ({...notif, read: true})));
    };

    const NotificationItem = ({ item }) => {
        const isExpanded = expandedId === item.id;
        const animatedHeight = new Animated.Value(0);
        
        React.useEffect(() => {
            Animated.timing(animatedHeight, {
                toValue: isExpanded ? 1 : 0,
                duration: 300,
                useNativeDriver: false
            }).start();
        }, [isExpanded]);
        
        const heightInterpolation = animatedHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 120]
        });

        return (
            <TouchableOpacity 
                style={[styles.notificationItem, !item.read && styles.unreadNotification]}
                onPress={() => toggleExpand(item.id)}
                activeOpacity={0.7}
            >
                <View style={styles.notificationHeader}>
                    <View style={styles.notificationIcon}>
                        <Ionicons name={item.icon} size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.notificationContent}>
                        <Text style={styles.notificationTitle}>{item.title}</Text>
                        <Text style={styles.notificationTime}>{item.time}</Text>
                    </View>
                    <Ionicons 
                        name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                        size={20} 
                        color={Colors.gray} 
                    />
                </View>
                
                <Animated.View style={{ height: heightInterpolation, overflow: 'hidden' }}>
                    <Text style={styles.notificationMessage}>{item.message}</Text>
                    {isExpanded && (
                        <TouchableOpacity style={styles.actionButton}>
                            <Text style={styles.actionText}>View Details</Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <LinearGradient
                colors={['#D70000', '#E52421', '#F0533F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <Text style={styles.greeting}>Hi</Text>
                    <Text style={styles.userName}>{userName}</Text>
                </View>

                <View style={styles.headerBottom}>
                    <Text style={styles.screenTitle}>Notifications</Text>
                    <TouchableOpacity onPress={markAllAsRead}>
                        <Text style={styles.markAllText}>Mark all as read</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

      
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={Colors.gray} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>


            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categoryContainer}
                contentContainerStyle={styles.categories}
            >
                {CATEGORIES.map(category => (
                    <TouchableOpacity
                        key={category}
                        style={[
                            styles.categoryPill,
                            selectedCategory === category && styles.categoryPillActive
                        ]}
                        onPress={() => setSelectedCategory(category)}
                    >
                        <Text style={[
                            styles.categoryText,
                            selectedCategory === category && styles.categoryTextActive
                        ]}>
                            {category}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <FlatList
                data={filterNotifications()}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <NotificationItem item={item} />}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-off-outline" size={50} color={Colors.lightGray} />
                        <Text style={styles.emptyStateText}>No notifications found</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: Colors.white 
    },
    header: { 
        paddingHorizontal: 24, 
        paddingTop: 24,
        paddingBottom: 20
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 15
    },
    greeting: { 
        color: '#fff', 
        fontSize: 16, 
        marginRight: 5 
    },
    userName: { 
        color: '#fff', 
        fontSize: 24, 
        fontWeight: '700' 
    },
    headerBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    screenTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '700'
    },
    markAllText: {
        color: '#fff',
        fontSize: 14,
        opacity: 0.9
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.lightGray,
        marginHorizontal: 20,
        marginVertical: 15,
        borderRadius: 10,
        paddingHorizontal: 15,
        height: 50
    },
    searchIcon: {
        marginRight: 10
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: Colors.textPrimary
    },
    categoryContainer: {
        paddingHorizontal: 15,
        marginBottom: 10
    },
    categories: {
        paddingHorizontal: 5
    },
    categoryPill: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.lightGray,
        marginHorizontal: 5
    },
    categoryPillActive: {
        backgroundColor: Colors.primary
    },
    categoryText: {
        color: Colors.textSecondary,
        fontWeight: '500'
    },
    categoryTextActive: {
        color: Colors.white
    },
    listContainer: {
        paddingHorizontal: 20,
        paddingBottom: 30
    },
    notificationItem: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2
    },
    unreadNotification: {
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5
    },
    notificationIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.lightGray + '40',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    notificationContent: {
        flex: 1
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: 3
    },
    notificationTime: {
        fontSize: 12,
        color: Colors.textSecondary
    },
    notificationMessage: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
        marginTop: 10
    },
    actionButton: {
        marginTop: 15,
        paddingVertical: 8,
        alignItems: 'center'
    },
    actionText: {
        color: Colors.primary,
        fontWeight: '600'
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50
    },
    emptyStateText: {
        marginTop: 15,
        fontSize: 16,
        color: Colors.textSecondary
    }
});