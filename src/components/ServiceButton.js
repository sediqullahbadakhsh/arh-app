import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Colors } from '../theme/colors';
import { scale } from '../utils/normalizeSize';

export default function ServiceButton({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.wrapper} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.iconBox}>
        {icon}
      </View>
      <Text style={styles.text} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '30%',
    alignItems: 'center',
    // borderWidth: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    marginBottom: scale.hp(2),
  },
  iconBox: {
    borderRadius: 12,
    backgroundColor: "#f3f3f3ff",
    width: scale.hp(10),
    height: scale.hp(10),
    padding: scale.hp(2),
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: scale.hp(1.4),
    marginTop: scale.hp(1),
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: scale.hp(2),
  },
});