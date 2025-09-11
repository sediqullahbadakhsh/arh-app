import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
} from "react-native";
import Modal from "react-native-modal";
import { Ionicons } from "@expo/vector-icons";



export default function LanguageSelector({ selectedLang, onChange, langs }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (lang) => {
    onChange(lang);
    setIsOpen(false);
  };

  return (
    <View style={{ marginVertical: 10 }}>
      <Text style={styles.label}>Select Language</Text>
      <TouchableOpacity
        style={styles.dropField}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
      >
        {selectedLang ? (
          <View style={styles.selected}>
            <Image
              source={{ uri: selectedLang.flag }}
              style={styles.flag}
              resizeMode="contain"
            />
            <Text style={styles.selectedText}>{selectedLang.label}</Text>
          </View>
        ) : (
          <Text style={{ color: "#6B7280" }}>Select language...</Text>
        )}
        <Ionicons name="chevron-down" size={20} color="#7A7A7A" />
      </TouchableOpacity>

      <Modal
        isVisible={isOpen}
        onBackdropPress={() => setIsOpen(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <FlatList
            data={langs}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.langItem}
                onPress={() => handleSelect(item)}
              >
                <Image
                  source={{ uri: item.flag }}
                  style={styles.flag}
                  resizeMode="contain"
                />
                <Text style={styles.langText}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, marginBottom: 5 },
  dropField: {
    height: 46,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selected: { flexDirection: "row", alignItems: "center" },
  selectedText: { marginLeft: 8, color: "#000" },
  flag: { width: 20, height: 15 },
  modal: { justifyContent: "flex-end", margin: 0 },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingVertical: 10,
  },
  langItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  langText: { marginLeft: 10, fontSize: 16, color: "#000" },
});
