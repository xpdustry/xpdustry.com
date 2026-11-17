import { DEFAULT_LOCALE, localeInfo } from "./locales";

const cached = <Format>(create: (tag: string) => Format) => {
  const formats = new Map<string, Format>();
  return (locale: string) => {
    const tag = localeInfo(locale).formatTag;
    let format = formats.get(tag);
    if (!format) formats.set(tag, (format = create(tag)));
    return format;
  };
};

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

function formatIso(iso: string, format: Intl.DateTimeFormat): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : format.format(date);
}

export function formatDate(iso: string, locale: string = DEFAULT_LOCALE): string {
  return formatIso(iso, long(locale));
}

export function formatShortDate(iso: string, locale: string = DEFAULT_LOCALE): string {
  return formatIso(iso, short(locale));
}

export function formatNumber(value: number, locale: string = DEFAULT_LOCALE): string {
  return number(locale).format(value);
}

export function versionOf(tag: string): string {
  return tag.replace(/^v(?=\d)/, "");
}
