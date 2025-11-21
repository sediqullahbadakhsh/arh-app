import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, BackHandler } from 'react-native';
import NetInfo from '@react-native-community/netinfo'; 
import { scale } from '../utils/normalizeSize';

const InternetConnectionMonitor = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected && state.isInternetReachable;
      setIsConnected(connected);
      

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

  
  const checkConnection = () => {
    return isConnected;
  };

  return (
    <Modal
      visible={showModal}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={() => {}} 
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
    padding: scale.hp(2.6),
    borderRadius: scale.hp(1.3),
    alignItems: 'center',
    margin: scale.hp(2.6),
  },
  title: {
    fontSize: scale.hp(2.35),
    fontWeight: 'bold',
    marginBottom: scale.hp(1.3),
    color: '#D70000',
  },
  message: {
    fontSize: scale.hp(2.1),
    textAlign: 'center',
    marginBottom: scale.hp(2),
    color: '#333',
    lineHeight: scale.hp(2.9),
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  retryButton: {
    color: '#D70000',
    fontSize: scale.hp(2.1),
    fontWeight: 'bold',
    paddingHorizontal: scale.wp(5.2),
    paddingVertical: scale.hp(1.3),
  },
});

export default InternetConnectionMonitor;