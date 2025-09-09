import React, { useState } from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";

export default function CustomDialog({ visible, onClose, title, message }) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={onClose}>
              <Text style={[styles.buttonText, styles.confirmText]}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dialog: {
    width: 300,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  message: { fontSize: 16, marginBottom: 20, textAlign: "center" },
  buttons: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
  button: { flex: 1, padding: 10, alignItems: "center", borderRadius: 8, marginHorizontal: 5, backgroundColor: "#eee" },
  confirmButton: { backgroundColor: "#4A90E2" },
  buttonText: { color: "#333", fontWeight: "bold" },
  confirmText: { color: "#fff" },
});
