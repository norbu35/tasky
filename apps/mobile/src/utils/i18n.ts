import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from '../locales/en/translation.json';
import mnTranslation from '../locales/mn/translation.json';

const resources = {
  en: { mapping: enTranslation },
  mn: { mapping: mnTranslation },
};

// Fallback to Mongolian
const fallbackLng = 'mn';

// Get user preference from AsyncStorage, or default to Mongolian
// We will initialize with 'mn' synchronously to avoid blank screens.
// The async language load is handled in the root layout if needed,
// but for now, we force 'mn' as the strict default over system locale.
const initialLng = 'mn';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: resources.en.mapping },
    mn: { translation: resources.mn.mapping },
  },
  lng: initialLng,
  fallbackLng,
  interpolation: {
    escapeValue: false, // React Native handles cross-site scripting
  },
  compatibilityJSON: 'v4', // Essential for older react-native hermes engines
});

export default i18n;
