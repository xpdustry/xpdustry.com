import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { requestRedirect } from "#app/server/redirects";
import { startServices } from "#app/server/services";

// The pollers live as long as the server does; their timers are unreferenced, so they never keep
// the process alive on shutdown.
startServices();

export default createServerEntry({
  fetch(request, opts) {
    return requestRedirect(request) ?? handler.fetch(request, opts);
  },
});
