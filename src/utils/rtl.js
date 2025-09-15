import { I18nManager } from 'react-native';

/**
 * Determines if a language is RTL
 * @param {string} languageCode 
 * @returns {boolean}
 */
export const isRTL = (languageCode) => {
  return languageCode === 'ps' || languageCode === 'dr';
};

/**
 * Applies RTL settings to the app
 * @param {string} languageCode 
 * @returns {boolean} whether RTL was changed
 */
export const applyRTLSettings = (languageCode) => {
  const shouldBeRTL = isRTL(languageCode);
  
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
    return true; // RTL was changed
  }
  
  return false; // RTL was not changed
};