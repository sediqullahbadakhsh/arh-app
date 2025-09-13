import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

export default function ServiceButton({ icon, label, onPress }) {
    return (
        <TouchableOpacity style={styles.wrapper} onPress={onPress} activeOpacity={0.85}>
            <View style={styles.iconBox}>
                <Ionicons name={icon} size={32} color={Colors.primary} />
            </View>
            <Text style={styles.text} numberOfLines={2}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: '23%',      
        alignItems: 'center',
        marginBottom: 18,
    },
    iconBox: {
        width: 68,
        height: 68,
        borderRadius: 16,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#F1F1F1',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 3,
        elevation: 2,
    },
    text: {
        fontSize: 12,
        marginTop: 3,
        color: Colors.textPrimary,
        textAlign: 'center',
        lineHeight: 14,
    },
});
