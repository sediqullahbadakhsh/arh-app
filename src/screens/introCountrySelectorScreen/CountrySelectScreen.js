import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Animated,
  Dimensions,
  Image
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { COUNTRIES } from "../../constants/countries";
import { codeToFlag } from "../../utils/flag";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../context/LanguageContext";
import { DIAL_CODES } from "../../constants/dialing";

const { height: screenHeight } = Dimensions.get('window');

export default function CountrySelectScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { selectedLang, LANGS, changeLanguage } = useLanguage();
  
  const [booting, setBooting] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  
  // Modal states
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use useRef for animations to prevent recreation
  const countryModalAnim = useRef(new Animated.Value(screenHeight)).current;
  const languageModalAnim = useRef(new Animated.Value(screenHeight)).current;

  useEffect(() => {
    (async () => {
      try {
        const cc = await AsyncStorage.getItem("countryCode");
        if (cc) {
          navigation.replace("Onboarding");
          return;
        }
      } catch {}
      setBooting(false);
    })();
  }, [navigation]);

  // Set default language on mount
  useEffect(() => {
    if (LANGS && LANGS.length > 0 && !selectedLanguage) {
      setSelectedLanguage(selectedLang || LANGS[0]);
    }
  }, [LANGS, selectedLang]);

  // Country modal animation
  useEffect(() => {
    if (countryModalVisible) {
      Animated.timing(countryModalAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(countryModalAnim, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }).start();
      setSearchQuery('');
    }
  }, [countryModalVisible]);

  // Language modal animation
  useEffect(() => {
    if (languageModalVisible) {
      Animated.timing(languageModalAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(languageModalAnim, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }).start();
      setSearchQuery('');
    }
  }, [languageModalVisible]);

  const onContinue = useCallback(async () => {
    if (!selectedCountry || !selectedLanguage) return;
    
    try {
      // Save country code
      await AsyncStorage.setItem("countryCode", selectedCountry.code);
      
      // Change app language
      if (selectedLanguage) {
        await changeLanguage(selectedLanguage);
      }
      
      navigation.replace("Onboarding");
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }, [selectedCountry, selectedLanguage, navigation, changeLanguage]);

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return COUNTRIES || [];
    return (COUNTRIES || []).filter(country =>
      country.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.code?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const filteredLanguages = useMemo(() => {
    if (!searchQuery) return LANGS || [];
    return (LANGS || []).filter(lang =>
      lang.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.value?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, LANGS]);

  const renderCountryItem = useCallback(({ item, index }) => {
    const active = selectedCountry?.code === item.code;
    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedCountry(item);
          setCountryModalVisible(false);
        }}
        activeOpacity={0.8}
        style={[
          styles.modalRow,
          index === 0 && styles.modalRowFirst,
          index === filteredCountries.length - 1 && styles.modalRowLast,
        ]}
      >
        <Text style={styles.flag}>{codeToFlag(item.code)}</Text>
        <View style={styles.countryInfo}>
          <Text style={styles.countryName}>{item.name}</Text>
          <Text style={styles.dialCode}>{DIAL_CODES[item.code] || ''}</Text>
        </View>
        {active && (
          <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
        )}
      </TouchableOpacity>
    );
  }, [selectedCountry, filteredCountries.length]);

  const renderLanguageItem = useCallback(({ item, index }) => {
    const active = selectedLanguage?.code === item.code;
    
    const renderFlag = () => {
      if (!item?.flag) {
        return (
          <View style={styles.flagPlaceholder} />
        );
      }
      return (
        <Image
          source={{ uri: item.flag }}
          style={styles.languageFlag}
          resizeMode="contain"
        />
      );
    };

    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedLanguage(item);
          setLanguageModalVisible(false);
        }}
        activeOpacity={0.8}
        style={[
          styles.modalRow,
          index === 0 && styles.modalRowFirst,
          index === filteredLanguages.length - 1 && styles.modalRowLast,
        ]}
      >
        {renderFlag()}
        <View style={styles.languageInfo}>
          <Text style={styles.languageName}>{item.label}</Text>
          <Text style={styles.languageCode}>{(item.code || item.value).toUpperCase()}</Text>
        </View>
        {active && (
          <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
        )}
      </TouchableOpacity>
    );
  }, [selectedLanguage, filteredLanguages.length]);

  const CountryModal = () => (
    <Modal
      visible={countryModalVisible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={() => setCountryModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setCountryModalVisible(false)}
        />
        <Animated.View 
          style={[
            styles.modalCard,
            { 
              transform: [{ translateY: countryModalAnim }],
              maxHeight: '80%',
              marginBottom: -insets.bottom
            }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('selectCountry')}</Text>
            <TouchableOpacity 
              onPress={() => setCountryModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              placeholder={t('searchCountries') || "Search countries..."}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              placeholderTextColor="#999"
            />
          </View>

          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            renderItem={renderCountryItem}
            ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>
      </View>
    </Modal>
  );

  const LanguageModal = () => (
    <Modal
      visible={languageModalVisible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={() => setLanguageModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setLanguageModalVisible(false)}
        />
        <Animated.View 
          style={[
            styles.modalCard,
            { 
              transform: [{ translateY: languageModalAnim }],
              maxHeight: '70%',
              marginBottom: -insets.bottom
            }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('selectLanguage') || "Select Language"}</Text>
            <TouchableOpacity 
              onPress={() => setLanguageModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              placeholder={t('searchLanguages') || "Search languages..."}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              placeholderTextColor="#999"
            />
          </View>

          <FlatList
            data={filteredLanguages}
            keyExtractor={(item) => item.code || item.value || Math.random().toString()}
            renderItem={renderLanguageItem}
            ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>
      </View>
    </Modal>
  );

  if (booting) {
    return (
      <LinearGradient
        colors={GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.full}
      >
        <ActivityIndicator color="#fff" size="large" />
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
      <LinearGradient
        colors={GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.full}
      >
        <View
          style={[
            styles.content,
            {
              paddingTop: insets.top + 60,
              paddingBottom: 22,
              paddingHorizontal: 24,
            },
          ]}
        >
          <Text style={styles.title}>{t("welcome") || "Welcome"}</Text>
          <Text style={styles.subtitle}>
            {t("selectPreferences") || "Select your preferences to get started"}
          </Text>

          {/* Country Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('country') || "Country"}</Text>
            <TouchableOpacity
              style={styles.selectionField}
              onPress={() => setCountryModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.selectionContent}>
                {selectedCountry ? (
                  <>
                    <Text style={styles.fieldFlag}>{codeToFlag(selectedCountry.code)}</Text>
                    <View style={styles.fieldInfo}>
                      <Text style={styles.fieldPrimary}>{selectedCountry.name}</Text>
                      <Text style={styles.fieldSecondary}>{DIAL_CODES[selectedCountry.code] || ''}</Text>
                    </View>
                  </>
                ) : (
                  <Text style={styles.placeholder}>{t('selectCountry') || "Select Country"}</Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>

          {/* Language Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('language') || "Language"}</Text>
            <TouchableOpacity
              style={styles.selectionField}
              onPress={() => setLanguageModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.selectionContent}>
                {selectedLanguage ? (
                  <>
                    {selectedLanguage?.flag ? (
                      <Image
                        source={{ uri: selectedLanguage.flag }}
                        style={styles.languageFlagSmall}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.flagPlaceholderSmall} />
                    )}
                    <View style={styles.fieldInfo}>
                      <Text style={styles.fieldPrimary}>{selectedLanguage.label}</Text>
                      <Text style={styles.fieldSecondary}>
                        {(selectedLanguage.code || selectedLanguage.value).toUpperCase()}
                      </Text>
                    </View>
                  </>
                ) : (
                  <Text style={styles.placeholder}>{t('selectLanguage') || "Select Language"}</Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Continue Button */}
        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + 24, paddingHorizontal: 24 },
          ]}
        >
          <TouchableOpacity
            disabled={!selectedCountry || !selectedLanguage}
            onPress={onContinue}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={selectedCountry && selectedLanguage ? CTA_GRADIENT : DISABLED_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>{t("continue") || "Continue"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Modals */}
        <CountryModal />
        <LanguageModal />
      </LinearGradient>
    </SafeAreaView>
  );
}

const GRADIENT = ["#D70000", "#E52421", "#F0533F"];
const CTA_GRADIENT = ["#F6B12A", "#E59A12"];
const DISABLED_GRADIENT = ["#CCCCCC", "#999999"];
const MODAL_RADIUS = 25;

const styles = StyleSheet.create({
  full: { flex: 1 },
  content: {
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 48,
    fontWeight: "500",
  },
  section: {
    width: '100%',
    marginBottom: 24,
  },
  sectionLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
  },
  selectionField: {
    height: 70,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  selectionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  fieldFlag: {
    fontSize: 28,
    marginRight: 12,
  },
  fieldInfo: {
    flex: 1,
  },
  fieldPrimary: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  fieldSecondary: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "500",
  },
  placeholder: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    fontWeight: "500",
  },
  languageFlagSmall: {
    width: 28,
    height: 21,
    marginRight: 12,
    borderRadius: 4,
  },
  flagPlaceholderSmall: {
    width: 28,
    height: 21,
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
  },
  footer: {
    paddingTop: 20,
  },
  cta: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  // Modal Styles
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
    borderTopLeftRadius: MODAL_RADIUS,
    borderTopRightRadius: MODAL_RADIUS,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
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
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
  },
  modalRowFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalRowLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  modalSeparator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 44,
  },
  flag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  dialCode: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  languageFlag: {
    width: 24,
    height: 18,
    marginRight: 12,
    borderRadius: 3,
  },
  flagPlaceholder: {
    width: 24,
    height: 18,
    marginRight: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  languageCode: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});