import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RTLTransitionHandler = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const errorHandler = (error) => {
      console.error('RTL Transition Error:', error);
      setHasError(true);
    };


    const originalErrorHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler(errorHandler);

    return () => {
      ErrorUtils.setGlobalHandler(originalErrorHandler);
    };
  }, []);

  if (hasError) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Layout updating...</Text>
      </View>
    );
  }

  return children;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
});

export default RTLTransitionHandler;