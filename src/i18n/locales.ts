import gtConfig from "../../gt.config.json" with { type: "json" };

export const DEFAULT_LOCALE = gtConfig.defaultLocale;

export const LOCALES: readonly string[] = [DEFAULT_LOCALE, ...gtConfig.locales];

interface LocaleInfo {
  name: string;
  formatTag: string;
  openGraph: string;
}

const INFO: Record<string, LocaleInfo> = {
  en: { name: "English", formatTag: "en-GB", openGraph: "en_US" },
  fr: { name: "Français", formatTag: "fr-FR", openGraph: "fr_FR" },
  ru: { name: "Русский", formatTag: "ru-RU", openGraph: "ru_RU" }
};

export function localeInfo(locale: string): LocaleInfo {
  return INFO[locale] ?? INFO[DEFAULT_LOCALE]!;
}
