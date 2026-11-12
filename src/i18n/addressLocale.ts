import { createIsomorphicFn } from "@tanstack/react-start";
import { createOrUpdateBrowserConditionStore } from "gt-react";
import { pathLocale } from "./localePath.ts";
import { DEFAULT_LOCALE } from "./locales.ts";

const addressLocale = () => pathLocale(window.location.pathname) ?? DEFAULT_LOCALE;

/**
 * Makes the browser take its locale from the address alone. The library's browser store reads the
 * locale cookie, then the browser's own languages, so with cookies blocked a French page reran its
 * loaders, titles and links in English once hydrated. Changing language is a full page load to the
 * other prefix, so the address always names the page's language.
 */
export const followAddressLocale = createIsomorphicFn().client(() => {
  const store = createOrUpdateBrowserConditionStore({ locale: addressLocale(), enableI18n: true });
  store.getLocale = addressLocale;
  store.getEnableI18n = () => true;
});
