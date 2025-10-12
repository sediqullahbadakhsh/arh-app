import { I18nManager } from "react-native";
import { setLocalStorage, getLocalStorage } from "./storage";
import i18n, { initI18n } from "../locales/i18n";
import { isRTL } from "./rtl"; 

/**
 * @param {string} lang 
 */
export const setAppLanguage = async (lang) => {
  try {
    console.log("Setting app language to:", lang);
    
    const previousRTL = isRTL(i18n.language);
    const newRTL = isRTL(lang);


    await setLocalStorage("lang", lang);

  
    if (i18n.isInitialized) {
      await i18n.changeLanguage(lang);
    }

    console.log("App language changed to", lang, "with RTL:", newRTL);
    return { success: true, rtlChanged: previousRTL !== newRTL };
  } catch (error) {
    console.error("Error in setAppLanguage:", error);
    throw error;
  }
};


export const getAppLanguage = async () => {
  try {
    const lang = await getLocalStorage("lang");
    return lang || 'en'; 
  } catch (error) {
    console.error("Error getting app language:", error);
    return 'en'; 
  }
};


export const isCurrentLanguageRTL = () => {
  return isRTL(i18n.language);
};