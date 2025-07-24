import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

export default function Checkbox({ checked, onToggle }) {
    return (
        <TouchableOpacity onPress={onToggle} activeOpacity={0.8}>
            <View style={[styles.box, checked && styles.boxChecked]}>
                {checked && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    box: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    boxChecked: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
});