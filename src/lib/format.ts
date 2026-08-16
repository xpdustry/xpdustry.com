/**
 * Date formatting, fixed to en-GB so the server and the browser agree.
 *
 * Letting the runtime pick a locale would render one string during SSR and a
 * different one at hydration, which shows up as a flicker on every date.
 */

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

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : LONG.format(date);
}

export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : SHORT.format(date);
}
