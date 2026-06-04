import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import fil from './locales/fil.json';
import es from './locales/es.json';
import ja from './locales/ja.json';
import zh from './locales/zh.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import ar from './locales/ar.json';

// Safe locale detection — wrapped in try/catch to prevent crash on some devices
let deviceLocale = 'en';
try {
  const { getLocales } = require('expo-localization');
  const locales = getLocales();
  if (locales && locales[0] && locales[0].languageCode) {
    deviceLocale = locales[0].languageCode;
  }
} catch (e) {
  // Fallback to English if expo-localization fails
  console.warn('[i18n] Failed to detect device locale:', e);
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fil: { translation: fil },
    es: { translation: es },
    ja: { translation: ja },
    zh: { translation: zh },
    fr: { translation: fr },
    de: { translation: de },
    ar: { translation: ar },
  },
  lng: deviceLocale,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18n;

export const SUPPORTED_LANGUAGES = [
  { code: 'en',  name: 'English',              nativeName: 'English' },
  { code: 'fil', name: 'Filipino',             nativeName: 'Filipino' },
  { code: 'es',  name: 'Spanish',              nativeName: 'Español' },
  { code: 'ja',  name: 'Japanese',             nativeName: '日本語' },
  { code: 'zh',  name: 'Chinese (Simplified)', nativeName: '中文' },
  { code: 'fr',  name: 'French',               nativeName: 'Français' },
  { code: 'de',  name: 'German',               nativeName: 'Deutsch' },
  { code: 'ar',  name: 'Arabic',               nativeName: 'العربية' },
];
