import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './english/en.json';
import dr from './dari/dr.json';
import ps from './pashto/ps.json';
import { getLocalStorage } from '../utils/storage';
import { applyRTLSettings } from '../utils/rtl';


const initializeI18n = async () => {
  let language = 'ps'; 

  try {
    const storedLang = await getLocalStorage('lang');
    if (storedLang) {
      language = storedLang;
    } else if (Localization.getLocales().length) {
      language = Localization.getLocales()[0].languageCode;
    }
  } catch (e) {
    console.log('Error loading language from storage', e);
  }

  applyRTLSettings(language);


  return i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      lng: language,
      fallbackLng: 'ps',
      resources: {
        en: { translation: en },
        dr: { translation: dr },
        ps: { translation: ps },
      },
      interpolation: { 
        escapeValue: false 
      },
      react: {
        useSuspense: false
      }
    });
};


let isInitialized = false;

export const initI18n = async () => {
  if (!isInitialized) {
    await initializeI18n();
    isInitialized = true;
  }
  return i18n.language;
};


export default i18n;