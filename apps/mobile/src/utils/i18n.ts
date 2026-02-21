import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import enTranslation from "../locales/en/translation.json";
import mnTranslation from "../locales/mn/translation.json";

const resources = {
    en: {mapping: enTranslation},
    mn: {mapping: mnTranslation},
};

// Fallback to Mongolian if no compatible system language is found
const fallbackLng = "mn";

// Get system locales from the device
const systemLocales = Localization.getLocales();
const detectedLanguageCode = systemLocales[0]?.languageTag?.split("-")[0] || fallbackLng;

// Verify if the detected locale is supported by our dictionary
const initialLng = Object.keys(resources).includes(detectedLanguageCode)
    ? detectedLanguageCode
    : fallbackLng;

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: {translation: resources.en.mapping},
            mn: {translation: resources.mn.mapping},
        },
        lng: initialLng,
        fallbackLng,
        interpolation: {
            escapeValue: false, // React Native handles cross-site scripting
        },
        compatibilityJSON: "v4", // Essential for older react-native hermes engines
    });

export default i18n;
