import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enTranslation from "./locales/en/translation.json";
import mnTranslation from "./locales/mn/translation.json";

const resources = {
    en: {
        translation: enTranslation,
    },
    mn: {
        translation: mnTranslation,
    },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: import.meta.env.VITE_DEFAULT_LOCALE || "mn", // Default to Mongolian or ENV
        detection: {
            // order: User toggle (localStorage) -> Browser settings (navigator)
            order: ["localStorage", "navigator"],
            lookupLocalStorage: "tasky-locale",
            caches: ["localStorage"],
        },
        interpolation: {
            escapeValue: false, // React already safes from xss
        },
    });

export default i18n;
