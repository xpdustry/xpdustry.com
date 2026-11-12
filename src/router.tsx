import { createRouter } from "@tanstack/react-router";
import { getLocale, initializeGT } from "gt-tanstack-start";
import { followAddressLocale } from "#app/i18n/addressLocale";
import loadTranslations from "#app/i18n/loadTranslations";
import { withLocale, withoutLocale } from "#app/i18n/localePath";
import { routeTree } from "#app/routeTree.gen";
import { ErrorPage } from "#app/shell/ErrorPage";
import { NotFound } from "#app/shell/NotFound";
import gtConfig from "../gt.config.json";

initializeGT({ ...gtConfig, loadTranslations });
followAddressLocale();

const restoreScrollOnlyInBrowser = () => typeof document !== "undefined";

export function getRouter() {
  return createRouter({
    routeTree,
    rewrite: {
      input: ({ url }) => {
        url.pathname = withoutLocale(url.pathname);
        return url;
      },
      output: ({ url }) => {
        url.pathname = withLocale(url.pathname, getLocale());
        return url;
      }
    },
    scrollRestoration: restoreScrollOnlyInBrowser,
    scrollRestorationBehavior: "instant",
    defaultPreload: "intent",
    defaultErrorComponent: ErrorPage,
    defaultNotFoundComponent: NotFound
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
