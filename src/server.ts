import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { requestRedirect } from "#app/server/redirects";
import { startServices } from "#app/server/services";

startServices();

export default createServerEntry({
  fetch(request, opts) {
    return requestRedirect(request) ?? handler.fetch(request, opts);
  },
});
