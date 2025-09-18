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
    UIManager,
    StatusBar
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
        icon: 'cash-outline',
        priority: 'high'
    },
    {
        id: '2',
        title: 'Security Alert',
        message: 'A new device signed in to your account. If this was you, you can ignore this message.',
        time: '5 hours ago',
        category: 'security',
        read: false,
        icon: 'shield-checkmark-outline',
        priority: 'high'
    },
    {
        id: '3',
        title: 'Promotional Offer',
        message: 'Special discount of 20% on all transactions this weekend. Use code WEEKEND20 to avail the offer.',
        time: '1 day ago',
        category: 'promotions',
        read: true,
        icon: 'pricetag-outline',
        priority: 'medium'
    },
    {
        id: '4',
        title: 'Account Updated',
        message: 'Your profile information has been successfully updated with the new changes you made.',
        time: '2 days ago',
        category: 'account',
        read: true,
        icon: 'person-outline',
        priority: 'low'
    },
    {
        id: '5',
        title: 'Weekly Summary',
        message: 'Your weekly spending summary is ready. You spent $450 this week across 12 transactions.',
        time: '3 days ago',
        category: 'reports',
        read: true,
        icon: 'stats-chart-outline',
        priority: 'medium'
    },
    {
        id: '6',
        title: 'Card Transaction',
        message: 'Your card ending with 4567 was used for a purchase of $89.50 at Amazon.com.',
        time: '4 days ago',
        category: 'payments',
        read: true,
        icon: 'card-outline',
        priority: 'medium'
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
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setNotifications(notifications.map(notif => ({...notif, read: true})));
    };

    const clearAll = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setNotifications([]);
    };

    const NotificationItem = ({ item }) => {
        const isExpanded = expandedId === item.id;
        const animatedHeight = new Animated.Value(0);
        const scaleValue = new Animated.Value(1);
        
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

        const getPriorityColor = () => {
            switch(item.priority) {
                case 'high': return Colors.primary;
                case 'medium': return Colors.warning;
                case 'low': return Colors.success;
                default: return Colors.gray;
            }
        };

        const handlePressIn = () => {
            Animated.spring(scaleValue, {
                toValue: 0.98,
                useNativeDriver: true,
            }).start();
        };

        const handlePressOut = () => {
            Animated.spring(scaleValue, {
                toValue: 1,
                useNativeDriver: true,
            }).start();
        };

        return (
            <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
                <TouchableOpacity 
                    style={[styles.notificationItem, !item.read && styles.unreadNotification]}
                    onPress={() => toggleExpand(item.id)}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    activeOpacity={0.9}
                >
                    <View style={styles.notificationHeader}>
                        <View style={[styles.notificationIcon, { backgroundColor: getPriorityColor() + '20' }]}>
                            <Ionicons name={item.icon} size={22} color={getPriorityColor()} />
                        </View>
                        <View style={styles.notificationContent}>
                            <View style={styles.titleRow}>
                                <Text style={styles.notificationTitle} numberOfLines={1}>{item.title}</Text>
                                {!item.read && <View style={styles.unreadIndicator} />}
                            </View>
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
                            <View style={styles.actionContainer}>
                                <TouchableOpacity style={[styles.actionButton, styles.viewButton]}>
                                    <Text style={styles.viewButtonText}>View Details</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionButton, styles.dismissButton]}>
                                    <Text style={styles.dismissButtonText}>Dismiss</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </Animated.View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#D70000', '#E52421', '#F0533F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.greeting}>Hello,</Text>
                            <Text style={styles.userName}>{userName}</Text>
                        </View>
                        <TouchableOpacity style={styles.profileButton}>
                            <Ionicons name="person-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.headerBottom}>
                        <Text style={styles.screenTitle}>Notifications</Text>
                        <View style={styles.headerActions}>
                            <TouchableOpacity onPress={markAllAsRead} style={styles.headerButton}>
                                <Text style={styles.headerButtonText}>Mark all read</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={clearAll} style={styles.headerButton}>
                                <Text style={styles.headerButtonText}>Clear all</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.content}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={Colors.gray} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search notifications..."
                        placeholderTextColor={Colors.gray}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={Colors.gray} />
                        </TouchableOpacity>
                    )}
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

                <View style={styles.notificationHeader}>
                    <Text style={styles.sectionTitle}>Recent Notifications</Text>
                    <Text style={styles.notificationCount}>{filterNotifications().length} items</Text>
                </View>

                <FlatList
                    data={filterNotifications()}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <NotificationItem item={item} />}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="notifications-off-outline" size={60} color={Colors.lightGray} />
                            <Text style={styles.emptyStateTitle}>No notifications</Text>
                            <Text style={styles.emptyStateText}>
                                {searchQuery || selectedCategory !== 'All' 
                                    ? 'Try changing your search or filter' 
                                    : 'You\'re all caught up!'}
                            </Text>
                        </View>
                    }
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: Colors.background 
    },
    header: { 
        paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
        paddingBottom: 20
    },
    headerContent: {
        paddingHorizontal: 20
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    greeting: { 
        color: 'rgba(255, 255, 255, 0.8)', 
        fontSize: 14, 
        marginBottom: 2
    },
    userName: { 
        color: '#fff', 
        fontSize: 20, 
        fontWeight: '700' 
    },
    profileButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    screenTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '800'
    },
    headerActions: {
        flexDirection: 'row'
    },
    headerButton: {
        marginLeft: 15
    },
    headerButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        opacity: 0.9
    },
    content: {
        flex: 1,
        backgroundColor: Colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginTop: -20,
        paddingTop: 20
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        marginHorizontal: 20,
        marginBottom: 15,
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2
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
        marginBottom: 15,
        paddingHorizontal: 5
    },
    categories: {
        paddingHorizontal: 15
    },
    categoryPill: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: Colors.white,
        marginHorizontal: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    categoryPillActive: {
        backgroundColor: Colors.primary
    },
    categoryText: {
        color: Colors.textSecondary,
        fontWeight: '600',
        fontSize: 14
    },
    categoryTextActive: {
        color: Colors.white
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 15
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary
    },
    notificationCount: {
        fontSize: 14,
        color: Colors.textSecondary
    },
    listContainer: {
        paddingHorizontal: 20,
        paddingBottom: 30
    },
    notificationItem: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3
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
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    notificationContent: {
        flex: 1
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 3
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginRight: 8,
        flex: 1
    },
    unreadIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary
    },
    notificationTime: {
        fontSize: 13,
        color: Colors.textSecondary
    },
    notificationMessage: {
        fontSize: 15,
        color: Colors.textSecondary,
        lineHeight: 22,
        marginTop: 10
    },
    actionContainer: {
        flexDirection: 'row',
        marginTop: 15,
        justifyContent: 'flex-end'
    },
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 10
    },
    viewButton: {
        backgroundColor: Colors.primary
    },
    dismissButton: {
        backgroundColor: Colors.lightGray
    },
    viewButtonText: {
        color: Colors.white,
        fontWeight: '600',
        fontSize: 14
    },
    dismissButtonText: {
        color: Colors.textSecondary,
        fontWeight: '600',
        fontSize: 14
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60
    },
    emptyStateTitle: {
        marginTop: 15,
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 5
    },
    emptyStateText: {
        fontSize: 15,
        color: Colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 40
    }
});