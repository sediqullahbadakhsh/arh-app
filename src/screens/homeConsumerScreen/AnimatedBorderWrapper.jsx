import React, { useRef, useEffect } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { scale } from '../../utils/normalizeSize';

export default function AnimatedBorderWrapper({ children }) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.border, { transform: [{ rotate: spin }] }]}>
        <LinearGradient
          colors={['#FF6C7C', '#FF7A90', '#CD0202']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
      </Animated.View>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const BORDER_SIZE = 4;

const styles = StyleSheet.create({
  container: {
    padding: BORDER_SIZE,
    borderRadius: scale.hp(2.6),
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: scale.hp(2.6),
    zIndex: -1,
  },
  gradient: {
    flex: 1,
    borderRadius: scale.hp(2.6),
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: scale.hp(2.1),
    padding: scale.hp(2.1),
    width: '100%',
  },
});