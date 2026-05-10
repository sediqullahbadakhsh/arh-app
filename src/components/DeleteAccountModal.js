import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import { scale } from "../utils/normalizeSize";

export default function DeleteAccountModal({
  visible,
  onClose,
  onConfirm,
  loading,
  userType = "customer",
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons name="warning" size={48} color="#CD0202" />
          </View>
          
          <Text style={styles.title}>Delete Account</Text>
          
          <Text style={styles.message}>
            Are you sure you want to permanently delete your account? This action cannot be undone. All your data will be permanently removed.
          </Text>
          
          <View style={styles.warningBox}>
            <Ionicons name="information-circle" size={20} color="#CD0202" />
            <Text style={styles.warningText}>
              You will lose access to all your transaction history, balance, and account information.
            </Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                  <Text style={styles.deleteButtonText}>Delete Account</Text>
                </>
              )}
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: scale.wp(5.2),
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: scale.hp(2.1),
    padding: scale.wp(6.2),
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  iconContainer: {
    width: scale.hp(10.4),
    height: scale.hp(10.4),
    borderRadius: scale.hp(5.2),
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scale.hp(2.1),
  },
  title: {
    fontSize: scale.hp(2.6),
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: scale.hp(1.3),
  },
  message: {
    fontSize: scale.hp(1.95),
    color: "#666",
    textAlign: "center",
    lineHeight: scale.hp(2.6),
    marginBottom: scale.hp(2.1),
  },
  warningBox: {
    flexDirection: "row",
    backgroundColor: "#FFF5F5",
    padding: scale.wp(3.1),
    borderRadius: scale.hp(1.3),
    marginBottom: scale.hp(2.6),
    alignItems: "flex-start",
    width: "100%",
  },
  warningText: {
    flex: 1,
    fontSize: scale.hp(1.7),
    color: "#CD0202",
    marginLeft: scale.wp(2.1),
    lineHeight: scale.hp(2.1),
  },
  buttonContainer: {
    flexDirection: "row",
    gap: scale.wp(3.1),
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: scale.hp(1.55),
    borderRadius: scale.hp(1.3),
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: scale.hp(1.95),
    color: "#666",
    fontWeight: "500",
  },
  deleteButton: {
    flex: 1,
    paddingVertical: scale.hp(1.55),
    borderRadius: scale.hp(1.3),
    backgroundColor: "#CD0202",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: scale.wp(2.1),
  },
  deleteButtonText: {
    fontSize: scale.hp(1.95),
    color: "#fff",
    fontWeight: "500",
  },
});