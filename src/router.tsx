import { createRouter } from "@tanstack/react-router";
import { ErrorPage } from "#app/components/site/ErrorPage";
import { NotFound } from "#app/components/site/NotFound";
import { routeTree } from "#app/routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    // only in the browser: the router would also inline a restore into the page, where it renders
    // before the footer, so it cut short a position near the bottom; a reload is the browser's
    scrollRestoration: () => typeof document !== "undefined",
    // restoring and resetting the scroll lands at once; hash links still scroll smoothly
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
