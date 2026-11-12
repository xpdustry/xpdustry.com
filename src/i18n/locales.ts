import gtConfig from "../../gt.config.json" with { type: "json" };

export const DEFAULT_LOCALE = gtConfig.defaultLocale;

/** Every locale the site is served in, the default first. */
export const LOCALES: readonly string[] = [DEFAULT_LOCALE, ...gtConfig.locales];

interface LocaleInfo {
  /** The language's own name for itself, as the switcher lists it. */
  name: string;
  /** The BCP 47 tag dates and numbers are formatted for. */
  format: string;
  /** Open Graph's `language_TERRITORY`. */
  openGraph: string;
}

const INFO: Record<string, LocaleInfo> = {
  en: { name: "English", format: "en-GB", openGraph: "en_US" },
  fr: { name: "Français", format: "fr-FR", openGraph: "fr_FR" },
  ru: { name: "Русский", format: "ru-RU", openGraph: "ru_RU" },
};

export function localeInfo(locale: string): LocaleInfo {
  return INFO[locale] ?? INFO[DEFAULT_LOCALE]!;
}
