// components/FloatingMiddleButton.js
import React from 'react';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { Colors } from '../theme/colors';

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
    bottom: Platform.OS === 'ios' ? 40 : 30,
    alignSelf: 'center',
    zIndex: 9999,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    marginBottom: 60,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
});