import { I18nManager } from "react-native";
import * as Updates from "expo-updates";
import { setLocalStorage } from "./storage";
import i18n from "../locales/i18n";
import { isRTL, applyRTLSettings } from "./rtl"; // Add this import

export const setAppLanguage = async (lang) => {
  // Save language in storage
  await setLocalStorage("lang", lang);

  // Change i18n language
  i18n.changeLanguage(lang);

  // Apply RTL settings
  const rtlChanged = applyRTLSettings(lang);
  
  console.log("App language changed to", lang, "with RTL:", isRTL(lang));

  // Only reload if RTL actually changed
  if (rtlChanged) {
    // Give a moment for the state to update before reloading
    setTimeout(async () => {
      await Updates.reloadAsync();
    }, 100);
  }
};