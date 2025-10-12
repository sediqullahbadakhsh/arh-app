// src/navigation/TabWrapper.js
import React from 'react';
import TabNavigator from './TabNavigator';
import FloatingMiddleButton from '../components/FloatingMiddleButton';
import { useNavigation } from '@react-navigation/native';
import { View, StyleSheet } from 'react-native';

export default function TabWrapper() {
  const navigation = useNavigation();

  return (
    <View style={styles.wrapper}>
      <TabNavigator />
      <FloatingMiddleButton onPress={() => navigation.navigate('TopupTab')} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: 'relative',
  },
});