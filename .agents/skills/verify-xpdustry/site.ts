/** What every command knows about the site: where it is deployed and the languages it speaks. */

export const ORIGIN = "https://xpdustry.com";
export const LOCALES = ["en", "fr", "ru"];
export const ENGLISH = { "accept-language": "en" };

/** `path` in `locale`: the default language has no prefix. */
export function localised(locale: string, path: string): string {
  const prefix = locale === LOCALES[0] ? "" : `/${locale}`;
  return path === "/" ? prefix || "/" : prefix + path;
}

/** The language a site path is in. */
export function localeOf(path: string): string {
  return (
    LOCALES.slice(1).find((locale) => path === `/${locale}` || path.startsWith(`/${locale}/`)) ??
    LOCALES[0]!
  );
}
