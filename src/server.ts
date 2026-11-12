import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { pathLocale, withoutLocale } from "#app/i18n/localePath";
import { DEFAULT_LOCALE } from "#app/i18n/locales";
import { requestRedirect } from "#app/seo/server/redirects";
import { unknownServerFunction } from "#app/shell/server/serverFunctions";
import { startServices } from "#app/status/server/services";

startServices();

/**
 * Responses a shared cache keeps under their URL alone: social cards, the sitemap and the API. They
 * must come out the same for every visitor, so nothing a visitor sends reaches them.
 */
function isShared(pathname: string): boolean {
  const path = withoutLocale(pathname);
  return path.startsWith("/og/") || path.startsWith("/api/") || path === "/sitemap.xml";
}

/** The only cookie the server reads: the language a visitor chose, for unprefixed pages. */
const LOCALE_COOKIE = "generaltranslation.locale";

function keepOnlyLocaleCookie(request: Request): void {
  const cookies = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((cookie) => cookie.trim())
    .filter((cookie) => cookie.startsWith(`${LOCALE_COOKIE}=`));
  if (cookies.length > 0) request.headers.set("cookie", cookies.join("; "));
  else request.headers.delete("cookie");
}

function forgetVisitor(request: Request): void {
  request.headers.delete("cookie");
  request.headers.set("accept-language", DEFAULT_LOCALE);
}

function askForDefaultLanguageWhenNoneStated(request: Request): void {
  if (!request.headers.has("accept-language")) {
    request.headers.set("accept-language", DEFAULT_LOCALE);
  }
}

/**
 * A link followed within the site to an unprefixed page is a choice of English: every link on a
 * translated page carries its prefix except the switch to English. Reading the browser's own
 * account of the navigation lets that choice hold without scripts and with cookies blocked, where a
 * stored French or Russian preference would send the visitor straight back.
 */
function choseEnglish(request: Request): boolean {
  return (
    request.headers.get("sec-fetch-site") === "same-origin" &&
    request.headers.get("sec-fetch-mode") === "navigate"
  );
}

function askForEnglish(request: Request): void {
  request.headers.set("cookie", `${LOCALE_COOKIE}=${DEFAULT_LOCALE}`);
  request.headers.set("accept-language", DEFAULT_LOCALE);
}

function withHeaders(response: Response, edit: (headers: Headers) => void): Response {
  const headers = new Headers(response.headers);
  edit(headers);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default createServerEntry({
  async fetch(request, opts) {
    const early = requestRedirect(request) ?? unknownServerFunction(request);
    if (early) return early;

    const { pathname } = new URL(request.url);
    if (isShared(pathname)) {
      forgetVisitor(request);
      const response = await handler.fetch(request, opts);
      return withHeaders(response, (headers) => headers.delete("set-cookie"));
    }

    keepOnlyLocaleCookie(request);
    askForDefaultLanguageWhenNoneStated(request);
    if (!pathLocale(pathname) && choseEnglish(request)) askForEnglish(request);
    const response = await handler.fetch(request, opts);
    if (pathLocale(pathname) || response.headers.has("cache-control")) return response;

    // An unprefixed page is English or a redirect to the visitor's language, chosen per visitor.
    return withHeaders(response, (headers) => {
      headers.set("cache-control", "private, no-cache");
      headers.append("vary", "accept-language, cookie, sec-fetch-site");
    });
  }
});
