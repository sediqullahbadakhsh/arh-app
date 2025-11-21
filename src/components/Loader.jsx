import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { scale } from '../utils/normalizeSize';

const AnimatedView = Animated.createAnimatedComponent(View);

const Loader = () => {
  return (
    <View style={styles.backdrop}>
      <View style={styles.loaderContainer}>
        <View style={styles.loader}>
          <AnimatedCircle color="#FF8C00" delay={0} outlineDelay={900} />
          <AnimatedCircle color="#FFA500" delay={300} outlineDelay={1200} />
          <AnimatedCircle color="#FFC107" delay={600} outlineDelay={1500} />
          <AnimatedCircle color="#FFD700" delay={900} outlineDelay={1800} />
        </View>
      </View>
    </View>
  );
};

const AnimatedCircle = ({ color, delay, outlineDelay }) => {
  const circleScale = useSharedValue(1);
  const circleOpacity = useSharedValue(1);
  const dotScale = useSharedValue(1);
  const outlineScale = useSharedValue(0);
  const outlineOpacity = useSharedValue(1);

  React.useEffect(() => {
    circleScale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    circleOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  React.useEffect(() => {
    setTimeout(() => {
      dotScale.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }, delay);
  }, [delay]);

  React.useEffect(() => {
    setTimeout(() => {
      outlineScale.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        false
      );
      outlineOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }, outlineDelay);
  }, [outlineDelay]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
    opacity: circleOpacity.value,
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  const outlineStyle = useAnimatedStyle(() => ({
    transform: [{ scale: outlineScale.value }],
    opacity: outlineOpacity.value,
    borderWidth: 10 - outlineScale.value * 10, 
  }));

  return (
    <AnimatedView style={[styles.circle, { borderColor: color }, circleStyle]}>
      <AnimatedView style={[styles.dot, { backgroundColor: color }, dotStyle]} />
      <AnimatedView style={[styles.outline, { borderColor: color }, outlineStyle]} />
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },

  loader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale.hp(2.6),
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: scale.wp(5.2),
    height: scale.wp(5.2),
    borderWidth: 2,
    borderRadius: scale.wp(2.6),
    marginHorizontal: scale.wp(2.6),
    backgroundColor: 'transparent',
  },
  dot: {
    position: 'absolute',
    width: scale.wp(4.2),
    height: scale.wp(4.2),
    borderRadius: scale.wp(2.1),
  },
  outline: {
    position: 'absolute',
    width: scale.wp(5.2),
    height: scale.wp(5.2),
    borderRadius: scale.wp(2.6),
    borderWidth: scale.wp(2.6),
  },
});

export default Loader;