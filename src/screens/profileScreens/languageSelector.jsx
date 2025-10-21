import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
  Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { t } from "i18next";

const { height: screenHeight } = Dimensions.get('window');

export default function LanguageSelector({ selectedLang, onChange, langs, loading = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();
  

  const [modalSlideAnim] = useState(new Animated.Value(screenHeight));

  useEffect(() => {
    if (isOpen) {
      Animated.timing(modalSlideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.back(1)),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(modalSlideAnim, {
        toValue: screenHeight,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen]);

  const filteredLangs = searchQuery
    ? langs.filter(lang =>
        lang.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.value?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : langs;

  const handleSelect = (lang) => {
    onChange(lang);
    setIsOpen(false);
    setSearchQuery('');
  };

  const renderFlag = (lang) => {
    if (!lang?.flag) {
      return (
        <View style={{ width: 24, height: 18, marginRight: 12, backgroundColor: '#F0F0F0', borderRadius: 2 }} />
      );
    }
    
    return (
      <Image
        source={{ uri: lang.flag }}
        style={{ width: 24, height: 18, marginRight: 12, borderRadius: 2 }}
        resizeMode="contain"
      />
    );
  };

  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.label}>Select Language</Text>
      <TouchableOpacity
        style={[styles.dropField, loading && styles.disabled]}
        onPress={() => !loading && setIsOpen(true)}
        activeOpacity={0.8}
        disabled={loading}
      >
        <View style={styles.selected}>
          {selectedLang ? (
            <>
              {renderFlag(selectedLang)}
              <View style={{ flex: 1 }}>
                <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '500' }}>
                  {selectedLang.label}
                </Text>
                <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>
                  {(selectedLang.code || selectedLang.value).toUpperCase()}
                </Text>
              </View>
            </>
          ) : (
            <Text style={{ color: "#6B7280", fontSize: 16 }}>{t('selectLanguage')}</Text>
          )}
        </View>
        
        {loading ? (
          <ActivityIndicator size="small" color="#7A7A7A" />
        ) : (
          <Ionicons name="chevron-down" size={20} color="#7A7A7A" />
        )}
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="none"
        statusBarTranslucent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsOpen(false)}
          />
          <Animated.View 
            style={[
              styles.modalCard,
              { 
                transform: [{ translateY: modalSlideAnim }],
                height: '80%',
                marginBottom: -insets.bottom
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectLanguage1')}</Text>
              <TouchableOpacity 
                onPress={() => setIsOpen(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                placeholder="Search languages..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                placeholderTextColor="#999"
              />
            </View>

            <FlatList
              data={filteredLangs}
              keyExtractor={(item) => item.code || item.value || Math.random().toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalRow} onPress={() => handleSelect(item)}>
                  {renderFlag(item)}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '500' }}>
                      {item.label}
                    </Text>
                    <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>
                      {(item.code || item.value).toUpperCase()}
                    </Text>
                  </View>
                  {selectedLang?.code === item.code && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.contactSeparator} />}
            />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = {
  label: { 
    fontSize: 14, 
    marginBottom: 8,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  dropField: {
    height: 65,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  disabled: {
    opacity: 0.6,
  },
  selected: { 
    flexDirection: "row", 
    alignItems: "center",
    flex: 1
  },
  
  // Modal styles matching the country modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: Colors.textPrimary 
  },
  closeButton: {
    padding: 4,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  contactSeparator: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
};