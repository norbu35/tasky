import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from '../locales/en/translation.json';
import mnTranslation from '../locales/mn/translation.json';

const resources = {
  en: { mapping: enTranslation },
  mn: { mapping: mnTranslation },
};

// Default to English for testability; switch to 'mn' for production builds
const fallbackLng = 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: resources.en.mapping },
    mn: { translation: resources.mn.mapping },
  },
  lng: fallbackLng,
  fallbackLng,
  interpolation: {
    escapeValue: false, // React Native handles cross-site scripting
  },
  compatibilityJSON: 'v4', // Essential for older react-native hermes engines
});

export default i18n;
