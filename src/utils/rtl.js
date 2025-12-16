import { I18nManager } from 'react-native';

/**
 * @param {string} languageCode 
 * @returns {boolean} 
 */
export const isRTL = (languageCode) => {
  return languageCode === 'ps' || languageCode === 'dr';
};

/**
 * Apply RTL settings synchronously and persistently
 */
export const applyRTLSettings = (languageCode) => {
  try {
    const shouldBeRTL = isRTL(languageCode);
    
    // Check if we need to change anything
    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.allowRTL(shouldBeRTL);
      I18nManager.forceRTL(shouldBeRTL);
      
      // Force layout update
      if (Platform.OS === 'android') {
        // On Android, we need to force RN to pick up RTL changes
        const reactTag = findNodeHandle(AppState.currentState);
        if (reactTag) {
          UIManager.setLayoutAnimationEnabledExperimental &&
            UIManager.setLayoutAnimationEnabledExperimental(true);
          LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        }
      }
      
      console.log(`RTL settings applied: ${shouldBeRTL ? 'RTL' : 'LTR'} (was ${I18nManager.isRTL ? 'RTL' : 'LTR'})`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error applying RTL settings:', error);
    return false;
  }
};

/**
 * Ensure RTL is properly initialized
 */
export const initializeRTL = async (languageCode) => {
  try {
    // First, ensure RTL is allowed
    I18nManager.allowRTL(true);
    
    // Then apply specific RTL setting
    const shouldBeRTL = isRTL(languageCode);
    I18nManager.forceRTL(shouldBeRTL);
    
    // Store in AsyncStorage for persistence
    await AsyncStorage.setItem('app_rtl_setting', JSON.stringify(shouldBeRTL));
    
    console.log(`RTL initialized to: ${shouldBeRTL ? 'RTL' : 'LTR'}`);
    return shouldBeRTL;
  } catch (error) {
    console.error('Error initializing RTL:', error);
    return false;
  }
};

/**
 * Get persisted RTL setting
 */
export const getPersistedRTLSetting = async () => {
  try {
    const setting = await AsyncStorage.getItem('app_rtl_setting');
    return setting !== null ? JSON.parse(setting) : null;
  } catch (error) {
    console.error('Error getting persisted RTL:', error);
    return null;
  }
};