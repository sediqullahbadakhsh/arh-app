import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotificationsHeader({ title, onBack, onOpenModal }) {
    const insets = useSafeAreaInsets();
    return (
        <View>
            <LinearGradient
                colors={["#9F0901", "#E20E02"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradient, { paddingTop: insets.top }]}
            >
                <View style={styles.centerContainer}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        
                        <View style={styles.titleWrapper}>
                            <Text style={styles.title}>{title}</Text>
                        </View>
                        
                        <TouchableOpacity style={styles.filterBtn} onPress={onOpenModal} activeOpacity={0.8}>
                            <Ionicons name="settings" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
                
                <View style={{position: "absolute",  top:15, right: -186, backgroundColor: "#FFFFFF0A", height: 80, width: "100%",transform: [{ rotate: "130deg" }], 
                            justifyContent: "center",
                            alignItems: "center", pointerEvents: "none" }}></View>
                            
                <View style={{position: "absolute",  top:15, right: -300, backgroundColor: "#FFFFFF14", height: 120, width: "100%",transform: [{ rotate: "130deg" }],
                            justifyContent: "center",
                            alignItems: "center", pointerEvents: "none" }}></View>
            </LinearGradient>
            <View style={styles.roundedTop} />
        </View>
    );
}

const styles = StyleSheet.create({
    gradient: {
        width: '100%',
        height: 180,
        paddingHorizontal: 24,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center', 
        marginBottom: 12,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center', 
        justifyContent: 'space-between',
        width: '100%',
        height: 40, 
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    filterBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    titleWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
        lineHeight: 24,
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
    roundedTop: {
        height: 24,
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -24,
    },
});