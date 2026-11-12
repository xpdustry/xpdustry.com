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

/**
 * Strips a page request down to what can choose its language: the language cookie and the
 * browser's languages, which default to English when the browser states none.
 */
function keepOnlyLanguageHints(request: Request): void {
  const cookies = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((cookie) => cookie.trim())
    .filter((cookie) => cookie.startsWith(`${LOCALE_COOKIE}=`));
  if (cookies.length > 0) request.headers.set("cookie", cookies.join("; "));
  else request.headers.delete("cookie");
  if (!request.headers.has("accept-language")) {
    request.headers.set("accept-language", DEFAULT_LOCALE);
  }
}

function forgetVisitor(request: Request): void {
  request.headers.delete("cookie");
  request.headers.set("accept-language", DEFAULT_LOCALE);
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

type FetchOptions = Parameters<typeof handler.fetch>[1];

async function serveShared(request: Request, opts: FetchOptions): Promise<Response> {
  forgetVisitor(request);
  const response = await handler.fetch(request, opts);
  return withHeaders(response, (headers) => headers.delete("set-cookie"));
}

async function servePrefixed(request: Request, opts: FetchOptions): Promise<Response> {
  keepOnlyLanguageHints(request);
  return await handler.fetch(request, opts);
}

/** An unprefixed page is English or a redirect to the visitor's language, chosen per visitor. */
async function serveUnprefixed(request: Request, opts: FetchOptions): Promise<Response> {
  keepOnlyLanguageHints(request);
  if (choseEnglish(request)) askForEnglish(request);
  const response = await handler.fetch(request, opts);
  if (response.headers.has("cache-control")) return response;
  return withHeaders(response, (headers) => {
    headers.set("cache-control", "private, no-cache");
    headers.append("vary", "accept-language, cookie, sec-fetch-site");
  });
}

function serverFor(pathname: string) {
  if (isShared(pathname)) return serveShared;
  if (pathLocale(pathname)) return servePrefixed;
  return serveUnprefixed;
}

export default createServerEntry({
  async fetch(request, opts) {
    const early = requestRedirect(request) ?? unknownServerFunction(request);
    if (early) return early;
    return serverFor(new URL(request.url).pathname)(request, opts);
  }
});
