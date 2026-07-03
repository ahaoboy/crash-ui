import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { formatTimeFromNow } from "@/utils/format";
import en from "./locales/en.json";

// Minimal setup: only English ships out-of-the-box so the bundle stays tiny.
// Additional locales can be added as separate files and registered here.
const resources = {
  en: { translation: en },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    // react-i18next escapes by default, so dangerousHTML would be opt-in. The
    // time-fromNow formatter is separate; we expose it via i18n.services.
    escapeValue: false,
  },
  returnNull: false,
});

// Expose time-from-now inside templates: t(time, { fromNow }) => relative.
i18n.services.formatter?.add("fromNow", (value: number | string, lng?: string) =>
  formatTimeFromNow(value, lng),
);

export default i18n;
