import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import enTranslation from '../locales/en/translation.json';
import mnTranslation from '../locales/mn/translation.json';

const resources = {
  en: {
    translation: enTranslation,
  },
  mn: {
    translation: mnTranslation,
  },
};

const normalizeLanguage = (language: string | undefined): 'en' | 'mn' => {
  const baseLanguage = language?.toLowerCase().split('-')[0];
  return baseLanguage === 'en' || baseLanguage === 'mn' ? baseLanguage : 'mn';
};

const fallbackLanguage = normalizeLanguage(
  import.meta.env['VITE_DEFAULT_LOCALE'] as string | undefined,
);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: ['en', 'mn'],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    fallbackLng: fallbackLanguage,
    detection: {
      // order: User toggle (localStorage) -> Browser settings (navigator)
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'tasky-locale',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
    react: {
      // Disable Suspense mode — app doesn't use <Suspense> for translations.
      // react-i18next@17 defaults useSuspense:true in React 19 environments;
      // without this, components re-render-suspend after async state updates.
      useSuspense: false,
    },
  });

export default i18n;
