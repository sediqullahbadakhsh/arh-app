import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { scale } from '../utils/normalizeSize';

export default function DotIndicators({ total, activeIndex }) {
    return (
        <View style={styles.container}>
            {Array.from({ length: total }).map((_, idx) => (
                <View
                    key={idx}
                    style={[styles.dot, idx === activeIndex ? styles.activeDot : null]}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: scale.hp(1.05),
  },
  dot: {
    width: scale.wp(1.6),
    height: scale.wp(1.6),
    borderRadius: scale.wp(0.8),
    backgroundColor: '#E0E0E0',
    marginHorizontal: scale.wp(1.05),
  },
  activeDot: {
    backgroundColor: Colors.primary,
    width: scale.wp(4.2),
    borderRadius: scale.wp(0.8),
  },
});
