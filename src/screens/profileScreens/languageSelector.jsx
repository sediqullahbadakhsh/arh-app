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
  Dimensions,
  Keyboard
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scale } from "../../utils/normalizeSize";

const { height: screenHeight } = Dimensions.get('window');

export default function LanguageSelector({ 
  selectedLang, 
  onChange, 
  langs, 
  loading = false,
  t 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLangs, setFilteredLangs] = useState(langs || []);
  const insets = useSafeAreaInsets();
  
  const modalSlideAnim = useRef(new Animated.Value(screenHeight)).current;
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      Animated.timing(modalSlideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }, 100);
      });
    } else {
      Animated.timing(modalSlideAnim, {
        toValue: screenHeight,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!langs) return;
    
    if (!searchQuery.trim()) {
      setFilteredLangs(langs);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = langs.filter(lang => {
      return (
        lang.label?.toLowerCase().includes(query) ||
        lang.code?.toLowerCase().includes(query) ||
        lang.value?.toLowerCase().includes(query) ||
        (lang.nativeName && lang.nativeName.toLowerCase().includes(query))
      );
    });
    
    setFilteredLangs(filtered);
  }, [searchQuery, langs]);

  const handleSelect = (lang) => {
    if (loading) return;
    
    Keyboard.dismiss();
    onChange(lang);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleModalClose = () => {
    Keyboard.dismiss();
    setIsOpen(false);
    setSearchQuery('');
  };

  const renderFlag = (lang) => {
    if (!lang?.flag) {
      return (
        <View style={styles.flagPlaceholder} />
      );
    }
    
    return (
      <Image
        source={{ uri: lang.flag }}
        style={styles.flag}
        resizeMode="cover"
      />
    );
  };

  const renderLanguageItem = ({ item, index }) => {
    const isSelected = selectedLang?.code === item.code;
    
    return (
      <TouchableOpacity 
        style={[
          styles.modalRow,
          isSelected && styles.selectedRow,
          index === filteredLangs.length - 1 && styles.lastRow
        ]} 
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
        disabled={loading}
      >
        {renderFlag(item)}
        <View style={styles.languageInfo}>
          <Text style={styles.languageName}>{item.label}</Text>
          <Text style={styles.languageCode}>
            {item.nativeName || item.code?.toUpperCase() || item.value?.toUpperCase()}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t?.("selectLanguage1") || "Select Language"}</Text>
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
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedName}>
                  {selectedLang.label}
                </Text>
                <Text style={styles.selectedCode}>
                  {selectedLang.nativeName || selectedLang.code?.toUpperCase()}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.placeholder}>{t?.('selectLanguage') || "Select a language"}</Text>
          )}
        </View>
        
        {loading ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
        )}
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="none"
        statusBarTranslucent={true}
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleModalClose}
            disabled={loading}
          />
          <Animated.View 
            style={[
              styles.modalCard,
              { 
                transform: [{ translateY: modalSlideAnim }],
                height: '75%',
                paddingBottom: insets.bottom
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t?.('selectLanguage1') || "Select Language"}</Text>
              <TouchableOpacity 
                onPress={handleModalClose}
                style={styles.closeButton}
                disabled={loading}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                ref={searchInputRef}
                placeholder={t?.('searchLanguages') || "Search languages..."}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                placeholderTextColor="#999"
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#999" />
                </TouchableOpacity>
              ) : null}
            </View>

            <FlatList
              data={filteredLangs}
              keyExtractor={(item) => item.code || item.value || `lang-${Math.random()}`}
              renderItem={renderLanguageItem}
              ItemSeparatorComponent={() => <View style={styles.contactSeparator} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={40} color={Colors.textSecondary} />
                  <Text style={styles.emptyText}>
                    {t?.('noLanguagesFound') || "No languages found"}
                  </Text>
                </View>
              }
            />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = {
  container: {
    marginBottom: 10,
  },
  label: {
    fontSize: scale.hp(1.8),
    marginBottom: scale.hp(1.05),
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  dropField: {
    height: scale.hp(8.45),
    borderRadius: scale.hp(1.2),
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: scale.wp(4.2),
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  disabled: {
    opacity: 0.7,
  },
  selected: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  selectedCode: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  placeholder: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontStyle: 'italic',
  },
  flag: {
    width: 28,
    height: 20,
    marginEnd: 12,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  flagPlaceholder: {
    width: 28,
    height: 20,
    marginEnd: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: scale.hp(3.2),
    borderTopRightRadius: scale.hp(3.2),
    padding: scale.hp(2.1),
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale.hp(1.5),
    paddingBottom: scale.hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: scale.hp(2.35),
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: scale.hp(0.5),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: scale.hp(1.3),
    paddingHorizontal: scale.wp(3.1),
    marginBottom: scale.hp(2.1),
    height: scale.hp(5.7),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginEnd: scale.wp(2),
  },
  searchInput: {
    flex: 1,
    fontSize: scale.hp(2.1),
    color: Colors.textPrimary,
    padding: 0,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scale.hp(1.3),
    paddingHorizontal: scale.wp(2.1),
    backgroundColor: '#fff',
  },
  selectedRow: {
    backgroundColor: Colors.primary + '10',
    borderRadius: 8,
  },
  lastRow: {
    marginBottom: 0,
  },
  contactSeparator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 40, 
  },
  languageInfo: {
    flex: 1,
    marginLeft: 4,
  },
  languageName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  languageCode: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 10,
    color: Colors.textSecondary,
    fontSize: 16,
  },
};