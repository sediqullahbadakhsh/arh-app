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
import { scale } from "../../utils/normalizeSize";
import { isRTL } from "../../utils/rtl";

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function CountrySelectScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { selectedLang, LANGS, changeLanguage, isChangingLanguage, needsRestart } = useLanguage();
  const [booting, setBooting] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  useEffect(() => {
    if (needsRestart) {
      setLanguageModalVisible(false);
      setSearchQuery('');
    }
  }, [needsRestart]);

  const handleLanguageChange = async (lang) => {
    if (isChangingLanguage || selectedLang?.code === lang.code) return;
    
    try {
      await changeLanguage(lang);
      // Close modal after successful language change
      setTimeout(() => {
        setLanguageModalVisible(false);
      }, 500);
    } catch (error) {
      console.error('Error changing language:', error);
      setLanguageModalVisible(false);
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
    if (!selectedLang) return;
    
    try {
      if (selectedCountry) {
        await AsyncStorage.setItem("countryCode", selectedCountry.code);
      }
      
      navigation.replace("Onboarding");
    } catch (error) {
      console.error('Error continuing:', error);
    }
  }, [navigation, selectedLang, selectedCountry]);

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
        disabled={isChangingLanguage}
        style={[
          styles.modalRow,
          index === 0 && styles.modalRowFirst,
          index === filteredLanguages.length - 1 && styles.modalRowLast,
        ]}
      >
        {renderFlag()}
        <View style={styles.languageInfo}>
          <Text style={styles.languageName}>{item.label}</Text>
        </View>
        {isChangingLanguage && active ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : active ? (
          <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
        ) : null}
      </TouchableOpacity>
    );
  }, [selectedLang, filteredLanguages.length, isChangingLanguage]);

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
              // marginBottom: -insets.bottom
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

  const LanguageModal = () => {
    const handleClose = useCallback(() => {
      if (!isChangingLanguage) {
        setLanguageModalVisible(false);
      }
    }, [isChangingLanguage]);

    return (
      <Modal
        visible={languageModalVisible}
        transparent={true}
        animationType="none"
        statusBarTranslucent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleClose}
            disabled={isChangingLanguage}
          />
          <Animated.View 
            style={[
              styles.modalCard,
              { 
                transform: [{ translateY: languageModalAnim }],
                maxHeight: '70%',
                // marginBottom: -insets.bottom
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectLanguage') || "Select Language"}</Text>
              <TouchableOpacity 
                onPress={handleClose}
                style={styles.closeButton}
                disabled={isChangingLanguage}
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
                editable={!isChangingLanguage}
              />
            </View>

            {isChangingLanguage && (
              <View style={styles.loadingOverlay}>
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.loadingText}>
                    {t("ChangingLanguage") || "Changing language..."}
                  </Text>
                </View>
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
  };

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
              disabled={isChangingLanguage}
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
                    </View>
                  </>
                ) : (
                  <Text style={styles.placeholder}>{t('selectLanguage1') || "Select Language"}</Text>
                )}
              </View>
              {isChangingLanguage ? (
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
            disabled={!selectedLang || isChangingLanguage}
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
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: scale.hp(2.5),
    paddingBottom: scale.hp(2.75),
    paddingHorizontal: scale.wp(6),
  },
  lottieContainer: {
    width: scale.wp(105),
    marginTop: scale.hp(12.5),
    height: scale.hp(35),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
  title: {
    color: '#fff',
    fontSize: scale.hp(5.25),
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: scale.hp(5),
    width: '100%',
  },
  subtitle: {
    color: '#fff',
    fontSize: scale.hp(2),
    textAlign: 'center',
    marginBottom: scale.hp(6),
    fontWeight: '500',
    opacity: 0.9,
    width: '100%',
  },
  section: {
    width: '100%',
    marginBottom: scale.hp(3),
  },
  sectionLabel: {
    color: '#fff',
    fontSize: scale.hp(2),
    fontWeight: '600',
    marginBottom: scale.hp(1),
    marginLeft: scale.wp(1),
  },
  selectionField: {
    height: scale.hp(8.75),
    borderRadius: scale.hp(2),
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: scale.wp(4),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fieldInfo: {
    flex: 1,
  },
  fieldPrimary: {
    color: '#fff',
    fontSize: scale.hp(2),
    fontWeight: '600',
    marginBottom: scale.hp(0.25),
  },
  placeholder: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: scale.hp(2),
    fontWeight: '500',
  },
  languageFlagSmall: {
    width: scale.wp(7),
    height: scale.hp(2.625),
    marginEnd: scale.wp(3), 
    borderRadius: scale.hp(0.5),
  },
  flagPlaceholderSmall: {
    width: scale.wp(7),
    height: scale.hp(2.625),
    marginEnd: scale.wp(3),
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: scale.hp(0.5),
  },
  footer: {
    paddingTop: scale.hp(2.5),
  },
  cta: {
    height: scale.hp(7),
    borderRadius: scale.hp(3.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#fff',
    fontSize: scale.hp(2.25),
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: MODAL_RADIUS,
    borderTopRightRadius: MODAL_RADIUS,
    paddingHorizontal: scale.hp(2.5),
    paddingTop: scale.hp(2.5),
    paddingBottom: scale.hp(14),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scale.hp(2),
    paddingBottom: scale.hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: scale.hp(2.5),
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: scale.hp(0.5),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: scale.hp(1.5),
    paddingHorizontal: scale.wp(4),
    marginBottom: scale.hp(2),
    height: scale.hp(6),
  },
  searchIcon: {
    marginRight: scale.wp(3),
  },
  searchInput: {
    flex: 1,
    fontSize: scale.hp(2),
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale.hp(2),
    paddingHorizontal: scale.wp(2),
    backgroundColor: '#fff',
  },
  modalRowFirst: {
    borderTopLeftRadius: scale.hp(1.5),
    borderTopRightRadius: scale.hp(1.5),
  },
  modalRowLast: {
    borderBottomLeftRadius: scale.hp(1.5),
    borderBottomRightRadius: scale.hp(1.5),
  },
  modalSeparator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: scale.wp(11),
  },
  flag: {
    fontSize: scale.hp(3),
    marginRight: scale.wp(3),
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: scale.hp(2),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scale.hp(0.25),
  },
  dialCode: {
    fontSize: scale.hp(1.75),
    color: Colors.textSecondary,
  },
  languageFlag: {
    width: scale.wp(6),
    height: scale.hp(2.25),
    marginEnd: scale.wp(3), 
    borderRadius: scale.hp(0.375),
  },
  flagPlaceholder: {
    width: scale.wp(6),
    height: scale.hp(2.25),
    marginEnd: scale.wp(3), 
    backgroundColor: '#F0F0F0',
    borderRadius: scale.hp(0.375),
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: scale.hp(2),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scale.hp(0.25),
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
});