import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import es from "./locales/es.json";
import zh from "./locales/zh.json";
import hi from "./locales/hi.json";
import ar from "./locales/ar.json";
import pt from "./locales/pt.json";
import ru from "./locales/ru.json";
import ja from "./locales/ja.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";
import it from "./locales/it.json";
import ko from "./locales/ko.json";

export const LANGUAGES = [
  { code: "en", name: "English",    flag: "🇬🇧", dir: "ltr" },
  { code: "es", name: "Español",    flag: "🇪🇸", dir: "ltr" },
  { code: "zh", name: "中文",        flag: "🇨🇳", dir: "ltr" },
  { code: "hi", name: "हिन्दी",     flag: "🇮🇳", dir: "ltr" },
  { code: "ar", name: "العربية",    flag: "🇸🇦", dir: "rtl" },
  { code: "pt", name: "Português",  flag: "🇧🇷", dir: "ltr" },
  { code: "ru", name: "Русский",    flag: "🇷🇺", dir: "ltr" },
  { code: "ja", name: "日本語",      flag: "🇯🇵", dir: "ltr" },
  { code: "fr", name: "Français",   flag: "🇫🇷", dir: "ltr" },
  { code: "de", name: "Deutsch",    flag: "🇩🇪", dir: "ltr" },
  { code: "it", name: "Italiano",   flag: "🇮🇹", dir: "ltr" },
  { code: "ko", name: "한국어",      flag: "🇰🇷", dir: "ltr" },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      zh: { translation: zh },
      hi: { translation: hi },
      ar: { translation: ar },
      pt: { translation: pt },
      ru: { translation: ru },
      ja: { translation: ja },
      fr: { translation: fr },
      de: { translation: de },
      it: { translation: it },
      ko: { translation: ko },
    },
    fallbackLng: "en",
    supportedLngs: ["en","es","zh","hi","ar","pt","ru","ja","fr","de","it","ko"],
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: "gm_lang",
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
