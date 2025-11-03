import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, BackHandler } from 'react-native';
import NetInfo from '@react-native-community/netinfo'; 

const InternetConnectionMonitor = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected && state.isInternetReachable;
      setIsConnected(connected);
      
      // Show modal only when connection is lost
      if (!connected) {
        setShowModal(true);
      } else {
        setShowModal(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleRetry = () => {
    NetInfo.fetch().then(state => {
      if (state.isConnected && state.isInternetReachable) {
        setShowModal(false);
      }
    });
  };

  // Function to check connection status (you can export this if needed)
  const checkConnection = () => {
    return isConnected;
  };

  return (
    <Modal
      visible={showModal}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={() => {}} // Prevent closing by back button
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>No Internet Connection</Text>
          <Text style={styles.message}>
            Please check your internet connection. Some features may not be available.
          </Text>
          <View style={styles.buttonContainer}>
            <Text style={styles.retryButton} onPress={handleRetry}>
              Retry Connection
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    margin: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#D70000',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  retryButton: {
    color: '#D70000',
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
});

export default InternetConnectionMonitor;