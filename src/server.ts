import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { withoutLocale } from "#app/i18n/localePath";
import { DEFAULT_LOCALE } from "#app/i18n/locales";
import { requestRedirect } from "#app/server/redirects";
import { startServices } from "#app/server/services";

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

function withHeaders(response: Response, edit: (headers: Headers) => void): Response {
  const headers = new Headers(response.headers);
  edit(headers);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default createServerEntry({
  async fetch(request, opts) {
    const redirect = requestRedirect(request);
    if (redirect) return redirect;

    const { pathname } = new URL(request.url);
    if (isShared(pathname)) {
      forgetVisitor(request);
      const response = await handler.fetch(request, opts);
      return withHeaders(response, (headers) => headers.delete("set-cookie"));
    }

    keepOnlyLocaleCookie(request);
    askForDefaultLanguageWhenNoneStated(request);
    return handler.fetch(request, opts);
  },
});
