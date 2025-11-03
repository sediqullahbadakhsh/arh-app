
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ValidationModal = ({ visible, title, message, onClose }) => (
  <Modal isVisible={visible} transparent={true}    statusBarTranslucent={true} animationIn="zoomIn" animationOut="fadeOut" >

    <View style={styles.container}>
      <Icon name="error-outline" size={70} color="#e74c3c" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity style={styles.button} onPress={onClose}>
        <Text style={styles.buttonText}>OK</Text>
      </TouchableOpacity>
    </View>

  </Modal>
);

const styles = StyleSheet.create({
      modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
   modalBackdrop: {
    flex: 1,
  },
  container: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 10,
    color: '#333',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 15,
    color: '#555',
  },
  button: {
    backgroundColor: '#e74c3c',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ValidationModal;