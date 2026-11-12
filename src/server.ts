import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { DEFAULT_LOCALE } from "#app/i18n/locales";
import { requestRedirect } from "#app/server/redirects";
import { startServices } from "#app/server/services";

startServices();

const isSocialCard = (request: Request) => new URL(request.url).pathname.startsWith("/og/");

function forgetVisitorLanguage(request: Request): void {
  request.headers.delete("cookie");
  request.headers.set("accept-language", DEFAULT_LOCALE);
}

function askForDefaultLanguageWhenNoneStated(request: Request): void {
  if (!request.headers.has("accept-language")) {
    request.headers.set("accept-language", DEFAULT_LOCALE);
  }
}

export default createServerEntry({
  fetch(request, opts) {
    const redirect = requestRedirect(request);
    if (redirect) return redirect;
    if (isSocialCard(request)) forgetVisitorLanguage(request);
    else askForDefaultLanguageWhenNoneStated(request);
    return handler.fetch(request, opts);
  },
});
