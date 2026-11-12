// Pinned locale and time zone, so the server and the browser render the same dates.

const LONG = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const SHORT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "7 October 2026" */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : LONG.format(date);
}

/** "07 Oct 2026" */
export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : SHORT.format(date);
}

/** A release tag as a version: "v4.0.0-beta.11" reads "4.0.0-beta.11". */
export function versionOf(tag: string): string {
  return tag.replace(/^v(?=\d)/, "");
}
