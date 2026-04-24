import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from '../locales/en/translation.json';
import mnTranslation from '../locales/mn/translation.json';

export const USER_LANGUAGE_STORAGE_KEY = 'user-language';

export type AppLanguage = 'en' | 'mn';

const resources = {
  en: { mapping: enTranslation },
  mn: { mapping: mnTranslation },
};

const normalizeLanguage = (language: string | undefined): AppLanguage => {
  const baseLanguage = language?.toLowerCase().split('-')[0];
  return baseLanguage === 'en' ? 'en' : 'mn';
};

const fallbackLanguage: AppLanguage = normalizeLanguage(
  process?.env?.['EXPO_PUBLIC_DEFAULT_LOCALE'] ?? process?.env?.['DEFAULT_LOCALE'] ?? 'mn',
);

export async function getStoredLanguage(): Promise<AppLanguage> {
  try {
    const value = await AsyncStorage.getItem(USER_LANGUAGE_STORAGE_KEY);
    return normalizeLanguage(value ?? undefined);
  } catch {
    return fallbackLanguage;
  }
}

export async function setStoredLanguage(language: string): Promise<void> {
  const normalized = normalizeLanguage(language);
  try {
    await AsyncStorage.setItem(USER_LANGUAGE_STORAGE_KEY, normalized);
  } catch {
    // AsyncStorage failures should not block runtime startup.
  }
}

export async function initializeI18n(): Promise<void> {
  const language = await getStoredLanguage();
  if (i18n.resolvedLanguage !== language) {
    await i18n.changeLanguage(language);
  }
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: resources.en.mapping },
    mn: { translation: resources.mn.mapping },
  },
  lng: fallbackLanguage,
  fallbackLng: fallbackLanguage,
  interpolation: {
    escapeValue: false, // React Native handles cross-site scripting
  },
  compatibilityJSON: 'v4', // Essential for older react-native hermes engines
});

export default i18n;
