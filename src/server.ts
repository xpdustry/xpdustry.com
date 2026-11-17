import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { pathLocale, withoutLocale } from "#app/i18n/localePath";
import { DEFAULT_LOCALE } from "#app/i18n/locales";
import { requestRedirect } from "#app/seo/server/redirects";
import { PAINTER } from "#app/shell/painter";
import { withHeadScript } from "#app/shell/server/headScript";
import { unknownServerFunction } from "#app/shell/server/serverFunctions";
import { startServices } from "#app/status/server/services";

startServices();

const SHARED_PREFIXES = ["/og/", "/api/", "/discord/"];
const SHARED_PATHS = ["/sitemap.xml"];

function isSameForEveryVisitor(pathname: string): boolean {
  const path = withoutLocale(pathname);
  return SHARED_PREFIXES.some((prefix) => path.startsWith(prefix)) || SHARED_PATHS.includes(path);
}

const LOCALE_COOKIE = "generaltranslation.locale";

function keepOnlyLocaleCookie(request: Request): void {
  const cookies = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((cookie) => cookie.trim())
    .filter((cookie) => cookie.startsWith(`${LOCALE_COOKIE}=`));
  if (cookies.length > 0) request.headers.set("cookie", cookies.join("; "));
  else request.headers.delete("cookie");
}

function assumeEnglishUnlessStated(request: Request): void {
  if (!request.headers.has("accept-language")) {
    request.headers.set("accept-language", DEFAULT_LOCALE);
  }
}

function keepOnlyLanguageHints(request: Request): void {
  keepOnlyLocaleCookie(request);
  assumeEnglishUnlessStated(request);
}

function forgetVisitor(request: Request): void {
  request.headers.delete("cookie");
  request.headers.set("accept-language", DEFAULT_LOCALE);
}

function followedLinkWithinSite(request: Request): boolean {
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

function cacheOnlyForThisVisitor(headers: Headers): void {
  headers.set("cache-control", "private, no-cache");
  headers.append("vary", "accept-language, cookie, sec-fetch-site");
}

async function serveUnprefixed(request: Request, opts: FetchOptions): Promise<Response> {
  keepOnlyLanguageHints(request);
  if (followedLinkWithinSite(request)) askForEnglish(request);
  const response = await handler.fetch(request, opts);
  if (response.headers.has("cache-control")) return response;
  return withHeaders(response, cacheOnlyForThisVisitor);
}

function serverFor(pathname: string) {
  if (isSameForEveryVisitor(pathname)) return serveShared;
  if (pathLocale(pathname)) return servePrefixed;
  return serveUnprefixed;
}

export default createServerEntry({
  async fetch(request, opts) {
    const early = requestRedirect(request) ?? unknownServerFunction(request);
    if (early) return early;
    const response = await serverFor(new URL(request.url).pathname)(request, opts);
    return withHeadScript(response, PAINTER);
  }
});
