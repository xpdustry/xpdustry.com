import { createRouter } from "@tanstack/react-router";
import { ErrorPage } from "#app/components/site/ErrorPage";
import { NotFound } from "#app/components/site/NotFound";
import { routeTree } from "#app/routeTree.gen";

const restoreScrollOnlyInBrowser = () => typeof document !== "undefined";

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: restoreScrollOnlyInBrowser,
    scrollRestorationBehavior: "instant",
    defaultPreload: "intent",
    defaultErrorComponent: ErrorPage,
    defaultNotFoundComponent: NotFound,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
