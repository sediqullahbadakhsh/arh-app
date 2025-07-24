import React, { useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen({ navigation }) {
    const [avatar, setAvatar] = useState(null);
    const userName = 'Ajmal Badakhsh';

    const handleEditAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaType.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setAvatar(result.assets[0].uri);
        }
    };

    const goStatement = () => navigation.navigate('ServiceTodo', { title: 'Statement' });
    const goManage = () => navigation.navigate('ServiceTodo', { title: 'Manage Wallet' });
    const goSettings = () => navigation.navigate('ServiceTodo', { title: 'Settings' });
    const goMore = () => navigation.navigate('ServiceTodo', { title: 'More' });

    const handleLogout = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'Welcome' }],
        });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Gradient Header */}
            <LinearGradient
                colors={['#D70000', '#E52421', '#F0533F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                {/* Avatar overlaps bottom of header */}
                <View style={styles.avatarWrapper}>
                    {avatar ? (
                        <Image source={{ uri: avatar }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="person" size={48} color="#fff" />
                        </View>
                    )}

                    <TouchableOpacity style={styles.editBtn} onPress={handleEditAvatar}>
                        <Ionicons name="create-outline" size={16} color="#000" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Body */}
            <View style={styles.body}>
                {/* Name below avatar now */}
                <View style={styles.nameRow}>
                    <Text style={styles.nameText}>{userName}</Text>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.primary} style={{ marginLeft: 4 }} />
                </View>

                <View style={styles.card}>
                    <ProfileRow
                        icon={<MaterialIcons name="receipt-long" size={22} color={Colors.primary} />}
                        title="Statement"
                        subtitle="View your statement"
                        onPress={goStatement}
                    />

                    <ProfileRow
                        icon={<Ionicons name="wallet-outline" size={22} color={Colors.primary} />}
                        title="Manage"
                        subtitle="Easily manage your wallet"
                        onPress={goManage}
                    />

                    <ProfileRow
                        icon={<Ionicons name="settings-outline" size={22} color={Colors.primary} />}
                        title="Setting"
                        subtitle="Perform account setting"
                        onPress={goSettings}
                    />

                    <ProfileRow
                        icon={<Ionicons name="grid-outline" size={22} color={Colors.primary} />}
                        title="More"
                        subtitle="Access additional features and informations."
                        onPress={goMore}
                    />

                    <ProfileRow
                        icon={<Ionicons name="log-out-outline" size={22} color={Colors.primary} />}
                        title="Logout"
                        subtitle="Logout form eWallet"
                        isLast
                        onPress={handleLogout}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

function ProfileRow({ icon, title, subtitle, onPress, isLast }) {
    return (
        <TouchableOpacity style={[styles.row, isLast && { borderBottomWidth: 0 }]} onPress={onPress}>
            <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>{icon}</View>
                <View>
                    <Text style={styles.rowTitle}>{title}</Text>
                    <Text style={styles.rowSubtitle}>{subtitle}</Text>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#BDBDBD" />
        </TouchableOpacity>
    );
}

const AVATAR_SIZE = 150;  // slightly larger
const EDIT_SIZE = 32;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.white },

    header: {
        height: 200,
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'android' ? 24 : 0,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },

    avatarWrapper: {
        position: 'absolute',
        bottom: -AVATAR_SIZE / 2, // overlap half
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
    },

    avatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        borderWidth: 3,
        borderColor: '#fff',
    },

    // Dark placeholder background so it stands out
    avatarPlaceholder: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        backgroundColor: '#000',          // <- black background
        borderWidth: 3,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },

    editBtn: {
        position: 'absolute',
        right: -4,
        bottom: -4,
        width: EDIT_SIZE,
        height: EDIT_SIZE,
        borderRadius: EDIT_SIZE / 2,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
    },

    body: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: AVATAR_SIZE / 2 + 24, // space for overlapping avatar
    },

    // Name row moved into body, centered
    nameRow: {
        flexDirection: 'row',
        alignSelf: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    nameText: {
        color: Colors.textPrimary,
        fontSize: 20,
        fontWeight: '600',
    },

    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F2F2F2',
        paddingVertical: 8,
        overflow: 'hidden',
    },

    row: {
        flexDirection: 'row',
        paddingVertical: 14,
        paddingHorizontal: 16,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F3F3',
        justifyContent: 'space-between',
    },
    rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    rowIcon: {
        width: 32,
        height: 32,
        borderRadius: 6,
        backgroundColor: '#FFF5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rowTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '500' },
    rowSubtitle: { color: '#9E9E9E', fontSize: 11, marginTop: 2 },
});
