import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ServiceHeader({ title, onBack }) {
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
                    <View style={styles.headerRow}>
                        <TouchableOpacity 
                            style={styles.backBtn} 
                            onPress={onBack} 
                            activeOpacity={0.8}
                        >
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        
                        <Text style={styles.title}>{title}</Text>
                        
                        <View style={styles.spacer} />
                    </View>
                </View>

             
                <View style={styles.decoration1}></View>
                <View style={styles.decoration2}></View>
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
        position: 'relative',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center', 
        paddingBottom: 24, 
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    backBtn: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
        flex: 1,
        marginHorizontal: 12,
    },
    spacer: {
        width: 32, // Same as backBtn width for balance
    },
    roundedTop: {
        height: 24,
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -24,
    },
    decoration1: {
        position: "absolute", 
        top: 15, 
        right: -186, 
        backgroundColor: "#FFFFFF0A", 
        height: 80, 
        width: "100%",
        transform: [{ rotate: "130deg" }],
    },
    decoration2: {
        position: "absolute", 
        top: 15, 
        right: -300, 
        backgroundColor: "#FFFFFF14", 
        height: 120, 
        width: "100%",
        transform: [{ rotate: "130deg" }],
    },
});