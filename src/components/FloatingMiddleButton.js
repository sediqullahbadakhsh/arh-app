// components/FloatingMiddleButton.js
import React from 'react';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { Colors } from '../theme/colors';
import { scale } from '../utils/normalizeSize';

export default function FloatingMiddleButton({ onPress }) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.button}>
        <Feather name="zap" size={28} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? scale.hp(5.2) : scale.hp(3.9),
    alignSelf: 'center',
    zIndex: 9999,
  },
  button: {
    width: scale.wp(16.6),
    height: scale.wp(16.6),
    borderRadius: scale.wp(8.3),
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    marginBottom: scale.hp(7.8),
    shadowOffset: { width: 0, height: scale.hp(0.5) },
    shadowOpacity: 0.3,
    shadowRadius: scale.hp(0.65),
    elevation: 10,
  },
});