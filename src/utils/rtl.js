import { I18nManager } from 'react-native';

/**
 * @param {string} languageCode 
 * @returns {boolean} 
 */
export const isRTL = (languageCode) => {
  return languageCode === 'ps' || languageCode === 'dr';
};

/**
 * @param {string} languageCode
 * @returns {boolean}
 */
export const applyRTLSettings = (languageCode) => {
  try {
    const shouldBeRTL = isRTL(languageCode);
    
    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.allowRTL(shouldBeRTL);
      I18nManager.forceRTL(shouldBeRTL);
      
      console.log(`RTL settings changed: ${shouldBeRTL ? 'RTL' : 'LTR'}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error applying RTL settings:', error);
    return false;
  }
};

/**
 * @returns {boolean} 
 */
export const getCurrentRTLStatus = () => {
  return I18nManager.isRTL;
};