import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

export default function PaymentMethodToggle({ methods, selected, onSelect }) {
    return (
        <View style={styles.container}>
            {methods.map((m) => (
                <TouchableOpacity
                    key={m.key}
                    style={[styles.option, selected === m.key && styles.optionSelected]}
                    onPress={() => onSelect(m.key)}
                    activeOpacity={0.85}
                >
                    <Ionicons
                        name={m.icon}
                        size={18}
                        color={selected === m.key ? Colors.white : Colors.textPrimary}
                        style={{ marginRight: 6 }}
                    />
                    <Text
                        style={[
                            styles.label,
                            { color: selected === m.key ? Colors.white : Colors.textPrimary },
                        ]}
                    >
                        {m.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flexDirection: 'row', marginTop: 8 },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingVertical: 8,
        paddingHorizontal: 14,
        marginRight: 12,
    },
    optionSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    label: { fontSize: 13, fontWeight: '500' },
});
