import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { isRTL } from '../utils/rtl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAppLanguage, getAppLanguage } from '../utils/setupLanguage';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children, onLanguageChange }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'ps');
  const [selectedLang, setSelectedLang] = useState(null);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [needsRestart, setNeedsRestart] = useState(false);


  const LANGS = [
    { label: "English", value: "english", code: "en", flag: "https://flagcdn.com/w20/gb.png" },
    { label: "دری", value: "dari", code: "dr", flag: "https://flagcdn.com/w20/af.png" },
    { label: "پشتو", value: "pashto", code: "ps", flag: "https://flagcdn.com/w20/af.png" },
  ];

  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        const langCode = await getAppLanguage();
        const langData = LANGS.find(lang => lang.code === langCode) || LANGS[0];
        
        setSelectedLang(langData);
        setCurrentLanguage(langCode);
        setIsInitialized(true);
        
        console.log("Language initialized:", langCode);
      } catch (error) {
        console.error('Error initializing language:', error);
        const defaultLang = LANGS[0];
        setSelectedLang(defaultLang);
        setCurrentLanguage(defaultLang.code);
        setIsInitialized(true);
      }
    };

    initializeLanguage();
  }, []);

  const resetRestart = useCallback(() => {
    setNeedsRestart(false);
  }, []);


const changeLanguage = useCallback(async (lang) => {
  if (isChangingLanguage) return false;
  
  setIsChangingLanguage(true);
  try {
    const previousRTL = isRTL(currentLanguage);
    const newRTL = isRTL(lang.code);

    const result = await setAppLanguage(lang.code);
    if (result && result.success) {
      setSelectedLang(lang);
      setCurrentLanguage(lang.code);
      
      await AsyncStorage.setItem('userLanguage', JSON.stringify(lang));
      
      // Only force restart if RTL actually changes
      if (previousRTL !== newRTL) {
        setNeedsRestart(true);
        if (onLanguageChange) {
          onLanguageChange(lang.code, true);
        }
        return true;
      } else {
        setNeedsRestart(false);
        if (onLanguageChange) {
          onLanguageChange(lang.code, false);
        }
      }
    }
    return result ? result.success : false;
  } catch (error) {
    console.error('Error in changeLanguage:', error);
    setNeedsRestart(false);
    return false;
  } finally {
    setIsChangingLanguage(false);
  }
}, [isChangingLanguage, currentLanguage, onLanguageChange]);
  const value = {
    currentLanguage,
    selectedLang,
    isRTL: isRTL(currentLanguage),
    LANGS,
    changeLanguage,
    setSelectedLang,
    isChangingLanguage,
    needsRestart,
    resetRestart
  };

  if (!isInitialized) {
    return null;
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};