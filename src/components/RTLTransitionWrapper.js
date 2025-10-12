import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

export const RTLTransitionWrapper = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(false);
    const timer = setTimeout(() => setIsReady(true), 150);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <ActivityIndicator size="small" color="#D70000" />
      </View>
    );
  }

  return children;
};