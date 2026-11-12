import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { requestRedirect } from "#app/server/redirects";
import { startServices } from "#app/server/services";
import gtConfig from "../gt.config.json";

startServices();

function askForDefaultLanguageUnlessStated(request: Request): Request {
  if (!request.headers.has("accept-language")) {
    request.headers.set("accept-language", gtConfig.defaultLocale);
  }
  return request;
}

export default createServerEntry({
  fetch(request, opts) {
    return (
      requestRedirect(request) ?? handler.fetch(askForDefaultLanguageUnlessStated(request), opts)
    );
  },
});
