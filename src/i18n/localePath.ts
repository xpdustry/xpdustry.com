import gtConfig from "../../gt.config.json" with { type: "json" };

const PREFIX = new RegExp(`^/(${gtConfig.locales.join("|")})(?=/|$)`);

/** The locale a public path is prefixed with, if any: `/fr/blog` is `fr`. */
export function pathLocale(pathname: string): string | undefined {
  return PREFIX.exec(pathname)?.[1];
}

/** A public path as the route tree knows it: `/fr/blog` is `/blog`. */
export function withoutLocale(pathname: string): string {
  return pathname.replace(PREFIX, "") || "/";
}

/** A route's path as `locale` visits it; the default locale's stays as it is. */
export function withLocale(pathname: string, locale: string): string {
  const bare = withoutLocale(pathname);
  if (locale === gtConfig.defaultLocale || !gtConfig.locales.includes(locale)) return bare;
  return bare === "/" ? `/${locale}` : `/${locale}${bare}`;
}
