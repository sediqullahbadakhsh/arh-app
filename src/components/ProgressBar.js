import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { scale } from '../utils/normalizeSize'; // your scaling utility

export default function ProgressBar({ duration = 2000, onComplete }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 100,
      duration,
      useNativeDriver: false,
    }).start(() => {
      if (onComplete) onComplete();
    });
  }, []);

  const widthInterpolated = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bar, { width: widthInterpolated }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: scale.hp(2),
    width: '100%',
    backgroundColor: '#eee',
    borderRadius: scale.hp(1),
    overflow: 'hidden',
    marginTop: scale.hp(2),
  },
  bar: {
    height: '100%',
    backgroundColor: '#4f46e5',
    borderRadius: scale.hp(1),
  },
});