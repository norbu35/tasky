import enTranslation from '../../src/locales/en/translation.json';
import mnTranslation from '../../src/locales/mn/translation.json';

type Language = 'en' | 'mn';
type TranslationDictionary = Record<string, unknown>;

const translations: Record<Language, TranslationDictionary> = {
  en: enTranslation as TranslationDictionary,
  mn: mnTranslation as TranslationDictionary,
};

let currentLanguage: Language = 'en';

function resolveLanguage(language?: string): Language {
  return language?.toLowerCase().startsWith('mn') ? 'mn' : 'en';
}

function lookupTranslation(key: string): string | undefined {
  const dictionary = translations[currentLanguage];
  const directValue = dictionary[key];

  if (typeof directValue === 'string') {
    return directValue;
  }

  const nestedValue = key.split('.').reduce<unknown>((value, part) => {
    if (!value || typeof value !== 'object') {
      return undefined;
    }

    return (value as TranslationDictionary)[part];
  }, dictionary);

  return typeof nestedValue === 'string' ? nestedValue : undefined;
}

function interpolate(template: string, values?: Record<string, unknown>): string {
  if (!values) {
    return template;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = values[key];
    return value == null ? '' : String(value);
  });
}

function translate(
  key: string,
  fallbackOrOptions?: string | Record<string, unknown>,
  maybeOptions?: Record<string, unknown>,
): string {
  const fallback = typeof fallbackOrOptions === 'string' ? fallbackOrOptions : undefined;
  const options =
    typeof fallbackOrOptions === 'object' && fallbackOrOptions !== null
      ? fallbackOrOptions
      : maybeOptions;

  const translation = lookupTranslation(key);

  if (translation) {
    return interpolate(translation, options);
  }

  if (fallback) {
    return interpolate(fallback, options);
  }

  return key;
}

const i18n = {
  get language(): Language {
    return currentLanguage;
  },
  get resolvedLanguage(): Language {
    return currentLanguage;
  },
  async changeLanguage(language: string) {
    currentLanguage = resolveLanguage(language);
  },
};

export function createReactI18nextMock(initialLanguage: string = 'en') {
  currentLanguage = resolveLanguage(initialLanguage);

  return {
    initReactI18next: {
      type: '3rdParty',
      init: () => {},
    },
    useTranslation: () => ({
      t: translate,
      i18n,
    }),
  };
}

export function resetTestI18n() {
  currentLanguage = 'en';
}

export function setTestLanguage(language: string) {
  currentLanguage = resolveLanguage(language);
}
