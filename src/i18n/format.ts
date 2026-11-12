import { DEFAULT_LOCALE, localeInfo } from "./locales";

const cached = <Format>(create: (tag: string) => Format) => {
  const formats = new Map<string, Format>();
  return (locale: string) => {
    const tag = localeInfo(locale).format;
    let format = formats.get(tag);
    if (!format) formats.set(tag, (format = create(tag)));
    return format;
  };
};

// Pinned to UTC, so the server and the browser render the same dates.
const long = cached(
  (tag) =>
    new Intl.DateTimeFormat(tag, {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC"
    })
);
const short = cached(
  (tag) =>
    new Intl.DateTimeFormat(tag, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC"
    })
);
const number = cached((tag) => new Intl.NumberFormat(tag));

export function formatDate(iso: string, locale: string = DEFAULT_LOCALE): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : long(locale).format(date);
}

export function formatShortDate(iso: string, locale: string = DEFAULT_LOCALE): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : short(locale).format(date);
}

export function formatNumber(value: number, locale: string = DEFAULT_LOCALE): string {
  return number(locale).format(value);
}

/** A release tag as a version: "v4.0.0-beta.11" reads "4.0.0-beta.11". */
export function versionOf(tag: string): string {
  return tag.replace(/^v(?=\d)/, "");
}
