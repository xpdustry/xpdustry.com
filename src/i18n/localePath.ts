import { DEFAULT_LOCALE, LOCALES } from "./locales.ts";

const PREFIX = new RegExp(
  `^/(${LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).join("|")})(?=/|$)`
);

export function pathLocale(pathname: string): string | undefined {
  return PREFIX.exec(pathname)?.[1];
}

export function withoutLocale(pathname: string): string {
  return pathname.replace(PREFIX, "") || "/";
}

export function withLocale(pathname: string, locale: string): string {
  const bare = withoutLocale(pathname);
  if (locale === DEFAULT_LOCALE || !LOCALES.includes(locale)) return bare;
  return bare === "/" ? `/${locale}` : `/${locale}${bare}`;
}
