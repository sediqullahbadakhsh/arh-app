import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { scale } from '../utils/normalizeSize';

export default function PrimaryButton({ label, onPress, style }) {
    return (
        <TouchableOpacity style={[styles.button, style]} onPress={onPress} activeOpacity={0.8}>
            <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    borderRadius: scale.hp(3.5),         
    paddingVertical: scale.hp(1.75),     
    alignItems: 'center',
  },
  label: {
    color: Colors.white,
    fontSize: scale.hp(2),               
    fontFamily: 'dmsansRegular',
  },
});
