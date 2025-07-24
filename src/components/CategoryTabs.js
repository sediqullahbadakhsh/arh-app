import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../theme/colors';

export default function CategoryTabs({ categories, active, onChange }) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
        >
            {categories.map((cat) => (
                <TouchableOpacity
                    key={cat}
                    style={[styles.tab, active === cat && styles.tabActive]}
                    onPress={() => onChange(cat)}
                >
                    <Text style={[styles.label, active === cat && styles.labelActive]}>{cat}</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    row: { paddingVertical: 8, paddingHorizontal: 0 },
    tab: {
        paddingVertical: 6,   // was 6
        paddingHorizontal: 14, // was 14
        borderRadius: 14,     // was 18
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginRight: 6,       // was 8
        backgroundColor: '#fff',
        height: 36, // was 40
    },
    tabActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    label: { fontSize: 12, color: Colors.textPrimary },
    labelActive: { color: '#fff', fontWeight: '600' },
});
