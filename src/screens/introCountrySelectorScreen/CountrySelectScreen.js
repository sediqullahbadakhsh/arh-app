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
import LottieView from 'lottie-react-native';
import { Colors } from "../../theme/colors";
import { COUNTRIES } from "../../constants/countries";
import { codeToFlag } from "../../utils/flag";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../context/LanguageContext";
import { DIAL_CODES } from "../../constants/dialing";

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function CountrySelectScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { selectedLang, LANGS, changeLanguage, isChangingLanguage } = useLanguage();
  
  const [booting, setBooting] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState(null);
  
  // Remove local selectedLanguage state since we're using the context
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [changingLanguage, setChangingLanguage] = useState(false);

  const countryModalAnim = useRef(new Animated.Value(screenHeight)).current;
  const languageModalAnim = useRef(new Animated.Value(screenHeight)).current;
  const lottieRef = useRef(null);

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

  const handleLanguageChange = async (lang) => {
    if (isChangingLanguage || changingLanguage) return;
    
    setChangingLanguage(true);
    try {
      const languageChanged = await changeLanguage(lang);
      
      if (!languageChanged) {
        throw new Error('Failed to change app language');
      }
      
      // Language change successful, close modal
      setLanguageModalVisible(false);
    } catch (error) {
      console.error('Error changing language:', error);
      // You might want to show an error message here
    } finally {
      setChangingLanguage(false);
    }
  };

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
    // No need to change language here since it's already handled by handleLanguageChange
    navigation.replace("Onboarding");
  }, [navigation]);

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
    const active = selectedLang?.code === item.code;
    
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
        onPress={() => handleLanguageChange(item)}
        activeOpacity={0.8}
        disabled={isChangingLanguage || changingLanguage}
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
        {(isChangingLanguage || changingLanguage) && selectedLang?.code === item.code ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : active ? (
          <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
        ) : null}
      </TouchableOpacity>
    );
  }, [selectedLang, filteredLanguages.length, isChangingLanguage, changingLanguage]);

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

          {(isChangingLanguage || changingLanguage) && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>
                {t("ChangingLanguage") || "Changing language..."}
              </Text>
            </View>
          )}

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
        start={{ x: 1, y: 0 }} 
        end={{ x: 0, y: 1 }}   
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
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}   
        style={styles.full}
      >
        <View style={styles.mainContainer}>
          <View style={styles.lottieContainer}>
            <LottieView
              ref={lottieRef}
              source={require('../../../assets/lotties/logo6.json')}
              autoPlay={true}
              loop={true}
              style={styles.lottieAnimation}
              resizeMode="contain"
            />
          </View>
             
          <Text style={styles.title}>{t("welcome") || "Welcome"}</Text>
       

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('selectLanguage1') || "Language"}</Text>
            <TouchableOpacity
              style={styles.selectionField}
              onPress={() => setLanguageModalVisible(true)}
              activeOpacity={0.8}
              disabled={isChangingLanguage || changingLanguage}
            >
              <View style={styles.selectionContent}>
                {selectedLang ? (
                  <>
                    {selectedLang?.flag ? (
                      <Image
                        source={{ uri: selectedLang.flag }}
                        style={styles.languageFlagSmall}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.flagPlaceholderSmall} />
                    )}
                    <View style={styles.fieldInfo}>
                      <Text style={styles.fieldPrimary}>{selectedLang.label}</Text>
                      <Text style={styles.fieldSecondary}>
                        {(selectedLang.code || selectedLang.value).toUpperCase()}
                      </Text>
                    </View>
                  </>
                ) : (
                  <Text style={styles.placeholder}>{t('selectLanguage1') || "Select Language"}</Text>
                )}
              </View>
              {(isChangingLanguage || changingLanguage) ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="chevron-down" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + 100, paddingHorizontal: 24 },
          ]}
        >
          <TouchableOpacity
            disabled={!selectedLang || isChangingLanguage || changingLanguage}
            onPress={onContinue}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={selectedLang ? CTA_GRADIENT : DISABLED_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>{t("continue") || "Continue"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <CountryModal />
        <LanguageModal />
      </LinearGradient>
    </SafeAreaView>
  );
}


const GRADIENT = ["#E20E02", "#9F0901"];
const CTA_GRADIENT = ["#F6B12A", "#E59A12"];
const DISABLED_GRADIENT = ["#CCCCCC", "#999999"];
const MODAL_RADIUS = 25;

const styles = StyleSheet.create({
  full: { 
    flex: 1 
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 22,
    paddingHorizontal: 24,
  },
  lottieContainer: {
    width: 420,
    marginTop: 100,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',

    alignSelf: 'center',
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
  title: {
    color: "#fff",
    fontSize: 42,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 40,
    width: '100%',
  },
  subtitle: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 48,
    fontWeight: "500",
    opacity: 0.9,
    width: '100%',
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
    color: "rgba(255,255,255,0.8)",
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

  },
  ctaText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
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
    height: "60%",
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