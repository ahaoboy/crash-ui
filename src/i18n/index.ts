import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { formatTimeFromNow } from "@/utils/format";
import en from "./locales/en.json";
import cn from "./locales/cn.json";

const resources = { en: { translation: en }, cn: { translation: cn } };

function detectLang(): string {
  const stored = localStorage.getItem("crash-lang");
  if (stored === "en" || stored === "cn") return stored;
  const nav = navigator.language.toLowerCase();
  return nav.startsWith("zh") ? "cn" : "en";
}

const LANG_STORAGE_KEY = "crash-lang";

const origChange = i18n.changeLanguage.bind(i18n);
i18n.changeLanguage = (lng, ...args) => {
  localStorage.setItem(LANG_STORAGE_KEY, lng as string);
  return origChange(lng, ...args);
};

i18n.use(initReactI18next).init({
  resources,
  lng: detectLang(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  returnNull: false,
});

i18n.services.formatter?.add("fromNow", (value: number | string, lng?: string) =>
  formatTimeFromNow(value, lng),
);

export default i18n;
