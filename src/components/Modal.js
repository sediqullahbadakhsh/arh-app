import React, { useState } from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import { scale } from "../utils/normalizeSize";

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
    width: scale.wp(78),
    backgroundColor: "#fff",
    borderRadius: scale.hp(1.55),
    padding: scale.hp(2.6),
    alignItems: "center",
  },
  title: {
    fontSize: scale.hp(2.35),
    fontWeight: "bold",
    marginBottom: scale.hp(1.3),
  },
  message: {
    fontSize: scale.hp(2.1),
    marginBottom: scale.hp(2.6),
    textAlign: "center",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    flex: 1,
    padding: scale.hp(1.3),
    alignItems: "center",
    borderRadius: scale.hp(1.05),
    marginHorizontal: scale.wp(1.3),
    backgroundColor: "#eee",
  },
  confirmButton: {
    backgroundColor: "#4A90E2",
  },
  buttonText: {
    color: "#333",
    fontWeight: "bold",
  },
  confirmText: {
    color: "#fff",
  },
});
